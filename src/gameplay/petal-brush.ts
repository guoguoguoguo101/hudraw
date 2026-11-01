import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {inArena,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const FLOWER_BRUSH={spacing:140,separation:100,budLife:1,bloomRadius:100,damage:48,bloomDelay:.16,bloomLife:.95,slowDuration:1.25,moveScale:.55,maxBuds:6,maxBlooms:6};
export type FlowerBud=Point&{id:number;age:number;angle:number;from:Point};
export type FlowerBloom=Point&{id:number;age:number;angle:number;fired:boolean};
export type BrushLeaf=Point&{age:number;life:number;size:number;phase:number;angle:number;vx:number;vy:number;spin:number;tone:number};
/** Distance-planted flowers detonate on a fixed fuse, even when there are no enemies nearby. */
export class PetalBrush{
 readonly duration=12;remaining=0;clock=0;buds:FlowerBud[]=[];blooms:FlowerBloom[]=[];
 leaves:BrushLeaf[]=[];private leafSpacing=0;private leafSerial=0;
 private serial=0;private spacing=0;private previous:Point|null=null;private slowed=new Map<number,number>();
 get active(){return this.remaining>0;}
 activate(){this.remaining=this.duration;}
 begin(){this.spacing=0;this.leafSpacing=0;this.previous=null;}
 reset(){this.remaining=this.clock=this.spacing=this.serial=0;this.buds=[];this.blooms=[];this.leaves=[];this.leafSpacing=this.leafSerial=0;this.previous=null;this.slowed.clear();}
 isSlowed(id:number){return (this.slowed.get(id)??0)>this.clock;}
 trace(a:Point,b:Point){
  if(!this.active||![a.x,a.y,b.x,b.y].every(Number.isFinite))return;
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.01)return;
  // Cosmetic autumn leaves keep falling from the moving tip independently of the flower budget.
  for(let d=29-this.leafSpacing,n=0;d<=length&&n<40;d+=29,n++){
   const id=++this.leafSerial,phase=id*2.399963,u=d/length;
   this.leaves.push({x:a.x+(b.x-a.x)*u+Math.sin(phase)*8,y:a.y+(b.y-a.y)*u+5,age:0,life:1.3+(id%5)*.14,size:4.8+(id%4)*.75,phase,angle:phase,vx:Math.sin(phase)*12,vy:42+(id%6)*5,spin:Math.cos(phase)*1.5,tone:id%9===0?3:id%3});
  }
  this.leafSpacing=(this.leafSpacing+length)%29;if(this.leaves.length>72)this.leaves.splice(0,this.leaves.length-72);
  for(let d=FLOWER_BRUSH.spacing-this.spacing,n=0;d<=length&&n<40;d+=FLOWER_BRUSH.spacing,n++){
   // Buds and opening flowers share a small scene budget, including across strokes.
   if(this.buds.length+this.blooms.length>=FLOWER_BRUSH.maxBuds)break;
   const u=d/length,p={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
   if(this.buds.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<FLOWER_BRUSH.separation)||this.blooms.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<FLOWER_BRUSH.separation))continue;
   const id=++this.serial,from=this.previous&&Math.hypot(this.previous.x-p.x,this.previous.y-p.y)<FLOWER_BRUSH.spacing*1.7?this.previous:p;
   this.buds.push({...p,id,age:0,angle:Math.sin(id*2.399963)*.35,from:{...from}});this.previous=p;
  }
  this.spacing=(this.spacing+length)%FLOWER_BRUSH.spacing;
 }
 advance(dt:number,enemies:Enemy[]=[],damage?:(e:Enemy,n:number)=>void,bounds?:Arena){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.clock+=dt;this.remaining=Math.max(0,this.remaining-dt);
  for(const p of this.leaves){p.age+=dt;p.x+=(p.vx+Math.sin(p.phase+p.age*3)*15)*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;}
  this.leaves=this.leaves.filter(p=>p.age<p.life);
  // An unequipped/finished flower brush has no target work. Cosmetic leaves and
  // the enchantment clock above still advance even when no blooms are present.
  if(!this.buds.length&&!this.blooms.length&&!this.slowed.size)return;
  const alive=enemies.filter(e=>e.hp>0&&e.ai!=='Death'&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(!bounds||inArena(e,bounds)));
  const liveIds=new Set(alive.map(e=>e.id));for(const [id,until]of this.slowed)if(until<=this.clock||!liveIds.has(id))this.slowed.delete(id);
  for(const bloom of this.blooms){
   bloom.age+=dt;
   if(!bloom.fired&&bloom.age+1e-8>=FLOWER_BRUSH.bloomDelay){
    bloom.fired=true;
    for(const e of alive)if(e.hp>0&&Math.hypot(e.x-bloom.x,e.y-bloom.y)<=FLOWER_BRUSH.bloomRadius+Math.min(30,brushBodyRadius(e))){
     damage?.(e,FLOWER_BRUSH.damage);
     if(e.hp>0&&e.kind!=='boss'&&!e.elite&&!e.chapterBoss)this.slowed.set(e.id,this.clock+FLOWER_BRUSH.slowDuration);
    }
   }
  }
  this.blooms=this.blooms.filter(b=>b.age<FLOWER_BRUSH.bloomLife);
  this.buds=this.buds.filter(bud=>{
   bud.age+=dt;if(bounds&&!inArena(bud,bounds))return false;
   // All buds sharing a fuse can open together; visual budgets must never delay a detonation.
   if(bud.age+1e-8>=FLOWER_BRUSH.budLife){
    this.blooms.push({...bud,age:0,fired:false});return false;
   }
   return true;
  });
 }
}
