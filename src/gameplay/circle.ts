import {WORLD,type Enemy,type Skill} from '../core/types';
import type {Game} from './game';
import {circleStage} from './circle-levels';

export type CircleMode='ward'|'seal'|'ultimate';
export type CircleState={level:number;mode:CircleMode;baseDamage:number;baseDuration:number;captured:Set<number>;broken:boolean};
export const SEAL_NAMES=['镇妖阵','缚妖阵','镇妖重阵','四门封妖阵'] as const;
export const CIRCLE_TICK=.5;
export const CIRCLE_BREAK_FADE=.35;
/** Upgrade radius, never stroke size, decides whether the cast contains the fox. */
export function circleMode(center:{x:number;y:number},radius:number,level:number):CircleMode{
 return level===5?'ultimate':Math.hypot(center.x-WORLD.foxX,center.y-WORLD.foxY)<=radius+1e-6?'ward':'seal';
}
export function configureCircle(s:Skill,level=s.testLevel??1){
 if(s.released)return;
 level=Math.max(1,Math.min(5,Math.floor(level)));
 const stage=circleStage(level),baseDamage=s.circle?.baseDamage??s.damage,baseDuration=s.circle?.baseDuration??s.duration;
 const center=Number.isFinite(s.geometry.center.x)&&Number.isFinite(s.geometry.center.y)?s.geometry.center:{x:WORLD.foxX,y:WORLD.foxY};
 s.radius=stage.radius;s.damage=baseDamage*stage.damage;s.duration=Math.max(baseDuration,stage.duration);
 const mode=circleMode(center,s.radius,level);
 s.circle={level,mode,baseDamage,baseDuration,captured:new Set(),broken:false};
 // Keep the existing self-ward and ultimate anchored to the fox.
 s.x=mode==='seal'?center.x:WORLD.foxX;s.y=mode==='seal'?center.y:WORLD.foxY;
 s.nextTick=CIRCLE_TICK;
}
const inside=(e:Enemy,s:Skill,radius=s.radius)=>e.hp>0&&Math.hypot(e.x-s.x,e.y-s.y)<=radius;
function sealDamage(g:Game,e:Enemy,amount:number){
 // Damage flashes must not repeatedly reset attack windups into the Hit state.
 const ai=e.ai,age=e.stateAge,vx=e.vx,vy=e.vy;
 g.damage(e,amount,0);
 if(e.hp>0&&e.kind!=='boss'){e.ai=ai;e.stateAge=age;e.vx=vx;e.vy=vy;}
}
export function updateCircle(g:Game,s:Skill){
 const c=s.circle!;
 if(!s.released&&s.age>=.08){
  s.released=true;
  g.primaryAction({kind:'area',castId:s.id,origin:{x:s.x,y:s.y},direction:{...s.direction},damage:c.mode==='seal'?s.damage*.4:s.damage,radius:s.radius});
  if(c.mode!=='seal'){
   g.shield=Math.max(g.shield,circleStage(c.level).shield);g.shieldTime=s.duration;
   for(const e of [...g.enemies])if(inside(e,s)){s.hit.add(e.id);g.damage(e,s.damage,240*s.strength);}
  }else for(const e of [...g.enemies])if(inside(e,s)){c.captured.add(e.id);s.hit.add(e.id);sealDamage(g,e,s.damage*.4);}
 }
 if(!s.released)return;
 if(c.mode!=='seal'){
  if(s.seal)while(s.nextTick<=Math.min(s.age,s.duration)+1e-8){s.nextTick+=CIRCLE_TICK;for(const e of [...g.enemies])if(inside(e,s,160))g.damage(e,s.damage*.15*s.sealPower,0);}
  return;
 }
 if(c.broken)return;
 for(const e of g.enemies)if(inside(e,s))c.captured.add(e.id);
 const breakAt=s.duration-CIRCLE_BREAK_FADE;
 while(s.nextTick<=Math.min(s.age,breakAt)+1e-8){
  s.nextTick+=CIRCLE_TICK;
  for(const e of [...g.enemies])if(inside(e,s)){s.hit.add(e.id);sealDamage(g,e,s.damage*.25*(s.seal?s.sealPower:1));}
 }
 if(s.age+1e-8>=breakAt){
  c.broken=true;
  for(const e of [...g.enemies])if(inside(e,s,s.radius*1.1)){
   const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy),force=180*s.strength*(e.kind==='oni'?.7:1);
   s.hit.add(e.id);g.damage(e,s.damage*.6,180*s.strength);
   if(e.hp>0&&e.kind!=='boss'){e.vx=d>1e-6?dx/d*force:force;e.vy=d>1e-6?dy/d*force:0;}
  }
 }
}
/** Called after AI movement: ordinary enemies cannot walk or dash out of a live seal. */
export function containCircleEnemy(g:Game,e:Enemy){
 if(e.hp<=0||e.kind==='boss')return;
 const seals=g.skills.filter(s=>s.circle?.mode==='seal'&&s.released&&!s.circle.broken&&s.age<s.duration);
 if(e.kind==='oni'){
  if(seals.some(s=>Math.hypot(e.prevX-s.x,e.prevY-s.y)<=s.radius)){
   e.x=e.prevX+(e.x-e.prevX)*.45;e.y=e.prevY+(e.y-e.prevY)*.45;
  }
  return;
 }
 for(const s of seals){
  if(!s.circle!.captured.has(e.id)&&inside(e,s))s.circle!.captured.add(e.id);
  if(!s.circle!.captured.has(e.id))continue;
  const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy),limit=s.radius-8;
  if(d>limit){e.x=s.x+dx/d*limit;e.y=s.y+dy/d*limit;e.vx=e.vy=0;}
 }
}
