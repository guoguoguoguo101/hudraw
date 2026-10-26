import {PaperChapterSpirit} from './paper-chapter-spirit';
import {Container,Graphics,Text} from 'pixi.js';
import type {Enemy,EnemyLook} from '../core/types';
import {PAPER_MONSTERS} from '../gameplay/paper-monsters';

const PAPER=0xf2dfb6,CREAM=0xffefce,SHADE=0xc7a779,GOLD=0xd7ac61,RED=0xba3d2c,LIGHT=0xdd6340,DARK=0x722a2c,INK=0x26332f,GREEN=0x536954;
const shape=(g:Graphics,p:number[],color:number)=>g.poly(p).fill(color);
const eye=(g:Graphics,x:number,y:number,r:number,color=PAPER)=>{
 g.poly([x-r,y,x-r*.5,y-r*.8,x+r*.6,y-r*.65,x+r,y,x+r*.45,y+r*.75,x-r*.6,y+r*.55]).fill(color);
 g.ellipse(x+1,y,r*.27,r*.64).fill(INK);g.circle(x+2,y-2,r*.13).fill(CREAM);
};
const fold=(g:Graphics,p:number[],alpha=.5)=>g.poly(p,false).stroke({color:CREAM,width:1,alpha});

/** Art is built once. Idle, paper folds and attack anticipation animate articulated parts only. */
export class PaperMonsterRig{
 root=new Container();body=new Container();private face=new Graphics();private shadow=new Graphics();
 private parts:{g:Graphics;role:'wing'|'ear'|'leg'|'tassel';side:number;x:number;y:number}[]=[];
 private label:Text;private cute?:PaperChapterSpirit;
 constructor(public look:EnemyLook){
  this.root.addChild(this.shadow,this.body);
  if(look.startsWith('sea-')||look.startsWith('star-')||look.startsWith('snow-'))this.chapterMonster();else if(look==='paper-moth')this.moth();else if(look==='paper-lantern')this.lantern();else if(look==='paper-umbrella')this.umbrella();else if(look==='paper-frog')this.frog();else if(look==='paper-spines')this.spines();else this.rabbit();
  this.body.addChild(this.face);
  this.shadow.ellipse(0,49,look==='paper-moth'?28:35,7).fill({color:INK,alpha:.2});
  this.label=new Text({text:PAPER_MONSTERS.find(m=>m.id===look)!.name,style:{fontFamily:'"Microsoft YaHei", sans-serif',fontSize:18,fill:CREAM,stroke:{color:INK,width:4},letterSpacing:1}});
  this.label.anchor.set(.5,0);this.label.position.set(0,64);this.label.visible=false;this.root.addChild(this.label);
 }
 private part(role:'wing'|'ear'|'leg'|'tassel',side:number,x:number,y:number){
  const g=new Graphics();g.position.set(x,y);this.body.addChild(g);this.parts.push({g,role,side,x,y});return g;
 }
 update(e:Enemy,showLabel=false){
  const t=e.age+e.id*.23,breathe=Math.sin(t*3),ready=e.ai==='Telegraph'?Math.min(1,e.stateAge/.6):0,attack=e.ai==='Attack'?1:0;
  const hop=this.look==='paper-frog'||this.look==='paper-rabbit'||this.look==='snow-marten'?Math.max(0,Math.sin(t*(this.look==='paper-frog'?5:6)))*8:0;
  const hitAge=.23-e.hit,impact=e.hit>0?Math.exp(-hitAge*18)*Math.cos(hitAge*35):0;
  this.body.y=-hop+(this.look==='paper-moth'?-9:0)+(this.look==='sea-jelly'||this.look==='star-ray'?Math.sin(t*2.5)*7:0)-impact*5;this.body.rotation=Math.sin(t*2.1)*.045+impact*(e.id%2?1:-1)*.18;
  this.body.scale.set(1+breathe*.025+ready*.07-attack*.05+impact*.2,1-breathe*.02-ready*.07+attack*.09-impact*.18);
  this.body.tint=e.hit>.17?0xfff5df:0xffffff;
  this.face.tint=e.hit>0?0xffd8af:0xffffff;
  for(const p of this.parts){
   if(p.role==='wing'){p.g.scale.set(p.side*(.83+Math.sin(t*14)*.14),1);p.g.rotation=p.side*(Math.sin(t*14)*.16+ready*.15);}
   if(p.role==='ear')p.g.rotation=p.side*(.08+Math.sin(t*3+p.side)*.07+ready*.17);
   if(p.role==='leg'){p.g.rotation=p.side*(Math.sin(t*6)*.13+ready*.13);p.g.y=p.y+Math.sin(t*6+p.side)*2;}
   if(p.role==='tassel')p.g.rotation=Math.sin(t*4+p.side)*.17;
  }
  this.cute?.update(t,ready,attack);
  this.shadow.scale.set(1-hop*.015,1-hop*.02);this.shadow.alpha=1-hop*.025;this.label.visible=showLabel;
 }
 private chapterMonster(){
  this.cute=new PaperChapterSpirit(this.look);this.body.addChild(this.cute.root);
 }
 private moth(){
  for(const side of [-1,1]){
   const w=this.part('wing',side,side*8,-7);
   shape(w,[0,2,14,-39,53,-58,74,-53,66,-13,42,5,63,23,52,45,24,36,7,16],DARK);
   shape(w,[3,0,18,-34,54,-53,68,-50,60,-17,35,4,55,23,48,39,26,30,10,13],PAPER);
   shape(w,[18,-34,29,-37,41,-17,35,4,23,-3],RED);
   shape(w,[50,-48,61,-48,55,-22,46,-12,39,-15],RED);
   shape(w,[13,12,28,11,42,30,28,27],RED);
   w.poly([42,-33,55,-31,53,-20,43,-17,35,-23]).fill(INK);w.poly([43,-28,49,-26,44,-22,39,-25]).fill(GOLD);
   fold(w,[8,-1,31,-18,58,-47]);fold(w,[13,10,31,15,49,32]);
  }
  const g=this.face;
  shape(g,[-13,-31,0,-40,13,-28,9,6,0,35,-10,6],RED);shape(g,[-7,-24,0,-29,7,-23,5,4,0,25,-5,4],INK);
  shape(g,[-13,-28,-19,-41,-17,-46,-9,-41,-5,-29],GOLD);shape(g,[10,-29,14,-43,22,-45,23,-40,15,-28],GOLD);
  eye(g,-6,-20,5);eye(g,6,-20,5);g.moveTo(-5,5).lineTo(5,5).moveTo(-3,13).lineTo(3,13).stroke({color:GOLD,width:1.5});
 }
 private lantern(){
  for(const side of [-1,1]){
   const l=this.part('leg',side,side*19,37);shape(l,[-5,0,5,0,6,14,14,18,12,24,-8,22,-10,16],INK);
   const tassel=this.part('tassel',side,side*34,17);shape(tassel,[-3,0,3,0,5,37,0,31,-5,39],GOLD);
  }
  const g=this.face;
  shape(g,[-33,-48,-21,-57,22,-57,34,-47,30,-38,-30,-38],INK);
  g.moveTo(-14,-55).quadraticCurveTo(-15,-76,7,-70).quadraticCurveTo(24,-64,15,-55).stroke({color:INK,width:5});
  shape(g,[-29,-42,-45,-24,-48,8,-31,34,0,42,31,34,47,9,43,-25,28,-42],DARK);
  shape(g,[-25,-39,-39,-22,-41,6,-27,29,0,36,28,29,41,8,36,-24,23,-39],RED);
  shape(g,[-21,-35,-29,-17,-28,17,-18,29,-9,32,-15,5,-12,-23],LIGHT);
  shape(g,[18,-35,30,-17,31,14,23,30,10,34,17,7,12,-23],LIGHT);
  for(const y of [-28,-16,15,26])g.moveTo(-35,y).quadraticCurveTo(0,y+10,35,y).stroke({color:DARK,width:1.6,alpha:.65});
  eye(g,-16,-8,10);eye(g,16,-8,10);
  shape(g,[-23,12,-9,15,0,11,10,15,24,10,16,24,-1,27,-17,22],INK);
  shape(g,[-12,15,-6,16,-8,24],PAPER);shape(g,[10,15,16,14,13,23],PAPER);
  shape(g,[-23,34,24,34,26,42,-24,42],INK);g.moveTo(-20,37).lineTo(20,37).stroke({color:GOLD,width:2});
  shape(g,[-24,-44,24,-44,28,-37,-28,-37],GOLD);fold(g,[-26,-34,-31,-16,-31,-4],.35);
 }
 private umbrella(){
  const leg=this.part('leg',1,0,20);shape(leg,[-4,-7,5,-7,5,19,-2,28,9,33,17,31,21,36,9,41,-10,33,-12,26,-3,17],INK);
  shape(leg,[-2,-3,2,-3,2,19,-5,27,4,32,1,33,-9,27,-2,17],SHADE);
  const g=this.face;
  shape(g,[0,-70,-13,-48,-41,-25,-62,4,-48,13,-35,6,-22,16,-7,10,9,18,24,10,40,16,52,8,65,10,45,-24,15,-49],INK);
  const panels=[[-57,2,-31,-22,0,-61,-29,9],[-29,9,0,-61,-8,13],[-8,13,0,-61,20,12],[20,12,0,-61,41,-20,58,7]];
  panels.forEach((p,i)=>shape(g,p,i%2?DARK:RED));
  shape(g,[-47,-4,-30,-20,-2,-56,-26,-2],LIGHT);shape(g,[0,-59,20,-27,31,7,18,11],PAPER);
  for(const x of [-54,-29,-8,20,42,61])g.moveTo(0,-61).lineTo(x,7+Math.abs(x)*.025).stroke({color:GOLD,width:1,alpha:.8});
  shape(g,[-18,-10,-11,-24,5,-28,20,-17,21,-1,7,10,-10,7],INK);eye(g,1,-7,16);g.ellipse(2,-7,4.2,9).fill(RED);
  shape(g,[-22,13,-9,18,3,16,19,20,13,26,0,22,-11,25],PAPER);
  shape(g,[-7,22,1,21,5,40,-3,43,-9,32],RED);g.moveTo(-3,25).lineTo(0,36).stroke({color:LIGHT,width:1.4});
  g.moveTo(-1,-70).lineTo(1,-78).stroke({color:INK,width:3});
 }
 private frog(){
  for(const side of [-1,1]){
   const leg=this.part('leg',side,side*25,18);leg.scale.x=side;
   shape(leg,[0,-7,17,-9,35,8,34,22,15,23,27,30,40,29,41,34,11,36,-1,25,10,14,-3,8],INK);
   shape(leg,[1,-3,16,-4,27,9,26,16,10,18,17,28,30,30,10,30,4,22,15,12,3,6],GREEN);fold(leg,[14,0,23,10,15,17]);
  }
  const g=this.face;
  shape(g,[-41,0,-34,-24,-39,-38,-27,-54,-11,-49,-1,-36,13,-50,31,-49,42,-35,32,-19,42,3,31,28,0,37,-31,26],INK);
  shape(g,[-35,0,-28,-22,-33,-36,-25,-47,-14,-43,-5,-30,13,-44,28,-43,35,-34,27,-19,35,3,26,23,0,31,-26,22],GREEN);
  shape(g,[-27,10,-11,3,13,4,29,13,23,25,0,31,-23,24],PAPER);
  eye(g,-23,-31,11);eye(g,22,-31,11);shape(g,[-16,-9,-2,-13,13,-10,23,-3,10,4,-12,4,-23,-2],RED);
  g.moveTo(-22,0).quadraticCurveTo(0,13,25,-1).stroke({color:INK,width:2.4});
  for(const [x,y] of [[-26,-12],[27,-13],[-5,-23],[12,18],[-13,20]])shape(g,[x-3,y,x,y-3,x+3,y,x,y+3],GOLD);
  fold(g,[-31,-5,-19,-15,-6,-9]);fold(g,[5,-9,20,-17,32,-6]);
 }
 private spines(){
  const g=this.face;
  for(let i=0;i<11;i++){
   const a=Math.PI+i*Math.PI/10,r=43,outer=64+(i%3)*4;
   shape(g,[Math.cos(a-.16)*r,Math.sin(a-.16)*r,Math.cos(a)*outer,Math.sin(a)*outer-5,Math.cos(a+.17)*r,Math.sin(a+.17)*r],i%3===0?RED:INK);
   if(i%2===0)shape(g,[Math.cos(a)*outer,Math.sin(a)*outer-5,Math.cos(a+.1)*48,Math.sin(a+.1)*48,Math.cos(a-.04)*45,Math.sin(a-.04)*45],PAPER);
  }
  for(const side of [-1,1]){const p=this.part('leg',side,side*22,29);shape(p,[-7,0,7,0,12,12,-12,12],INK);}
  shape(g,[-47,-5,-35,-32,-8,-43,22,-36,42,-17,47,10,29,32,-7,39,-35,26],INK);
  shape(g,[-38,-4,-29,-24,-7,-33,17,-28,33,-11,37,9,23,26,-5,31,-29,21],SHADE);
  shape(g,[-29,-16,-6,-28,17,-23,26,-10,9,-15,-6,-10,-22,-7],RED);
  shape(g,[-14,6,8,-7,29,-5,41,6,43,20,24,31,1,29,-13,18],PAPER);
  eye(g,17,5,9);shape(g,[34,5,50,10,46,18,35,17],RED);
  g.moveTo(27,20).lineTo(37,22).stroke({color:INK,width:1.5});
  for(const [x,y] of [[-25,0],[-12,-18],[0,-24],[-23,15]])shape(g,[x-6,y+4,x,y-6,x+5,y+4],INK);
  fold(g,[-32,1,-18,7,-17,20]);
 }
 private rabbit(){
  for(const side of [-1,1]){
   const ear=this.part('ear',side,side*15,-30);
   shape(ear,[-10,8,-14,-24,-10,-55,-2,-65,9,-52,12,-19,8,7],INK);
   shape(ear,[-7,6,-10,-23,-7,-52,-1,-59,6,-49,8,-19,5,6],PAPER);
   shape(ear,[-3,-3,-6,-24,-2,-49,3,-41,4,-17],RED);
   if(side===-1){shape(ear,[-11,-44,-5,-39,-2,-46,4,-40,9,-48,9,-56,-10,-65],INK);shape(ear,[-7,-43,-3,-40,1,-44,5,-41,6,-46],SHADE);}
   const foot=this.part('leg',side,side*19,30);shape(foot,[-10,0,7,-3,12,9,6,14,-15,13],DARK);shape(foot,[-9,6,8,4,9,11,-12,11],PAPER);
  }
  const g=this.face;
  shape(g,[-24,7,-29,28,-18,43,14,45,30,32,23,7],DARK);shape(g,[-19,9,-22,26,-13,37,12,39,23,29,18,9],RED);
  shape(g,[-33,-17,-23,-37,0,-44,26,-35,37,-12,29,13,8,24,-18,19,-35,4],INK);
  shape(g,[-28,-16,-19,-32,0,-38,22,-30,30,-11,23,10,6,18,-15,13,-28,1],PAPER);
  shape(g,[-26,-16,-14,-23,-4,-11,-11,-3,-23,-7],RED);shape(g,[8,-13,19,-24,28,-15,22,-4,12,-3],RED);
  eye(g,-12,-8,8,INK);eye(g,15,-9,8,INK);g.circle(-12,-8,2.4).fill(GOLD);g.circle(15,-9,2.4).fill(GOLD);
  shape(g,[-4,0,4,-1,7,3,0,7,-5,4],RED);g.moveTo(0,7).lineTo(0,12).stroke({color:INK,width:1.5});
  shape(g,[-6,12,-1,12,-1,21,-5,21],CREAM);shape(g,[2,12,7,11,6,20,2,20],CREAM);
  g.moveTo(-24,2).lineTo(-38,-1).moveTo(-23,6).lineTo(-35,10).moveTo(26,0).lineTo(38,-5).stroke({color:INK,width:1.4});
  shape(g,[-8,25,7,25,7,37,-8,37],PAPER);g.moveTo(-5,28).lineTo(4,30).lineTo(-3,34).stroke({color:RED,width:1.3});
 }
}
