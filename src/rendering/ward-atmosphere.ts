import {Container,Graphics} from 'pixi.js';
import {geometry,geometryTime} from './shared-geometry';
const CREAM=0xffefd1,GOLD=0xffc775,RED=0xf04a2b;
/** Layered curled clouds drift independently instead of rotating as one rigid badge. */
export class WardCloud extends Container{
 wisps:Graphics[]=[];
 constructor(public variant:number){
  super();
  for(let i=0;i<3;i++){
   const g=new Graphics();this.addChild(g);this.wisps.push(g);
   g.moveTo(-66,8).bezierCurveTo(-50,8,-50,-3,-32,-2).bezierCurveTo(-50,-23,-24,-35,-12,-19).bezierCurveTo(-7,-47,29,-39,30,-18).bezierCurveTo(51,-25,66,-3,46,6).bezierCurveTo(64,12,70,2,88,6).bezierCurveTo(59,23,28,12,6,16).bezierCurveTo(-19,23,-42,12,-66,8).closePath().fill({color:i===0?GOLD:CREAM,alpha:i===0?.18:i===1?.58:.83});
   g.moveTo(-27,-5).bezierCurveTo(-43,-20,-14,-30,-11,-13).bezierCurveTo(-10,-2,-24,2,-26,-8).moveTo(7,-10).bezierCurveTo(2,-35,34,-29,29,-13).bezierCurveTo(25,-1,11,-4,13,-15).moveTo(-6,10).bezierCurveTo(12,2,34,15,57,8).stroke({color:GOLD,width:.95,alpha:.6});
   g.scale.set([1.06,.9,.67][i],[.70,.84,.9][i]);
  }
 }
 update(t:number){
  this.wisps.forEach((g,i)=>{const phase=t*.65+this.variant*.9-i*.7;g.position.set(Math.sin(phase)*5+i*4,Math.sin(phase*.8)*3-i*3);g.scale.x=[1.06,.9,.67][i]*(1+Math.sin(phase)*.025);});
 }
}
/** A bending flame with a delayed tip, pale hot core and a detached ember. */
export class SpiritFlame extends Container{
 art=new Graphics();
 constructor(public seed:number){super();this.addChild(this.art);this.update(0);}
 update(t:number){
  geometry(this.art,`flame/${this.seed}/${geometryTime(t)}`,()=>{
  const phase=t*3.2+this.seed*.79,sway=Math.sin(phase)*7,tip=Math.sin(phase-1.1)*10,lift=Math.sin(phase*.7)*4,g=this.art;
  g.clear();
  g.moveTo(-8,14).bezierCurveTo(-31,0,-13,-20,5+sway,-26).bezierCurveTo(25+sway,-35,4+tip,-47,22+tip,-65-lift).bezierCurveTo(16+tip,-45,41+sway,-30,20+sway,-14).bezierCurveTo(4+sway,-1,24,3,12,14).bezierCurveTo(5,20,-3,19,-8,14).closePath().fill({color:RED,alpha:.82});
  g.moveTo(-8,10).bezierCurveTo(-23,-2,-7,-18,8+sway,-23).bezierCurveTo(29+sway,-35,9+tip,-42,22+tip,-65-lift).bezierCurveTo(8+tip,-43,31+sway,-31,12+sway,-16).bezierCurveTo(-5,-6,15,7,6,12).quadraticCurveTo(-2,17,-8,10).closePath().fill({color:GOLD,alpha:.8});
  g.moveTo(-7,10).bezierCurveTo(-19,-1,-4,-15,9+sway,-20).bezierCurveTo(22+sway,-26,13+sway,-32,19+tip,-40).bezierCurveTo(15+sway,-27,18+sway,-23,6+sway,-13).bezierCurveTo(-5,-4,8,7,2,12).quadraticCurveTo(-3,14,-7,10).closePath().fill({color:CREAM,alpha:.96});
  g.moveTo(-15,16).bezierCurveTo(-36,2,-23,-14,-9,-23).stroke({color:RED,width:2,alpha:.28});
  const y=-76-lift,x=24+tip;g.moveTo(x,y+5).quadraticCurveTo(x-5,y,x+2,y-9).quadraticCurveTo(x+6,y+1,x,y+5).fill({color:GOLD,alpha:.3+.25*Math.sin(phase)**2});
  });
 }
}
