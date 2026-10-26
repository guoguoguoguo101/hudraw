import type {Enemy} from '../src/core/types';
import assert from 'node:assert/strict';
import {DualBrush,DUAL_BRUSH_TIERS} from '../src/gameplay/dual-brush';
import {Game} from '../src/gameplay/game';
const bounds={left:26,right:694,top:280,bottom:962};
const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;
const template=g.spawn('ink',{x:0,y:0})!;let id=100;const enemy=(x:number,y:number,kind:'ink'|'boss'='ink'):Enemy=>({...template,kind,x,y,id:++id,hp:1000});
let suites=0;function test(name:string,fn:()=>void){fn();suites++;console.log('PASS dual brush: '+name);}
test('four tiers keep 1/2/2/2 paths, ratio damage and shared cross-stroke hit limits',()=>{
 for(let level=1;level<=4;level++){
  const m=new DualBrush();m.level=level;m.begin();m.trace({x:100,y:500},{x:300,y:500},30,16);
  assert.equal(m.sides.length,level===1?1:2);
  const targets=[enemy(200,550),enemy(200,450)],damage=(e:typeof targets[number],n:number)=>{e.hp-=n;};
  m.advance(1/60,targets,damage,bounds);assert.equal(targets[0].hp,1000-30*DUAL_BRUSH_TIERS[level].ratio);assert.equal(targets[1].hp,level===1?1000:targets[0].hp);
  m.end();m.begin();m.trace({x:100,y:500},{x:300,y:500},30,16);m.advance(1/60,targets,damage,bounds);assert.equal(targets[0].hp,1000-30*DUAL_BRUSH_TIERS[level].ratio);
 }
});
test('Lv3 has smooth live contours, follows S strokes, never seeks',()=>{
 const m=new DualBrush();m.level=3;m.begin();let a={x:100,y:600};
 for(let i=1;i<=35;i++){const b={x:100+i*8,y:600+40*Math.sin(i/8)};m.trace(a,b,30,16);m.advance(1/60,[enemy(b.x,b.y+60)],()=>{},bounds);a=b;}
 assert.ok(m.sides.every(s=>!s.lunge&&s.path.length>10));
 for(const s of m.sides)for(let i=1;i<s.path.length;i++)assert.ok(Math.hypot(s.path[i].x-s.path[i-1].x,s.path[i].y-s.path[i-1].y)<15);
});
test('tight reversals remain continuous and bounded',()=>{
 const m=new DualBrush();m.level=3;m.begin();let a={x:300,y:600};for(let i=0;i<100;i++){const b={x:a.x+(i%2?5:-5),y:a.y+1};m.trace(a,b,30,16);a=b;}
 for(const side of m.sides)for(let i=1;i<side.path.length;i++)assert.ok(Math.hypot(side.path[i].x-side.path[i-1].x,side.path[i].y-side.path[i-1].y)<22);
});
test('only Lv4 acquires two distinct nearby targets; boss may be shared',()=>{
 for(const level of [3,4]){
  const m=new DualBrush();m.level=level;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);
  const targets=[enemy(255,680),enemy(255,520),enemy(500,600)];m.advance(1/60,targets,()=>{},bounds);
  assert.equal(m.sides.filter(s=>s.lunge).length,level===4?2:0);
  if(level===4)assert.equal(new Set(m.sides.map(s=>s.lunge!.targetId)).size,2);
 }
 const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);const boss=enemy(280,600,'boss');m.advance(.016,[boss],()=>{},bounds);assert.ok(m.sides.every(s=>s.lunge?.targetId===boss.id));
});
test('lunges actually damage once each at 30/60/120 fps and finish after release',()=>{
 for(const fps of [30,60,120]){
  const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);
  const targets=[enemy(250,680),enemy(250,520)],counts=new Map<number,number>();const damage=(e:typeof targets[number],n:number)=>{e.hp-=n;counts.set(e.id,(counts.get(e.id)??0)+1);};
  m.advance(1/fps,targets,damage,bounds);assert.ok(m.sides.every(s=>s.lunge));m.end();
  for(let i=0;i<fps;i++)m.advance(1/fps,targets,damage,bounds);
  assert.deepEqual(targets.map(e=>counts.get(e.id)),[1,1]);assert.ok(m.sides.every(s=>!s.lunge&&s.path.length===0));
 }
});
test('stationary brush never reacquires; movement and cooldown both required',()=>{
 const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);const targets=[enemy(250,680),enemy(250,520)];m.advance(.016,targets,()=>{},bounds);
 for(let i=0;i<80;i++)m.advance(.016,targets,()=>{},bounds);assert.ok(m.sides.every(s=>!s.lunge));
 m.trace({x:240,y:600},{x:250,y:600},30,16);m.advance(.016,targets,()=>{},bounds);assert.ok(m.sides.every(s=>s.lunge));m.end(true);assert.ok(m.sides.every(s=>!s.lunge));
});
test('clipped paths cannot hit outside arena, large jumps cannot produce cross-screen lunges',()=>{
 const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);const targets=[enemy(250,680)];m.advance(.016,targets,()=>{},bounds);
 m.trace({x:240,y:600},{x:600,y:600},30,16);m.advance(.016,targets,()=>{},bounds);assert.ok(m.sides.every(s=>!s.lunge));
 const outside=enemy(300,100);m.begin();m.trace({x:200,y:74},{x:400,y:74},30,16);m.advance(.016,[outside],()=>{throw new Error('outside damage');},bounds);
});
test('real battle secondary hit neither paints nor earns direct-brush kill credit',()=>{
 const game=new Game();game.start(false,true,false,false,true);game.director.disabled=true;game.hualing.frozen=true;
 let paintCalls=0;const paint=game.hualing.traceScene.bind(game.hualing);game.hualing.traceScene=(a,b)=>{paintCalls++;paint(a,b);};
 game.hualing.upgrades.setLevel('splash',1);const e=game.spawn('ink',{x:260,y:552})!;e.hp=1;
 game.beginHualingStroke();game.strokeHualing({x:100,y:500},{x:380,y:500});assert.equal(e.hp,1);game.advance(1/60,true);
 assert.equal(paintCalls,1);assert.ok(e.hp<=0);assert.equal(game.hualing.combo.strokeKills,0);assert.equal(game.hualing.combo.count,1);assert.equal(game.hualing.upgrades.carp.fishes.length,0);assert.equal(game.hualing.upgrades.trail.segments.length,0);
});
console.log(`PASS ${suites} dual brush suites`);
