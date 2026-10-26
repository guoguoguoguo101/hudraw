import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {MOUNTAIN_LEVELS} from '../src/gameplay/mountain-run';
import {BRUSH_SKILLS} from '../src/gameplay/brush-upgrades';
const step=(g:Game)=>{const u=g.hualing.upgrades;u.offer(true);if(u.panel==='upgrade'){assert.equal(u.choices.length,3,'campaign presents three actual brush choices');u.choose(u.choices.find(k=>u.levels[k]>0)??u.choices[0]);return;}if(g.campaign.supportPanel){g.campaign.chooseSupport(g,g.campaign.supportChoices[0]);return;}g.advance(1/60);};
assert.equal(MOUNTAIN_LEVELS.length,40);assert.equal(new Set(MOUNTAIN_LEVELS.map(l=>l.title)).size,40);
for(const l of MOUNTAIN_LEVELS){const g=new Game();assert.equal(g.startMountainLevel(l.id),true);assert.equal(g.ink.unlimited,false);assert.equal(g.hualing.journey.autoEvents,false,'campaign must not restore the old scene-tracing prompts');assert.equal(g.hualing.journey.chapter,l.chapter);g.invulnerable=1e6;let sawElite=false,sawPair=false;let cap=0;
 for(let i=0;i<30000&&g.state!=='win';i++){
  step(g);cap=Math.max(cap,g.enemies.filter(e=>!e.elite&&!e.chapterBoss).length);if(g.campaign.room===1&&g.enemies.length>=2)sawPair=true;
  if(g.enemies.some(e=>e.chapterBoss)){assert.equal(l.boss,true);assert.equal(g.campaign.room,4);assert.equal(g.hualing.upgrades.picks,8);break;}
  for(const e of [...g.enemies]){if(e.elite)sawElite=true;g.damage(e,100000);}
 }
 assert.ok(sawElite,`${l.id} missing elite`);assert.ok(sawPair,`${l.id} missing pair`);assert.ok(cap<=l.modifier.cap);assert.equal(g.hualing.upgrades.picks,8);assert.equal(BRUSH_SKILLS.filter(k=>g.hualing.upgrades.levels[k]===4).length,2);if(!l.boss){assert.equal(g.state,'win',`level ${l.id} did not finish`);assert.ok(g.campaign.completed.has(l.id));}
}
const g=new Game();g.startMountainLevel(0);step(g);assert.equal(g.hualing.upgrades.panel,null);step(g);assert.equal(g.enemies.length,1);for(let i=0;i<60;i++)step(g);assert.equal(g.enemies.length,1,'first three should be spaced singles');assert.equal(g.campaign.room,0,'live enemies cannot advance room');
g.invulnerable=0;g.hurt(10);assert.equal(g.life,90);g.ink.begin(1);g.ink.extend(720);assert.equal(g.ink.currentInk,86.35);g.ink.cancel();assert.equal(g.ink.currentInk,86.35,'cancel cannot refund delivered damage');g.ink.update(1.35,true);assert.ok(g.ink.currentInk>98);g.ink.setAmount(0);assert.equal(g.ink.begin(2),false);g.ink.update(2,true);assert.ok(g.ink.canStart);
g.campaign.supportPanel=true;const before=g.time;g.advance(1);assert.equal(g.time,before);assert.equal(g.lastResourceDt,0);g.campaign.supportPanel=false;g.start(false,true,false,false,true);assert.equal(g.campaign.levelId,null);assert.equal(g.ink.unlimited,true);assert.equal(g.ink.costScale,1);
console.log('PASS mountain campaign: 40 independent levels, eight picks/two Lv4, chapter enemies/elites/bosses, singles/pairs/caps, clear gates, life/ink/regen/cancel and modal isolation');
