import {WORLD} from '../core/types';
import type {Game} from './game';
import type {Point} from '../input/recognizer';
import {distanceToSegment,inArena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const CRESCENT_GUARD={duration:12,count:3,radiusX:126,radiusY:72,period:2.8,radius:22,damage:34,hitInterval:.5,hitLife:.3} as const;
export type OrbitCrescent=Point&{index:number;angle:number;previous:Point};
export type CrescentContact=Point&{age:number;angle:number;seed:number};
export function crescentPosition(angle:number,center:Point){return{x:center.x+Math.cos(angle)*CRESCENT_GUARD.radiusX,y:center.y+Math.sin(angle)*CRESCENT_GUARD.radiusY};}

/** Three physical, swept contacts orbit the fox; neither target seeking nor disk damage. */
export class CrescentGuard{
 remaining=0;age=0;clock=0;angle=-Math.PI/2;serial=0;
 center:Point={x:WORLD.foxX,y:WORLD.foxY+18};units:OrbitCrescent[]=[];contacts:CrescentContact[]=[];
 private cooldowns=new Map<number,number>();private hitSerial=0;
 get active(){return this.remaining>0;}
 reset(){this.remaining=this.age=this.clock=this.serial=this.hitSerial=0;this.angle=-Math.PI/2;this.center={x:WORLD.foxX,y:WORLD.foxY+18};this.units=[];this.contacts=[];this.cooldowns.clear();}
 activate(center?:Point){
  if(center)this.center={...center};
  if(!this.active||center){this.age=0;this.angle=-Math.PI/2;this.cooldowns.clear();this.units=Array.from({length:CRESCENT_GUARD.count},(_,index)=>{const angle=this.angle+index*Math.PI*2/CRESCENT_GUARD.count,p=crescentPosition(angle,this.center);return{...p,index,angle,previous:{...p}};});}
  this.remaining=CRESCENT_GUARD.duration;this.serial++;
 }
 advance(g:Game,dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;
  let debt=Math.min(dt,.1);
  while(debt>1e-9){const step=Math.min(debt,1/120);debt-=step;this.tick(g,step);}
 }
 private tick(g:Game,dt:number){
  this.clock+=dt;for(const c of this.contacts)c.age+=dt;this.contacts=this.contacts.filter(c=>c.age<CRESCENT_GUARD.hitLife);
  if(!this.active)return;
  const step=Math.min(dt,this.remaining);this.remaining=Math.max(0,this.remaining-step);if(this.remaining<1e-8)this.remaining=0;
  this.age+=step;this.angle=(this.angle+step*Math.PI*2/CRESCENT_GUARD.period)%(Math.PI*2);
  for(const [id,until]of this.cooldowns)if(until<=this.clock)this.cooldowns.delete(id);
  for(const unit of this.units){
   unit.previous={x:unit.x,y:unit.y};unit.angle=this.angle+unit.index*Math.PI*2/CRESCENT_GUARD.count;Object.assign(unit,crescentPosition(unit.angle,this.center));
   for(const e of [...g.enemies]){
    if(e.hp<=0||this.cooldowns.has(e.id)||!inArena(e,g.hualing.bounds)||distanceToSegment(e,{a:unit.previous,b:unit})>CRESCENT_GUARD.radius+brushBodyRadius(e))continue;
    this.cooldowns.set(e.id,this.clock+CRESCENT_GUARD.hitInterval);
    const before=e.hp;g.damage(e,CRESCENT_GUARD.damage,0,{id:-6,rune:'ink'});if(e.hp>=before)continue;
    this.contacts.push({x:e.x,y:e.y,age:0,angle:Math.atan2(e.y-this.center.y,e.x-this.center.x),seed:++this.hitSerial});if(this.contacts.length>18)this.contacts.shift();
    if(e.hp>0&&!e.elite&&!e.chapterBoss&&e.kind!=='boss'){const dx=e.x-this.center.x,dy=e.y-this.center.y,n=Math.hypot(dx,dy)||1;e.vx=dx/n*100;e.vy=dy/n*100;}
   }
  }
  if(!this.active)this.units=[];
 }
}
