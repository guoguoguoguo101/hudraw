import {GESTURE_INPUT} from './brush-settings';
export type Point={x:number;y:number};
export type Rune='line'|'circle'|'triangle'|'star'|'z'|'spiral'|'ink';
export type TalismanGeometry={raw:Point[];points:Point[];normalized:Point[];center:Point;aspect:number;rotation:number;winding:number;vertices:Point[];intersections:number};
export type Recognition={gestureId?:number;rune:Rune|null;confidence:number;quality:number;valid:boolean;direction:Point;reason:string;normalized:Point[];geometry:TalismanGeometry};
export const NAMES:Record<Rune,string>={line:'一字斩',circle:'圆形护阵',triangle:'箭头破甲',star:'五角星阵',z:'折线雷符',spiral:'螺旋旋风',ink:'断符消散'};
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function smooth(points:Point[]):Point[]{return points.map((p,i)=>i===0||i===points.length-1?p:{x:(points[i-1].x+p.x*2+points[i+1].x)/4,y:(points[i-1].y+p.y*2+points[i+1].y)/4});}
export function resample(points:Point[],count=64):Point[]{if(points.length<2)return points;const lens=[0];for(let i=1;i<points.length;i++)lens.push(lens[i-1]+distance(points[i],points[i-1]));const total=lens.at(-1)!;if(total<.001)return [points[0]];let at=1;return Array.from({length:count},(_,i)=>{const target=total*i/(count-1);while(at<lens.length-1&&lens[at]<target)at++;const f=(target-lens[at-1])/(lens[at]-lens[at-1]||1);return {x:points[at-1].x+(points[at].x-points[at-1].x)*f,y:points[at-1].y+(points[at].y-points[at-1].y)*f};});}
export function normalize(points:Point[],separate=false):Point[]{if(!points.length)return [];const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,s=Math.max(w,h,1);return points.map(p=>({x:(p.x-x)/(separate?Math.max(w,1):s),y:(p.y-y)/(separate?Math.max(h,1):s)}));}
function unit(p:Point){const n=Math.hypot(p.x,p.y)||1;return {x:p.x/n,y:p.y/n};}
function centered(points:Point[]){const c=points.reduce((a,p)=>({x:a.x+p.x/points.length,y:a.y+p.y/points.length}),{x:0,y:0});return points.map(p=>({x:p.x-c.x,y:p.y-c.y}));}
function perpendicular(p:Point,a:Point,b:Point){const d=distance(a,b);return d?Math.abs((p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x))/d:distance(p,a);}
export function simplify(points:Point[],epsilon:number):Point[]{if(points.length<3)return points;let far=0,index=0;for(let i=1;i<points.length-1;i++){const d=perpendicular(points[i],points[0],points.at(-1)!);if(d>far){far=d;index=i;}}return far>epsilon?[...simplify(points.slice(0,index+1),epsilon).slice(0,-1),...simplify(points.slice(index),epsilon)]:[points[0],points.at(-1)!];}
function crosses(a:Point,b:Point,c:Point,d:Point){const cross=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8;}
const regular=(n:number,step=1)=>Array.from({length:n+1},(_,i)=>({x:Math.cos(-Math.PI/2+i*step*Math.PI*2/n),y:Math.sin(-Math.PI/2+i*step*Math.PI*2/n)}));
const starOutline=Array.from({length:11},(_,i)=>({x:Math.cos(-Math.PI/2+i*Math.PI/5)*(i%2?.43:1),y:Math.sin(-Math.PI/2+i*Math.PI/5)*(i%2?.43:1)}));
const templates={triangle:regular(3),star:regular(5,2),z:[{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1}]};
function match(points:Point[],template:Point[],closed:boolean){const a=centered(normalize(closed?resample(points,65).slice(0,-1):resample(points))),b=centered(normalize(closed?resample(template,65).slice(0,-1):resample(template)));let best=1;for(const original of [a,[...a].reverse()])for(let shift=0;shift<(closed?64:1);shift+=closed?2:1){const candidate=original.map((_,i)=>original[(i+shift)%64]);let dot=0,cross=0;candidate.forEach((p,i)=>{dot+=p.x*b[i].x+p.y*b[i].y;cross+=p.x*b[i].y-p.y*b[i].x;});const angle=Math.atan2(cross,dot),scale=Math.sqrt(b.reduce((s,p)=>s+p.x*p.x+p.y*p.y,0)/Math.max(.0001,candidate.reduce((s,p)=>s+p.x*p.x+p.y*p.y,0))),co=Math.cos(angle)*scale,si=Math.sin(angle)*scale;const error=Math.sqrt(candidate.reduce((s,p,i)=>s+(p.x*co-p.y*si-b[i].x)**2+(p.x*si+p.y*co-b[i].y)**2,0)/64);best=Math.min(best,error);}return best;}
/** Single-stroke API; strokes[] is retained for a later multi-stroke recognizer. */
export class GestureRecognizer{recognize(strokes:Point[][]){return recognize(strokes[0]??[]);}}
export function recognize(raw:Point[]):Recognition{
 const clean:Point[]=[];for(const p of raw)if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!clean.length||distance(p,clean.at(-1)!)>1.5))clean.push({...p});
 const pts=resample(smooth(clean)),norm=normalize(pts),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),w=xs.length?Math.max(...xs)-Math.min(...xs):0,h=ys.length?Math.max(...ys)-Math.min(...ys):0;
 const center={x:xs.length?(Math.max(...xs)+Math.min(...xs))/2:0,y:ys.length?(Math.max(...ys)+Math.min(...ys))/2:0};
 const vertices=simplify(pts,Math.max(w,h)*.045),geometry:TalismanGeometry={raw:clean.slice(0,400),points:pts,normalized:norm,center,aspect:w/Math.max(h,1),rotation:0,winding:1,vertices,intersections:0};
 const result=(rune:Rune|null,confidence=0,direction:Point={x:1,y:0},valid=false):Recognition=>({rune,confidence,quality:rune==='ink'?.25:Math.max(.4,Math.min(1,confidence*.8+.2)),valid,direction,reason:rune?NAMES[rune]:'笔迹未成符',normalized:norm,geometry});
 if(clean.length<2||pts.length<4)return result(null);
 let length=0;for(let i=1;i<pts.length;i++)length+=distance(pts[i],pts[i-1]);if(length<GESTURE_INPUT.minDistance||Math.max(w,h)<38)return result(null);
 const first=pts[0],last=pts.at(-1)!,chord=distance(first,last),dir=unit({x:last.x-first.x,y:last.y-first.y}),closure=chord/length;geometry.rotation=Math.atan2(dir.y,dir.x);
 for(let i=0;i<vertices.length-1;i++)for(let j=i+2;j<vertices.length-1;j++)if(!(i===0&&j===vertices.length-2)&&crosses(vertices[i],vertices[i+1],vertices[j],vertices[j+1]))geometry.intersections++;
 const deviation=pts.reduce((s,p)=>s+perpendicular(p,first,last),0)/pts.length;
 let rawLength=0;for(let i=1;i<clean.length;i++)rawLength+=distance(clean[i],clean[i-1]);
 // Smoothing must not erase repeated reversals and upgrade dense scribbles into a line.
 if(rawLength>length*2)return result('ink',.25,dir,true);
 if(chord/rawLength>.88&&deviation/length<.045)return result('line',chord/rawLength,dir,true);
 // Arrow: two mostly straight arms meeting at a tip. Rotation and stroke order do not matter.
 let bestTip=-1,bestError=Infinity;
 for(let i=10;i<pts.length-10;i++){
  const tip=pts[i],a=distance(first,tip),b=distance(last,tip);
  if(Math.min(a,b)<Math.max(w,h)*.22||Math.min(a,b)/Math.max(a,b)<.3)continue;
  const cosine=((first.x-tip.x)*(last.x-tip.x)+(first.y-tip.y)*(last.y-tip.y))/(a*b);
  if(cosine<-.6||cosine>.93)continue;
  const error=(pts.slice(0,i+1).reduce((sum,p)=>sum+perpendicular(p,first,tip),0)+pts.slice(i+1).reduce((sum,p)=>sum+perpendicular(p,tip,last),0))/pts.length/Math.max(w,h);
  if(error<bestError){bestError=error;bestTip=i;}
 }
 if(closure>.18&&bestTip>=0&&bestError<.055){
  const tip=pts[bestTip],base={x:(first.x+last.x)/2,y:(first.y+last.y)/2};
  const direction=unit({x:tip.x-base.x,y:tip.y-base.y});
  geometry.vertices=[first,tip,last];geometry.rotation=Math.atan2(direction.y,direction.x);
  return result('triangle',Math.max(.65,1-bestError*4),direction,true);
 }
 // Z templates are aligned by rotation and reversed stroke order; reflection is also accepted.
 if(closure>.14&&vertices.length>=4&&vertices.length<=8&&geometry.intersections<2){
  const error=Math.min(match(pts,templates.z,false),match(pts,templates.z.map(p=>({x:-p.x,y:p.y})),false));
  if(error<.16)return result('z',Math.max(.6,1-error*2.6),dir,true);
 }
 let turn=0;const radii=pts.map(p=>distance(p,center));
 for(let i=1;i<pts.length;i++){const a=Math.atan2(pts[i-1].y-center.y,pts[i-1].x-center.x),b=Math.atan2(pts[i].y-center.y,pts[i].x-center.x);turn+=Math.atan2(Math.sin(b-a),Math.cos(b-a));}
 geometry.winding=Math.sign(turn)||1;
 const mean=radii.reduce((sum,r)=>sum+r,0)/radii.length,cv=Math.sqrt(radii.reduce((sum,r)=>sum+(r-mean)**2,0)/radii.length)/(mean||1);
 const aspect=Math.min(w,h)/Math.max(w,h,1);
 if(closure<.18&&aspect>.35&&geometry.intersections<2&&cv<.26&&Math.abs(turn)>4.8&&Math.abs(turn)<7.9&&vertices.length>5)return result('circle',Math.max(.65,1-cv),dir,true);
 return result('ink',.25,dir,true);
}
