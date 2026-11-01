import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {DualBrush} from '../src/gameplay/dual-brush';
import type {Enemy} from '../src/core/types';
import type {Arena} from '../src/input/line-interaction-geometry';

const game=new Game();game.start(false,true,false,false,true);game.director.disabled=true;
const template=game.spawn('ink',{x:100,y:400})!;
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const round=(n:number)=>+n.toFixed(9);
const ordinary:Arena={left:26,right:694,top:280,bottom:962};
export const contactCases=['dense','lethal','boundary','cooldown'] as const;
type ContactCase=typeof contactCases[number];
function setup(kind:ContactCase,count=35){
 const bounds=kind==='boundary'?{left:180,right:540,top:400,bottom:800}:ordinary;
 const model=new DualBrush();model.level=4;model.begin({x:350,y:650});
 const enemies:Enemy[]=Array.from({length:count},(_,i)=>({...template,id:100+i,x:70+i%7*90,y:340+Math.floor(i/7)*100,hp:1e6,maxHp:1e6}));
 if(kind==='lethal')for(const e of enemies)e.hp=12;
 if(kind==='boundary'){
  const points=[
   [bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.left,bounds.bottom],[bounds.right,bounds.bottom],
   [bounds.left-1e-6,600],[bounds.right+1e-6,600],[350,bounds.top-1e-6],[350,bounds.bottom+1e-6],
   [bounds.left+1e-6,600],[bounds.right-1e-6,600],[350,bounds.top+1e-6],[350,bounds.bottom-1e-6],
  ];
  enemies.forEach((e,i)=>{if(points[i]){e.x=points[i][0];e.y=points[i][1];}if(i%4===0)e.chapterBoss={chapter:'sea'} as Enemy['chapterBoss'];});
 }
 if(kind==='cooldown'){
  enemies.forEach((e,i)=>{if(i%6===0){e.hp=0;e.ai='Death';}});
  for(const side of model.sides)for(const e of enemies)side.cooldowns.set(e.id,(e.id%7)*.07);
 }
 return {model,enemies,bounds};
}
export function runContactCase(kind:ContactCase,fps:number){
 const {model,enemies,bounds}=setup(kind),hits:number[][]=[];let serial=200;
 let contactCalls=0,candidateVisits=0;
 const mutable=model as unknown as {contact:(...args:unknown[])=>void};
 const contact=mutable.contact;
 mutable.contact=function(...args:unknown[]){contactCalls++;candidateVisits+=(args[4] as Enemy[]).length;return contact.apply(this,args);};
 for(let frame=0;frame<fps*6;frame++){
  if(kind==='lethal'&&frame>0&&frame%fps===0){const side=model.sides[frame/fps%2];enemies.push({...template,id:serial++,x:side.head.x,y:side.head.y,hp:12,maxHp:12});}
  model.advance(1/fps,enemies,(e,n)=>{
   hits.push([frame,e.id,n,round(model.clock)]);
   if(kind==='lethal'){e.hp-=n;if(e.hp<=0){e.ai='Death';enemies.splice(enemies.indexOf(e),1);}}
  },bounds);
 }
 const state=model.sides.map(side=>({head:[round(side.head.x),round(side.head.y)],direction:[round(side.direction.x),round(side.direction.y)],cooldowns:[...side.cooldowns].map(([id,t])=>[id,round(t)]),path:model.geometry(side,bounds).map(p=>[round(p.x),round(p.y)])}));
 return {kind,fps,hits:hits.length,hitHash:hash(hits),stateHash:hash(state),firstHits:hits.slice(0,8),contactCalls,candidateVisits};
}
export function verifyContactRegression(){
 const baseline=JSON.parse(readFileSync('tests/fixtures/dual-contact-baseline.json','utf8'));
 for(const kind of contactCases)for(const fps of [30,60,120]){
  const actual=runContactCase(kind,fps),expected=baseline.cases.find((c:{kind:string;fps:number})=>c.kind===kind&&c.fps===fps);
  assert.ok(expected,`${kind}/${fps}: missing original-gameplay baseline`);
  assert.deepEqual({hits:actual.hits,hitHash:actual.hitHash,stateHash:actual.stateHash},{hits:expected.hits,hitHash:expected.hitHash,stateHash:expected.stateHash},`${kind}/${fps}: hit order, cooldowns and motion must match the original implementation`);
 }
}
export function profileContacts(){
 return [0,15,35].map(count=>{
  const times:number[]=[];
  for(let trial=0;trial<5;trial++){
   const {model,enemies,bounds}=setup('dense',count);let hits=0;
   const start=performance.now();for(let step=0;step<1200;step++)model.advance(1/120,enemies,()=>hits++,bounds);
   if(trial)times.push(performance.now()-start);
  }
  times.sort((a,b)=>a-b);return {count,steps:1200,medianMs:+((times[1]+times[2])/2).toFixed(3)};
 });
}
