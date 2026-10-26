import type {Point} from '../input/recognizer';

export type BrushArc={a:Point;b:Point;age:number;seed:number};
/** A timed visual brush state; arcs never add damage or trigger spell recognition. */
export class ThunderBrush{
 readonly duration=12;remaining=0;clock=0;arcs:BrushArc[]=[];contacts:{x:number;y:number;age:number;seed:number}[]=[];private serial=0;
 get active(){return this.remaining>0;}
 activate(){this.remaining=this.duration;}
 reset(){this.remaining=0;this.clock=0;this.arcs=[];this.contacts=[];this.serial=0;}
 trace(a:Point,b:Point){
  if(!this.active||![a.x,a.y,b.x,b.y].every(Number.isFinite))return;
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<1)return;
  const count=Math.min(40,Math.ceil(length/22));
  for(let i=0;i<count;i++)this.arcs.push({a:{x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count},b:{x:a.x+(b.x-a.x)*(i+1)/count,y:a.y+(b.y-a.y)*(i+1)/count},age:0,seed:++this.serial});
  if(this.arcs.length>120)this.arcs.splice(0,this.arcs.length-120);
 }
 hit(x:number,y:number){if(!this.active)return;this.contacts.push({x,y,age:0,seed:++this.serial});if(this.contacts.length>16)this.contacts.shift();}
 advance(dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.clock+=dt;this.remaining=Math.max(0,this.remaining-dt);
  for(const arc of this.arcs)arc.age+=dt;this.arcs=this.arcs.filter(a=>a.age<.32);
  for(const c of this.contacts)c.age+=dt;this.contacts=this.contacts.filter(c=>c.age<.22);
 }
}
