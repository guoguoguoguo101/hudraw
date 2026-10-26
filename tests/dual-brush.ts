import type {Enemy} from '../src/core/types';
import assert from 'node:assert/strict';
import {DualBrush,DUAL_BRUSH_TIERS,DUAL_SWIM,PAPER_DRAGON_MOTION} from '../src/gameplay/dual-brush';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
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
test('Lv3 and Lv4 swim while held still, including a pointer down with no movement',()=>{
 for(const level of [3,4]){
  const m=new DualBrush();m.level=level;m.begin({x:350,y:650});m.advance(.1,[],()=>{},bounds);
  const before=m.geometry(m.sides[0],bounds);for(let i=0;i<90;i++)m.advance(1/60,[],()=>{},bounds);
  const after=m.geometry(m.sides[0],bounds);assert.equal(m.opacity,1);assert.equal(after.length,PAPER_DRAGON_MOTION.samples);
  assert.ok(after.some((p,i)=>Math.hypot(p.x-before[i].x,p.y-before[i].y)>3),'held-still body and tail continue swimming');
  const arc=after.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-after[i].x,p.y-after[i].y),0);assert.ok(Math.abs(arc-(level===4?316:170))<.01,'swimming bends the complete body instead of shrinking it');
  m.end();for(let i=0;i<30;i++)m.advance(1/60,[],()=>{},bounds);assert.equal(m.opacity,0);assert.ok(m.sides.every(s=>!s.path.length));
 }
});
test('body cadence is identical for stationary, slow and fast brush input at 30/60/120 fps',()=>{
 for(const level of [3,4]){
  const poses:number[][]=[];
  for(const fps of [30,60,120])for(const speed of [0,25,900]){
   const m=new DualBrush();m.level=level;m.begin();let a={x:300,y:650};m.trace(a,{x:304,y:650},30,16);a={x:304,y:650};
   for(let i=0;i<fps;i++){if(speed){const b={x:a.x+speed/fps,y:a.y};m.trace(a,b,30,16);a=b;}m.advance(1/fps,[],()=>{},bounds);}
   const path=m.geometry(m.sides[0],bounds),head=path.at(-1)!;poses.push(path.flatMap(p=>[p.x-head.x,p.y-head.y]));assert.equal(m.opacity,1);
  }
  for(const pose of poses)assert.ok(pose.every((n,i)=>Math.abs(n-poses[0][i])<1e-6),'input speed never advances or slows the body wave');
 }
});
test('fast drags and reversals steer gently without teleporting the swimming center',()=>{
 for(const level of [3,4]){
  const m=new DualBrush();m.level=level;m.begin();m.trace({x:300,y:650},{x:304,y:650},30,16);m.advance(.1,[],()=>{},bounds);
  const head=()=>m.geometry(m.sides[0],bounds).at(-1)!;const before=head();
  m.trace({x:304,y:650},{x:650,y:650},30,16);assert.deepEqual(head(),before,'pointer events cannot teleport the head');m.advance(1/60,[],()=>{},bounds);
  assert.ok(Math.hypot(head().x-before.x,head().y-before.y)<12,'even a large drag moves the swimming head only a small distance per frame');
  const prior=m.geometry(m.sides[0],bounds),a=prior.at(-1)!,b=prior.at(-2)!;
  m.trace({x:650,y:650},{x:100,y:650},30,16);m.advance(1/60,[],()=>{},bounds);
  const next=m.geometry(m.sides[0],bounds),c=next.at(-1)!,d=next.at(-2)!;
  const turn=Math.abs(Math.atan2((a.x-b.x)*(c.y-d.y)-(a.y-b.y)*(c.x-d.x),(a.x-b.x)*(c.x-d.x)+(a.y-b.y)*(c.y-d.y)));
  assert.ok(turn<=(DUAL_SWIM.turn+DUAL_SWIM.yaw*PAPER_DRAGON_MOTION.frequency)/60+1e-6,'steering and the natural head stroke remain smooth on a reversal');
 }
});
test('stationary companions visibly cruise and send large bends through the middle and tail',()=>{
 for(const level of [3,4]){
  const m=new DualBrush();m.level=level;m.begin();m.trace({x:300,y:650},{x:304,y:650},30,16);
  const tails:number[]=[],middles:number[]=[],heads:number[]=[];
  for(let i=0;i<180;i++){m.advance(1/120,[],()=>{},bounds);const path=m.geometry(m.sides[0],bounds),head=path.at(-1)!;tails.push(path[0].y-head.y);middles.push(path[24].y-head.y);heads.push(head.x);}
  const span=(ns:number[])=>Math.max(...ns)-Math.min(...ns);
  assert.ok(span(heads)>20,'head actually cruises through space without pointer movement');
  assert.ok(span(tails)>(level===4?65:35),'tail stroke is clearly visible at phone scale');
  assert.ok(span(middles)>(level===4?20:10),'the middle of the body bends, not just its tip');
  assert.ok(m.sides.every(s=>!s.lunge),'swimming never restores automatic attacks');
 }
});
test('real pointer down passes its origin to both swimming tiers; pause freezes the pose',()=>{
 for(const level of [3,4]){
  const game=new Game();game.start(false,true,false,false,true);game.director.disabled=true;game.hualing.frozen=true;game.enemies=[];game.hualing.upgrades.setLevel('splash',level);
  const input=new InputController({input:()=>{}} as unknown as PlatformAdapter,{} as never,()=>game.active,()=>false,()=>false,undefined,game.pen,game.ink);
  input.simpleBrush=()=>true;input.onSimpleStroke=(phase,origin)=>phase==='begin'?game.beginHualingStroke(origin):game.endHualingStroke(phase==='cancel');
  input.event({kind:'down',id:1,x:350,y:650});for(let i=0;i<60;i++)game.advance(1/60,true);
  const m=game.hualing.upgrades.dual;assert.equal(m.sides.length,2);assert.equal(m.opacity,1);const pose=m.geometry(m.sides[0],bounds);
  game.pause();for(let i=0;i<60;i++)game.advance(1/60,true);assert.deepEqual(m.geometry(m.sides[0],bounds),pose);game.pause();
  input.event({kind:'up',id:1,x:350,y:650});assert.equal(m.drawing,false);
 }
});
test('Lv3 and Lv4 never lock onto nearby enemies or bosses',()=>{
 for(const level of [3,4]){
  const m=new DualBrush();m.level=level;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);
  const targets=[enemy(255,680),enemy(255,520),enemy(500,600)];m.advance(1/60,targets,()=>{},bounds);
  assert.equal(m.sides.filter(s=>s.lunge).length,0);
 }
 const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);const boss=enemy(280,600,'boss');m.advance(.016,[boss],()=>{},bounds);assert.ok(m.sides.every(s=>!s.lunge));
});
test('brush contact still damages once at 30/60/120 fps without a lunge or post-release attacks',()=>{
 for(const fps of [30,60,120]){
  const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);
  const targets=[enemy(250,680),enemy(250,520)],counts=new Map<number,number>();const damage=(e:typeof targets[number],n:number)=>{e.hp-=n;counts.set(e.id,(counts.get(e.id)??0)+1);};
  m.advance(1/fps,targets,damage,bounds);assert.ok(m.sides.every(s=>!s.lunge));m.end();
  for(let i=0;i<fps;i++)m.advance(1/fps,targets,damage,bounds);
  assert.deepEqual(targets.map(e=>counts.get(e.id)),[1,1]);assert.ok(m.sides.every(s=>!s.lunge&&s.path.length===0));
 }
});
test('nearby enemies never trigger attacks while held still or during renewed movement',()=>{
 const m=new DualBrush();m.level=4;m.begin();m.trace({x:200,y:600},{x:240,y:600},30,16);const targets=[enemy(250,680),enemy(250,520)];m.advance(.016,targets,()=>{},bounds);
 for(let i=0;i<80;i++)m.advance(.016,targets,()=>{},bounds);assert.ok(m.sides.every(s=>!s.lunge));
 m.trace({x:240,y:600},{x:250,y:600},30,16);m.advance(.016,targets,()=>{},bounds);assert.ok(m.sides.every(s=>!s.lunge));m.end(true);assert.ok(m.sides.every(s=>!s.lunge));
});
test('enemies cannot change the swimming pose or cause idle damage',()=>{
 for(const level of [3,4]){
  const withEnemies=new DualBrush(),empty=new DualBrush();for(const m of [withEnemies,empty]){m.level=level;m.begin({x:350,y:650});}
  const targets=[enemy(370,650),enemy(330,650),enemy(350,670,'boss')];
  for(let i=0;i<120;i++){withEnemies.advance(1/60,targets,(e,n)=>e.hp-=n,bounds);empty.advance(1/60,[],()=>{},bounds);}
  assert.deepEqual(targets.map(e=>e.hp),[1000,1000,1000]);
  for(let side=0;side<2;side++)assert.deepEqual(withEnemies.geometry(withEnemies.sides[side],bounds),empty.geometry(empty.sides[side],bounds));
 }
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
