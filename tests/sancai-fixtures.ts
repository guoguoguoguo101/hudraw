import {resample,type Point} from '../src/input/recognizer';

/** Finger-like contour: start mid-edge, round each corner, bow the sides, stop short. */
export function handTriangle(scale:number,round:number,jitter:number,gap:number){
 const v=[{x:-100*scale,y:-100*scale},{x:110*scale,y:75*scale},{x:-90*scale,y:100*scale}];
 const lerp=(a:Point,b:Point,u:number)=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
 const start=lerp(v[2],v[0],.5),p:Point[]=[start];
 for(let i=0;i<3;i++){
  const b=v[i],entry=lerp(b,v[(i+2)%3],round),exit=lerp(b,v[(i+1)%3],round),a=p.at(-1)!;
  for(let j=1;j<=12;j++){const u=j/12,q=lerp(a,entry,u);p.push({x:q.x+Math.sin(u*Math.PI)*scale*7,y:q.y+Math.sin(u*Math.PI)*scale*4});}
  for(let j=1;j<=12;j++){const u=j/12;p.push({x:(1-u)**2*entry.x+2*(1-u)*u*b.x+u*u*exit.x,y:(1-u)**2*entry.y+2*(1-u)*u*b.y+u*u*exit.y});}
 }
 p.push(...resample([p.at(-1)!,start],12).slice(1));
 const dense=resample(p,200).slice(0,200-Math.round(gap*200));
 return dense.map((q,i)=>({x:360+q.x+Math.sin(i*.6)*jitter,y:600+q.y+Math.cos(i*.7)*jitter}));
}
