// Local lobby attendant only. All in-match decisions belong to the existing Go CPU worker.
import { chromium, request } from '@playwright/test';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';

const baseURL = process.argv[2] ?? 'http://127.0.0.1:8080';
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('CPU test room is local-only.');
const directory = new URL('../../.local/', import.meta.url);
const credentialsFile = new URL('cpu-room.json', directory);
await mkdir(directory, {recursive:true, mode:0o700});
let credentials;
try { credentials = JSON.parse(await readFile(credentialsFile, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  credentials = {email:`cpu-${randomUUID()}@example.test`,password:randomBytes(24).toString('base64url')};
  await writeFile(credentialsFile,JSON.stringify(credentials),{mode:0o600,flag:'wx'});
}
await chmod(credentialsFile,0o600);
let stopping=false,browser=null,api=null,storage=null,roomID=credentials.roomID;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function stop(){stopping=true;await browser?.close().catch(()=>{});await api?.dispose().catch(()=>{});}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
async function saveRoom(id){
  roomID=id;credentials.roomID=id;
  await writeFile(credentialsFile,JSON.stringify(credentials),{mode:0o600});
}
async function lobby(){
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext(storage?{storageState:storage}:{});
  const page=await context.newPage();
  page.on('websocket',ws=>ws.on('framereceived',frame=>{
    const message=JSON.parse(String(frame.payload));
    if(message.type==='room.snapshot')roomID=message.payload.room.id;
  }));
  await page.goto(baseURL);
  await page.waitForFunction(()=>!document.querySelector('#auth')?.hidden || !document.querySelector('#lobby')?.hidden || !document.querySelector('#play')?.hidden);
  // Let /auth/me finish before submitting the login form.
  const auth=await context.request.get(`${baseURL}/v1/auth/me`);
  if(auth.status()===401){
    await page.locator('[name=email]').fill(credentials.email);
    await page.locator('[name=password]').fill(credentials.password);
    const responsePromise=page.waitForResponse(r=>r.url().endsWith('/v1/auth/login'));
    await page.locator('#auth-submit').click();
    const login=await responsePromise;
    if(login.status()===401){
      await page.locator('#auth-toggle').click();
      await page.locator('[name=displayName]').fill('CPU Sasuke');
      await page.locator('#auth-submit').click();
    }else if(!login.ok())throw new Error(`Bot login failed (${login.status()})`);
  }
  await page.waitForFunction(()=>document.querySelector('#connection')?.textContent.includes('TERHUBUNG'));
  // The connection's initial snapshot restores existing room membership.
  await page.waitForTimeout(500);
  if(await page.locator('#lobby').isVisible()){
    const responsePromise=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/v1/rooms');
    await page.locator('#create-room [name=name]').fill('test');
    await page.locator('#create-room [name=capacity]').selectOption('2');
    await page.locator('#create-room button').click();
    const response=await responsePromise;
    if(!response.ok())throw new Error(`Bot room creation failed (${response.status()})`);
    const body=await response.json();await saveRoom((body.data??body).room.id);
  }
  await page.locator('#play').waitFor({state:'visible'});
  if(roomID)await saveRoom(roomID);
  console.log('Room test tersedia: 1 pemain + CPU Sasuke. Menunggu pemain menekan Saya siap.');
  while(!stopping){
    if(await page.locator('#return-room').isVisible())await page.locator('#return-room').click();
    if(await page.locator('#waiting').isHidden()){
      storage=await context.storageState();
      // Closing the real WebSocket invokes the normal fenced CPU takeover path.
      await browser.close();browser=null;
      await api?.dispose();api=await request.newContext({storageState:storage});
      console.log('Pertandingan dimulai; CPU Go mengambil alih Sasuke.');
      return;
    }
    const ready=page.locator('#ready');
    if(await ready.isEnabled() && await ready.textContent()==='Saya siap'){
      await page.locator('[data-character="1"]').click();
      await ready.click();
    }
    const start=page.locator('#start');
    if(await start.isVisible()&&await start.isEnabled())await start.click();
    await sleep(350);
  }
}
try{
  while(!stopping){
    try{
      if(api&&roomID){
        const response=await api.get(`${baseURL}/v1/rooms/${roomID}`);
        if(response.ok()){
          const body=await response.json(),room=body.data??body;
          if(room.status==='playing'){await sleep(2000);continue;}
        }
        await api.dispose();api=null;
      }
      await lobby();
    }catch(error){
      if(stopping)break;
      console.error(`CPU room belum siap (${error.name}); mencoba kembali dalam 3 detik.`);
      await browser?.close().catch(()=>{});browser=null;
      await sleep(3000);
    }
  }
}finally{await stop();}
