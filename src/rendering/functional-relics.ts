import {PaperTigerRenderer} from './paper-tiger';
import {Container,Graphics} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {FunctionalRelicId} from '../gameplay/functional-relics';
import type {Arena} from '../input/line-interaction-geometry';

const GOLD=0xdcb36b,IVORY=0xffedc3;
/** Papercut motifs guided by assets/vfx/functional_relics/concept-v1.png. */
export function drawFunctionalRelic(g:Graphics,id:FunctionalRelicId,time=0){
 g.clear();
 if(id==='lantern'){
  g.ellipse(0,40,29,7).fill({color:0x11191d,alpha:.4});
  g.poly([-25,-25,0,-37,25,-25,20,-20,-20,-20]).fill({color:0x631f25}).stroke({color:GOLD,width:1.7});
  g.poly([-19,-20,18,-20,23,20,0,31,-22,19]).fill({color:0xa8322a}).stroke({color:GOLD,width:1.5});
  g.poly([-13,-15,0,-13,0,24,-15,16]).fill({color:0xf1b06a,alpha:.9});
  g.poly([4,-12,15,-16,18,17,4,24]).fill({color:0xe77a42,alpha:.8});
  g.moveTo(0,-13).lineTo(0,29).moveTo(-19,-20).lineTo(-22,19).moveTo(18,-20).lineTo(23,20).stroke({color:GOLD,width:2});
  g.moveTo(-10,-4).lineTo(-4,-4).lineTo(-4,5).lineTo(-10,5).lineTo(-10,13).moveTo(8,-3).lineTo(13,2).lineTo(8,10).stroke({color:0x8e2926,width:2});
  g.poly([-24,19,0,28,25,19,21,26,0,34,-24,25]).fill({color:0x5e2527}).stroke({color:GOLD,width:1.2});
  for(const x of [-19,19]){g.moveTo(x,26).lineTo(x+Math.sin(time*3+x)*2,41).stroke({color:GOLD,width:2});g.circle(x,43,2.4).fill({color:GOLD});}
  g.moveTo(0,-37).lineTo(0,-44).stroke({color:GOLD,width:1.6});g.circle(0,-44,3).stroke({color:GOLD,width:1.4});
 }else if(id==='hourglass'){
  g.ellipse(0,4,32,12).stroke({color:GOLD,width:.8,alpha:.4});
  g.moveTo(-16,-29).bezierCurveTo(-17,-10,-10,-5,0,0).bezierCurveTo(12,6,16,16,16,28).lineTo(-16,28).bezierCurveTo(-16,14,-10,6,0,0).bezierCurveTo(11,-5,17,-14,16,-29).closePath().fill({color:0x5b99ac,alpha:.28}).stroke({color:0xb2d9dc,width:1.4});
  const shift=(time*.5)%1;
  g.poly([-12,-22+shift*8,12,-22+shift*8,7,-10,0,-3,-7,-10]).fill({color:0xe6d0a2,alpha:.9});
  g.poly([-12,24,0,13-shift*5,12,24]).fill({color:0xf3dfa9});
  g.moveTo(0,-1).lineTo(0,13).stroke({color:IVORY,width:1.2});
  for(const x of [-22,22])g.moveTo(x,-31).lineTo(x,31).stroke({color:GOLD,width:2});
  for(const y of [-32,32]){g.roundRect(-26,y-3,52,6,2).fill({color:0x443b32}).stroke({color:GOLD,width:1.4});g.ellipse(0,y,24,5).stroke({color:GOLD,width:1});}
  g.poly([0,-42,6,-36,0,-32,-6,-36]).stroke({color:GOLD,width:1});
 }else{
  g.ellipse(0,25,33,7).fill({color:0x1b4248,alpha:.5});
  for(const [x,side] of [[-24,-1],[-13,-1],[24,1],[13,1]]){
   g.moveTo(0,20).bezierCurveTo(x*.8,18,x*1.4,-2,x,-14-Math.abs(x)*.2).bezierCurveTo(x*.5,-2,side*4,1,0,20).fill({color:Math.abs(x)>20?0xd1c79b:IVORY}).stroke({color:GOLD,width:.8});
  }
  g.moveTo(-8,17).quadraticCurveTo(-17,1,0,-22).quadraticCurveTo(18,1,8,17).closePath().fill({color:0xf3eac7}).stroke({color:GOLD,width:.8});
  g.ellipse(0,21,25,5).fill({color:0x76634b}).stroke({color:GOLD,width:1.6});
  g.moveTo(-3,8).bezierCurveTo(-15,-7,8,-14,2,-39).bezierCurveTo(20,-17,2,-13,7,3).closePath().fill({color:0x88d6ce,alpha:.85});
  g.moveTo(0,6).quadraticCurveTo(-5,-10,4,-23).quadraticCurveTo(10,-5,3,5).fill({color:0xe9fff0,alpha:.95});
  g.circle(0,27,3).stroke({color:GOLD,width:1});
 }
}

