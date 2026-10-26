import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {atPath,SPIRIT_CARDS,type SpiritCard} from '../src/gameplay/hualing';
import {SceneSeal} from '../src/gameplay/scene-seal';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
import {recognize,type Point} from '../src/input/recognizer';
import {ScrollJourney} from '../src/gameplay/scroll-journey';
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;return g;};
const step=(g:Game,n:number)=>{for(let t=0;t<n;t+=1/60)g.advance(1/60);};
let suites=0;function test(name:string,run:()=>void){run();suites++;console.log('PASS hualing: '+name);}
test('isolated simple brush rejects all rune casts; old experiment still available',()=>{
 const g=game();assert.ok(g.hualingPractice&&g.practice&&g.ink.unlimited);
 for(const rune of ['line','circle','triangle','z'] as const)assert.equal(g.cast(rune),false);
 g.menu();g.start(false,true,false,true);assert.ok(g.functionalRelics.enabled);assert.equal(g.cast('triangle'),true);
});
test('every card demo runs the same input and completion rules, no ordinary casts or costs',()=>{
 for(const card of ['dragon'] as SpiritCard[]){const g=game(),m=g.hualing;m.select(card);m.demo();assert.equal(m.selected,null,card+' should finish');assert.equal(g.formalCasts,0);assert.equal(g.ink.currentInk,100);assert.ok(m.effects.some(f=>f.kind===card));}
});
test('removed mountain and rift cannot be selected or produce effects',()=>{const m=game().hualing;assert.deepEqual(Object.keys(SPIRIT_CARDS),['dragon']);for(const id of ['mountain','rift']){assert.equal((m.select as (id:string)=>unknown)(id),false);assert.equal(m.selected,null);assert.equal(m.effects.length,0);}});

test('wrong pointer, short touch, cancellation, off-canvas releases never produce an effect',()=>{
 const m=game().hualing;m.select('dragon');m.handle({kind:'down',id:1,x:200,y:450});m.handle({kind:'up',id:2,x:500,y:450});assert.equal(m.pointer,1);m.handle({kind:'cancel',id:1,x:200,y:450});assert.equal(m.effects.length,0);
 m.handle({kind:'down',id:3,x:200,y:450});m.handle({kind:'up',id:3,x:205,y:450});assert.equal(m.effects.length,0);assert.equal(m.selected,'dragon');
 m.handle({kind:'down',id:4,x:200,y:450});m.handle({kind:'move',id:4,x:500,y:450});m.handle({kind:'up',id:4,x:500,y:1200});assert.equal(m.effects.length,0);assert.equal(m.pointer,null);
});


test('dragon sweeps real curved route, hits once and never damages the chord',()=>{
 const g=game(),m=g.hualing;m.frozen=true;const hit=g.spawn('oni',{x:300,y:430})!,outside=g.spawn('oni',{x:440,y:560})!;hit.speed=outside.speed=0;hit.ai=outside.ai='Approach';
 m.select('dragon');m.handle({kind:'down',id:1,x:150,y:650});for(const p of [{x:150,y:430},{x:300,y:430},{x:550,y:430}])m.handle({kind:'move',id:1,...p});m.handle({kind:'up',id:1,x:550,y:430});step(g,2.5);assert.equal(hit.hp,hit.maxHp-160);assert.equal(outside.hp,outside.maxHp);assert.equal(g.casts,0);
});


