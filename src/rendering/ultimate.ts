import {drawShanhaiWave,type WaveLayers} from './shanhai-wave';
import {paperFlames,rollHead} from './scroll-ornaments';
import {paintShanhai} from './shanhai';
import {ultimateTiming} from '../gameplay/ultimate';
import type {Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
export let silhouetteOnly=false;
export function setSilhouetteOnly(value:boolean){silhouetteOnly=value;}
const WHITE=0xfffdf3,GOLD=0xe7ba68,RED=0xb73f37;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
type Knot={x:number;y:number};
function curve(g:Graphics,knots:Knot[],move=true){if(move)g.moveTo(knots[0].x,knots[0].y);for(let i=0;i<knots.length-1;i++){const a=knots[Math.max(0,i-1)],b=knots[i],c=knots[i+1],d=knots[Math.min(knots.length-1,i+2)];g.bezierCurveTo(b.x+(c.x-a.x)/6,b.y+(c.y-a.y)/6,c.x-(d.x-b.x)/6,c.y-(d.y-b.y)/6,c.x,c.y);}}
export function ribbonEdges(length:number,width:number,t:number,scroll:boolean){
 const top:Knot[]=[],bottom:Knot[]=[];
 for(let i=0;i<=7;i++){const f=i/7,x=18+length*f;
  const center=scroll?Math.sin(f*6.1-t*3)*width*.12+Math.sin(f*10+t*2)*width*.035:Math.sin(f*4.5+t*2)*width*.12;
  const envelope=scroll?(.13+.49*f+.045*Math.sin(f*8-t*2)):.12+.44*f;
  top.push({x,y:center-width*(envelope+.07*Math.sin(f*11+t*3))});
  bottom.push({x,y:center+width*(envelope+.06*Math.sin(f*8+.8-t*2))});
 }
 return {top,bottom};
}
function face(g:Graphics,edges:ReturnType<typeof ribbonEdges>,color:number,alpha:number,offset=0){
 const top=edges.top.map(p=>({x:p.x,y:p.y-offset})),bottom=edges.bottom.map(p=>({x:p.x,y:p.y+offset}));
 curve(g,top);const a=top.at(-1)!,b=bottom.at(-1)!;
 g.bezierCurveTo(a.x+48,a.y-12,a.x+8,a.y+(b.y-a.y)*.28,a.x+18,a.y+(b.y-a.y)*.38).lineTo(a.x-12,a.y+(b.y-a.y)*.48).bezierCurveTo(b.x+30,b.y-30,b.x-30,b.y+8,b.x,b.y);curve(g,[...bottom].reverse(),false);
 const c=bottom[0],d=top[0];g.bezierCurveTo(c.x-58,c.y+14,c.x+22,c.y-24,c.x-18,(c.y+d.y)*.5).bezierCurveTo(d.x-38,d.y+20,d.x-8,d.y-12,d.x,d.y).closePath().fill({color,alpha});
}
function seal(g:Graphics,x:number,y:number,r:number,a:number){
 g.moveTo(x-r,y).lineTo(x,y-r).lineTo(x+r,y).lineTo(x,y+r).closePath().stroke({color:RED,width:2.5,alpha:a});
 g.moveTo(x-r*.68,y).lineTo(x,y-r*.68).lineTo(x+r*.68,y).lineTo(x,y+r*.68).closePath().stroke({color:RED,width:1.4,alpha:a});
 g.moveTo(x-r*.45,y).quadraticCurveTo(x,y-r*.45,x+r*.45,y).quadraticCurveTo(x,y+r*.45,x-r*.45,y).stroke({color:RED,width:2,alpha:a});g.circle(x,y,r*.14).fill({color:RED,alpha:a});
}
function cloud(g:Graphics,x:number,y:number,size:number,a:number){
 g.moveTo(x-size,y+size*.15).bezierCurveTo(x-size*1.8,y,x-size*.4,y-size*.7,x-size*.25,y-size*.36)
 .bezierCurveTo(x-size*.1,y-size,x+size*.7,y-size*.65,x+size*.5,y-size*.12)
 .bezierCurveTo(x+size*1.4,y-size*.4,x+size*1.1,y+size*.3,x+size*.5,y+size*.23)
 .bezierCurveTo(x+size*.2,y+size*.7,x-size*.2,y+size*.35,x-size,y+size*.15).closePath().fill({color:WHITE,alpha:a}).stroke({color:GOLD,width:1,alpha:a*.8});
 g.moveTo(x-size*.4,y).bezierCurveTo(x-size*.2,y-size*.4,x+size*.4,y-size*.25,x+size*.15,y).stroke({color:GOLD,width:1.2,alpha:a*.65});
}
function spark(g:Graphics,x:number,y:number,r:number,a:number){g.moveTo(x,y-r*2).lineTo(x+r*.25,y-r*.2).lineTo(x+r,y).lineTo(x+r*.25,y+r*.2).lineTo(x,y+r*2).lineTo(x-r*.25,y+r*.2).lineTo(x-r,y).lineTo(x-r*.25,y-r*.2).closePath().fill({color:GOLD,alpha:a});}
export function drawUltimate(s:Skill,layers:Graphics[],ink?:Graphics,mask?:Graphics,wave?:WaveLayers){
 const p=s.slash!.ultimate!,t=s.age,[core,trail,rip,papers,burst]=layers,timing=ultimateTiming(p,t);
 for(const g of layers)g.resetTransform();ink?.clear();mask?.clear();ink?.resetTransform();mask?.resetTransform();
 if(wave)drawShanhaiWave(wave,p,t,silhouetteOnly);
 if(t<.08)return;
 const open=timing.scrollProgress,alpha=timing.scrollAlpha;
 if(open>0&&alpha>0){
  const fullLength=p.visualScrollLength??p.scrollLength,fullWidth=p.visualScrollWidth??p.scrollWidth;
  const length=fullLength*(1-Math.pow(1-open,2));
  const raw=ribbonEdges(length,fullWidth*(.55+.45*open),t,true);
  // A drawn bow: ends recede, the middle punches forward along the wave.
  const bend=(x:number)=>60-190*Math.sin(Math.PI*clamp((x-18)/fullLength));
  const edges={top:raw.top.map(q=>({x:q.x,y:q.y+bend(q.x)})),bottom:raw.bottom.map(q=>({x:q.x,y:q.y+bend(q.x)}))};
  // Fixed upper endpoint. The ribbon unfolds downward across the primary attack.
  const hit=s.slash!.secondaryCenter;
  const cx=(hit?(hit.x-s.x)*s.direction.x+(hit.y-s.y)*s.direction.y:260)-60;
  const cy=hit?-(hit.x-s.x)*s.direction.y+(hit.y-s.y)*s.direction.x:0;
  for(const g of [core,trail,rip,ink,mask,burst])g?.setTransform(0,1,-1,0,cx,cy-fullLength*.5-18);
  if(!silhouetteOnly){face(rip,edges,RED,alpha*.75,10);paperFlames(rip,edges,open,t,alpha);face(trail,edges,GOLD,alpha*.8,4);}
  face(core,edges,WHITE,alpha);
  if(!silhouetteOnly){
   const fold={top:edges.top.map((q,i)=>({x:q.x,y:q.y+12+Math.sin(i+t*4)*10})),bottom:edges.bottom.map((q,i)=>({x:q.x,y:q.y-9-Math.cos(i+t*3)*6}))};face(core,fold,0xeee4cf,alpha*.22);
   for(const boundary of [edges.top,edges.bottom]){curve(trail,boundary.map(q=>({x:q.x-8,y:q.y})));trail.stroke({color:GOLD,width:3,alpha:alpha*.85});}
   if(ink&&mask){face(mask,edges,0xffffff,1);
    paintShanhai(ink,fullLength,fullWidth,bend,alpha);
    for(let i=0;i<8;i++){const x=fullLength*(.10+i*.11);cloud(ink,x+12,bend(x)+fullWidth*(.10+(i%3)*.14),17+i%3*5,alpha*.85);}
    for(let i=0;i<2;i++){const x=fullLength*(.3+i*.45);seal(ink,x,bend(x)-18,13,alpha*.5);}

   }
   // Long irregular red peel blades, gold sparks and cloud knots hug the bow.
   for(let i=0;i<6;i++){const q=edges.top[i+1],sign=i%2?1:-1;const y=sign<0?q.y:edges.bottom[i+1].y;
    rip.moveTo(q.x-22,y).bezierCurveTo(q.x+5,y+sign*20,q.x+70,y+sign*40,q.x+88,y+sign*22).lineTo(q.x+43,y+sign*16).lineTo(q.x+59,y+sign*9).bezierCurveTo(q.x+9,y+sign*5,q.x-6,y,q.x-22,y).closePath().fill({color:RED,alpha:alpha*.82});
    cloud(trail,q.x+12,y+sign*16,22+i%3*5,alpha*.9);spark(trail,q.x+52,y+sign*(30+Math.sin(t*20+i)*8),5,alpha);
   }
   for(let i=0;i<6;i++){const f=(i+.5)/6;if(f>open)continue;const x=18+fullLength*f+(t-.2)*15,y=bend(x)+(i%2?1:-1)*(fullWidth*(.20+.48*f)+35+(t-.2)*45);papers.setTransform(0,1,-1,0,cx,cy-fullLength*.5-18);papers.moveTo(x-8,y-18).lineTo(x+10,y-14).lineTo(x+7,y+18).lineTo(x-12,y+15).closePath().fill({color:WHITE,alpha});seal(papers,x-1,y,7,alpha);papers.moveTo(x-5,y-12).lineTo(x+5,y-10).moveTo(x-5,y+10).lineTo(x+5,y+12).stroke({color:RED,width:1.8,alpha});}
   papers.resetTransform();
   rollHead(burst,edges.top[0],edges.bottom[0],alpha,t*5);
   rollHead(burst,edges.top.at(-1)!,edges.bottom.at(-1)!,alpha*clamp(length/60),-t*9);


  }
 }
 for(const g of [core,trail,rip,ink,mask,burst])g?.resetTransform();
 if(silhouetteOnly)return;
 const fade=Math.max(timing.waveAlpha,alpha);
 for(let i=0;i<3;i++){const x=90+i*110;seal(burst,x,0,12+i*3,timing.waveAlpha*.85);}
 for(let i=0;i<12;i++){const f=(i+.5)/12,x=45+f*p.slashLength,y=(i%2?1:-1)*(20+f*55+Math.sin(i*3+t*12)*12);spark(burst,x,y,3+i%3,timing.waveAlpha);}

 // Reduced existing flying paper and hit feedback, only after the outline is established.
 for(let i=0;i<Math.min(3,p.paperCount);i++){const f=(i+.5)/3,x=40+f*(p.visualScrollLength??p.scrollLength)+(t-.2)*90,y=(i%2?1:-1)*((p.visualScrollWidth??p.scrollWidth)*.7+Math.sin(i*4)*14);const a=fade*clamp((t-.2)/.1);papers.moveTo(x,y-8).lineTo(x+9,y-5).lineTo(x+7,y+12).lineTo(x-2,y+9).closePath().fill({color:WHITE,alpha:a});papers.moveTo(x+2,y-3).lineTo(x+6,y).lineTo(x+1,y+6).stroke({color:RED,width:1.2,alpha:a});}
 for(const hit of s.slash!.contacts){const age=t-hit.at;if(age<0||age>.10)continue;const dx=hit.x-s.x,dy=hit.y-s.y,x=dx*s.direction.x+dy*s.direction.y,y=-dx*s.direction.y+dy*s.direction.x,a=1-age/.1;burst.moveTo(x-18,y).lineTo(x+18,y).moveTo(x,y-12).lineTo(x,y+12).stroke({color:WHITE,width:2,alpha:a});}
}
