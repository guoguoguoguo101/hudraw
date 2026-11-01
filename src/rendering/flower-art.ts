import {Graphics} from 'pixi.js';
const OUTLINE=0x773c50,ROSE=0xdc7892,BLUSH=0xffe4dd,JADE=0x6f9b87;
/** Shared five-petal peach blossom, used at gameplay and inventory sizes. */
export function flowerLeaves(g:Graphics,alpha=1){
 g.moveTo(-1,5).bezierCurveTo(-13,-6,-22,1,-23,7).bezierCurveTo(-12,13,-5,11,-1,5).fill({color:JADE,alpha});
 g.moveTo(1,5).bezierCurveTo(12,-7,20,-4,23,0).bezierCurveTo(18,10,7,12,1,5).fill({color:0x9ab8a1,alpha});
 g.moveTo(-18,7).lineTo(-2,6).lineTo(17,1).stroke({color:0xc4d5b0,width:.8,alpha:alpha*.7});
}
export function flowerBud(g:Graphics,alpha=1){
 g.moveTo(0,8).quadraticCurveTo(2,0,0,-9).stroke({color:JADE,width:2,alpha});
 flowerLeaves(g,alpha);
 g.moveTo(0,3).bezierCurveTo(-14,-2,-9,-17,-1,-21).bezierCurveTo(8,-18,15,-4,0,3).fill({color:ROSE,alpha}).stroke({color:OUTLINE,width:1,alpha:alpha*.7});
 g.moveTo(-1,0).bezierCurveTo(-4,-7,0,-13,-1,-19).bezierCurveTo(8,-11,7,-3,-1,0).fill({color:BLUSH,alpha:alpha*.8});
 g.moveTo(-9,-3).quadraticCurveTo(-4,6,0,4).quadraticCurveTo(6,2,10,-4).lineTo(3,8).lineTo(-4,7).closePath().fill({color:JADE,alpha});
}
export function peachFlower(g:Graphics,alpha=1,opening=1){
 flowerLeaves(g,alpha*.9);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5,c=Math.cos(a),s=Math.sin(a),r=.4+.6*opening;
  g.save().transform(c*r,s*r,-s*r,c*r,0,0);
  g.moveTo(0,2).bezierCurveTo(-10,-4,-17,-16,-9,-24).bezierCurveTo(-5,-28,-2,-23,0,-21).bezierCurveTo(3,-26,7,-28,11,-23).bezierCurveTo(18,-13,8,-2,0,2).fill({color:ROSE,alpha}).stroke({color:OUTLINE,width:.8,alpha:alpha*.55});
  g.moveTo(0,1).bezierCurveTo(-7,-5,-11,-15,-7,-20).quadraticCurveTo(-3,-23,0,-18).quadraticCurveTo(5,-24,9,-19).bezierCurveTo(13,-10,5,-3,0,1).fill({color:BLUSH,alpha:alpha*.9});
  g.moveTo(0,-3).quadraticCurveTo(-2,-9,-1,-14).stroke({color:0xebafa7,width:.7,alpha:alpha*.75});g.restore();
 }
 g.circle(0,0,5).fill({color:0xf3ca83,alpha});
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7,x=Math.cos(a)*8,y=Math.sin(a)*8;g.moveTo(0,0).lineTo(x,y).stroke({color:0xf6dba5,width:.8,alpha});g.circle(x,y,1.25).fill({color:0xffedb7,alpha});}
 g.circle(0,0,2).fill({color:0xb36756,alpha});
}
export function flowerEmblem(g:Graphics){g.save().transform(1.15,0,0,1.15,0,0);peachFlower(g);g.restore();}
