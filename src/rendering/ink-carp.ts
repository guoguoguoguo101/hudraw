import {Container,Graphics,GraphicsContext} from 'pixi.js';
import type {InkCarp,InkCarpState} from '../gameplay/ink-carp';
import {SkillGlowPool} from './skill-glow';
const INK=0x172d2b,PAPER=0xf2dfb4,RED=0xb84931,GOLD=0xc7a064;
const wakeArt:GraphicsContext[]=[],crestArt:GraphicsContext[]=[];
function paperAccent(index:number,crest=false){
 const pool=crest?crestArt:wakeArt,key=index%3;let context=pool[key];if(context)return context;
 context=new GraphicsContext();context.batchMode='batch';const g=new Graphics(context),color=key?PAPER:RED;
 if(crest){
  g.moveTo(-1,-.4).quadraticCurveTo(.4,-1.4,1,0).quadraticCurveTo(.4,.7,-.25,.25).quadraticCurveTo(.4,-.1,-.2,-.25).stroke({color:PAPER,width:.2});
  g.poly([1,0,1.6,-.4,1.8,.2,1.2,.5]).fill(color);
 }else{
  g.poly([0,0,-15,-3,-22,4,-7,3]).fill(color);g.moveTo(-15,1).lineTo(-3,0).stroke({color:GOLD,width:.7,alpha:.6});
 }
 g.destroy();pool[key]=context;return context;
}

