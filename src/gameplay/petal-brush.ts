import type {Point} from '../input/recognizer';

export type BrushLeaf={x:number;y:number;age:number;life:number;size:number;phase:number;angle:number;vx:number;vy:number;spin:number;tone:number};
/** Cosmetic timed brush enchantment. Emission follows traveled distance, never idle time. */
export class PetalBrush{
 readonly duration=12;remaining=0;petals:BrushLeaf[]=[];private serial=0;private spacing=0;
 get active(){return this.remaining>0;}
 activate(){this.remaining=this.duration;this.spacing=0;}
 reset(){this.remaining=0;this.petals=[];this.spacing=0;this.serial=0;}
 trace(a:Point,b:Point){
  if(!this.active||![a.x,a.y,b.x,b.y].every(Number.isFinite))return;
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.01)return;
  const step=29,start=step-this.spacing;
  // Bound work for any malformed or unusually long input, while keeping small samples continuous.
  for(let d=start,n=0;d<=length&&n<40;d+=step,n++){
   const id=++this.serial,phase=id*2.399963,u=d/length;
   this.petals.push({x:a.x+(b.x-a.x)*u+Math.sin(phase)*8,y:a.y+(b.y-a.y)*u+5,age:0,life:1.3+(id%5)*.14,size:4.8+(id%4)*.75,phase,angle:phase,vx:Math.sin(phase)*12,vy:42+(id%6)*5,spin:Math.cos(phase)*1.5,tone:id%9===0?3:id%3});
  }
  this.spacing=(this.spacing+length)%step;
  if(this.petals.length>72)this.petals.splice(0,this.petals.length-72);
 }
 advance(dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.remaining=Math.max(0,this.remaining-dt);
  for(const p of this.petals){p.age+=dt;p.x+=(p.vx+Math.sin(p.phase+p.age*3)*15)*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;}
  this.petals=this.petals.filter(p=>p.age<p.life);
 }
}
