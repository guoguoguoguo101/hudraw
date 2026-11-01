import {Container,Graphics,type Texture} from 'pixi.js';
import {CRESCENT_GUARD,crescentPosition,type CrescentGuard} from '../gameplay/crescent-guard';
import {CrescentSpirit} from './crescent-spirit';

const orbitRate=Math.PI*2/CRESCENT_GUARD.period;
const floatY=(age:number,index:number)=>Math.sin(age*orbitRate+index*1.7)*3.2;

export class CrescentGuardRenderer{
 paperStyle=false;
 back=new Container();front=new Container();private shadows=new Graphics();private backTrail=new Graphics();private frontTrail=new Graphics();private impacts=new Graphics();
 private bodies=Array.from({length:CRESCENT_GUARD.count},()=>new CrescentSpirit());
 constructor(){
  this.back.eventMode=this.front.eventMode='none';this.back.sortableChildren=this.front.sortableChildren=true;
  this.shadows.zIndex=-3;this.backTrail.zIndex=this.frontTrail.zIndex=-2;this.impacts.zIndex=10000;
  this.back.addChild(this.shadows,this.backTrail);this.front.addChild(this.frontTrail,this.impacts);
 }
 set texture(texture:Texture){for(const body of this.bodies)body.texture=texture;}
 update(m:CrescentGuard,enabled:boolean,low=false){
  this.back.visible=this.front.visible=enabled;this.shadows.clear();this.backTrail.clear();this.frontTrail.clear();this.impacts.clear();for(const body of this.bodies)body.visible=false;if(!enabled)return;
  const opening=Math.min(1,m.age/.32),fade=Math.min(1,m.remaining/.4);
  for(const unit of m.units){
   const rear=unit.y<m.center.y,parent=rear?this.back:this.front,art=rear?this.backTrail:this.frontTrail,node=this.bodies[unit.index];if(node.parent!==parent)parent.addChild(node);
   const depth=(Math.sin(unit.angle)+1)/2,size=(.73+depth*.31)*(.65+opening*.35),bob=floatY(m.age,unit.index);
   node.visible=true;node.position.set(unit.x,unit.y+bob);node.zIndex=unit.y;
   node.scale.set(size*(unit.index===2?-1:1),size);
   node.rotation=Math.sin(unit.angle-.45)*.13+Math.sin(m.age*orbitRate+unit.index*1.7)*.035;
   node.alpha=fade*(.94+depth*.06);node.paperStyle=this.paperStyle;node.animate(m.age,unit.index,depth);
   // Shadows stay on the floor while the rounded body floats above them.
   const sx=unit.x+4,sy=unit.y+40*size,shadowWidth=(28+depth*8)*size;
   for(let j=3;j>=1;j--)this.shadows.ellipse(sx,sy,shadowWidth*(.7+j*.18),(4+depth*1.3)*(.7+j*.18)).fill({color:0x101e1e,alpha:fade*opening*(.035+depth*.015)});
   const span=1.15,steps=low?10:20;
   // One tapered ribbon per pigment avoids overlapping round caps looking like beads.
   for(const [color,width,mul]of [[0x1d2a29,24,.22],[0xd9573b,14,.85],[0xffe9b9,4.3,1]]as const){
    const left:number[]=[],right:number[]=[];
    for(let j=0;j<=steps;j++){
     const u=j/steps,angle=unit.angle-span+span*u,p=crescentPosition(angle,m.center);
     p.y+=floatY(m.age-(1-u)*span/orbitRate,unit.index);
     const dx=-Math.sin(angle)*CRESCENT_GUARD.radiusX,dy=Math.cos(angle)*CRESCENT_GUARD.radiusY,n=Math.hypot(dx,dy),r=width*.5*u**1.2;
     left.push(p.x-dy/n*r,p.y+dx/n*r);right.unshift(p.x+dy/n*r,p.y-dx/n*r);
    }
    art.poly([...left,...right]).fill({color,alpha:fade*opening*(.5+depth*.25)*mul});
   }
   if(!low)for(let j=0;j<3;j++){const a=unit.angle-.28-j*.24,p=crescentPosition(a,m.center),drift=Math.sin(m.age*orbitRate+j+unit.index)*5;art.poly([p.x,p.y-3+drift,p.x+2,p.y+drift,p.x,p.y+3+drift,p.x-2,p.y+drift]).fill({color:j%2?0xe16b40:0xffdf9c,alpha:fade*(.45-j*.1)});}
  }
  for(const c of m.contacts){const u=c.age/CRESCENT_GUARD.hitLife,fade=1-u,r=8+u*22,x=c.x,y=c.y;
   this.impacts.moveTo(x-Math.cos(c.angle+.6)*r,y-Math.sin(c.angle+.6)*r).quadraticCurveTo(x,y-8,x+Math.cos(c.angle+.6)*r,y+Math.sin(c.angle+.6)*r).stroke({color:0xd35436,width:8*fade,alpha:fade*.55}).stroke({color:0xffefd0,width:2.4*fade,alpha:fade});
   if(!low)for(let j=0;j<4;j++){const a=c.seed+j*Math.PI/2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;this.impacts.poly([px,py-3,px+2,py,px,py+3,px-2,py]).fill({color:j%2?0xe16b40:0xffdf9c,alpha:fade});}
  }
 }
}
