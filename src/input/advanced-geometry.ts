import {analyzeThunder} from './thunder-geometry';
import {distance,resample,type Point} from './recognizer';

export const ADVANCED_GESTURE={cornerAngle:40*Math.PI/180,minArm:28,minCurveLength:70,minCurveTurn:35*Math.PI/180,minCurveBend:.15,minTurns:1.5,minRadius:30,maxPoints:192};
export type CurveSection={points:Point[];length:number;turn:number;center:Point};
export type AdvancedGeometry={length:number;corners:{point:Point;along:number}[];curves:CurveSection[];spiralCenter:Point;turns:number;radius:number;confidence:number;kind:'z'|'wave'|'spiral'|null};
export const pathLength=(p:Point[])=>p.slice(1).reduce((n,v,i)=>n+distance(p[i],v),0);
export function pathPoint(points:Point[],along:number):Point{for(let i=1;i<points.length;i++){const d=distance(points[i-1],points[i]);if(along<=d){const u=Math.max(0,along)/(d||1);return {x:points[i-1].x+(points[i].x-points[i-1].x)*u,y:points[i-1].y+(points[i].y-points[i-1].y)*u};}along-=d;}return {...points.at(-1)!};}
export function pathSlice(points:Point[],from:number,to:number):Point[]{const out=[pathPoint(points,from)];let n=0;for(let i=1;i<points.length;i++){n+=distance(points[i-1],points[i]);if(n>from&&n<to)out.push(points[i]);}out.push(pathPoint(points,to));return out;}
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*u,p.y-a.y-dy*u);}
export const nearPath=(p:Point,path:Point[],width:number)=>path.slice(1).some((b,i)=>segmentDistance(p,path[i],b)<=width);
const angle=(a:Point,b:Point,c:Point)=>Math.atan2((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y));
const center=(p:Point[])=>({x:(Math.min(...p.map(v=>v.x))+Math.max(...p.map(v=>v.x)))/2,y:(Math.min(...p.map(v=>v.y))+Math.max(...p.map(v=>v.y)))/2});

/** Structure analysis in world coordinates. No templates, enemy selection or skill levels. */
export function analyzeAdvanced(points:Point[]):AdvancedGeometry{
 const length=pathLength(points),c=center(points),span=Math.max(...points.map(p=>distance(p,c)))*2;
 const out:AdvancedGeometry={length,corners:[],curves:[],spiralCenter:c,turns:0,radius:0,confidence:0,kind:null};
 if(points.length<4||length<140)return out;
 const p=resample(points,Math.min(ADVANCED_GESTURE.maxPoints,Math.max(64,Math.ceil(length/6))));
 // Same-direction angular travel about one stable center distinguishes loops from waves.
 let positive=0,negative=0;const radii=p.map(v=>distance(v,c));
 for(let i=1;i<p.length;i++){if(Math.min(radii[i],radii[i-1])<20)continue;const a=Math.atan2(p[i-1].y-c.y,p[i-1].x-c.x),b=Math.atan2(p[i].y-c.y,p[i].x-c.x),t=Math.atan2(Math.sin(b-a),Math.cos(b-a));if(t>0)positive+=t;else negative-=t;}
 out.turns=Math.abs(positive-negative)/(2*Math.PI);out.radius=Math.max(...radii);
 const consistency=Math.max(positive,negative)/(positive+negative||1);
 const median=[...radii].sort((a,b)=>a-b)[Math.floor(radii.length/2)];
 const sharpest=Math.max(...p.slice(2,-2).map((_,j)=>Math.abs(angle(p[j],p[j+2],p[j+4]))));
 if(out.turns>=ADVANCED_GESTURE.minTurns-.025&&consistency>.97&&median>=ADVANCED_GESTURE.minRadius&&sharpest<.95){out.kind='spiral';out.confidence=.94;return out;}
 // Coarse tangent curvature is insensitive to tiny finger jitter and densely sampled points.
 const coarse=resample(p,Math.min(129,Math.max(49,Math.ceil(length/8)))),runs:{start:number;end:number;turn:number;sign:number}[]=[];
 for(let i=1;i<coarse.length-1;i++){
  const t=angle(coarse[i-1],coarse[i],coarse[i+1]);if(Math.abs(t)<.008)continue;
  const sign=Math.sign(t),last=runs.at(-1);if(last?.sign===sign){last.end=i+1;last.turn+=t;}else runs.push({start:i-1,end:i+1,turn:t,sign});
 }
 for(let j=0;j<runs.length;j++){
  const run=runs[j];
  run.start=j?Math.floor((runs[j-1].end+run.start)/2):0;
  run.end=j<runs.length-1?Math.ceil((run.end+runs[j+1].start)/2):coarse.length-1;
  const section=coarse.slice(run.start,run.end+1),l=pathLength(section),a=section[0],b=section.at(-1)!,chord=distance(a,b);
  const bend=Math.max(...section.map(v=>segmentDistance(v,a,b)))/(chord||1);
  if(l<ADVANCED_GESTURE.minCurveLength||Math.abs(run.turn)<ADVANCED_GESTURE.minCurveTurn||bend<ADVANCED_GESTURE.minCurveBend||chord/l<.35)continue;
  const maxTurn=Math.max(...section.slice(1,-1).map((_,i)=>Math.abs(angle(section[i],section[i+1],section[i+2]))));
  if(maxTurn>.65||maxTurn/Math.abs(run.turn)>.45)continue;
  out.curves.push({points:section,length:l,turn:run.turn,center:center(section)});
 }
 const covered=out.curves.reduce((n,v)=>n+v.length,0)/length;
 const thunder=analyzeThunder(p);
 if(thunder.valid){out.kind='z';out.confidence=.94;out.corners=thunder.corners;}
 else if(out.curves.length>=2&&covered>.8&&out.curves.every((v,i)=>!i||Math.sign(v.turn)!==Math.sign(out.curves[i-1].turn))&&out.turns<1.25){out.kind='wave';out.confidence=.92;}
 return out;
}
