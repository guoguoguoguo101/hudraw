import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {recognize,resample,type Point} from '../src/input/recognizer';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
import {MOON_TAIL_STAGES} from '../src/gameplay/moon-tail';
import {castPracticeRune} from '../src/gameplay/practice-cast';
import {MoonTailRenderer} from '../src/rendering/moon-tail';
const arc=(r=80,angle=0,center:Point={x:530,y:665},count=80)=>Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i/(count-1)*Math.PI;const x=Math.cos(a)*r,y=Math.sin(a)*r;return {x:center.x+x*Math.cos(angle)-y*Math.sin(angle),y:center.y+x*Math.sin(angle)+y*Math.cos(angle)};});
const setup=(level=1)=>{const g=new Game();g.start(false,true);g.director.disabled=true;g.practiceLevels.arc=level;return g;};
const advance=(g:Game,t:number)=>{for(let i=0;i<Math.round(t*60);i++)g.advance(1/60);};
const target=(g:Game,x:number,y:number,kind:'ink'|'oni'|'boss'='ink')=>{const e=g.spawn(kind,{x,y})!;e.hp=e.maxHp=5000;e.speed=0;e.ai='Telegraph';e.stateAge=-100;e.armorPool=0;return e;};
let passed=0;const test=(name:string,f:()=>void)=>{f();passed++;console.log('PASS moon: '+name);};
test('half circles rotate, reverse, scale and tolerate jitter/sampling variation',()=>{
 for(const r of [26,45,90,140])for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5,.73])for(const count of [20,80,180]){
  const pts=arc(r,angle,undefined,count);assert.equal(recognize(pts).rune,'arc',JSON.stringify({r,angle,count}));assert.equal(recognize([...pts].reverse()).rune,'arc');
  assert.equal(recognize(pts.map((p,i)=>({x:p.x+Math.sin(i*1.7)*.6,y:p.y+Math.cos(i*1.3)*.6}))).rune,'arc');
 }
});
test('tiny arcs, shallow lines, corners, circles, S, retracing and spirals never become arcs',()=>{
 const line=resample([{x:200,y:500},{x:500,y:500}],80);assert.equal(recognize(line).rune,'line');
 assert.notEqual(recognize(arc(15)).rune,'arc');
 const arrow=resample([{x:200,y:430},{x:450,y:550},{x:200,y:670}],80);assert.equal(recognize(arrow).rune,'triangle');
 assert.equal(recognize(resample([{x:200,y:400},{x:500,y:400},{x:200,y:650},{x:500,y:650}])).rune,'z');
 const circle=Array.from({length:120},(_,i)=>({x:360+100*Math.cos(i/119*Math.PI*2),y:500+100*Math.sin(i/119*Math.PI*2)}));assert.equal(recognize(circle).rune,'circle');
 const s=Array.from({length:100},(_,i)=>({x:200+i*3,y:500+Math.sin(i/99*Math.PI*2)*80}));
 const spiral=Array.from({length:160},(_,i)=>({x:360+(10+i*.7)*Math.cos(i/159*Math.PI*5),y:500+(10+i*.7)*Math.sin(i/159*Math.PI*5)}));
 for(const pts of [s,spiral,[...circle,...circle],[...arc(),...arc().reverse()],line.map((p,i)=>({...p,y:p.y+8*Math.sin(i/79*Math.PI)}))])assert.notEqual(recognize(pts).rune,'arc');
});

