import {Container,Graphics,GraphicsContext} from 'pixi.js';
import {FLOWER_BRUSH,type PetalBrush} from '../gameplay/petal-brush';
import type {Enemy} from '../core/types';
import {inkButterfly,inkPaperShard} from './ink-butterfly-art';
import {SkillGlowPool} from './skill-glow';
const LEAF_COLORS=[0xf3663f,0xd94c2d,0xeb9547,0xe8c17c];
const IVORY=0xfff3d6,WARM=0xf0bb72,CINNABAR=0xb94f3b;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const u=clamp(n);return u*u*(3-2*u);};
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
const leafContexts=new Map<number,GraphicsContext>(),shardContexts=new Map<number,GraphicsContext>();
function sharedArt(cache:Map<number,GraphicsContext>,key:number,draw:(g:Graphics)=>void){
 let context=cache.get(key);if(!context){context=new GraphicsContext();const g=new Graphics(context);draw(g);g.destroy();cache.set(key,context);}return context;
}
type ButterflyRig={root:Container;art:Graphics;opening:number};
type BloomRig=ButterflyRig&{shards:Graphics[]};
export class PetalBrushRenderer{
 root=new Container();private ground=new Graphics();private flashes=new Graphics();private glows=new SkillGlowPool(12);private leaves=new Container();private buds=new Container();private blooms=new Container();private wisps=new Graphics();
 private leafPool:Graphics[]=[];private budPool:ButterflyRig[]=[];private bloomPool:BloomRig[]=[];
 constructor(){this.root.eventMode='none';this.root.addChild(this.ground,this.glows.root,this.flashes,this.leaves,this.buds,this.blooms,this.wisps);}
 private butterfly(parent:Container):ButterflyRig{const root=new Container(),art=new Graphics();root.addChild(art);parent.addChild(root);return{root,art,opening:NaN};}
 private poseButterfly(rig:ButterflyRig,opening:number,alpha:number){
  rig.art.visible=alpha>0;if(alpha<=0)return;
  if(rig.opening!==opening){rig.art.clear();inkButterfly(rig.art,opening);rig.opening=opening;}
  rig.art.alpha=alpha;
 }
 update(model:PetalBrush,enabled:boolean,low=false,enemies:Enemy[]=[]){
  this.glows.reset();this.root.visible=enabled;if(!enabled)return;this.ground.clear();this.flashes.clear();this.wisps.clear();
  for(const g of this.leafPool)g.visible=false;
  for(const rig of this.budPool)rig.root.visible=false;
  for(const rig of this.bloomPool)rig.root.visible=false;
  let leafIndex=0;
  for(let i=0;i<model.leaves.length;i++){
   if(low&&i%2)continue;const p=model.leaves[i],fade=Math.max(0,Math.min(1,p.age/.1,(p.life-p.age)/.5)),scale=p.size/10,flutter=.3+.7*Math.abs(Math.cos(p.phase+p.age*3.2)),c=Math.cos(p.angle),s=Math.sin(p.angle);
   this.ground.ellipse(p.x+5,p.y+12,p.size*.4,p.size*.1).fill({color:0x162c2b,alpha:fade*.08});
   const color=LEAF_COLORS[p.tone],context=sharedArt(leafContexts,color,g=>mapleLeaf(g,color));
   let leaf=this.leafPool[leafIndex++];if(!leaf){leaf=new Graphics(context);this.leafPool.push(leaf);this.leaves.addChild(leaf);}
   if(leaf.context!==context)leaf.context=context;
   leaf.visible=true;leaf.position.set(p.x,p.y);leaf.rotation=p.angle;leaf.scale.set(scale*flutter,scale);leaf.alpha=fade*.95;
  }
  for(const [i,b] of model.buds.entries()){
   const fade=clamp(b.age/.12),ready=smooth((b.age/FLOWER_BRUSH.budLife-.6)/.4),scale=.8,tilt=b.angle*.28;
   this.ground.ellipse(b.x,b.y+13,18+ready*5,5).fill({color:0x101f23,alpha:fade*.3*(1-ready*.35)});
   // The planted fold is quiet. Only the last part of the original fuse gathers light.
   if(ready>0)this.glows.add(b.x,b.y+5,28+ready*32,WARM,fade*ready*ready*.2,.38,tilt);
   const rig=this.budPool[i]??(this.budPool[i]=this.butterfly(this.buds));rig.root.visible=true;
   rig.root.position.set(b.x,b.y-ready*8);rig.root.rotation=tilt;rig.root.scale.set(scale);
   this.poseButterfly(rig,.03+ready*.32,fade);
  }
  for(const [bi,b] of model.blooms.entries()){
   let rig=this.bloomPool[bi];if(!rig){rig={...this.butterfly(this.blooms),shards:[]};this.bloomPool[bi]=rig;}
   rig.root.visible=true;rig.root.position.set(b.x,b.y);
   const u=b.age/FLOWER_BRUSH.bloomLife,opening=smooth(b.age/FLOWER_BRUSH.bloomDelay),fade=smooth((1-u)/.45),size=.8+.18*opening;
   this.ground.ellipse(b.x,b.y+10,30*size,8*size).fill({color:0x101f23,alpha:fade*.22});
   const intact=Math.max(0,1-Math.max(0,b.age-.28)/.24);
   rig.art.position.set(0,-5);rig.art.scale.set(size);this.poseButterfly(rig,.3+.7*opening,fade*intact);
   const impact=b.age-FLOWER_BRUSH.bloomDelay,flash=impact>=0?(1-clamp(impact/.19))**2:0;
   const gather=impact<0?.12+opening*.1:.22*Math.exp(-impact/.18);
   // A brief local bloom supports the original paper silhouette; no permanent AoE ring.
   this.glows.add(b.x,b.y,96+flash*24,WARM,fade*(gather+flash*.36),.6,b.angle);
   if(flash>0){
    this.glows.add(b.x,b.y-2,34+flash*18,IVORY,flash*.55,.58,b.angle);
    this.flashes.ellipse(b.x,b.y-1,11+flash*10,5+flash*4).fill({color:IVORY,alpha:flash*.9});
    const edge=20+(1-flash)*14;
    this.flashes.moveTo(b.x-edge,b.y+1).quadraticCurveTo(b.x,b.y+12,b.x+edge,b.y+1).stroke({color:CINNABAR,width:1.8,alpha:flash*.78});
    this.flashes.moveTo(b.x-edge*.7,b.y-5).quadraticCurveTo(b.x,b.y-11,b.x+edge*.7,b.y-5).stroke({color:IVORY,width:1.1,alpha:flash*.65});
    for(let i=0;i<6;i++){
     const a=b.angle+i*Math.PI/3,dx=Math.cos(a),dy=Math.sin(a)*.6,from=16+(1-flash)*8,to=38+(1-flash)*32,spread=1.3*flash;
     this.flashes.poly([b.x+dx*from-dy*spread,b.y+dy*from+dx*spread,b.x+dx*to,b.y+dy*to,b.x+dx*from+dy*spread,b.y+dy*from-dx*spread]).fill({color:i%2?IVORY:WARM,alpha:flash*.55});
    }
   }
   const n=low?5:8;
   for(const shard of rig.shards)shard.visible=false;
   for(let i=0;i<n;i++){
    const flight=Math.max(0,b.age-.22),a=i*Math.PI*2/n+b.angle,d=12+(1-Math.pow(1-Math.min(1,flight/.8),2))*88,x=b.x+Math.cos(a)*d,y=b.y+Math.sin(a)*d*.58-flight*18;
    const alpha=fade*Math.min(1,flight/.09)*.9,spin=a+flight*(i%2?2:-2),scale=.55+(i%3)*.15;
    let shard=rig.shards[i];if(!shard){shard=new Graphics(sharedArt(shardContexts,i%3,g=>inkPaperShard(g,i)));rig.shards[i]=shard;rig.root.addChild(shard);}
    shard.visible=alpha>0;shard.position.set(x-b.x,y-b.y);shard.rotation=spin;shard.scale.set(scale);shard.alpha=alpha;
   }
  }
  let n=0;for(const e of enemies)if(e.hp>0&&model.isSlowed(e.id)&&n++<12){
   const y=e.y+20,pulse=.75+.2*Math.sin(model.clock*6+e.id);
   this.wisps.moveTo(e.x-23,y).quadraticCurveTo(e.x,y+10,e.x+23,y).stroke({color:0xd9c9a9,width:1.2,alpha:pulse*.6});
   for(const side of [-1,1])this.wisps.moveTo(e.x+side*20,y).quadraticCurveTo(e.x+side*27,y-10,e.x+side*14,y-19).stroke({color:side===1?0xb86b50:0xd9c9a9,width:1.3,alpha:pulse*.65});
  }
 }
}
