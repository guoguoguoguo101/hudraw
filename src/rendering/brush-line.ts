import {SlashRenderer} from './slash';
import {visualSkill} from './visual-skill';
import {configureSlash} from '../gameplay/slash';
import {Container,Graphics} from 'pixi.js';
import {BRUSH_LINE,type BrushLine,type LineEffect,type LineTrace} from '../gameplay/brush-line';
import type {Point} from '../input/recognizer';
import {cornerSeal,LINE_PAPER as C,paperBlade,paperChip,paperSpark} from './brush-line-art';
import {SkillGlowPool} from './skill-glow';

const mix=(a:Point,b:Point,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type TraceRig={source:LineTrace;art:Graphics};
type LineRig={source:LineEffect;root:Container;blades:Graphics[];chips:Graphics[];spark:Graphics;corners:Graphics[];edges:Graphics[];owned:Graphics[];fill?:Graphics;flash?:Graphics};

/** The geometry follows the player's strokes. Folded paper is built once per
 * stroke; release, edge lighting and gathering animate retained transforms. */
export class BrushLineRenderer{
 root=new Container();private tracesRoot=new Container();private effectsRoot=new Container();
 private scroll=new SlashRenderer();private lights=new SkillGlowPool(12);
 private traces=new Map<number,TraceRig>();private effects=new Map<number,LineRig>();
 constructor(){this.root.eventMode='none';this.root.addChild(this.tracesRoot,this.lights.root,this.effectsRoot,this.scroll.root);}

 private trace(source:LineTrace){
  const art=new Graphics().moveTo(source.a.x,source.a.y).lineTo(source.b.x,source.b.y).stroke({color:C.ink,width:5,alpha:.66})
   .moveTo(source.a.x,source.a.y).lineTo(source.b.x,source.b.y).stroke({color:C.gold,width:1,alpha:.42});
  art.context.batchMode='batch';this.tracesRoot.addChild(art);const rig={source,art};this.traces.set(source.id,rig);return rig;
 }
 private create(source:LineEffect){
  const root=new Container(),rig:LineRig={source,root,blades:[],chips:[],spark:paperSpark(),corners:[],edges:[],owned:[]};
  root.position.set(source.center.x,source.center.y);
  if(source.kind==='seal'){
   const v=source.vertices!,points=v.flatMap(p=>[p.x-source.center.x,p.y-source.center.y]);
   rig.fill=new Graphics().poly(points).fill({color:C.ink,alpha:.32});
   rig.flash=new Graphics().poly(points).stroke({color:C.ivory,width:1.5,alpha:.8});
   rig.owned.push(rig.fill,rig.flash);root.addChild(rig.fill);
   for(let i=0;i<3;i++){
    const a=v[i],b=v[(i+1)%3],length=Math.hypot(b.x-a.x,b.y-a.y),edge=new Graphics()
     .moveTo(0,0).lineTo(length,0).stroke({color:C.shade,width:5,alpha:.95})
     .moveTo(0,-.8).lineTo(length,-.8).stroke({color:C.gold,width:1.25,alpha:.88})
     .moveTo(0,.9).lineTo(length,.9).stroke({color:C.ivory,width:.65,alpha:.75});
    edge.position.set(a.x-source.center.x,a.y-source.center.y);edge.rotation=Math.atan2(b.y-a.y,b.x-a.x);
    rig.edges.push(edge);rig.owned.push(edge);root.addChild(edge);
    const corner=cornerSeal();corner.position.set(a.x-source.center.x,a.y-source.center.y);corner.rotation=Math.atan2(source.center.y-a.y,source.center.x-a.x)+Math.PI/2;
    rig.corners.push(corner);root.addChild(corner);
   }
   root.addChild(rig.flash);
  }
  const count=source.kind==='seal'?3:source.kind==='cross'?source.segments.length*2:source.segments.length;
  for(let i=0;i<count;i++){const blade=paperBlade();rig.blades.push(blade);root.addChild(blade);}
  root.addChild(rig.spark);
  for(let i=0;i<6;i++){const chip=paperChip(i);rig.chips.push(chip);root.addChild(chip);}
  for(const art of rig.owned)art.context.batchMode='batch';
  this.effectsRoot.addChild(root);this.effects.set(source.id,rig);return rig;
 }
 private release(rig:LineRig){
  // Owned paths can be freed without destroying contexts shared by every blade.
  for(const art of rig.owned)art.destroy();rig.root.destroy({children:true});
 }
 private blade(rig:LineRig,index:number,a:Point,b:Point,u:number,width:number,alpha:number){
  const art=rig.blades[index],length=Math.hypot(b.x-a.x,b.y-a.y)*u;
  art.visible=length>=1&&alpha>0;if(!art.visible)return;
  art.position.set(a.x-rig.source.center.x,a.y-rig.source.center.y);art.rotation=Math.atan2(b.y-a.y,b.x-a.x);
  art.scale.set(length/100,width/40);art.alpha=clamp(alpha);
 }
 private glow(p:Point,size:number,alpha:number,squash=1,rotation=0){this.lights.add(p.x,p.y,size,C.gold,alpha,squash,rotation);}

 update(m:BrushLine,enabled:boolean,_low=false){
  this.root.visible=enabled&&m.level>0;this.lights.reset();
  const scrolls=m.effects.filter(e=>e.kind==='scroll').map(e=>{const raw=e.segments[0],s=visualSkill('line',e.id,raw.a),dx=raw.b.x-raw.a.x,dy=raw.b.y-raw.a.y,n=Math.hypot(dx,dy)||1;s.direction={x:dx/n,y:dy/n};configureSlash(s,4);s.age=m.clock-e.born;s.slash!.secondaryCenter={...e.center};s.slash!.ultimate!.slashLength=n;s.slash!.ultimate!.visualScrollLength=420;s.slash!.ultimate!.visualScrollWidth=180;return s;});
  this.scroll.update(this.root.visible?scrolls:[]);
  const traceIds=new Set(m.traces.map(t=>t.id)),effectIds=new Set(m.effects.map(e=>e.id));
  for(const [id,rig]of this.traces)if(!traceIds.has(id)){rig.art.destroy();this.traces.delete(id);}
  for(const [id,rig]of this.effects)if(!effectIds.has(id)){this.release(rig);this.effects.delete(id);}
  if(!this.root.visible)return;
  for(const t of m.traces){let rig=this.traces.get(t.id);if(rig&&rig.source!==t){rig.art.destroy();this.traces.delete(t.id);rig=undefined;}rig??=this.trace(t);rig.art.alpha=clamp((BRUSH_LINE.traceLife-(m.clock-t.born))/.65);}
  for(const e of m.effects){
   if(e.kind==='scroll')continue;let rig=this.effects.get(e.id);if(rig&&rig.source!==e){this.release(rig);this.effects.delete(e.id);rig=undefined;}
   const age=m.clock-e.born,fade=clamp((e.life-age)/.3);if(age<0||fade<=0){if(rig)rig.root.visible=false;continue;}
   rig??=this.create(e);rig.root.visible=true;rig.spark.visible=false;for(const b of rig.blades)b.visible=false;
   if(e.kind==='slash'||e.kind==='borrow'){
    const start=e.kind==='borrow'?.43:0,t=age-start,u=1-(1-clamp(t/.11))**3,alpha=t<0?0:clamp((e.life-age)/((e.life-start)*.8));
    for(let i=0;i<e.segments.length;i++){const s=e.segments[i];this.blade(rig,i,s.a,s.b,u,e.kind==='borrow'?62:35,alpha);
     if(t>=0&&t<.22)this.glow(mix(s.a,s.b,u),e.kind==='borrow'?88:56,clamp(1-t/.22)*.25,.55,Math.atan2(s.b.y-s.a.y,s.b.x-s.a.x));}
   }else if(e.kind==='cross'){
    const alpha=clamp(1-age/.6),u=1-(1-clamp(age/.12))**3;let index=0;
    for(const s of e.segments){const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,n=Math.hypot(dx,dy)||1;for(const sign of [-1,1])this.blade(rig,index++,e.center,{x:e.center.x+dx/n*75*sign,y:e.center.y+dy/n*75*sign},u,25*alpha,alpha);}
    const flash=clamp(1-Math.abs(age-.09)/.105);rig.spark.visible=flash>0;rig.spark.scale.set(21*flash,16*flash);rig.spark.alpha=flash*.88;rig.spark.rotation=Math.PI/8;
    this.glow(e.center,74,flash*.35);
   }else{
    const v=e.vertices!,seal=clamp(age/.3),spent=e.consumed!==undefined?clamp(1-(m.clock-e.consumed)/.35):1,alpha=fade*spent;
    const flash=clamp(1-Math.abs(age-BRUSH_LINE.sealHit)/.15),settle=clamp((age-.86)/.28);
    rig.fill!.alpha=alpha*(.3+.7*seal)*(1-settle*.55);
    rig.flash!.visible=flash>0;rig.flash!.alpha=flash*alpha*.7;rig.flash!.scale.set(1-(age-BRUSH_LINE.sealHit)*.08);
    for(let i=0;i<3;i++){
     const a=v[i],b=v[(i+1)%3],light=clamp((age-i*.085)/.12),progress=clamp((age-.14-i*.04)/.16);
     rig.edges[i].scale.x=progress;rig.edges[i].alpha=alpha*(1-settle*.42);rig.corners[i].alpha=light*alpha*(1-settle*.35);rig.corners[i].scale.set(.65+.22*light);
     if(progress>0&&progress<1)this.glow(mix(a,b,progress),46,.16*alpha);
     const t=age-.31-i*.095;if(t>=0&&t<.44){const end=mix(v[(i+1)%3],v[(i+2)%3],.5),u=1-(1-clamp(t/.13))**3,cut=clamp(1-t/.44);this.blade(rig,i,a,end,u,75*cut,cut*alpha);}
    }
    rig.spark.visible=flash>0;rig.spark.scale.set(25*flash,31*flash);rig.spark.alpha=flash*alpha*.85;this.glow(e.center,100,flash*alpha*.28);
   }
   const burst=e.kind==='seal'?age-BRUSH_LINE.sealHit:e.kind==='borrow'?age-.43:age,particleFade=clamp(1-burst/.48);
   for(let i=0;i<rig.chips.length;i++){
    const chip=rig.chips[i];chip.visible=burst>=0&&particleFade>0;if(!chip.visible)continue;
    const angle=i*2.399+e.id,r=(20+i%3*13)*(1-(1-clamp(burst/.3))**3);
    chip.position.set(Math.cos(angle)*r,Math.sin(angle)*r+burst*burst*28);chip.rotation=angle+burst*(i%2?2:-2);chip.scale.set((.7+i%3*.18)*particleFade);chip.alpha=particleFade*.65;
   }
  }
 }
}
