import {WORLD,type Skill,type Enemy} from '../core/types';
import type {Game} from './game';
import {analyzeAdvanced,nearPath,pathLength,pathSlice,type CurveSection} from '../input/advanced-geometry';
import type {Point} from '../input/recognizer';

export const WAVE_STAGES=[
 {name:'双月连斩',segments:2,damage:45,width:20,hold:0,pull:0},
 {name:'三尾逐月',segments:3,damage:58.5,width:24,hold:.12,pull:0},
 {name:'千叠回月',segments:4,damage:69.75,width:28,hold:.16,pull:45},
 {name:'九尾千叠',segments:5,damage:90,width:34,hold:.20,pull:70}
] as const;
export const BINDING_STAGES=[
 {name:'缚妖索',radius:120,turns:2,pull:45,hold:.6,damage:12,duration:1.4},
 {name:'缠灵锁',radius:140,turns:2.5,pull:55,hold:.8,damage:18,duration:1.6},
 {name:'镇妖缚阵',radius:160,turns:3,pull:65,hold:1,damage:24,duration:1.8},
 {name:'万缚镇妖',radius:180,turns:3,pull:75,hold:1.2,damage:36,duration:2}
] as const;
export type WaveState={level:number;segments:CurveSection[];travel:number[];hits:Set<number>[];damage:Map<number,number>;contacts:Map<number,{anchor:Point;until:number}>;returnStarted:boolean;finished:boolean;pullUsed:Map<number,number>};
export type BindingState={level:number;turns:number;radius:number;captured:Map<number,{anchor:Point;until:number;released:boolean;pull:number}>;finished:boolean};
export const enemyRadius=(e:Enemy)=>e.kind==='boss'?55:e.kind==='oni'?34:23;
const clampPoint=(p:Point)=>({x:Math.max(23,Math.min(WORLD.width-23,p.x)),y:Math.max(250,Math.min(1120,p.y))});
const resistance=(e:Enemy)=>e.kind==='boss'?0:e.kind==='oni'?.5:1;
function bindingDamage(g:Game,e:Enemy,amount:number){const ai=e.ai,age=e.stateAge;g.damage(e,amount,0);if(e.hp>0&&e.kind!=='boss'){e.ai=ai;e.stateAge=age;}}

export function configureWave(s:Skill,level=1){
 level=Math.max(1,Math.min(4,Math.floor(level)));const cfg=WAVE_STAGES[level-1];
 const previous=WAVE_STAGES[(s.wave?.level??1)-1];s.damage=s.damage/previous.damage*cfg.damage;
 const geometry=s.geometry.advanced??analyzeAdvanced(s.geometry.points),segments=geometry.curves.slice(0,cfg.segments);
 s.wave={level,segments,travel:segments.map(()=>0),hits:segments.map(()=>new Set()),damage:new Map(),contacts:new Map(),returnStarted:false,finished:false,pullUsed:new Map()};
 s.duration=.15+segments.length*.24+.7;s.testLevel=level;
}
export function updateWave(g:Game,s:Skill,dt:number){
 const state=s.wave!,cfg=WAVE_STAGES[state.level-1];if(!state.segments.length)return;
 for(const id of state.contacts.keys())if(!g.enemies.some(e=>e.id===id))state.contacts.delete(id);
 if(s.age>=.15&&!s.released){s.released=true;/* One cast notification; curved attacks are not repeated base crescent rays. */g.primaryAction({kind:'area',castId:s.id,origin:state.segments[0].center,direction:s.direction,damage:s.damage*.65,radius:cfg.width});}
 state.segments.forEach((segment,i)=>{
  const start=.15+i*.24,progress=Math.max(0,Math.min(1,(s.age-start)/.24)),previous=state.travel[i],travel=segment.length*progress;
  if(travel<=previous)return;state.travel[i]=travel;const swept=pathSlice(segment.points,previous,travel);
  for(const e of [...g.enemies]){
   if(state.hits[i].has(e.id)||!nearPath(e,swept,cfg.width+enemyRadius(e)))continue;
   state.hits[i].add(e.id);s.hit.add(e.id);s.hitCounts.set(e.id,(s.hitCounts.get(e.id)??0)+1);
   const paid=state.damage.get(e.id)??0,amount=Math.max(0,Math.min(s.damage*.65,s.damage*1.3-paid));state.damage.set(e.id,paid+amount);if(amount)g.damage(e,amount,0);
   if(e.hp<=0)continue;
   const a=swept[0],b=swept.at(-1)!,d=Math.hypot(b.x-a.x,b.y-a.y)||1,r=resistance(e);e.vx=(b.x-a.x)/d*65*r;e.vy=(b.y-a.y)/d*65*r;
   if(cfg.hold&&state.hits.slice(0,i).some(h=>h.has(e.id))&&r)state.contacts.set(e.id,{anchor:{x:e.x,y:e.y},until:s.age+cfg.hold*r});
  }
 });
 const end=.15+state.segments.length*.24,anchor=state.segments.at(-1)!.center;
 if(s.age>=end){state.returnStarted=true;
  if(cfg.pull)for(const e of g.enemies){
   const d=Math.hypot(e.x-anchor.x,e.y-anchor.y),r=resistance(e),used=state.pullUsed.get(e.id)??0;
   if(!r||!s.hit.has(e.id)||d>(state.level===4?150:120)||d<1||s.age>end+.35||used>=cfg.pull*r)continue;
   const move=Math.min(d,dt*180*r,cfg.pull*r-used);e.x+=(anchor.x-e.x)/d*move;e.y+=(anchor.y-e.y)/d*move;Object.assign(e,clampPoint(e));e.vx=e.vy=0;state.pullUsed.set(e.id,used+move);
   state.contacts.set(e.id,{anchor:{x:e.x,y:e.y},until:s.age+.04});
  }
  if(!state.finished&&s.age>=end+.35){state.finished=true;if(state.level===4)for(const e of [...g.enemies])if(s.hit.has(e.id)&&Math.hypot(e.x-anchor.x,e.y-anchor.y)<=150)g.damage(e,s.damage*.35,0);}
 }
}

