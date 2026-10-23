import {distance,smooth,type Point} from '../input/recognizer';

export type BrushSample=Point&{width:number;speed:number;nx:number;ny:number;length:number};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

/** Visual-only ribbon. Never feeds the recognizer or ink accounting. */
export function brushStroke(points:Point[],times:number[],baseWidth:number,released=false):BrushSample[]{
 if(points.length<2)return [];
 const path=smooth(points),samples:(Point&{time:number;length:number})[]=[];
 const spacing=Math.max(3,path.reduce((sum,p,i)=>sum+(i?distance(path[i-1],p):0),0)/1200);
 let length=0;
 samples.push({...path[0],time:times[0]??0,length:0});
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],d=distance(a,b),steps=Math.max(1,Math.ceil(d/spacing));
  const ta=times[i-1]??0,tb=times[i]??ta;
  for(let j=1;j<=steps;j++){const f=j/steps;samples.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,time:ta+(tb-ta)*f,length:length+d*f});}
  length+=d;
 }
 if(length<.01)return [];
 let speed=240,width=baseWidth*.65;
 const result:BrushSample[]=[];
 for(let i=0;i<samples.length;i++){
  const p=samples[i],a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)];
  const segment=distance(a,p),dt=p.time-a.time;
  if(i>0){const velocity=clamp(segment/Math.max(.001,dt),15,2200);speed+=(velocity-speed)*(1-Math.exp(-segment/16));}
  const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
  const prev=result.at(-1),turn=prev?Math.max(0,1-((-dy/n)*prev.nx+(dx/n)*prev.ny)):0;
  const target=baseWidth*(.46+.83/(1+speed/330)+Math.min(.2,turn*.7));
  width+=(target-width)*(1-Math.exp(-Math.max(segment,1)/10));
  // A planted start opens into the body; only a fast lift draws a long pointed exit.
  const entry=.38+.62*Math.min(1,p.length/Math.max(7,baseWidth*1.4));
  result.push({x:p.x,y:p.y,width:width*entry,speed,nx:-dy/n,ny:dx/n,length:p.length});
 }
 const last=result.at(-1)!,flick=released&&last.speed>300;
 const taper=Math.min(length*.32,flick?baseWidth*(1.5+Math.min(1.8,last.speed/650)):baseWidth*.65);
 for(const p of result){const t=clamp((length-p.length)/Math.max(1,taper),0,1);p.width*=flick?.045+.955*Math.pow(t,.8):.67+.33*t;}
 return result;
}
