import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
import {DragonRoute,dragonFrame,dragonWidth} from './dragon-motion';
import type {Hualing,SpiritEffect} from '../gameplay/hualing';
import type {Point} from '../input/recognizer';
function place(g:Graphics,p:Point,angle:number,sx=1,sy=sx){return g.save().transform(Math.cos(angle)*sx,Math.sin(angle)*sx,-Math.sin(angle)*sy,Math.cos(angle)*sy,p.x,p.y);}
const IVORY=0xffefd2,PALE=0xf2dfb9,SHADE=0xc9b58a,GOLD=0xcda45d,LIGHT=0xf4d697,INK=0x35463f,RED=0xa44536;

/** A compact long-snouted profile. Separate brush-shaped locks leave real open gaps. */
export function inkDragonHead(g:Graphics){
 // Back mane: broad flowing locks rather than repeated spikes.
 for(const [y,tip,bend] of [[-18,-88,-39],[-5,-96,-12],[9,-82,29],[20,-66,45]]){
  g.moveTo(-12,y).bezierCurveTo(-31,y-13,-46,bend-4,tip,bend).bezierCurveTo(tip+20,bend+12,-49,y+14,-19,y+12).closePath().fill({color:PALE,alpha:.86});
 }
 g.moveTo(-25,-24).bezierCurveTo(-49,-52,-62,-45,-81,-62).bezierCurveTo(-62,-22,-43,-30,-24,-9).fill(IVORY);
 g.moveTo(-27,14).bezierCurveTo(-51,18,-52,43,-77,45).bezierCurveTo(-54,55,-30,33,-18,24).fill(IVORY);
 // Narrow tapering locks and open whisker-like strokes carry the ink character.
 for(let i=0;i<7;i++){
  const y=-20+i*7,tip=-68-(i%3)*11,bend=y+(i<3?-16:15);
  g.moveTo(-14,y).bezierCurveTo(-35,y-5,-45,bend,tip,bend-5).quadraticCurveTo(-46,bend+6,-20,y+3).closePath().fill({color:IVORY,alpha:.8});
 }
 for(let i=0;i<5;i++)g.moveTo(-20,-17+i*9).bezierCurveTo(-41,-22+i*9,-65,-35+i*15,-91+i*3,-30+i*15).stroke({color:IVORY,width:.65,alpha:.65});
 // Two branching antlers, warm gold with a fine ivory edge.
 g.moveTo(-8,-22).bezierCurveTo(-20,-42,-43,-48,-53,-71).moveTo(-29,-47).lineTo(-23,-65).moveTo(-41,-56).lineTo(-62,-58).moveTo(-35,-13).bezierCurveTo(-48,-23,-63,-29,-73,-48).moveTo(-57,-30).lineTo(-78,-28).stroke({color:GOLD,width:3,cap:'round',join:'round'});
 g.moveTo(-9,-25).bezierCurveTo(-21,-44,-42,-48,-52,-68).stroke({color:LIGHT,width:.9,alpha:.9});
 // Skull and long muzzle. The dark sliver is a mouth, not an opaque outer tube.
 g.moveTo(-33,-16).bezierCurveTo(-14,-31,6,-29,23,-18).quadraticCurveTo(34,-10,51,-9).quadraticCurveTo(62,-7,58,0).lineTo(41,6).quadraticCurveTo(29,11,16,9).quadraticCurveTo(-4,31,-30,25).quadraticCurveTo(-16,9,-33,-16).closePath().fill(IVORY).stroke({color:SHADE,width:.9,alpha:.7});
 g.moveTo(-20,5).quadraticCurveTo(0,16,18,5).lineTo(48,2).lineTo(51,6).quadraticCurveTo(31,15,12,13).quadraticCurveTo(-3,34,-24,26).closePath().fill(PALE);
 g.moveTo(12,9).quadraticCurveTo(32,8,48,4).stroke({color:INK,width:1.9,alpha:.9});
 g.moveTo(22,10).lineTo(23,16).lineTo(28,9).fill(IVORY);
 // Sweeping brow and a single unmistakable almond eye.
 g.moveTo(0,-11).quadraticCurveTo(12,-12,23,-18).quadraticCurveTo(19,-7,6,-6).quadraticCurveTo(2,-7,0,-11).closePath().fill(INK);
 g.moveTo(5,-10).quadraticCurveTo(13,-10,18,-13).quadraticCurveTo(15,-7,8,-8).closePath().fill(LIGHT);
 g.moveTo(12,-11).lineTo(11,-7).stroke({color:INK,width:1.5});
 g.moveTo(-16,-19).quadraticCurveTo(6,-17,29,-24).stroke({color:IVORY,width:3,cap:'round'});
 g.ellipse(53,-5,3,1.6).fill(INK);
 g.moveTo(29,-7).quadraticCurveTo(40,-10,47,-7).moveTo(26,-4).quadraticCurveTo(36,-5,43,-3).stroke({color:SHADE,width:.65,alpha:.65});
 // Cheek ribbons and beard retain long tapered endings.
 g.moveTo(-7,3).bezierCurveTo(-26,-4,-42,7,-60,3).bezierCurveTo(-43,20,-26,8,-13,17).quadraticCurveTo(-2,22,9,10).fill(IVORY);
 g.moveTo(30,10).quadraticCurveTo(23,24,4,31).quadraticCurveTo(15,18,11,14).fill(IVORY);
 g.moveTo(35,9).quadraticCurveTo(33,22,21,29).lineTo(25,14).fill(PALE);
 // Fine long whiskers extend from the snout; no large glow or smoke layer.
 g.moveTo(48,0).bezierCurveTo(77,-12,86,-2,103,-20).moveTo(44,7).bezierCurveTo(66,13,73,32,99,27).stroke({color:LIGHT,width:1.15,alpha:.92,cap:'round'});
 g.moveTo(-24,15).quadraticCurveTo(-13,5,-2,9).moveTo(-20,-6).quadraticCurveTo(-7,-3,0,-8).stroke({color:SHADE,width:.8,alpha:.75});
 // A small cinnabar mark ties the pale spirit to the existing red-paper world.
 g.poly([-5,-21,2,-23,4,-18,-3,-16]).fill(RED);g.moveTo(-2,-21).lineTo(0,-18).stroke({color:IVORY,width:.7});
}

