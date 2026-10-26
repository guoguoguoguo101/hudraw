import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;return g;};
let suites=0;function test(name:string,run:()=>void){run();suites++;console.log('PASS brush contact: '+name);}
test('every enemy sharing exactly the same location is damaged, including after the first dies',()=>{
 const g=game(),targets=Array.from({length:6},()=>g.spawn('ink',{x:350,y:500})!);for(const e of targets)e.hp=30;
 g.strokeHualing({x:250,y:500},{x:450,y:500});assert.equal(g.kills,6);assert.equal(g.enemies.length,0);
});
test('overlapping bodies are hit even when their centers lie outside the thin brush centerline',()=>{
 const g=game(),targets=[0,16,30].map(offset=>g.spawn('ink',{x:350,y:500+offset})!);for(const e of targets)e.hp=100;
 g.strokeHualing({x:250,y:500},{x:450,y:500});assert.deepEqual(targets.map(e=>e.hp),[70,70,70]);
});
test('real pointer sweep reaches all stacked bodies and keeps separate cooldowns for each enemy',()=>{
 const g=game(),targets=[0,15,29].map(offset=>g.spawn('ink',{x:350,y:520+offset})!);for(const e of targets)e.hp=100;
 const input=new InputController({input:()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);
 input.simpleBrush=()=>true;input.onStrokeSegment=(a,b)=>g.strokeHualing(a,b);
 input.event({kind:'down',id:1,x:200,y:520});input.event({kind:'move',id:1,x:500,y:520});assert.deepEqual(targets.map(e=>e.hp),[70,70,70]);
 input.event({kind:'up',id:1,x:500,y:520});input.event({kind:'down',id:2,x:500,y:520});input.event({kind:'move',id:2,x:200,y:520});assert.deepEqual(targets.map(e=>e.hp),[70,70,70]);
 const fresh=g.spawn('ink',{x:350,y:520})!;fresh.hp=100;input.event({kind:'move',id:2,x:500,y:520});assert.equal(fresh.hp,70);assert.deepEqual(targets.map(e=>e.hp),[70,70,70]);
 for(let i=0;i<24;i++)g.advance(1/60,true);input.event({kind:'move',id:2,x:200,y:520});assert.deepEqual(targets.map(e=>e.hp),[40,40,40]);
});
test('distant bodies, old ink, pause and special card input do not cause direct brush hits',()=>{
 const g=game(),e=g.spawn('ink',{x:350,y:570})!;e.hp=100;g.strokeHualing({x:200,y:500},{x:500,y:500});assert.equal(e.hp,100);
 e.y=500;for(let i=0;i<30;i++)g.advance(1/60);assert.equal(e.hp,100);g.pause();g.strokeHualing({x:200,y:500},{x:500,y:500});assert.equal(e.hp,100);g.pause();
 g.hualing.select('dragon');g.strokeHualing({x:200,y:500},{x:500,y:500});assert.equal(e.hp,100);
});
test('slow pointer segments accepted by the input sampler also cause hits',()=>{
 const g=game(),e=g.spawn('ink',{x:350,y:500})!;e.hp=100;
 const input=new InputController({input:()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);input.simpleBrush=()=>true;input.onStrokeSegment=(a,b)=>g.strokeHualing(a,b);
 input.event({kind:'down',id:1,x:345,y:500});for(let i=1;i<=5;i++)input.event({kind:'move',id:1,x:345+i*2.6,y:500});assert.equal(e.hp,70);
});
console.log(`PASS ${suites} brush contact suites`);
