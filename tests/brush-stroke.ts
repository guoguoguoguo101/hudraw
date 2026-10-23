import assert from 'node:assert/strict';
import {brushStroke} from '../src/rendering/brush-stroke';

const points=Array.from({length:61},(_,i)=>({x:100+i*5,y:400}));
const slow=brushStroke(points,points.map((_,i)=>i*.05),10,true);
const fast=brushStroke(points,points.map((_,i)=>i*.004),10,true);
assert.ok(slow[Math.floor(slow.length/2)].width>fast[Math.floor(fast.length/2)].width*1.5,'slow writing presses a fuller stroke');
assert.ok(fast.at(-1)!.width<.5,'fast release produces a pointed exit');
assert.ok(slow.at(-1)!.width>4,'slow release keeps a planted end');
assert.ok(slow[0].width<slow[10].width,'the planted start opens smoothly');
assert.deepEqual(brushStroke([],[],10),[]);
assert.deepEqual(brushStroke([{x:0,y:0},{x:0,y:0}],[0,0],10),[]);
for(const input of [points,[{x:0,y:0},{x:600,y:0}],Array.from({length:400},(_,i)=>({x:i%2?700:0,y:400+i%3}))]){
 const before=JSON.stringify(input),ribbon=brushStroke(input,input.map(()=>0),10,true);
 assert.ok(ribbon.length<1700,'long paths retain a bounded rendering budget');
 for(const p of ribbon)for(const value of Object.values(p))assert.ok(Number.isFinite(value),'sparse and same-time input remains finite');
 assert.equal(JSON.stringify(input),before,'visual geometry never changes recognition input');
}
assert.deepEqual(brushStroke(points,points.map((_,i)=>i*.01),10),brushStroke(points,points.map((_,i)=>i*.01),10),'grain geometry is stable across frames');
console.log('PASS brush: pressure, planted start, flick / blunt endings, sparse input, bounded geometry, unchanged source');
