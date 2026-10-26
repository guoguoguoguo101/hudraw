import {Container,Graphics} from 'pixi.js';
import type {PetalBrush} from '../gameplay/petal-brush';
const LEAF_COLORS=[0xf3663f,0xd94c2d,0xeb9547,0xe8c17c];
export function mapleLeaf(g:Graphics,color:number,alpha=1){
 // Five cut-paper lobes, a warm folded face and restrained veins.
 g.poly([0,-12,2,-6,6,-9,5,-3,11,-4,8,1,10,3,3,5,0,8,-3,5,-10,3,-8,1,-11,-4,-5,-3,-6,-9,-2,-6]).fill({color,alpha});
 g.poly([0,-11,0,7,-3,4,-7,2,-4,-2,-4,-6,-1,-4]).fill({color:0xffbd72,alpha:alpha*.24});
 g.moveTo(0,11).quadraticCurveTo(-1,3,0,-8).moveTo(0,3).lineTo(7,-1).moveTo(0,3).lineTo(-7,-1).moveTo(0,-1).lineTo(4,-5).moveTo(0,-1).lineTo(-4,-5).stroke({color:0xffd89a,width:.65,alpha:alpha*.7});
}
export function mapleEmblem(g:Graphics){
 g.save().transform(1.65,.35,-.35,1.65,0,-2);mapleLeaf(g,LEAF_COLORS[0]);g.restore();
 g.save().transform(.68,-.5,.5,.68,22,10);mapleLeaf(g,LEAF_COLORS[3]);g.restore();
 g.moveTo(-20,17).quadraticCurveTo(-6,24,11,19).stroke({color:0xba7044,width:1,alpha:.5});
}
export class PetalBrushRenderer{
 root=new Container();private shadows=new Graphics();private art=new Graphics();
 constructor(){this.root.addChild(this.shadows,this.art);}
 update(model:PetalBrush,enabled:boolean,low=false){
  this.root.visible=enabled;this.shadows.clear();this.art.clear();if(!enabled)return;
  for(let i=0;i<model.petals.length;i++){
   if(low&&i%2)continue;const p=model.petals[i],fade=Math.min(1,p.age/.1,(p.life-p.age)/.5),flutter=Math.cos(p.phase+p.age*3.2),scale=p.size/10;
   this.shadows.ellipse(p.x+5,p.y+12,p.size*.4,p.size*.1).fill({color:0x162c2b,alpha:fade*.08});
   const c=Math.cos(p.angle),s=Math.sin(p.angle),flip=.3+.7*Math.abs(flutter);
   this.art.save().transform(c*scale*flip,s*scale*flip,-s*scale,c*scale,p.x,p.y);mapleLeaf(this.art,LEAF_COLORS[p.tone],fade*.95);this.art.restore();
  }
 }
}