export function configureBinding(s:Skill,level=1){
 level=Math.max(1,Math.min(4,Math.floor(level)));const cfg=BINDING_STAGES[level-1],a=s.geometry.advanced??analyzeAdvanced(s.geometry.points);
 const previous=BINDING_STAGES[(s.binding?.level??1)-1];s.damage=s.damage/previous.damage*cfg.damage;
 s.x=a.spiralCenter.x;s.y=a.spiralCenter.y;s.radius=Math.min(cfg.radius,a.radius);s.duration=cfg.duration+.25;
 s.binding={level,turns:Math.min(cfg.turns,a.turns),radius:s.radius,captured:new Map(),finished:false};s.testLevel=level;s.nextTick=.5;
}
export function updateBinding(g:Game,s:Skill,dt:number){
 const b=s.binding!,cfg=BINDING_STAGES[b.level-1];if(s.age<.12)return;
 for(const id of b.captured.keys())if(!g.enemies.some(e=>e.id===id))b.captured.delete(id);
 if(!s.released){s.released=true;g.primaryAction({kind:'area',castId:s.id,origin:{x:s.x,y:s.y},direction:s.direction,damage:s.damage*.3,radius:s.radius});}
 const hold=cfg.hold*(1+.2*Math.max(0,(b.turns-1.5)/(cfg.turns-1.5))),end=.12+hold;
 for(const e of [...g.enemies]){
  const r=resistance(e),d=Math.hypot(e.x-s.x,e.y-s.y);let captured=b.captured.get(e.id);
  if(!captured&&s.age<end&&d<=s.radius&&!e.bindingImmunity){captured={anchor:{x:e.x,y:e.y},until:Math.min(end,s.age+hold*r),released:false,pull:0};b.captured.set(e.id,captured);s.hit.add(e.id);e.bindingImmunity=hold*r+1;bindingDamage(g,e,s.damage*.3);}
  if(!captured)continue;
  if(s.age>=captured.until){if(!captured.released){captured.released=true;e.bindingImmunity=1;}continue;}
  if(r&&d>8){const move=Math.min(d-8,cfg.pull*s.strength*dt*r,(50+(b.level-1)*15)*r-captured.pull);if(move>0){e.x+=(s.x-e.x)/d*move;e.y+=(s.y-e.y)/d*move;captured.pull+=move;}captured.anchor=clampPoint(e);e.vx=e.vy=0;}
 }
 while(s.nextTick<=Math.min(s.age,end)+1e-8){s.nextTick+=.5;if(b.level>=2)for(const e of [...g.enemies]){const c=b.captured.get(e.id);if(c&&!c.released){const paid=s.hitCounts.get(e.id)??.3,portion=Math.min(.12,.65-paid);if(portion>0){bindingDamage(g,e,s.damage*portion);s.hitCounts.set(e.id,paid+portion);}}}}
 if(!b.finished&&s.age>=end){b.finished=true;for(const e of [...g.enemies])if(b.captured.has(e.id)){const paid=s.hitCounts.get(e.id)??.3;if(b.level===4)bindingDamage(g,e,s.damage*Math.max(0,1-paid));e.bindingImmunity=Math.max(e.bindingImmunity??0,1);}}
}

/** Apply after enemy movement so AI and crowd separation cannot undo a live hold. */
export function containAdvancedEnemy(g:Game,e:Enemy){
 if(e.kind==='boss')return;
 for(const s of g.skills){
  const contact=s.wave?.contacts.get(e.id);if(contact&&s.age<contact.until){Object.assign(e,clampPoint(contact.anchor));e.vx=e.vy=0;}
  const bound=s.binding?.captured.get(e.id);if(bound&&!bound.released&&s.age<bound.until){Object.assign(e,clampPoint(bound.anchor));e.vx=e.vy=0;}
 }
}
