import {Graphics} from 'pixi.js';
import type {Point} from '../input/recognizer';
import {length,triangleArea,type Triangle} from '../input/line-interaction-geometry';
import type {InteractionEffect} from '../gameplay/line-interactions';
import {LINE_INTERACTION as C,triangleParticleCount} from '../gameplay/line-interaction-config';
import {triangleWindowFrame} from '../gameplay/triangle-window';
import type {Refraction} from '../gameplay/triangle-refraction';

const GOLD=0xffc765,WHITE=0xfff5cf,RED=0xcf3925,INK=0x3c2822;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const mix=(a:Point,b:Point,u:number):Point=>({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
const rand=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
/** Keep the internal sword sweeps inside the actual triangular damage window. */
export function clipToTriangle(a:Point,b:Point,t:Triangle):[Point,Point]|null{
 let lo=0,hi=1;const winding=(t[1].x-t[0].x)*(t[2].y-t[0].y)-(t[1].y-t[0].y)*(t[2].x-t[0].x),sign=winding>=0?1:-1;
 for(let i=0;i<3;i++){
  const p=t[i],q=t[(i+1)%3],dx=q.x-p.x,dy=q.y-p.y;
  const base=sign*(dx*(a.y-p.y)-dy*(a.x-p.x)),change=sign*(dx*(b.y-a.y)-dy*(b.x-a.x));
  if(Math.abs(change)<1e-9){if(base<0)return null;continue;}
  const at=-base/change;if(change>0)lo=Math.max(lo,at);else hi=Math.min(hi,at);if(lo>hi)return null;
 }
 return [mix(a,b,lo),mix(a,b,hi)];
}

/** Deterministic paper-cut shapes batched into one Graphics; no per-fragment nodes. */
export class LineInteractionArt{
 private remainingFragments:number=C.fragmentBudget;
 constructor(private g:Graphics){}
 beginFrame(low:boolean){this.remainingFragments=low?Math.ceil(C.fragmentBudget*.5):C.fragmentBudget;}
 private line(a:Point,b:Point,width:number,color:number,alpha:number){if(alpha>0&&width>0)this.g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width,color,alpha:clamp(alpha)});}
 private shape(p:Point[],color:number,alpha:number){if(alpha>0)this.g.poly(p.flatMap(p=>[p.x,p.y])).fill({color,alpha:clamp(alpha)});}
 private star(p:Point,size:number,alpha:number,angle=0){
  const points=Array.from({length:8},(_,i)=>{const a=angle+i*Math.PI/4,r=i%2?size*.19:size;return {x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};});
  this.shape(points,GOLD,alpha*.8);this.shape(points.map(q=>mix(p,q,.6)),WHITE,alpha);
 }
 private blade(a:Point,b:Point,width:number,alpha:number,seed=0){
  const len=length(a,b);if(len<1||alpha<=0||width<=0)return;
  const dx=(b.x-a.x)/len,dy=(b.y-a.y)/len,point=(u:number,v:number)=>({x:a.x+dx*len*u-dy*width*v,y:a.y+dy*len*u+dx*width*v});
  const contour=[[0,0],[.10,-.32],[.30,-.54],[.37,-.23],[.57,-.42],[.70,-.15],[1,0],[.73,.18],[.59,.47],[.46,.25],[.25,.5],[.08,.25]];
  this.shape(contour.map(([u,v])=>point(u,v*1.5)),INK,alpha*.22);
  this.shape(contour.map(([u,v])=>point(u,v)),GOLD,alpha);
  this.shape([[0,0],[.2,-.13],[.43,-.26],[.55,-.08],[.76,-.12],[.98,0],[.58,.14],[.3,.23]].map(([u,v])=>point(u,v)),WHITE,alpha);
  this.line(point(.04,0),point(1.03,0),1.2,WHITE,alpha*.8);
  if(width>8){const phase=seed%3*.04,a=point(.2+phase,.28),b=point(.4,-.25),c=point(.5,.2);this.g.moveTo(a.x,a.y).quadraticCurveTo(b.x,b.y,c.x,c.y).stroke({color:0xa96828,width:1.3,alpha:alpha*.65});}
 }
 private charm(p:Point,size:number,alpha:number,angle=0,gold=false){
  const c=Math.cos(angle),s=Math.sin(angle),point=(x:number,y:number)=>({x:p.x+(x*c-y*s)*size,y:p.y+(x*s+y*c)*size});
  this.shape([point(-.32,-1),point(.28,-.94),point(.35,.75),point(.07,1),point(-.3,.85)],gold?GOLD:RED,alpha);
  const outline=[point(-.23,-.79),point(.20,-.79),point(.20,.74),point(-.23,.74)];this.g.poly(outline.flatMap(p=>[p.x,p.y])).stroke({color:gold?WHITE:GOLD,width:1,alpha:alpha*.8});
  for(let i=0;i<4;i++){const y=-.56+i*.32;this.line(point(-.13,y),point(.14,y+.10),1,gold?0x995425:INK,alpha);this.line(point(0,y-.08),point(0,y+.23),1,gold?0x995425:INK,alpha);}
 }
 private fragments(e:InteractionEffect,t:number,count:number,power:number){
  if(t<0)return;
  for(let i=0;i<count&&this.remainingFragments>0;i++){
   const seed=e.id*101+i*7,u=rand(seed),angle=i*2.399963+rand(seed+1)*.8;
   const life=.42+rand(seed+2)*.18,age=t-(i%5)*.009;if(age<0||age>life)continue;
   this.remainingFragments--;
   const progress=age/life,dist=12+power*(.45+u*.75)*(1-Math.exp(-age*5)),alpha=(1-progress)**.8;
   const p={x:e.center.x+Math.cos(angle)*dist,y:e.center.y+Math.sin(angle)*dist+age*age*65};
   const size=(3+rand(seed+3)*8)*(1-progress*.3),spin=angle+age*(i%2?7:-6);
   if(i%11===0)this.charm(p,size*1.4,alpha*.9,spin);
   else if(i%4===0){const ca=Math.cos(spin),sa=Math.sin(spin);this.shape([{x:p.x-ca*size,y:p.y-sa*size},{x:p.x-sa*size*.55,y:p.y+ca*size*.55},{x:p.x+ca*size*1.6,y:p.y+sa*size*1.6}],i%8?GOLD:RED,alpha);}
   else this.blade({x:p.x-Math.cos(angle)*size*2.5,y:p.y-Math.sin(angle)*size*2.5},p,size*.65,alpha,i);
  }
 }
 cross(e:InteractionEffect,t:number,low:boolean){
  const g=this.g,hit=C.crossHitAt,p=e.center;
  if(t<hit){
   const u=clamp(t/hit);this.star(p,16*(1-u)+6,.4+u*.6,Math.PI/4);
   g.circle(p.x,p.y,27*(1-u)+9).stroke({color:GOLD,width:1.4,alpha:.3+u*.5});
   for(let i=0;i<2;i++){const a=t*20+i*Math.PI;this.charm({x:p.x+Math.cos(a)*22,y:p.y+Math.sin(a)*22},9,u,a);}return;
  }
  const age=t-hit,u=clamp(age/(e.duration-hit)),spread=1-(1-clamp(age/.13))**3,alpha=(1-u)**1.4;
  for(const [index,d] of e.directions.entries())for(const sign of [-1,1]){
   const reach=(35+C.crossReach*spread)*(1-u*.12),end={x:p.x+d.x*sign*reach,y:p.y+d.y*sign*reach};
   this.line(p,end,low?10:22,GOLD,alpha*.10);this.blade(p,end,(16+14*(1-u))*alpha,alpha,index);
   if(!low){const n={x:-d.y*sign,y:d.x*sign},side={x:end.x*.75+p.x*.25+n.x*9,y:end.y*.75+p.y*.25+n.y*9};this.blade({x:p.x+n.x*12,y:p.y+n.y*12},side,5,alpha*.55,index);}
  }
  this.star(p,38*(1-clamp(age/.22))+9,alpha,Math.PI/4);
  if(age<.08)g.circle(p.x,p.y,17*(1-age/.08)+3).fill({color:WHITE,alpha:(1-age/.08)*.85});
  this.fragments(e,age,low?10:22,105);
 }
 refraction(e:Refraction,age:number){
  const progress=clamp(age/C.refractionDuration),alpha=(1-progress)**1.3,reveal=1-(1-clamp(age/.10))**3;
  const draw=(s:{a:Point;b:Point},mirror:boolean)=>{
   const center=mix(s.a,s.b,.5),a=mix(center,s.a,reveal),b=mix(center,s.b,reveal);
   this.line(a,b,mirror?15:20,mirror?0x8edbd4:GOLD,alpha*.14);
   this.blade(center,a,mirror?14:19,alpha);this.blade(center,b,mirror?14:19,alpha);
   if(mirror)this.line(a,b,1.4,0xaff5e9,alpha*.7);
  };
  draw(e.original,false);for(const mirror of e.mirrors)draw(mirror,true);
  for(const p of e.triangle)this.star(p,13*(1-progress)+4,alpha,Math.PI/4);
 }
 triangle(e:InteractionEffect,t:number,low:boolean){
  const g=this.g,v=e.vertices!,p=e.center,area=triangleArea(v),radius=Math.sqrt(area/Math.PI),size=clamp(radius/150);
  const hit=C.triangleHitAt,cut=C.triangleCutAt,reveal=clamp(t/.1),tail=clamp((C.triangleDuration-t)/.12),before=t<hit;
  if(t<C.triangleDuration)g.poly(v.flatMap(p=>[p.x,p.y])).fill({color:GOLD,alpha:(before?.14+.045*Math.sin(t*24)**2:.04)*tail*reveal}).stroke({color:GOLD,width:1.4,alpha:reveal*tail*.55});
  if(t<C.triangleDuration){
   // The frame stays visible/interactive for the whole 2.2 seconds, including the final burst.
   const moving=triangleWindowFrame(v,p,t),rotation=C.triangleRotation*clamp(t/C.triangleHoldUntil),frameAlpha=reveal*tail;
   for(let i=0;i<3;i++){
    const a=moving[i],b=moving[(i+1)%3],width=(5+size*6)*reveal;
    this.line(a,b,low?width:width*2,GOLD,.12*frameAlpha);
    this.blade(a,mix(a,b,.54),width,frameAlpha,i);this.blade(b,mix(a,b,.46),width,frameAlpha,i+1);
    this.star(moving[i],9+reveal*5,frameAlpha,Math.PI/4+rotation);
    this.charm({x:moving[i].x,y:moving[i].y-8},14+size*7,frameAlpha,rotation,true);
    if(!low){const a1=mix(moving[i],moving[(i+1)%3],.18),a2=mix(moving[i],moving[(i+2)%3],.18),mid=mix(mix(a1,a2,.5),p,.10);g.moveTo(a1.x,a1.y).quadraticCurveTo(mid.x,mid.y,a2.x,a2.y).stroke({color:GOLD,width:1.8,alpha:frameAlpha*.65});}
   }
   for(let i=0;i<(low?4:7);i++){
    const age=t-(cut-.11+i*.045);if(age<0||age>.19)continue;
    const u=clamp(age/.09),fade=1-clamp((age-.06)/.13),angle=(i%2?-.75:.9)+i*.31;
    const center=mix(p,v[i%3],.1+(i%3)*.16),d={x:Math.cos(angle),y:Math.sin(angle)},span=radius*2.8+50;
    const clipped=clipToTriangle({x:center.x-d.x*span,y:center.y-d.y*span},{x:center.x+d.x*span,y:center.y+d.y*span},v);
    if(clipped)this.blade(clipped[0],mix(clipped[0],clipped[1],u),(10+size*14)*fade,fade*.95,i);
   }
   const flash=Math.max(0,1-Math.abs(t-cut)/.06);this.star(p,(12+radius*.18)*flash,flash*.85,Math.PI/4);
  }
  if(!before){
   const age=t-hit,u=clamp(age/(e.duration-hit)),flash=1-clamp(age/.17);
   for(let i=0;i<(low?7:11);i++){
    const angle=i*2.399+e.id,r=Math.min(220,50+radius*.9)*(1-(1-clamp(age/.11))**3)*(1-u*.2),a={x:p.x+Math.cos(angle)*5,y:p.y+Math.sin(angle)*5},b={x:p.x+Math.cos(angle)*r,y:p.y+Math.sin(angle)*r};
    this.blade(a,b,(15+size*14)*(1-clamp(age/.28)),1-clamp(age/.30),i);
   }
   this.star(p,(35+radius*.2)*flash+6,Math.max(flash,1-u)*.9,Math.PI/4);
   if(flash>0)g.circle(p.x,p.y,8+flash*(12+size*10)).fill({color:WHITE,alpha:flash*.9});
   this.fragments(e,age,triangleParticleCount(area,low),125+Math.min(160,radius*.8));
  }
 }
}
