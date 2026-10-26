import type {Point} from '../input/recognizer';
export type DragonFrame={head:number;tail:number;length:number;alpha:number;phase:'forming'|'swimming'|'leaving'};
/** Tail -> waist -> rib cage -> shoulders -> slender neck, in material coordinates. */
export function dragonWidth(t:number){
 const keys=[[0,0],[.12,1.4],[.28,3.6],[.44,7.5],[.6,11],[.77,16],[.85,15],[.94,9],[1,7.5]];
 t=Math.max(0,Math.min(1,t));
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const a=keys[i-1],b=keys[i],u=(t-a[0])/(b[0]-a[0]),smooth=u*u*(3-2*u);return a[1]+(b[1]-a[1])*smooth;}
 return 7.5;
}
/** Material length stays fixed. Both ends advance beyond the drawn route, then fade together. */
export function dragonFrame(routeLength:number,age:number,duration=3.3):DragonFrame{
 const length=Math.max(0,routeLength);
 const travel=Math.max(0,Math.min(1,age/1.5)),exit=Math.max(0,age-1.5)/Math.max(.1,duration-1.5);
 const head=routeLength*travel+(length+95)*exit;
 const alpha=Math.max(0,Math.min(1,age/.28,(duration-age)/.9));
 return{head,tail:head-length,length,alpha,phase:age<.28?'forming':age<1.5?'swimming':'leaving'};
}
export class DragonRoute{
 private lengths:number[]=[0];length=0;
 constructor(private points:Point[]){for(let i=1;i<points.length;i++){this.length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);this.lengths.push(this.length);}}
 point(d:number):Point{
  if(this.points.length<2)return this.points[0]??{x:360,y:600};
  if(d<0){const p=this.points[0],b=this.point(Math.min(this.length,8)),n=Math.hypot(b.x-p.x,b.y-p.y)||1;return{x:p.x+(b.x-p.x)/n*d,y:p.y+(b.y-p.y)/n*d};}
  if(d>this.length){
   const p=this.points.at(-1)!,a=this.point(Math.max(0,this.length-10)),n=Math.hypot(p.x-a.x,p.y-a.y)||1,e=d-this.length;
   const tx=(p.x-a.x)/n,ty=(p.y-a.y)/n;
   // Continue the tangent, then gently bank sideways instead of disappearing behind the HUD.
   const side=Math.abs(tx)>.12?Math.sign(tx):p.x<360?1:-1,blend=e-100*(1-Math.exp(-e/100));
   return{x:p.x+tx*e+(side*.985-tx)*blend,y:p.y+ty*e+(.17-ty)*blend};
  }
  let lo=1,hi=this.points.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(this.lengths[mid]<d)lo=mid+1;else hi=mid;}
  const a=this.points[lo-1],b=this.points[lo],span=this.lengths[lo]-this.lengths[lo-1],u=span?(d-this.lengths[lo-1])/span:0;
  return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
 }
 sample(d:number){const p=this.point(d),a=this.point(d-6),b=this.point(d+6),angle=Math.atan2(b.y-a.y,b.x-a.x);return{...p,nx:-Math.sin(angle),ny:Math.cos(angle),angle};}
}
