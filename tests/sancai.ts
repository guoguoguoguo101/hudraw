import {handTriangle} from './sancai-fixtures';
import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {recognize,resample,type Point} from '../src/input/recognizer';
import {glyphSample,sancaiSample} from '../src/input/glyph-samples';
import {capTriangle,TRIANGLE_GESTURE} from '../src/input/triangle-geometry';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {castPracticeRune} from '../src/gameplay/practice-cast';
import {SANCAI_STAGES,sancaiArrayTimeline} from '../src/gameplay/sancai-config';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
import {SancaiRenderer} from '../src/rendering/sancai';

const world=(p:Point[])=>p.map(v=>({x:v.x+360,y:v.y+665}));
const setup=()=>{const g=new Game();g.start(false,true);g.director.disabled=true;return g;};
let count=0;function test(name:string,f:()=>void){f();count++;console.log('PASS sancai: '+name);}
test('both sizes accept rotation, reverse, every corner and edge-middle starts, density and jitter',()=>{
 for(const form of ['small','large'] as const)for(const rotation of [0,.7,Math.PI,4.6])for(const n of [64,128,300]){
  const base=resample(sancaiSample(form),n).slice(0,-1);
  for(const seam of [0,Math.floor(base.length/6),Math.floor(base.length/3),Math.floor(base.length*2/3)]){
   const cycled=[...base.slice(seam),...base.slice(0,seam)];cycled.push(cycled[0]);
   const p=cycled.map((v,i)=>({x:360+v.x*Math.cos(rotation)-v.y*Math.sin(rotation)+Math.sin(i)*.5,y:665+v.x*Math.sin(rotation)+v.y*Math.cos(rotation)+Math.cos(i)*.5}));
   for(const points of [p,[...p].reverse()]){const r=recognize(points);assert.equal(r.rune,'sancai',`${form} ${rotation} ${n} ${seam}`);assert.equal(r.geometry.triangle?.form,form);}
  }
 }
});
test('small gaps and right/scalene triangles; reject square, circle, flat, retrace, crossed scribble',()=>{
 const p=world(sancaiSample('small'));p[p.length-1]={x:p[0].x+7,y:p[0].y+4};assert.equal(recognize(p).rune,'sancai');
 for(const vertices of [[{x:100,y:350},{x:300,y:350},{x:100,y:520},{x:100,y:350}],[{x:100,y:350},{x:300,y:400},{x:180,y:590},{x:100,y:350}]])assert.equal(recognize(resample(vertices,160)).rune,'sancai');
 const invalid=[resample([{x:100,y:350},{x:300,y:350},{x:300,y:550},{x:100,y:550},{x:100,y:350}],128),resample([{x:100,y:350},{x:500,y:351},{x:300,y:358},{x:100,y:350}],128),[...p,...p.slice(1)],resample([{x:100,y:350},{x:300,y:350},{x:150,y:450},{x:300,y:550},{x:100,y:350}],128)];
 for(const points of invalid)assert.notEqual(recognize(points).rune,'sancai');
 for(const rune of ['line','circle','triangle','arc','z','wave','spiral'] as const)assert.equal(recognize(world(glyphSample(rune))).rune,rune,rune);
});
test('ordinary finger triangles tolerate rounded corners, bowed edges, visible gaps and smaller sizes',()=>{
 for(const scale of [.55,.8,1.5])for(const round of [.08,.18,.28])for(const jitter of [0,2.5])for(const gap of [0,.06,.1])for(const samples of [28,64,160]){
  const p=resample(handTriangle(scale,round,jitter,gap),samples),r=recognize(p);assert.equal(r.rune,'sancai',`hand triangle scale=${scale} round=${round} jitter=${jitter} gap=${gap} samples=${samples}`);
  assert.equal(recognize([...p].reverse()).rune,'sancai');
 }
 for(const samples of [28,64,160])for(const scale of [.6,1,1.5]){
  for(const rune of ['circle','triangle','arc','z','wave','spiral'] as const){const p=resample(glyphSample(rune),samples).map(v=>({x:360+v.x*scale,y:600+v.y*scale}));assert.notEqual(recognize(p).rune,'sancai',`${rune} must not be stolen`);}
 }
});
test('large needs both geometry thresholds; capping preserves center, shape and form',()=>{
 const p=resample([{x:100,y:350},{x:500,y:350},{x:300,y:420},{x:100,y:350}],128),r=recognize(p);assert.equal(r.rune,'sancai');assert.ok(r.geometry.triangle!.perimeter>TRIANGLE_GESTURE.largePerimeter);assert.equal(r.geometry.triangle!.form,'small');
 const giant=recognize(resample([{x:40,y:220},{x:680,y:450},{x:50,y:1050},{x:40,y:220}],128)).geometry.triangle!;assert.ok(giant);const capped=capTriangle(giant);assert.equal(capped.form,'large');assert.equal(capped.capped,true);assert.deepEqual(capped.center,giant.center);assert.ok(capped.area<=TRIANGLE_GESTURE.maxArea+1e-6);assert.ok(capped.vertices.every(p=>Math.hypot(p.x-capped.center.x,p.y-capped.center.y)<=TRIANGLE_GESTURE.maxRadius+1e-6));
});
test('all four levels fly to the drawn center, spin fully before exactly one split, then expire',()=>{
 for(let level=1;level<=4;level++){
  const g=setup();g.practiceLevels.sancai=level;assert.ok(castPracticeRune(g,'sancai','small'));const s=g.skills[0],t=s.sancai!;
  const obstruction=g.spawn('oni',{x:(t.origin.x+t.destination.x)/2,y:(t.origin.y+t.destination.y)/2})!;obstruction.hp=5000;
  const tick=(dt:number)=>TalismanSpellFactory.update(g,s,dt);
  tick(t.arrival+.05);assert.equal(t.phase,'spin');assert.deepEqual(t.position,t.destination);assert.equal(t.children.length,0);assert.equal(obstruction.hp,5000);
  tick(t.splitAt-s.age-.001);assert.equal(t.children.length,0);tick(.002);assert.equal(t.children.length,3);const children=t.children;
  tick(.1);tick(.1);assert.equal(t.children,children);assert.equal(children.length,3);assert.ok(children[0].angle<children[1].angle&&children[1].angle<children[2].angle);
  tick(1);assert.ok(children.every(p=>p.done));assert.equal(s.testLevel,level);assert.equal(s.damage,0);
 }
});
test('Lv2 children pass the first contact; no HP, armor, control or relic damage changes',()=>{
 for(const level of [1,2,3,4]){
  const g=setup();g.practiceLevels.sancai=level;g.modifiers.add('brush');g.modifiers.add('feather');g.modifiers.add('seal');g.modifiers.add('mirror');g.formalCasts=2;
  assert.ok(castPracticeRune(g,'sancai'));const s=g.skills[0],t=s.sancai!,e=g.spawn('boss',{x:t.destination.x+Math.cos(t.angle)*50,y:t.destination.y+Math.sin(t.angle)*50})!;e.ai='Telegraph';const before={hp:e.hp,armor:e.armor,pool:e.armorPool,ai:e.ai};
  TalismanSpellFactory.update(g,s,t.splitAt+.11);const middle=t.children[1];assert.ok(middle.hit.has(e.id));assert.equal(middle.done,level===1);
  assert.deepEqual({hp:e.hp,armor:e.armor,pool:e.armorPool,ai:e.ai},before);assert.equal(g.brush.strokes.length,0);assert.equal(g.drain().filter(e=>e.type==='foxfire').length,0);assert.equal(s.mirror,false);assert.equal(s.seal,false);
 }
});
test('large targets inside only, handles empty/dead/escaping targets and locks endpoints after launch',()=>{
 for(let level=1;level<=4;level++){
  const g=setup();g.practiceLevels.sancai=level;assert.ok(castPracticeRune(g,'sancai','large'));const s=g.skills[0],t=s.sancai!,center=t.triangle.center,e=g.spawn('oni',center)!,off=g.spawn('boss',{x:40,y:1100})!;
  e.ai='Telegraph';const hp=e.hp,pool=off.armorPool;TalismanSpellFactory.update(g,s,.05);assert.equal(t.targetId,e.id);
  e.x+=8;TalismanSpellFactory.update(g,s,.15);const endpoint={...t.strikePoint};assert.equal(t.strikeLocked,true);e.x=0;e.y=1200;TalismanSpellFactory.update(g,s,.02);assert.deepEqual(t.strikePoint,endpoint);assert.equal(e.hp,hp);assert.equal(off.armorPool,pool);
  TalismanSpellFactory.update(g,s,1);assert.equal(t.phase,'sustain');
  const empty=setup();castPracticeRune(empty,'sancai','large');const es=empty.skills[0];TalismanSpellFactory.update(empty,es,.2);assert.deepEqual(es.sancai!.strikePoint,es.sancai!.triangle.center);
  const escaped=setup();castPracticeRune(escaped,'sancai','large');const ss=escaped.skills[0],v=escaped.spawn('ink',ss.sancai!.triangle.center)!;TalismanSpellFactory.update(escaped,ss,.01);v.x=0;v.y=1200;TalismanSpellFactory.update(escaped,ss,.2);assert.deepEqual(ss.sancai!.strikePoint,ss.sancai!.triangle.center);
 }
});
test('arrays persist by level, end with the right finale, respect pause and clean up at expiry',()=>{
 for(let level=1;level<=4;level++){
  const g=setup();g.practiceLevels.sancai=level;castPracticeRune(g,'sancai','large');const s=g.skills[0],timeline=sancaiArrayTimeline(level);
  assert.equal(s.duration,[4,4.5,5,6][level-1]);TalismanSpellFactory.update(g,s,s.duration/2);assert.equal(s.sancai!.phase,'sustain');
  const renderer=new SancaiRenderer();renderer.update([s]);const graphic=renderer.items.get(s.id)!;assert.ok(graphic.context.instructions.length>20,'persistent array has visible sigils and moving edges');
  const age=s.age;g.pause();g.advance(2);assert.equal(s.age,age);g.pause();
  TalismanSpellFactory.update(g,s,timeline.sustainEnd-s.age+.01);assert.equal(s.sancai!.phase,level>=3?'cut':'fade');
  if(level===4){TalismanSpellFactory.update(g,s,timeline.cutEnd-s.age+.01);assert.equal(s.sancai!.phase,'finish');}
  while(g.skills.includes(s))g.advance(1/60);renderer.update(g.skills);assert.equal(renderer.items.size,0);renderer.root.destroy({children:true});
 }
});
test('real input settles ink once, ignores dry closure, preserves pause and shared level',()=>{
 const g=setup();g.ink.setUnlimited(false);g.practiceLevels.sancai=4;
 const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);
 const p=world(sancaiSample('small'));input.event({...p[0],kind:'down',id:9});for(const v of p.slice(1))input.event({...v,kind:'move',id:9});const cost=g.ink.pending!.cost;input.update(3.01);assert.equal(input.success,true);assert.equal(g.skills[0].sancai?.level,4);assert.equal(g.ink.last.cost,cost);const ink=g.ink.currentInk;input.event({...p.at(-1)!,kind:'up',id:9});assert.equal(g.ink.currentInk,ink);
 g.pause();g.advance(.5);assert.equal(g.skills[0].age,0);g.pause();
 input.cancel();g.ink.setAmount(8);input.event({...p[0],kind:'down',id:10});for(const v of p.slice(1))input.event({...v,kind:'move',id:10});input.event({...p.at(-1)!,kind:'up',id:10});assert.notEqual(input.last?.rune,'sancai');assert.equal(g.skills.filter(s=>s.rune==='sancai').length,1);
});
test('level changes are idempotent; graphics reuse, frame rates and cast cleanup remain bounded',()=>{
 for(const form of ['small','large'] as const)for(let level=1;level<=4;level++){
  const g=setup();castPracticeRune(g,'sancai',form);const s=g.skills[0];applySkillLevel(s,level);const duration=s.duration;applySkillLevel(s,level);assert.equal(s.duration,duration);
  const render=new SancaiRenderer();for(let i=0;i<Math.ceil(s.duration*60);i++){TalismanSpellFactory.update(g,s,1/60);render.update([s]);}render.update([]);assert.equal(render.items.size,0);assert.ok(render.root.children.length<=1);render.clear();render.root.destroy({children:true});
 }
 for(const fps of [30,60,120]){const g=setup();castPracticeRune(g,'sancai');const s=g.skills[0];for(let i=0;i<fps*3;i++)TalismanSpellFactory.update(g,s,1/fps);assert.equal(s.sancai!.children.length,3);assert.ok(s.sancai!.children.every(p=>p.done));}
 const g=setup();for(let i=0;i<25;i++)castPracticeRune(g,'sancai',i%2?'small':'large');assert.equal(g.skills.length,12);for(let i=0;i<480;i++)g.advance(1/60);assert.equal(g.skills.length,0);g.start(false,true);assert.equal(g.skills.length,0);assert.equal(SANCAI_STAGES.length,4);
});
console.log(`PASS ${count} sancai suites`);
