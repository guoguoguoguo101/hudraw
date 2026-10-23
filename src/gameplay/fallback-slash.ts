import {simplify,type Point} from '../input/recognizer';
import {clipSegment,distanceToSegment,length,type Arena} from '../input/line-interaction-geometry';
import type {Enemy} from '../core/types';
import type {PenSnapshot} from '../input/brush-settings';
import {FALLBACK_SLASH as C} from './fallback-slash-config';

export type FallbackSegment={a:Point;b:Point;start:number;end:number};
export type FallbackPath={segments:FallbackSegment[];length:number};
export type FallbackSlash=FallbackPath&{id:number;age:number;pen:PenSnapshot;hit:Set<number>};
export function buildFallbackPath(raw:Point[],bounds:Arena):FallbackPath|null{
 const prefix:Point[]=[];let remaining:number=C.maxLength;
 for(const p of raw){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
  if(!prefix.length){prefix.push({...p});continue;}
  const a=prefix.at(-1)!,n=length(a,p);if(n<.001)continue;
  const take=Math.min(n,remaining);prefix.push({x:a.x+(p.x-a.x)*take/n,y:a.y+(p.y-a.y)*take/n});remaining-=take;
  if(remaining<=1e-8)break;
  // Inputs outside the real controller must also remain bounded, without joining omitted bends.
  if(prefix.length>=512)break;
 }
 if(prefix.length<2)return null;
 // Ordinary RDP erases collinear reversals. Preserve turning-back points before simplifying.
 const simplified:Point[]=[];let start=0;
 const append=(end:number)=>{const part=simplify(prefix.slice(start,end+1),C.simplifyTolerance);simplified.push(...(simplified.length?part.slice(1):part));start=end;};
 for(let i=1;i<prefix.length-1;i++){
  const a=prefix[i-1],b=prefix[i],c=prefix[i+1];if((b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y)<0)append(i);
 }
 append(prefix.length-1);
 // If there are still too many bends, use a faithful prefix rather than bridging omitted corners.
 const points=simplified.slice(0,C.maxPoints),segments:FallbackSegment[]=[];let total=0;
 for(let i=1;i<points.length;i++){
  const s=clipSegment({a:points[i-1],b:points[i]},bounds);if(!s)continue;
  const n=length(s.a,s.b);segments.push({...s,start:total,end:total+n});total+=n;
 }
 if(total<C.minLength||!segments.length)return null;
 const pointsInArena=segments.flatMap(s=>[s.a,s.b]),xs=pointsInArena.map(p=>p.x),ys=pointsInArena.map(p=>p.y);
 if(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))<C.minSpan)return null;
 return {segments,length:total};
}
export class FallbackSlashes{
 items:FallbackSlash[]=[];totalCasts=0;
 clear(){this.items=[];this.totalCasts=0;}
 get canAdd(){return this.items.length<C.capacity||this.items.some(s=>s.age>=C.sweepDuration);}
 add(id:number,path:FallbackPath,pen:PenSnapshot){
  if(!this.canAdd)return false;
  if(this.items.length>=C.capacity)this.items.splice(this.items.findIndex(s=>s.age>=C.sweepDuration),1);
  this.items.push({...path,id,age:0,pen:{...pen,params:{...pen.params}},hit:new Set()});this.totalCasts++;return true;
 }
 update(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number,id:number)=>void){
  for(const s of this.items){
   const before=Math.min(1,s.age/C.sweepDuration)*s.length;s.age+=dt;const after=Math.min(1,s.age/C.sweepDuration)*s.length;
   if(after<=before)continue;
   const swept=s.segments.filter(p=>p.end>=before&&p.start<=after).map(p=>{
    const d=p.end-p.start,from=Math.max(0,(before-p.start)/d),to=Math.min(1,(after-p.start)/d);
    return {a:{x:p.a.x+(p.b.x-p.a.x)*from,y:p.a.y+(p.b.y-p.a.y)*from},b:{x:p.a.x+(p.b.x-p.a.x)*to,y:p.a.y+(p.b.y-p.a.y)*to}};
   });
   for(const e of [...enemies]){
    const radius=e.kind==='boss'?55:e.kind==='oni'?34:23;
    if(e.hp<=0||s.hit.has(e.id)||!swept.some(segment=>distanceToSegment(e,segment)<=radius+C.width/2))continue;
    s.hit.add(e.id);damage(e,C.damage,s.id);
   }
  }
  this.items=this.items.filter(s=>s.age<C.duration);
 }
}
