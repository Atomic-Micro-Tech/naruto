import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from './story1-economy.mjs';
const rules=JSON.parse(fs.readFileSync(new URL('./full-rules.json',import.meta.url)));
const fresh=()=>({modeFlags:0,players:[{chakra:-250},{chakra:1500}],tiles:Array.from({length:4},(_,i)=>({typeCode:5,owner:i===3?1:0,level:i+1,hp:2,effect:5,repairCounter:1,neighbors:[255,255,255,255],upgradeBase:100,unknownValues:[100,50],rents:[100,200,300,400,500]}))});
test('first Naruto route stage is scenario0 with ordinary debt rules',()=>{
 const id=rules.campaigns[0].entries[0].scenarioId,s=rules.scenarios.find(s=>s.id===id);
 assert.deepEqual([id,s.mapId,s.modeFlags,s.initialChakra,s.targetChakra,s.baseBonus,s.initialSkillPoints,s.unknownSetting17],[0,0,0,1500,3000,400,3,4]);
 assert.deepEqual(s.players.map(p=>p.characterId),[12,10]);
});
test('sale value derives from both original data fields and signed16 queued result',()=>{
 const s=fresh();assert.deepEqual(E.forcedSaleCandidates(s,0),[{tile:0,value:50},{tile:1,value:150},{tile:2,value:250}]);
 assert.equal(E.saleValue({level:2,saleBase:32760,saleIncrement:20}),-32756);
 assert.throws(()=>E.saleValue({level:2}),/required/);
});
test('forced sale is toll projection branch, not global bankruptcy or zero wallet',()=>{
 const s=fresh();assert.equal(E.forcedSaleRequired(s,0,{projectedChakra:-1}),true);
 assert.equal(E.forcedSaleRequired(s,0,{projectedChakra:0}),false);
 s.modeFlags=1;assert.equal(E.forcedSaleRequired(s,0,{projectedChakra:-1}),false);
 s.modeFlags=0;s.tiles.forEach(t=>t.owner=1);assert.equal(E.forcedSaleRequired(s,0,{projectedChakra:-1}),false);
 assert.throws(()=>E.forcedSaleRequired(s,0),/projected/);
});
test('CPU sale preserves chain over low rent and first tie',()=>{
 const s=fresh();s.tiles[0].neighbors[0]=1;
 assert.deepEqual(E.cpuForcedSale(s,0),{tile:2,score:300,value:250});
 s.tiles[0].neighbors[0]=255;s.tiles[1].level=1;
 assert.equal(E.cpuForcedSale(s,0).tile,0);
});
test('sale resets packed word but keeps repair counter and loops until debt cleared',()=>{
 const s=fresh();let r=E.commitBarrierSale(s,0,0);
 assert.equal(r.players[0].chakra,-200);assert.equal(r.needsAnotherSale,true);
 assert.deepEqual([r.tiles[0].typeCode,r.tiles[0].owner,r.tiles[0].level,r.tiles[0].hp,r.tiles[0].effect,r.tiles[0].repairCounter],[4,15,1,2,0,1]);
 r=E.commitBarrierSale(r,0,2);assert.equal(r.players[0].chakra,50);assert.equal(r.needsAnotherSale,false);
 assert.equal(s.tiles[0].typeCode,5);
});
test('last asset may leave debt without elimination',()=>{
 const s=fresh();s.players[0].chakra=-500;s.tiles[1].owner=1;s.tiles[2].owner=1;
 const r=E.commitBarrierSale(s,0,0);assert.equal(r.players[0].chakra,-450);assert.equal(r.needsAnotherSale,false);
 assert.equal(r.players[0].actorStatus,undefined);
});
test('remote upgrades add one level and one HP at base price',()=>{
 const s=fresh();s.players[0].chakra=100;
 assert.deepEqual(E.remoteUpgradeChoices(s,0).map(c=>[c.level,c.cost,c.disabled]),[[2,100,false],[3,100,false],[4,100,false]]);
 const r=E.commitRemoteUpgrade(s,0,2);assert.equal(r.tiles[2].level,4);assert.equal(r.tiles[2].hp,3);assert.equal(r.players[0].chakra,0);
 assert.throws(()=>E.commitRemoteUpgrade(r,0,1),/Unavailable/);
});
test('queue initializes then counts units before tens/hundreds',()=>{
 let q=E.startChakraPayment(200,-123),wallets=[];
 for(let i=0;i<7;i++){q=E.tickChakraPayment(q);wallets.push(q.chakra);}
 assert.deepEqual(wallets,[200,199,198,197,187,177,77]);assert.equal(q.done,true);assert.equal(q.crossedIntoDebt,false);
 assert.deepEqual(E.tickChakraPayment(q),q);
});
test('queue caps and records nonnegative-to-negative transition only upon completion',()=>{
 let q=E.startChakraPayment(50,-100);q=E.tickChakraPayment(q);q=E.tickChakraPayment(q);
 assert.equal(q.chakra,-50);assert.equal(q.crossedIntoDebt,true);
 q=E.startChakraPayment(99998,123);q=E.tickChakraPayment(q);q=E.tickChakraPayment(q);
 assert.equal(q.chakra,99999);assert.equal(q.done,true);
 assert.throws(()=>E.startChakraPayment(0,32768),/overflows/);
});
