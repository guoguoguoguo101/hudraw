import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {distanceToSegment,segmentIntersection,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';
import type {TrailSegment,TrailStyle} from './ink-trail';
export const INK_RITUAL={minArea:3500,maxRadius:190,formations:2,life:4.8,open:.28,tick:.6,damage:40,arrival:64,slamDamage:150,slamTimes:[1.35,2.8,4.1],blockBudget:4,blockSpacing:48};
export type InkFormation={id:number;level:number;path:Point[];x:number;y:number;radius:number;age:number;life:number;style:TrailStyle;nextTick:number;arrived:boolean;slams:number;target:Point;flash:number};
export type InkBlock=Point&{age:number;angle:number;id:number};
export function insideInk(p:Point,path:Point[]){let inside=false;for(let i=0,j=path.length-1;i<path.length;j=i++){const a=path[i],b=path[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function touchesInk(e:Point,r:number,path:Point[]){return insideInk(e,path)||path.some((a,i)=>distanceToSegment(e,{a,b:path[(i+1)%path.length]})<=r);}
/** Shape and projectile interaction for retained ink; independent of normal spell recognition. */
export class InkRituals{
 formations:InkFormation[]=[];blocks:InkBlock[]=[];time=0;private serial=0;private points:Point[]=[];private level=0;private style:TrailStyle='cinnabar';
 private strokes:Map<number,{left:number;born:number;cells:Point[]}>=new Map();private tone:'form'|'summon'|'slam'|'block'|null=null;
 takeTone(){const t=this.tone;this.tone=null;return t;}
 begin(){this.points=[];this.level=0;}
 reset(){this.formations=[];this.blocks=[];this.strokes.clear();this.points=[];this.level=0;this.time=0;this.serial=0;this.tone=null;}
 trace(a:Point,b:Point,level:number,style:TrailStyle){
  if(level<3)return;this.level=level;this.style=style;
  const last=this.points.at(-1);if(last&&Math.hypot(last.x-a.x,last.y-a.y)>2)this.points=[];
  if(!this.points.length)this.points.push({...a});this.points.push({...b});
  if(this.points.length>160)this.points=this.points.filter((_,i)=>i%2===0||i===this.points.length-1);
 }
 end(cancel=false,bounds?:Arena){
  const points=this.points;this.points=[];if(cancel||this.level<3||points.length<6)return false;
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),span=Math.max(w,h);
  const closure=Math.max(40,Math.min(85,span*.3));
  if(Math.min(w,h)<45||Math.max(w,h)/Math.min(w,h)>3.2||Math.hypot(points[0].x-points.at(-1)!.x,points[0].y-points.at(-1)!.y)>closure)return false;
  if(bounds&&points.some(p=>p.x<bounds.left||p.x>bounds.right||p.y<bounds.top||p.y>bounds.bottom))return false;
  let area=0,cx=0,cy=0,length=0;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=a.x*b.y-b.x*a.y;area+=cross;cx+=(a.x+b.x)*cross;cy+=(a.y+b.y)*cross;length+=Math.hypot(a.x-b.x,a.y-b.y);}
  if(Math.abs(area)/2<INK_RITUAL.minArea||4*Math.PI*Math.abs(area)/2/(length*length)<.24)return false;
  // Permit a short crossed seam near the starting point when a hand-drawn
  // circle closes. Interior crossings (including figure-eights) stay invalid.
  const along=[0];for(let i=1;i<points.length;i++)along.push(along[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  for(let i=0;i<points.length-1;i++)for(let j=i+2;j<points.length-1;j++){
   if(i===0&&j===points.length-2)continue;
   const hit=segmentIntersection({a:points[i],b:points[i+1]},{a:points[j],b:points[j+1]},.08);
   if(hit&&!hit.commonEndpoint){
    const seam=along[i+1]<=length*.2&&along[j]>=length*.8&&Math.hypot(hit.point.x-points[0].x,hit.point.y-points[0].y)<=closure;
    if(!seam)return false;
   }
  }
  cx/=3*area;cy/=3*area;
  const max=Math.max(...points.map(p=>Math.hypot(p.x-cx,p.y-cy))),scale=Math.min(1,INK_RITUAL.maxRadius/max);
  const path=points.map(p=>({x:cx+(p.x-cx)*scale,y:cy+(p.y-cy)*scale}));
  const radius=Math.sqrt(Math.abs(area)/2/Math.PI)*scale;
  if(this.level>=4)this.formations=this.formations.filter(f=>f.level<4);
  this.formations.push({id:++this.serial,level:this.level,path,x:cx,y:cy,radius,age:0,life:INK_RITUAL.life,style:this.style,nextTick:INK_RITUAL.open,arrived:false,slams:0,target:{x:cx,y:cy},flash:0});
  if(this.formations.length>INK_RITUAL.formations)this.formations.shift();this.tone=this.level>=4?'summon':'form';return true;
 }
 wallActive(s:TrailSegment,p:Point){const state=this.strokes.get(s.stroke);return s.level>=2&&(!state||state.left>0&&!state.cells.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<INK_RITUAL.blockSpacing));}
 block(a:Point,b:Point,radius:number,segments:TrailSegment[]){
  if(![a.x,a.y,b.x,b.y,radius].every(Number.isFinite))return false;
  const groups=new Map<number,TrailSegment[]>();
  for(const s of segments)if(s.level>=2&&s.expires>this.time&&this.time-s.born>=.08){let list=groups.get(s.stroke);if(!list){list=[];groups.set(s.stroke,list);}list.push(s);}
  let best:{s:TrailSegment;p:Point;t:number}|undefined;
  for(const [stroke,list] of groups){const state=this.strokes.get(stroke);if(state&&state.left<=0)continue;
   for(const s of list){
    const hit=segmentIntersection({a,b},s,0),near=Math.min(distanceToSegment(a,s),distanceToSegment(b,s),distanceToSegment(s.a,{a,b}),distanceToSegment(s.b,{a,b}));
    if(!hit&&near>s.width/2+radius)continue;
    const project=(p:Point)=>{const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,u=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/(dx*dx+dy*dy||1)));return{x:s.a.x+dx*u,y:s.a.y+dy*u};};
    const candidates=[project(a),project(b),s.a,s.b].sort((p,q)=>distanceToSegment(p,{a,b})-distanceToSegment(q,{a,b}));
    const p=hit?.point??candidates[0];
    if(state?.cells.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<INK_RITUAL.blockSpacing))continue;
    const t=Math.hypot(p.x-a.x,p.y-a.y);if(!best||t<best.t)best={s,p,t};
   }
  }
  if(!best)return false;
  const {s,p}=best;let state=this.strokes.get(s.stroke);if(!state){state={left:INK_RITUAL.blockBudget,born:this.time,cells:[]};this.strokes.set(s.stroke,state);}
  state.left--;state.cells.push({...p});
  this.blocks.push({...p,age:0,angle:Math.atan2(b.y-a.y,b.x-a.x),id:++this.serial});if(this.blocks.length>12)this.blocks.shift();this.tone='block';return true;
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,segments:TrailSegment[]){
  this.time+=dt;this.blocks.forEach(b=>b.age+=dt);this.blocks=this.blocks.filter(b=>b.age<.45);
  const strokes=new Set(segments.map(s=>s.stroke));for(const id of this.strokes.keys())if(!strokes.has(id))this.strokes.delete(id);
  for(const f of this.formations){
   f.age+=dt;f.flash=Math.max(0,f.flash-dt);
   const targets=()=>enemies.filter(e=>e.hp>0&&touchesInk(e,brushBodyRadius(e)*.35,f.path));
   if(!f.arrived&&f.age>=INK_RITUAL.open){f.arrived=true;f.flash=.3;for(const e of targets())damage(e,INK_RITUAL.arrival);}
   while(f.nextTick<=Math.min(f.age,f.life-.35)+1e-8){f.nextTick+=INK_RITUAL.tick;for(const e of targets())damage(e,INK_RITUAL.damage);}
   if(f.level>=4)while(f.slams<INK_RITUAL.slamTimes.length&&f.age+1e-8>=INK_RITUAL.slamTimes[f.slams]){
    f.slams++;f.flash=.35;const list=targets(),target=list.sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y))[0];f.target=target?{x:target.x,y:target.y}:{x:f.x,y:f.y};
    for(const e of list){damage(e,INK_RITUAL.slamDamage);if(e.hp>0&&!e.elite&&e.kind!=='boss'){const dx=f.x-e.x,dy=f.y-e.y,d=Math.hypot(dx,dy)||1;e.ai='Hit';e.stateAge=.05;e.vx=dx/d*100;e.vy=dy/d*100;}}
    this.tone='slam';
   }
  }
  this.formations=this.formations.filter(f=>f.age<f.life);
 }
}
