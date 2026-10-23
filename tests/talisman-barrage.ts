import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {TalismanBarrage,TALISMAN_BARRAGE as C} from '../src/gameplay/talisman-barrage';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter,InputEvent} from '../src/platform/adapter';

const bounds={left:0,right:720,top:250,bottom:756};
let count=0;const test=(name:string,fn:()=>void)=>{fn();count++;console.log('PASS barrage: '+name);};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const scene=()=>{const g=new Game();g.start(false,true,false,true);g.director.disabled=true;g.interactions.bounds=bounds;return g;};
const input=(g:Game)=>{const i=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink,()=>g.interactionPractice);i.liveInput={handle:e=>g.handleBarrageInput(e),cancel:()=>g.talismanBarrage.cancelInput()};return i;};
const event=(i:InputController,kind:InputEvent['kind'],x:number,y:number,id=1)=>i.event({kind,x,y,id});
const fire=(b:TalismanBarrage,x=650,y=653)=>{assert.ok(b.begin());b.handle({kind:'down',id:1,x,y},bounds);b.handle({kind:'up',id:1,x,y},bounds);assert.equal(b.phase,'charging');};
const target=(g:Game,x:number,y:number)=>{const e=g.spawn('oni',{x,y})!;e.hp=e.maxHp=10000;e.speed=0;e.ai='Telegraph';e.stateAge=-100;return e;};

