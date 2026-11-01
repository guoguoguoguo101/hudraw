import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import type {Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export type BrushArc={a:Point;b:Point;age:number;seed:number};
export const THUNDER_BRUSH={interval:.42,radius:120,jumpRadius:140,reach:300,roots:2,targets:5,damage:24,falloff:.8,life:.24,hopDelay:.045};
export type ConductedArc=BrushArc&{target:number;depth:number;damage:number;fired:boolean};
/** Timed brush enchantment. Conducted hits use the shared secondary-damage path. */
export class ThunderBrush{
 readonly duration=12;remaining=0;clock=0;arcs:BrushArc[]=[];links:ConductedArc[]=[];contacts:{x:number;y:number;age:number;seed:number}[]=[];tip:Point|null=null;conducting=false;private serial=0;private nextPulse=0;
 get active(){return this.remaining>0;}
 activate(){if(!this.active)this.nextPulse=this.clock;this.remaining=this.duration;}
 reset(){this.remaining=0;this.clock=0;this.arcs=[];this.links=[];this.contacts=[];this.tip=null;this.conducting=false;this.serial=this.nextPulse=0;}
 begin(origin?:Point){this.tip=origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?{...origin}:null;}
 end(){this.tip=null;this.conducting=false;}
 trace(a:Point,b:Point){
  if(!this.active||![a.x,a.y,b.x,b.y].every(Number.isFinite))return;
  this.tip={...b};
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1)return;
  const count=Math.min(40,Math.ceil(length/22));
  for(let i=0;i<count;i++)this.arcs.push({a:{x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count},b:{x:a.x+(b.x-a.x)*(i+1)/count,y:a.y+(b.y-a.y)*(i+1)/count},age:0,seed:++this.serial});
  if(this.arcs.length>120)this.arcs.splice(0,this.arcs.length-120);
 }
 hit(x:number,y:number){if(!this.active)return;this.contacts.push({x,y,age:0,seed:++this.serial});if(this.contacts.length>16)this.contacts.shift();}
 private pulse(enemies:Enemy[],bounds?:Arena){
  const origin=this.tip!;
  const pool=enemies.filter(e=>e.hp>0&&e.ai!=='Death'&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(!bounds||e.x>=bounds.left&&e.x<=bounds.right&&e.y>=bounds.top&&e.y<=bounds.bottom)&&Math.hypot(e.x-origin.x,e.y-origin.y)<=THUNDER_BRUSH.reach);
  const used=new Set<number>(),front:{p:Point;depth:number}[]=[];
  const nearest=(p:Point,radius:number)=>pool.filter(e=>!used.has(e.id)&&Math.hypot(e.x-p.x,e.y-p.y)<=radius+Math.min(36,brushBodyRadius(e))).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id-b.id)[0];
  const link=(from:Point,e:Enemy,depth:number)=>{used.add(e.id);const to={x:e.x,y:e.y};this.links.push({a:{...from},b:to,age:-depth*THUNDER_BRUSH.hopDelay,seed:++this.serial,target:e.id,depth,damage:THUNDER_BRUSH.damage*Math.pow(THUNDER_BRUSH.falloff,depth),fired:false});front.push({p:to,depth});};
  for(let i=0;i<THUNDER_BRUSH.roots;i++){const e=nearest(origin,THUNDER_BRUSH.radius);if(!e)break;link(origin,e,0);}
  for(let i=0;i<front.length&&used.size<THUNDER_BRUSH.targets;i++){const from=front[i],e=nearest(from.p,THUNDER_BRUSH.jumpRadius);if(e)link(from.p,e,from.depth+1);}
  if(this.links.length>20)this.links.splice(0,this.links.length-20);
 }
 advance(dt:number,enemies:Enemy[]=[],damage?:(e:Enemy,n:number)=>void,brushDown=false,bounds?:Arena){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.clock+=dt;this.remaining=Math.max(0,this.remaining-dt);
  for(const arc of this.arcs)arc.age+=dt;this.arcs=this.arcs.filter(a=>a.age<.32);
  for(const c of this.contacts)c.age+=dt;this.contacts=this.contacts.filter(c=>c.age<.22);
  for(const arc of this.links)arc.age+=dt;
  this.conducting=this.active&&brushDown&&!!this.tip&&(!bounds||this.tip.x>=bounds.left&&this.tip.x<=bounds.right&&this.tip.y>=bounds.top&&this.tip.y<=bounds.bottom);
  if(this.conducting&&this.clock+1e-8>=this.nextPulse){this.pulse(enemies,bounds);this.nextPulse=Math.max(this.nextPulse,this.clock-dt)+THUNDER_BRUSH.interval;}
  else if(!this.conducting)this.nextPulse=Math.max(this.nextPulse,this.clock);
  for(const arc of this.links)if(!arc.fired&&arc.age>=-1e-8){arc.fired=true;const e=enemies.find(e=>e.id===arc.target&&e.hp>0);if(e){this.hit(e.x,e.y);damage?.(e,arc.damage);}}
  this.links=this.links.filter(a=>a.age<THUNDER_BRUSH.life);
 }
}