test('forgiving moon bends stay distinct from deliberate straight-arm arrow corners',()=>{
 const check=(points:Point[],expected:'arc'|'triangle')=>{
  for(const scale of [.6,1])for(const angle of [0,.73,Math.PI/2,Math.PI])for(const count of [24,100,180]){
   const p=resample(points,count).map(v=>({x:360+(v.x*Math.cos(angle)-v.y*Math.sin(angle))*scale,y:600+(v.x*Math.sin(angle)+v.y*Math.cos(angle))*scale}));
   for(const path of [p,[...p].reverse(),p.map((v,i)=>({x:v.x+Math.sin(i*1.7)*.6,y:v.y+Math.cos(i*1.3)*.6}))])assert.equal(recognize(path).rune,expected,JSON.stringify({expected,scale,angle,count}));
  }
 };
 // Shallow, deep, and incomplete circles no longer require a near-perfect half circle.
 for(const degrees of [45,60,90,180,210])check(Array.from({length:180},(_,i)=>{const a=(-degrees/2+degrees*i/179)*Math.PI/180;return {x:Math.sin(a)*150,y:-Math.cos(a)*150};}),'arc');
 // Rounded peaks used to fall through the arc rule into the broad arrow fit.
 for(const power of [1.35,1.5,2])check(Array.from({length:180},(_,i)=>({x:-180+i/179*360,y:-150*(1-Math.abs(i/179*2-1)**power)})),'arc');
 check([{x:-180,y:0},{x:0,y:-150},{x:180,y:0}],'triangle');
 check([{x:-100,y:0},{x:0,y:-180},{x:160,y:70}],'triangle');
 // Small arm wobble is allowed, sustained bending must not buy an arrow.
 const arrow=resample([{x:-180,y:0},{x:0,y:-200},{x:180,y:0}],180);
 assert.equal(recognize(arrow.map((v,i)=>({x:v.x+360,y:v.y+600+Math.sin(i/179*Math.PI*6)*3}))).rune,'triangle');
 assert.notEqual(recognize(arrow.map((v,i)=>({x:v.x+360,y:v.y+600+Math.sin(i/179*Math.PI*6)*15}))).rune,'triangle');
});
test('real input uses one existing ink transaction, long arcs cost more but have fixed power',()=>{
 const costs:number[]=[];
 for(const r of [26,80]){const g=setup();g.ink.setUnlimited(false);const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,v=>g.cast(v),()=>false,undefined,g.pen,g.ink);const pts=arc(r);
  input.event({...pts[0],kind:'down',id:1});for(const p of pts.slice(1))input.event({...p,kind:'move',id:1});const paid=g.ink.pending!.cost;
  input.event({...pts.at(-1)!,kind:'up',id:1});assert.equal(input.success,true);assert.equal(g.skills.length,1);assert.equal(g.ink.last.cost,paid);assert.equal(g.ink.stats.casts,1);assert.equal(g.skills[0].damage,45);assert.equal(g.skills[0].moonTail!.width,150);
  const ink=g.ink.currentInk;input.event({...pts.at(-1)!,kind:'up',id:1});assert.equal(g.ink.currentInk,ink);costs.push(paid);
 }assert.ok(costs[1]>costs[0]);
 const g=setup();g.ink.setUnlimited(false);g.ink.setAmount(7);assert.equal(g.cast('arc'),false);assert.equal(g.skills.length,0);
});

test('open-stroke fallback accepts uneven bends but reserves closed glyphs and rejects scribbles',()=>{
 const openCircle=(degrees:number)=>Array.from({length:180},(_,i)=>{const a=i/179*Math.PI*degrees/180;return {x:100*Math.cos(a),y:100*Math.sin(a)};});
 const straightThenBend=[...resample([{x:-180,y:0},{x:-30,y:0}],60),...Array.from({length:100},(_,i)=>{const a=-Math.PI/2+i/99*Math.PI*.7;return {x:-30+90*Math.cos(a),y:90+90*Math.sin(a)};})];
 const uneven=Array.from({length:180},(_,i)=>{const t=i/179;return {x:-180+360*t,y:100*Math.sin(t*Math.PI)+18*Math.sin(t*Math.PI*3)};});
 const cases:[Point[],string][]=[
  [straightThenBend,'arc'],[uneven,'arc'],[openCircle(250),'arc'],
  [openCircle(330),'circle'],[openCircle(360),'circle'],
  [resample([{x:-100,y:-100},{x:100,y:100},{x:-100,y:100},{x:-100,y:-88}],150),'sancai'],
  [resample([{x:-150,y:-100},{x:100,y:0},{x:-150,y:100}],150),'triangle'],
  [resample([{x:-150,y:0},{x:150,y:0}],150),'line'],
  [resample([{x:-150,y:-100},{x:150,y:-100},{x:150,y:100},{x:-150,y:100}],150),'ink'],
  [resample([{x:-150,y:0},{x:150,y:0},{x:-120,y:0},{x:120,y:0}],150),'ink'],
 ];
 for(const [points,expected]of cases)for(const angle of [0,.73,Math.PI/2])for(const count of [32,150]){
  const p=resample(points,count).map(v=>({x:360+v.x*Math.cos(angle)-v.y*Math.sin(angle),y:600+v.x*Math.sin(angle)+v.y*Math.cos(angle)}));
  for(const path of [p,[...p].reverse()])assert.equal(recognize(path).rune,expected,JSON.stringify({expected,angle,count,first:points[0]}));
 }
 const crossed=resample([{x:200,y:450},{x:450,y:650},{x:200,y:650},{x:450,y:450}],150);
 assert.notEqual(recognize(crossed).rune,'arc');
 assert.notEqual(recognize([...arc(),...arc().reverse()]).rune,'arc');
});

