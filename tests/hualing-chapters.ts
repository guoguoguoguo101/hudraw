import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {chapterMonsters} from '../src/gameplay/paper-monsters';
import {HUALING_CHAPTERS,type HualingChapter} from '../src/gameplay/hualing-chapters';
import {EnemyAI} from '../src/gameplay/ai';

const g=new Game();g.start(false,true,false,false,true);
for(const chapter of Object.keys(HUALING_CHAPTERS) as HualingChapter[]){
 g.changeHualingChapter(chapter);const m=g.hualing;
 assert.equal(m.journey.chapter,chapter);assert.equal(g.enemies.length,4);
 const pool=chapterMonsters(chapter);assert.ok(g.enemies.every(e=>pool.some(p=>p.id===e.look)));
 for(const [i,stage] of (['sunset','wind','night'] as const).entries()){
  m.previewLandscape(stage);assert.equal(m.journey.sceneName,HUALING_CHAPTERS[chapter].scenes[stage]);assert.equal(m.sceneSeal.mode,HUALING_CHAPTERS[chapter].events[i]);
 }
 m.journey.reset();m.advance(.1,g.enemies,()=>{});assert.equal(m.journey.chapter,chapter);
 for(const spec of pool){
  g.enemies=[];const e=g.spawn(spec.kind,{x:340,y:470},spec.id)!;e.ai='Approach';
  const before={x:e.x,y:e.y};for(let i=0;i<30;i++)EnemyAI.update(g,e,1/60);
  assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));assert.ok(Math.hypot(e.x-before.x,e.y-before.y)>0);
  e.x=e.prevX=360;e.y=e.prevY=550;const hp=e.hp;g.strokeHualing({x:300,y:550},{x:420,y:550});assert.ok(e.hp<hp);
 }
}
// Switching clears held cards, summoned effects, partial gestures, upgrades and enemies.
g.changeHualingChapter('sea');const old=g.enemies.map(e=>e.id);g.hualing.select('dragon');g.hualing.upgrades.setLevel('wide',4);g.hualing.petals.activate();g.hualing.sceneSeal.phase='stored';
g.changeHualingChapter('palace');assert.equal(g.hualing.selected,null);assert.equal(g.hualing.upgrades.levels.wide,0);assert.equal(g.hualing.petals.active,false);assert.ok(g.hualing.scenes.every(s=>s.phase==='repairing'));assert.ok(g.enemies.every(e=>!old.includes(e.id)));
g.start(false,true,false,false,true);assert.equal(g.hualing.journey.chapter,'palace');assert.equal(g.hualing.journey.time,0);
g.menu();g.start();g.changeHualingChapter('sea');assert.equal(g.hualingPractice,false);assert.equal(g.enemies.length,0);
g.start(false,true,false,false,true);g.seedHualingEnemies();
const b=g.hualing.bounds;
function side(p:{x:number;y:number}){return p.y===b.top+55?'top':p.x===b.right-55?'right':p.y===b.bottom-65?'bottom':p.x===b.left+55?'left':'none';}
assert.deepEqual(g.enemies.map(side),['top','right','bottom','left']);
assert.ok(g.enemies.every(e=>Math.hypot(e.x-360,e.y-665)>190));
const entries:string[]=[];
for(let i=0;i<8;i++){g.enemies=[];g.director.update(g,1.51);assert.equal(g.enemies.length,1);entries.push(side(g.enemies[0]));}
assert.deepEqual(entries,['top','right','bottom','left','top','right','bottom','left']);
for(let i=0;i<20;i++)g.director.update(g,1.51);assert.equal(g.enemies.length,6);

const chapters=Object.keys(HUALING_CHAPTERS) as HualingChapter[];
for(const [i,chapter] of chapters.entries()){g.changeHualingChapter(chapter);g.hualing.upgrades.setLevel('wide',i+1);g.hualing.upgrades.setLevel('spray',4-i);}
for(const [i,chapter] of chapters.entries()){g.changeHualingChapter(chapter);assert.equal(g.hualing.upgrades.levels.wide,i+1);assert.equal(g.hualing.upgrades.levels.spray,4-i);}
g.changeHualingChapter('sea');g.hualing.upgrades.startGrowth();g.hualing.upgrades.choose('wide');g.hualing.upgrades.kill();g.hualing.upgrades.kill();
g.changeHualingChapter('snow');g.hualing.upgrades.startGrowth();g.hualing.upgrades.choose('trail');g.hualing.upgrades.kill();
g.changeHualingChapter('sea');assert.equal(g.hualing.upgrades.growth,true);assert.equal(g.hualing.upgrades.kills,2);assert.equal(g.hualing.upgrades.picks,1);assert.equal(g.hualing.upgrades.levels.wide,1);assert.equal(g.hualing.upgrades.levels.trail,0);
g.changeHualingChapter('snow');assert.equal(g.hualing.upgrades.kills,1);assert.equal(g.hualing.upgrades.levels.trail,1);assert.equal(g.hualing.upgrades.trail.segments.length,0);assert.equal(g.hualing.upgrades.panel,null);
g.start(false,true,false,false,true);g.changeHualingChapter('sea');assert.equal(g.hualing.upgrades.growth,false);assert.equal(g.hualing.upgrades.levels.wide,0);
console.log('PASS chapter scene mapping, themed roster and movement, actual damage, switch cleanup, restart, four-side entries, density cap and independent per-chapter custom/growth progress');
