import config from '../../assets/vfx/slash_upgrade/slash_config.json';
import type {Game} from './game';
import type {Skill,Enemy} from '../core/types';
import {visualEnd,scrollWidth,ultimateParams,ultimateVariant,type UltimateParams,type UltimateVariant} from './ultimate';
export const SLASH_STAGES=config.stages;
export type SlashContact={id:number;x:number;y:number;at:number;secondary:boolean;kind?:Enemy['kind'];dead?:boolean};
export type SlashState={secondaryOrigin?:{x:number;y:number};scrollRange?:number;path?:{x:number;y:number}[];level:number;contacts:SlashContact[];pending:{id:number;at:number;damage:number;kind:'main'|'extra'}[];extraHit:Set<number>;scheduled:boolean;ultimate?:UltimateParams;variant?:UltimateVariant;secondaryAt?:number;secondaryCenter?:{x:number;y:number};secondaryDone?:boolean};
export function configureSlash(s:Skill,level=1){
 const stage=SLASH_STAGES[Math.max(0,Math.min(4,level-1))];
 s.damage=s.damage/60*stage.damage;s.range=stage.range;s.duration=stage.visual_duration;
 s.slash={level:stage.level,contacts:[],pending:[],extraHit:new Set(),scheduled:false};
 if(stage.level===5){s.slash.ultimate={...ultimateParams,slashLength:stage.range,slashWidth:stage.hit_width,scrollOpenAt:.23,scrollOpenDuration:.25,scrollHoldUntil:.78,fadeOutDuration:.37,secondaryDamage:stage.secondary_damage};s.slash.variant=ultimateVariant;s.slash.secondaryAt=.65;}
 if(stage.level===4){s.slash.ultimate={...ultimateParams};s.slash.variant=ultimateVariant;s.range=ultimateParams.slashLength;s.duration=Math.max(visualEnd(ultimateParams),ultimateParams.scrollHoldUntil+ultimateParams.fadeOutDuration);s.slash.secondaryAt=ultimateParams.scrollOpenAt+ultimateParams.scrollOpenDuration;}
}
export function attachSwipe(s:Skill){
 const points=s.geometry.raw.length>=2?s.geometry.raw:s.geometry.points;
 if(!s.slash||points.length<2)return;
 const a=points[0],b=points.at(-1)!,length=Math.hypot(b.x-a.x,b.y-a.y);
 if(length<.001)return;
 const direction={x:(b.x-a.x)/length,y:(b.y-a.y)/length};
 const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
 const legacyRange=SLASH_STAGES[s.slash.level-1].range,range=length*1.5,half=range/2;
 // Keep the existing scroll anchor and dimensions separate from the hand-drawn main slash.
 if(s.slash.ultimate){
  s.slash.secondaryOrigin={x:center.x-direction.x*legacyRange/2,y:center.y-direction.y*legacyRange/2};
  s.slash.scrollRange=legacyRange;
 }
 const start={x:center.x-direction.x*half,y:center.y-direction.y*half};
 const end={x:center.x+direction.x*half,y:center.y+direction.y*half};
 s.slash.path=[start,end];s.x=start.x;s.y=start.y;s.direction=direction;s.range=range;
 if(s.slash.ultimate)s.slash.ultimate.slashLength=range;
}
function swipeCandidates(enemies:Enemy[],s:Skill,width:number){
 const path=s.slash!.path!;
 return enemies.filter(e=>e.hp>0&&path.slice(1).some((b,i)=>{
  const a=path[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=Math.max(0,Math.min(1,((e.x-a.x)*dx+(e.y-a.y)*dy)/(length||1)));
  const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
  return Math.hypot(e.x-a.x-dx*t,e.y-a.y-dy*t)<=width/2+radius;
 })).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)||a.id-b.id);
}
function candidates(enemies:Enemy[],s:Skill,d:{x:number;y:number},width:number){
 return enemies.filter(e=>{
  const dx=e.x-s.x,dy=e.y-s.y,t=Math.max(0,Math.min(s.range,dx*d.x+dy*d.y));
  const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
  const localWidth=s.slash?.ultimate?scrollWidth(s.slash.ultimate,t/s.range):width;
  return e.hp>0&&Math.hypot(dx-d.x*t,dy-d.y*t)<=localWidth/2+radius;
 }).sort((a,b)=>((a.x-s.x)*d.x+(a.y-s.y)*d.y)-((b.x-s.x)*d.x+(b.y-s.y)*d.y)||a.id-b.id);
}
export function updateSlash(g:Game,s:Skill){
 const state=s.slash!,stage=SLASH_STAGES[state.level-1];
 if(!state.scheduled&&s.age+1e-8>=stage.primary_hit_at){
  state.scheduled=true;s.released=true;
  g.primaryAction({kind:'ray',castId:s.id,origin:{x:s.x,y:s.y},direction:{...s.direction},damage:s.damage,range:s.range,width:state.ultimate?.slashWidth??stage.hit_width,pierce:Number.MAX_SAFE_INTEGER});
  const dirs=[s.direction];if(s.mirror&&!state.path){const mirror={x:-s.direction.x,y:s.direction.y};if(Math.hypot(mirror.x-s.direction.x,mirror.y-s.direction.y)>.05)dirs.push(mirror);}
  const selected=new Set<number>();for(const dir of dirs)for(const e of (state.path?swipeCandidates(g.enemies,s,stage.hit_width):candidates(g.enemies,s,dir,state.ultimate?.slashWidth??stage.hit_width))){
   if(selected.has(e.id))continue;selected.add(e.id);
   state.pending.push({id:e.id,at:stage.primary_hit_at+(state.level===3?(selected.size-1)*.008:0),damage:s.damage,kind:'main'});
  }
 }
 for(const hit of state.pending){
  if(hit.at>s.age+1e-8)continue;hit.at=Infinity;
  const e=g.enemies.find(e=>e.id===hit.id&&e.hp>0);if(!e)continue;
  if(hit.kind==='main'){
   if(s.hit.has(e.id))continue;s.hit.add(e.id);s.hitCounts.set(e.id,1);
   const contact:SlashContact={id:e.id,x:e.x,y:e.y,at:s.age,secondary:false,kind:e.kind};state.contacts.push(contact);g.damage(e,hit.damage,state.level===4?0:90*s.strength);contact.dead=e.hp<=0;
   if(state.ultimate){if(e.hp>0&&e.kind!=='boss'){e.vx=s.direction.x*state.ultimate.knockbackForce*.45;e.vy=s.direction.y*state.ultimate.knockbackForce*.45;e.ai='Hit';e.stateAge=0;}g.hitStopRemaining=Math.max(g.hitStopRemaining,state.ultimate.hitStop);}
   if(state.level===3)state.pending.push({id:e.id,at:s.age+stage.secondary_delay,damage:stage.secondary_damage,kind:'extra'});
  }else{
   if(state.extraHit.has(e.id))continue;state.extraHit.add(e.id);
   state.contacts.push({id:e.id,x:e.x,y:e.y,at:s.age,secondary:true});g.damage(e,hit.damage,0);
  }
 }
 if(state.ultimate&&!state.secondaryCenter&&s.age>=state.ultimate.scrollOpenAt){
  const contacts=state.contacts.filter(hit=>!hit.secondary);const target=contacts[Math.min(1,contacts.length-1)];
  const origin=state.secondaryOrigin??s;
  const distance=target?Math.max(110,Math.min(330,(target.x-origin.x)*s.direction.x+(target.y-origin.y)*s.direction.y)):260;
  const center={x:origin.x+s.direction.x*distance,y:origin.y+s.direction.y*distance};state.secondaryCenter=center;
 }
 if(state.ultimate&&!state.secondaryDone&&s.age+1e-8>=state.secondaryAt!){
  state.secondaryDone=true;
  const center=state.secondaryCenter!;
  for(const e of [...g.enemies]){const ex=e.x-center.x,ey=e.y-center.y,along=ex*s.direction.x+ey*s.direction.y,across=-ex*s.direction.y+ey*s.direction.x;const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;if(e.hp<=0||state.extraHit.has(e.id)||Math.abs(along)>state.ultimate.scrollWidth/2+radius||Math.abs(across)>state.ultimate.scrollLength/2+radius)continue;
   state.extraHit.add(e.id);const hit:SlashContact={id:e.id,x:e.x,y:e.y,at:s.age,secondary:true,kind:e.kind};state.contacts.push(hit);
   g.damage(e,state.ultimate.secondaryDamage,0);hit.dead=e.hp<=0;
   if(e.hp>0&&e.kind!=='boss'){e.vx=s.direction.x*state.ultimate.knockbackForce;e.vy=s.direction.y*state.ultimate.knockbackForce;e.ai='Hit';e.stateAge=0;}
  }
  if(state.extraHit.size)g.hitStopRemaining=Math.max(g.hitStopRemaining,state.ultimate.hitStop);
 }
}
