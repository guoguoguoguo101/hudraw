import {Container,Graphics} from 'pixi.js';
import type {Enemy,EnemyLook} from '../core/types';
/** Frontline art direction: thick cut paper, warm edge light and a shared ink contour.
 * All contours are static and atlas-friendly; animation only moves articulated pieces. */
const C={ink:0x253a38,edge:0xffe8ba,paper:0xf6dfae,shade:0xc39a66,red:0xb74432,light:0xe57b4c,wine:0x71372f,jade:0x638b75,teal:0x345f59,blue:0x526c87,snow:0xe9e4cf};
type Limb={node:Container;role:'wing'|'foot'|'ear'|'ribbon'|'tail';side:number;x:number;y:number};
function plate(g:Graphics,path:(g:Graphics)=>Graphics,color:number){
 g.save().translateTransform(1.5,4);path(g).fill(C.ink).stroke({color:C.ink,width:4,join:'round'});g.restore();
 path(g).fill(color).stroke({color:C.ink,width:2.6,join:'round'});
}
function seam(g:Graphics,points:number[],color=C.edge,alpha=.65,width=1.1){g.poly(points,false).stroke({color,width,alpha,cap:'round',join:'round'});}
function eye(g:Container,x:number,y:number,size=8){
 const e=new Graphics();e.position.set(x,y);g.addChild(e);e.ellipse(0,1,size+2,size*.87+2).fill(C.ink).ellipse(0,0,size,size*.87).fill(C.edge);
 e.ellipse(1,0,Math.max(2,size*.3),size*.62).fill(C.ink).circle(2,-2,1.8).fill(0xffffff);
}
function charm(g:Graphics,x:number,y:number,s=1){
 g.save().translateTransform(x,y).scaleTransform(s,s);g.poly([-7,-11,7,-11,8,9,3,14,-7,11]).fill(C.wine).stroke({color:C.ink,width:2});g.poly([-6,-12,6,-12,7,8,2,12,-6,10]).fill(C.paper);seam(g,[-3,-6,3,-6,-2,0,3,1,-2,7],C.red,.95,1.5);g.restore();
}
export class FrontlineMonsterRig{
 root=new Container();body=new Container();private shadow=new Graphics();private face=new Graphics();private eyes=new Container();private limbs:Limb[]=[];
 constructor(public look:EnemyLook){
  this.root.addChild(this.shadow,this.body);const flying=['paper-moth','sea-fish','sea-jelly','star-ray','star-kite','snow-owl'].includes(look);
  this.shadow.ellipse(0,48,39,9).fill({color:C.ink,alpha:.09}).ellipse(0,48,29,6).fill({color:C.ink,alpha:.19}).ellipse(0,48,18,3).fill({color:C.ink,alpha:.12});
  if(look==='paper-lantern')this.lantern();else if(look==='paper-umbrella')this.umbrella();else if(look==='paper-frog')this.frog();else if(look==='paper-moth')this.moth();else if(look==='paper-rabbit'||look==='snow-marten')this.rabbit(look==='snow-marten');else if(look==='paper-spines'||look==='snow-shell')this.shell(look==='snow-shell');else if(look==='sea-fish')this.fish();else if(look==='sea-jelly')this.jelly();else if(look==='sea-crab')this.crab();else if(look==='star-bell')this.bell();else this.bird(look==='snow-owl',look==='star-ray');
  this.body.addChild(this.eyes);this.shadow.alpha=flying?.65:1;
 }
 private limb(role:Limb['role'],side:number,x:number,y:number,draw:(g:Graphics)=>void){const node=new Container(),g=new Graphics();node.position.set(x,y);node.addChild(g);this.body.addChild(node);draw(g);this.limbs.push({node,role,side,x,y});return node;}
 private main(){this.body.addChild(this.face);return this.face;}
 private feet(color=C.red){for(const side of [-1,1])this.limb('foot',side,side*22,32,g=>{plate(g,p=>p.roundRect(-13,-3,28,16,7),color);seam(g,[-8,4,8,4]);});}
 update(e:Enemy){
  const t=e.age+e.id*.37,ready=e.ai==='Telegraph'?Math.min(1,e.stateAge/.5):0,attack=e.ai==='Attack'?1:0,hit=e.hit>0?Math.sin(Math.min(1,e.hit/.23)*Math.PI):0;
  const flying=['paper-moth','sea-fish','sea-jelly','star-ray','star-kite','snow-owl'].includes(this.look),hop=flying?Math.sin(t*3)*4:Math.max(0,Math.sin(t*6))*4;
  this.body.position.set(hit*(e.id%2?1:-1)*4,-hop-ready*3+attack*3);this.body.rotation=Math.sin(t*2)*.025+hit*.11*(e.id%2?1:-1);
  this.body.scale.set(1+Math.sin(t*3)*.014+ready*.08+hit*.12-attack*.06,1-Math.sin(t*3)*.012-ready*.09-hit*.1+attack*.08);
  this.body.tint=e.hit>.16?0xffd9aa:0xffffff;
  const blink=t%4.7;for(const eye of this.eyes.children)eye.scale.y=blink>4.55?.18:1;
  for(const l of this.limbs){const wave=Math.sin(t*(l.role==='wing'?10:5)+l.side*.8);l.node.y=l.y;
   if(l.role==='wing'){l.node.scale.x=1+wave*.09;l.node.rotation=l.side*(wave*.12+ready*.17-attack*.2);}
   else if(l.role==='foot'){l.node.y+=wave*2.5;l.node.rotation=l.side*(wave*.09-ready*.13);}
   else if(l.role==='ear')l.node.rotation=l.side*(Math.sin(t*3+l.side)*.07+ready*.13+hit*.2);
   else l.node.rotation=Math.sin(t*4+l.side)*.12+ready*l.side*.1;
  }
  this.shadow.scale.set(1-hop*.008,1-hop*.012);
 }
 private frog(){
  this.feet(C.teal);for(const s of [-1,1])this.limb('foot',s,s*34,13,g=>{plate(g,p=>p.ellipse(0,0,17,24),C.teal);g.ellipse(-3,-5,9,14).fill(C.jade);});
  const g=this.main();plate(g,p=>p.moveTo(-38,4).bezierCurveTo(-47,-16,-38,-39,-23,-43).quadraticCurveTo(-13,-50,-2,-36).quadraticCurveTo(12,-49,29,-41).bezierCurveTo(50,-29,43,8,32,26).quadraticCurveTo(0,48,-32,26).closePath(),C.jade);
  g.moveTo(10,-36).bezierCurveTo(44,-26,39,12,23,26).quadraticCurveTo(2,35,-8,27).quadraticCurveTo(29,9,10,-36).fill({color:C.teal,alpha:.65});
  g.ellipse(-8,20,28,19).fill(C.paper);g.ellipse(-14,15,16,8).fill({color:C.edge,alpha:.55});
  g.moveTo(-32,-8).quadraticCurveTo(-21,-22,-8,-18).moveTo(9,-20).quadraticCurveTo(25,-25,34,-12).stroke({color:C.edge,width:2.4,alpha:.6});
  eye(this.eyes,-23,-28,10);eye(this.eyes,22,-28,10);g.moveTo(-19,1).quadraticCurveTo(0,14,23,0).stroke({color:C.ink,width:2.6});for(const s of [-1,1])g.ellipse(s*29,-1,7,3).fill({color:C.red,alpha:.65});charm(g,0,18,.8);
 }
 private lantern(){
  this.feet(C.wine);for(const s of [-1,1])this.limb('ribbon',s,s*39,10,g=>{plate(g,p=>p.poly([-3,0,4,0,7,31,0,27,-5,35]),C.shade);seam(g,[0,3,2,25]);});
  const g=this.main();g.moveTo(-14,-47).bezierCurveTo(-22,-72,18,-77,17,-49).stroke({color:C.ink,width:6});g.moveTo(-12,-50).bezierCurveTo(-14,-67,12,-68,13,-50).stroke({color:C.shade,width:2});
  plate(g,p=>p.roundRect(-45,-41,90,80,29),C.red);g.roundRect(-32,-35,40,65,19).fill({color:C.light,alpha:.7});g.moveTo(18,-38).quadraticCurveTo(55,0,24,34).lineTo(36,32).quadraticCurveTo(55,-2,34,-34).closePath().fill(C.wine);
  for(const x of [-25,0,25])g.moveTo(x,-35).quadraticCurveTo(x*1.25,0,x,31).stroke({color:C.wine,width:2,alpha:.65});
  for(const y of [-25,23])g.moveTo(-38,y).quadraticCurveTo(0,y+6,38,y).stroke({color:C.shade,width:2});
  plate(g,p=>p.roundRect(-29,-49,58,12,4),C.shade);seam(g,[-23,-46,23,-46]);plate(g,p=>p.roundRect(-29,32,58,10,3),C.wine);seam(g,[-22,35,22,35]);
  eye(this.eyes,-17,-9,10);eye(this.eyes,17,-9,10);g.moveTo(-18,9).quadraticCurveTo(0,28,20,8).quadraticCurveTo(0,13,-18,9).fill(C.ink);g.poly([-12,12,-5,14,-8,21]).fill(C.edge);charm(g,0,-31,.65);
 }
 private umbrella(){
  this.limb('foot',1,0,17,g=>{plate(g,p=>p.moveTo(-4,0).lineTo(4,0).lineTo(4,25).quadraticCurveTo(24,38,27,25).quadraticCurveTo(36,43,14,44).lineTo(-7,30).closePath(),C.shade);seam(g,[-1,3,-1,25,15,36]);});
  const g=this.main();plate(g,p=>p.moveTo(0,-64).bezierCurveTo(-22,-51,-48,-24,-59,6).quadraticCurveTo(-46,16,-29,8).quadraticCurveTo(-11,20,2,10).quadraticCurveTo(20,22,32,10).quadraticCurveTo(48,19,60,8).quadraticCurveTo(44,-28,0,-64).closePath(),C.red);
  g.moveTo(0,-61).quadraticCurveTo(-25,-31,-29,8).quadraticCurveTo(-13,18,2,10).quadraticCurveTo(3,-26,0,-61).fill(C.light);g.moveTo(0,-61).quadraticCurveTo(28,-32,32,10).quadraticCurveTo(48,18,60,8).quadraticCurveTo(43,-27,0,-61).fill(C.wine);
  for(const x of [-55,-29,2,32,56])g.moveTo(0,-60).quadraticCurveTo(x*.6,-23,x,7).stroke({color:C.edge,width:1,alpha:.65});
  g.ellipse(1,-8,20,23).fill(C.ink);eye(this.eyes,1,-8,15);g.ellipse(2,-8,4,10).fill(C.red);g.moveTo(-4,18).quadraticCurveTo(-12,39,3,38).quadraticCurveTo(13,39,6,19).fill(C.light);seam(g,[1,23,1,34],C.red);charm(g,38,-6,.5);
 }
 private moth(){
  for(const s of [-1,1])this.limb('wing',s,s*7,-7,g=>{g.scale.x=s;plate(g,p=>p.moveTo(0,0).bezierCurveTo(10,-38,43,-59,59,-47).quadraticCurveTo(70,-30,39,2).quadraticCurveTo(67,14,49,35).quadraticCurveTo(28,46,0,14).closePath(),C.wine);
   g.moveTo(9,-1).bezierCurveTo(21,-31,47,-49,54,-42).quadraticCurveTo(58,-27,32,1).quadraticCurveTo(55,17,42,28).quadraticCurveTo(26,35,9,-1).fill(C.paper);
   g.moveTo(15,-4).quadraticCurveTo(27,-28,43,-32).quadraticCurveTo(44,-14,25,4).quadraticCurveTo(45,16,34,22).quadraticCurveTo(20,23,15,-4).fill(C.red);g.ellipse(39,-26,9,11).fill(C.ink).ellipse(38,-28,5,6).fill(C.shade);seam(g,[10,0,31,-13,52,-40]);});
  const g=this.main();plate(g,p=>p.ellipse(0,-2,12,35),C.teal);g.ellipse(-3,-9,4,22).fill(C.jade);for(const s of [-1,1])g.moveTo(s*5,-25).quadraticCurveTo(s*24,-54,s*14,-47).stroke({color:C.shade,width:2.5});eye(this.eyes,-6,-21,5);eye(this.eyes,6,-21,5);charm(g,0,7,.65);
 }
 private rabbit(snow:boolean){
  const col=snow?C.snow:C.paper;this.feet(snow?C.blue:C.wine);
  if(snow)this.limb('tail',1,24,17,g=>{plate(g,p=>p.moveTo(-5,5).bezierCurveTo(54,33,62,-22,35,-35).quadraticCurveTo(44,-4,18,-8).closePath(),col);g.moveTo(22,-7).quadraticCurveTo(46,-7,40,-24).stroke({color:C.shade,width:2});});
  for(const s of [-1,1])this.limb('ear',s,s*18,-29,g=>{plate(g,p=>snow?p.poly([-12,7,-14,-21,0,-30,14,-16,11,7]):p.roundRect(-10,-49,21,59,10),col);g.roundRect(-4,snow?-18:-41,8,snow?20:40,4).fill(snow?C.blue:C.red);});
  const g=this.main();plate(g,p=>p.ellipse(0,23,29,27),snow?C.blue:C.red);g.ellipse(-6,22,15,19).fill(snow?C.snow:C.light);
  plate(g,p=>p.moveTo(-34,-18).quadraticCurveTo(-25,-40,0,-39).quadraticCurveTo(30,-41,37,-14).quadraticCurveTo(43,15,12,23).quadraticCurveTo(-22,30,-36,6).closePath(),col);
  g.moveTo(15,-35).quadraticCurveTo(44,-13,26,12).lineTo(7,20).quadraticCurveTo(26,-7,15,-35).fill({color:snow?C.blue:C.shade,alpha:.5});
  for(const s of [-1,1])g.ellipse(s*17,-7,12,15).fill(snow?C.teal:C.red);eye(this.eyes,-16,-8,7);eye(this.eyes,18,-8,7);g.poly([-4,4,4,4,0,10]).fill(C.wine);g.moveTo(0,10).lineTo(0,14).stroke({color:C.ink,width:1.5});for(const s of [-1,1])seam(g,[s*23,5,s*39,2],C.ink,.6);charm(g,0,31,.8);
 }
 private shell(snow:boolean){
  this.feet(snow?C.blue:C.wine);const g=this.main(),col=snow?C.blue:C.shade;
  for(let i=0;i<9;i++){const a=Math.PI+i*Math.PI/8,x=Math.cos(a)*40,y=Math.sin(a)*36;plate(g,p=>p.poly([x-10,y+7,x+Math.cos(a)*21,y+Math.sin(a)*25-4,x+10,y+6]),i%2?col:C.teal);seam(g,[x-3,y,x+Math.cos(a)*16,y+Math.sin(a)*19],C.edge,.6);}
  plate(g,p=>p.ellipse(0,1,44,37),col);g.ellipse(-9,-9,25,19).fill({color:snow?C.snow:C.paper,alpha:.4});g.moveTo(22,-25).quadraticCurveTo(59,6,25,32).lineTo(0,35).quadraticCurveTo(37,7,22,-25).fill({color:C.ink,alpha:.24});
  for(const x of [-21,0,21]){g.poly([x,-25,x+12,-7,x,7,x-11,-7]).fill(snow?C.teal:C.wine);seam(g,[x-7,-7,x,-20,x+7,-7]);}
  plate(g,p=>p.ellipse(14,20,30,21),snow?C.snow:C.paper);eye(this.eyes,21,13,8);g.ellipse(38,22,8,5).fill(C.red);charm(g,-17,17,.75);
 }
 private fish(){
  this.limb('tail',-1,-28,0,g=>{plate(g,p=>p.moveTo(0,0).lineTo(-31,-30).quadraticCurveTo(-49,-29,-38,-5).quadraticCurveTo(-56,19,-32,25).closePath(),C.red);seam(g,[-35,-20,-8,0,-36,17]);});
  this.limb('wing',1,1,17,g=>{plate(g,p=>p.poly([-12,-5,17,-2,21,23,-5,14]),C.teal);seam(g,[-7,0,14,13]);});
  const g=this.main();plate(g,p=>p.moveTo(-34,-5).bezierCurveTo(-16,-42,28,-35,49,-4).quadraticCurveTo(58,18,23,29).quadraticCurveTo(-19,38,-34,-5).closePath(),C.red);
  g.moveTo(-28,-6).quadraticCurveTo(-8,-38,25,-26).quadraticCurveTo(1,-24,4,6).closePath().fill(C.light);g.moveTo(-24,8).quadraticCurveTo(8,19,46,4).quadraticCurveTo(39,27,12,29).quadraticCurveTo(-11,30,-24,8).fill(C.paper);
  for(let i=0;i<3;i++)g.moveTo(-13+i*12,-15).quadraticCurveTo(-23+i*12,-5,-12+i*12,3).stroke({color:C.edge,width:2,alpha:.8});eye(this.eyes,30,-5,9);charm(g,4,-9,.65);
 }
 private jelly(){
  for(let i=-1;i<=1;i++)this.limb('ribbon',i,i*22,11,g=>{plate(g,p=>p.moveTo(-5,0).quadraticCurveTo(15,18,2,32).quadraticCurveTo(-7,42,10,44).lineTo(7,52).quadraticCurveTo(-21,45,-8,27).quadraticCurveTo(4,15,-5,0).closePath(),i?C.paper:C.red);seam(g,[0,5,5,18,-2,31]);});
  const g=this.main();plate(g,p=>p.moveTo(-44,7).bezierCurveTo(-42,-56,37,-63,45,7).quadraticCurveTo(30,18,18,11).quadraticCurveTo(0,22,-17,12).quadraticCurveTo(-34,20,-44,7).closePath(),C.teal);
  g.moveTo(-36,2).quadraticCurveTo(-33,-43,4,-42).quadraticCurveTo(-13,-26,-13,7).closePath().fill(C.jade);g.moveTo(3,-43).quadraticCurveTo(37,-35,39,3).lineTo(27,8).quadraticCurveTo(20,-23,3,-43).fill(C.paper);seam(g,[-34,-4,-25,-25,-10,-33],C.edge,.7,2);eye(this.eyes,-12,0,7);eye(this.eyes,12,0,7);charm(g,0,-24,.7);
 }
 private crab(){
  for(const s of [-1,1]){for(let i=0;i<3;i++)this.limb('foot',s,s*28,12+i*8,g=>{plate(g,p=>p.poly([0,0,s*23,-5,s*34,7,s*17,5,s*2,8]),C.teal);});
   this.limb('wing',s,s*32,-5,g=>{plate(g,p=>p.moveTo(0,12).lineTo(s*11,-7).quadraticCurveTo(s*4,-28,s*20,-38).lineTo(s*22,-15).lineTo(s*35,-32).quadraticCurveTo(s*47,-10,s*28,5).lineTo(s*9,22).closePath(),C.red);seam(g,[s*11,4,s*26,-7,s*35,-21]);});}
  const g=this.main();plate(g,p=>p.moveTo(-37,-11).quadraticCurveTo(-30,-39,0,-33).quadraticCurveTo(33,-39,40,-9).quadraticCurveTo(44,25,2,32).quadraticCurveTo(-39,29,-37,-11).closePath(),C.red);
  g.ellipse(-10,-12,22,15).fill(C.light);g.moveTo(10,-29).quadraticCurveTo(42,-10,25,21).lineTo(4,29).quadraticCurveTo(28,1,10,-29).fill(C.wine);g.moveTo(-28,12).quadraticCurveTo(0,27,30,11).quadraticCurveTo(20,33,-10,28).closePath().fill(C.paper);eye(this.eyes,-13,-1,7);eye(this.eyes,14,-1,7);charm(g,0,-22,.8);
 }
 private bell(){
  this.limb('ribbon',1,0,25,g=>{plate(g,p=>p.poly([-6,0,6,0,15,33,0,26,-11,34]),C.red);seam(g,[0,4,2,26]);});const g=this.main();g.circle(0,-47,10).stroke({color:C.ink,width:5}).circle(0,-47,10).stroke({color:C.shade,width:2});
  plate(g,p=>p.moveTo(-20,-35).lineTo(20,-35).quadraticCurveTo(23,-2,37,21).quadraticCurveTo(0,41,-37,21).quadraticCurveTo(-23,-3,-20,-35).closePath(),C.blue);g.moveTo(-16,-32).lineTo(-2,-32).quadraticCurveTo(-16,3,-22,19).lineTo(-32,20).closePath().fill(C.jade);g.moveTo(9,-31).quadraticCurveTo(20,0,25,23).lineTo(36,21).quadraticCurveTo(22,-2,20,-34).closePath().fill(C.teal);
  g.roundRect(-23,-36,46,9,3).fill(C.shade).stroke({color:C.ink,width:1.5});g.ellipse(0,23,32,10).fill(C.ink).stroke({color:C.shade,width:3});eye(this.eyes,-12,0,7);eye(this.eyes,12,0,7);charm(g,0,-19,.7);
 }
 private bird(snow:boolean,ray:boolean){
  const col=snow?C.snow:C.blue;for(const s of [-1,1])this.limb('wing',s,s*15,-4,g=>{g.scale.x=s;plate(g,p=>p.moveTo(-2,-8).quadraticCurveTo(22,-35,60,-39).lineTo(47,-16).lineTo(60,-19).lineTo(43,4).lineTo(51,1).quadraticCurveTo(31,27,2,18).closePath(),col);g.moveTo(6,-7).quadraticCurveTo(29,-28,48,-30).lineTo(34,-10).lineTo(44,-13).lineTo(25,10).lineTo(5,13).closePath().fill(snow?C.blue:C.paper);seam(g,[7,7,30,-8,47,-27]);});
  this.limb('tail',1,0,23,g=>{plate(g,p=>p.poly([-8,0,8,0,21,38,1,29,-17,39]),snow?C.shade:C.red);seam(g,[0,2,3,25]);});
  const g=this.main();plate(g,p=>p.moveTo(-23,-23).lineTo(-20,-44).lineTo(-5,-32).quadraticCurveTo(0,-36,8,-32).lineTo(23,-45).lineTo(26,-21).quadraticCurveTo(39,9,17,29).quadraticCurveTo(-1,42,-23,22).quadraticCurveTo(-34,7,-23,-23).closePath(),col);
  g.moveTo(12,-27).quadraticCurveTo(38,-4,15,28).lineTo(-2,33).quadraticCurveTo(18,4,12,-27).fill({color:C.teal,alpha:.55});
  if(!ray){for(const s of [-1,1])g.ellipse(s*13,-4,14,17).fill(snow?C.teal:C.wine);}
  eye(this.eyes,-12,-5,8);eye(this.eyes,13,-5,8);g.poly([-4,7,5,7,0,15]).fill(C.shade);charm(g,0,23,.7);
 }
}
