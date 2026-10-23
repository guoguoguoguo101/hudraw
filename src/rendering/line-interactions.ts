import {LineInteractionArt} from './line-interaction-art';
import {Container,Graphics,Text} from 'pixi.js';
import type {Point} from '../input/recognizer';
import {length} from '../input/line-interaction-geometry';
import type {LineInteractions} from '../gameplay/line-interactions';
import {LINE_INTERACTION as C} from '../gameplay/line-interaction-config';

const WHITE=0xfff8dc;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Bounded batched geometry: no textures, per-effect nodes or unbounded particle systems. */
export class LineInteractionRenderer{
 root=new Container();private mask=new Graphics();private traces=new Graphics();private bursts=new Graphics();private geometry=new Graphics();
 private art=new LineInteractionArt(this.bursts);
 private label=new Text({text:'',style:{fontFamily:'monospace',fontSize:13,fill:WHITE,wordWrap:true,wordWrapWidth:650}});
 constructor(){this.root.addChild(this.mask,this.traces,this.bursts,this.geometry,this.label);this.traces.mask=this.mask;this.bursts.mask=this.mask;this.label.position.set(26,310);this.label.visible=false;}
 clear(){this.traces.clear();this.bursts.clear();this.geometry.clear();this.label.visible=false;}
 private line(g:Graphics,a:Point,b:Point,width:number,color:number,alpha:number){if(alpha<=0)return;g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width,color,alpha});}
 update(model:LineInteractions,enabled:boolean,debug=false,low=false){
  this.root.visible=enabled;if(!enabled){this.clear();return;}
  const box=model.bounds;this.mask.clear().rect(box.left,box.top,box.right-box.left,box.bottom-box.top).fill(0xffffff);
  const g=this.traces,fx=this.bursts;g.clear();fx.clear();this.geometry.clear();
  for(const t of model.traces){
   const age=model.now-t.created,fade=clamp((t.expires-model.now)/C.fade),birth=clamp(age/.1);
   const pulse=model.effects.some(e=>e.traceIds.includes(t.id)&&model.now-e.created<.15)?1:0;
   const a=fade*(C.traceOpacity*(.75+birth*.25)+pulse*C.tracePulseOpacity);
   // A quiet guide only: no bloom, white core or glowing endpoint dots.
   this.line(g,t.a,t.b,C.traceWidth,0xd5b176,a);
   for(const p of t.bridges){const near=length(p,t.a)<length(p,t.b)?t.a:t.b;this.line(g,near,p,C.traceWidth,0xd5b176,a);}
   if(debug){this.geometry.circle(t.a.x,t.a.y,5).stroke({color:0x7fe2ca,width:1});this.geometry.circle(t.b.x,t.b.y,5).stroke({color:0x7fe2ca,width:1});}
  }
  // Effects are drawn from immutable snapshots after their original traces are consumed.
  this.art.beginFrame(low);
  for(const e of model.effects.slice(-C.maxEffects)){
   const t=model.now-e.created;if(t<0||t>e.duration)continue;
   if(e.kind==='cross')this.art.cross(e,t,low);else this.art.triangle(e,t,low);
   if(debug&&e.vertices)this.geometry.poly(e.vertices.flatMap(p=>[p.x,p.y])).stroke({color:0x7fe2ca,width:1});
  }
  for(const e of model.refractions.items.slice(-C.maxEffects))this.art.refraction(e,model.now-e.created);
  this.label.visible=debug;
  if(debug){this.label.y=box.top+48;this.label.text=`残痕 ${model.traces.length}/${C.capacity} · 交点 ${model.crossCount} · 围合 ${model.triangleCount}\n${model.lastKind} ${model.lastReason}\n`+model.traces.map(t=>`#${t.id} (${t.a.x.toFixed(0)},${t.a.y.toFixed(0)}) → (${t.b.x.toFixed(0)},${t.b.y.toFixed(0)}) ${(t.expires-model.now).toFixed(1)}s`).join('\n');}
 }
}
