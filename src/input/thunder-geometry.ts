import {distance,resample,simplify,smooth,type Point} from './recognizer';

/** Logic units scale with the 720-wide battle field, not physical screen pixels. */
export const THUNDER_GESTURE={minLength:140,minArm:28,minSpan:70,minAngle:40*Math.PI/180,minStraightShare:.6};
export type ThunderGeometry={valid:boolean;corners:{point:Point;along:number}[];length:number;span:number;straightShare:number};
const angle=(a:Point,b:Point,c:Point)=>Math.atan2((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y));
const lengths=(p:Point[])=>{const out=[0];for(let i=1;i<p.length;i++)out.push(out[i-1]+distance(p[i-1],p[i]));return out;};

/** Noise is discarded; it never buys corners. Smooth-wave classification is separate. */
export function analyzeThunder(points:Point[]):ThunderGeometry{
 const cumulative=lengths(points),length=cumulative.at(-1)??0;
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),span=points.length?Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)):0;
 const result:ThunderGeometry={valid:false,corners:[],length,span,straightShare:0};
 if(points.length<4||length<THUNDER_GESTURE.minLength||span<THUNDER_GESTURE.minSpan)return result;
 const p=resample(points,Math.min(192,Math.max(64,Math.ceil(length/6)))),along=lengths(p);
 const vertices=simplify(p,Math.max(6,Math.min(24,span*.065)));
 // A tiny shoulder or end hook is not another stroke arm and cannot veto a glyph.
 for(let i=1;i<vertices.length&&vertices.length>2;){
  if(distance(vertices[i-1],vertices[i])>=THUNDER_GESTURE.minArm){i++;continue;}
  const before=i>1?Math.abs(angle(vertices[i-2],vertices[i-1],vertices[i])):0;
  const after=i<vertices.length-1?Math.abs(angle(vertices[i-1],vertices[i],vertices[i+1])):0;
  vertices.splice(before<=after?i-1:i,1);i=Math.max(1,i-1);
 }
 // Re-smooth the denoised shape before counting flat sections; otherwise
 // approximating a continuous S as a polygon would falsely manufacture corners.
 const base=resample(simplify(p,Math.max(1.8,Math.min(3,span*.01))),Math.min(512,Math.max(128,(vertices.length-1)*32))),body=smooth(smooth(smooth(base)));
 result.straightShare=body.slice(3,-3).filter((_,i)=>Math.abs(angle(body[i],body[i+3],body[i+6]))<.06).length/(body.length-6);
 const turns:number[]=[];
 for(let i=1;i<vertices.length-1;i++){
  const a=vertices[i-1],b=vertices[i],c=vertices[i+1],turn=angle(a,b,c);
  if(Math.abs(turn)<THUNDER_GESTURE.minAngle||Math.abs(turn)>Math.PI*.91||Math.min(distance(a,b),distance(b,c))<THUNDER_GESTURE.minArm)continue;
  const index=p.reduce((best,v,j)=>distance(v,b)<distance(p[best],b)?j:best,0);
  result.corners.push({point:b,along:along[index]});turns.push(Math.sign(turn));
 }
 const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 let intersections=0;
 for(let i=1;i<vertices.length;i++)for(let j=i+2;j<vertices.length;j++)if(cross(vertices[i-1],vertices[i],vertices[j-1])*cross(vertices[i-1],vertices[i],vertices[j])<0&&cross(vertices[j-1],vertices[j],vertices[i-1])*cross(vertices[j-1],vertices[j],vertices[i])<0)intersections++;
 const opposite=turns.some((sign,i)=>i>0&&sign!==turns[i-1]),retraced=vertices.slice(1,-1).some((_,i)=>Math.abs(angle(vertices[i],vertices[i+1],vertices[i+2]))>Math.PI*.91);
 result.valid=opposite&&!retraced&&intersections<2&&result.corners.length>=2&&result.straightShare>=THUNDER_GESTURE.minStraightShare&&distance(p[0],p.at(-1)!)/length>.12;
 return result;
}