export class FunctionalRelicRenderer{
 world=new Container();wash=new Graphics();private ground=new Graphics();private lamp=new Graphics();private tiger=new PaperTigerRenderer();
 constructor(){this.world.addChild(this.ground,this.lamp,this.tiger.root);}
 update(game:Game,bounds:Arena,top=0,bottom=1280){
  const r=game.functionalRelics;this.world.visible=r.enabled;this.ground.clear();this.wash.clear();this.lamp.visible=false;
  if(!r.enabled)return;
  this.tiger.update(r.paperTiger,bounds);
  const g=this.ground,l=r.lantern??r.lanternEcho;
  if(l){
   const alpha=r.lantern?1:r.lanternEcho!.fade;
   g.circle(l.x,l.y,l.radius).stroke({color:GOLD,width:1.1,alpha:.2*alpha});g.circle(l.x,l.y,43).stroke({color:GOLD,width:1,alpha:.35*alpha});
   g.ellipse(l.x,l.y+19,38,9).fill({color:0xf3bd68,alpha:.12*alpha});
   g.circle(l.x,l.y-13,25).fill({color:0xf2ba68,alpha:.06*alpha});
   for(let i=0;i<7;i++){const t=(r.clock*.26+i*.143)%1,x=l.x+Math.sin(i*2.4+t*2)*29,y=l.y-20-t*38;g.circle(x,y,1.1+(i%2)*.5).fill({color:IVORY,alpha:alpha*Math.sin(t*Math.PI)*.6});}
   this.lamp.visible=true;drawFunctionalRelic(this.lamp,'lantern',r.clock);this.lamp.position.set(l.x,l.y-19+Math.sin(r.clock*2)*2);this.lamp.scale.set(.75);this.lamp.alpha=alpha;
   for(let i=0;i<3;i++)g.circle(l.x+(i-1)*12,l.y-63,3).fill({color:i<l.hits?IVORY:0x554a37,alpha});
   for(const e of game.enemies)if(e.lureId===l.id){g.moveTo(e.x,e.y).lineTo(l.x,l.y).stroke({color:GOLD,width:.8,alpha:.16*alpha});}
  }
  if(r.placing&&r.preview){const p=r.preview,valid=r.validPlacement(p,bounds);this.lamp.visible=true;drawFunctionalRelic(this.lamp,'lantern',r.clock);this.lamp.position.set(p.x,p.y-19);this.lamp.scale.set(.75);this.lamp.alpha=valid?.8:.35;g.circle(p.x,p.y,r.levels.lantern>=2?220:180).stroke({color:valid?GOLD:0xc74d46,width:1.7,alpha:.5});g.circle(p.x,p.y,23).stroke({color:valid?IVORY:0xc74d46,width:2,alpha:.6});}
  if(r.stopped){
   this.wash.rect(0,top,720,bottom-top).fill({color:0x16334e,alpha:.16});
   for(const e of game.enemies){g.circle(e.x,e.y,32).stroke({color:0xa9d5dc,width:1,alpha:.48});for(let i=0;i<3;i++){const a=i*2.094+.3,x=e.x+Math.cos(a)*37,y=e.y+Math.sin(a)*37;g.poly([x,y-5,x+3,y,x,y+5,x-3,y]).fill({color:0xb5dadd,alpha:.6});}}
  }
 }
}
