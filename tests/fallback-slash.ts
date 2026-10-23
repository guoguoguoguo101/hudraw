import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {InputController} from '../src/input/controller';
import {recognize,resample,type Point} from '../src/input/recognizer';
import {glyphSample} from '../src/input/glyph-samples';
import {buildFallbackPath} from '../src/gameplay/fallback-slash';
import {FALLBACK_SLASH as C} from '../src/gameplay/fallback-slash-config';
import type {PlatformAdapter} from '../src/platform/adapter';
import {FallbackSlashRenderer} from '../src/rendering/fallback-slash';

const platform={input:()=>()=>{}} as unknown as PlatformAdapter;
const scene=(experimental=true)=>{const g=new Game();g.start(false,true,false,experimental);g.director.disabled=true;return g;};
const input=(g:Game,ui=()=>false)=>new InputController(platform,{} as never,()=>g.active,r=>g.cast(r),ui,undefined,g.pen,g.ink,()=>g.interactionPractice);
function draw(i:InputController,points:Point[],release=true){i.event({...points[0],kind:'down',id:1});for(const p of points.slice(1))i.event({...p,kind:'move',id:1});if(release)i.event({...points.at(-1)!,kind:'up',id:1});}
const arc=()=>Array.from({length:70},(_,i)=>{const a=-Math.PI/2+i/69*Math.PI;return {x:360+Math.cos(a)*120,y:600+Math.sin(a)*120};});
const zigzag=()=>Array.from({length:35},(_,i)=>({x:i%2?510:210,y:590+i%3*8}));
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
let count=0;const test=(name:string,fn:()=>void)=>{fn();count++;console.log('PASS fallback: '+name);};

