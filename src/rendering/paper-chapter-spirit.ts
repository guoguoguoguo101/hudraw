import {Container,Graphics} from 'pixi.js';
import type {EnemyLook} from '../core/types';

const PAPER=0xffebc7,INK=0x243b46,JADE=0x397c7f,TEAL=0x245968,RED=0xbb5240,VERMILION=0xda7050,GOLD=0xd8b16b,BLUE=0x334e72;
type Part={g:Graphics;y:number;kind:'fin'|'tail'|'ribbon'|'claw'|'foot';side:number};
function fold(g:Graphics,points:number[],alpha=.65){g.poly(points,false).stroke({color:GOLD,width:1,alpha});}
function cloudCut(g:Graphics,x:number,y:number,s=1,color=PAPER){
 g.save().transform(s,0,0,s,x,y).moveTo(-18,5).bezierCurveTo(-28,-2,-19,-16,-8,-10).bezierCurveTo(-5,-25,17,-21,17,-8).bezierCurveTo(33,-9,31,11,16,9).lineTo(-18,9).closePath().fill(color);
 g.moveTo(-13,3).bezierCurveTo(-16,-6,-5,-9,-3,-2).bezierCurveTo(0,5,9,1,6,-4).stroke({color:JADE,width:1,alpha:.7});g.restore();
}
function cutEye(g:Graphics,x:number,y:number,side=1){
 g.save().transform(side,0,0,1,x,y).moveTo(-7,0).quadraticCurveTo(0,-7,8,-3).quadraticCurveTo(6,6,-2,6).closePath().fill(PAPER);
 g.ellipse(1,0,2.7,3.8).fill(INK).circle(2,-2,1).fill(GOLD).restore();
}

