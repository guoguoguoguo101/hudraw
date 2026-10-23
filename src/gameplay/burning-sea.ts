import type {Enemy} from '../core/types';
import type {InputEvent} from '../platform/adapter';
import type {Point} from '../input/recognizer';
import {clipSegment,distanceToSegment,inArena,type Arena} from '../input/line-interaction-geometry';

export const BURNING_SEA={drawDuration:4,chargeDuration:2,blastDuration:.8,width:42,blastWidth:84,blastDamage:180,spacing:16};
export type FireTrace={a:Point;b:Point;born:number;expires:number;seed:number;stroke:number};
/** One shared timeline: draw freely, charge, then detonate the union of all trails. */
export class BurningSea{
 now=0;until=0;detonateAt=0;traces:FireTrace[]=[];pointer:number|null=null;detonations=0;
 private last:Point|null=null;private serial=0;private stroke=0;private running=false;private exploded=false;
 get remaining(){const left=this.until-this.now;return this.running&&left>1e-8?left:0;}
 get active(){return this.remaining>0;}
 get chargeRemaining(){return this.phase==='charging'?Math.max(0,this.detonateAt-this.now):0;}
 get explosionAge(){return this.exploded?Math.max(0,this.now-this.detonateAt):-1;}
 get phase():'idle'|'drawing'|'charging'|'exploding'{return !this.running?'idle':this.active?'drawing':!this.exploded?'charging':'exploding';}
 get busy(){return this.running;}
 clear(){this.now=this.until=this.detonateAt=0;this.traces=[];this.cancelStroke();this.serial=this.stroke=this.detonations=0;this.running=this.exploded=false;}
 begin(){if(this.busy)return false;this.until=this.now+BURNING_SEA.drawDuration;this.detonateAt=this.until+BURNING_SEA.chargeDuration;this.traces=[];this.running=true;this.exploded=false;this.cancelStroke();return true;}
 cancelStroke(){this.pointer=null;this.last=null;}
 handle(e:InputEvent,bounds:Arena){
  if(!this.active&&this.pointer===null)return false;
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return true;
  if(e.kind==='cancel'){if(e.id===this.pointer)this.cancelStroke();return true;}
  if(e.kind==='down'){
   if(this.active&&this.pointer===null&&inArena(e,bounds)){this.pointer=e.id;this.last={x:e.x,y:e.y};this.stroke++;this.add(e,e);}
   return true;
  }
  if(e.id!==this.pointer)return true;
  if(this.active&&this.last){const segment=clipSegment({a:this.last,b:e},bounds);if(segment)this.add(segment.a,segment.b);this.last={x:e.x,y:e.y};}
  if(e.kind==='up')this.cancelStroke();
  return true;
 }
 private add(a:Point,b:Point){
  const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/BURNING_SEA.spacing));
  // No stroke count or ink budget; only the four-second input window limits drawing.
  for(let i=0;i<count;i++){
   const point=(t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
   this.traces.push({a:point(i/count),b:point((i+1)/count),born:this.now,expires:this.detonateAt+BURNING_SEA.blastDuration,seed:++this.serial,stroke:this.stroke});
  }
 }
 advance(dt:number,enemies:Enemy[],damage:(enemy:Enemy,amount:number)=>void){
  if(!Number.isFinite(dt)||dt<=0)return false;
  this.now+=dt;let impact=false;
  if(this.running&&!this.exploded&&this.now+1e-8>=this.detonateAt){
   this.exploded=true;this.detonations++;impact=this.traces.length>0;
   for(const e of [...enemies]){
    const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
    if(e.hp>0&&this.traces.some(t=>distanceToSegment(e,t)<=radius+BURNING_SEA.blastWidth/2))damage(e,BURNING_SEA.blastDamage);
   }
  }
  if(this.running&&this.now+1e-8>=this.detonateAt+BURNING_SEA.blastDuration){this.traces=[];this.running=false;}
  return impact;
 }
}
