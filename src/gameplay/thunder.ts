import type {Game} from './game';
import type {Skill} from '../core/types';
import {analyzeAdvanced,pathLength,pathSlice,nearPath} from '../input/advanced-geometry';
import type {Point} from '../input/recognizer';
import {enemyRadius} from './advanced-spells';
export const THUNDER_STAGES=[
 {name:'引雷',targets:3,start:.12,interval:.10,duration:1.15},
 {name:'奔雷',targets:4,start:.30,interval:.13,duration:1.85},
 {name:'雷诏',targets:5,start:.72,interval:.10,duration:2.65},
 {name:'天狐雷劫',targets:6,start:1.65,interval:.075,duration:4.5}
] as const;
export type ThunderState={level:number;targets:{id:number;x:number;y:number;at:number;struck:boolean}[];selected:boolean;path:Point[];length:number;travel:number;lineHits:Set<number>;nodeHits:Set<number>;finalHits:Set<number>;finalDone:boolean;notified:boolean;chains:{from:Point;to:Point;at:number}[]};
export function configureThunder(s:Skill,level=1){
 level=Math.max(1,Math.min(4,Math.floor(level)));const stage=THUNDER_STAGES[level-1];
 const path=s.geometry.raw.length>1?s.geometry.raw:s.geometry.points,a=s.geometry.advanced??analyzeAdvanced(path),length=pathLength(path),corners=a.corners,n=Math.min(stage.targets,corners.length);
 const selected=Array.from({length:n},(_,i)=>corners[n===1?0:Math.round(i*(corners.length-1)/(n-1))]);
 s.thunder={level,targets:selected.map((c,i)=>({id:-i-1,x:c.point.x,y:c.point.y,at:stage.start+c.along/(length||1)*.55,struck:false})),selected:true,path,length,travel:0,lineHits:new Set(),nodeHits:new Set(),finalHits:new Set(),finalDone:false,notified:false,chains:[]};
 s.duration=stage.duration;
}
export function updateThunder(g:Game,s:Skill){
 const state=s.thunder!,stage=THUNDER_STAGES[state.level-1];if(s.age<stage.start)return;
 s.released=true;const previous=state.travel;state.travel=Math.min(state.length,(s.age-stage.start)/.55*state.length);
 if(state.travel>previous){const swept=pathSlice(state.path,previous,state.travel);for(const e of [...g.enemies])if(!state.lineHits.has(e.id)&&nearPath(e,swept,12+state.level*2+enemyRadius(e))){state.lineHits.add(e.id);s.hit.add(e.id);g.damage(e,s.damage*.7,0);}}
 for(const node of state.targets){
  if(node.struck||s.age+1e-8<node.at)continue;node.struck=true;
  const nearby=g.enemies.filter(e=>Math.hypot(e.x-node.x,e.y-node.y)<28+enemyRadius(e));
  const targets=[...nearby];if(state.level>=2&&nearby.length){const chained=g.enemies.filter(e=>!nearby.includes(e)&&Math.hypot(e.x-node.x,e.y-node.y)<90).sort((a,b)=>Math.hypot(a.x-node.x,a.y-node.y)-Math.hypot(b.x-node.x,b.y-node.y)).slice(0,2);for(const e of chained){targets.push(e);state.chains.push({from:node,to:{x:e.x,y:e.y},at:s.age});}}
  for(const e of targets)if(!state.nodeHits.has(e.id)){state.nodeHits.add(e.id);s.hit.add(e.id);g.damage(e,s.damage*.3,0);if(e.hp>0&&state.level>=3&&e.kind!=='boss'){e.ai='Hit';e.stateAge=0;}}
 }
 if(state.level===4&&!state.finalDone&&s.age>=stage.start+.7){state.finalDone=true;const end=state.path.at(-1)!;for(const e of [...g.enemies])if(nearPath(e,state.path,22+enemyRadius(e))||Math.hypot(e.x-end.x,e.y-end.y)<75+enemyRadius(e)){state.finalHits.add(e.id);s.hit.add(e.id);g.damage(e,s.damage*.35,0);}}
 if(!state.notified&&state.travel>=state.length){state.notified=true;g.primaryAction({kind:'chain',castId:s.id,origin:state.path[0],direction:s.direction,damage:s.damage,hits:g.enemies.filter(e=>s.hit.has(e.id)).map(e=>({id:e.id,position:{x:e.x,y:e.y},damage:s.damage*((state.lineHits.has(e.id)?.7:0)+(state.nodeHits.has(e.id)?.3:0))}))});}
}