test('pause freezes effects, reset and menu clear state',()=>{
 const g=game(),m=g.hualing;m.select('dragon');m.demo();const age=m.effects[0].age;g.pause();step(g,1);assert.equal(m.effects[0].age,age);g.pause();step(g,.2);assert.ok(m.effects[0].age>age);g.menu();assert.equal(m.effects.length,0);
});
test('scene seal accepts any section in either direction, preserves union of coverage, ignores retracing',()=>{
 const m=game().hualing,s=m.sceneSeal,c=s.center(m.bounds),world=(p:{x:number;y:number})=>({x:p.x+c.x,y:p.y+c.y});
 const path=s.paths[1];m.traceScene(world(path[1]),world(path[0]));const first=s.progress;assert.ok(first>.05&&first<.3);
 m.traceScene(world(path[0]),world(path[1]));assert.equal(s.progress,first);
 m.cancelInput();assert.equal(s.progress,first);assert.equal(s.phase,'repairing');
 m.traceScene({x:70,y:750},{x:150,y:750});assert.equal(s.progress,first);
 for(const p of [...s.paths].reverse())for(let i=p.length-1;i>0;i--)m.traceScene(world(p[i]),world(p[i-1]));
 assert.equal(s.progress,1);assert.equal(s.phase,'collecting');assert.equal(m.effects.length,0);
 for(const p of s.paths)for(let i=1;i<p.length;i++)m.traceScene(world(p[i-1]),world(p[i]));assert.equal(s.phase,'collecting');
});
test('a crossing only lights the touched section, invalid and off-arena segments do not advance',()=>{
 const m=game().hualing,s=m.sceneSeal,c=s.center(m.bounds);
 m.traceScene({x:c.x-100,y:c.y-80},{x:c.x-100,y:c.y-10});assert.ok(s.progress>0&&s.progress<.15);
 const progress=s.progress;m.traceScene({x:NaN,y:450},{x:400,y:450});m.traceScene({x:-600,y:450},{x:-300,y:450});assert.equal(s.progress,progress);
 assert.equal(s.phase,'repairing');
});
test('live brush hits before release, never recognizes shapes, never slows time or times out',()=>{
 const g=game(),m=g.hualing;const target=g.spawn('oni',{x:300,y:600})!;target.speed=0;
 const input=new InputController({input:()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);
 input.simpleBrush=()=>g.hualingPractice;input.onStrokeSegment=(a,b)=>g.strokeHualing(a,b);
 input.event({kind:'down',id:1,x:200,y:600});input.event({kind:'move',id:2,x:400,y:600});assert.equal(target.hp,240);
 input.event({kind:'move',id:1,x:400,y:600});assert.equal(target.hp,210);assert.equal(input.drawing,true);
 input.event({kind:'move',id:1,x:200,y:600});assert.equal(target.hp,210);
 for(let i=0;i<240;i++){g.advance(1/60,true);input.update(1/60);}
 assert.ok(Math.abs(g.clock.world-4)<.02);assert.equal(input.drawing,true);assert.equal(input.preview,null);assert.equal(target.hp,210);
 input.event({kind:'up',id:1,x:200,y:600});assert.equal(g.casts,0);assert.equal(g.skills.length,0);assert.equal(g.freeSlashes.items.length,0);
 assert.equal(g.ink.pending,null);assert.equal(input.last,null);
});
test('brush has local swept hits and cooldown across strokes, does not hit from old ink, respects pause and modes',()=>{
 const g=game();const e=g.spawn('oni',{x:300,y:500})!,outside=g.spawn('oni',{x:300,y:600})!;e.speed=outside.speed=0;
 g.strokeHualing({x:200,y:500},{x:400,y:500});assert.equal(e.hp,210);assert.equal(outside.hp,240);
 g.strokeHualing({x:400,y:500},{x:200,y:500});assert.equal(e.hp,210);step(g,.4);assert.equal(e.hp,210);
 g.strokeHualing({x:200,y:500},{x:400,y:500});assert.equal(e.hp,180);
 g.pause();step(g,1);g.strokeHualing({x:200,y:500},{x:400,y:500});assert.equal(e.hp,180);g.pause();
 step(g,.4);g.hualing.select('dragon');g.strokeHualing({x:200,y:500},{x:400,y:500});assert.equal(e.hp,180);
 g.hualing.cancel();g.strokeHualing({x:300,y:500},{x:300,y:500});assert.equal(e.hp,180);
 g.strokeHualing({x:NaN,y:500},{x:400,y:500});assert.equal(e.hp,180);
 g.start(false,true);const old=g.spawn('oni',{x:300,y:500})!;g.strokeHualing({x:200,y:500},{x:400,y:500});assert.equal(old.hp,240);
});
test('collecting stores one card, canceled or invalid drops retain it, valid drop damages once',()=>{
 const g=game(),m=g.hualing,s=m.sceneSeal,c=s.center(m.bounds);
 for(const path of s.paths)for(let i=1;i<path.length;i++)m.traceScene({x:path[i-1].x+c.x,y:path[i-1].y+c.y},{x:path[i].x+c.x,y:path[i].y+c.y});
 step(g,1);assert.equal(s.phase,'stored');assert.equal(s.bursts.length,0);
 const slot=s.slot(m.bounds);m.handle({kind:'down',id:4,...slot});m.handle({kind:'cancel',id:4,...slot});assert.equal(s.phase,'stored');
 m.handle({kind:'down',id:4,...slot});m.handle({kind:'up',id:4,x:-30,y:500});assert.equal(s.phase,'stored');
 m.handle({kind:'down',id:4,...slot});m.handle({kind:'up',id:4,...slot});assert.equal(s.phase,'stored');
 const hit=g.spawn('oni',{x:360,y:480})!,outside=g.spawn('oni',{x:650,y:480})!;hit.speed=outside.speed=0;hit.ai=outside.ai='Approach';m.frozen=true;
 m.handle({kind:'down',id:4,...slot});m.handle({kind:'up',id:5,x:360,y:480});assert.equal(s.phase,'stored');
 m.handle({kind:'move',id:4,x:360,y:480});m.handle({kind:'up',id:4,x:360,y:480});assert.equal(s.phase,'spent');step(g,.3);
 assert.equal(hit.hp,hit.maxHp-120);assert.equal(outside.hp,outside.maxHp);step(g,.3);assert.equal(hit.hp,hit.maxHp-120);
 assert.equal(m.handle({kind:'down',id:6,...slot}),false);
});
test('scene pauses safely, keeps coverage when switching experiments, reset clears reward and effects',()=>{
 const g=game(),m=g.hualing,s=m.sceneSeal,c=s.center(m.bounds);
 m.traceScene({x:c.x-145,y:c.y-45},{x:c.x-55,y:c.y-45});const progress=s.progress;
 m.select('dragon');m.traceScene({x:c.x,y:c.y-40},{x:c.x,y:c.y+35});assert.equal(s.progress,progress);m.cancel();assert.equal(s.progress,progress);
 const age=s.age;g.pause();step(g,.5);assert.equal(s.age,age);assert.equal(s.progress,progress);g.pause();step(g,.1);assert.ok(s.age>age);
 s.phase='stored';m.handle({kind:'down',id:2,...s.slot(m.bounds)});m.cancelInput();assert.equal(s.dragPointer,null);assert.equal(s.phase,'stored');
 m.reset();assert.equal(s.progress,0);assert.equal(s.phase,'repairing');assert.equal(s.bursts.length,0);assert.equal(s.dragPointer,null);
});
const circleAt=(p:Point,r:number)=>Array.from({length:81},(_,i)=>({x:p.x+Math.cos(i/80*Math.PI*2)*r,y:p.y+Math.sin(i/80*Math.PI*2)*r}));
const lineBetween=(a:Point,b:Point)=>Array.from({length:25},(_,i)=>({x:a.x+(b.x-a.x)*i/24,y:a.y+(b.y-a.y)*i/24}));
test('chain cuts follow only painted coverage and retain progress across strokes',()=>{
 const g=game(),m=g.hualing,s=m.sceneSeal;s.setMode('chain');const c=s.center(m.bounds),world=(p:Point)=>({x:p.x+c.x,y:p.y+c.y});
 const first=s.paths[0];m.traceScene(world(first[0]),world(first[1]));assert.ok(s.progress>.3&&s.progress<.6);assert.ok(s.fragments.length>0);
 const progress=s.progress;m.traceScene(world(first[1]),world(first[0]));assert.equal(s.progress,progress);
 for(const path of s.paths.slice(1))m.traceScene(world(path[0]),world(path[1]));
 assert.equal(s.phase,'collecting');step(g,1);assert.equal(s.phase,'stored');
});
test('fire collects by local brush contact, retains partial progress and waits for all five',()=>{
 const g=game(),m=g.hualing,s=m.sceneSeal;s.setMode('fire');const c=s.center(m.bounds);
 for(let i=0;i<5;i++){const p=s.flames[i],a={x:c.x+p.x-30,y:c.y+p.y},b={x:c.x+p.x+30,y:c.y+p.y};m.traceScene(a,b);m.traceScene(b,a);assert.equal(s.captured.size,i+1);if(i<4)assert.equal(s.phase,'repairing');}
 assert.equal(s.phase,'collecting');step(g,1);assert.equal(s.phase,'stored');assert.equal(s.damage,210);
});
test('circling fire without touching it does not collect it',()=>{
 const m=game().hualing,s=m.sceneSeal;s.setMode('fire');const c=s.center(m.bounds),p=s.flames[0],points=circleAt({x:c.x+p.x,y:c.y+p.y},50);
 for(let i=1;i<points.length;i++)m.traceScene(points[i-1],points[i]);assert.equal(s.captured.size,0);
});
test('tiger is claimed directly without shadow tracing, then dragged to summon',()=>{
 const g=game(),m=g.hualing;m.claimSummon('beast');const s=m.scenes.find(s=>s.mode==='beast')!,c=s.center(m.bounds);
 assert.equal(s.phase,'stored');assert.equal(s.progress,0);assert.deepEqual(s.paths,[]);assert.equal(s.beast.alive,false);
 const slot=s.slot(m.bounds);m.handle({kind:'down',id:11,...slot});m.handle({kind:'up',id:11,x:m.bounds.left+5,y:c.y});assert.equal(s.phase,'stored');
 const target=g.spawn('oni',{x:c.x+60,y:c.y+20})!;target.speed=0;target.ai='Approach';m.frozen=true;
 m.handle({kind:'down',id:11,...slot});m.handle({kind:'up',id:11,...c});assert.equal(s.phase,'spent');step(g,.25);assert.ok(s.beast.alive);
 step(g,2);assert.ok(target.hp<target.maxHp);const remaining=s.beast.state!.remaining;g.pause();step(g,.5);assert.equal(s.beast.state!.remaining,remaining);g.pause();
 s.reset();assert.equal(s.beast.state,null);assert.equal(s.progress,0);assert.equal(s.mode,'beast');
});
test('chain reward is a wide narrow sweep, fire reward scales and neither damages twice',()=>{
 for(const mode of ['chain','fire'] as const){
  const g=game(),m=g.hualing,s=m.sceneSeal;s.setMode(mode);s.phase='stored';s.power=5;const c=s.center(m.bounds),slot=s.slot(m.bounds);
  const hit=g.spawn('oni',{x:c.x+(mode==='chain'?220:170),y:c.y})!,outside=g.spawn('oni',{x:c.x,y:c.y+230})!;hit.speed=outside.speed=0;hit.ai=outside.ai='Approach';m.frozen=true;
  m.handle({kind:'down',id:7,...slot});m.handle({kind:'up',id:7,...c});step(g,.25);assert.equal(hit.hp,hit.maxHp-(mode==='chain'?160:210));assert.equal(outside.hp,outside.maxHp);step(g,.4);assert.equal(hit.hp,hit.maxHp-(mode==='chain'?160:210));
 }
});
test('switching prototypes cancels pending drag, reward and damage; outside hualing has no interaction',()=>{
 const g=game(),m=g.hualing,s=m.sceneSeal;s.phase='stored';s.handle({kind:'down',id:1,...s.slot(m.bounds)},m.bounds);s.setMode('fire');assert.equal(s.dragPointer,null);assert.equal(s.phase,'repairing');assert.equal(s.bursts.length,0);
 s.phase='stored';s.handle({kind:'down',id:2,...s.slot(m.bounds)},m.bounds);s.handle({kind:'up',id:2,...s.center(m.bounds)},m.bounds);assert.equal(s.bursts.length,1);s.setMode('chain');assert.equal(s.bursts.length,0);
 g.start(false,true);g.hualing.sceneSeal.setMode('fire');const c=g.hualing.sceneSeal.center(g.hualing.bounds);assert.ok(g.cast(recognize(circleAt(c,230))));assert.equal(g.hualing.sceneSeal.phase,'repairing');
});
test('landscape clock blends warm/dusk/night continuously, manual previews and invalid time are safe',()=>{
 const j=new ScrollJourney();assert.equal(j.stage,'sunset');assert.deepEqual(j.weights,[1,0,0]);j.advance(NaN);j.advance(-3);assert.equal(j.time,0);
 for(let i=0;i<90;i++){j.advance(1);assert.ok(Math.abs(j.weights.reduce((a,b)=>a+b,0)-1)<1e-9);assert.ok(j.weights.every(v=>v>=0&&v<=1));}
 assert.equal(j.stage,'night');assert.equal(j.night,1);j.preview('wind');assert.equal(j.stage,'wind');const t=j.time;j.advance(10);assert.equal(j.time,t);j.resume();j.advance(1);assert.equal(j.time,t+1);j.reset();assert.equal(j.time,0);
});
test('landscape uses real drawing time, pauses with the game but not with enemy freeze',()=>{
 const g=game(),m=g.hualing;m.frozen=true;for(let i=0;i<60;i++)g.advance(1/60,true);assert.ok(Math.abs(m.journey.time-1)<.01);assert.ok(g.time<m.journey.time);
 g.pause();step(g,1);assert.ok(Math.abs(m.journey.time-1)<.01);g.pause();step(g,1);assert.ok(Math.abs(m.journey.time-2)<.01);
});
test('automatic journey introduces fire and chain; in-flight brush and card drags defer event replacement',()=>{
 const g=game(),m=g.hualing;m.journey.time=31.95;g.advance(.1,true);assert.equal(m.sceneSeal.mode,'seal');g.advance(.02,false);assert.equal(m.sceneSeal.mode,'fire');
 m.sceneSeal.phase='stored';m.handle({kind:'down',id:4,...m.sceneSeal.slot(m.bounds)});m.journey.time=63.95;g.advance(.1);assert.equal(m.sceneSeal.mode,'fire');m.cancelInput();g.advance(.02);assert.equal(m.sceneSeal.mode,'chain');
 assert.equal(m.scenes.find(s=>s.mode==='fire')!.phase,'stored');
});
test('previewing phases preserves partial inscriptions and earned cards in three distinct slots',()=>{
 const g=game(),m=g.hualing,seal=m.sceneSeal,c=seal.center(m.bounds);m.traceScene({x:c.x-145,y:c.y-45},{x:c.x-55,y:c.y-45});const progress=seal.progress;
 m.previewLandscape('wind');m.previewLandscape('sunset');assert.equal(m.sceneSeal,seal);assert.equal(seal.progress,progress);
 for(const path of seal.paths)for(let i=1;i<path.length;i++)m.traceScene({x:c.x+path[i-1].x,y:c.y+path[i-1].y},{x:c.x+path[i].x,y:c.y+path[i].y});step(g,1);assert.equal(seal.phase,'stored');
 m.previewLandscape('wind');const fire=m.sceneSeal;for(const p of fire.flames){const c=fire.center(m.bounds);m.traceScene({x:c.x+p.x-30,y:c.y+p.y},{x:c.x+p.x+30,y:c.y+p.y});}step(g,1);assert.equal(fire.phase,'stored');
 m.previewLandscape('night');const beast=m.sceneSeal,bc=beast.center(m.bounds);for(const path of beast.paths)for(let i=1;i<path.length;i++)m.traceScene({x:bc.x+path[i-1].x,y:bc.y+path[i-1].y},{x:bc.x+path[i].x,y:bc.y+path[i].y});step(g,1);
 assert.equal(beast.phase,'stored');assert.equal(new Set(m.scenes.filter(s=>s.phase==='stored').map(s=>s.slotIndex)).size,3);
 m.handle({kind:'down',id:9,...fire.slot(m.bounds)});assert.equal(fire.dragPointer,9);m.cancelInput();assert.equal(fire.dragPointer,null);assert.equal(fire.phase,'stored');
 const p=seal.slot(m.bounds);m.handle({kind:'down',id:2,...p});m.handle({kind:'up',id:2,x:360,y:550});step(g,.2);assert.equal(seal.phase,'spent');assert.equal(fire.phase,'stored');assert.equal(beast.phase,'stored');assert.ok(seal.bursts[0].hit);
});
test('full inventory queues a fourth reward without overwriting, then stores after a slot frees',()=>{
 const g=game(),m=g.hualing;for(const mode of ['seal','fire','beast'] as const){m.showScene(mode);m.sceneSeal.phase='collecting';step(g,1);}
 m.chooseScene('chain');const waiting=m.sceneSeal;waiting.phase='collecting';step(g,1);assert.equal(waiting.phase,'collecting');assert.equal(m.scenes.filter(s=>s.phase==='stored').length,3);
 const first=m.scenes.find(s=>s.phase==='stored')!;first.phase='spent';step(g,1);assert.equal(waiting.phase,'stored');assert.equal(new Set(m.scenes.filter(s=>s.phase==='stored').map(s=>s.slotIndex)).size,3);
});
test('manual prototype choice persists while scenery flows, restart clears every archived event and clock',()=>{
 const g=game(),m=g.hualing;m.chooseScene('chain');m.journey.time=65;step(g,.2);assert.equal(m.sceneSeal.mode,'chain');assert.equal(m.journey.stage,'night');m.previewLandscape('wind');assert.equal(m.sceneSeal.mode,'fire');m.reset();assert.equal(m.scenes.length,1);assert.equal(m.sceneSeal.mode,'seal');assert.equal(m.journey.time,0);assert.equal(m.journey.automatic,true);
});
test('plain strokes cut chains and collect fire without any spell recognition',()=>{
 const g=game(),m=g.hualing;m.chooseScene('chain');const chain=m.sceneSeal,c=chain.center(m.bounds);
 for(const path of chain.paths)for(let i=1;i<path.length;i++)g.strokeHualing({x:c.x+path[i-1].x,y:c.y+path[i-1].y},{x:c.x+path[i].x,y:c.y+path[i].y});
 assert.equal(chain.phase,'collecting');step(g,1);assert.equal(chain.phase,'stored');
 m.chooseScene('fire');const fire=m.sceneSeal,fc=fire.center(m.bounds);
 for(const p of fire.flames)g.strokeHualing({x:fc.x+p.x-30,y:fc.y+p.y},{x:fc.x+p.x+30,y:fc.y+p.y});
 assert.equal(fire.captured.size,5);assert.equal(fire.phase,'collecting');assert.equal(g.casts,0);
});
test('petal card lasts twelve active seconds, follows brush distance and adds no combat damage',()=>{
 const g=game(),m=g.hualing,p=m.petals,e=g.spawn('oni',{x:300,y:600})!;e.speed=0;
 g.strokeHualing({x:100,y:600},{x:200,y:600});assert.equal(p.petals.length,0);
 p.activate();g.strokeHualing({x:200,y:600},{x:400,y:600});assert.ok(p.petals.length>=6);assert.equal(e.hp,210);
 const y=p.petals[0].y;step(g,.2);assert.ok(p.petals[0].y>y);const count=p.petals.length;
 g.strokeHualing({x:400,y:600},{x:400,y:600});assert.equal(p.petals.length,count);
 assert.equal(g.casts,0);assert.equal(g.skills.length,0);g.pause();const remaining=p.remaining;step(g,1);assert.equal(p.remaining,remaining);g.pause();
 step(g,12);assert.equal(p.active,false);const after=p.petals.length;g.strokeHualing({x:100,y:500},{x:500,y:500});assert.equal(p.petals.length,after);
});
test('petal effect is bounded, refreshes instead of stacking, resets on menu and ignores selected special cards',()=>{
 const g=game(),p=g.hualing.petals;p.activate();for(let i=0;i<500;i++)p.trace({x:50,y:500},{x:650,y:500});assert.ok(p.petals.length<=96);
 step(g,1);p.activate();assert.equal(p.remaining,12);g.hualing.select('dragon');const count=p.petals.length;g.strokeHualing({x:50,y:500},{x:650,y:500});assert.equal(p.petals.length,count);
 g.menu();assert.equal(p.petals.length,0);assert.equal(p.remaining,0);g.start(false,true);g.strokeHualing({x:50,y:500},{x:650,y:500});assert.equal(p.petals.length,0);
});
test('thunder talisman changes only the brush state, expires in real active time and freezes on pause',()=>{
 const g=game(),m=g.hualing,t=m.thunder,e=g.spawn('oni',{x:300,y:600})!;e.speed=0;
 g.strokeHualing({x:100,y:500},{x:200,y:500});assert.equal(t.arcs.length,0);
 t.activate();g.strokeHualing({x:200,y:600},{x:400,y:600});assert.ok(t.arcs.length>0);assert.equal(t.contacts.length,1);assert.equal(e.hp,210);assert.equal(g.casts,0);
 const count=t.arcs.length;g.strokeHualing({x:400,y:600},{x:400,y:600});assert.equal(t.arcs.length,count);
 g.pause();step(g,1);assert.equal(t.remaining,12);assert.equal(t.arcs[0].age,0);g.pause();step(g,.4);assert.equal(t.arcs.length,0);assert.equal(t.contacts.length,0);
 for(let i=0;i<60;i++)g.advance(1/60,true);assert.ok(t.remaining<10.7&&t.remaining>10.4);
 step(g,12);assert.equal(t.active,false);g.strokeHualing({x:100,y:500},{x:500,y:500});assert.equal(t.arcs.length,0);
});
test('thunder refreshes without stacking, caps geometry, coexists with leaves and clears on menu',()=>{
 const g=game(),m=g.hualing,t=m.thunder;t.activate();step(g,1);t.activate();assert.equal(t.remaining,12);
 m.petals.activate();for(let i=0;i<200;i++)g.strokeHualing({x:100,y:500},{x:600,y:500});assert.ok(t.arcs.length<=120);assert.ok(m.petals.petals.length>0);
 m.select('dragon');const count=t.arcs.length;g.strokeHualing({x:100,y:500},{x:600,y:500});assert.equal(t.arcs.length,count);
 g.menu();assert.equal(t.remaining,0);assert.equal(t.arcs.length,0);assert.equal(t.contacts.length,0);
});
console.log(`PASS ${suites} hualing suites`);
