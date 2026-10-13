import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {InkResourceManager} from '../src/gameplay/ink-resource';
import {INK} from '../src/gameplay/ink-config';
import {InkHUD} from '../src/ui/ink-hud';
import {InputController} from '../src/input/controller';
import {BRUSH_SKINS} from '../src/input/brush-settings';
import type {PlatformAdapter} from '../src/platform/adapter';
import {recognize,type Point} from '../src/input/recognizer';
const port={input:()=>()=>{}} as unknown as PlatformAdapter;
const close=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
function setup(){const g=new Game();g.start();g.director.disabled=true;const input=new InputController(port,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);return {g,input};}
function down(input:InputController,x=100,y=500){input.event({kind:'down',id:1,x,y});}
function move(input:InputController,x:number,y=500){input.event({kind:'move',id:1,x,y});}
function up(input:InputController,x:number,y=500){input.event({kind:'up',id:1,x,y});}
let count=0;function test(name:string,fn:()=>void){fn();count++;console.log('PASS ink: '+name);}
test('threshold, immediate incremental debits, stationary touch, one refund and no release charge',()=>{
 const {g,input}=setup();down(input);move(input,140);close(g.ink.currentInk,100);move(input,160);close(g.ink.currentInk,92.75);assert.equal(g.casts,0);
 move(input,340);close(g.ink.currentInk,89);const before=g.ink.currentInk;move(input,340);input.update(.5);g.ink.update(.5,true);close(g.ink.currentInk,before);
 up(input,340);close(g.ink.last.cost,11);close(g.ink.last.refund,1.1);close(g.ink.currentInk,90.1);assert.equal(g.casts,1);
 up(input,340);assert.equal(g.casts,1);close(g.ink.currentInk,90.1);assert.equal(g.cast(input.last!),false,'settled recognition cannot be replayed');
});
test('tiny touches and local jitter are free; insufficient starts do not drain or reset recovery',()=>{
 const {g,input}=setup();down(input);for(let i=0;i<200;i++)move(input,100+(i%2?1:-1),500);up(input,100);close(g.ink.currentInk,100);assert.equal(g.casts,0);
 g.ink.setAmount(5);g.ink.delay=.2;down(input);assert.equal(input.drawing,false);close(g.ink.currentInk,5);close(g.ink.delay,.2);assert.equal(g.ink.blockedSerial,1);g.ink.update(1,true);close(g.ink.currentInk,11.4);down(input);assert.equal(input.drawing,true);
});
test('equal straight paths, fast/slow, sample density and four skins have equal costs/refunds',()=>{
 let expected:number|undefined;
 for(const skin of BRUSH_SKINS)for(const samples of [10,30,80])for(const duration of [.3,1.5]){
  const {g,input}=setup();g.pen.select(skin.id);down(input);for(let i=1;i<=samples;i++){input.update(duration/samples);move(input,100+480*i/samples);}up(input,580);
  close(g.ink.last.cost,16);close(g.ink.last.refund,1.6);if(expected!==undefined)close(g.ink.currentInk,expected);expected=g.ink.currentInk;
 }
});
test('equal curved paths under different sample rates stay within a small geometric tolerance',()=>{
 const values:number[]=[];for(const samples of [30,90,180]){const {g,input}=setup();const pts=Array.from({length:samples},(_,i)=>({x:100+450*i/(samples-1),y:500+Math.sin(i/(samples-1)*Math.PI*2)*70}));down(input,pts[0].x,pts[0].y);for(const p of pts.slice(1))move(input,p.x,p.y);up(input,pts.at(-1)!.x,pts.at(-1)!.y);values.push(g.ink.last.cost);}
 assert.ok(Math.max(...values)-Math.min(...values)<.15,values.join(','));
});
test('repeated scribble costs ink but never refunds or generates any attack',()=>{
 const {g,input}=setup();down(input,100);for(let i=0;i<12;i++)move(input,i%2?100:340,500+i%3*4);up(input,340,500);assert.equal(input.last?.rune,'ink');assert.equal(g.ink.last.refund,0);assert.ok(g.ink.last.cost>21);assert.equal(g.casts,0);assert.equal(g.skills.length,0);
});
test('depletion interpolates to the exact paid point, keeps visual tail only, then allows one slash',()=>{
 const {g,input}=setup();g.ink.setAmount(8);down(input);move(input,500);close(g.ink.currentInk,0);close(input.points.at(-1)!.x,196);assert.equal(input.exhausted,true);assert.equal(g.casts,0);
 move(input,680,1000);assert.equal(input.points.length,2);assert.ok(input.dryPoints.length>=2);up(input,680,1000);assert.equal(g.casts,1);assert.equal(input.last?.rune,'line');close(g.ink.last.cost,8);close(g.ink.currentInk,.8);assert.ok(g.skills[0].geometry.raw.every(p=>p.x<=196));
});
test('failed partial circle has no refund and system cancel restores uncommitted cost',()=>{
 const {g,input}=setup();down(input,360,380);for(let i=1;i<=20;i++){const a=-Math.PI/2+i/20*Math.PI;move(input,360+Math.cos(a)*120,500+Math.sin(a)*120);}up(input,360,620);assert.equal(input.last?.rune,'ink');assert.equal(g.ink.last.refund,0);assert.ok(g.ink.currentInk<100);
 const before=g.ink.currentInk;down(input);move(input,400);assert.ok(g.ink.currentInk<before);input.event({kind:'cancel',id:1,x:400,y:500});close(g.ink.currentInk,before);assert.equal(g.casts,0);assert.equal(g.skills.length,0);
});
test('timeout seals once, no held recovery, no extra finger, no refund of settled stroke on cancellation',()=>{
 const {g,input}=setup();down(input);move(input,340);input.update(3);assert.equal(g.casts,1);const balance=g.ink.currentInk;assert.equal(g.ink.isWaitingRelease,true);
 g.ink.update(4,true);close(g.ink.currentInk,balance);input.event({kind:'down',id:2,x:300,y:500});assert.equal(input.drawing,false);input.event({kind:'cancel',id:1,x:340,y:500});close(g.ink.currentInk,balance);assert.equal(g.ink.isWaitingRelease,false);g.ink.update(.35,true);close(g.ink.currentInk,balance);g.ink.update(.5,true);close(g.ink.currentInk,balance+4);
});
test('pause, upgrade, defeat and engine rejection cancel a transaction without casting or losing ink',()=>{
 for(const state of ['paused','upgrade','lose','win'] as const){const {g,input}=setup();down(input);move(input,340);g.state=state;input.update(.1);close(g.ink.currentInk,100);assert.equal(g.casts,0);g.ink.update(10,g.active);close(g.ink.currentInk,100);}
 const g=new Game();g.start();const input=new InputController(port,{} as never,()=>g.active,()=>false,()=>false,undefined,g.pen,g.ink);down(input);move(input,340);up(input,340);close(g.ink.currentInk,100);assert.equal(g.ink.last.reason,'rejected');
});
test('real-time recovery respects delay, cap, paused states and ongoing tracking',()=>{
 const ink=new InkResourceManager();ink.setAmount(50);ink.update(1,false);close(ink.currentInk,50);ink.delay=.35;ink.update(.2,true);close(ink.currentInk,50);ink.update(.65,true);close(ink.currentInk,54);ink.begin(1);ink.update(2,true);close(ink.currentInk,54);ink.cancel();ink.update(10,true);close(ink.currentInk,100);
});
test('refund cap and minimum net spend apply, repeated settlement is idempotent',()=>{
 const ink=new InkResourceManager();ink.begin(1);ink.extend(720*5);assert.ok(ink.settle(1,true,'line','release'));close(ink.last.cost,81);close(ink.last.refund,7);assert.equal(ink.settle(1,true,'line','release'),false);
 ink.setAmount(100);ink.begin(2);ink.extend(720*.07);ink.settle(2,true,'line','release');assert.ok(ink.last.cost-ink.last.refund>=6);assert.ok(ink.currentInk<=100);
});
test('practice defaults unlimited, finite mode charges and helper casts reject whole unaffordable glyphs',()=>{
 const {g,input}=setup();g.start(false,true);assert.equal(g.ink.unlimited,true);for(let i=0;i<20;i++){down(input);move(input,340);up(input,340);}close(g.ink.currentInk,100);
 g.ink.setUnlimited(false);down(input);move(input,340);up(input,340);assert.ok(g.ink.currentInk<100);g.ink.setAmount(8);const r=recognize([{x:100,y:500},{x:500,y:500}]);assert.equal(g.cast(r),false);close(g.ink.currentInk,8);g.start();assert.equal(g.ink.unlimited,false);close(g.ink.currentInk,100);
});
test('HUD catches immediate first refund, small gains, new-stroke debits and priority empty feedback',()=>{
 const ink=new InkResourceManager(),hud=new InkHUD();ink.begin(1);ink.extend(240);ink.settle(1,true,'line','release');hud.update(ink,.05);assert.equal(hud.notice.text,'回墨 +1.1');assert.ok(hud.displayedInk<ink.currentInk);
 ink.begin(2);ink.extend(240);hud.update(ink,.02);close(hud.displayedInk,ink.currentInk);ink.cancel();ink.setAmount(0);ink.begin(3);hud.update(ink,.05);assert.equal(hud.notice.text,'灵墨不足');close(hud.displayedInk,0);
 ink.setAmount(8);ink.begin(4);ink.extend(300);ink.settle(4,true,'line','release');hud.update(ink,.02);assert.equal(hud.notice.text,'回墨 +0.8');
 ink.begin(5);hud.update(ink,.02);assert.equal(hud.notice.text,'灵墨不足','empty feedback overrides unfinished refund animation');
});
test('background-style cancel restores cost, completed timeout never rolls back, automatic tiny input rejected',()=>{
 const {g,input}=setup();g.ink.delay=.2;down(input);move(input,340);input.cancel();close(g.ink.currentInk,100);close(g.ink.delay,.2);
 down(input);move(input,340);input.update(3);const balance=g.ink.currentInk;input.cancel();close(g.ink.currentInk,balance);assert.equal(g.ink.pending,null);assert.equal(g.ink.isWaitingRelease,false);
 const ink=new InkResourceManager();assert.equal(ink.automatic(50),null);close(ink.currentInk,100);
});
console.log(`${count} ink suites passed`);