/** Articulated paper carp. The reference stays outside the runtime package. */
class CarpActor{
 root=new Container();private wake=new Graphics();private fish=new Container();private tail=new Graphics();private fin=new Graphics();private topFin=new Graphics();private body=new Graphics();private foam=new Graphics();
 private glow=new SkillGlowPool(2);private flakes=new Container();private crestLayer=new Container();private flakePool:Graphics[]=[];private crestPool:Graphics[]=[];
 constructor(){
  this.root.eventMode='none';this.root.addChild(this.glow.root,this.wake,this.flakes,this.fish,this.foam,this.crestLayer);this.fish.addChild(this.tail,this.topFin,this.body,this.fin);
  const t=this.tail;t.position.set(-53,0);
  t.moveTo(9,0).bezierCurveTo(-20,-8,-20,-46,-73,-52).quadraticCurveTo(-50,-23,-29,-5).quadraticCurveTo(-62,-7,-80,28).bezierCurveTo(-39,35,-14,17,9,0).fill(PAPER);
  t.moveTo(3,0).bezierCurveTo(-18,-13,-29,-40,-65,-46).quadraticCurveTo(-49,-25,-22,-3).quadraticCurveTo(-50,3,-70,24).bezierCurveTo(-40,25,-18,16,3,0).fill(RED);
  for(let i=0;i<5;i++){t.moveTo(0,0).quadraticCurveTo(-28,-8-i*5,-62-i,-39+i*7).stroke({color:GOLD,width:.9,alpha:.8});t.moveTo(0,1).quadraticCurveTo(-31,9,-60+i*6,24-i*2).stroke({color:PAPER,width:.7,alpha:.7});}
  const dorsal=this.topFin;dorsal.moveTo(-42,-19).quadraticCurveTo(-38,-53,-10,-57).lineTo(9,-37).lineTo(27,-34).lineTo(-3,-18).closePath().fill(RED).stroke({color:PAPER,width:1.2});
  for(let i=0;i<5;i++)dorsal.moveTo(-34+i*10,-24).lineTo(-25+i*8,-46+(i%2)*6).stroke({color:GOLD,width:1});
  const b=this.body;
  b.moveTo(-62,0).bezierCurveTo(-34,-43,20,-47,53,-24).quadraticCurveTo(78,-11,69,9).bezierCurveTo(54,40,-13,45,-62,0).fill(INK).stroke({color:PAPER,width:2});
  b.moveTo(-53,9).bezierCurveTo(-15,29,19,7,61,-14).quadraticCurveTo(79,1,59,20).bezierCurveTo(32,44,-21,36,-53,9).fill(PAPER);
  b.moveTo(11,-32).quadraticCurveTo(48,-40,61,-19).quadraticCurveTo(43,-5,23,-14).lineTo(6,-12).lineTo(16,-21).closePath().fill(RED);
  b.moveTo(-43,-14).lineTo(-27,-22).lineTo(-13,-16).lineTo(-28,-9).closePath().fill({color:0x35433a,alpha:.8});
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
   const x=-37+col*13+(row%2)*6,y=-19+row*11;
   if(x>32&&row===0||x>20&&row===3)continue;
   b.moveTo(x-5,y-4).quadraticCurveTo(x+6,y-3,x+5,y+4).quadraticCurveTo(x,y+7,x-5,y+4).stroke({color:row===3?0x816e49:GOLD,width:.85,alpha:.8});
  }
  b.moveTo(32,-18).bezierCurveTo(18,-2,24,16,37,23).stroke({color:0x8a704b,width:2});
  b.ellipse(49,-9,11,12).fill(GOLD).ellipse(50,-9,8.3,9.3).fill(PAPER).ellipse(52,-9,4.5,6.5).fill(INK).circle(53,-12,1.5).fill(0xfff6df);
  b.moveTo(64,2).quadraticCurveTo(73,0,73,6).quadraticCurveTo(65,13,59,10).stroke({color:INK,width:2.2});
  b.moveTo(67,7).quadraticCurveTo(85,7,83,-6).moveTo(65,10).quadraticCurveTo(82,23,89,13).stroke({color:GOLD,width:1.3});
  const f=this.fin;f.position.set(19,16);f.moveTo(4,-4).bezierCurveTo(-7,9,-2,38,-43,44).quadraticCurveTo(-26,26,-29,5).lineTo(-10,-7).closePath().fill(RED).stroke({color:PAPER,width:1.2});
  for(let i=0;i<5;i++)f.moveTo(0,-1).quadraticCurveTo(-12-i*2,15,-35+i*5,37-i*3).stroke({color:GOLD,width:.8});
  b.cacheAsTexture({resolution:1.5,antialias:true});
 }
 update(f:InkCarpState|undefined,enabled:boolean,low=false){
  this.root.visible=enabled&&!!f;this.wake.clear();this.foam.clear();this.glow.reset();for(const p of this.flakePool)p.visible=false;for(const p of this.crestPool)p.visible=false;if(!enabled||!f)return;
  const u=Math.min(1,f.age/f.flight),angle=Math.atan2(f.dy,f.dx),emerge=Math.min(1,f.age/.12),out=Math.max(0,(f.age-f.flight)/.2);
  this.fish.visible=out<1;this.fish.position.set(f.x,f.y);this.fish.rotation=angle-Math.sin(u*Math.PI)*.13;this.fish.scale.set(f.scale*(.3+.7*emerge)*(1-out*.2),f.scale*(.3+.7*emerge)*(1-out*.4)*(f.dx<0?-1:1));this.fish.alpha=Math.min(1,emerge*2)*(1-out);
  this.tail.rotation=Math.sin(f.age*28)*.3;this.fin.rotation=Math.sin(f.age*21+.6)*.17;this.topFin.rotation=Math.sin(f.age*17)*.04;
  const g=this.wake,c=Math.cos(angle),s=Math.sin(angle);
  if(!f.burst){
   const length=Math.min(140,Math.hypot(f.x-f.origin.x,f.y-f.origin.y)/f.scale);g.save().transform(c*f.scale,s*f.scale,-s*f.scale,c*f.scale,f.x,f.y);
   // Broad dark silk under a single ivory cut; the fish keeps the strongest silhouette.
   const flow=Math.sin(f.age*9)*5;
   g.moveTo(-34,-5).bezierCurveTo(-76,-15+flow,-length-54,3,-length-86,0).bezierCurveTo(-length-50,14,-73,18+flow,-34,5).fill({color:INK,alpha:.7*emerge});
   g.moveTo(-37,-6).bezierCurveTo(-78,-16+flow,-length-52,1,-length-86,0).stroke({color:PAPER,width:1.6,alpha:.72*emerge});
   g.moveTo(-51,6).bezierCurveTo(-81,13+flow,-length-37,9,-length-63,3).stroke({color:GOLD,width:.8,alpha:.54*emerge});g.restore();
   this.flakes.position.set(f.x,f.y);this.flakes.rotation=angle;this.flakes.scale.set(f.scale);
   for(let i=0;i<(low?4:7);i++){
    let flake=this.flakePool[i];if(!flake){flake=new Graphics(paperAccent(i));this.flakePool[i]=flake;this.flakes.addChild(flake);}
    const x=-50-((f.age*330+i*29)%130),y=Math.sin(i*2.4+f.age*8)*(12+i%3*5);flake.visible=true;flake.position.set(x,y);flake.alpha=.34*emerge;flake.scale.set(.65+i%3*.12);flake.rotation=Math.sin(f.age*8+i)*.15;
   }
   this.glow.add(f.x-f.dx*22*f.scale,f.y-f.dy*22*f.scale,92*f.scale,0xc6d8c8,.10*emerge);
   if(f.age<.16){
    const open=f.age/.16,r=(12+open*43)*f.scale,fade=1-open;
    g.ellipse(f.origin.x,f.origin.y,r,r*.24).fill({color:INK,alpha:fade*.48});
    g.moveTo(f.origin.x-r,f.origin.y).quadraticCurveTo(f.origin.x,f.origin.y+r*.45,f.origin.x+r,f.origin.y).stroke({color:PAPER,width:1.6,alpha:fade*.8});
    this.glow.add(f.origin.x,f.origin.y,100*f.scale,GOLD,fade*.15,.45);
   }
  }
  if(f.burst&&f.waveRadius){
   const t=f.age-f.flight,k=Math.min(1,t/.11),fade=Math.max(0,1-t/(f.life-f.flight)),r=f.waveRadius*k,h=this.foam;
   h.save().transform(c,s,-s,c,f.x,f.y);
   h.moveTo(-18,-r*.78).bezierCurveTo(r*.7,-r*1.05,r*1.15,-r*.4,r*.8,0).bezierCurveTo(r*1.15,r*.5,r*.65,r*1.08,-18,r*.78).quadraticCurveTo(r*.4,r*.3,r*.35,0).quadraticCurveTo(r*.4,-r*.3,-18,-r*.78).fill({color:INK,alpha:fade*.78});
   h.moveTo(-16,-r*.76).bezierCurveTo(r*.66,-r*1.02,r*1.1,-r*.39,r*.78,0).bezierCurveTo(r*1.1,r*.48,r*.64,r*1.04,-16,r*.76).stroke({color:PAPER,width:2.4,alpha:fade*.95});
   h.moveTo(0,-r*.48).quadraticCurveTo(r*.88,-r*.44,r*.56,0).quadraticCurveTo(r*.88,r*.45,0,r*.48).stroke({color:0x689a93,width:5.5,alpha:fade*.42});
   h.moveTo(3,-r*.46).quadraticCurveTo(r*.83,-r*.40,r*.54,0).quadraticCurveTo(r*.83,r*.41,3,r*.46).stroke({color:GOLD,width:.9,alpha:fade*.72});
   this.crestLayer.position.set(f.x,f.y);this.crestLayer.rotation=angle;
   for(let i=0;i<(low?7:12);i++){const a=-1.22+i/(low?6:11)*2.44,x=Math.cos(a)*r*.86,y=Math.sin(a)*r,rr=(9+i%3*4)*k;
    let crest=this.crestPool[i];if(!crest){crest=new Graphics(paperAccent(i,true));this.crestPool[i]=crest;this.crestLayer.addChild(crest);}crest.visible=k>0;crest.position.set(x,y);crest.scale.set(rr);crest.alpha=fade;
   }
   h.restore();
   const flash=Math.max(0,1-t/.16);this.glow.add(f.x+f.dx*r*.48,f.y+f.dy*r*.48,Math.min(135,40+r),0xb8d9cf,fade*.13,.7,angle);this.glow.add(f.x,f.y,65,0xffefd1,flash*.3);
  }
 }
}

export class InkCarpRenderer{
 root=new Container();private actors:CarpActor[]=[];
 update(model:InkCarp,enabled:boolean,low=false){
  this.root.visible=enabled&&model.fishes.length>0;
  while(this.actors.length<model.fishes.length){const actor=new CarpActor();this.actors.push(actor);this.root.addChild(actor.root);}
  for(const [i,actor] of this.actors.entries())actor.update(model.fishes[i],enabled,low);
 }
}
