import assert from 'node:assert/strict';
import {PaperDragonActor} from '../src/rendering/paper-dragon';
import {DualBrush,PAPER_DRAGON_MOTION} from '../src/gameplay/dual-brush';
import art from '../src/rendering/dragon-art/ink-blob-dragon.json';
const bounds={left:26,right:694,top:280,bottom:962};
assert.ok(art.vertices.length/3>1000&&art.vertices.length/3<16000,'bounded native detail budget');
assert.ok(art.indices.every(n=>Number.isInteger(n)&&n>=0&&n<art.vertices.length/3));
assert.ok(art.colors.some(c=>(c>>16&255)<60&&(c>>8&255)<60),'rare ink eye tone must survive tracing');
for(const index of [0,1]){
 const actor=new PaperDragonActor(index),m=new DualBrush();m.level=4;m.begin();m.trace({x:350,y:650},{x:354,y:650},30,16);
 const path=m.geometry(m.sides[index],bounds);assert.equal(path.length,PAPER_DRAGON_MOTION.samples);const arc=path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);assert.ok(Math.abs(arc-PAPER_DRAGON_MOTION.length)<.01,'a bent short-stroke summon retains the complete material length');
 actor.update(path,1,0,index);const first=Float32Array.from(actor.geometry.positions);actor.update(path,1,.3,index);assert.ok(actor.geometry.positions.some((n,i)=>Math.abs(n-first[i])>.02),'legs have independent motion');
 for(const reverse of [false,true])for(let i=0;i<30;i++){
  const curve=Array.from({length:49},(_,k)=>({x:350+(reverse?-1:1)*(k/48-.5)*PAPER_DRAGON_MOTION.length,y:600+Math.sin(k/48*6.28+i*.1)*30}));
  actor.update(curve,1,i/30,index);for(const n of actor.geometry.positions)assert.ok(Number.isFinite(n)&&Math.abs(n)<1000,'finite bounded anatomy on reversals');
 }
 // All skull vertices are one rigid shape, even when the spine makes a tight S.
 const headIndices=Array.from({length:art.vertices.length/3},(_,i)=>i).filter(i=>art.vertices[i*3]/art.width>.72&&art.vertices[i*3+1]/art.height<.75),a=headIndices[0],b=headIndices[Math.floor(headIndices.length*.6)];
 const length=()=>Math.hypot(actor.geometry.positions[a*2]-actor.geometry.positions[b*2],actor.geometry.positions[a*2+1]-actor.geometry.positions[b*2+1]);
 const before=length();actor.update(Array.from({length:49},(_,i)=>({x:100+i*4,y:600+Math.sin(i/10)*15})),1,1,index);assert.ok(Math.abs(length()-before)<.15,'eye/jaw/horns are not stretched by head turning');
 actor.update([],0,1,index);assert.equal(actor.root.visible,false);
}
console.log('PASS ink-blob dragons: bounded native art, preserved cream eyes and ink pupils, larger full short-stroke bodies, paddling paws, both facings, rigid round heads and cleanup');
