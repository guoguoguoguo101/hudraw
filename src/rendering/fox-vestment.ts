import {Container,Graphics,GraphicsPath} from 'pixi.js';
import type {Skill} from '../core/types';
import {guardianConfig} from '../gameplay/fox-guardian';
import {buildGuardianScene,type VectorShape} from './fox-vestment-scene';
type Part={graphic:Graphics;geometry:string;paint:string};
/** Geometry is shared with the Canvas 2D preview and editable SVG keyframes. */
export class FoxVestment{
 root=new Container();back=new Container();front=new Container();parts={back:new Map<string,Part>(),front:new Map<string,Part>()};
 phase='ritual';clothProgress=0;
 constructor(){this.root.addChild(this.front);}
 private draw(layer:'back'|'front',shapes:VectorShape[]){
  const parent=layer==='back'?this.back:this.front,parts=this.parts[layer],live=new Set<string>();
  for(const shape of shapes){
   live.add(shape.id);let part=parts.get(shape.id);
   if(!part){part={graphic:new Graphics(),geometry:'',paint:''};parent.addChild(part.graphic);parts.set(shape.id,part);}
   const g=part.graphic,paint=`${shape.fill}/${shape.stroke}/${shape.width}`;
   if(part.geometry!==shape.d||part.paint!==paint){g.clear().path(new GraphicsPath(shape.d));if(shape.fill)g.fill(shape.fill);if(shape.stroke)g.stroke({color:shape.stroke,width:shape.width??1});part.geometry=shape.d;part.paint=paint;}
   g.alpha=shape.opacity;g.visible=shape.opacity>.001;
   const m=shape.matrix??[1,0,0,1,0,0];g.position.set(m[4],m[5]);g.rotation=Math.atan2(m[1],m[0]);g.scale.set(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]));
   // Reordering preserves the declared overlaps when a scroll becomes an outfit.
   parent.addChild(g);
  }
  for(const [id,part] of parts)if(!live.has(id)){part.graphic.destroy();parts.delete(id);}
 }
 update(s:Skill){
  const scene=buildGuardianScene(s.age,guardianConfig(s));this.phase=scene.phase;this.clothProgress=scene.clothProgress;
  this.back.position.set(s.x,s.y);this.root.position.set(s.x,s.y);this.draw('back',scene.back);this.draw('front',scene.front);
 }
}
