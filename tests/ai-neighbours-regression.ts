import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {Game} from '../src/gameplay/game';
import {EnemyAI} from '../src/gameplay/ai';
import type {Enemy} from '../src/core/types';

type Layout='spread'|'dense'|'mutations';
type Hooks={beginStep?:(g:Game)=>void;syncEnemy?:(g:Game,e:Enemy)=>void;endStep?:(g:Game)=>void};
const hooks=EnemyAI as typeof EnemyAI&Hooks;
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function setupAI(count:number,layout:Layout,hualing=true){
 const g=new Game();g.start(false,true,false,false,hualing);g.director.disabled=true;g.invulnerable=1e9;
 const template=g.spawn('ink',{x:100,y:400})!;g.enemies=[];
 for(let i=0;i<count;i++){
  const x=layout==='dense'?130+(i*13%110):20+(i*137%680),y=layout==='dense'?210+(i*19%110):110+(i*211%920);
  const e:Enemy={...template,id:100+i,x,y,prevX:x,prevY:y,ai:'Approach',kind:i%23===0?'boss':i%7===0?'oni':i%3===0?'crow':'ink',hp:1e6,maxHp:1e6,age:i*.01,stateAge:0,shock:0,vx:i%5-2,vy:i%3-1,aim:{x:0,y:1},attackOrigin:{x,y},speed:35};
  if(i%17===5)e.elite={kind:'guardian'} as Enemy['elite'];
  if(i%29===7)e.chapterBoss={chapter:'sea'} as Enemy['chapterBoss'];
  if(i%31===8){e.hp=0;e.ai='Death';}
  if(i%19===2)e.look='sea-crab';else if(i%11===4)e.look='snow-marten';
  g.enemies.push(e);
 }
 return {g,template};
}
function step(g:Game,dt:number,indexed:boolean,mutate=false,template?:Enemy){
 if(indexed)hooks.beginStep?.(g);
 const current=[...g.enemies];
 for(let i=0;i<current.length;i++){
  const e=current[i];e.prevX=e.x;e.prevY=e.y;
  if(mutate&&i===4){g.enemies.push({...template!,id:10000+Math.round(g.time*100),x:200,y:320,hp:100,ai:'Approach'});}
  if(mutate&&i===9){const dead=g.enemies.find(v=>!v.elite&&!v.chapterBoss&&v.kind!=='boss'&&v!==e);if(dead)g.damage(dead,1e9);}
  if(e.elite||e.chapterBoss||mutate&&i%9===0){
   // Mirrors non-AI movement branches: elite flight, knockback or campaign steering.
   e.x+=mutate?189:1.3;e.y-=mutate?113:.7;
  }else EnemyAI.update(g,e,dt);
  // Formation/circle containment happens after AI in the real update loop.
  if(mutate&&i%11===3){e.x-=170;e.y+=31;}
  if(indexed)hooks.syncEnemy?.(g,e);
 }
 if(indexed)hooks.endStep?.(g);
 g.time+=dt;
}
export function runAIScenario(count:number,layout:Layout,hualing:boolean,indexed=true){
 const {g,template}=setupAI(count,layout,hualing);
 for(let frame=0;frame<6;frame++)step(g,1/60,indexed,layout==='mutations',template);
 const state=g.enemies.map(e=>[e.id,e.x,e.y,e.vx,e.vy,e.hp,e.ai,e.stateAge,e.age,e.aim.x,e.aim.y]);
 return {count,layout,hualing,remaining:g.enemies.length,hash:hash(state),first:state.slice(0,3)};
}
export function allAIScenarios(indexed=true){
 const out=[];for(const n of [35,350,1000])for(const layout of ['spread','dense'] as const)for(const hualing of [false,true])out.push(runAIScenario(n,layout,hualing,indexed));
 for(const hualing of [false,true])out.push(runAIScenario(80,'mutations',hualing,indexed));
 return out;
}
export function verifyAIOriginal(){
 const expected=JSON.parse(readFileSync('tests/fixtures/ai-neighbours-baseline.json','utf8')).scenarios;
 for(const current of allAIScenarios()){
  const old=expected.find((c:typeof current)=>c.count===current.count&&c.layout===current.layout&&c.hualing===current.hualing);
  assert.ok(old);assert.deepEqual(current,old,`${current.count}/${current.layout}/${current.hualing}: preserve exact AI state, ordering and immediate neighbour movement`);
 }
}
export function profileAI(indexed=true){
 const results=[];
 for(const n of [35,350,1000])for(const layout of ['spread','dense'] as const){
  const samples:number[]=[];
  for(let trial=0;trial<4;trial++){
   const {g}=setupAI(n,layout,true),positions=g.enemies.map(e=>({x:e.x,y:e.y}));
   const t=performance.now();
   for(let frame=0;frame<24;frame++){
    g.enemies.forEach((e,i)=>{e.x=positions[i].x;e.y=positions[i].y;e.ai=e.hp>0?'Approach':'Death';e.stateAge=0;e.vx=e.vy=0;});
    step(g,1/60,indexed);
   }
   if(trial)samples.push((performance.now()-t)/24);
  }
  samples.sort((a,b)=>a-b);results.push({count:n,layout,medianStepMs:+samples[1].toFixed(4)});
 }
 return results;
}
