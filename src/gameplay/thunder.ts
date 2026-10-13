import type {Game} from './game';
import type {Skill} from '../core/types';
import {SkillTargetResolver as Target} from './target';
export const THUNDER_STAGES=[
 {name:'引雷符',targets:1,start:.12,interval:.10,duration:1.15},
 {name:'奔雷符',targets:3,start:.30,interval:.13,duration:1.85},
 {name:'雷诏',targets:6,start:.72,interval:.10,duration:2.65},
 {name:'天狐雷劫',targets:8,start:1.65,interval:.075,duration:4.5}
] as const;
export type ThunderState={level:number;targets:{id:number;x:number;y:number;at:number;struck:boolean}[];selected:boolean};
export function configureThunder(s:Skill,level=1){level=Math.max(1,Math.min(4,Math.floor(level)));s.thunder={level,targets:[],selected:false};s.duration=THUNDER_STAGES[level-1].duration;}
export function updateThunder(g:Game,s:Skill){
 const state=s.thunder!;const stage=THUNDER_STAGES[state.level-1];
 if(!state.selected&&s.age>=stage.start-.08){
  state.selected=true;
  const targets=state.level===4?g.enemies.filter(e=>e.hp>0&&Target.distance(e,s)<s.range).sort((a,b)=>Target.score(b)-Target.score(a)||Target.distance(a,s)-Target.distance(b,s)).slice(0,stage.targets):Target.chain(g.enemies,s.direction,s.range,stage.targets);
  state.targets=targets.map((e,i)=>({id:e.id,x:e.x,y:e.y,at:stage.start+i*stage.interval,struck:false}));
 }
 for(const target of state.targets){
  if(target.struck)continue;const e=g.enemies.find(e=>e.id===target.id&&e.hp>0);if(e){target.x=e.x;target.y=e.y;}
  if(s.age+1e-8<target.at)continue;target.struck=true;s.released=true;
  if(e&&!s.hit.has(e.id)){s.hit.add(e.id);g.damage(e,s.damage*(state.level===4?1:.9**state.targets.indexOf(target)),state.level===4?240:70*s.strength);if(s.shock&&e.hp>0)e.shock=s.shockDuration;}
 }
 if(state.selected&&state.targets.length&&state.targets.every(t=>t.struck)){g.primaryAction({kind:'chain',castId:s.id,origin:{x:s.x,y:s.y},direction:{...s.direction},damage:s.damage,hits:state.targets.flatMap((t,i)=>s.hit.has(t.id)?[{id:t.id,position:{x:t.x,y:t.y},damage:s.damage*(state.level===4?1:.9**i)}]:[])});}
}
