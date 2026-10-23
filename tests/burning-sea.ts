import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {BurningSea,BURNING_SEA as C} from '../src/gameplay/burning-sea';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
import {BRUSH_SKINS} from '../src/input/brush-settings';
import {BURNING_SEA_STYLES} from '../src/gameplay/burning-sea-styles';

const scene=()=>{const g=new Game();g.start(false,true,false,true);g.director.disabled=true;const spawn=g.spawn.bind(g);g.spawn=(kind,at)=>{const e=spawn(kind,at);if(e){e.speed=0;e.ai='Telegraph';e.stateAge=-100;}return e;};return g;};
const input=(g:Game)=>{const i=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink,()=>g.interactionPractice);i.liveInput={handle:e=>g.active&&g.interactionPractice&&g.burningSea.handle(e,g.interactions.bounds),cancel:()=>g.burningSea.cancelStroke()};return i;};
const event=(i:InputController,kind:'down'|'move'|'up',x:number,y=600)=>i.event({kind,x,y,id:1});
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
let count=0;const test=(name:string,fn:()=>void)=>{fn();count++;console.log('PASS burning sea: '+name);};

test('no early damage, no ink charge, all overlapping trails detonate once',()=>{
 const g=scene(),i=input(g),e=g.spawn('oni',{x:360,y:600})!;g.ink.setUnlimited(false);assert.equal(g.activateBurningSea(),true);
 event(i,'down',260);event(i,'move',460);event(i,'move',260);assert.ok(g.burningSea.traces.length);assert.equal(i.drawing,false);
 g.advance(.25);near(e.hp,240);g.advance(5.75);near(e.hp,240-C.blastDamage);assert.equal(g.burningSea.detonations,1);g.advance(.2);near(e.hp,240-C.blastDamage);assert.equal(g.formalCasts,0);assert.equal(g.freeSlashes.totalCasts,0);near(g.ink.currentInk,100);assert.equal(g.ink.pending,null);
 event(i,'up',260);assert.equal(g.burningSea.pointer,null);
});
test('multiple strokes leave no bridge and accept arbitrary curves',()=>{
 const g=scene(),i=input(g);g.activateBurningSea();event(i,'down',100);event(i,'move',140);event(i,'up',140);
 event(i,'down',580);event(i,'move',600,630);event(i,'move',620,600);event(i,'up',640);
 assert.ok(g.burningSea.traces.every(t=>Math.abs(t.a.x-t.b.x)<=C.spacing+.01));
 const e=g.spawn('oni',{x:360,y:600})!;g.advance(.5);near(e.hp,240);
});
test('four real seconds, held pointer cannot turn into a normal glyph after timeout',()=>{
 const g=scene(),i=input(g);g.activateBurningSea();event(i,'down',100);g.advance(3.9);event(i,'move',200);g.advance(.1);
 assert.equal(g.burningSea.active,false);const n=g.burningSea.traces.length;event(i,'move',500);assert.equal(g.burningSea.traces.length,n);assert.equal(i.drawing,false);event(i,'up',500);assert.equal(g.burningSea.pointer,null);
 event(i,'down',200);event(i,'move',500);event(i,'up',500);assert.equal(g.formalCasts,1);
});
test('all early/late trails remain and detonate together after four plus two seconds',()=>{
 const g=scene(),i=input(g),early=g.spawn('oni',{x:100,y:600})!,late=g.spawn('oni',{x:600,y:600})!;g.activateBurningSea();event(i,'down',100);event(i,'up',100);g.advance(3.9);
 event(i,'down',600);event(i,'up',600);const n=g.burningSea.traces.length;g.advance(.1);assert.equal(g.burningSea.phase,'charging');near(g.burningSea.chargeRemaining,2);assert.equal(g.burningSea.traces.length,n);assert.equal(g.activateBurningSea(),false);
 g.advance(1.99);near(early.hp,240);near(late.hp,240);g.advance(.01);near(early.hp,60);near(late.hp,60);assert.equal(g.burningSea.phase,'exploding');assert.equal(g.burningSea.detonations,1);g.advance(.8);assert.equal(g.burningSea.traces.length,0);assert.equal(g.burningSea.phase,'idle');assert.equal(g.activateBurningSea(),true);
});
test('long frames detonate exactly once and use enemy positions at the blast, no bridge damage',()=>{
 const g=scene(),i=input(g),enter=g.spawn('oni',{x:600,y:600})!,leave=g.spawn('oni',{x:100,y:600})!;g.activateBurningSea();event(i,'down',100);event(i,'up',100);g.advance(4);enter.x=100;leave.x=600;g.advance(20);near(enter.hp,60);near(leave.hp,240);assert.equal(g.burningSea.detonations,1);g.advance(20);near(enter.hp,60);assert.equal(g.burningSea.traces.length,0);
});
test('pause freezes drawing window and damage; cancel releases stroke; menu/restart clear',()=>{
 const g=scene(),i=input(g);g.activateBurningSea();event(i,'down',200);g.advance(1);g.pause();i.cancel();g.advance(20);near(g.burningSea.remaining,3);assert.equal(g.burningSea.pointer,null);
 g.pause();g.advance(.5);near(g.burningSea.remaining,2.5);g.menu();assert.equal(g.burningSea.traces.length,0);assert.equal(g.burningSea.active,false);g.start(false,true,false,true);assert.equal(g.burningSea.now,0);
});
test('test arena only, clipping, unlimited strokes, no duration refresh by repeat activation',()=>{
 const g=new Game();g.start();assert.equal(g.activateBurningSea(),false);g.start(false,true);assert.equal(g.activateBurningSea(),true);g.start(false,true,false,true);g.activateBurningSea();g.advance(1);assert.equal(g.activateBurningSea(),false);near(g.burningSea.remaining,3);
 const fire=new BurningSea(),bounds={left:0,right:720,top:250,bottom:1000};fire.begin();fire.handle({kind:'down',id:1,x:0,y:600},bounds);fire.handle({kind:'move',id:1,x:1200,y:600},bounds);assert.ok(fire.traces.every(t=>t.b.x<=720));
 for(let k=0;k<30;k++)fire.handle({kind:'move',id:1,x:k%2?0:720,y:600},bounds);assert.ok(fire.traces.length>768);
});
test('all four equipped brush styles have independent palettes with identical damage and lifetime',()=>{
 assert.deepEqual(Object.keys(BURNING_SEA_STYLES).sort(),BRUSH_SKINS.map(s=>s.id).sort());
 assert.equal(new Set(Object.values(BURNING_SEA_STYLES).map(s=>s.palette.body)).size,4);
 for(const skin of BRUSH_SKINS){const g=scene(),i=input(g),e=g.spawn('oni',{x:360,y:600})!;g.pen.select(skin.id);g.activateBurningSea();event(i,'down',260);event(i,'move',460);event(i,'up',460);g.advance(5.99);near(e.hp,240);g.advance(.01);near(e.hp,60);assert.equal(g.burningSea.detonations,1);near(g.ink.currentInk,100);assert.equal(g.formalCasts,0);}
});
test('pause freezes the charge, and clearing or leaving cancels the pending explosion',()=>{
 const g=scene(),i=input(g),e=g.spawn('oni',{x:360,y:600})!;g.activateBurningSea();event(i,'down',260);event(i,'move',460);event(i,'up',460);g.advance(4);g.pause();g.advance(20);near(g.burningSea.chargeRemaining,2);near(e.hp,240);g.pause();g.advance(1);g.burningSea.clear();g.advance(10);near(e.hp,240);assert.equal(g.burningSea.detonations,0);
 g.activateBurningSea();event(i,'down',260);event(i,'move',460);event(i,'up',460);g.advance(4);g.menu();g.advance(10);assert.equal(g.burningSea.phase,'idle');assert.equal(g.burningSea.traces.length,0);
});
console.log(`PASS ${count} burning-sea groups`);
