import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {CRESCENT_GUARD,crescentPosition} from '../src/gameplay/crescent-guard';

const setup=(campaign=false)=>{const g=new Game();if(campaign)g.startMountainLevel(0);else{g.start(false,true,false,false,true);g.hualing.openRuneShelf();}g.director.disabled=true;g.hualing.frozen=true;g.enemiesFrozen=true;g.enemies=[];g.hualing.bounds={left:26,right:694,top:250,bottom:990};return g;};
const step=(g:Game,t:number,drawing=false)=>{for(let n=0;n<t-1e-8;n+=1/60)g.advance(Math.min(1/60,t-n),drawing);};
const point={x:360,y:600};
{
 const g=setup(),m=g.collected.crescent;assert.ok(g.collected.preview(g,'crescent',point));assert.equal(g.collected.total,0);assert.equal(m.units.length,3);assert.equal(m.remaining,12);
 const p=m.units.map(u=>({x:u.x,y:u.y}));step(g,.35,false);assert.ok(m.units.every((u,i)=>Math.hypot(u.x-p[i].x,u.y-p[i].y)>10),'released pen still allows orbiting');
 const angle=m.angle;for(const unit of m.units){const p=crescentPosition(unit.angle,m.center);assert.ok(Math.hypot(unit.x-p.x,unit.y-p.y)<1e-8);}
 g.beginHualingStroke({x:100,y:500});g.strokeHualing({x:100,y:500},{x:180,y:500});assert.equal(m.angle,angle,'pointer motion never changes the orbit phase');g.endHualingStroke();
 const positions=m.units.map(u=>({x:u.x,y:u.y}));assert.ok(g.collected.preview(g,'crescent',point));assert.equal(m.remaining,12);assert.equal(m.units.length,3);assert.equal(m.angle,angle);assert.deepEqual(m.units.map(u=>({x:u.x,y:u.y})),positions,'refresh never teleports or stacks moons');
 const age=m.age,clock=m.clock;g.pause();step(g,1,true);assert.equal(m.age,age);assert.equal(m.clock,clock);g.pause();g.hualing.upgrades.panel='custom';step(g,1);assert.equal(m.clock,clock);g.hualing.upgrades.panel=null;g.campaign.supportPanel=true;step(g,1);assert.equal(m.clock,clock);g.campaign.supportPanel=false;
 step(g,12.1);assert.equal(m.active,false);assert.equal(m.units.length,0);
}
{
 const g=setup(),m=g.collected.crescent;m.activate();
 const on=g.spawn('ink',{x:m.units[0].x,y:m.units[0].y})!,inside=g.spawn('ink',m.center)!,outside=g.spawn('ink',{x:650,y:430})!;for(const e of [on,inside,outside]){e.hp=e.maxHp=10000;e.speed=0;e.ai='Approach';}
 m.advance(g,1/60);assert.equal(on.hp,10000-CRESCENT_GUARD.damage);assert.equal(inside.hp,10000);assert.equal(outside.hp,10000);
 for(let i=0;i<24;i++)m.advance(g,1/60);assert.equal(on.hp,10000-CRESCENT_GUARD.damage,'shared cooldown prevents adjacent frames and multiple blades repeating a hit');
 assert.ok(g.drain().filter(e=>e.type==='strike').every(e=>e.type==='strike'&&e.secondary));
 for(let i=0;i<180;i++)m.advance(g,1/60);assert.equal(inside.hp,10000,'the area inside the ring is not a disk attack');assert.equal(outside.hp,10000);assert.ok(m.contacts.length<=18);
}
{
 const g=setup(true),m=g.collected.crescent;assert.equal(g.collected.preview(g,'crescent',point),false);assert.equal(g.collected.use(g,'crescent',point),false);
 g.collected.drop(g,point,'crescent');assert.ok(g.collected.collect(g.collected.pickups[0].id));g.ink.setAmount(0);assert.ok(g.collected.use(g,'crescent',point));assert.equal(g.collected.total,0);assert.equal(g.ink.currentInk,0);
 const on=g.spawn('ink',m.units[0])!;on.hp=1;on.ai='Approach';g.campaign.brush.begin();m.advance(g,1/60);assert.equal(g.kills,1);assert.equal(g.campaign.xp,1);assert.equal(g.campaign.brush.kills,0);
 g.changeHualingChapter('sea');assert.equal(m.active,false);assert.equal(m.units.length,0);assert.equal(m.contacts.length,0);
}
{
 const g=setup(),m=g.collected.crescent;g.summonHualingBoss();const boss=g.enemies.find(e=>e.chapterBoss)!;boss.x=m.center.x;boss.y=m.center.y;const hp=boss.hp;m.activate();for(let i=0;i<120;i++)m.advance(g,1/60);assert.equal(boss.hp,hp,'boss invulnerability remains authoritative');assert.equal(m.contacts.length,0);
 g.menu();assert.equal(m.active,false);assert.equal(m.units.length,0);assert.equal(g.collected.counts.crescent,0);
}
const outcomes=[];
for(const fps of [30,60,120]){
 const g=setup(),m=g.collected.crescent;m.activate();const e=g.spawn('ink',{x:486,y:683})!;e.hp=e.maxHp=10000;e.ai='Approach';
 for(let i=0;i<fps*6;i++)m.advance(g,1/fps);
 outcomes.push({hp:e.hp,angle:m.angle,remaining:m.remaining});assert.equal(m.units.length,3);
 const clock=m.clock;m.advance(g,NaN);m.advance(g,-1);assert.equal(m.clock,clock);
}
for(const o of outcomes){assert.equal(o.hp,outcomes[0].hp);assert.ok(Math.abs(o.angle-outcomes[0].angle)<1e-8);assert.ok(Math.abs(o.remaining-6)<1e-8);}
console.log('PASS crescent guard: three fixed-cadence fox-centered orbits, no pointer dependence, actual swept contact with inner/outer exclusion, shared hit cooldown, no stacking/teleport, boss immunity, secondary XP, zero-ink collected use, practice isolation, pause/support/upgrade/expiry/reset and 30/60/120 fps');