/** Sparse negative cuts, folded silhouettes and articulated paper pieces, authored as vectors. */
export class PaperChapterSpirit{
 root=new Container();private shape=new Graphics();private eyes=new Container();private parts:Part[]=[];
 constructor(private look:EnemyLook){
  if(look==='snow-marten')this.marten();else if(look==='snow-owl')this.owl();else if(look==='snow-shell')this.iceShell();else if(look==='sea-fish')this.fish();else if(look==='sea-jelly')this.jelly();else if(look==='sea-crab')this.crab();else if(look==='star-ray')this.ray();else if(look==='star-bell')this.bell();else this.swallow();
 }
 private part(kind:Part['kind'],side:number,x:number,y:number){
  const g=new Graphics();g.position.set(x,y);this.root.addChild(g);this.parts.push({g,kind,side,y});return g;
 }
 private face(x:number,y:number,spacing=10){
  this.eyes.position.set(x,y);this.root.addChild(this.eyes);
  for(const side of [-1,1]){const e=new Graphics();cutEye(e,side*spacing,0,-side);this.eyes.addChild(e);}
 }
 private fish(){
  const tail=this.part('tail',1,-26,0);
  tail.poly([0,0,-23,-25,-51,-31,-39,-8,-55,8,-29,17,-15,31]).fill(RED).stroke({color:GOLD,width:1});
  tail.poly([-5,0,-44,-23,-30,-5,-45,6,-21,10,-17,24]).fill(PAPER);fold(tail,[-44,-23,-5,0,-45,6]);
  this.part('fin',1,-1,15).poly([-17,-5,8,1,22,31,-7,21]).fill(JADE).stroke({color:GOLD,width:1});
  const g=this.shape;this.root.addChild(g);
  g.moveTo(-29,-2).lineTo(-9,-27).lineTo(19,-24).quadraticCurveTo(38,-18,49,1).lineTo(37,16).lineTo(3,25).lineTo(-26,12).closePath().fill(VERMILION).stroke({color:GOLD,width:1});
  g.poly([-28,-2,-9,-27,19,-24,5,-7,-5,8]).fill(JADE);
  g.poly([-21,9,-1,8,19,15,41,7,37,16,3,25]).fill(PAPER);
  g.poly([-9,-27,-15,-49,10,-35,19,-24]).fill(RED);g.poly([-13,-40,1,-33,5,-25]).fill(PAPER);
  for(let i=0;i<3;i++)g.poly([-12+i*12,-6,-6+i*12,-13,i*12,-6,-6+i*12,2]).fill(PAPER);
  fold(g,[-28,-2,5,-7,37,4]);cutEye(g,30,-6);
  g.moveTo(41,13).quadraticCurveTo(50,20,38,28).stroke({color:GOLD,width:1.2});
 }
 private jelly(){
  for(let i=-1;i<=1;i++){
   const r=this.part('ribbon',i,i*24,12);
   r.poly([-4,0,4,0,11,21,0,37,12,49,-3,43,-10,28,1,15]).fill(i===0?JADE:PAPER).stroke({color:GOLD,width:.8});
   r.poly([0,11,5,18,0,25,-4,18]).fill(i===0?PAPER:JADE);
  }
  const g=this.shape;this.root.addChild(g);
  g.poly([0,-46,22,-29,43,2,30,15,13,9,0,17,-14,10,-32,15,-44,1,-22,-29]).fill(JADE).stroke({color:GOLD,width:1.2});
  g.poly([0,-46,-7,-8,-32,8,-40,1,-20,-27]).fill(PAPER);
  g.poly([0,-46,20,-27,39,1,30,8,8,-8]).fill(PAPER);
  g.poly([-7,-8,0,-3,8,-8,15,6,0,14,-15,6]).fill(TEAL);
  fold(g,[0,-42,0,-8]);fold(g,[-39,0,0,-10,39,0]);
  for(const side of [-1,1])g.poly([side*19,-20,side*25,-13,side*20,-8,side*15,-13]).fill(JADE);
  g.poly([0,-56,5,-50,0,-44,-5,-50]).stroke({color:GOLD,width:2});this.face(0,0,9);
 }
 private crab(){
  for(const side of [-1,1]){
   for(let i=0;i<3;i++)this.part('foot',side,side*(20+i*5),11+i*6).poly([0,0,side*(18+i*2),-8,side*(27+i*2),8,side*17,3,side*3,7]).fill(JADE);
   const c=this.part('claw',side,side*29,-3);
   c.poly([0,10,side*16,-6,side*13,-24,side*27,-36,side*28,-17,side*39,-29,side*42,-11,side*27,5,side*10,19]).fill(RED).stroke({color:GOLD,width:1});
   c.poly([side*15,-21,side*24,-29,side*22,-9,side*36,-22,side*32,-8,side*23,0]).fill(PAPER);fold(c,[side*7,8,side*23,-3,side*37,-18]);
  }
  const g=this.shape;this.root.addChild(g);
  g.poly([-38,-6,-31,-24,-13,-35,0,-30,14,-35,32,-22,39,-5,25,23,0,31,-26,23]).fill(VERMILION).stroke({color:GOLD,width:1});
  g.poly([0,-30,14,-35,32,-22,39,-5,0,20]).fill(RED);
  g.poly([-29,8,0,20,29,8,23,22,0,29,-24,22]).fill(PAPER);
  for(const x of [-25,-12,13,26])fold(g,[x,-22,0,17],.55);
  cloudCut(g,-20,-7,.37);cloudCut(g,20,-7,.37);this.face(0,7,10);
 }
 private ray(){
  const tail=this.part('tail',1,0,17);
  tail.poly([-3,0,4,0,15,23,0,35,13,48,28,42,19,55,0,48,-7,35,7,22]).fill(BLUE).stroke({color:GOLD,width:.8});
  for(const side of [-1,1]){
   const w=this.part('fin',side,side*6,-3);w.scale.x=side;
   w.poly([0,-12,55,-42,43,-9,62,19,22,16,0,27]).fill(BLUE).stroke({color:GOLD,width:1.1});
   w.poly([9,-10,45,-33,30,-5,49,12,17,8]).fill(PAPER);w.poly([15,-12,34,-25,22,-4]).fill(0x66879b);
   fold(w,[0,-11,30,-5,53,15]);
  }
  const g=this.shape;this.root.addChild(g);
  g.poly([0,-34,16,-13,14,19,0,31,-15,18,-16,-13]).fill(TEAL).stroke({color:GOLD,width:1});
  g.poly([0,-34,0,31,-15,18,-16,-13]).fill(BLUE);
  g.poly([0,-26,5,-16,0,-7,-5,-16]).fill(PAPER);this.face(0,4,7);
  g.moveTo(-34,-5).lineTo(-23,2).lineTo(-32,10).stroke({color:GOLD,width:1});g.circle(-34,-5,2).fill(GOLD).circle(-23,2,2).fill(GOLD).circle(-32,10,2).fill(GOLD);
 }
 private bell(){
  const tassel=this.part('ribbon',1,0,25);
  tassel.poly([0,0,5,8,0,15,-5,8]).fill(GOLD);tassel.poly([-4,14,4,14,14,40,1,33,-10,40,-7,23]).fill(RED);fold(tassel,[0,15,1,33]);
  const g=this.shape;this.root.addChild(g);
  g.poly([0,-58,9,-49,0,-39,-9,-49]).stroke({color:GOLD,width:2});
  g.poly([-18,-34,18,-34,25,-14,38,22,24,30,-24,30,-38,22,-25,-14]).fill(BLUE).stroke({color:GOLD,width:2});
  g.poly([-18,-34,0,-39,0,24,-34,19,-24,-14]).fill(TEAL);
  cloudCut(g,-17,-5,.48);cloudCut(g,17,-5,.48);
  g.poly([-20,-32,20,-32,24,-24,-24,-24]).fill(GOLD);g.poly([-38,21,0,13,38,21,25,29,-25,29]).fill(GOLD);
  g.ellipse(0,25,25,8).fill(INK).stroke({color:GOLD,width:1});fold(g,[0,-35,0,12]);this.face(0,21,9);
 }
 private swallow(){
  for(const side of [-1,1]){
   const r=this.part('ribbon',side,side*7,17);
   r.poly([-3,0,4,0,side*24,23,side*10,46,side*27,38,side*18,57,side*0,46,side*12,23]).fill(side===1?RED:BLUE).stroke({color:GOLD,width:.7});
   const w=this.part('fin',side,side*8,-5);w.scale.x=side;
   w.poly([0,0,54,-43,43,-10,64,1,25,21]).fill(side===1?RED:BLUE).stroke({color:GOLD,width:1});
   w.poly([4,1,44,-33,28,-5,50,1,23,12]).fill(PAPER);w.poly([4,1,28,-5,23,12]).fill(TEAL);fold(w,[0,0,28,-5,54,-38]);
  }
  const g=this.shape;this.root.addChild(g);
  g.poly([0,-40,20,-19,14,6,0,30,-15,5,-18,-20]).fill(RED).stroke({color:GOLD,width:1});
  g.poly([0,-40,0,30,-15,5,-18,-20]).fill(PAPER);
  g.poly([-14,-18,0,-29,14,-18,9,-4,-9,-4]).fill(TEAL);g.poly([-4,6,0,20,4,6]).fill(GOLD);this.face(0,-12,8);
 }
 private marten(){
  const white=0xf1efe2,shade=0x9daeb5;
  const tail=this.part('tail',1,24,9);
  tail.moveTo(-3,10).bezierCurveTo(50,27,68,-20,42,-47).quadraticCurveTo(48,-12,22,-7).quadraticCurveTo(10,-4,-3,10).fill(white).stroke({color:INK,width:1.5});
  tail.moveTo(23,-7).quadraticCurveTo(47,-17,42,-34).stroke({color:GOLD,width:1.2});
  for(const side of [-1,1])this.part('foot',side,side*18,26).ellipse(0,0,12,7).fill(shade).stroke({color:INK,width:1});
  const g=this.shape;this.root.addChild(g);
  g.moveTo(-33,16).quadraticCurveTo(-44,-2,-28,-29).lineTo(-24,-48).lineTo(-9,-35).quadraticCurveTo(0,-40,10,-34).lineTo(27,-48).lineTo(29,-28).quadraticCurveTo(47,9,29,24).quadraticCurveTo(0,43,-33,16).fill(white).stroke({color:INK,width:1.7});
  g.poly([-24,-42,-11,-30,-25,-22]).fill(shade);g.poly([24,-42,12,-29,27,-23]).fill(shade);
  g.moveTo(-28,-17).quadraticCurveTo(0,-28,29,-17).lineTo(20,2).quadraticCurveTo(0,13,-21,2).closePath().fill(0x4d6572);
  g.poly([-28,14,-8,22,0,35,-24,25]).fill(0xc6d2d0);g.poly([5,20,29,9,29,24,11,32]).fill(shade);
  g.poly([-20,6,0,15,19,6,10,20,-9,20]).fill(white);
  this.face(0,-8,11);g.poly([-3,6,3,6,0,10]).fill(RED);
  g.moveTo(-8,24).bezierCurveTo(-15,13,3,10,7,20).bezierCurveTo(10,27,-1,28,-2,22).stroke({color:GOLD,width:1.3});
  for(const side of [-1,1])g.moveTo(side*18,4).lineTo(side*33,1).moveTo(side*19,8).lineTo(side*34,10).stroke({color:GOLD,width:.8});
 }
 private owl(){
  const white=0xeeeede,shade=0x708b9a;
  for(const side of [-1,1]){
   const w=this.part('fin',side,side*14,-2);w.scale.x=side;
   w.poly([0,-10,31,-35,62,-45,53,-21,68,-22,54,-4,61,1,39,19,12,24,0,9]).fill(shade).stroke({color:INK,width:1.5});
   w.poly([8,-8,32,-28,53,-35,35,-12,50,-16,37,-2,48,0,28,13,10,15]).fill(white);
   w.moveTo(8,5).lineTo(35,-12).moveTo(17,11).lineTo(40,0).stroke({color:GOLD,width:1});
   this.part('foot',side,side*10,32).poly([-5,0,6,0,7,8,2,6,0,9,-2,6,-7,8]).fill(GOLD);
  }
  const g=this.shape;this.root.addChild(g);
  g.poly([-24,-17,-29,-39,-9,-29,0,-32,10,-29,29,-39,24,-16,26,13,14,36,0,44,-16,33,-28,11]).fill(white).stroke({color:INK,width:1.5});
  g.poly([-24,9,0,20,25,8,14,36,0,44,-16,33]).fill(0xb9c7c7);
  g.moveTo(0,-22).quadraticCurveTo(-32,-36,-23,-7).quadraticCurveTo(-20,8,0,4).quadraticCurveTo(23,9,24,-9).quadraticCurveTo(28,-35,0,-22).fill(0x465b6b);
  for(const side of [-1,1]){g.circle(side*11,-9,9).fill(GOLD);g.ellipse(side*11,-9,3.4,6).fill(INK).circle(side*11+1,-12,1.5).fill(white);}
  g.poly([-4,3,4,3,0,12]).fill(GOLD);
  for(let row=0;row<3;row++)for(const side of [-1,1])g.poly([side*8,14+row*7,side*14,17+row*7,side*8,20+row*7,side*3,17+row*7]).fill({color:0xf4f0db,alpha:.9});
 }
 private iceShell(){
  const white=0xf0efe3,stone=0x576d78,shade=0x9aafb5;
  for(const side of [-1,1])for(let i=0;i<2;i++)this.part('foot',side,side*(26+i*7),15+i*9).poly([0,0,side*15,-4,side*21,8,side*5,10]).fill(stone).stroke({color:GOLD,width:.8});
  const g=this.shape;this.root.addChild(g);
  g.poly([0,-43,25,-34,43,-13,40,13,24,31,0,36,-29,28,-43,5,-40,-18,-23,-35]).fill(stone).stroke({color:INK,width:1.7});
  g.poly([0,-43,25,-34,43,-13,12,-5]).fill(shade);g.poly([0,-43,12,-5,-13,9,-40,-18,-23,-35]).fill(white);
  g.poly([12,-5,43,-13,40,13,24,31,-1,14]).fill(0x849da6);g.poly([-40,-18,-13,9,-29,28,-43,5]).fill(shade);
  g.poly([-26,-30,-16,-45,-6,-37,0,-48,9,-39,26,-40,33,-26,20,-22,9,-29,-5,-24,-17,-29]).fill(white);
  g.moveTo(0,-32).lineTo(4,-6).lineTo(-9,10).moveTo(4,-6).lineTo(29,-10).moveTo(-9,10).lineTo(-27,20).stroke({color:GOLD,width:1.4});
  g.poly([-18,18,-10,5,11,6,22,20,15,31,-12,31]).fill(white).stroke({color:INK,width:1});this.face(1,18,8);
  g.poly([-2,-19,4,-13,-2,-6,-8,-13]).stroke({color:0xe5dbb5,width:1.5});
 }
 update(time:number,ready:number,attack:number){
  const blink=Math.max(0,1-Math.abs(time%4.7-4.4)/.08);this.eyes.scale.y=Math.max(.15,1-blink);
  for(const p of this.parts){
   const wing=p.kind==='fin',speed=wing?this.look==='star-kite'?4.8:2.8:2.1;
   p.g.rotation=Math.sin(time*speed+p.side*.7)*(wing?.12:p.kind==='claw'?.1:.16)+p.side*ready*(p.kind==='claw'?-.23:.07);
   p.g.y=p.y+(p.kind==='foot'?Math.sin(time*5+p.side)*1.7:0)-attack*(p.kind==='claw'?4:0);
  }
 }
}
