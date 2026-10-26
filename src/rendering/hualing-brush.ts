import {Container,Graphics} from 'pixi.js';
import type {InputController} from '../input/controller';
import type {Point} from '../input/recognizer';
import type {BrushUpgrades} from '../gameplay/brush-upgrades';
import {BRUSH_BASE_WIDTH} from '../gameplay/brush-upgrades';

type Fleck={x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;angle:number;color:number};
type Stroke={a:Point;b:Point;age:number;wa:number;wb:number;nx:number;ny:number;length:number;dry:number};
/** Small, bounded ink and cut-paper accents. These never participate in combat. */
export class HualingBrushFX{
 root=new Container();private ink=new Graphics();private light=new Graphics();private paper=new Graphics();private brush=new Graphics();
 private flecks:Fleck[]=[];private strokes:Stroke[]=[];private flashes:{x:number;y:number;age:number;angle:number;power:number;dead:boolean}[]=[];
 private last:Point|null=null;private gesture=-1;private wasDrawing=false;private time=0;private serial=0;
 private width=BRUSH_BASE_WIDTH;private speed=300;private direction:Point={x:1,y:0};private length=0;private lastTime=0;
 private electricMode=false;private body=0xff654c;private gold=0xffd590;enabled=false;
 constructor(){this.root.addChild(this.ink,this.light,this.paper,this.brush);}
 clear(){this.flecks=[];this.strokes=[];this.flashes=[];this.last=null;this.wasDrawing=false;this.gesture=-1;this.width=BRUSH_BASE_WIDTH;this.speed=300;this.length=0;for(const g of [this.ink,this.light,this.paper,this.brush])g.clear();}
 private emit(p:Point,count:number,power:number){
  for(let i=0;i<count;i++){
   const n=++this.serial,angle=n*2.399963,speed=power*(.35+(n%7)/9);
   this.flecks.push({x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-12,age:0,life:.18+(n%5)*.035,size:1.6+(n%4)*.7,angle,color:n%3?this.gold:this.body});
  }
  if(this.flecks.length>96)this.flecks.splice(0,this.flecks.length-96);
 }
 hit(x:number,y:number,dead=false,amount=30){if(!this.enabled)return;
  const power=dead?1.6:Math.min(1.4,.85+amount/200),angle=Math.atan2(this.direction.y,this.direction.x);
  this.flashes.push({x,y,age:0,angle,power,dead});if(this.flashes.length>16)this.flashes.shift();
  this.emit({x,y},dead?22:9,dead?260:165);
  // Cream and cinnabar paper chips make a kill read differently from a normal cut.
  if(dead)for(const p of this.flecks.slice(-22)){p.size*=1.8;p.life+=.18;p.color=this.serial++%2?0xf4e5c6:this.body;}
 }
 /** Consume accepted input immediately: the display's 24-point tail may already have
  * evicted samples by the next frame, or the pointer may have been released. */
 trace(a:Point,b:Point,gesture:number,time:number,width=BRUSH_BASE_WIDTH){
  const d=Math.hypot(b.x-a.x,b.y-a.y);if(!Number.isFinite(d)||d<=1)return;
  const dx=(b.x-a.x)/d,dy=(b.y-a.y)/d;
  if(this.gesture!==gesture){this.gesture=gesture;this.width=width*.18;this.speed=300;this.length=0;this.lastTime=0;this.emit(a,3,24);}
  this.speed+=(Math.min(2400,d/Math.max(.008,time-this.lastTime))-this.speed)*.35;
  const count=Math.min(48,Math.ceil(d/12)),wa=this.width;
  for(let j=0;j<count;j++){const u=j/count,v=(j+1)/count;
   this.strokes.push({a:{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},b:{x:a.x+(b.x-a.x)*v,y:a.y+(b.y-a.y)*v},age:0,wa:wa+(width-wa)*u,wb:wa+(width-wa)*v,nx:-dy,ny:dx,length:this.length+d*u,dry:Math.min(.55,.12+this.speed/4500)});
  }
  if(this.strokes.length>320)this.strokes.splice(0,this.strokes.length-320);
  this.length+=d;this.width=width;this.direction={x:dx,y:dy};this.last={...b};this.lastTime=time;
  if(d>12)this.emit(b,Math.min(2,Math.ceil(d/60)),20);
 }
 update(input:InputController,dt:number,enabled:boolean,electric=false,upgrades?:BrushUpgrades){
  if(this.electricMode!==electric){this.flecks=[];this.flashes=[];this.electricMode=electric;}this.ink.visible=!electric||!!upgrades?.levels.wide;
  this.root.visible=enabled;this.enabled=enabled;if(!enabled){this.clear();return;}
  dt=Math.max(0,Math.min(.05,dt));this.time+=dt;
  this.body=electric?0xcdd5cd:input.penSnapshot.id==='gold'?0xffd17a:input.penSnapshot.id==='mountain'?0xb4ded1:0xff654c;this.gold=electric?0xb6ae92:0xffdf9c;
  if(upgrades?.levels.wide&&!electric){this.body=upgrades.levels.wide>=3?0x9d3027:0xc74e32;this.gold=0xf0d19a;}
  const tip=input.drawing?input.points.at(-1):undefined;
  if(tip&&this.gesture!==input.gestureId){
   // A fresh touch has no accepted movement yet; never join it to the previous stroke.
   this.gesture=input.gestureId;this.last=null;this.width=(upgrades?.width??BRUSH_BASE_WIDTH)*.18;this.length=0;this.lastTime=0;
  }
  if(!tip){
   if(this.wasDrawing&&this.last)this.emit(this.last,3,28);
   this.last=null;
  }
  this.wasDrawing=!!tip;
  this.ink.clear();this.light.clear();this.paper.clear();this.brush.clear();
  for(const s of this.strokes){s.age+=dt;const fade=Math.max(0,Math.min(1,(.42-s.age)/.28)),{a,b,nx,ny}=s;
   if(upgrades?.levels.wide===4){
    this.ink.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:0x071820,width:5,alpha:fade*.8,cap:'round'});
    this.light.moveTo(a.x+nx*2.5,a.y+ny*2.5).lineTo(b.x+nx*2.5,b.y+ny*2.5).stroke({color:electric?0xd9f3ff:0xffefc8,width:1.5,alpha:fade*.95});
    this.light.moveTo(a.x-nx*2,a.y-ny*2).lineTo(b.x-nx*2,b.y-ny*2).stroke({color:0xd6a85f,width:.8,alpha:fade*.6});
    continue;
   }
   // A solid narrow core with round joins keeps fast and sharply turning strokes
   // connected. Fly-white accents belong to the edges, not eleven isolated strips.
   this.ink.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:this.body,width:Math.min(s.wa,s.wb)*.7,alpha:fade*.94,cap:'round',join:'round'});
   for(let i=0;i<8;i++){
    const lane=(i+.5)/8-.5,edge=Math.abs(lane)*2;
    if(edge<.5)continue;
    const along=(length:number,width:number)=>{
     const grain=Math.sin(length*.13+i*3.7),dryPatch=Math.max(0,Math.sin(length*.055+i*4.3));
     const gap=.08+s.dry*(.16+.2*dryPatch),half=(1-gap)/16;
     const shift=Math.sin(length*.045+i*2)*.008,w=width*(1+grain*.025);
     return{lo:(lane-half+shift)*w,hi:(lane+half+shift)*w};
    };
    const sa=along(s.length,s.wa),sb=along(s.length+Math.hypot(b.x-a.x,b.y-a.y),s.wb);
    this.ink.poly([a.x+nx*sa.lo,a.y+ny*sa.lo,b.x+nx*sb.lo,b.y+ny*sb.lo,b.x+nx*sb.hi,b.y+ny*sb.hi,a.x+nx*sa.hi,a.y+ny*sa.hi]).fill({color:i%4===0?0xff9b70:this.body,alpha:fade*(.88-edge*.12)});
   }
   if(s.length%33<9)this.light.moveTo(a.x+nx*s.wa*.42,a.y+ny*s.wa*.42).lineTo(b.x+nx*s.wb*.42,b.y+ny*s.wb*.42).stroke({color:this.gold,width:.65,alpha:fade*.46});
  }
  this.strokes=this.strokes.filter(s=>s.age<.42);
  for(const f of this.flashes){f.age+=dt;const life=f.dead?.38:.25,u=Math.min(1,f.age/life),r=(12+u*43)*f.power,alpha=(1-u)**2;
   const g=this.light,c=Math.cos(f.angle),s=Math.sin(f.angle);
   g.save().transform(c,s,-s,c,f.x,f.y);
   // A fast contact core, a directional cut and a slower broken shock arc.
   if(f.age<.075){const a=1-f.age/.075;g.ellipse(0,0,(9+9*a)*f.power,(4+4*a)*f.power).fill({color:0xfff8dc,alpha:a});}
   g.moveTo(-r,3*f.power).quadraticCurveTo(0,-8*f.power,r,0).stroke({color:this.body,width:7*alpha*f.power,alpha:alpha*.8});
   g.moveTo(-r*.8,1).quadraticCurveTo(0,-6*f.power,r*.95,-1).stroke({color:0xfff1c4,width:2.6*alpha*f.power,alpha});
   for(const side of [-1,1])g.moveTo(-r*.27,side*r*.32).quadraticCurveTo(r*.1,side*r*.7,r*.4,side*r*.28).stroke({color:this.gold,width:1.5*alpha,alpha:alpha*.7});
   if(f.dead){g.arc(0,0,r*.7,.2,2.5).stroke({color:this.gold,width:2*alpha,alpha:alpha*.8});g.arc(0,0,r*.7,3.1,5.3).stroke({color:0xffefd4,width:alpha,alpha});}
   g.restore();
  }
  this.flashes=this.flashes.filter(f=>f.age<(f.dead?.38:.25));
  for(const p of this.flecks){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;p.angle+=dt*2;const alpha=Math.max(0,1-p.age/p.life),dx=Math.cos(p.angle)*p.size,dy=Math.sin(p.angle)*p.size;
   this.paper.poly([p.x-dx,p.y-dy,p.x-dy*.55,p.y+dx*.55,p.x+dx,p.y+dy,p.x+dy*.55,p.y-dx*.55]).fill({color:p.color,alpha:alpha*.8});
  }
  this.flecks=this.flecks.filter(p=>p.age<p.life);
  if(tip){
   const g=this.brush,spread=Math.min(1.05,this.width/45),angle=.48+this.direction.x*.08;
   g.save().transform(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),tip.x,tip.y);
   // Ivory soft hairs and a short lacquer handle keep the contact visible at phone scale.
   g.moveTo(0,1).bezierCurveTo(-11*spread,-3,-10,-15,-5,-26).lineTo(5,-26).bezierCurveTo(9,-15,10*spread,-3,0,1).fill(0xffedce).stroke({color:0xd5a263,width:.7,alpha:.8});
   g.moveTo(0,1).bezierCurveTo(-7*spread,-2,-6,-8,-4,-12).quadraticCurveTo(0,-8,6*spread,-5).quadraticCurveTo(5,-1,0,1).fill(this.body);
   for(let i=0;i<5;i++){const x=(i-2)*1.7;g.moveTo(x,-24).quadraticCurveTo(x*1.3-1,-11,x*spread*.5,-2).stroke({color:i%2?0xffffff:0xd9ab74,width:.65,alpha:.65});}
   g.roundRect(-5.5,-33,11,8,2).fill(electric?0xd6d9c8:0xffd58b).stroke({color:electric?0xf4fcff:0xffedc4,width:.7});
   g.moveTo(-4.5,-33).lineTo(-3.8,-70).quadraticCurveTo(0,-75,3.8,-70).lineTo(4.5,-33).closePath().fill(electric?0x303c42:0xb93e32).stroke({color:electric?0xb7bcae:0xffc882,width:.9});
   g.moveTo(-2,-67).lineTo(-2,-36).stroke({color:electric?0x8c9e9c:0xff9574,width:1.4,alpha:.8});
   g.moveTo(-4,-62).lineTo(4,-62).moveTo(-4.4,-37).lineTo(4.4,-37).stroke({color:electric?0xd4cfb7:0xffd997,width:1.6});
   g.ellipse(0,-69,3.8,2).fill(electric?0xe3f8ff:0xffdfa4);g.restore();
  }
 }
}
