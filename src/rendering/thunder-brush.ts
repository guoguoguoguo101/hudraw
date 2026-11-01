import {Container,Graphics} from 'pixi.js';
import type {Point} from '../input/recognizer';
import {THUNDER_BRUSH,type ThunderBrush,type BrushArc,type ConductedArc} from '../gameplay/thunder-brush';
import type {InputController} from '../input/controller';
import {SkillGlowPool} from './skill-glow';

export function thunderBrushEmblem(g:Graphics,fill=0xe5e2ce,edge=0xa99b75){
 g.poly([6,-27,-20,3,-5,1,-12,25,22,-9,5,-5,13,-27]).fill(fill).stroke({color:edge,width:1.2});
 g.moveTo(-20,-12).lineTo(-25,-4).lineTo(-18,-5).stroke({color:0xc8c6b3,width:1});
}
type Node=Point&{age:number;seed:number};
type LinkRig={root:Container;shadow:Graphics;rim:Graphics;core:Graphics;points:Point[];distances:number[];length:number;seen:number};
const LEGACY={shadow:0x344f5c,blue:0x9ac7da,white:0xf1f8ff},WARM={shadow:0x633b30,blue:0xe8b878,white:0xfff3cf};
const sat=(n:number)=>Math.max(0,Math.min(1,n));
/** Silver brush strokes and one restrained traveling accent on each real channel. */
export class ThunderBrushRenderer{
 warm=false;private get colors(){return this.warm?WARM:LEGACY;}
 root=new Container();private halo=new Graphics();private edge=new Graphics();private core=new Graphics();private detail=new Graphics();
 private glow=new SkillGlowPool(12);private linkLayer=new Container();private linkRigs=new Map<ConductedArc,LinkRig>();private spare:LinkRig[]=[];private frame=0;private shown=false;
 constructor(){this.root.addChild(this.glow.root,this.halo,this.edge,this.core,this.linkLayer,this.detail);}
 private channel(points:Point[],alpha:number,width=1){
  if(points.length<2)return;
  for(const [g,color,w,opacity] of [[this.halo,this.colors.shadow,7.8,.55],[this.edge,this.colors.blue,4.1,.47],[this.core,this.colors.white,2.1,.96]] as const){
   g.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);
   g.stroke({color,width:w*width,alpha:alpha*opacity,cap:'butt',join:'bevel'});
  }
 }
 private release(link:ConductedArc,rig:LinkRig){
  this.linkRigs.delete(link);rig.root.visible=false;
  if(this.spare.length<20)this.spare.push(rig);else{for(const g of [rig.shadow,rig.rim,rig.core])g.destroy();rig.root.destroy({children:true});}
 }
 private clear(){
  if(this.shown)for(const g of [this.halo,this.edge,this.core,this.detail])g.clear();
  this.glow.reset();for(const [link,rig]of this.linkRigs)this.release(link,rig);this.shown=false;
 }
 private link(link:ConductedArc){
  let rig=this.linkRigs.get(link);if(rig)return rig;
  rig=this.spare.pop();if(!rig){const root=new Container(),shadow=new Graphics(),rim=new Graphics(),core=new Graphics();root.addChild(shadow,rim,core);this.linkLayer.addChild(root);rig={root,shadow,rim,core,points:[],distances:[],length:0,seen:0};}
  const dx=link.b.x-link.a.x,dy=link.b.y-link.a.y,n=Math.hypot(dx,dy)||1,count=Math.max(4,Math.min(14,Math.ceil(n/18)));
  rig.points=[];rig.distances=[0];rig.length=0;
  for(let i=0;i<=count;i++){
   const t=i/count,w=i===0||i===count?0:(i%2?1:-1)*(3.8+2.4*Math.sin(link.seed*2.1+i*1.9));
   const p={x:link.a.x+dx*t-dy/n*w,y:link.a.y+dy*t+dx/n*w};
   if(i){const previous=rig.points[i-1];rig.length+=Math.hypot(p.x-previous.x,p.y-previous.y);rig.distances.push(rig.length);}rig.points.push(p);
  }
  const width=1.1-link.depth*.12;
  for(const [g,color,w,alpha]of [[rig.shadow,this.colors.shadow,8,.64],[rig.rim,this.colors.blue,4.3,.54],[rig.core,this.colors.white,2.15,.98]] as const){
   g.clear().moveTo(rig.points[0].x,rig.points[0].y);for(let i=1;i<rig.points.length;i++)g.lineTo(rig.points[i].x,rig.points[i].y);
   g.stroke({color,width:w*width,alpha,cap:'butt',join:'bevel'});
  }
  this.linkRigs.set(link,rig);rig.root.visible=true;return rig;
 }
 private point(rig:LinkRig,distance:number){
  const target=sat(distance)*rig.length;let i=1;while(i<rig.distances.length-1&&rig.distances[i]<target)i++;
  const a=rig.points[i-1],b=rig.points[i],u=(target-rig.distances[i-1])/(rig.distances[i]-rig.distances[i-1]||1);
  return{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,index:i};
 }
 private pursuit(rig:LinkRig,progress:number,alpha:number){
  const start=this.point(rig,Math.max(0,progress-.2)),end=this.point(rig,progress),g=this.detail;
  g.moveTo(start.x,start.y);for(let i=start.index;i<end.index;i++)g.lineTo(rig.points[i].x,rig.points[i].y);g.lineTo(end.x,end.y).stroke({color:this.colors.white,width:3,alpha,cap:'round',join:'bevel'});
  return end;
 }
 private groups(arcs:BrushArc[]){
  const groups:Node[][]=[];let group:Node[]=[];let previous:Point|undefined;
  for(const a of arcs){
   if(!previous||Math.hypot(a.a.x-previous.x,a.a.y-previous.y)>.2){if(group.length>1)groups.push(group);group=[{...a.a,age:a.age,seed:a.seed}];}
   group.push({...a.b,age:a.age,seed:a.seed});previous=a.b;
  }
  if(group.length>1)groups.push(group);return groups;
 }
 update(model:ThunderBrush,input:InputController,enabled:boolean,low=false){
  this.root.visible=enabled;
  const tip=model.active&&input.drawing&&!input.exhausted?model.tip??input.points.at(-1):undefined;
  if(!enabled||!model.arcs.length&&!model.contacts.length&&!model.links.some(link=>link.age>=0)&&!tip){this.clear();return;}
  for(const g of [this.halo,this.edge,this.core,this.detail])g.clear();this.glow.reset();this.shown=true;const frame=++this.frame;
  for(const raw of this.groups(model.arcs)){
   const nodes:Node[]=[raw[0]];let length=0;
   for(let i=1;i<raw.length;i++){length+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].y-raw[i-1].y);if(length>=18||i===raw.length-1){nodes.push(raw[i]);length=0;}}
   const points=nodes.map((p,i)=>{
    if(i===0||i===nodes.length-1)return {...p};
    const a=nodes[i-1],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
    const offset=(i%2?1:-1)*(2.4+1.2*Math.sin(p.seed));
    return {x:p.x-dy/n*offset,y:p.y+dx/n*offset};
   });
   for(let i=1;i<points.length;i++){
    const fade=Math.pow(Math.max(0,1-nodes[i].age/.32),.65);
    this.channel([points[i-1],points[i]],fade*.72,.7+.18*fade);
   }
  }
  let glowingLinks=0,order=0;
  for(const link of model.links){
   if(link.age<0)continue;
   const rig=this.link(link);rig.seen=frame;if(this.linkLayer.children[order]!==rig.root)this.linkLayer.setChildIndex(rig.root,order);order++;
   const u=sat(link.age/THUNDER_BRUSH.life),fade=Math.pow(1-u,1.2)*sat((link.age+.01)/.018);rig.root.alpha=fade;
   const travel=sat(link.age/.05);
   if(travel<1){
    const p=this.pursuit(rig,travel,fade*.9);
    if(glowingLinks++<5)this.glow.add(p.x,p.y,23,this.colors.blue,fade*.32,.6,Math.atan2(link.b.y-link.a.y,link.b.x-link.a.x));
   }
  }
  for(const [link,rig]of this.linkRigs)if(rig.seen!==frame)this.release(link,rig);
  // Only real contact records create impact marks; channel endpoints never do.
  for(let i=0;i<model.contacts.length;i++){
   const c=model.contacts[i],u=sat(c.age/.22),fade=Math.pow(1-u,1.45)*sat((c.age+.006)/.014),tilt=c.seed*.73,dx=Math.cos(tilt),dy=Math.sin(tilt);
   const at=(x:number,y:number)=>({x:c.x+dx*x-dy*y,y:c.y+dy*x+dx*y});
   this.channel([at(-13,3),at(-3,-3),at(2,2),at(14,-3)],fade,.62);
   const r=7+u*8,a=at(-r,-r*.55),b=at(-r*.25,-r),d=at(r,r*.55),e=at(r*.25,r);
   this.detail.moveTo(a.x,a.y).lineTo(b.x,b.y).moveTo(d.x,d.y).lineTo(e.x,e.y).stroke({color:this.colors.blue,width:1.1,alpha:fade*.66});
   if(i>=model.contacts.length-5)this.glow.add(c.x,c.y,48+u*16,this.colors.blue,fade*.52,.8,tilt);
  }
  if(tip){
   const previous=input.points.length>1?input.points[input.points.length-2]:undefined,angle=previous?Math.atan2(tip.y-previous.y,tip.x-previous.x):0,dx=Math.cos(angle),dy=Math.sin(angle),count=low?2:3;
   this.glow.add(tip.x,tip.y,35,this.colors.blue,.27,.7,angle);
   for(let i=0;i<count;i++){
    const side=(i-(count-1)/2)*5,bend=Math.sin(model.clock*17+i*2)*2.5,length=15+i*6;
    this.channel([{x:tip.x-dx*length-dy*side,y:tip.y-dy*length+dx*side},{x:tip.x-dx*length*.5-dy*(side+bend),y:tip.y-dy*length*.5+dx*(side+bend)},{x:tip.x-dx*3-dy*side*.2,y:tip.y-dy*3+dx*side*.2}],.48,.33);
   }
   this.core.circle(tip.x,tip.y,2.8).fill({color:this.colors.white,alpha:.98});
  }
 }
}
