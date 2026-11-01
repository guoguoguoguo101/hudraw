import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import {clipSegment,distanceToSegment,segmentIntersection,triangleArea,circleIntersectsTriangle,segmentTouchesTriangle,type Arena,type Segment,type Triangle} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const BRUSH_LINE={minLength:64,straightness:.88,deviation:.075,traceLife:5,traceLimit:8,area:2200,side:40,angle:Math.PI/10,sealHit:.72,sealLife:4.2,refund:8};
export type LineTrace=Segment&{id:number;born:number};
export type LineEffect={id:number;kind:'slash'|'cross'|'seal'|'borrow'|'scroll';born:number;life:number;at:number;damage:number;done:boolean;segments:Segment[];center:Point;vertices?:Triangle;consumed?:number};
const center=(v:Point[]):Point=>({x:v.reduce((s,p)=>s+p.x,0)/v.length,y:v.reduce((s,p)=>s+p.y,0)/v.length});
/** Only accepted, continuous player strokes feed this skill. Effects never create more traces. */
export class BrushLine{
 level=0;clock=0;traces:LineTrace[]=[];effects:LineEffect[]=[];hint='近直线收笔 · 补出一字斩';refund=0;
 private points:Point[]=[];private length=0;private broken=false;private serial=0;private tone=0;
 reset(){this.clock=0;this.traces=[];this.effects=[];this.points=[];this.length=this.refund=this.tone=0;this.broken=false;this.hint='近直线收笔 · 补出一字斩';}
 begin(){this.points=[];this.length=0;this.broken=false;}
 trace(a:Point,b:Point){if(!this.level||this.broken)return;const last=this.points.at(-1);if(last&&Math.hypot(last.x-a.x,last.y-a.y)>3)this.broken=true;if(!last)this.points.push({...a});this.points.push({...b});this.length+=Math.hypot(b.x-a.x,b.y-a.y);if(this.points.length>1024)this.broken=true;}
 end(bounds:Arena,cancel=false){
  const p=this.points;this.points=[];if(cancel||!this.level||this.broken||p.length<2)return;
  const a=p[0],b=p[p.length-1],n=Math.hypot(b.x-a.x,b.y-a.y),s=clipSegment({a,b},bounds);
  if(!s||n<BRUSH_LINE.minLength||n/this.length<BRUSH_LINE.straightness||p.some(q=>distanceToSegment(q,{a,b})>Math.max(10,n*BRUSH_LINE.deviation))){this.hint='这一笔较弯 · 试着舒展画直再收笔';return;}
  this.prune();this.add('slash',[s],center([s.a,s.b]),.045,62+this.level*8,.46);this.tone=Math.max(this.tone,1);this.hint='收锋 · 一字斩';
  if(this.level>=4){const seal=[...this.effects].reverse().find(e=>e.kind==='seal'&&!e.consumed&&this.clock-e.born>=BRUSH_LINE.sealHit&&segmentTouchesTriangle(s,e.vertices!));
   if(seal){const v=seal.vertices!,c=seal.center,beams=v.map((a,i)=>{const b=v[(i+1)%3],m=center([a,b]),dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;let nx=-dy/n,ny=dx/n;if(nx*(m.x-c.x)+ny*(m.y-c.y)<0){nx=-nx;ny=-ny;}return clipSegment({a:m,b:{x:m.x+nx*440,y:m.y+ny*440}},bounds);}).filter((s):s is Segment=>!!s);
    seal.consumed=this.clock;this.add('scroll',[s],center([s.a,s.b]),.14,140,1.25);this.add('borrow',beams,c,.52,155,1.25,v);this.tone=4;this.hint='三才借锋 · 三刃齐出';return;
   }
  }
  if(this.level<2)return;
  const hits=this.traces.map(t=>({t,hit:segmentIntersection(s,t,BRUSH_LINE.angle,7)})).filter(x=>x.hit);
  if(this.level>=3){let best:{v:Triangle;ids:number[];area:number}|undefined;
   for(let i=0;i<hits.length;i++)for(let j=i+1;j<hits.length;j++){const x=hits[i],y=hits[j],old=segmentIntersection(x.t,y.t,BRUSH_LINE.angle,7);if(!old)continue;const v:Triangle=[x.hit!.point,y.hit!.point,old.point],area=triangleArea(v);if(area<BRUSH_LINE.area||v.some((p,i)=>Math.hypot(p.x-v[(i+1)%3].x,p.y-v[(i+1)%3].y)<BRUSH_LINE.side))continue;if(!best||area>best.area)best={v,ids:[x.t.id,y.t.id],area};}
   if(best){this.traces=this.traces.filter(t=>!best!.ids.includes(t.id));this.add('seal',[],center(best.v),BRUSH_LINE.sealHit,245,this.level>=4?BRUSH_LINE.sealLife:1.45,best.v);this.tone=3;this.hint=this.level>=4?'三才成阵 · 再画一笔穿阵借锋':'三才成阵 · 命中返墨八点';return;}
  }
  // Each pair can intersect once, at the actual crossing, with a small local hit region.
  for(const x of hits)if(!x.hit!.commonEndpoint){this.add('cross',[s,x.t],x.hit!.point,.09,75,.65);this.tone=Math.max(this.tone,2);this.hint='交锋 · 交点爆发';}
  this.traces.push({...s,id:++this.serial,born:this.clock});if(this.traces.length>BRUSH_LINE.traceLimit)this.traces.shift();
 }
 private add(kind:LineEffect['kind'],segments:Segment[],c:Point,at:number,damage:number,life:number,vertices?:Triangle){this.effects.push({id:++this.serial,kind,segments,center:c,at,damage,life,born:this.clock,done:false,vertices});}
 private prune(){this.traces=this.traces.filter(t=>this.clock-t.born<BRUSH_LINE.traceLife);this.effects=this.effects.filter(e=>!e.done||this.clock-e.born<e.life&&(!e.consumed||this.clock-e.consumed<.35));}
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void){
  this.clock+=dt;for(const e of [...this.effects]){if(e.done||this.clock-e.born<e.at)continue;e.done=true;let hit=false;
   for(const target of [...enemies])if(target.hp>0){const radius=brushBodyRadius(target),touch=e.kind==='seal'?circleIntersectsTriangle(target,radius,e.vertices!):e.kind==='cross'?Math.hypot(target.x-e.center.x,target.y-e.center.y)<=48+radius:e.segments.some(s=>distanceToSegment(target,s)<=radius+(e.kind==='borrow'?21:e.kind==='scroll'?80:13));if(touch){hit=true;damage(target,e.damage);}}
   if(hit&&e.kind==='seal')this.refund+=BRUSH_LINE.refund;
  }this.prune();
 }
 takeRefund(){const n=this.refund;this.refund=0;return n;}
 takeTone(){const n=this.tone;this.tone=0;return n;}
}