test('practice gate, explicit aim/release, cancel toggle and exclusive ultimates',()=>{
 const g=new Game();g.start();assert.equal(g.activateTalismanBarrage(),false);g.start(false,true);assert.equal(g.activateTalismanBarrage(),false);
 g.start(false,true,false,true);assert.ok(g.activateTalismanBarrage());assert.equal(g.activateBurningSea(),false);
 assert.ok(g.activateTalismanBarrage());assert.equal(g.talismanBarrage.phase,'idle');assert.ok(g.activateBurningSea());assert.equal(g.activateTalismanBarrage(),false);
});
test('aim input has no rune, ink or fallback side effects; cancel and other fingers never fire',()=>{
 const g=scene(),i=input(g);g.ink.setUnlimited(false);g.activateTalismanBarrage();
 event(i,'down',600,500);event(i,'move',500,400,2);event(i,'up',500,400,2);assert.equal(g.talismanBarrage.phase,'aiming');
 event(i,'cancel',600,500);event(i,'up',600,500);assert.equal(g.talismanBarrage.phase,'aiming');
 event(i,'down',600,500);event(i,'move',600,550);event(i,'up',600,550);assert.equal(g.talismanBarrage.phase,'charging');
 assert.equal(i.drawing,false);assert.equal(g.formalCasts,0);assert.equal(g.freeSlashes.totalCasts,0);assert.equal(g.ink.pending,null);near(g.ink.currentInk,100);
 const direction={...g.talismanBarrage.direction};event(i,'move',100,300);assert.deepEqual(g.talismanBarrage.direction,direction);
});
test('outside release, near-fox tap and nonfinite input do not fire',()=>{
 const g=scene(),b=g.talismanBarrage;g.activateTalismanBarrage();
 b.handle({kind:'down',id:1,x:360,y:653},bounds);b.handle({kind:'up',id:1,x:360,y:653},bounds);assert.equal(b.phase,'aiming');
 b.handle({kind:'down',id:1,x:600,y:400},bounds);b.handle({kind:'up',id:1,x:600,y:900},bounds);assert.equal(b.phase,'aiming');
 b.handle({kind:'down',id:1,x:NaN,y:500},bounds);assert.equal(b.pointer,null);b.advance(NaN,[],()=>{});assert.equal(b.age,0);
});
test('charge then continuous emission; finite projectile pool and four-second emission',()=>{
 const b=new TalismanBarrage();fire(b);b.advance(.3,[],()=>{});assert.equal(b.totalPapers,0);
 b.advance(.1,[],()=>{});assert.ok(b.totalPapers>0);const first=b.totalPapers;b.advance(.8,[],()=>{});assert.ok(b.totalPapers>first);
 let peak=0;for(let i=0;i<500;i++){b.advance(1/120,[],()=>{});peak=Math.max(peak,b.papers.length);}
 assert.ok(peak<=C.maxProjectiles);assert.equal(b.totalPapers,C.lanes*Math.ceil(C.duration/C.interval));assert.equal(b.phase,'idle');assert.equal(b.papers.length,0);assert.equal(b.impacts.length,0);
});
test('directional swept hit, no hit behind/outside corridor, bounded per-volley damage',()=>{
 const g=scene(),front=target(g,610,653),behind=target(g,150,653),outside=target(g,550,350);fire(g.talismanBarrage);
 g.talismanBarrage.advance(8,g.enemies,(e,n)=>e.hp-=n);
 assert.ok(front.hp<10000);near(behind.hp,10000);near(outside.hp,10000);
 assert.ok(10000-front.hp<=C.damage*C.maxHitsPerVolley*Math.ceil(C.duration/C.interval));
});
test('hit totals are identical at 30/60/120 fps and a stalled frame',()=>{
 const run=(dt:number)=>{const g=scene(),e=target(g,610,653);fire(g.talismanBarrage);for(let t=0;t<7-1e-9;t+=dt)g.talismanBarrage.advance(Math.min(dt,7-t),g.enemies,(e,n)=>e.hp-=n);return {damage:10000-e.hp,papers:g.talismanBarrage.totalPapers,phase:g.talismanBarrage.phase};};
 const expected=run(1/60);assert.ok(expected.damage>0);for(const dt of [1/30,1/120,7])assert.deepEqual(run(dt),expected);
});
test('projectile hits each enemy once, pierces front targets before rear targets',()=>{
 const g=scene(),a=target(g,450,653),b=target(g,520,653),c=target(g,590,653),hits:number[]=[];fire(g.talismanBarrage);
 g.talismanBarrage.advance(.351,g.enemies,(e)=>hits.push(e.id));
 // Keep only the center projectile to isolate piercing and swept collision.
 g.talismanBarrage.papers=g.talismanBarrage.papers.filter(p=>Math.abs(p.angle)<.001);
 // Stop launching subsequent volleys while exercising the projectile's remaining life.
 g.talismanBarrage.volleys=Math.ceil(C.duration/C.interval);
 g.talismanBarrage.advance(.5,[c,b,a],e=>hits.push(e.id));assert.deepEqual(hits,[a.id,b.id,c.id]);
});
test('pause/revival freeze, hourglass does not extend cast, clear/restart remove pending damage',()=>{
 const g=scene(),i=input(g);g.activateTalismanBarrage();event(i,'down',650,500);event(i,'up',650,500);g.advance(.5);
 const age=g.talismanBarrage.age;g.pause();g.advance(10);near(g.talismanBarrage.age,age);g.pause();
 g.state='reviving';g.advance(.1);near(g.talismanBarrage.age,age);g.state='playing';
 assert.ok(g.activateHourglass());g.advance(1);near(g.talismanBarrage.age,age+1);
 g.menu();assert.equal(g.talismanBarrage.phase,'idle');assert.equal(g.talismanBarrage.papers.length,0);
 g.start(false,true,false,true);assert.equal(g.talismanBarrage.totalPapers,0);near(g.talismanBarrage.age,0);
});
test('ordinary drawing continues after releasing aim and cannot redirect the barrage',()=>{
 const g=scene(),i=input(g);g.activateTalismanBarrage();event(i,'down',650,500);event(i,'up',650,500);
 const d={...g.talismanBarrage.direction};event(i,'down',150,450);event(i,'move',550,450);event(i,'up',550,450);
 assert.equal(g.formalCasts,1);assert.deepEqual(g.talismanBarrage.direction,d);assert.equal(g.talismanBarrage.phase,'charging');
});
console.log(`PASS ${count} barrage test groups`);
