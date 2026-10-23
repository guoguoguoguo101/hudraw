import {Container,Graphics} from 'pixi.js';
import type {PaperTiger,TigerState} from '../gameplay/paper-tiger';
import {PAPER_TIGER} from '../gameplay/paper-tiger';
import type {Arena} from '../input/line-interaction-geometry';

// Red/ivory folded silhouette and connected dark cutouts from auto-relics-c-folded.png.
const RED=0xb83c2d,LIGHT=0xe15c38,DARK=0x772a25,PAPER=0xf5e5bf,SHADE=0xccb58d,INK=0x243b37,GOLD=0xd6ad66;
const poly=(g:Graphics,p:number[],color:number)=>g.poly(p).fill(color);
function leg(g:Graphics,back=false){
 poly(g,[-12,-28,11,-23,7,-5,18,4,17,12,-10,12,-17,5,-9,-7],back?DARK:RED);
 poly(g,[-10,3,0,-3,16,5,17,12,-10,12],back?SHADE:PAPER);
 poly(g,[-12,-27,-1,-20,5,-10,-5,-14,-13,-10],INK);
 g.moveTo(2,7).lineTo(2,12).moveTo(9,7).lineTo(9,12).stroke({color:DARK,width:1.2});
}
function body(g:Graphics){
 poly(g,[-66,-53,-47,-69,-16,-73,15,-68,39,-59,37,-30,10,-17,-38,-21,-69,-34],DARK);
 poly(g,[-65,-54,-43,-66,-12,-68,16,-61,33,-53,25,-28,-11,-21,-47,-27,-68,-37],RED);
 poly(g,[-43,-66,-12,-68,16,-61,-17,-53,-50,-47],LIGHT);
 poly(g,[-49,-28,-29,-34,-3,-30,18,-39,25,-28,-11,-21],PAPER);
 poly(g,[16,-61,35,-57,44,-37,32,-13,17,-18,19,-39],PAPER);
 poly(g,[21,-52,34,-46,32,-13,23,-22],SHADE);
 // Bold negative-space strips read at game scale; the same motifs stay physically connected.
 for(const [x,dy] of [[-47,2],[-21,-1],[3,3]]){
  poly(g,[x-6,-65+dy,x+8,-62+dy,x+5,-48+dy,x+14,-39+dy,x+7,-33+dy,x-7,-48+dy],INK);
  poly(g,[x-3,-63+dy,x+2,-60+dy,x-2,-51+dy,x+5,-42+dy,x,-45+dy],PAPER);
 }
 g.moveTo(-58,-51).lineTo(-30,-43).lineTo(-17,-53).lineTo(15,-48).stroke({color:PAPER,width:.8,alpha:.45});
 poly(g,[-63,-36,-51,-31,-58,-24,-67,-29],PAPER);
}
function head(g:Graphics){
 // A broad brow, blunt muzzle, cheek ruff and fangs distinguish a tiger from a fox.
 poly(g,[-14,-29,-17,-46,-6,-49,3,-35,17,-42,28,-52,39,-47,36,-30,47,-17,48,4,28,22,2,19,-19,2,-24,-17],DARK);
 poly(g,[-13,-31,-11,-44,-5,-43,4,-31,19,-36,29,-46,35,-43,31,-28,43,-16,44,1,26,17,2,15,-15,0,-19,-16],RED);
 poly(g,[-12,-27,2,-33,15,-24,34,-28,43,-16,29,-9,32,8,18,19,2,12,-4,0,-19,-11],PAPER);
 poly(g,[-12,-27,2,-33,15,-24,8,-14,-4,-13],LIGHT);
 poly(g,[6,-28,18,-32,28,-29,21,-23,11,-22],INK);
 poly(g,[20,-22,35,-23,40,-17,28,-17,22,-10,15,-13],RED);
 poly(g,[23,-18,35,-19,29,-13,23,-13],INK);
 poly(g,[26,-17,32,-17,28,-15],GOLD);
 poly(g,[-15,-17,-5,-14,2,-4,-12,-9,-6,0,-18,-5],INK);
 poly(g,[37,-9,51,-5,45,2,33,1,26,-6],PAPER);
 poly(g,[43,-7,53,-5,48,0,43,-1],INK);
 poly(g,[34,2,46,1,40,9,30,10,20,6],DARK);
 poly(g,[30,3,35,4,31,14,27,8],PAPER);
 poly(g,[40,3,44,3,40,11,38,7],PAPER);
 // The 王 forehead mark is cut in three short bars with a central bridge.
 g.moveTo(2,-29).lineTo(14,-30).moveTo(2,-24).lineTo(12,-25).moveTo(3,-19).lineTo(12,-20).moveTo(8,-30).lineTo(8,-19).stroke({color:INK,width:2});
 g.moveTo(37,-1).lineTo(55,3).moveTo(36,2).lineTo(52,8).stroke({color:SHADE,width:1});
 poly(g,[-9,-39,-5,-40,-1,-33],PAPER);poly(g,[29,-41,33,-41,31,-33],PAPER);
}
function tail(g:Graphics){
 poly(g,[-3,4,-26,-4,-42,-19,-46,-40,-37,-57,-16,-61,-3,-48,-4,-34,-16,-24,-22,-30,-14,-39,-16,-48,-30,-46,-34,-35,-31,-23,-15,-9,4,-4],RED);
 poly(g,[-46,-39,-34,-35,-31,-23,-41,-22],PAPER);
 poly(g,[-37,-57,-30,-46,-16,-48,-16,-61],PAPER);
 poly(g,[-3,-48,-4,-34,-14,-39,-16,-48],INK);
 poly(g,[-26,-4,-15,-9,-31,-23,-37,-15],INK);
}
/** Static dock icon. Runtime uses articulated cached Graphics rather than rebuilding the tiger. */
export function drawPaperTiger(g:Graphics,includeTail=true,clear=true){
 if(clear)g.clear();
 // GraphicsContext instructions can be reused with transforms via save/restore.
 if(includeTail){g.save().transform(1,0,0,1,-64,-40);tail(g);g.restore();}
 g.save().transform(1,0,0,1,-43,-10);leg(g,true);g.restore();
 g.save().transform(1,0,0,1,17,-9);leg(g,true);g.restore();body(g);
 g.save().transform(1,0,0,1,-49,-4);leg(g);g.restore();
 g.save().transform(1,0,0,1,24,-4);leg(g);g.restore();
 g.save().transform(1,0,0,1,34,-47);head(g);g.restore();
}
export class PaperTigerRenderer{
 root=new Container();private ground=new Graphics();private rig=new Container();private shape=new Container();private tail=new Graphics();private body=new Graphics();private head=new Graphics();private back=new Graphics();private rear=new Graphics();private front=new Graphics();private farFront=new Graphics();private effects=new Graphics();private ghost=new Graphics();
 constructor(){
  tail(this.tail);body(this.body);head(this.head);leg(this.back,true);leg(this.farFront,true);leg(this.rear);leg(this.front);drawPaperTiger(this.ghost);
  this.shape.addChild(this.tail,this.back,this.farFront,this.body,this.rear,this.front,this.head);this.rig.addChild(this.shape);this.root.addChild(this.ground,this.rig,this.effects,this.ghost);
 }
 update(model:PaperTiger,b:Arena){
  const t=model.state;this.root.visible=!!t||model.dragging;this.ground.clear();this.effects.clear();this.rig.visible=!!t;this.ghost.visible=false;
  if(t)this.animate(t);
  if(model.dragging&&model.preview){const p=model.preview,valid=model.valid(p,b),g=this.effects;
   this.ghost.visible=!model.alive;this.ghost.position.set(p.x,p.y);this.ghost.scale.set(.68);this.ghost.alpha=valid?.65:.25;
   g.poly([p.x-25,p.y,p.x,p.y-12,p.x+25,p.y,p.x,p.y+12]).stroke({color:valid?GOLD:0xc74d46,width:1.6,alpha:.85});
   if(t){const d=Math.hypot(p.x-t.x,p.y-t.y),steps=Math.min(32,Math.ceil(d/14));for(let i=0;i<steps;i+=2){const a=i/steps,c=Math.min(1,(i+1)/steps);g.moveTo(t.x+(p.x-t.x)*a,t.y+(p.y-t.y)*a).lineTo(t.x+(p.x-t.x)*c,t.y+(p.y-t.y)*c).stroke({color:GOLD,width:1.3,alpha:.6});}}
  }
 }
 private animate(t:TigerState){
  const a=t.phaseAge,phase=t.phase,p=phase==='leap'?Math.min(1,a/PAPER_TIGER.leap):0,air=Math.sin(p*Math.PI),unfold=phase==='unfold'?Math.min(1,a/PAPER_TIGER.unfold):1,fold=phase==='fold'?Math.min(1,a/PAPER_TIGER.fold):0;
  const emerge=1-Math.pow(1-unfold,3),crouch=phase==='windup'?a/PAPER_TIGER.windup:phase==='land'?1-a/PAPER_TIGER.land:0;
  this.rig.position.set(t.x,t.y-air*76);this.rig.alpha=(1-fold)*(t.remaining<2?.7+.3*Math.sin(t.age*14)**2:1);
  this.rig.scale.set(.72*t.facing*(1+air*.13+crouch*.07),.72*(.12+.88*emerge)*(1-crouch*.25-air*.05)*(1-fold*.85));
  this.shape.rotation=phase==='leap'?(p-.5)*.22:phase==='fold'?fold*.15:0;
  this.body.position.y=phase==='idle'||phase==='rest'?Math.sin(t.age*3)*1.2:0;
  this.tail.position.set(-64,-40);this.tail.rotation=Math.sin(t.age*3)*.07-air*.3;
  this.back.position.set(-43,-10);this.farFront.position.set(17,-9);this.rear.position.set(-49,-4);this.front.position.set(24,-4);
  this.rear.rotation=phase==='leap'?.8-air*.35:crouch*-.26;
  this.front.rotation=phase==='leap'?-.8+air*.3:crouch*.15;
  this.farFront.rotation=this.front.rotation*.8;this.back.rotation=this.rear.rotation*.8;
  this.head.position.set(34+air*5,-47-crouch*-3);this.head.rotation=phase==='windup'?.08:phase==='leap'?-.09:Math.sin(t.age*2)*.015;
  const shadow=this.ground;shadow.ellipse(t.x,t.y+5,51*(1-air*.3)*(1-fold*.3),10*(1-air*.4)).fill({color:0x111819,alpha:.32*(1-fold)});
  if(phase==='unfold'||phase==='fold'){
   const q=phase==='unfold'?unfold:1-fold;
   shadow.poly([t.x-37,t.y-5,t.x+3,t.y-20,t.x+43,t.y-2,t.x,t.y+15]).stroke({color:GOLD,width:1,alpha:(1-q)*.7});
   for(let i=0;i<9;i++){const ang=i*2.4,rad=18+q*46,x=t.x+Math.cos(ang)*rad,y=t.y-25+Math.sin(ang)*rad*.55-q*26;this.effects.poly([x-3,y,x+4,y-3,x+1,y+5]).fill({color:i%2?PAPER:RED,alpha:(1-q)*.8});}
  }
  if(phase==='leap'&&p>.2&&p<.85){
   for(let i=1;i<=3;i++){const q=Math.max(0,p-i*.08),x=t.from.x+(t.to.x-t.from.x)*q,y=t.from.y+(t.to.y-t.from.y)*q-Math.sin(q*Math.PI)*76;this.effects.poly([x-t.facing*18,y-25,x-t.facing*39,y-18,x-t.facing*24,y-15]).fill({color:i%2?PAPER:RED,alpha:.12*(4-i)});}
  }
  if(phase==='land'){
   const q=Math.min(1,a/PAPER_TIGER.land),g=this.effects;
   for(let i=0;i<3;i++){const x=t.x+(i-1)*13*t.facing;g.poly([x-17*t.facing,t.y-34+q*12,x-8*t.facing,t.y-44+q*12,x+15*t.facing,t.y-3,x+9*t.facing,t.y+3]).fill({color:i===1?PAPER:LIGHT,alpha:(1-q)*.75});}
   for(let i=0;i<8;i++){const ang=i*2.4,x=t.x+Math.cos(ang)*(16+q*44),y=t.y+Math.sin(ang)*(5+q*15)-Math.sin(q*Math.PI)*12;g.poly([x-3,y-2,x+4,y-3,x+1,y+3]).fill({color:i%2?PAPER:RED,alpha:1-q});}
  }
  if(t.command){const p=t.command;this.ground.poly([p.x-13,p.y,p.x,p.y-7,p.x+13,p.y,p.x,p.y+7]).stroke({color:GOLD,width:1,alpha:.65});}
 }
}
