import type {Enemy,Skill} from '../core/types';
import type {Segment,Triangle,Arena} from '../input/line-interaction-geometry';
import {clipSegment,distanceToSegment,mirrorSegment} from '../input/line-interaction-geometry';
import {LINE_INTERACTION as C} from './line-interaction-config';

export type Refraction={castId:number;created:number;triangle:Triangle;original:Segment;mirrors:Segment[];width:number;damage:number;settled:boolean};
export class TriangleRefractions{
 items:Refraction[]=[];count=0;
 clear(){this.items=[];this.count=0;}
 add(s:Skill,original:Segment,triangle:Triangle,width:number,now:number,bounds:Arena){
  const mirrors=triangle.map((a,i)=>mirrorSegment(original,{a,b:triangle[(i+1)%3]})).map(s=>clipSegment(s,bounds)).filter((s):s is Segment=>!!s);
  this.items.push({castId:s.id,created:now,triangle,original,mirrors,width:width*C.refractionWidthScale,damage:s.damage*C.refractionDamage,settled:false});this.count++;
 }
 advance(now:number,enemies:Enemy[],damage:(e:Enemy,amount:number,source:Pick<Skill,'id'|'rune'>)=>void){
  for(const event of this.items){
   if(event.settled||now+1e-8<event.created+C.refractionHitAt)continue;event.settled=true;
   // Each of the three mirror slashes may hit once. None can create further traces or interactions.
   for(const segment of event.mirrors)for(const e of [...enemies]){
    const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
    if(e.hp>0&&distanceToSegment(e,segment)<=radius+event.width/2)damage(e,event.damage,{id:event.castId,rune:'line'});
   }
  }
  this.items=this.items.filter(e=>!e.settled||now<e.created+C.refractionDuration);
 }
}
