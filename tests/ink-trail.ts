import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {InkTrail,INK_TRAIL_LIMITS,trailStyle} from '../src/gameplay/ink-trail';
import {InkCompanions,INK_COMPANION_TIERS as TIERS} from '../src/gameplay/ink-companions';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
const bounds={left:26,right:694,top:280,bottom:962};
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];return g;};
const step=(g:Game,seconds:number)=>{for(let t=0;t<seconds-1e-8;t+=1/60)g.advance(Math.min(1/60,seconds-t));};
const advance=(m:InkCompanions,seconds:number)=>{for(let t=0;t<seconds-1e-8;t+=1/60)m.advance(Math.min(1/60,seconds-t),[],()=>{},bounds);};
const paint=(m:InkCompanions,level:number)=>m.trace({x:150,y:650},{x:150+TIERS[level].distance,y:650},level);
let suites=0;const test=(name:string,fn:()=>void)=>{fn();suites++;console.log('PASS ink companions: '+name);};
test('four levels create bounded families with a single large guardian at Lv3+',()=>{
 for(let level=1;level<=4;level++){
  const m=new InkCompanions();for(let i=0;i<9;i++){paint(m,level);advance(m,.45);}
  assert.equal(m.units.length,TIERS[level].count);assert.equal(m.units.filter(u=>u.large>0).length,level>=3?1:0);
  if(level>=3)assert.equal(m.units.find(u=>u.large)!.large,level===4?2:1);
 }
});
test('distance accumulates across strokes; tiny motion, idle, zero level and invalid input never summon',()=>{
 const m=new InkTrail();for(let i=0;i<2;i++){m.begin();m.trace({x:100,y:600},{x:160,y:600},16,1,'cinnabar');m.end();}
 assert.equal(m.companions.units.length,0);m.trace({x:160,y:600},{x:200,y:600},16,1,'cinnabar');assert.equal(m.companions.units.length,1);
 const c=new InkCompanions();c.trace({x:0,y:0},{x:1000,y:0},0);c.trace({x:0,y:0},{x:NaN,y:0},4);c.trace({x:0,y:0},{x:0,y:0},4);assert.equal(c.units.length,0);
 paint(c,4);for(let i=0;i<20;i++)paint(c,4);assert.equal(c.units.length,1);advance(c,2);assert.equal(c.units.length,1,'idle does not spend buffered brush distance');
});
test('pounces chase enemies away from the original trail and continue after release',()=>{
 const g=game(),u=g.hualing.upgrades;u.setLevel('trail',1);g.beginHualingStroke();g.strokeHualing({x:100,y:650},{x:280,y:650});g.endHualingStroke();
 const e=g.spawn('oni',{x:500,y:500})!;e.hp=e.maxHp=1000;
 step(g,.25);assert.equal(e.hp,1000,'emergence deals no remote damage');step(g,3);assert.ok(e.hp<1000);assert.ok(u.trail.companions.units[0].x>400);
 assert.equal(g.hualing.combo.strokeKills,0);
});
test('ground ink no longer damages, slows, blocks bullets or forms a circle ritual',()=>{
 const g=game(),e=g.spawn('oni',{x:350,y:600})!,m=new InkTrail();e.hp=1000;
 m.begin();m.trace({x:300,y:600},{x:340,y:600},16,4,'cinnabar');m.end();for(let i=0;i<120;i++)m.advance(1/60,[e],(e,n)=>e.hp-=n,bounds);
 assert.equal(e.hp,1000);assert.equal(m.isSlowed(e.id),false);assert.equal(m.blockProjectile({x:320,y:500},{x:320,y:700}),false);
 m.begin();const pts=Array.from({length:49},(_,i)=>({x:350+120*Math.cos(i/48*2*Math.PI),y:600+100*Math.sin(i/48*2*Math.PI)}));
 for(let i=1;i<pts.length;i++)m.trace(pts[i-1],pts[i],16,4,'cinnabar');assert.equal(m.end(false,bounds),false);assert.equal(m.companions.units.length,1);
});
test('a pounce damages each touched target once, ordinary and guardian pounces have distinct strength',()=>{
 const g=game(),base=g.spawn('oni',{x:300,y:650})!;
 for(const level of [1,3,4]){
  const m=new InkCompanions();paint(m,level);if(level>=3){advance(m,.45);paint(m,level);advance(m,.45);paint(m,level);}
  const unit=m.units.at(-1)!;m.units=[unit];unit.x=260;unit.y=650;unit.phase='pounce';unit.phaseAge=0;unit.from={x:260,y:650};unit.to={x:340,y:650};unit.age=1;
  const e={...base,hp:1000},other={...base,id:999,hp:1000};let hits=0;for(let i=0;i<30;i++)m.advance(1/120,[e,other],(e,n)=>{e.hp-=n;hits++;},bounds);
  assert.equal(hits,2);assert.equal(e.hp,other.hp);assert.equal(1000-e.hp,Math.round(TIERS[level].damage*(level===4?2.8:level===3?2:1)));
 }
});
test('target death retargets safely and off-arena enemies never receive companion hits',()=>{
 const g=game(),m=new InkCompanions();paint(m,4);const a=g.spawn('oni',{x:300,y:650})!,b=g.spawn('oni',{x:430,y:650})!,outside={...b,id:999,x:800,hp:1000};a.hp=1;b.hp=1000;
 for(let i=0;i<300;i++)m.advance(1/60,[a,b,outside],(e,n)=>e.hp-=n,bounds);
 assert.ok(a.hp<=0);assert.ok(b.hp<1000);assert.equal(outside.hp,1000);
 assert.ok(m.units.every(u=>u.x>=bounds.left&&u.x<=bounds.right&&u.y>=bounds.top&&u.y<=bounds.bottom));
});
test('full family refreshes lifetime without teleporting and a new guardian can replace a regular',()=>{
 const m=new InkCompanions();for(let i=0;i<5;i++){paint(m,4);advance(m,.45);}const before=m.units.map(u=>({id:u.id,x:u.x,y:u.y}));
 paint(m,4);for(const p of before){const u=m.units.find(u=>u.id===p.id)!;assert.equal(u.x,p.x);assert.equal(u.y,p.y);}
 m.units=m.units.filter(u=>!u.large);advance(m,.45);paint(m,4);advance(m,.45);paint(m,4);advance(m,.45);paint(m,4);
 assert.equal(m.units.filter(u=>u.large>0).length,1);assert.ok(m.units.length<=5);
 advance(m,14);assert.equal(m.units.length,0);assert.equal(m.hits.length,0);
});
test('pause and tuning freeze all companions; setting, chapter, reset and old modes clear them',()=>{
 const g=game(),u=g.hualing.upgrades;u.setLevel('trail',4);u.begin();u.trace({x:100,y:650},{x:300,y:650});u.end(bounds);const c=u.trail.companions;
 g.pause();step(g,2);assert.equal(c.time,0);g.pause();u.panel='custom';step(g,2);assert.equal(c.time,0);u.panel=null;step(g,.5);assert.ok(c.time>0);
 u.setLevel('wide',2);assert.equal(c.units.length,0);u.trace({x:100,y:650},{x:300,y:650});g.changeHualingChapter('sea');assert.equal(c.units.length,0);
 u.setLevel('trail',4);u.trace({x:100,y:650},{x:300,y:650});g.menu();g.start(false,true,false,true);assert.equal(c.units.length,0);
});
test('summon kills count toward growth and combo without direct-stroke credit or new summons',()=>{
 const g=game(),u=g.hualing.upgrades;u.setLevel('trail',1);u.growth=true;const e=g.spawn('ink',{x:330,y:650})!;e.hp=1;
 g.beginHualingStroke();g.strokeHualing({x:100,y:650},{x:280,y:650});g.endHualingStroke();step(g,2);
 assert.equal(g.kills,1);assert.equal(g.hualing.combo.count,1);assert.equal(g.hualing.combo.strokeKills,0);assert.equal(u.kills,1);assert.equal(u.trail.companions.units.length,1);
});
test('real input creates companions on an open stroke, no circle or release trigger required',()=>{
 const g=game();g.hualing.upgrades.setLevel('trail',2);
 const input=new InputController({input:()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);
 input.simpleBrush=()=>true;input.onStrokeSegment=(a,b)=>g.strokeHualing(a,b);input.onSimpleStroke=p=>p==='begin'?g.beginHualingStroke():g.endHualingStroke(p==='cancel');
 input.event({kind:'down',id:1,x:100,y:650});input.event({kind:'move',id:1,x:300,y:650});assert.equal(g.hualing.upgrades.trail.companions.units.length,1);
 input.event({kind:'up',id:1,x:300,y:650});step(g,1);assert.equal(g.hualing.upgrades.trail.companions.units.length,1);
});
test('30/60/120fps match autonomous damage, positions, age and expiration',()=>{
 const g=game(),base=g.spawn('oni',{x:450,y:600})!,results=[];
 for(const fps of [30,60,120]){const m=new InkCompanions(),e={...base,hp:10000};paint(m,4);for(let i=0;i<fps*6;i++)m.advance(1/fps,[e],(e,n)=>e.hp-=n,bounds);results.push([e.hp,...m.units.map(u=>[u.x,u.y,u.age])]);}
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
});
test('dense trails and cosmetic talisman snapshots remain bounded with no autonomous overpopulation',()=>{
 const m=new InkTrail();for(let i=0;i<2000;i++)m.trace({x:100,y:600},{x:500,y:600+i%5},16,4,trailStyle(i%2===0,i%3===0));
 assert.ok(m.segments.length<=INK_TRAIL_LIMITS.segments);assert.ok(m.length<=INK_TRAIL_LIMITS.length);assert.equal(m.companions.units.length,1);
 assert.ok(m.segments.some(s=>s.style==='maple-thunder'));m.reset();assert.equal(m.segments.length,0);assert.equal(m.companions.units.length,0);assert.equal(m.companions.progress,0);
});
console.log(`PASS ${suites} ink companion suites`);
