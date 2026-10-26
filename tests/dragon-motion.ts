import assert from 'node:assert/strict';
import {DragonRoute,dragonFrame,dragonWidth} from '../src/rendering/dragon-motion';
import {Game} from '../src/gameplay/game';
import {pathLength} from '../src/gameplay/hualing';
const route=new DragonRoute([{x:100,y:600},{x:100,y:400},{x:300,y:400},{x:300,y:200}]);
const samples=[.3,.8,1.4,1.6,2.1,2.8,3.2].map(t=>dragonFrame(route.length,t));
for(const state of samples){assert.equal(state.head-state.tail,state.length);assert.equal(state.length,samples[0].length);}
for(let i=1;i<samples.length;i++){assert.ok(samples[i].head>samples[i-1].head);assert.ok(samples[i].tail>samples[i-1].tail);}
assert.deepEqual(route.point(-50),{x:100,y:650});assert.deepEqual(route.point(600),{x:300,y:200});assert.ok(route.point(650).x>300);assert.ok(route.point(650).y<200);
assert.ok(dragonFrame(600,2).head>600);assert.ok(dragonFrame(600,2.9).alpha<dragonFrame(600,2).alpha);assert.equal(dragonFrame(600,3.3).alpha,0);
for(const length of [70,180,350,600,1100,5000]){
 for(const age of [.3,1,1.5,2.4,3.2]){const f=dragonFrame(length,age);assert.equal(f.length,length);assert.ok(Math.abs(f.head-f.tail-length)<1e-8);}
}
assert.equal(dragonWidth(0),0);assert.ok(dragonWidth(.2)<dragonWidth(.5));assert.ok(dragonWidth(.5)<dragonWidth(.77));assert.ok(dragonWidth(1)<dragonWidth(.77)*.55);
for(const d of [-100,0,200,400,600,800]){const p=route.sample(d);assert.ok([p.x,p.y,p.angle,p.nx,p.ny].every(Number.isFinite));}
for(const long of [false,true]){
 const g=new Game();g.start(false,true,false,false,true);const m=g.hualing;m.select('dragon');m.handle({kind:'down',id:1,x:100,y:500});
 const points=long?[{x:620,y:500},{x:620,y:520},{x:100,y:520},{x:100,y:540},{x:620,y:540}]:[{x:170,y:500}];
 for(const p of points)m.handle({kind:'move',id:1,...p});m.handle({kind:'up',id:1,...points.at(-1)!});
 const drawn=pathLength(m.effects[0].path);assert.ok(Math.abs(drawn-(long?1100:70))<1e-7);assert.equal(dragonFrame(drawn,1.5).length,drawn);
}
console.log('PASS dragon motion: exact drawn length without extra caps, moving head and tail after endpoint, continuous extrapolation, whole-body fade and anatomical width');