test('disabled curved rune becomes a paid fallback, not an arc skill or formal cast',()=>{
 const g=scene(),i=input(g);assert.equal(recognize(arc()).rune,'arc');g.ink.setUnlimited(false);g.formalCasts=2;g.modifiers.add('brush');g.modifiers.add('feather');
 draw(i,arc());assert.equal(i.last?.fallback,true);assert.match(i.last!.reason,/随笔划斩/);assert.equal(i.success,false);assert.equal(g.freeSlashes.items.length,1);assert.equal(g.skills.length,0);
 assert.equal(g.formalCasts,2);assert.equal(g.casts,0);assert.equal(g.ink.stats.casts,0);assert.equal(g.ink.last.refund,0);assert.equal(g.ink.last.rune,'freeStroke');assert.equal(g.ink.pending,null);
 near(100-g.ink.currentInk,g.ink.last.cost);assert.equal(g.brush.strokes.length,0);assert.equal(g.events.filter(e=>e.type==='freeStroke').length,1);assert.ok(!g.events.some(e=>e.type==='cast'||e.type==='foxfire'));
});
test('no damage while drawing; released sweep follows the curve, not its chord or bounding box',()=>{
 const g=scene(),i=input(g),on=g.spawn('oni',{x:480,y:600})!,chord=g.spawn('oni',{x:360,y:600})!;on.speed=chord.speed=0;
 draw(i,arc(),false);assert.equal(g.freeSlashes.items.length,0);assert.equal(on.hp,240);
 i.finish();assert.equal(on.hp,240);g.update(.12);near(on.hp,210);assert.equal(chord.hp,240);g.update(.1);near(on.hp,210);
});
test('one low-frame-rate update sweeps every traversed segment and kills through the normal damage interface',()=>{
 const g=scene(),i=input(g),enemy=g.spawn('crow',{x:480,y:600})!;enemy.speed=0;draw(i,arc());g.update(.2);
 assert.equal(enemy.hp,0);assert.ok(!g.enemies.includes(enemy));assert.equal(g.kills,1);assert.ok(g.events.some(e=>e.type==='strike'&&e.dead));
});
test('retrace and self-intersections cannot multiply damage',()=>{
 const g=scene(),i=input(g),enemy=g.spawn('oni',{x:360,y:594})!;enemy.speed=0;draw(i,zigzag());g.update(.12);near(enemy.hp,210);g.update(.12);near(enemy.hp,210);assert.equal(g.freeSlashes.items[0].hit.size,1);
});
test('all scene formal glyphs take priority and do not add a fallback',()=>{
 for(const rune of ['line','circle','z','triangle','sancai'] as const){const g=scene(),i=input(g);draw(i,glyphSample(rune).map(p=>({x:360+p.x,y:600+p.y})));assert.equal(g.skills.length,1,rune);assert.equal(i.success,true,rune);assert.equal(g.freeSlashes.totalCasts,0,rune);}
});
test('old practice and normal combat still discard failures',()=>{
 for(const practice of [false,true]){const g=new Game();g.start(false,practice);g.director.disabled=true;draw(input(g),zigzag());assert.equal(g.freeSlashes.items.length,0);assert.equal(g.skills.length,0);assert.ok(!g.events.some(e=>e.type==='freeStroke'));}
});
test('short touch, local jitter, UI interception, cancel, pause and insufficient ink cannot create fallback attacks',()=>{
 const g=scene(),i=input(g);draw(i,[{x:300,y:500},{x:302,y:501}]);assert.equal(g.freeSlashes.totalCasts,0);
 const jitter=Array.from({length:50},(_,n)=>({x:300+n%2*5,y:500+n%3*3}));draw(i,jitter);assert.equal(g.freeSlashes.totalCasts,0);
 draw(input(g,()=>true),arc());assert.equal(g.freeSlashes.totalCasts,0);
 draw(i,arc(),false);i.cancel();assert.equal(g.freeSlashes.totalCasts,0);
 draw(i,arc(),false);g.pause();i.update(.01);assert.equal(g.freeSlashes.totalCasts,0);g.pause();
 g.ink.setUnlimited(false);g.ink.setAmount(0);draw(i,arc());assert.equal(g.freeSlashes.totalCasts,0);
});
test('timeout settles once, blocks held input and replay, and does not refund as a formal spell',()=>{
 const g=scene(),i=input(g);g.ink.setUnlimited(false);draw(i,arc(),false);i.update(3);assert.equal(i.timedOut,true);assert.equal(g.freeSlashes.totalCasts,1);assert.equal(g.ink.isWaitingRelease,true);assert.equal(g.ink.last.refund,0);
 const ink=g.ink.currentInk;i.event({x:400,y:700,kind:'move',id:1});i.event({x:400,y:700,kind:'up',id:1});assert.equal(g.freeSlashes.totalCasts,1);near(g.ink.currentInk,ink);assert.equal(g.cast(i.last!),false);assert.equal(g.ink.isWaitingRelease,false);
});
test('dry tail cannot reposition the fallback; path is independent of cleared input buffers',()=>{
 const g=scene(),i=input(g);g.ink.setUnlimited(false);g.ink.setAmount(11);
 const paid=resample([{x:200,y:500},{x:270,y:570},{x:200,y:500},{x:270,y:570}],40);draw(i,[...paid,{x:600,y:900}],false);assert.equal(i.exhausted,true);i.finish();assert.equal(g.freeSlashes.totalCasts,1);
 const s=g.freeSlashes.items[0];assert.ok(s.segments.every(p=>p.a.x<400&&p.b.x<400&&p.b.y<700));
 const snapshot=JSON.stringify(s.segments);i.update(.16);assert.equal(i.points.length,0);assert.equal(JSON.stringify(s.segments),snapshot);
});
test('prefix budget remains faithful under input decimation and does not teleport to a later endpoint',()=>{
 const g=scene(),i=input(g),points=Array.from({length:1800},(_,n)=>({x:200+n%2*100,y:500+n%3*4}));points.push({x:650,y:900});draw(i,points);
 const s=g.freeSlashes.items[0];assert.ok(s);assert.ok(s.length<=C.maxLength+1e-6);assert.ok(s.segments.length<C.maxPoints);assert.ok(s.segments.every(p=>p.a.x<=300&&p.b.x<=300));
});
test('clipping, finite coordinates and dense corners never introduce gap-spanning attacks',()=>{
 const bounds={left:0,right:720,top:250,bottom:1000};
 assert.equal(buildFallbackPath([{x:NaN,y:0},{x:100,y:500}],bounds),null);
 assert.equal(buildFallbackPath([{x:0,y:0},{x:50,y:0}],bounds),null);
 const path=buildFallbackPath([{x:100,y:500},{x:-100,y:500},{x:-100,y:800},{x:100,y:800}],bounds)!;
 assert.equal(path.segments.length,2);assert.deepEqual(path.segments[0].b,{x:0,y:500});assert.deepEqual(path.segments[1].a,{x:0,y:800});
});
test('fixed damage across skins and line levels, no interactions or relics',()=>{
 for(const skin of ['cinnabar','fox','gold','mountain']){const g=scene(),i=input(g);g.pen.select(skin);g.practiceLevels.line=5;draw(i,arc());const e=g.spawn('oni',{x:480,y:600})!;e.speed=0;g.update(.12);near(e.hp,210);assert.equal(g.interactions.traces.length,0);assert.equal(g.interactions.crossCount,0);assert.equal(g.brush.strokes.length,0);}
});
test('pause and draw slowdown use combat time; visual capacity and cleanup stay bounded',()=>{
 const g=scene(),i=input(g);draw(i,arc());g.pause();g.advance(2);assert.equal(g.freeSlashes.items[0].age,0);g.pause();g.advance(.1,true);near(g.freeSlashes.items[0].age,.05);
 for(let n=0;n<30;n++){draw(i,arc());g.update(.13);assert.ok(g.freeSlashes.items.length<=6);}
 g.update(1);assert.equal(g.freeSlashes.items.length,0);draw(i,arc());g.menu();assert.equal(g.freeSlashes.items.length,0);g.start(false,true,false,true);assert.equal(g.freeSlashes.totalCasts,0);
});
test('renderer follows the independent path and releases without persistent geometry',()=>{
 const g=scene(),i=input(g),view=new FallbackSlashRenderer();draw(i,arc());
 for(const t of [0,.03,.06,.12,.2,.34]){g.freeSlashes.items[0].age=t;view.update(g.freeSlashes.items,true,g.interactions.bounds);}
 view.update([],true,g.interactions.bounds);assert.equal(view.root.children.length,2);view.clear();view.root.destroy({children:true});
});
test('saturated pending attack slots reject safely without refunding a live attack or dropping its damage',()=>{
 const g=scene(),i=input(g);g.ink.setUnlimited(false);
 for(let n=0;n<C.capacity;n++)draw(i,arc());
 assert.equal(g.freeSlashes.items.length,6);const before=g.ink.currentInk;draw(i,arc());near(g.ink.currentInk,before);assert.equal(g.freeSlashes.totalCasts,6);
 const enemy=g.spawn('oni',{x:480,y:600})!;enemy.speed=0;g.update(.12);near(enemy.hp,240-6*C.damage);
});
console.log(`PASS ${count} fallback suites`);
