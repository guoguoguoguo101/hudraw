import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {InputController} from '../src/input/controller';
import {recognize,type Point} from '../src/input/recognizer';
import {BRUSH_SKINS,GESTURE_INPUT} from '../src/input/brush-settings';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {ProceduralTalismanRenderer} from '../src/rendering/talisman';
import type {PlatformAdapter} from '../src/platform/adapter';
const port={input:()=>()=>{}} as unknown as PlatformAdapter;
const game=()=>{const g=new Game();g.start();g.director.disabled=true;return g;};
const controller=(g:Game,ui=()=>false)=>new InputController(port,{} as never,()=>g.active,r=>g.cast(r),ui,undefined,g.pen,g.ink);
const draw=(input:InputController,points:Point[],end=true)=>{input.event({...points[0],kind:'down',id:1});for(const p of points.slice(1))input.event({...p,kind:'move',id:1});if(end)input.event({...points.at(-1)!,kind:'up',id:1});};
const curve=(count=90)=>Array.from({length:count},(_,i)=>{const t=i/(count-1);return {x:150+t*370,y:520+Math.sin(t*Math.PI*2)*80};});
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let suites=0;const test=(name:string,fn:()=>void)=>{fn();suites++;console.log('PASS pen: '+name);};
test('arcs, brackets, S and waves settle without a combat object, attack or refund',()=>{
 const bracket=Array.from({length:80},(_,i)=>({x:300+Math.cos(-Math.PI/2+i/79*Math.PI)*120,y:530+Math.sin(-Math.PI/2+i/79*Math.PI)*160}));
 for(const pts of [curve(30),curve(90),curve(180),bracket]){
  const g=game(),input=controller(g);assert.equal(recognize(pts).rune,'ink');draw(input,pts);
  assert.equal(input.success,false);assert.equal(input.last?.reason,'未成符 · 断符消散');assert.equal(g.skills.length,0);assert.equal(g.events.length,0);assert.equal(g.casts,0);assert.equal(g.ink.stats.casts,0);assert.equal(g.ink.last.refund,0);
  close(100-g.ink.currentInk,g.ink.last.cost);close(g.ink.last.cost,g.ink.costFor(input.totalPathLength));assert.equal(g.ink.pending,null);
  input.debug=true;input.update(.16);assert.equal(input.points.length,0);assert.equal(input.dryPoints.length,0);assert.equal(input.pointTimes.length,0);assert.equal(input.pointLengths.length,0);
 }
});
test('dense scribbles near enemies never deal damage, push, stun, create timers or trigger relics',()=>{
 const g=game(),input=controller(g),events:string[]=[];g.onProgress=e=>events.push(e);for(const id of ['brush','feather','mirror','seal','bell'] as const)g.modifiers.add(id);
 const enemy=g.spawn('oni',{x:300,y:500})!;enemy.ai='Recovery';const pts=Array.from({length:22},(_,i)=>({x:i%2?330:170,y:500+i%3*3}));
 assert.equal(recognize(pts).rune,'ink');events.length=0;draw(input,pts);assert.equal(g.skills.length,0);g.update(.2);
 assert.equal(enemy.hp,240);assert.equal(enemy.ai,'Recovery');assert.equal(enemy.hit,0);assert.equal(enemy.shock,0);assert.equal(g.brush.strokes.length,0);assert.equal(g.formalCasts,0);assert.ok(!g.events.some(e=>e.type==='cast'||e.type==='strike'||e.type==='foxfire'));assert.ok(!events.some(e=>e.startsWith('SPELL_')));
});
test('legal straight strokes always release with no enemies, all directions and all existing levels',()=>{
 for(const direction of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:.6,y:.8}])for(let level=1;level<=5;level++){
  const g=game();g.start(false,true);g.director.disabled=true;g.practiceLevels.line=level;const input=controller(g);
  draw(input,[{x:360-direction.x*50,y:500-direction.y*50},{x:360+direction.x*50,y:500+direction.y*50}]);
  assert.equal(input.last?.rune,'line');assert.equal(input.success,true);assert.equal(g.skills.length,1);const s=g.skills[0];assert.equal(s.slash?.level,level);assert.ok(g.events.some(e=>e.type==='cast'&&e.rune==='line'));
  g.update(.2);assert.equal(s.released,true);assert.equal(s.hit.size,0);assert.ok(g.skills.includes(s),'empty attacks retain their normal effect lifetime');
 }
});
test('failure neither advances formal combo/discovery nor changes ordinary hit rewards',()=>{
 const g=game(),events:string[]=[];g.onProgress=e=>events.push(e);g.modifiers.add('feather');g.formalCasts=2;draw(controller(g),curve());
 assert.equal(g.formalCasts,2);assert.equal(g.taught.has('ink'),false);assert.ok(!events.includes('SPELL_CAST_SUCCESS'));assert.ok(!g.events.some(e=>e.type==='foxfire'));
 g.ink.setAmount(100);g.spawn('oni',{x:470,y:665});g.cast('line');assert.equal(g.formalCasts,3);assert.ok(g.events.some(e=>e.type==='foxfire'));
});
test('failed timeout settles once without refund, held attacks, extra fingers or replay',()=>{
 const g=game(),input=controller(g);draw(input,curve(),false);input.update(3);assert.equal(input.timedOut,true);assert.equal(input.success,false);assert.equal(g.skills.length,0);
 const ink=g.ink.currentInk,cost=g.ink.stats.totalCost;assert.ok(cost>0);assert.equal(g.ink.isWaitingRelease,true);g.ink.update(2,true);close(g.ink.currentInk,ink);
 input.event({x:420,y:650,id:2,kind:'down'});assert.equal(input.drawing,false);input.event({x:420,y:650,id:1,kind:'move'});input.event({x:420,y:650,id:1,kind:'up'});close(g.ink.currentInk,ink);close(g.ink.stats.totalCost,cost);assert.equal(g.ink.isWaitingRelease,false);assert.equal(g.cast(input.last!),false);
});
test('short touches, local jitter, UI and cancellation remain free',()=>{
 const g=game(),input=controller(g);draw(input,[{x:360,y:500},{x:362,y:501}]);assert.equal(g.ink.currentInk,100);assert.equal(g.casts,0);
 input.event({x:200,y:500,id:1,kind:'down'});input.event({x:680,y:1000,id:2,kind:'move'});assert.equal(input.points.length,1);input.event({x:200,y:500,id:1,kind:'cancel'});assert.equal(g.ink.currentInk,100);
 draw(controller(g,()=>true),curve());assert.equal(g.ink.currentInk,100);assert.equal(g.skills.length,0);
});
test('all four skins have the same failure rules, costs and zero attack objects',()=>{
 let cost:number|undefined;for(const skin of BRUSH_SKINS){const g=game();g.pen.select(skin.id);const input=controller(g);draw(input,curve());assert.equal(input.last?.rune,'ink');assert.equal(input.success,false);assert.equal(g.skills.length,0);assert.equal(g.modifiers.count('brush'),0);if(cost!==undefined)close(cost,g.ink.last.cost);cost=g.ink.last.cost;}
});
test('large inputs and repeated failures retain no attack state or persistent trace buffers',()=>{
 const g=game();g.ink.setUnlimited(true);const input=controller(g);const pts=Array.from({length:1600},(_,i)=>({x:i%2?250:150,y:500+i%3*4}));draw(input,pts);
 assert.ok(input.points.length<=GESTURE_INPUT.maxSamples);assert.equal(input.last?.rune,'ink');assert.equal(g.skills.length,0);input.update(.16);assert.equal(input.points.length,0);
 for(let i=0;i<30;i++){draw(input,curve());input.update(.16);}assert.equal(g.skills.length,0);assert.equal(g.brush.strokes.length,0);assert.equal(g.events.length,0);assert.equal(input.pointTimes.length,0);assert.equal(input.pointLengths.length,0);
});
test('factory rejects failed glyphs and legacy ink skills cannot render or attack',()=>{
 const g=game(),r=recognize(curve());assert.throws(()=>TalismanSpellFactory.create(g,r),/未成符/);
 g.cast('line');const legacy={...g.skills[0],id:999,rune:'ink' as const,damage:999,seal:true,duration:4};g.skills=[legacy];g.events=[];const e=g.spawn('oni',{x:360,y:665})!;g.update(.1);
 assert.equal(e.hp,240);assert.equal(g.skills.length,0);assert.equal(legacy.hit.size,0);
 const renderer=new ProceduralTalismanRenderer();assert.throws(()=>renderer.create(legacy),/断符/);renderer.update([legacy]);assert.equal(renderer.shapes.size,0);renderer.clear();renderer.root.destroy({children:true});
});
console.log(`${suites} spirit pen suites passed`);
