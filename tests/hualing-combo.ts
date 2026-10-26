import assert from 'node:assert/strict';
import {HualingCombo,comboTier,strokeTitle} from '../src/gameplay/hualing-combo';
import {Game} from '../src/gameplay/game';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';

const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;return g;};
const step=(g:Game,n:number)=>{for(let t=0;t<n-1e-8;t+=1/60)g.advance(Math.min(1/60,n-t));};
let suites=0;function test(name:string,fn:()=>void){fn();suites++;console.log('PASS combo: '+name);}

test('kills refresh two seconds; deadline expires exactly and the next kill starts at one',()=>{
 const c=new HualingCombo();c.kill(false);c.advance(1.99);c.kill(false);assert.equal(c.count,2);assert.equal(c.remaining,2);
 c.advance(2);assert.equal(c.count,0);assert.equal(c.chainResult?.kills,2);c.kill(false);assert.equal(c.count,1);assert.equal(c.chainResult,null);
});
test('one continuous stroke spans chain windows and excludes delayed skill kills',()=>{
 const c=new HualingCombo();c.beginStroke();c.kill(true);c.advance(2.1);c.kill(false);c.kill(true);c.advance(.3);c.endStroke();
 assert.equal(c.result?.kills,2);assert.equal(c.result?.seconds,2.4);assert.equal(c.count,2);assert.equal(c.strokeActive,false);
 c.beginStroke();c.endStroke();assert.equal(c.result?.kills,2);c.advance(2.7);assert.equal(c.result,null);
});
test('3/5/8/12 tiers trigger once per crossing, coalesce within a frame and can repeat in a new chain',()=>{
 const c=new HualingCombo();for(let n=1;n<=15;n++){c.kill(false);assert.equal(c.takeTone(),[3,5,8,12].includes(n)?comboTier(n):0);}
 c.advance(2);for(let i=0;i<12;i++)c.kill(false);assert.equal(c.takeTone(),4);assert.equal(c.takeTone(),0);assert.equal(c.best,15);
 assert.equal(strokeTitle(6),'一笔六斩');assert.equal(strokeTitle(12),'一笔十二斩');assert.equal(strokeTitle(22),'一笔22斩');
});
test('only real deaths count, repeated damage cannot duplicate, special kills never enter the brush stroke',()=>{
 const g=game(),c=g.hualing.combo;c.beginStroke();const e=g.spawn('ink',{x:300,y:500})!;e.hp=31;
 g.strokeHualing({x:250,y:500},{x:350,y:500});assert.equal(c.count,0);step(g,.36);g.strokeHualing({x:350,y:500},{x:250,y:500});assert.equal(c.count,1);assert.equal(c.strokeKills,1);
 g.damage(e,100);assert.equal(c.count,1);const special=g.spawn('ink',{x:600,y:500})!;g.damage(special,999,0,{id:-2,rune:'ink'});assert.equal(c.count,2);assert.equal(c.strokeKills,1);
});
test('real input captures only accepted pointer, release and cancellation close a stroke',()=>{
 const g=game(),c=g.hualing.combo;
 const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,()=>false,()=>false,undefined,g.pen,g.ink);
 input.simpleBrush=()=>g.hualingPractice;input.onSimpleStroke=p=>p==='begin'?c.beginStroke():c.endStroke();input.onStrokeSegment=(a,b)=>g.strokeHualing(a,b);
 const e=g.spawn('ink',{x:300,y:500})!;e.hp=1;input.event({kind:'down',id:1,x:250,y:500});input.event({kind:'move',id:2,x:350,y:500});assert.equal(c.strokeKills,0);
 step(g,.5);input.event({kind:'up',id:1,x:350,y:500});assert.equal(c.result?.kills,1);assert.ok(Math.abs(c.result!.seconds-.5)<1e-6);assert.equal(c.strokeActive,false);
 input.event({kind:'down',id:3,x:250,y:500});input.cancel();assert.equal(c.strokeActive,false);
 input.event({kind:'down',id:4,x:5,y:500});assert.equal(c.strokeActive,false);
});
test('pause freezes the window and stroke time, enemy freeze does not; restart/menu and old modes isolate state',()=>{
 const g=game(),c=g.hualing.combo;c.beginStroke();c.kill(true);g.hualing.frozen=true;step(g,.5);assert.ok(c.remaining<2);
 const time=c.time,remaining=c.remaining;g.pause();step(g,3);assert.equal(c.time,time);assert.equal(c.remaining,remaining);g.pause();step(g,.5);c.endStroke();assert.ok(Math.abs(c.result!.seconds-1)<1e-6);
 g.start(false,true,false,false,true);assert.equal(c.count,0);assert.equal(c.result,null);assert.equal(c.strokeActive,false);assert.equal(c.takeTone(),0);
 g.menu();g.start(false,true,false,true);const e=g.spawn('ink',{x:300,y:500})!;g.damage(e,999);assert.equal(c.count,0);
});
console.log(`PASS ${suites} hualing combo suites`);
