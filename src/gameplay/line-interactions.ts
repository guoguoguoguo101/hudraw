import type {Skill,Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import {clipSegment,inArena,length,distanceToSegment,segmentIntersection,triangleArea,circleIntersectsTriangle,type Arena,type Segment,type Triangle} from '../input/line-interaction-geometry';
import {LINE_INTERACTION as C} from './line-interaction-config';
import {TriangleRefractions} from './triangle-refraction';
import {triangleWindowFrame} from './triangle-window';
import {segmentTouchesTriangle} from '../input/line-interaction-geometry';
import {SLASH_STAGES} from './slash';

export type Trace=Segment&{id:number;castId:number;level:number;created:number;expires:number;damage:number;bridges:Point[]};
type Source=Pick<Skill,'id'|'rune'>;
export type InteractionEffect={id:number;kind:'cross'|'triangle';traceIds:number[];consumedCastIds?:number[];created:number;duration:number;hitAt:number;damage:number;source:Source;settled:boolean;cutSettled?:boolean;center:Point;directions:Point[];vertices?:Triangle;hit:Set<number>};
type Damage=(e:Enemy,amount:number,source:Source)=>void;
const key=(ids:number[])=>[...ids].sort((a,b)=>a-b).join(':');
export class LineInteractions{
 refractionEnabled=true;refractions=new TriangleRefractions();
 now=0;traces:Trace[]=[];effects:InteractionEffect[]=[];pairs=new Set<string>();triangles=new Set<string>();
 private registeredCasts=new Map<number,number>();
 bounds:Arena={left:0,right:720,top:252,bottom:1000};
 lastReason='画两条交叉线，或用三条线围合';lastKind='';crossCount=0;triangleCount=0;private serial=0;
 clear(){this.refractions.clear();this.now=0;this.traces=[];this.effects=[];this.pairs.clear();this.triangles.clear();this.registeredCasts.clear();this.serial=0;this.lastKind='';this.crossCount=this.triangleCount=0;this.lastReason='画两条交叉线，或用三条线围合';}
 private prune(){
  this.traces=this.traces.filter(t=>t.expires>this.now+1e-8);
  for(const [id,expires] of this.registeredCasts)if(expires<=this.now+1e-8)this.registeredCasts.delete(id);
  const ids=new Set(this.traces.map(t=>t.id));
  for(const group of [this.pairs,this.triangles])for(const k of group)if(k.split(':').some(id=>!ids.has(Number(id))))group.delete(k);
 }
 tryRefract(s:Skill){
  this.prune();if(!this.refractionEnabled||!s.slash?.path)return false;
  if(this.registeredCasts.has(s.id))return this.refractions.items.some(e=>e.castId===s.id);
  const original=clipSegment({a:s.slash.path[0],b:s.slash.path[1]},this.bounds);if(!original)return false;
  const window=[...this.effects].reverse().find(e=>e.kind==='triangle'&&e.vertices&&this.now<e.created+e.duration&&segmentTouchesTriangle(original,triangleWindowFrame(e.vertices,e.center,this.now-e.created)));
  if(!window?.vertices)return false;
  const frame=triangleWindowFrame(window.vertices,window.center,this.now-window.created);
  this.refractions.add(s,original,frame,SLASH_STAGES[s.slash.level-1].hit_width,this.now,this.bounds);
  this.registeredCasts.set(s.id,this.now+C.lifetime);this.lastKind='三角折射';this.lastReason='三角折射 · 三边镜像';return true;
 }
 /** Only successful experimental primary slashes create traces. */
 add(s:Skill){
  this.prune();const path=s.slash?.path;if(!s.interactionLine||!path||path.length!==2)return;
  if(this.registeredCasts.has(s.id))return;
  const segment=clipSegment({a:path[0],b:path[1]},this.bounds);if(!segment){this.lastReason='残痕在场地之外';return;}
  if(this.traces.length>=C.capacity){this.traces.shift();this.prune();}
  const fresh:Trace={...segment,id:++this.serial,castId:s.id,level:s.slash!.level,damage:s.damage,created:this.now,expires:this.now+C.lifetime,bridges:[]};
  this.registeredCasts.set(s.id,fresh.expires);
  const previous=[...this.traces];this.traces.push(fresh);
  const intersect=(a:Trace,b:Trace)=>{const hit=segmentIntersection(a,b,C.minAngle,C.endpointTolerance);return hit&&inArena(hit.point,this.bounds)?hit:null;};
  const hits=previous.map(t=>({trace:t,hit:intersect(t,fresh)}));
  const candidates:{a:Trace;b:Trace;vertices:Triangle;area:number}[]=[];
  for(let i=0;i<hits.length;i++)for(let j=i+1;j<hits.length;j++){
   const a=hits[i],b=hits[j];if(!a.hit||!b.hit)continue;
   const ab=intersect(a.trace,b.trace);if(!ab)continue;
   const vertices:Triangle=[ab.point,a.hit.point,b.hit.point],area=triangleArea(vertices);
   if(area<C.minArea||vertices.some((p,i)=>length(p,vertices[(i+1)%3])<C.minSide)){this.lastReason='交点太近，未围出有效区域';continue;}
   if(!this.triangles.has(key([a.trace.id,b.trace.id,fresh.id])))candidates.push({a:a.trace,b:b.trace,vertices,area});
  }
  candidates.sort((a,b)=>b.area-a.area||a.a.id-b.a.id||a.b.id-b.b.id);
  const winner=candidates[0];
  if(winner){
   const ids=[winner.a.id,winner.b.id,fresh.id];this.triangles.add(key(ids));
   const center={x:winner.vertices.reduce((n,p)=>n+p.x,0)/3,y:winner.vertices.reduce((n,p)=>n+p.y,0)/3};
   this.effects.push({id:++this.serial,kind:'triangle',traceIds:ids,consumedCastIds:[winner.a.castId,winner.b.castId,s.id],created:this.now,duration:C.triangleDuration,hitAt:C.triangleHitAt,damage:s.damage*C.triangleDamage,source:{id:s.id,rune:s.rune},settled:false,center,directions:[],vertices:winner.vertices,hit:new Set()});
   this.triangleCount++;this.lastKind='三角绞杀';this.lastReason='三线围合 · 收缩绞杀';
   // The window owns a geometry snapshot, so its animation/damage outlive these traces.
   const consumed=new Set(ids);this.traces=this.traces.filter(t=>!consumed.has(t.id));this.prune();
  }
  let count=0;
  for(const {trace,hit} of hits.sort((a,b)=>(a.hit?length(a.hit.point,fresh.a):Infinity)-(b.hit?length(b.hit.point,fresh.a):Infinity)||a.trace.id-b.trace.id)){
   if(winner)break; // The new line has been consumed; it cannot produce more combinations.
   const relation=key([trace.id,fresh.id]);if(!hit||hit.commonEndpoint||this.pairs.has(relation))continue;
   this.pairs.add(relation);if(count>=C.maxCrosses)continue;count++;
   for(const t of [trace,fresh])if(distanceToSegment(hit.point,t)>1e-6)t.bridges.push(hit.point);
   const directions=[trace,fresh].map(t=>{const d=length(t.a,t.b);return {x:(t.b.x-t.a.x)/d,y:(t.b.y-t.a.y)/d};});
   this.effects.push({id:++this.serial,kind:'cross',traceIds:[trace.id,fresh.id],created:this.now,duration:C.crossDuration,hitAt:C.crossHitAt,damage:s.damage*C.crossDamage,source:{id:s.id,rune:s.rune},settled:false,center:hit.point,directions,hit:new Set()});
   this.crossCount++;if(!winner){this.lastKind='交点爆发';this.lastReason='交点爆发';}
  }
  if(!winner&&!count)this.lastReason=hits.some(h=>h.hit)?'共同端点或退化区域，不触发组合':'未相交 / 夹角过小 / 仅延长线相交';
  // Normally <= six short-lived events; protect against synthetic casts in one frame.
  // Settled effects may be retired, but pending damage is never silently discarded.
  while(this.effects.length>C.maxEffects){const index=this.effects.findIndex(e=>e.settled);if(index<0)break;this.effects.splice(index,1);}
 }
 advance(dt:number,enemies:Enemy[],damage:Damage,onImpact?:(event:InteractionEffect)=>void){
  this.now+=Math.max(0,dt);this.prune();
  this.refractions.advance(this.now,enemies,damage);
  for(const event of this.effects){
   // One area cut followed by one final detonation, sharing the original total damage budget.
   if(event.vertices&&!event.cutSettled&&this.now+1e-8>=event.created+C.triangleCutAt){
    event.cutSettled=true;
    for(const e of [...enemies]){const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
     if(e.hp>0&&circleIntersectsTriangle(e,radius,event.vertices))damage(e,event.damage*C.triangleCutShare,event.source);
    }
   }
   if(event.settled||this.now+1e-8<event.created+event.hitAt)continue;event.settled=true;onImpact?.(event);
   for(const e of [...enemies]){
    const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
    if(e.hp<=0||event.hit.has(e.id))continue;
    const touches=event.vertices?circleIntersectsTriangle(e,radius,event.vertices):length(e,event.center)<=C.crossRadius+radius;
    if(touches){event.hit.add(e.id);damage(e,event.damage*(event.vertices?1-C.triangleCutShare:1),event.source);}
   }
  }
  this.effects=this.effects.filter(e=>!e.settled||this.now<e.created+e.duration);
 }
}
