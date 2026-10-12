import {Container,Graphics} from 'pixi.js';
/** Long neck, black flight feathers and trailing legs distinguish cranes from generic birds. */
export class AscendantCrane extends Container{
 art=new Graphics();
 constructor(public seed:number){super();this.addChild(this.art);}
 update(t:number){
  const flap=Math.sin(t*3.6+this.seed*.83),lift=flap*24,g=this.art;g.clear();
  for(const sign of [-1,1]){
   g.moveTo(sign*3,4).bezierCurveTo(sign*18,-21,sign*35,-32-lift,sign*62,-40-lift).lineTo(sign*49,-14-lift*.65).lineTo(sign*53,-12-lift*.6).lineTo(sign*37,0-lift*.35).lineTo(sign*41,3-lift*.35).lineTo(sign*25,10).quadraticCurveTo(sign*11,15,sign*3,4).fill({color:0xfff3d6}).stroke({color:0xe8be73,width:1});
   g.moveTo(sign*62,-40-lift).lineTo(sign*49,-14-lift*.65).lineTo(sign*53,-12-lift*.6).lineTo(sign*37,-lift*.35).lineTo(sign*41,3-lift*.35).lineTo(sign*25,10).quadraticCurveTo(sign*29,-5-lift*.3,sign*62,-40-lift).fill({color:0x383a35,alpha:.9});
  }
  g.ellipse(0,7,9,21).fill({color:0xfff3d6});g.moveTo(-3,-6).bezierCurveTo(-14,-22,8,-22,5,-37).quadraticCurveTo(13,-37,11,-28).bezierCurveTo(10,-16,-3,-23,3,-6).fill({color:0xfff3d6});g.circle(8,-37,4).fill({color:0xfff3d6});g.ellipse(8,-40,3,1.8).fill({color:0xda3d29});g.poly([11,-38,23,-35,11,-35]).fill({color:0xbd8d52});
  for(const sign of [-1,1])g.moveTo(sign*3,22).lineTo(sign*7,42).lineTo(sign*3,47).stroke({color:0x805e3d,width:1.4});
 }
}
