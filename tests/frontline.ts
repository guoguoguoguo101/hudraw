import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {WORLD} from '../src/core/types';
import {HUALING_CHAPTERS,type HualingChapter} from '../src/gameplay/hualing-chapters';
import {chapterElites} from '../src/gameplay/hualing-elites';
import {EnemyAI} from '../src/gameplay/ai';
{const g=new Game();g.startFrontline();assert.equal(g.hualing.upgrades.panel,'upgrade');assert.ok(g.hualing.upgrades.growth);g.hualing.upgrades.choose('spray');assert.equal(g.hualing.upgrades.levels.spray,1);g.changeHualingChapter('sea');assert.equal(g.hualing.upgrades.panel,'upgrade');g.hualing.upgrades.choose('wide');g.hualing.upgrades.setLevel('wide',3);g.changeHualingChapter('valley');assert.equal(g.hualing.upgrades.levels.spray,1);g.changeHualingChapter('sea');assert.equal(g.hualing.upgrades.levels.wide,3);}
const step=(g:Game,t:number)=>{for(let i=0;i<Math.ceil(t*60);i++)g.advance(1/60);};
const setup=()=>{const g=new Game();g.startFrontline();g.hualing.upgrades.panel=null;g.hualing.upgrades.pending=0;g.director.disabled=true;g.hualing.journey.autoEvents=false;return g;};
{
 const g=setup();assert.ok(g.hualingPractice&&g.practice&&g.frontlineTest);assert.ok(g.playerPosition.y>980);
 for(let i=0;i<40;i++){const p=g.director.hualingEntry(g);assert.ok(p.y>=g.hualing.bounds.top&&p.y<g.hualing.bounds.top+110);assert.ok(p.x>=g.hualing.bounds.left&&p.x<=g.hualing.bounds.right);}
 g.enemies=[];const e=g.spawn('ink')!;assert.ok(e.y<g.hualing.bounds.top+110);e.x=360;e.y=700;e.ai='Approach';const y=e.y;EnemyAI.update(g,e,.1);assert.ok(e.y>y,'ordinary monsters head down toward the new player anchor');
 assert.deepEqual(g.functionalRelics.target(e,g.playerPosition),g.playerPosition);
 step(g,.1);assert.deepEqual(g.hualing.elites.field.player,g.playerPosition);
}
{
 const g=setup(),p={x:240,y:430};g.hualing.frozen=true;
 assert.equal(g.frontline.throw(g,'crescent',{x:NaN,y:400}),false);assert.equal(g.frontline.throw(g,'crescent',{x:10,y:400}),false);
 assert.ok(g.frontline.throw(g,'crescent',p));assert.equal(g.frontline.throw(g,'crescent',p),false);p.x=600;
 step(g,.1);assert.equal(g.collected.crescent.active,false);const age=g.frontline.flights[0].age;
 g.pause();step(g,1);assert.equal(g.frontline.flights[0].age,age);g.pause();g.hualing.upgrades.panel='custom';step(g,1);assert.equal(g.frontline.flights[0].age,age);g.hualing.upgrades.panel=null;
 step(g,.35);assert.ok(g.collected.crescent.active);assert.deepEqual(g.collected.crescent.center,{x:240,y:430});assert.equal(g.frontline.flights.length,0);assert.equal(g.collected.total,0);
 assert.ok(g.frontline.throw(g,'crescent',{x:460,y:550}));step(g,.4);assert.deepEqual(g.collected.crescent.center,{x:460,y:550});assert.equal(g.collected.crescent.units.length,3);
}
{
 const g=setup();g.hualing.frozen=true;assert.ok(g.frontline.throw(g,'ward',{x:220,y:420}));step(g,.42);assert.equal(g.collected.casts[0].x,220);assert.equal(g.collected.casts[0].y,420);
 assert.ok(g.frontline.throw(g,'pulse',{x:360,y:600}));g.changeHualingChapter('sea');assert.equal(g.frontline.flights.length,0);assert.equal(g.collected.casts.length,0);assert.ok(g.frontlineTest);
 for(const ch of Object.keys(HUALING_CHAPTERS) as HualingChapter[]){g.changeHualingChapter(ch);g.hualing.upgrades.panel=null;g.hualing.upgrades.pending=0;assert.ok(g.enemies.length);assert.ok(g.enemies.every(e=>e.y<g.hualing.bounds.top+110));assert.equal(chapterElites(ch).length,5);assert.ok(g.summonHualingBoss()?.chapterBoss);g.clearHualingBoss();assert.ok(g.summonHualingElite(chapterElites(ch)[0])?.elite);g.clearHualingElites();}
 g.menu();assert.equal(g.frontlineTest,false);assert.equal(g.frontline.flights.length,0);assert.deepEqual(g.playerPosition,{x:WORLD.foxX,y:WORLD.foxY});
 g.startFrontline();g.start(false,true,false,false,true);assert.equal(g.frontlineTest,false);g.collected.preview(g,'crescent',{x:200,y:400});assert.deepEqual(g.collected.crescent.center,{x:360,y:683});
 g.startFrontline();g.startMountainLevel(0);assert.equal(g.frontlineTest,false);assert.equal(g.campaign.levelId,0);
}
console.log('PASS frontline: top-only arrivals, bottom player AI/projectile targets, delayed selected-point casts, pause/editor gates, invalid/duplicate inputs, chapter content, cleanup and original-mode isolation');
