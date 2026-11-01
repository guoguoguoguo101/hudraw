import {BrushLineRenderer} from './brush-line';
import {Container,Graphics} from 'pixi.js';
import type {BrushUpgrades} from '../gameplay/brush-upgrades';
import type {Arena} from '../input/line-interaction-geometry';
import {WideBrushRenderer} from './wide-brush';
import {InkCarpRenderer} from './ink-carp';
import {DualBrushRenderer} from './dual-brush';
export class BrushUpgradeRenderer{
 root=new Container();private clip=new Graphics();private clipBounds?:Arena;private clipReady=false;
 readonly line=new BrushLineRenderer();readonly wide=new WideBrushRenderer();readonly carp=new InkCarpRenderer();readonly dual=new DualBrushRenderer();
 constructor(){this.root.eventMode='none';this.root.addChild(this.wide.root,this.carp.root,this.dual.root,this.line.root,this.clip);this.root.mask=this.clip;}
 update(m:BrushUpgrades,enabled:boolean,low=false,bounds?:Arena){
  this.root.visible=enabled;this.line.update(m.line,enabled,low);this.wide.update(m,enabled,low,bounds);this.carp.update(m.carp,enabled,low);this.dual.update(m.dual,enabled,low,bounds??{left:0,right:720,top:0,bottom:1280});if(!enabled)return;
  if(!this.clipReady||bounds?.left!==this.clipBounds?.left||bounds?.top!==this.clipBounds?.top||bounds?.right!==this.clipBounds?.right||bounds?.bottom!==this.clipBounds?.bottom){
   this.clip.clear();if(bounds)this.clip.rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top).fill(0xffffff);
   this.clipBounds=bounds?{...bounds}:undefined;this.clipReady=true;
  }
 }
}
