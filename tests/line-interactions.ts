import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {recognize,resample,type Point} from '../src/input/recognizer';
import {segmentIntersection,clipSegment,circleIntersectsTriangle,triangleArea,type Triangle} from '../src/input/line-interaction-geometry';
import {LINE_INTERACTION as C,triangleParticleCount} from '../src/gameplay/line-interaction-config';
import {clipToTriangle,LineInteractionArt} from '../src/rendering/line-interaction-art';
import {Graphics} from 'pixi.js';
import {castPracticeRune} from '../src/gameplay/practice-cast';
import {sancaiSample} from '../src/input/glyph-samples';

let checks=0;
function test(name:string,run:()=>void){run();checks++;console.log('PASS '+name);}
function arena(){const g=new Game();g.start(false,true,false,true);g.director.disabled=true;return g;}
function line(g:Game,a:Point,b:Point){const r=recognize(resample([a,b],30));assert.equal(r.rune,'line');assert.equal(g.cast(r),true);return g.skills.at(-1)!;}
const a={x:180,y:650},b={x:540,y:650},c={x:250,y:720},d={x:360,y:390},e={x:470,y:720};
function triangle(g:Game){line(g,a,b);line(g,c,d);line(g,d,e);}
function tick(g:Game,dt:number){g.interactions.advance(dt,g.enemies,(e,n,source)=>g.damage(e,n,0,source));}

