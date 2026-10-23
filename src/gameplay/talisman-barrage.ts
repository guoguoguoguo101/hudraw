import {WORLD,type Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import type {InputEvent} from '../platform/adapter';
import {distanceToSegment,inArena,type Arena} from '../input/line-interaction-geometry';

/** Trial values: actual projectiles, one fixed direction, bounded damage per volley. */
export const TALISMAN_BARRAGE={charge:.35,duration:4,interval:.08,lanes:7,spread:.42,
 speed:1050,range:820,width:13,damage:5,pierce:3,maxHitsPerVolley:2,step:1/120,
 maxProjectiles:128,impactDuration:.3} as const;
export type BarragePaper=Point&{id:number;volley:number;angle:number;distance:number;hit:Set<number>};
export type BarrageImpact=Point&{age:number;seed:number};
export class TalismanBarrage{
 phase:'idle'|'aiming'|'charging'|'firing'|'recovering'='idle';
 origin:Point={x:WORLD.foxX,y:WORLD.foxY-12};direction:Point={x:0,y:-1};
 age=0;papers:BarragePaper[]=[];impacts:BarrageImpact[]=[];volleys=0;totalPapers=0;
 pointer:number|null=null;private accumulator=0;private serial=0;private aimed=false;
 private volleyHits=new Map<number,Map<number,number>>();
 get busy(){return this.phase!=='idle';}
 get remaining(){return Math.max(0,TALISMAN_BARRAGE.charge+TALISMAN_BARRAGE.duration-this.age);}
 begin(direction:Point={x:0,y:-1}){
  if(this.busy)return false;this.clear();this.phase='aiming';
  const n=Math.hypot(direction.x,direction.y);if(Number.isFinite(n)&&n>0)this.direction={x:direction.x/n,y:direction.y/n};
  return true;
 }
 clear(){this.phase='idle';this.age=this.accumulator=this.serial=this.volleys=this.totalPapers=0;this.papers=[];this.impacts=[];this.volleyHits.clear();this.cancelInput();}
 cancelInput(){this.pointer=null;this.aimed=false;}
 handle(e:InputEvent,bounds:Arena){
  if(this.phase!=='aiming')return false;
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return true;
  if(e.kind==='cancel'){if(e.id===this.pointer)this.cancelInput();return true;}
  if(e.kind==='down'){
   if(this.pointer===null&&inArena(e,bounds)){this.pointer=e.id;this.aimed=false;this.aim(e);}
   return true;
  }
  if(e.id!==this.pointer)return true;
  if(e.kind==='move'||e.kind==='up')this.aim(e);
  if(e.kind==='up'){
   const fire=this.aimed&&inArena(e,bounds);this.cancelInput();
   if(fire){this.phase='charging';this.age=this.accumulator=0;}
  }
  return true;
 }
 private aim(p:Point){
  const x=p.x-this.origin.x,y=p.y-this.origin.y,n=Math.hypot(x,y);
  if(n<32)return;this.direction={x:x/n,y:y/n};this.aimed=true;
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,pulse:()=>void=()=>{}){
  if(!Number.isFinite(dt)||dt<=0||this.phase==='idle'||this.phase==='aiming')return;
  // No work after the finite cast and its last projectile have finished, even after a background stall.
  this.accumulator+=Math.min(dt,TALISMAN_BARRAGE.charge+TALISMAN_BARRAGE.duration+2);
  const C=TALISMAN_BARRAGE;
  while(this.accumulator+1e-9>=C.step&&this.phase!=='idle'){
   this.accumulator-=C.step;this.age+=C.step;
   for(const hit of this.impacts)hit.age+=C.step;
   this.impacts=this.impacts.filter(hit=>hit.age<C.impactDuration);
   if(this.age+1e-9>=C.charge){
    const fired=this.age-C.charge;
    while(this.volleys<Math.ceil(C.duration/C.interval)&&this.volleys*C.interval<=fired+1e-9){
     this.launch();if(this.volleys%4===1)pulse();
    }
    this.phase=fired<C.duration-1e-9?'firing':'recovering';
   }
   for(const p of this.papers){
    const old={x:p.x,y:p.y},step=Math.min(C.speed*C.step,C.range-p.distance);
    p.x+=Math.cos(p.angle)*step;p.y+=Math.sin(p.angle)*step;p.distance+=step;
    const hits=this.volleyHits.get(p.volley)!;
    // Sorted by distance along travel, so piercing never hits a rear target before a front one.
    const candidates=enemies.filter(e=>e.hp>0&&!p.hit.has(e.id)&&distanceToSegment(e,{a:old,b:p})<=(e.kind==='boss'?55:e.kind==='oni'?34:23)+C.width/2)
     .sort((a,b)=>(a.x-b.x)*Math.cos(p.angle)+(a.y-b.y)*Math.sin(p.angle)||a.id-b.id);
    for(const e of candidates){
     if(p.hit.size>=C.pierce)break;p.hit.add(e.id);
     if((hits.get(e.id)??0)>=C.maxHitsPerVolley)continue;
     hits.set(e.id,(hits.get(e.id)??0)+1);damage(e,C.damage);
     this.impacts.push({x:e.x,y:e.y,age:0,seed:p.id});if(this.impacts.length>36)this.impacts.shift();
    }
   }
   this.papers=this.papers.filter(p=>p.distance<C.range-1e-8&&p.hit.size<C.pierce);
   const live=new Set(this.papers.map(p=>p.volley));for(const id of this.volleyHits.keys())if(!live.has(id))this.volleyHits.delete(id);
   if(this.phase==='recovering'&&!this.papers.length&&!this.impacts.length){this.phase='idle';this.accumulator=0;}
  }
 }
 private launch(){
  const C=TALISMAN_BARRAGE,volley=++this.volleys,base=Math.atan2(this.direction.y,this.direction.x);
  this.volleyHits.set(volley,new Map());
  for(let i=0;i<C.lanes;i++){
   const lane=i-(C.lanes-1)/2,angle=base+lane*C.spread/(C.lanes-1);
   if(this.papers.length>=C.maxProjectiles)break;
   this.papers.push({id:++this.serial,volley,x:this.origin.x+this.direction.x*26-this.direction.y*lane*3,
    y:this.origin.y+this.direction.y*26+this.direction.x*lane*3,angle,distance:0,hit:new Set()});this.totalPapers++;
  }
 }
}
