import type {Point} from './recognizer';

export type Segment={a:Point;b:Point};
export type Arena={left:number;right:number;top:number;bottom:number};
export type Triangle=[Point,Point,Point];
const cross=(a:Point,b:Point)=>a.x*b.y-a.y*b.x;
const sub=(a:Point,b:Point)=>({x:a.x-b.x,y:a.y-b.y});
export const length=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function inArena(p:Point,r:Arena){return p.x>=r.left-1e-6&&p.x<=r.right+1e-6&&p.y>=r.top-1e-6&&p.y<=r.bottom+1e-6;}
/** Liang–Barsky clipping; render and interactions consume the same clipped segment. */
export function clipSegment(s:Segment,r:Arena):Segment|null{
 const d=sub(s.b,s.a);let lo=0,hi=1;
 for(const [p,q] of [[-d.x,s.a.x-r.left],[d.x,r.right-s.a.x],[-d.y,s.a.y-r.top],[d.y,r.bottom-s.a.y]]){
  if(Math.abs(p)<1e-10){if(q<0)return null;continue;}
  const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null;
 }
 const a={x:s.a.x+d.x*lo,y:s.a.y+d.y*lo},b={x:s.a.x+d.x*hi,y:s.a.y+d.y*hi};return length(a,b)>1e-6?{a,b}:null;
}
export function segmentIntersection(a:Segment,b:Segment,minAngle:number,tolerance=0){
 const u=sub(a.b,a.a),v=sub(b.b,b.a),la=Math.hypot(u.x,u.y),lb=Math.hypot(v.x,v.y),den=cross(u,v);
 if(la<1e-6||lb<1e-6||Math.abs(den)<1e-8)return null;
 if(Math.asin(Math.min(1,Math.abs(den)/(la*lb)))+1e-8<minAngle)return null;
 const delta=sub(b.a,a.a),t=cross(delta,v)/den,w=cross(delta,u)/den;
 if(t < -tolerance/la-1e-8||t>1+tolerance/la+1e-8||w < -tolerance/lb-1e-8||w>1+tolerance/lb+1e-8)return null;
 const point={x:a.a.x+u.x*t,y:a.a.y+u.y*t};
 return {point,t,w,commonEndpoint:(Math.abs(t)<1e-6||Math.abs(t-1)<1e-6)&&(Math.abs(w)<1e-6||Math.abs(w-1)<1e-6)};
}
export function triangleArea(t:Triangle){return Math.abs(cross(sub(t[1],t[0]),sub(t[2],t[0])))/2;}
export function distanceToSegment(p:Point,s:Segment){const u=sub(s.b,s.a),d=u.x*u.x+u.y*u.y,t=Math.max(0,Math.min(1,((p.x-s.a.x)*u.x+(p.y-s.a.y)*u.y)/(d||1)));return Math.hypot(p.x-s.a.x-u.x*t,p.y-s.a.y-u.y*t);}
export function circleIntersectsTriangle(p:Point,r:number,t:Triangle){
 const signs=t.map((a,i)=>cross(sub(t[(i+1)%3],a),sub(p,a)));
 return signs.every(n=>n>=-1e-7)||signs.every(n=>n<=1e-7)||t.some((a,i)=>distanceToSegment(p,{a,b:t[(i+1)%3]})<=r);
}
export function segmentTouchesTriangle(s:Segment,t:Triangle){
 return circleIntersectsTriangle(s.a,0,t)||circleIntersectsTriangle(s.b,0,t)||t.some((a,i)=>!!segmentIntersection(s,{a,b:t[(i+1)%3]},0)||distanceToSegment(a,s)<1e-6);
}
export function mirrorSegment(s:Segment,edge:Segment):Segment{
 const dx=edge.b.x-edge.a.x,dy=edge.b.y-edge.a.y,n=dx*dx+dy*dy;
 const reflect=(p:Point)=>{if(n<1e-12)return {...p};const u=((p.x-edge.a.x)*dx+(p.y-edge.a.y)*dy)/n;return {x:2*(edge.a.x+u*dx)-p.x,y:2*(edge.a.y+u*dy)-p.y};};
 return {a:reflect(s.a),b:reflect(s.b)};
}
