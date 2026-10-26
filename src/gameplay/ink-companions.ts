import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {distanceToSegment,inArena,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const INK_COMPANION_TIERS=[
 {count:0,distance:160,life:0,damage:0,speed:0,guardian:0},
 {count:2,distance:160,life:8,damage:22,speed:155,guardian:0},
 {count:3,distance:145,life:9,damage:27,speed:170,guardian:0},
 {count:4,distance:135,life:10,damage:32,speed:180,guardian:1},
 {count:5,distance:120,life:12,damage:38,speed:195,guardian:2},
] as const;
export const INK_COMPANION_RULES={spawnInterval:.42,rise:.3,windup:.16,pounce:.22,recover:.28,cooldown:.85,step:1/120};
export const inkCompanionRadius=(large:number)=>large===2?44:large?33:19;
export type InkCompanion=Point&{id:number;level:number;large:number;age:number;life:number;home:Point;facing:number;moving:boolean;phase:'rise'|'seek'|'windup'|'pounce'|'recover';phaseAge:number;cooldown:number;from:Point;to:Point;hit:Set<number>;target:number|null};
export type CompanionHit=Point&{age:number;large:boolean};
const DEFAULT_BOUNDS={left:26,right:694,top:260,bottom:990};
/** Real accepted brush distance creates autonomous allies. Idling never spends
 * stored distance, and summoned attacks never feed back into brush input. */
export class InkCompanions{
 units:InkCompanion[]=[];hits:CompanionHit[]=[];time=0;progress=0;level=0;
 private serial=0;private births=0;private nextSpawn=0;private remainder=0;
 private tone:'summon'|'slam'|null=null;
 takeTone(){const tone=this.tone;this.tone=null;return tone;}
 get tier(){return INK_COMPANION_TIERS[this.level];}
 reset(){this.units=[];this.hits=[];this.time=0;this.progress=0;this.level=0;this.serial=0;this.births=0;this.nextSpawn=0;this.remainder=0;this.tone=null;}
 trace(a:Point,b:Point,level:number){
  if(!Number.isInteger(level)||level<1||level>4)return;
  const distance=Math.hypot(b.x-a.x,b.y-a.y);if(!Number.isFinite(distance)||distance<.01)return;
  this.level=level;const tier=this.tier;
  this.progress=Math.min(tier.distance*2,this.progress+distance);
  if(this.progress+1e-8<tier.distance||this.time+1e-8<this.nextSpawn)return;
  this.progress-=tier.distance;this.nextSpawn=this.time+INK_COMPANION_RULES.spawnInterval;
  this.births++;
  const large=tier.guardian&&this.births%3===0?tier.guardian:0;
  const guardian=this.units.find(u=>u.large>0);
  // At capacity, painting sustains a companion rather than teleporting it.
  const oldest=this.units.filter(u=>!u.large).sort((a,b)=>(a.life-a.age)-(b.life-b.age))[0];
  if(large&&!guardian&&this.units.length>=tier.count&&oldest)this.units=this.units.filter(u=>u!==oldest);
  const refresh=large&&guardian?guardian:this.units.length>=tier.count?oldest:undefined;
  if(refresh){refresh.life=refresh.age+tier.life;return;}
  if(large&&this.units.length>=tier.count)return;
  const home={...b};
  this.units.push({...home,id:++this.serial,level,large,age:0,life:tier.life,home,facing:b.x>=a.x?1:-1,moving:false,phase:'rise',phaseAge:0,cooldown:0,from:{...home},to:{...home},hit:new Set(),target:null});
  this.tone='summon';
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds:Arena=DEFAULT_BOUNDS){
  if(!Number.isFinite(dt)||dt<=0)return;
  this.remainder+=Math.min(.1,dt);
  while(this.remainder+1e-9>=INK_COMPANION_RULES.step){this.remainder-=INK_COMPANION_RULES.step;this.step(INK_COMPANION_RULES.step,enemies,damage,bounds);}
 }
 private step(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds:Arena){
  this.time+=dt;
  for(const h of this.hits)h.age+=dt;this.hits=this.hits.filter(h=>h.age<.3);
  const clamp=(p:Point,r=0)=>({x:Math.max(bounds.left+r,Math.min(bounds.right-r,p.x)),y:Math.max(bounds.top+r,Math.min(bounds.bottom-r,p.y))});
  for(const u of this.units){
   u.age+=dt;u.phaseAge+=dt;u.cooldown=Math.max(0,u.cooldown-dt);u.moving=false;
   if(u.age>=u.life)continue;
   const radius=inkCompanionRadius(u.large),tier=INK_COMPANION_TIERS[u.level];
   Object.assign(u,clamp(u,radius));
   const change=(phase:InkCompanion['phase'])=>{u.phase=phase;u.phaseAge=0;};
   if(u.phase==='rise'){if(u.phaseAge+1e-8>=INK_COMPANION_RULES.rise)change('seek');continue;}
   if(u.phase==='windup'){
    if(u.phaseAge+1e-8>=INK_COMPANION_RULES.windup){change('pounce');u.from={x:u.x,y:u.y};u.hit.clear();}
    continue;
   }
   if(u.phase==='pounce'){
    const a={x:u.x,y:u.y},t=Math.min(1,u.phaseAge/INK_COMPANION_RULES.pounce);
    Object.assign(u,clamp({x:u.from.x+(u.to.x-u.from.x)*t,y:u.from.y+(u.to.y-u.from.y)*t},radius));
    for(const e of [...enemies])if(e.hp>0&&inArena(e,bounds)&&!u.hit.has(e.id)&&distanceToSegment(e,{a,b:u})<=radius+brushBodyRadius(e)){
     u.hit.add(e.id);this.hits.push({x:e.x,y:e.y,age:0,large:!!u.large});if(this.hits.length>16)this.hits.shift();
     damage(e,Math.round(tier.damage*(u.large===2?2.8:u.large?2:1)));
     if(u.large)this.tone='slam';
    }
    if(t>=1){change('recover');u.cooldown=INK_COMPANION_RULES.cooldown;}
    continue;
   }
   if(u.phase==='recover'){if(u.phaseAge+1e-8>=INK_COMPANION_RULES.recover)change('seek');continue;}
   let target=enemies.find(e=>e.id===u.target&&e.hp>0&&inArena(e,bounds));
   if(!target){
    const targets=enemies.filter(e=>e.hp>0&&inArena(e,bounds));
    // Prefer unclaimed nearby enemies, but allow the whole group to fight a boss.
    const score=(e:Enemy)=>Math.hypot(e.x-u.x,e.y-u.y)+this.units.filter(v=>v!==u&&v.target===e.id).length*65;
    target=targets.sort((a,b)=>score(a)-score(b))[0];u.target=target?.id??null;
   }
   const destination=target??clamp({x:u.home.x+Math.sin(u.id*2.4)*28,y:u.home.y+Math.cos(u.id*2.4)*20},radius);
   const dx=destination.x-u.x,dy=destination.y-u.y,d=Math.hypot(dx,dy);
   if(Math.abs(dx)>1)u.facing=dx>0?1:-1;
   if(target&&d<=radius+brushBodyRadius(target)+65&&u.cooldown<=0){
    const contact=brushBodyRadius(target)+radius*.55;
    u.to=clamp({x:target.x-dx/(d||1)*contact,y:target.y-dy/(d||1)*contact},radius);change('windup');continue;
   }
   const stop=target?radius+brushBodyRadius(target)+12:8;
   if(d>stop){const move=Math.min(d-stop,tier.speed*(u.large?.85:1)*dt);u.x+=dx/d*move;u.y+=dy/d*move;u.moving=true;}
  }
  this.units=this.units.filter(u=>u.age<u.life);
 }
}