test('short curved touches stay free and tiny scribbles never cast through actual input',()=>{
 const paths=[arc(10),resample([{x:350,y:600},{x:365,y:610},{x:375,y:603}],60),Array.from({length:100},(_,i)=>({x:360+4*Math.sin(i),y:600+4*Math.cos(i)}))];
 for(const [index,pts]of paths.entries()){
  assert.equal(recognize(pts).valid,false);
  const g=setup();g.ink.setUnlimited(false);const before=g.ink.currentInk;
  const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);
  input.event({...pts[0],id:1,kind:'down'});for(const p of pts.slice(1))input.event({...p,id:1,kind:'move'});input.event({...pts.at(-1)!,id:1,kind:'up'});
  assert.equal(input.success,false);assert.equal(g.skills.length,0);assert.equal(g.formalCasts,0);
  if(index<2)assert.equal(g.ink.currentInk,before);
 }
});
test('position aims in four directions and near-fox uses last aim',()=>{
 for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){
  const g=setup(),r=recognize(arc(50,Math.atan2(d.y,d.x),{x:360+d.x*180,y:665+d.y*180}));g.cast(r);const s=g.skills[0];
  assert.ok(s.direction.x*d.x+s.direction.y*d.y>.999);assert.ok(Math.hypot(s.x-360,s.y-665)-24<1e-8);
  const near=recognize(arc(30,0,{x:345,y:665}));g.cast(near);assert.deepEqual(g.skills.at(-1)!.direction,s.direction);
 }
});
test('depleted paid arc and timeout each settle once, with no held-input recast',()=>{
 for(const exhausted of [false,true]){
  const g=setup();g.ink.setUnlimited(false);if(exhausted)g.ink.setAmount(8);
  const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);
  const pts=arc(60);input.event({...pts[0],id:1,kind:'down'});for(const p of pts.slice(1))input.event({...p,id:1,kind:'move'});
  if(exhausted){assert.equal(input.exhausted,true);assert.ok(input.dryPoints.length);}
  input.update(3);assert.equal(input.success,true);assert.equal(g.skills.length,1);assert.equal(g.ink.stats.casts,1);assert.equal(g.ink.pending,null);
  if(exhausted){assert.equal(g.ink.last.cost,8);assert.equal(g.ink.last.refund,.8);}
  const ink=g.ink.currentInk;input.update(3);input.event({x:650,y:900,id:1,kind:'move'});input.event({x:650,y:900,id:1,kind:'up'});assert.equal(g.skills.length,1);assert.equal(g.ink.currentInk,ink);
 }
});
test('swept moving wave hits multiple targets once including near spawn, no rectangle hits',()=>{
 const g=setup(),near=target(g,378,665),a=target(g,490,665),b=target(g,630,665),outside=target(g,510,810);g.cast('arc',{x:1,y:0});
 g.update(.12);assert.equal(near.hp,4955);assert.equal(a.hp,5000);g.update(.4);assert.equal(a.hp,4955);assert.equal(b.hp,4955);assert.equal(outside.hp,5000);
 advance(g,1);assert.equal(a.hp,4955);assert.equal(b.hp,4955);assert.equal(g.skills.length,0);
});
test('Lv3 pulls toward the hit axis without extra damage; Lv4 adds one stamp, no nearby outsiders',()=>{
 for(const level of [3,4]){const g=setup(level),a=target(g,510,715),outside=target(g,510,870);g.cast('arc',{x:1,y:0});advance(g,.9);
  assert.ok(a.y<695,`level ${level}: ${a.y}`);assert.equal(outside.hp,5000);
  assert.ok(Math.abs(a.hp-(5000-MOON_TAIL_STAGES[level-1].damage*(level===4?1.35:1)))<1e-7);
  const hp=a.hp;advance(g,.7);assert.equal(a.hp,hp);
 }
});
test('Boss is not moved; elite resistance reduces push; pause and slow time are stable',()=>{
 const g=setup(4),boss=target(g,520,715,'boss'),elite=target(g,450,665,'oni');g.cast('arc',{x:1,y:0});advance(g,.35);assert.ok(elite.vx>0);advance(g,.6);assert.equal(boss.x,520);assert.equal(boss.y,715);
 const s=g.skills[0],age=s.age;g.pause();g.advance(2);assert.equal(s.age,age);g.pause();
 const snapshots=[];for(const fps of [30,60,120]){const h=setup(),e=target(h,520,665);h.cast('arc');for(let i=0;i<fps;i++)h.advance(1/fps,true);snapshots.push([h.skills[0].moonTail!.travel,e.hp]);}assert.deepEqual(snapshots[0],snapshots[1]);assert.deepEqual(snapshots[1],snapshots[2]);
});
test('practice auto-cast produces actual arcs; pooled rendering and reset remain bounded',()=>{
 const g=setup(),renderer=new MoonTailRenderer();for(let level=1;level<=4;level++){g.practiceLevels.arc=level;assert.equal(castPracticeRune(g,'arc'),true);assert.equal(g.skills.at(-1)!.moonTail!.level,level);}
 for(let i=0;i<100;i++){advance(g,1/60);renderer.update(g.skills);}assert.ok(renderer.root.children.length<=12);g.start();renderer.update(g.skills);assert.ok(renderer.root.children.every(c=>!c.visible));renderer.clear();renderer.root.destroy({children:true});
});
console.log(`${passed} moon tail suites passed`);
