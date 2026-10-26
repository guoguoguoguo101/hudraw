import {Container,Graphics} from 'pixi.js';
import type {BrushUpgrades} from '../gameplay/brush-upgrades';
import type {Arena} from '../input/line-interaction-geometry';
import {WideBrushRenderer} from './wide-brush';
import {InkCarpRenderer} from './ink-carp';
import {DualBrushRenderer} from './dual-brush';
export class BrushUpgradeRenderer{
 root=new Container();private clip=new Graphics();
 readonly wide=new WideBrushRenderer();readonly carp=new InkCarpRenderer();readonly dual=new DualBrushRenderer();
 constructor(){this.root.eventMode='none';this.root.addChild(this.wide.root,this.carp.root,this.dual.root,this.clip);this.root.mask=this.clip;}
 update(m:BrushUpgrades,enabled:boolean,low=false,bounds?:Arena){
  this.root.visible=enabled;this.wide.update(m,enabled,low,bounds);this.carp.update(m.carp,enabled,low);this.dual.update(m.dual,enabled,low,bounds??{left:0,right:720,top:0,bottom:1280});if(!enabled)return;
  this.clip.clear();if(bounds)this.clip.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top).fill(0xffffff);
 }
}
