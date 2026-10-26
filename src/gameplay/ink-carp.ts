import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import {distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const INK_CARP_TIERS=[
 {count:0,cooldown:0,scale:0,range:0,flight:.4,life:.58,radius:0,damage:0,waveRadius:0,waveDamage:0},
 {count:1,cooldown:.85,scale:.42,range:210,flight:.4,life:.58,radius:22,damage:35,waveRadius:0,waveDamage:0},
 {count:2,cooldown:.8,scale:.5,range:240,flight:.42,life:.6,radius:26,damage:40,waveRadius:0,waveDamage:0},
 {count:3,cooldown:.95,scale:.8,range:280,flight:.48,life:.68,radius:42,damage:90,waveRadius:0,waveDamage:0},
 {count:1,cooldown:1.4,scale:1.22,range:330,flight:.55,life:1.0,radius:64,damage:145,waveRadius:125,waveDamage:110},
];
export type InkCarpState=Point&{origin:Point;dx:number;dy:number;distance:number;age:number;burst:boolean;hit:Set<number>;waveHit:Set<number>;scale:number;flight:number;life:number;radius:number;damage:number;waveRadius:number;waveDamage:number};
export class InkCarp{
 level=0;remaining=0;casts=0;fishes:InkCarpState[]=[];bounds:Arena={left:26,right:694,top:280,bottom:962};
 private stroke=false;private motion=0;private tip:Point|null=null;private direction:Point={x:1,y:0};private tone:'cast'|'impact'|null=null;
 get fish(){return this.fishes[0]??null;}
 get config(){return INK_CARP_TIERS[this.level];}
 get ready(){return this.level>0&&this.remaining<=1e-8;}
 get active(){return this.level>0&&this.stroke&&this.motion>0;}
 get cooldownRatio(){return this.config.cooldown?1-this.remaining/this.config.cooldown:1;}
 reset(){this.level=0;this.remaining=0;this.casts=0;this.fishes=[];this.stroke=false;this.motion=0;this.tip=null;this.tone=null;}
 prime(){this.remaining=0;}
 takeTone(){const tone=this.tone;this.tone=null;return tone;}
 begin(){this.stroke=true;this.motion=0;this.tip=null;}
 end(){this.stroke=false;this.motion=0;this.tip=null;}
 trace(a:Point,b:Point){
  const d=Math.hypot(b.x-a.x,b.y-a.y);if(!this.stroke||!this.level||!Number.isFinite(d)||d<.01)return;
  this.tip={...b};this.direction={x:(b.x-a.x)/d,y:(b.y-a.y)/d};this.motion=.11;if(this.ready)this.cast();
 }
 private cast(){
  if(!this.ready||!this.tip)return;
  const c=this.config,base=Math.atan2(this.direction.y,this.direction.x);
  for(let i=0;i<c.count;i++){
   const small=this.level===3&&i>0,angle=base+(this.level===2?(i===0?-.14:.14):small?(i===1?-.3:.3):0),dx=Math.cos(angle),dy=Math.sin(angle),b=this.tip,box=this.bounds;
   const tx=dx>0?(box.right-b.x)/dx:dx<0?(box.left-b.x)/dx:Infinity,ty=dy>0?(box.bottom-b.y)/dy:dy<0?(box.top-b.y)/dy:Infinity;
   this.fishes.push({x:b.x,y:b.y,origin:{...b},dx,dy,distance:Math.max(0,Math.min(c.range*(small?.9:1),tx,ty)),age:0,burst:false,hit:new Set(),waveHit:new Set(),scale:small?.34:c.scale,flight:c.flight+(small?.045:0),life:c.life+(small?.045:0),radius:small?18:c.radius,damage:small?24:c.damage,waveRadius:c.waveRadius,waveDamage:c.waveDamage});
  }
  if(this.fishes.length>6)this.fishes.splice(0,this.fishes.length-6);
  this.remaining=c.cooldown;this.casts++;this.tone='cast';
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void){
  if(!Number.isFinite(dt)||dt<=0)return;
  const activeFor=this.stroke?Math.min(dt,this.motion):0,before=this.remaining;
  this.remaining=Math.max(0,this.remaining-dt);this.motion=Math.max(0,this.motion-dt);
  if(activeFor>0&&before<=activeFor+1e-8&&this.ready)this.cast();
  for(const f of this.fishes){
   const a={x:f.x,y:f.y};f.age+=dt;
   if(!f.burst){
    const u=Math.min(1,f.age/f.flight),travel=f.distance*u,arc=Math.sin(u*Math.PI)*22*f.scale;
    f.x=Math.max(this.bounds.left,Math.min(this.bounds.right,f.origin.x+f.dx*travel-f.dy*arc));f.y=Math.max(this.bounds.top,Math.min(this.bounds.bottom,f.origin.y+f.dy*travel+f.dx*arc));
    for(const e of [...enemies])if(e.hp>0&&!f.hit.has(e.id)&&distanceToSegment(e,{a,b:f})<=f.radius+brushBodyRadius(e)){f.hit.add(e.id);damage(e,f.damage);}
    if(f.age>=f.flight){
     f.burst=true;if(f.waveRadius)this.tone='impact';
     if(f.waveRadius)for(const e of [...enemies]){const x=e.x-f.x,y=e.y-f.y,d=Math.hypot(x,y);if(e.hp>0&&!f.waveHit.has(e.id)&&d<=f.waveRadius+brushBodyRadius(e)&&(d<48||x*f.dx+y*f.dy>=-.15*d)){f.waveHit.add(e.id);damage(e,f.waveDamage);}}
    }
   }
  }
  this.fishes=this.fishes.filter(f=>f.age<f.life);
 }
}