test('finite intersection, parallel, collinear, near parallel, extension, tolerance',()=>{
 const s={a:{x:100,y:400},b:{x:500,y:400}};
 assert.deepEqual(segmentIntersection(s,{a:{x:300,y:250},b:{x:300,y:550}},C.minAngle)?.point,{x:300,y:400});
 for(const t of [
  {a:{x:100,y:500},b:{x:500,y:500}},
  {a:{x:150,y:400},b:{x:550,y:400}},
  {a:{x:100,y:390},b:{x:500,y:410}},
  {a:{x:600,y:250},b:{x:600,y:550}},
 ])assert.equal(segmentIntersection(s,t,C.minAngle),null);
 assert.ok(segmentIntersection(s,{a:{x:505,y:250},b:{x:505,y:550}},C.minAngle,8));
 assert.equal(segmentIntersection(s,{a:{x:509,y:250},b:{x:509,y:550}},C.minAngle,8),null);
});
test('clipping keeps displayed segments in the playable region',()=>{
 assert.deepEqual(clipSegment({a:{x:-100,y:400},b:{x:800,y:400}},{left:0,right:720,top:252,bottom:1094}),{a:{x:0,y:400},b:{x:720,y:400}});
 assert.equal(clipSegment({a:{x:100,y:100},b:{x:200,y:100}},{left:0,right:720,top:252,bottom:1094}),null);
});
test('one trace per paid primary with the same 1.5× slash endpoints, all five levels',()=>{
 for(let level=1;level<=5;level++){
  const g=arena();g.practiceLevels.line=level;const s=line(g,a,b),t=g.interactions.traces[0];
  assert.deepEqual([t.a,t.b],s.slash!.path);assert.equal(t.b.x-t.a.x,540);assert.equal(t.level,level);
  g.interactions.add(s);assert.equal(g.interactions.traces.length,1);
 }
});
test('cross damage is local, delayed, once per enemy, and retains source after skill removal',()=>{
 const g=arena();line(g,a,b);const s=line(g,{x:360,y:450},{x:360,y:850});
 assert.equal(g.interactions.crossCount,1);assert.equal(g.interactions.effects.length,1);
 const inside=g.spawn('oni',{x:360,y:650})!,outside=g.spawn('oni',{x:600,y:450})!;g.skills=[];
 tick(g,.04);assert.equal(inside.hp,240);tick(g,.02);assert.equal(inside.hp,240-s.damage*.4);assert.equal(outside.hp,240);
 tick(g,.1);assert.equal(inside.hp,240-s.damage*.4);assert.equal(g.interactions.effects[0].source.id,s.id);
});
test('third line suppresses its two crosses and retains the previous cross',()=>{
 const g=arena();triangle(g);assert.equal(g.interactions.crossCount,1);assert.equal(g.interactions.triangleCount,1);
 assert.deepEqual(g.interactions.effects.map(e=>e.kind),['cross','triangle']);
 const event=g.interactions.effects[1];assert.ok(triangleArea(event.vertices!)>C.minArea);
 const count=g.interactions.effects.length;g.interactions.add(g.skills.at(-1)!);assert.equal(g.interactions.effects.length,count);
});
test('triangle damage matches polygon including edge contact, with two timed hits and a visible tail',()=>{
 const g=arena();triangle(g);g.interactions.effects=g.interactions.effects.filter(e=>e.kind==='triangle');const event=g.interactions.effects[0];g.skills=[];
 const inside=g.spawn('oni',{x:360,y:550})!,edge=g.spawn('oni',{x:450,y:650})!,outside=g.spawn('oni',{x:600,y:610})!;
 tick(g,C.triangleCutAt-.01);assert.equal(inside.hp,240);tick(g,.02);assert.ok(Math.abs(inside.hp-(240-event.damage*C.triangleCutShare))<1e-8);assert.equal(outside.hp,240);
 tick(g,C.triangleHitAt-C.triangleCutAt);assert.ok(Math.abs(inside.hp-(240-event.damage))<1e-8);assert.ok(Math.abs(edge.hp-(240-event.damage))<1e-8);assert.equal(outside.hp,240);
 assert.equal(g.interactions.effects.length,1,'visual tail remains after damage');tick(g,.1);assert.ok(Math.abs(inside.hp-(240-event.damage))<1e-8);
 tick(g,C.triangleDuration-C.triangleHitAt-.09);assert.equal(g.interactions.effects.length,0);assert.equal(g.interactions.traces.length,0);
});
test('triangle immediately consumes its three traces; unrelated traces survive and later lines cannot reuse them',()=>{
 const g=arena();line(g,{x:180,y:950},{x:540,y:950});const untouched=g.interactions.traces[0].id;
 triangle(g);assert.deepEqual(g.interactions.traces.map(t=>t.id),[untouched]);
 assert.ok(g.skills.slice(-3).every(s=>s.interactionConsumed),'long slash tails also disappear without removing the attack objects');
 assert.equal(g.skills[0].interactionConsumed,undefined);
 const combo=g.interactions.effects.find(e=>e.kind==='triangle')!;assert.ok(combo.vertices);
 const before=g.interactions.crossCount;line(g,a,b);assert.equal(g.interactions.crossCount,before);assert.equal(g.interactions.triangleCount,1);
 tick(g,C.triangleHitAt+.01);assert.ok(g.interactions.effects.includes(combo));assert.equal(combo.settled,true);
});
test('triangle uses positions at the hit frame and does not become an enclosing circle',()=>{
 const t:Triangle=[{x:100,y:100},{x:500,y:100},{x:100,y:500}];
 assert.ok(circleIntersectsTriangle({x:200,y:200},1,t));assert.ok(circleIntersectsTriangle({x:305,y:305},10,t));
 assert.equal(circleIntersectsTriangle({x:450,y:450},20,t),false);
 const g=arena();triangle(g);g.interactions.effects=g.interactions.effects.filter(e=>e.kind==='triangle');
 const leaving=g.spawn('oni',{x:360,y:550})!,entering=g.spawn('oni',{x:650,y:800})!;
 leaving.x=650;leaving.y=800;entering.x=360;entering.y=550;tick(g,C.triangleHitAt+.01);
 assert.equal(leaving.hp,240);assert.ok(entering.hp<240);
});
test('V endpoints, three concurrent lines, only two intersections and expired lines do not create false triangles',()=>{
 const g=arena();line(g,{x:180,y:550},{x:300,y:550});line(g,{x:330,y:580},{x:330,y:700});assert.equal(g.interactions.crossCount,0,'extended slash shared endpoint is V-only');
 const h=arena();line(h,a,b);line(h,{x:360,y:400},{x:360,y:900});line(h,{x:200,y:490},{x:520,y:810});assert.equal(h.interactions.triangleCount,0);
 const k=arena();line(k,a,b);line(k,{x:250,y:400},{x:250,y:850});line(k,{x:450,y:400},{x:450,y:850});assert.equal(k.interactions.triangleCount,0);
 const j=arena();line(j,a,b);tick(j,3);line(j,c,d);assert.equal(j.interactions.crossCount,0);assert.equal(j.interactions.traces.length,1);
});
test('real-time expiry ignores drawing slowdown and freezes on pause; long frame debt expires traces',()=>{
 const g=arena();line(g,a,b);g.skills=[];g.advance(1,true);assert.equal(g.interactions.now,1);assert.ok(Math.abs(g.clock.world-.5)<1e-6);
 g.pause();g.advance(20,true);assert.equal(g.interactions.now,1);g.pause();g.advance(.1,false,2.01);assert.equal(g.interactions.traces.length,0);
});
test('empty-field combinations still emit exactly one impact feedback event',()=>{
 const g=arena();line(g,a,b);line(g,c,d);g.skills=[];g.drain();g.advance(.06);
 assert.equal(g.drain().filter(e=>e.type==='lineInteraction').length,1);g.advance(.1);assert.equal(g.drain().filter(e=>e.type==='lineInteraction').length,0);
});
test('capacity, relation cleanup and per-cast budgets remain bounded in repeated play',()=>{
 const g=arena();
 for(let i=0;i<80;i++){line(g,{x:150,y:400+i%5*30},{x:550,y:800-i%5*30});tick(g,.08);assert.ok(g.interactions.traces.length<=6);assert.ok(g.interactions.effects.length<=C.maxEffects);}
 tick(g,4);assert.equal(g.interactions.traces.length,0);assert.equal(g.interactions.pairs.size,0);assert.equal(g.interactions.triangles.size,0);assert.equal(g.interactions.effects.length,0);
 const h=arena();for(let i=0;i<5;i++)line(h,{x:160+i*70,y:400},{x:160+i*70,y:850});line(h,a,b);assert.equal(h.interactions.crossCount,3);
});
test('five-rune restriction, both triangle forms, selectable handwritten triangle and finite ink',()=>{
 const g=arena();for(const rune of ['arc','wave','spiral','star'] as const)assert.equal(g.cast(rune),false);
 for(const rune of ['line','circle','z','triangle','sancai'] as const){assert.equal(castPracticeRune(g,rune),true);assert.equal(g.skills.at(-1)!.rune,rune);}
 g.interactionTriangle='triangle';const points=sancaiSample('small').map(p=>({x:360+p.x,y:665+p.y}));assert.equal(g.cast(recognize(points)),true);assert.equal(g.skills.at(-1)!.rune,'triangle');
 g.interactionTriangle='sancai';assert.equal(g.cast(recognize(points)),true);assert.equal(g.skills.at(-1)!.rune,'sancai');
 g.ink.setUnlimited(false);g.ink.setAmount(0);const before=g.interactions.traces.length;assert.equal(g.cast('line'),false);assert.equal(g.interactions.traces.length,before);
});
test('old practice and normal slash remain isolated; restart/menu clear pending attacks',()=>{
 const g=arena();triangle(g);g.menu();assert.equal(g.interactionPractice,false);assert.equal(g.interactions.effects.length,0);
 g.start(false,true);line(g,a,b);assert.equal(g.skills[0].interactionLine,undefined);assert.equal(g.interactions.traces.length,0);assert.equal(castPracticeRune(g,'arc'),true);
 g.start();assert.equal(g.practice,false);assert.equal(g.interactionPractice,false);
 g.start(false,true,false,true);assert.equal(g.interactions.traces.length,0);assert.equal(g.interactions.triangleCount,0);
});
test('area particles increase monotonically, have a hard cap and halve on low quality',()=>{
 const areas=[0,C.minArea,10000,30000,70000,1e9],counts=areas.map(a=>triangleParticleCount(a));
 assert.equal(counts[0],C.triangleParticleMin);assert.equal(counts.at(-1),C.triangleParticleMax);
 assert.ok(counts.every((v,i)=>i===0||v>=counts[i-1]));assert.ok(counts[3]>counts[2]);
 for(const a of areas)assert.equal(triangleParticleCount(a,true),Math.ceil(triangleParticleCount(a)/2));
});
test('internal sword sweeps are clipped to the actual polygon',()=>{
 const t:Triangle=[{x:0,y:0},{x:100,y:0},{x:0,y:100}];
 assert.deepEqual(clipToTriangle({x:-10,y:20},{x:150,y:20},t),[{x:0,y:20},{x:80,y:20}]);
 assert.equal(clipToTriangle({x:80,y:80},{x:100,y:100},t),null);
 assert.deepEqual(clipToTriangle({x:-10,y:20},{x:150,y:20},[...t].reverse() as Triangle),[{x:0,y:20},{x:80,y:20}]);
});
test('moving targets are checked separately for the area cut and final explosion, with no extra ticks',()=>{
 const g=arena();triangle(g);g.interactions.effects=g.interactions.effects.filter(e=>e.kind==='triangle');const event=g.interactions.effects[0];
 const leaving=g.spawn('oni',{x:360,y:550})!,entering=g.spawn('oni',{x:650,y:800})!;
 tick(g,C.triangleCutAt+.01);assert.ok(Math.abs(leaving.hp-(240-event.damage*C.triangleCutShare))<1e-8);assert.equal(entering.hp,240);
 leaving.x=650;leaving.y=800;entering.x=360;entering.y=550;
 tick(g,C.triangleHitAt-C.triangleCutAt);assert.ok(Math.abs(entering.hp-(240-event.damage*(1-C.triangleCutShare)))<1e-8);
 const hp=[leaving.hp,entering.hp];tick(g,.1);assert.deepEqual([leaving.hp,entering.hp],hp);
});
test('procedural effect stages draw consistently and simultaneous fragments stay within a frame budget',()=>{
 const game=arena();triangle(game);const event=game.interactions.effects.find(e=>e.kind==='triangle')!,g=new Graphics(),art=new LineInteractionArt(g);
 for(const t of [0,.05,.2,C.triangleCutAt,C.triangleHoldUntil,C.triangleHitAt,C.triangleHitAt+.06,C.triangleHitAt+.25,C.triangleDuration-.1]){g.clear();art.beginFrame(false);art.triangle(event,t,false);assert.ok(g.context.instructions.length<1000);}
 const draw=(low:boolean)=>{g.clear();art.beginFrame(low);for(let i=0;i<24;i++)art.triangle(event,C.triangleHitAt+.25,low);return g.context.instructions.length;};
 const high=draw(false),low=draw(true);assert.ok(high<4000);assert.ok(low<high);assert.equal(draw(false),high,'same frame produces stable geometry rather than random flicker');
 g.destroy();
});
console.log(`PASS ${checks} interaction suites`);
