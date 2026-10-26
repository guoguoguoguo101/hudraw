import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {MOUNTAIN_LEVELS,MOUNTAIN_BALANCE} from '../src/gameplay/mountain-run';
import {BRUSH_SKILLS} from '../src/gameplay/brush-upgrades';
const step=(g:Game)=>{const u=g.hualing.upgrades;u.offer(true);if(u.panel==='upgrade'){assert.equal(u.choices.length,3);u.choose(u.choices.find(k=>u.levels[k]>0)??u.choices[0]);return;}if(g.campaign.supportPanel){g.campaign.chooseSupport(g,g.campaign.supportChoices[0]);return;}g.advance(1/60);};
assert.equal(MOUNTAIN_LEVELS.length,40);
for(const l of MOUNTAIN_LEVELS){
 const g=new Game();g.startMountainLevel(l.id);assert.equal(g.hualing.upgrades.pending,0);assert.equal(g.hualing.upgrades.panel,null);assert.ok(BRUSH_SKILLS.every(k=>g.hualing.upgrades.levels[k]===0));
 assert.equal(g.ink.unlimited,false);assert.equal(g.hualing.journey.autoEvents,false);g.invulnerable=1e6;let sawElite=false,sawBoss=false;let cap=0;
 for(let i=0;i<30000&&g.state!=='win';i++){
  step(g);cap=Math.max(cap,g.enemies.filter(e=>!e.elite&&!e.chapterBoss).length);
  if(g.enemies.some(e=>e.chapterBoss)){sawBoss=true;assert.ok(l.boss);assert.equal(g.campaign.room,4);break;}
  for(const e of [...g.enemies]){if(e.elite)sawElite=true;if(e.chapterBoss){sawBoss=true;assert.ok(l.boss);assert.equal(g.campaign.room,4);}g.damage(e,100000);}
 }
 assert.ok(sawElite);assert.equal(sawBoss,l.boss);assert.ok(cap<=l.modifier.cap+3);if(!l.boss){assert.equal(g.state,'win',`level ${l.id} did not clear`);assert.ok(g.campaign.completed.has(l.id));}
 assert.ok(g.hualing.upgrades.picks>=3&&g.hualing.upgrades.picks<=MOUNTAIN_BALANCE.picks);assert.ok(BRUSH_SKILLS.filter(k=>g.hualing.upgrades.levels[k]===4).length<=1,'no guaranteed two-max-level loadout');
}
// Real kills, not room transitions, fund progression. Dead targets cannot award twice.
const g=new Game();g.startMountainLevel(0);g.invulnerable=1e6;
for(let i=0;i<7;i++){const e=g.spawn('ink',{x:300,y:550})!;g.damage(e,1e5);g.damage(e,1e5);}
assert.equal(g.campaign.xp,7);g.advance(.1);assert.equal(g.hualing.upgrades.pending,0);assert.equal(g.hualing.upgrades.panel,null);
g.damage(g.spawn('ink',{x:300,y:550})!,1e5);assert.equal(g.campaign.xp,8);for(let i=0;i<60;i++)g.advance(1/60);assert.equal(g.hualing.upgrades.panel,'upgrade');assert.equal(g.hualing.upgrades.pending,1);assert.equal(g.campaign.xp,0);
g.hualing.upgrades.choose(g.hualing.upgrades.choices[0]);assert.equal(g.campaign.xpNeeded,18);assert.equal(g.hualing.upgrades.picks,1);
// A continuous train uses one look and the same curved entry, with staggered bodies.
const train=new Game();train.startMountainLevel(0);train.invulnerable=1e6;for(let i=0;i<120;i++)train.advance(1/60);
assert.equal(train.enemies.length,4);assert.equal(new Set(train.enemies.map(e=>e.look)).size,1);assert.ok(train.enemies[0].y>train.enemies[1].y,'earlier member leads the train');assert.ok(Math.hypot(train.enemies[0].x-train.enemies[1].x,train.enemies[0].y-train.enemies[1].y)>15);
// One normal room mixes every formation and empty fields do not sit on a long timer.
const mixed=new Game();mixed.startMountainLevel(0);mixed.invulnerable=1e6;const formations=new Set<string>();let wave=0;
for(let i=0;i<3000&&mixed.campaign.room===0;i++){
 step(mixed);if(mixed.campaign.waveSerial!==wave){wave=mixed.campaign.waveSerial;formations.add(mixed.campaign.formation);assert.ok(mixed.campaign.entryWarnings.length>0);}
 for(const e of [...mixed.enemies])mixed.damage(e,1e5);
}
assert.deepEqual([...formations].sort(),['chain','fan','pincer','ring']);assert.equal(mixed.campaign.room,1);assert.ok(mixed.campaign.age<20,'an instantly cleared arena should be replenished without three-second waits');
const pressure=new Game();pressure.startMountainLevel(0);pressure.invulnerable=1e6;for(let i=0;i<1800;i++)pressure.advance(1/60);assert.ok(pressure.enemies.length<=pressure.campaign.level!.modifier.cap+3);
// Ink has a meaningful cost and slower natural recovery; pickups work at zero ink.
const ink=new Game();ink.startMountainLevel(0);ink.ink.begin(1);ink.ink.extend(720);assert.ok(Math.abs(ink.ink.currentInk-82.15)<.001);ink.ink.cancel();const paid=ink.ink.currentInk;ink.ink.update(1.35,true);assert.ok(ink.ink.currentInk>paid&&ink.ink.currentInk<90);
ink.ink.setAmount(0);assert.equal(ink.ink.begin(2),false);ink.advance(.1);assert.equal(ink.campaign.pickups.length,1,'empty-ink emergency supply prevents a dead end');const p=ink.campaign.pickups[0];assert.ok(ink.campaign.collectInk(ink,p.id));assert.equal(ink.ink.currentInk,28);assert.equal(ink.campaign.collectInk(ink,p.id),false);assert.equal(ink.campaign.lastInkAmount,28);
ink.ink.setAmount(0);ink.campaign.dropInk(ink,330,550);ink.campaign.collectAlong(ink,{x:280,y:550},{x:390,y:550});assert.equal(ink.ink.currentInk,28);
const drops=new Game();drops.startMountainLevel(0);for(let i=0;i<6;i++)drops.damage(drops.spawn('ink',{x:350,y:570})!,1e5);assert.equal(drops.campaign.pickups.length,1,'six small monsters guarantee ink');
ink.campaign.supportPanel=true;const before=ink.time;ink.advance(1);assert.equal(ink.time,before);assert.equal(ink.lastResourceDt,0);ink.campaign.supportPanel=false;ink.start(false,true,false,false,true);assert.equal(ink.campaign.levelId,null);assert.equal(ink.ink.unlimited,true);assert.equal(ink.ink.costScale,1);
console.log('PASS campaign: 40 level flows through normal clears / boss entry, no opening/room gifts, kill XP and rising costs, at most five picks/one Lv4, four alternating formations, quick empty-arena refill, pressure caps, guaranteed/emergency ink supplies, zero-ink tap/swipe collection and mode isolation');
