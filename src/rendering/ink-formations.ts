import {Container,Graphics,Text,Texture,Sprite,Rectangle} from 'pixi.js';
import type {Skill} from '../core/types';
import {INK_RITUAL,type InkRituals,type InkFormation} from '../gameplay/ink-formations';
import {DemonSeal} from './circle-seal';
const INK=0x101e23,DEEP=0x1c3234,GOLD=0xdcb775,CREAM=0xf6e4b9,RED=0xba4939;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function palm(g:Graphics,sign:number){
 g.moveTo(-38,15).bezierCurveTo(-48,-15,-37,-46,-18,-54).quadraticCurveTo(2,-62,20,-45).bezierCurveTo(42,-40,43,-8,31,12).quadraticCurveTo(0,29,-38,15).fill(INK).stroke({color:GOLD,width:1.6,alpha:.8});
 for(let i=0;i<4;i++){const x=-27+i*17,y=-27-Math.sin(i/3*Math.PI)*13;
  g.moveTo(x-7,6).bezierCurveTo(x-15,-11,x-13,y-10,x-5,y-13).quadraticCurveTo(x+5,y-17,x+8,y+1).lineTo(x+7,9).quadraticCurveTo(x,17,x-7,6).fill(i%2?DEEP:INK).stroke({color:0x54716a,width:1});
  g.moveTo(x-6,y+2).quadraticCurveTo(x-4,y-5,x+1,y-4).stroke({color:GOLD,width:1.3,alpha:.8});
 }
 g.moveTo(-30*sign,-15).quadraticCurveTo(-54*sign,-15,-46*sign,9).quadraticCurveTo(-38*sign,21,-22*sign,8).fill(DEEP).stroke({color:GOLD,width:1.2,alpha:.7});
 g.moveTo(-24,12).quadraticCurveTo(0,19,25,10).stroke({color:GOLD,width:1.3});
}
class FormationRig{
 back=new Container();front=new Container();floor=new Graphics();seal:DemonSeal;impact=new Graphics();rim=new Graphics();guardian=new Container();torso=new Graphics();head=new Container();hands=[new Container(),new Container()];aura=new Graphics();title:Text;
 private mock:Skill;private radius:number;private lastSealFrame=-1;
 constructor(public formation:InkFormation,texture?:Texture){
  const f=formation,r=f.radius;this.radius=r;
  this.back.position.set(f.x,f.y);this.front.position.set(f.x,f.y);
  const path=f.path.flatMap(p=>[p.x-f.x,p.y-f.y]);
  this.floor.poly(path).fill({color:INK,alpha:f.level===4?.85:.48}).stroke({color:0x657b68,width:8,alpha:.22}).stroke({color:GOLD,width:2.2,alpha:.95});
  // Reuse the previous circle's actual seal artwork and ritual animation.
  this.seal=new DemonSeal(2,r*.84);this.seal.core.visible=f.level<4;
  this.back.addChild(this.floor,this.seal.root);this.front.addChild(this.seal.front,this.aura,this.guardian,this.rim,this.impact);
  this.mock={age:0,duration:f.life,geometry:{winding:1},circle:{captured:new Set(),broken:false}} as unknown as Skill;
  this.title=new Text({text:f.level===4?'墨魁现世':'落笔成阵',style:{fontFamily:'KaiTi, STKaiti, serif',fontSize:f.level===4?31:26,fontWeight:'bold',fill:CREAM,stroke:{color:INK,width:4},letterSpacing:3}});this.title.anchor.set(.5);this.title.position.set(0,f.level===4?-Math.max(265,r+100):-r-25);this.front.addChild(this.title);
  this.guardian.visible=f.level===4;
  if(f.level===4)this.buildGuardian(texture);
 }
 private buildGuardian(texture?:Texture){
  if(texture){
   const body=new Sprite(new Texture({source:texture.source,frame:new Rectangle(0,0,384,329)}));body.anchor.set(.5,1);body.width=282;body.height=242;this.guardian.addChild(body);
   for(let i=0;i<2;i++){const hand=new Sprite(new Texture({source:texture.source,frame:new Rectangle(384,i*171,128,171)}));hand.anchor.set(.5,.83);hand.width=104;hand.height=139;this.hands[i].addChild(hand);this.guardian.addChild(this.hands[i]);}
   return;
  }
  const g=this.torso;
  // Broad dark calligraphic shoulders, split robe ribbons and a narrow pale mask.
  g.moveTo(-118,-22).bezierCurveTo(-123,-86,-94,-136,-49,-133).quadraticCurveTo(-26,-153,0,-136).quadraticCurveTo(48,-149,91,-116).bezierCurveTo(116,-97,128,-42,109,-18).quadraticCurveTo(55,13,0,-3).quadraticCurveTo(-63,14,-118,-22).fill(INK).stroke({color:0x4b6560,width:2});
  for(const sign of [-1,1]){
   g.moveTo(sign*109,-28).bezierCurveTo(sign*77,-72,sign*115,-127,sign*57,-143).bezierCurveTo(sign*83,-112,sign*53,-99,sign*41,-113).quadraticCurveTo(sign*16,-57,sign*22,-12).quadraticCurveTo(sign*50,-48,sign*109,-28).fill(DEEP);
   g.moveTo(sign*101,-42).bezierCurveTo(sign*75,-82,sign*98,-108,sign*62,-126).moveTo(sign*19,-17).quadraticCurveTo(sign*22,-72,sign*46,-110).stroke({color:GOLD,width:2,alpha:.85});
   for(let i=0;i<4;i++){const x=sign*(42+i*15);g.moveTo(x,-15).bezierCurveTo(x-sign*20,-48,x+sign*21,-64,x+sign*7,-88).stroke({color:i%2?GOLD:0x57756e,width:i%2?1:3,alpha:.45});}
  }
  this.guardian.addChild(this.torso);
  const h=new Graphics();this.head.addChild(h);this.head.position.set(0,-126);
  h.moveTo(-39,12).bezierCurveTo(-60,-30,-21,-46,-32,-83).quadraticCurveTo(-7,-65,-9,-41).quadraticCurveTo(6,-73,27,-89).bezierCurveTo(17,-47,56,-27,37,10).quadraticCurveTo(0,37,-39,12).fill(INK).stroke({color:GOLD,width:1.4,alpha:.85});
  h.moveTo(-22,-17).quadraticCurveTo(-7,-29,0,-18).quadraticCurveTo(10,-31,24,-20).quadraticCurveTo(31,3,0,35).quadraticCurveTo(-31,5,-22,-17).fill(CREAM).stroke({color:GOLD,width:1.6});
  h.moveTo(-16,-9).lineTo(-5,-3).lineTo(-11,2).lineTo(-17,-3).closePath().moveTo(16,-9).lineTo(5,-3).lineTo(11,2).lineTo(17,-3).closePath().fill(INK);
  h.poly([0,-20,4,-10,0,-4,-4,-10]).fill(RED);h.moveTo(0,4).lineTo(-3,13).lineTo(2,17).lineTo(0,25).stroke({color:INK,width:1.4});
  for(const sign of [-1,1])h.moveTo(sign*29,-15).bezierCurveTo(sign*48,-38,sign*21,-59,sign*26,-72).stroke({color:GOLD,width:1.3,alpha:.9});
  this.guardian.addChild(this.head);
  for(let i=0;i<2;i++){const hand=this.hands[i],art=new Graphics();palm(art,i===0?-1:1);hand.addChild(art);this.guardian.addChild(hand);}
 }
 update(){
  const f=this.formation,t=f.age,r=this.radius,open=1-(1-clamp(t/.45))**3,fade=clamp((f.life-t)/.55),alpha=clamp(t/.1)*fade;
  this.back.alpha=this.front.alpha=alpha;this.floor.alpha=.6+.4*open;
  this.seal.root.scale.set(.55+.45*open);this.seal.front.scale.set(.55+.45*open);this.mock.age=t;const frame=Math.floor(t*24);if(frame!==this.lastSealFrame){this.lastSealFrame=frame;this.seal.update(this.mock,[]);}
  this.title.alpha=clamp(t/.15)*clamp((1.25-t)/.35);this.title.y=(f.level===4?-Math.max(265,r+100):-r-25)-Math.sin(clamp(t/1.2)*Math.PI)*8;
  const g=this.impact;g.clear();this.rim.clear();this.aura.clear();
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+t*.11,x=Math.cos(a)*r*.82,y=Math.sin(a)*r*.82;
   this.rim.moveTo(x,y).quadraticCurveTo(x+Math.cos(a+.6)*15,y-22,x+Math.cos(a)*12,y-38-8*Math.sin(t*3+i)).quadraticCurveTo(x+Math.cos(a-.6)*27,y-17,x,y).fill({color:INK,alpha:.9}).stroke({color:GOLD,width:1,alpha:.65});
  }
  const phase=(t-INK_RITUAL.open)%INK_RITUAL.tick;
  if(t>=INK_RITUAL.open&&phase<.22){const u=phase/.22;g.circle(0,0,r*(.2+.75*u)).stroke({color:GOLD,width:3-u*2,alpha:(1-u)*.65});}
  if(f.level<4)return;
  const rise=clamp((t-.22)/.6),sink=clamp((f.life-t)/.55),scale=Math.min(1.08,Math.max(.72,r/140));
  this.guardian.alpha=rise*sink;this.guardian.scale.set(scale,scale*(.16+.84*rise*sink));this.guardian.y=(1-rise*sink)*35+Math.sin(t*2)*2;
  this.head.rotation=Math.sin(t*1.6)*.035;
  for(let i=0;i<2;i++){
   const hand=this.hands[i],sign=i===0?-1:1,age=t-INK_RITUAL.slamTimes[Math.min(f.slams,INK_RITUAL.slamTimes.length-1)],prep=age<0&&age>-.5?Math.sin((age+.5)/.5*Math.PI/2):0,hitAge=t-INK_RITUAL.slamTimes[Math.max(0,f.slams-1)],recoil=f.slams>0&&hitAge<.35?Math.exp(-hitAge*9):0;
   hand.position.set(sign*(92-recoil*50)+(f.target.x-f.x)/scale*recoil,-7-prep*44+recoil*(13+(f.target.y-f.y)/scale));hand.rotation=sign*(.12+prep*.22-recoil*.18);hand.scale.set(1+recoil*.12);
  }
  this.aura.ellipse(0,-8,r*.9,r*.38).stroke({color:GOLD,width:2,alpha:.4});
  if(f.flash>0&&f.slams>0){const u=1-f.flash/.35,x=f.target.x-f.x,y=f.target.y-f.y;
   g.ellipse(x,y,25+u*80,12+u*38).stroke({color:CREAM,width:5*(1-u)+1,alpha:(1-u)*.85});
   for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(x+Math.cos(a)*20,y+Math.sin(a)*10).lineTo(x+Math.cos(a)*(35+u*70),y+Math.sin(a)*(18+u*35)).stroke({color:i%2?GOLD:INK,width:i%2?2:7,alpha:1-u});}
  }
 }
 destroy(){this.back.destroy({children:true});this.front.destroy({children:true});}
}
export class InkRitualRenderer{
 texture?:Texture;back=new Container();front=new Container();private rigs=new Map<number,FormationRig>();private blocks=new Graphics();
 constructor(){this.back.eventMode=this.front.eventMode='none';this.front.addChild(this.blocks);}
 update(m:InkRituals,low=false){
  const ids=new Set(m.formations.map(f=>f.id));for(const [id,rig] of this.rigs)if(!ids.has(id)||rig.formation!==m.formations.find(f=>f.id===id)){rig.destroy();this.rigs.delete(id);}
  for(const f of m.formations){let rig=this.rigs.get(f.id);if(!rig){rig=new FormationRig(f,this.texture);this.rigs.set(f.id,rig);this.back.addChild(rig.back);this.front.addChildAt(rig.front,0);}rig.update();rig.seal.ritual.back.visible=!low;}
  const g=this.blocks;g.clear();for(const b of m.blocks){const u=b.age/.45,fade=1-u;g.save().transform(Math.cos(b.angle),Math.sin(b.angle),-Math.sin(b.angle),Math.cos(b.angle),b.x,b.y);g.ellipse(0,0,7+u*13,15+u*30).stroke({color:GOLD,width:2,alpha:fade});g.moveTo(-8,0).quadraticCurveTo(-13,20,4,26).moveTo(-8,0).quadraticCurveTo(-13,-20,4,-26).stroke({color:CREAM,width:2,alpha:fade});g.restore();}
 }
}
