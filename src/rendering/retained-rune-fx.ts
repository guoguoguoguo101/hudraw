import {Container,Graphics,GraphicsContext} from 'pixi.js';
import {COLLECTED,type CollectedRune,type RuneCast,type RunePickup} from '../gameplay/collected-talismans';
import type {Arena} from '../input/line-interaction-geometry';
import type {Point} from '../input/recognizer';
import {collectedRuneIcon} from './collected-rune-icon';

const GOLD=0xe6bb70,WHITE=0xfff3d6,RED=0xc14733;
const pickupArt=new Map<CollectedRune,GraphicsContext>();
let pickupRing:GraphicsContext|undefined;
function context(draw:(g:Graphics)=>void){const ctx=new GraphicsContext(),g=new Graphics(ctx);ctx.batchMode='batch';draw(g);g.destroy();return ctx;}
function runeArt(kind:CollectedRune){
 let art=pickupArt.get(kind);if(!art){art=context(g=>{
  g.poly([-17,-26,13,-26,21,-18,17,27,-17,27]).fill({color:0xffefd0,alpha:.95}).stroke({color:GOLD,width:2});
  const scale=kind==='flower'||kind==='thunder'?.32:.66;g.save().transform(scale,0,0,scale,0,0);collectedRuneIcon(g,kind);g.restore();
 });pickupArt.set(kind,art);}return art;
}
type PickupRig={root:Container;art:Graphics;ring:Graphics;kind:CollectedRune};
/** Pickup geometry is immutable. Moving/pulsing it does not repaint its paper icon. */
export class RetainedRunePickups{
 readonly root=new Container();private rigs=new Map<number,PickupRig>();
 constructor(){this.root.eventMode='none';}
 update(pickups:RunePickup[],clock:number){
  const live=new Set(pickups.map(p=>p.id));
  for(const [id,r]of this.rigs)if(!live.has(id)){r.root.destroy({children:true});this.rigs.delete(id);}
  for(const [i,p]of pickups.entries()){
   let r=this.rigs.get(p.id);if(!r){const root=new Container(),ring=new Graphics(pickupRing??(pickupRing=context(g=>{g.circle(0,0,30).stroke({color:GOLD,width:1.5});}))),art=new Graphics(runeArt(p.kind));root.addChild(ring,art);this.root.addChild(root);r={root,ring,art,kind:p.kind};this.rigs.set(p.id,r);}
   if(r.kind!==p.kind){r.kind=p.kind;r.art.context=runeArt(p.kind);}
   if(this.root.getChildIndex(r.root)!==i)this.root.setChildIndex(r.root,i);
   r.root.position.set(p.x,p.y);r.ring.alpha=.8+.2*Math.sin(clock*4+p.id);
  }
 }
 clear(){for(const r of this.rigs.values())r.root.destroy({children:true});this.rigs.clear();}
}

type Bolt={root:Container;path:Graphics;impact:Graphics;point:Point};
function destroyBolt(b:Bolt){b.path.destroy();b.impact.destroy();b.root.destroy();}
type Batch={root:Container;bolts:Bolt[];marks?:Point[];top:number;center:Graphics};
/** A storm's target coordinates stop changing when its beat fires. Keep all three
 * colored bolt paths intact and animate only their alpha; impact rings stay live. */
export class RetainedSkyThunder{
 readonly root=new Container();private batches:Batch[]=[];
 constructor(){
  this.root.eventMode='none';
  for(let i=0;i<3;i++){const root=new Container(),center=new Graphics();root.addChild(center);this.root.addChild(root);this.batches.push({root,center,bolts:[],top:NaN});}
 }
 update(c:RuneCast,b:Arena,low:boolean){
  for(let batch=0;batch<3;batch++){
   const state=this.batches[batch],age=c.age-COLLECTED.stormBeats[batch],fade=Math.max(0,1-age/.5);
   state.root.visible=age>=0&&fade>0;if(!state.root.visible)continue;
   const marks=c.marks[batch],top=b.top-35;
   if(state.marks!==marks||state.bolts.length!==marks.length||state.top!==top){
    for(const bolt of state.bolts)destroyBolt(bolt);state.bolts=[];state.marks=marks;state.top=top;
    for(let i=0;i<marks.length;i++){
     const p=marks[i],dx=i%2?13:-13,points:number[]=[],root=new Container(),path=new Graphics(),impact=new Graphics();
     for(let j=0;j<=8;j++){const u=j/8,offset=j===0||j===8?0:Math.sin(i*3+j*7)*17;points.push(p.x+offset+dx*(1-u),top+(p.y-top)*u);}
     for(const [color,w,alpha]of [[RED,20,.20],[GOLD,8,.9],[WHITE,3.3,1]] as const){path.moveTo(points[0],points[1]);for(let j=2;j<points.length;j+=2)path.lineTo(points[j],points[j+1]);path.stroke({color,width:batch===2?w*1.35:w,alpha});}
     root.addChild(path,impact);state.root.addChild(root);state.bolts.push({root,path,impact,point:p});
    }
    state.root.addChild(state.center);
   }
   for(let i=0;i<state.bolts.length;i++){
    const bolt=state.bolts[i];bolt.root.visible=!(low&&i%2&&i>=12);if(!bolt.root.visible)continue;
    bolt.root.alpha=fade;const p=bolt.point,art=bolt.impact;art.clear();
    art.ellipse(p.x,p.y,19+(1-fade)*36,8+(1-fade)*12).stroke({color:GOLD,width:2});art.poly([p.x,p.y-23*fade,p.x+5,p.y,p.x,p.y+13*fade,p.x-5,p.y]).fill(WHITE);
   }
   const art=state.center;art.clear();
   if(batch===2){const x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;art.moveTo(x,b.top).lineTo(x+18,y-90).lineTo(x-14,y-65).lineTo(x,y+80).stroke({color:GOLD,width:20*fade,alpha:fade*.5}).stroke({color:WHITE,width:7*fade,alpha:fade});}
  }
 }
 destroy(){for(const b of this.batches){for(const bolt of b.bolts)destroyBolt(bolt);b.center.destroy();b.root.destroy();}this.batches=[];this.root.destroy();}
}
