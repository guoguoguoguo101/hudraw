import {Container,Graphics} from 'pixi.js';
import {PAPER_CRAB,type PaperCrab} from '../gameplay/paper-crab';
const TEAL=0x267f8b,DEEP=0x174c61,INK=0x203d48,PAPER=0xf2e4be,GOLD=0xd8b367,CORAL=0xc66b4e,LIGHT=0x70afb0;
function shell(g:Graphics){
 g.poly([-65,1,-73,-28,-53,-52,-23,-62,23,-62,57,-48,73,-23,64,5,34,23,-32,23]).fill(DEEP).stroke({color:GOLD,width:2});
 g.poly([-64,-27,-47,-46,-20,-55,20,-55,50,-43,64,-24,54,2,30,15,-28,15,-56,0]).fill(TEAL);
 g.poly([-47,-46,-20,-55,20,-55,50,-43,18,-35,-15,-35]).fill(LIGHT);
 g.poly([-27,15,-52,-3,-21,-7,0,3,21,-7,53,-3,30,15]).fill(PAPER);
 for(const side of [-1,1]){
  for(let i=0;i<3;i++){const x=side*(18+i*16);g.moveTo(x,-37+i*4).lineTo(x+side*9,-26+i*5).lineTo(x,-19+i*6).stroke({color:GOLD,width:1.7});}
  g.moveTo(side*12,-29).bezierCurveTo(side*33,-47,side*53,-15,side*29,-13).bezierCurveTo(side*17,-11,side*24,-27,side*33,-23).stroke({color:PAPER,width:2});
 }
 // Helmet crest, coral knot and eye stalks retain a clear crab silhouette.
 g.poly([-16,-54,-12,-80,0,-91,12,-80,16,-54,0,-46]).fill(DEEP).stroke({color:GOLD,width:2});
 g.poly([0,-84,5,-74,0,-62,-5,-74]).fill(GOLD);
 g.moveTo(-7,-76).lineTo(-23,-88).lineTo(-25,-101).moveTo(-23,-88).lineTo(-36,-88).moveTo(7,-76).lineTo(23,-88).lineTo(25,-101).moveTo(23,-88).lineTo(36,-88).stroke({color:GOLD,width:5,cap:'round',join:'round'});
 g.poly([-27,-53,27,-53,20,-45,-20,-45]).fill(GOLD);
 for(const side of [-1,1]){
  g.moveTo(side*27,-46).lineTo(side*32,-67).stroke({color:INK,width:7});g.circle(side*33,-69,10).fill(PAPER).stroke({color:GOLD,width:1.5});g.ellipse(side*34,-69,3.4,5).fill(INK).circle(side*35,-71,1).fill(0xffffff);
 }
 g.poly([-13,0,0,-8,13,0,0,9]).fill(CORAL).stroke({color:GOLD,width:1});g.poly([-5,6,-14,27,-4,24,0,11,4,24,14,27,5,6]).fill(CORAL);
 g.moveTo(-9,-12).quadraticCurveTo(0,-6,9,-12).stroke({color:INK,width:2});
}
function claw(g:Graphics,side:number){
 g.poly([0,0,side*21,-20,side*35,-16,side*29,-2,side*12,16]).fill(DEEP).stroke({color:GOLD,width:1.6});
 g.moveTo(side*22,-16).lineTo(side*28,-42).lineTo(side*52,-63).lineTo(side*73,-58).lineTo(side*79,-38).lineTo(side*57,-30).lineTo(side*68,-46).lineTo(side*49,-43).lineTo(side*42,-24).lineTo(side*63,-19).lineTo(side*80,-32).lineTo(side*83,-16).lineTo(side*67,1).lineTo(side*40,1).closePath().fill(TEAL).stroke({color:GOLD,width:2});
 g.poly([side*28,-42,side*52,-63,side*73,-58,side*63,-50,side*47,-50,side*35,-35]).fill(LIGHT);
 g.moveTo(side*37,-31).quadraticCurveTo(side*50,-38,side*56,-27).quadraticCurveTo(side*58,-16,side*45,-18).stroke({color:PAPER,width:2});
 g.poly([side*68,-46,side*57,-30,side*79,-38]).fill(PAPER);g.poly([side*63,-19,side*80,-32,side*76,-19]).fill(PAPER);
}
function foot(g:Graphics,side:number,i:number){
 g.poly([0,0,side*(29+i*3),6-i*6,side*(43+i*5),30-i*4,side*(28+i*4),25-i*4,side*(18+i*3),14-i*4,side*2,15]).fill(i%2?TEAL:DEEP).stroke({color:GOLD,width:1.3});
 g.moveTo(side*6,6).lineTo(side*(24+i*3),11-i*5).lineTo(side*(34+i*5),25-i*4).stroke({color:PAPER,width:1,alpha:.65});
}
function banner(g:Graphics,side:number){
 g.moveTo(0,0).lineTo(side*13,-67).stroke({color:GOLD,width:2});g.poly([side*13,-67,side*42,-60,side*31,-48,side*9,-48]).fill(CORAL).stroke({color:GOLD,width:1});
 g.moveTo(side*16,-60).quadraticCurveTo(side*29,-64,side*28,-55).quadraticCurveTo(side*21,-51,side*17,-55).stroke({color:PAPER,width:1.2});
}
export function drawPaperCrab(g:Graphics){
 for(const side of [-1,1]){g.save().transform(1,0,0,1,side*42,-24);banner(g,side);g.restore();for(let i=0;i<3;i++){g.save().transform(1,0,0,1,side*(43+i*7),i*10-1);foot(g,side,i);g.restore();}const s=side===-1?1.25:1;g.save().transform(s,0,0,s,side*47,-22);claw(g,side);g.restore();}shell(g);
}
export class PaperCrabRenderer{
 root=new Container();private fx=new Graphics();private rig=new Container();private body=new Graphics();private legs:{g:Graphics;side:number;i:number;y:number}[]=[];private claws:{g:Graphics;side:number}[]=[];private banners:{g:Graphics;side:number}[]=[];
 constructor(){
  this.root.addChild(this.fx,this.rig);
  for(const side of [-1,1]){
   const flag=new Graphics();banner(flag,side);flag.position.set(side*42,-24);this.rig.addChild(flag);this.banners.push({g:flag,side});
   for(let i=0;i<3;i++){const g=new Graphics();foot(g,side,i);g.position.set(side*(43+i*7),i*10-1);this.rig.addChild(g);this.legs.push({g,side,i,y:i*10-1});}
   const g=new Graphics();claw(g,side);g.position.set(side*47,-22);if(side===-1)g.scale.set(1.25);this.rig.addChild(g);this.claws.push({g,side});
  }
  shell(this.body);this.rig.addChild(this.body);
 }
 update(model:PaperCrab){
  const t=model.state;this.root.visible=!!t;if(!t)return;const g=this.fx;g.clear();
  const charge=t.phase==='dash',ready=t.phase==='windup',fold=t.phase==='fold',u=ready?Math.min(1,t.phaseAge/PAPER_CRAB.windup):0;
  const emerge=t.phase==='unfold'?Math.min(1,t.phaseAge/PAPER_CRAB.unfold):1,fade=fold?Math.max(0,1-t.phaseAge/PAPER_CRAB.fold):1;
  this.rig.position.set(t.x,t.y+(charge?Math.sin(t.age*45)*2:Math.sin(t.age*3)*1.4));
  this.rig.scale.set(.64*(1+u*.12),.64*emerge*fade*(1-u*.17));this.rig.alpha=fade*(t.remaining<2?.65+.35*Math.sin(t.age*12)**2:1);
  this.rig.skew.x=charge?Math.cos(t.heading)*-.12:0;
  for(const p of this.legs){p.g.rotation=Math.sin(t.age*(charge?40:5)+p.i*1.7+p.side)* (charge?.3:.08);p.g.y=p.y+Math.sin(t.age*(charge?40:5)+p.i*1.7+p.side)*(charge?4:1.4);}
  for(const p of this.claws)p.g.rotation=p.side*(ready?-.2*u:charge?-.16:Math.sin(t.age*2)*.045);
  for(const p of this.banners)p.g.skew.x=Math.sin(t.age*(charge?16:3)+p.side)*.13+(charge?-Math.cos(t.heading)*.3:0);
  if(ready){
   g.moveTo(t.x,t.y).lineTo(t.to.x,t.to.y).stroke({color:TEAL,width:86,alpha:.07+u*.08}).moveTo(t.x,t.y).lineTo(t.to.x,t.to.y).stroke({color:GOLD,width:1.5,alpha:.35+u*.45});
   const dx=Math.cos(t.heading),dy=Math.sin(t.heading);for(let i=1;i<=4;i++){const x=t.x+(t.to.x-t.x)*i/5,y=t.y+(t.to.y-t.y)*i/5;g.moveTo(x-dx*9-dy*7,y-dy*9+dx*7).lineTo(x,y).lineTo(x-dx*9+dy*7,y-dy*9-dx*7).stroke({color:PAPER,width:2,alpha:.25+u*.5});}
  }
  if(charge){
   const dx=Math.cos(t.heading),dy=Math.sin(t.heading);for(let i=0;i<7;i++){const behind=18+i*14,side=(i%2?1:-1)*(16+i%3*8),x=t.x-dx*behind-dy*side,y=t.y-dy*behind+dx*side;g.moveTo(x,y).lineTo(x-dx*(24+i*3),y-dy*(24+i*3)).stroke({color:i%2?PAPER:LIGHT,width:i%3?2:4,alpha:.65-i*.07});}
   const c=Math.cos(t.heading),s=Math.sin(t.heading);g.save().transform(c,s,-s,c,t.x,t.y).moveTo(33,-44).quadraticCurveTo(69,0,33,44).stroke({color:PAPER,width:3,alpha:.8}).moveTo(39,-36).quadraticCurveTo(61,0,39,36).stroke({color:GOLD,width:1.3,alpha:.8}).restore();
  }
 }
}
