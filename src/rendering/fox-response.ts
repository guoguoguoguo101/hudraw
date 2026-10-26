import {Container,Graphics} from 'pixi.js';
import type {FoxRig} from './rigs';
import type {Game} from '../gameplay/game';
import type {InputController} from '../input/controller';
type Action='idle'|'brush'|'dragon';
/** Local character response only: no camera movement or gameplay displacement. */
export class FoxResponse{
 root=new Container();private glow=new Graphics();action:Action='idle';
 private facing=1;private aim=0;private energy=0;private wasDrawing=false;private started=-10;private released=-10;
 private castAt=-10;private effect=0;private clock=-1;
 constructor(){this.root.addChild(this.glow);}
 clear(){this.action='idle';this.facing=1;this.aim=this.energy=0;this.wasDrawing=false;this.started=this.released=this.castAt=-10;this.effect=0;this.clock=-1;this.glow.clear();}
 update(fox:FoxRig,game:Game,input:InputController,dt:number){
  const m=game.hualing;this.root.visible=game.hualingPractice;
  if(!this.root.visible){this.clear();return;}
  if(m.clock<this.clock)this.clear();this.clock=m.clock;
  const drawing=(input.drawing||m.drawing)&&game.active&&!m.upgrades.blocked;
  const p=m.selected?m.path.at(-1):input.points.at(-1),time=m.clock;
  if(drawing&&!this.wasDrawing)this.started=time;
  if(!drawing&&this.wasDrawing)this.released=time;
  this.wasDrawing=drawing;
  const latest=m.effects.at(-1);if(latest&&latest.id!==this.effect){this.effect=latest.id;if(latest.age<.3){this.castAt=time;this.action=latest.kind;}}
  const castAge=time-this.castAt,cast=Math.max(0,Math.sin(Math.PI*Math.min(1,castAge/.75)));
  if(castAge>=.75)this.action=drawing?'brush':'idle';
  if(p&&drawing){const dx=p.x-360;if(Math.abs(dx)>35)this.facing=dx<0?-1:1;const target=Math.max(-.14,Math.min(.14,(p.y-fox.root.y)/900));this.aim+=(target-this.aim)*(1-Math.exp(-dt*12));}
  this.energy+=((drawing?1:0)-this.energy)*(1-Math.exp(-dt*10));
  const start=Math.max(0,1-(time-this.started)/.22),end=Math.max(0,1-(time-this.released)/.3),sweep=Math.sin(time*7)*this.energy;
  fox.root.scale.x=Math.abs(fox.root.scale.x)*this.facing;
  fox.body.rotation+=this.aim*this.energy+cast*-.1;
  fox.body.y+=-start*5+end*3-cast*9;
  fox.body.scale.set(1+cast*.035,1-cast*.025);
  fox.head.rotation+=this.aim*.6*this.energy-cast*.08;fox.pupils.x+=this.energy*1.7;
  fox.left_arm.rotation-=this.energy*(.45+sweep*.12)+cast*.65;fox.right_arm.rotation+=this.energy*.2+cast*.3;
  fox.left_ear.rotation-=start*.1+this.energy*.04;fox.right_ear.rotation+=start*.1;
  fox.scarf.rotation+=sweep*.1+cast*.15;
  fox.restTails.forEach((tail,i)=>{tail.rotation-=this.energy*(.15+i*.035)+sweep*.07+cast*(.34-i*.06);tail.scale.x*=1+this.energy*.04+cast*.08;});
  this.glow.clear();const g=this.glow,alpha=this.energy*.3+cast*.65;
  if(alpha>.01){
   const thunder=m.thunder.active,color=thunder?0xb9dded:m.petals.active?0xefb8ab:0xe9bd76;
   const x=fox.root.x,y=fox.root.y+29;
   g.ellipse(x,y+7,25+cast*10,6+cast*3).stroke({color,width:1.2,alpha:alpha*.6});
   const handX=x+this.facing*15,handY=y-17;
   for(let i=0;i<(thunder?3:2);i++){const a=time*1.7+i*Math.PI,r=13+cast*9,px=handX+Math.cos(a)*r,py=handY+Math.sin(a)*r*.5;
    if(thunder)g.moveTo(px-3,py-5).lineTo(px+2,py-1).lineTo(px-1,py+2).lineTo(px+4,py+5).stroke({color,width:1,alpha});
    else g.ellipse(px,py,m.petals.active?2.4:1.6,1.3).fill({color,alpha});
   }
   if(cast>.05){const r=18+castAge*35;g.arc(x,y-12,r,-2.6,-.5).stroke({color,width:1.2,alpha:cast*.65});}
  }
 }
}
