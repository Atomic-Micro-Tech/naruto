import { test, expect } from '@playwright/test';
import { execute } from '../../server/internal/game/source/online.js';

test('CPU waits for roulette, walks each snapshot, then selects and reveals a concealed chance card', async ({ page }) => {
  const errors = [], commands = [], cardRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/image\/cards\/card_\d+\.png/.test(request.url())) cardRequests.push(request.url());
  });
  const user = { id:'u0', displayName:'Naruto' };
  const room = { id:'r0', name:'CPU presentation', visibility:'public', hostUserId:'u0',
    status:'playing', activeMatchId:'m0', stateVersion:1,
    settings:{arenaId:'arena1',capacity:2,targetChakra:3000,voiceEnabled:false},
    members:[0,1].map(seat=>({userId:`u${seat}`,displayName:['Naruto','Sasuke'][seat],characterId:seat,
      seat,ready:true,connectionStatus:'connected'})) };
  let engine = execute({ seed:12345, roster:[{characterId:0,name:'Naruto'},{characterId:1,name:'Sasuke'}],
    target:3000,tick:0,choiceId:'initial' });
  engine.engine.turn = 1;
  engine.engine.players[0].pos = 20;
  engine = execute({ mode:'command',state:engine.engine,seat:1,option:'roll',tick:0,choiceId:'cpu-wheel' });
  let version = 1, socket;
  const snapshot = value => ({ ...structuredClone(value),id:'m0',roomId:'r0',arenaId:'arena1',
    status:'playing',stateVersion:version,eventSequence:version,serverTick:0,
    self:engine.privateBySeat[0],allowedActions:[],
    players:value.players.map((p,i)=>({...p,userId:`u${i}`,displayName:['Naruto','Sasuke'][i],
      controller:{seat:i,userId:`u${i}`,participantKind:'human',controllerKind:i?'cpu':'human',
        controlEpoch:1,connectionStatus:'connected'}})) });
  let current = snapshot(engine.public);
  await page.route('**/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = path==='/v1/auth/me'?{user,csrfToken:'synthetic'}:
      path==='/v1/arenas'?{items:[{id:'arena1',assetManifestHash:'test'}]}:
      path==='/v1/ws-ticket'?{path:'/v1/ws',ticket:'test',protocol:'naruto.v1'}:
      path==='/v1/rooms'||path.endsWith('/messages')?{items:[]}:
      path.startsWith('/v1/matches/')?current:room;
    await route.fulfill({json:{data}});
  });
  await page.routeWebSocket('**/v1/ws?*', ws => {
    socket=ws;
    ws.onMessage(raw=>commands.push(JSON.parse(raw)));
    ws.send(JSON.stringify({type:'connection.ready',payload:{}}));
    ws.send(JSON.stringify({type:'room.snapshot',payload:{room}}));
  });
  const send = value => {
    version++;
    current=snapshot(value);
    socket.send(JSON.stringify({type:'match.snapshot',payload:current}));
  };
  await page.goto('/');
  await expect(page.locator('#play')).toHaveAttribute('data-phase','roulette');
  await expect(page.locator('#board canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  const stopped=structuredClone(engine.public);
  stopped.roulette=null;
  stopped.presentation={...stopped.presentation,phase:'move',remaining:6,lastRoll:6};
  send(stopped);
  for(let position=1;position<=5;position++) {
    const step=structuredClone(stopped);
    step.players[1].position=position;
    step.presentation.remaining=6-position;
    if(position===5) {
      step.presentation.phase='chance';
      step.presentation.chance={choiceId:'cpu-cards',actorSeat:1,faceUp:false,cards:[0,1,2].map(slot=>({slot}))};
    }
    send(step);
  }
  const selected=structuredClone(stopped);
  selected.players[1].position=5;
  selected.presentation.remaining=1;
  selected.presentation.chanceResult={actorSeat:1,slot:2,cardId:20};
  send(selected);
  const finished=structuredClone(stopped);
  finished.players[1].position=6;
  finished.presentation.phase='end';
  finished.presentation.remaining=0;
  send(finished);
  await expect(page.locator('#play')).toHaveAttribute('data-phase','move');
  await page.waitForTimeout(1200);
  await expect(page.locator('#play')).toHaveAttribute('data-phase','move');
  await expect(page.locator('#play')).toHaveClass(/presenting/);
  await expect(page.locator('.chance-cards')).toHaveCount(0);
  await expect(page.locator('.chance-cards[data-stage="choosing"]')).toBeVisible({timeout:8000});
  const first=await page.locator('.chance-cards [aria-pressed="true"]').getAttribute('data-card-choice');
  await expect.poll(()=>page.locator('.chance-cards [aria-pressed="true"]').getAttribute('data-card-choice')).not.toBe(first);
  await expect(page.locator('.chance-cards button:disabled')).toHaveCount(3);
  expect(cardRequests).toEqual([]);
  await page.locator('.board-frame').screenshot({path:'test-results/cpu-chance-choosing.png'});
  await expect(page.locator('.chance-cards[data-stage="revealed"]')).toBeVisible();
  await expect(page.locator('[data-card-choice="2"] img')).toHaveAttribute('src',/card_20.png$/);
  for(const slot of [0,1]) await expect(page.locator(`[data-card-choice="${slot}"] img`)).toHaveAttribute('src',/^data:image\/png/);
  await page.locator('.board-frame').screenshot({path:'test-results/cpu-chance-revealed.png'});
  await expect(page.locator('#play')).toHaveAttribute('data-phase','end');
  expect(commands.filter(c=>c.type==='match.command')).toEqual([]);
  expect(cardRequests.every(url=>url.endsWith('/card_20.png'))).toBe(true);
  expect(errors).toEqual([]);
});