type Sample=ReturnType<DragonRoute['sample']>;
class DragonRig{
 root=new Container();private limbs=new Graphics();private ribbons=new Graphics();private bones=new Graphics();private head:Sprite|Graphics;private motes=new Graphics();
 private route?:DragonRoute;private path?:Point[];private pathCount=0;
 constructor(texture:Texture|null){
  if(texture){const sprite=new Sprite(texture);sprite.anchor.set(.55,.64);this.head=sprite;}else{this.head=new Graphics();inkDragonHead(this.head);}
  this.root.addChild(this.limbs,this.ribbons,this.bones,this.head,this.motes);
 }
 draw(f:SpiritEffect,low:boolean,preview=false){
  if(this.path!==f.path||this.pathCount!==f.path.length){this.route=new DragonRoute(f.path);this.path=f.path;this.pathCount=f.path.length;}
  const route=this.route!,age=f.age,motion=dragonFrame(route.length,age,f.duration);
  this.ribbons.clear();this.bones.clear();this.limbs.clear();this.motes.clear();
  if(preview){
   this.root.visible=true;this.root.alpha=.65;this.head.visible=false;
   this.bones.poly(f.path.flatMap(p=>[p.x,p.y]),false).stroke({color:LIGHT,width:1.6,alpha:.8});return;
  }
  this.root.visible=motion.alpha>.002;this.root.alpha=motion.alpha;this.head.visible=true;if(!this.root.visible)return;
  const count=Math.max(24,Math.min(low?90:180,Math.ceil(motion.length/7))),frames:Sample[]=[],widths:number[]=[];
  // Fixed material coordinates: tail, claws, spine and head travel as one body.
  const body=(t:number)=>{
   const s=route.sample(motion.tail+motion.length*t),wave=Math.sin(t*8-age*5)*Math.sin(Math.PI*t)*(1-t)*5;
   return{...s,x:s.x+s.nx*wave,y:s.y+s.ny*wave};
  };
  for(let i=0;i<=count;i++){
   const t=i/count;frames.push(body(t));widths.push(dragonWidth(t));
  }
  // Continuous warm ivory anatomy first; dry brush is confined to the outer edges.
  const left:number[]=[],right:number[]=[],belly:number[]=[];
  for(let i=0;i<=count;i++){const p=frames[i],w=widths[i];left.push(p.x-p.nx*w,p.y-p.ny*w);right.unshift(p.x+p.nx*w,p.y+p.ny*w);belly.push(p.x+p.nx*w*.25,p.y+p.ny*w*.25);}
  this.ribbons.poly([...left,...right]).fill({color:IVORY,alpha:.9});
  this.ribbons.poly([...belly,...right]).fill({color:SHADE,alpha:.24});
  for(const side of [-1,1])for(let k=0;k<(low?1:2);k++)for(const [from,to] of [[0,.29],[.7,.98]]){
   const a:number[]=[],b:number[]=[];
   for(let i=0;i<=count;i++){
    const u=i/count,t=from+(to-from)*u,p=body(t),w=dragonWidth(t),flow=Math.sin(t*11-age*3+k)*Math.sin(Math.PI*t)*2;
    const distance=side*(w*(1.1+k*.18)+flow),thickness=(1.4-k*.4)*Math.sin(Math.PI*u)**.6;
    a.push(p.x+p.nx*(distance-thickness),p.y+p.ny*(distance-thickness));b.unshift(p.x+p.nx*(distance+thickness),p.y+p.ny*(distance+thickness));
   }
   this.ribbons.poly([...a,...b]).fill({color:IVORY,alpha:.6-k*.13});
  }
  // Small swept brush notches break the silhouette without fragmenting the spine.
  const boneCount=Math.max(4,Math.min(low?36:64,Math.floor(motion.length/19)));
  for(let i=1;i<boneCount;i++){
   const u=i/boneCount,p=body(u),w=widths[Math.round(u*count)];
   if(u<.29)continue;
   place(this.bones,{x:p.x-p.nx*w*.55,y:p.y-p.ny*w*.55},p.angle,.55+.4*u);
   this.bones.poly([-7,0,-2,-4,6,-2,7,1,0,4]).fill({color:GOLD,alpha:.8});this.bones.moveTo(-3,-1).lineTo(4,-2).stroke({color:LIGHT,width:.8,alpha:.9});this.bones.restore();
   if(i%3===0&&u>.55)for(const side of [-1,1]){
    place(this.ribbons,p,p.angle,1,side);
    this.ribbons.moveTo(-13,w*.6).quadraticCurveTo(-27,w+7,-36,w+6).quadraticCurveTo(-23,w-1,-7,w*.8).fill({color:IVORY,alpha:.8});this.ribbons.restore();
   }
   if(!low&&i%2===0&&u>.4){place(this.bones,p,p.angle);for(let j=0;j<2;j++)this.bones.moveTo(-3+j*5,2+j*3).quadraticCurveTo(0+j*5,6+j*3,4+j*5,3+j*3).stroke({color:SHADE,width:.7,alpha:.55});this.bones.restore();}
  }
  for(const u of [.5,.82])for(const side of [-1,1]){
   const s=body(u),bend=Math.sin(age*5+u*6+side)*4,g=this.limbs;
   place(g,s,s.angle,1,side);
   g.moveTo(0,8).quadraticCurveTo(-8,24,-2,30+bend).quadraticCurveTo(11,28,12,39+bend).stroke({color:SHADE,width:6,alpha:.85,cap:'round'});
   g.moveTo(0,8).quadraticCurveTo(-6,23,-1,29+bend).quadraticCurveTo(12,30,13,38+bend).stroke({color:IVORY,width:4.3,cap:'round'});
   for(let j=0;j<3;j++)g.moveTo(11,35+bend).quadraticCurveTo(18+j*4,34+j*3+bend,17+j*5,42+j*2+bend).stroke({color:IVORY,width:1.8,cap:'round'});g.restore();
  }
  const tip=body(1),look=body(.92);
  this.head.position.set(tip.x,tip.y);this.head.rotation=Math.atan2(tip.y-look.y,tip.x-look.x);
  this.head.scale.set(this.head instanceof Sprite?132/this.head.texture.width:.78);this.head.alpha=1;
  for(let i=0;i<(low?5:9);i++){
   const u=(age*.17+i*.113)%1,p=body(u),d=Math.sin(i*2.4+age*2)*(24+u*6),x=p.x+p.nx*d,y=p.y+p.ny*d;
   this.motes.poly([x-2,y,x,y-3,x+2,y,x,y+1]).fill({color:i%3?GOLD:IVORY,alpha:.32});
  }
 }
}
export class InkDragonRenderer{
 root=new Container();texture:Texture|null=null;private active=new Map<number,DragonRig>();private spare:DragonRig[]=[];
 get activeCount(){return this.active.size;}
 update(model:Hualing,low:boolean){
  const effects=model.effects.filter(f=>f.kind==='dragon');
  if(model.selected==='dragon'&&model.path.length>1)effects.push({id:0,kind:'dragon',path:model.path,age:.44,duration:4,hit:new Set()});
  const ids=new Set(effects.map(f=>f.id));
  for(const [id,rig] of this.active)if(!ids.has(id)){rig.root.visible=false;this.spare.push(rig);this.active.delete(id);}
  for(const f of effects){let rig=this.active.get(f.id);if(!rig){rig=this.spare.pop()??new DragonRig(this.texture);if(!rig.root.parent)this.root.addChild(rig.root);this.active.set(f.id,rig);}rig.draw(f,low,f.id===0);}
 }
}
