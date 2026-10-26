import {InkRituals,insideInk} from './ink-formations';
import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {distanceToSegment} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export type TrailStyle='cinnabar'|'maple'|'thunder'|'maple-thunder';
export const INK_TRAIL_CONFIG=[
 {duration:0,damage:0,spread:1},
 {duration:2,damage:6,spread:1},
 {duration:3,damage:8,spread:1.05},
 {duration:4,damage:10,spread:1.2},
 {duration:5,damage:12,spread:1.25},
];
export const INK_TRAIL_LIMITS={segments:256,length:2600,tick:.5,settle:.25,};
export type TrailSegment={a:Point;b:Point;width:number;level:number;style:TrailStyle;born:number;expires:number;id:number;stroke:number};
export function trailStyle(maple:boolean,thunder:boolean):TrailStyle{return maple?(thunder?'maple-thunder':'maple'):(thunder?'thunder':'cinnabar');}
export function segmentLength(s:{a:Point;b:Point}){return Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y);}
/** Persistent footprints are a union: crossings and repeated strokes share one
 * enemy tick budget. Appearance/level are captured at paint time. */
export class InkTrail{
 rituals=new InkRituals();segments:TrailSegment[]=[];time=0;revision=0;
 private serial=0;private stroke=0;private nextHit=new Map<number,number>();private slow=new Set<number>();
 get length(){return this.segments.reduce((n,s)=>n+segmentLength(s),0);}
 begin(){this.stroke++;this.rituals.begin();}
 end(cancel=false,bounds?:import('../input/line-interaction-geometry').Arena){return this.rituals.end(cancel,bounds);}
 reset(){this.segments=[];this.rituals.reset();this.slow.clear();this.time=0;this.revision++;this.serial=0;this.stroke=0;this.nextHit.clear();}
 trace(a:Point,b:Point,width:number,level:number,style:TrailStyle){
  if(!level||!INK_TRAIL_CONFIG[level]||![a.x,a.y,b.x,b.y,width].every(Number.isFinite)||width<=0)return;
  const d=Math.hypot(b.x-a.x,b.y-a.y);if(d<.01)return;
  this.rituals.trace(a,b,level,style);this.revision++;
  const c=INK_TRAIL_CONFIG[level],count=Math.min(64,Math.ceil(d/24));
  for(let i=0;i<count;i++){
   const p={x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count},q={x:a.x+(b.x-a.x)*(i+1)/count,y:a.y+(b.y-a.y)*(i+1)/count};
   const existing=this.segments.find(s=>distanceToSegment(p,s)<1.5&&distanceToSegment(q,s)<1.5&&segmentLength(s)<=26);
   if(existing){existing.expires=this.time+c.duration;existing.width=width*c.spread;existing.level=level;existing.style=style;existing.stroke=this.stroke;continue;}
   const last=this.segments.at(-1),n=last?segmentLength(last):0;
   const aligned=last&&n>0&&(last.b.x-last.a.x)*(q.x-p.x)+(last.b.y-last.a.y)*(q.y-p.y)>0&&Math.abs((last.b.x-last.a.x)*(q.y-p.y)-(last.b.y-last.a.y)*(q.x-p.x))/(n*Math.hypot(q.x-p.x,q.y-p.y))<.015;
   if(last&&last.stroke===this.stroke&&last.style===style&&last.level===level&&Math.abs(last.width-width*c.spread)<.1&&this.time-last.born<.12&&Math.hypot(last.b.x-p.x,last.b.y-p.y)<.1&&n+Math.hypot(q.x-p.x,q.y-p.y)<=24&&aligned){last.b=q;last.expires=this.time+c.duration;}
   else this.segments.push({a:p,b:q,width:width*c.spread,level,style,born:this.time,expires:this.time+c.duration,id:++this.serial,stroke:this.stroke});
  }
  while(this.segments.length>INK_TRAIL_LIMITS.segments||this.length>INK_TRAIL_LIMITS.length)this.segments.shift();
 }
 isSlowed(id:number){return this.slow.has(id);}
 blockProjectile(a:Point,b:Point,radius=8){return this.rituals.block(a,b,radius,this.segments);}
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.time+=dt;
  this.segments=this.segments.filter(s=>s.expires>this.time);this.slow.clear();
  const ids=new Set(enemies.map(e=>e.id));for(const [id,until] of this.nextHit)if(!ids.has(id)||until<=this.time)this.nextHit.delete(id);
  for(const e of [...enemies]){
   if(e.hp<=0)continue;let amount=0;
   for(const s of this.segments)if(this.time-s.born+1e-8>=INK_TRAIL_LIMITS.settle&&distanceToSegment(e,s)<=s.width/2+brushBodyRadius(e))amount=Math.max(amount,INK_TRAIL_CONFIG[s.level].damage);
   if(amount&&!e.elite&&e.kind!=='boss')this.slow.add(e.id);
   if(amount&&(this.nextHit.get(e.id)??0)<=this.time+1e-8){this.nextHit.set(e.id,this.time+INK_TRAIL_LIMITS.tick);damage(e,amount);}
   if(!e.elite&&e.kind!=='boss'&&this.rituals.formations.some(f=>f.arrived&&insideInk(e,f.path)))this.slow.add(e.id);
  }
  this.rituals.advance(dt,enemies,damage,this.segments);
 }
}
