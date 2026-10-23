import assert from 'node:assert/strict';
import {recognize,resample,distance,type Point} from '../src/input/recognizer';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';

/** Rounded joins and unequal sampling emulate a finger, rather than a perfect polyline. */
function handStroke(vertices:Point[],round:number,jitter=0){
 const result:Point[]=[vertices[0]],toward=(a:Point,b:Point,d:number)=>{const n=distance(a,b)||1;return {x:a.x+(b.x-a.x)*d/n,y:a.y+(b.y-a.y)*d/n};};
 for(let i=1;i<vertices.length-1;i++){
  const b=vertices[i],r=Math.min(round,distance(vertices[i-1],b)*.25,distance(vertices[i+1],b)*.25),a=toward(b,vertices[i-1],r),c=toward(b,vertices[i+1],r);
  result.push(...resample([result.at(-1)!,a],17).slice(1));
  for(let j=1;j<=13;j++){const u=j/13;result.push({x:(1-u)**2*a.x+2*u*(1-u)*b.x+u*u*c.x,y:(1-u)**2*a.y+2*u*(1-u)*b.y+u*u*c.y});}
 }
 result.push(...resample([result.at(-1)!,vertices.at(-1)!],19).slice(1));
 return result.map((p,i)=>({x:p.x+Math.sin(i*.8)*jitter,y:p.y+Math.cos(i*.7)*jitter}));
}
const shapes=[
 [{x:200,y:400},{x:450,y:400},{x:230,y:650},{x:480,y:650}],
 [{x:200,y:400},{x:290,y:560},{x:380,y:400},{x:470,y:560}],
 [{x:230,y:400},{x:340,y:500},{x:240,y:630},{x:390,y:730}],
 [{x:220,y:480},{x:265,y:530},{x:310,y:480},{x:355,y:530}],
 [{x:200,y:400},{x:300,y:440},{x:270,y:580},{x:460,y:600}],
];
let failures=0,total=0;
for(const [shape,v] of shapes.entries())for(const round of [0,8,16,24,32])for(const jitter of [0,1.5])for(const samples of [28,80,190]){
 const p=resample(handStroke(v,round,jitter),samples);total++;const r=recognize(p);
 if(r.rune!=='z'){failures++;console.log('MISS',JSON.stringify({shape,round,jitter,samples,rune:r.rune,corners:r.geometry.advanced?.corners.length}));}
 let actual:string|null=null;const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>true,r=>{actual=r.rune;return true;},()=>false);
 input.event({...p[0],kind:'down',id:19});for(const point of p.slice(1))input.event({...point,kind:'move',id:19});input.event({...p.at(-1)!,kind:'up',id:19});assert.equal(actual,'z',`real input ${shape}/${round}/${jitter}/${samples}`);
}
console.log({total,failures});assert.equal(failures,0,'ordinary rounded or uneven lightning strokes must cast');
for(const jitter of [0,1.5]){
 const arc=Array.from({length:150},(_,i)=>({x:300+100*Math.cos(i/149*Math.PI),y:550+100*Math.sin(i/149*Math.PI)}));assert.equal(recognize(arc).rune,'arc');
 const wave=Array.from({length:180},(_,i)=>({x:150+i/179*400,y:550+80*Math.sin(i/179*Math.PI*4)}));assert.equal(recognize(wave).rune,'wave');
 const arrow=handStroke([{x:220,y:430},{x:420,y:550},{x:220,y:670}],12,jitter);assert.equal(recognize(arrow).rune,'triangle');
 const same=handStroke([{x:200,y:400},{x:420,y:400},{x:420,y:600},{x:200,y:600}],12,jitter);assert.notEqual(recognize(same).rune,'z');
 const scribble=Array.from({length:90},(_,i)=>({x:i%2?500:200,y:550+i%3*4}));assert.notEqual(recognize(scribble).rune,'z');
}
// Both total length and segment scale matter: cramped folds cannot buy a spell.
const short=resample([{x:300,y:500},{x:330,y:500},{x:305,y:520},{x:335,y:520}],100);assert.notEqual(recognize(short).rune,'z');
const cramped=resample(Array.from({length:30},(_,i)=>({x:300+i%3*10,y:500+(i%2)*20})),300);assert.notEqual(recognize(cramped).rune,'z');
for(const cycles of [1,2,2.5])for(const rotation of [0,.7,1.57]){
 const p=Array.from({length:180},(_,i)=>{const x=-230+i/179*460,y=65*Math.sin(i/179*Math.PI*2*cycles);return {x:360+x*Math.cos(rotation)-y*Math.sin(rotation),y:650+x*Math.sin(rotation)+y*Math.cos(rotation)};});
 assert.equal(recognize(p).rune,'wave','existing S must remain easy to trigger');
}
console.log('PASS handwritten lightning: 150 rounded/noisy/sparse strokes, basic arrow/arc, wave and scribble boundaries');
