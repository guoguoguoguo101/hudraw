import type {Point} from './recognizer';

/** World units, relative to the existing 720 × 1005 drawing region. */
export const TRIANGLE_GESTURE={width:720,height:1005,closureWidth:.14,closureLength:.16,
 minSide:30,minPerimeter:180,minArea:900,largeArea:14500,largePerimeter:600,
 minQuality:.16,minTurn:28*Math.PI/180,maxMeanError:.075,maxError:.14,
 minAreaFit:.60,maxTraceRatio:1.35,minTraceRatio:.78,maxRadius:300,maxArea:60000};
export type TriangleGeometry={vertices:[Point,Point,Point];center:Point;area:number;perimeter:number;form:'small'|'large';capped:boolean};
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const area=(p:Point[])=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-a.y*b.x;},0))/2;
const segment=(p:Point,a:Point,b:Point)=>{const dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-u*dx,p.y-a.y-u*dy);};
function hull(points:Point[]){
 const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y),lower:Point[]=[],upper:Point[]=[];
 for(const p of sorted){while(lower.length>1&&cross(lower.at(-2)!,lower.at(-1)!,p)<=0)lower.pop();lower.push(p);}
 for(const p of [...sorted].reverse()){while(upper.length>1&&cross(upper.at(-2)!,upper.at(-1)!,p)<=0)upper.pop();upper.push(p);}
 return [...lower.slice(0,-1),...upper.slice(0,-1)];
}
/** A cyclic convex contour fit: the pen-down point need not be a corner. */
export function analyzeTriangle(points:Point[]):TriangleGeometry|null{
 const c=TRIANGLE_GESTURE;if(points.length<6)return null;
 const length=points.slice(1).reduce((s,p,i)=>s+dist(p,points[i]),0);
 if(length<c.minPerimeter||dist(points[0],points.at(-1)!)>Math.min(c.width*c.closureWidth,length*c.closureLength))return null;
 const outline=hull(points);if(outline.length<3)return null;const hullArea=area(outline);
 // Maximum-area inscribed triangle recovers the three dominant corners even when
 // finger rounding adds many small hull vertices. Greedy deletion can lose a tip.
 // Convexity lets the third corner advance monotonically: bounded O(hull²).
 let best=-1,corners=[outline[0],outline[1],outline[2]];
 for(let i=0;i<outline.length-2;i++){let k=i+2;for(let j=i+1;j<outline.length-1;j++){k=Math.max(k,j+1);while(k+1<outline.length&&cross(outline[i],outline[j],outline[k+1])>cross(outline[i],outline[j],outline[k]))k++;const value=cross(outline[i],outline[j],outline[k]);if(value>best){best=value;corners=[outline[i],outline[j],outline[k]];}}}
 const vertices=corners as [Point,Point,Point],a=area(vertices),sides=vertices.map((p,i)=>dist(p,vertices[(i+1)%3])),perimeter=sides.reduce((s,v)=>s+v,0);
 if(a<c.minArea||perimeter<c.minPerimeter||Math.min(...sides)<c.minSide||a/hullArea<c.minAreaFit||length/perimeter>c.maxTraceRatio||length/perimeter<c.minTraceRatio)return null;
 if(4*Math.sqrt(3)*a/sides.reduce((s,v)=>s+v*v,0)<c.minQuality)return null;
 for(let i=0;i<3;i++){const p=vertices[(i+2)%3],q=vertices[i],r=vertices[(i+1)%3],u={x:q.x-p.x,y:q.y-p.y},v={x:r.x-q.x,y:r.y-q.y};if(Math.abs(Math.atan2(u.x*v.y-u.y*v.x,u.x*v.x+u.y*v.y))<c.minTurn)return null;}
 const span=Math.max(...sides),errors=points.map(p=>Math.min(...vertices.map((v,i)=>segment(p,v,vertices[(i+1)%3]))));
 if(Math.max(...errors)>span*c.maxError||errors.reduce((s,v)=>s+v,0)/errors.length>span*c.maxMeanError)return null;
 const center={x:vertices.reduce((s,p)=>s+p.x,0)/3,y:vertices.reduce((s,p)=>s+p.y,0)/3};
 return {vertices:vertices.map(p=>({...p})) as [Point,Point,Point],center,area:a,perimeter,form:a>=c.largeArea&&perimeter>=c.largePerimeter?'large':'small',capped:false};
}
export function capTriangle(t:TriangleGeometry):TriangleGeometry{
 const radius=Math.max(...t.vertices.map(p=>dist(p,t.center))),scale=Math.min(1,TRIANGLE_GESTURE.maxRadius/radius,Math.sqrt(TRIANGLE_GESTURE.maxArea/t.area));
 return {...t,vertices:t.vertices.map(p=>({x:t.center.x+(p.x-t.center.x)*scale,y:t.center.y+(p.y-t.center.y)*scale})) as [Point,Point,Point],area:t.area*scale*scale,perimeter:t.perimeter*scale,capped:scale<1};
}
export function insideTriangle(p:Point,t:TriangleGeometry){const signs=t.vertices.map((a,i)=>cross(a,t.vertices[(i+1)%3],p));return signs.every(n=>n>=-1e-6)||signs.every(n=>n<=1e-6);}
