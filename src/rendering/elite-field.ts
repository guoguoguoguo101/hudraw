import {Container,Graphics,Text} from 'pixi.js';
import type {EliteField,FieldObject} from '../gameplay/elite-field';
import {ELITE_CATALOG,type EliteKind} from '../gameplay/elite-catalog';
const PAPER=0xf2e4c6,INK=0x253832,GOLD=0xd6b76c;
function colors(kind:EliteKind){const ch=ELITE_CATALOG[kind].chapter;return ch==='valley'?{main:0xb74836,dark:0x79313a,light:0xe0a45a}:ch==='sea'?{main:0x3c9690,dark:0x285d61,light:0x96c7b5}:ch==='palace'?{main:0x756386,dark:0x43425e,light:0xcab77e}:{main:0x8fa695,dark:0x435d55,light:0xd6e0ce};}
function diamond(g:Graphics,x:number,y:number,r:number,c:number){g.poly([x,y-r,x+r*.65,y,x,y+r,x-r*.65,y]).fill(c);}
function eyes(g:Graphics,x:number,y:number,size=1){for(const side of [-1,1]){g.ellipse(x+side*7*size,y,4*size,5*size).fill(PAPER);g.circle(x+side*6*size,y+1,2*size).fill(INK);}}
function path(g:Graphics,p:{x:number;y:number}[],color:number,width:number,alpha=1){if(p.length<2)return;g.poly(p.flatMap(p=>[p.x,p.y]),false).stroke({color,width,alpha,cap:'round',join:'round'});}
export class EliteFieldRenderer{
 root=new Container();ground=new Container();private back=new Graphics();private body=new Graphics();private fx=new Graphics();private mask=new Graphics();private backMask=new Graphics();private labels:Text[]=[];
 constructor(){this.ground.addChild(this.back,this.backMask);this.ground.mask=this.backMask;this.root.addChild(this.body,this.fx,this.mask);this.root.mask=this.mask;for(let i=0;i<12;i++){const t=new Text({text:'',style:{fontFamily:'KaiTi,STKaiti,serif',fontSize:20,fill:PAPER,stroke:{color:INK,width:3},align:'center'}});t.anchor.set(.5);this.root.addChild(t);this.labels.push(t);}}
 update(m:EliteField,enabled:boolean,low=false){
  this.root.visible=this.ground.visible=enabled;this.back.clear();this.body.clear();this.fx.clear();for(const t of this.labels)t.visible=false;if(!enabled)return;
  const b=m.bounds;for(const mask of [this.mask,this.backMask])mask.clear().rect(b.left,b.top,b.right-b.left,b.bottom-b.top).fill(0xffffff);
  for(const o of m.objects){const c=colors(o.kind),g=this.body,bg=this.back,active=o.age>=o.warn;
   if(!active){bg.circle(o.x,o.y,o.radius+13).stroke({color:GOLD,width:1.4,alpha:.6});if(Math.hypot(o.vx,o.vy)>1){const n=Math.hypot(o.vx,o.vy),dx=o.vx/n,dy=o.vy/n;bg.moveTo(o.x,o.y).lineTo(o.x+dx*90,o.y+dy*90).stroke({color:c.light,width:2,alpha:.55});bg.poly([o.x+dx*90,o.y+dy*90,o.x+dx*73-dy*7,o.y+dy*73+dx*7,o.x+dx*73+dy*7,o.y+dy*73-dx*7]).fill({color:c.light,alpha:.55});}}
   if(o.shape==='thread'||o.shape==='tentacle'||o.shape==='crack'){
    if(o.shape==='thread'){path(bg,o.nodes,o.kind==='puppet'?0xbd4a3b:c.main,4,.85);for(const p of o.nodes){diamond(g,p.x,p.y,12,GOLD);g.circle(p.x,p.y,4).fill(PAPER);}}
    else if(o.shape==='tentacle'){path(bg,o.nodes,c.dark,17,.9);path(bg,o.nodes,c.main,11);path(bg,o.nodes,PAPER,2,.65);for(let j=1;j<o.nodes.length;j++){const a=o.nodes[j-1],p=o.nodes[j];for(let k=1;k<4;k++){const x=a.x+(p.x-a.x)*k/4,y=a.y+(p.y-a.y)*k/4;g.circle(x,y,5).fill(c.light);}}}
    else{path(bg,o.nodes,c.dark,11,.55);path(bg,o.nodes,GOLD,3,.8);for(let j=1;j<o.nodes.length;j++)for(let k=0;k<4;k++){const key=(j-1)*4+k,a=o.nodes[j-1],p=o.nodes[j],x=a.x+(p.x-a.x)*(k+.5)/4,y=a.y+(p.y-a.y)*(k+.5)/4;diamond(g,x,y,o.marks.has(key)?7:4,o.marks.has(key)?PAPER:GOLD);if(o.marks.has(key))g.circle(x,y,11).stroke({color:PAPER,width:2,alpha:.6});}}
    continue;
   }
   if(o.shape==='ring'){for(let i=0;i<4;i++)if(!o.marks.has(i)){const a=i*Math.PI/2-Math.PI;bg.arc(o.x,o.y,o.radius,a+.04,a+Math.PI/2-.04).stroke({color:c.main,width:7,alpha:.35});bg.arc(o.x,o.y,o.radius,a+.04,a+Math.PI/2-.04).stroke({color:c.light,width:3,alpha:.95});const x=o.x+Math.cos(a)*o.radius,y=o.y+Math.sin(a)*o.radius;diamond(bg,x,y,6,GOLD);}continue;}
   if(o.shape==='mirror'){const n=550;bg.moveTo(o.x,o.y).lineTo(o.x+Math.cos(o.angle)*n,o.y+Math.sin(o.angle)*n).stroke({color:GOLD,width:1.4,alpha:.3});}
   if(o.shape==='claw'){bg.moveTo(o.origin.x,o.origin.y).lineTo(o.x,o.y).stroke({color:c.dark,width:22});bg.moveTo(o.origin.x,o.origin.y).lineTo(o.x,o.y).stroke({color:c.main,width:13});}
   if(o.history.length>1)path(bg,o.history,c.light,2,.3);
   if(o.friendly){g.circle(o.x,o.y,o.radius+7).stroke({color:GOLD,width:2.3,alpha:.8});const n=Math.hypot(o.vx,o.vy)||1,dx=o.vx/n,dy=o.vy/n;bg.moveTo(o.x-dx*30,o.y-dy*30).lineTo(o.x-dx*70,o.y-dy*70).stroke({color:PAPER,width:3,alpha:.6});}
   const bob=['lantern','snowLamp','moth','shuttle'].includes(o.shape)?Math.sin(o.age*4+o.index)*2:0;
   const rotation=o.shape==='parasol'?Math.sin(o.age*5)*.18:o.shape==='blade'?0:o.shape==='ray'?Math.atan2(o.vy,o.vx)+Math.PI/2:['stele','ice'].includes(o.shape)?Math.sin(o.age*4)*.1:['boat','lantern','snowLamp'].includes(o.shape)?Math.sin(o.age*3+o.index)*.12:o.shape==='mirror'?Math.sin(o.angle)*.2:0;
   const flip=o.shape==='deer'&&o.vx<0?-1:1,tilt=o.shape==='deer'&&o.stage===1&&o.index===0?-.24:rotation;
   g.save().transform(Math.cos(tilt)*flip,Math.sin(tilt)*flip,-Math.sin(tilt),Math.cos(tilt),o.x,o.y+bob);this.object(g,o);g.restore();
  }
  let label=0;
  for(const [i,f] of m.effects.entries()){
   const g=this.fx,c=colors(f.kind),t=Math.min(1,f.age/f.life),a=1-t;
   if(f.style==='fog'){this.back.ellipse(f.x,f.y,f.radius,f.radius*.66).fill({color:c.light,alpha:.16*a});if(!low)for(let j=0;j<4;j++){const q=f.age+j*1.57,x=f.x+Math.cos(q)*f.radius*.6,y=f.y+Math.sin(q)*f.radius*.4;diamond(this.back,x,y,3,PAPER);}continue;}
   if(f.style==='ice'){this.back.ellipse(f.x,f.y,f.radius,f.radius*.4).fill({color:c.light,alpha:.4*a}).stroke({color:PAPER,width:1,alpha:.7*a});this.back.moveTo(f.x-20,f.y).lineTo(f.x+20,f.y).moveTo(f.x,f.y-12).lineTo(f.x,f.y+12).stroke({color:PAPER,width:2,alpha:a});continue;}
   if(f.style==='beam'||f.style==='recoil'){path(g,f.nodes,c.main,f.style==='beam'?10:6,a*.45);path(g,f.nodes,PAPER,f.style==='beam'?3:2,a*.9);if(f.style==='recoil')for(const p of f.nodes)diamond(g,p.x,p.y,8*(1-t),GOLD);}
   else if(f.style==='stamp'){g.roundRect(f.x-f.radius*t,f.y-f.radius*t*.5,f.radius*t*2,f.radius*t,4).stroke({color:c.main,width:5,alpha:a});diamond(g,f.x,f.y,f.radius*.35,PAPER);}
   else if(f.style==='cut'){const r=f.radius;g.moveTo(f.x-r*(1-t),f.y+r*(1-t)*.4).lineTo(f.x+r*t,f.y-r*t*.4).stroke({color:PAPER,width:4*(1-t)+1,alpha:a});}
   else{const r=f.radius*(.35+t*.8);g.ellipse(f.x,f.y,r,r*.62).stroke({color:f.style==='wave'?c.light:GOLD,width:3*(1-t)+1,alpha:a*.8});for(let j=0;j<(low?3:6);j++){const q=j*2.399+i,x=f.x+Math.cos(q)*r,y=f.y+Math.sin(q)*r*.7;diamond(g,x,y,7*(1-t),j%2?c.main:PAPER);}}
   if(f.text&&label<this.labels.length&&f.age<.7){const text=this.labels[label++];text.visible=true;text.text=f.text;text.position.set(f.x,f.y-30-f.age*35);text.alpha=Math.min(1,a*2);}
  }
 }
 private object(g:Graphics,o:FieldObject){
  const c=colors(o.kind),r=o.radius;
  switch(o.shape){
   case 'parasol':g.moveTo(-r,-2).quadraticCurveTo(0,-r*1.25,r,-2).quadraticCurveTo(0,8,-r,-2).fill(c.main).stroke({color:GOLD,width:2});for(const side of [-1,1])g.moveTo(0,-r*.9).lineTo(side*r*.6,1).stroke({color:c.light,width:1.5});g.moveTo(0,3).lineTo(0,23).quadraticCurveTo(10,30,12,19).stroke({color:PAPER,width:3});diamond(g,0,-15,5,PAPER);break;
   case 'lantern':case 'snowLamp':g.roundRect(-17,-22,34,43,10).fill(c.main).stroke({color:GOLD,width:2});g.moveTo(-10,-22).quadraticCurveTo(0,-35,10,-22).stroke({color:c.dark,width:3});g.rect(-18,-22,36,5).fill(c.dark);eyes(g,0,-3,.8);g.moveTo(0,22).lineTo(0,34).stroke({color:GOLD,width:3});diamond(g,0,13,6,PAPER);break;
   case 'stele':g.poly([-23,29,-24,-22,-13,-34,15,-32,25,-19,24,29]).fill(c.dark).stroke({color:GOLD,width:2});g.moveTo(-5,-23).lineTo(6,-9).lineTo(-3,1).lineTo(11,21).stroke({color:c.light,width:3});diamond(g,0,-9,7,GOLD);break;
   case 'moth':for(const side of [-1,1]){g.poly([0,0,side*21,-17+Math.sin(o.age*13)*9,side*18,8+Math.sin(o.age*13)*5,side*4,14]).fill(c.main);g.circle(side*12,-4,5).fill(c.light);g.circle(side*12,-4,2).fill(INK);}g.ellipse(0,0,4,14).fill(PAPER);break;
   case 'claw':{
    const flip=o.index? -1:1;g.save().transform(flip,0,0,1,0,0);g.moveTo(-33,18).lineTo(-38,-8).lineTo(-15,-40).quadraticCurveTo(13,-53,28,-36).lineTo(2,-12).lineTo(33,-18).quadraticCurveTo(45,10,22,33).lineTo(-7,37).closePath().fill(c.main).stroke({color:c.dark,width:3});g.poly([-8,-26,0,-13,-15,-4,-2,2,-15,16,-25,3,-28,-8]).fill(PAPER);diamond(g,-8,18,9,GOLD);g.restore();break;}
   case 'pearl':g.circle(0,0,20).fill(PAPER).stroke({color:c.main,width:3});g.circle(-6,-6,6).fill(0xfff5db);g.arc(0,0,26,o.age*2,o.age*2+2).stroke({color:GOLD,width:1.5});break;
   case 'boat':g.poly([-29,9,31,9,21,27,-17,27]).fill(0x685742).stroke({color:INK,width:2});g.moveTo(0,8).lineTo(0,-35).stroke({color:GOLD,width:3});g.poly([3+Math.sin(o.age*5)*5,-35,24+Math.sin(o.age*5)*5,-23,20,3,3,-2]).fill(c.main).stroke({color:PAPER,width:1});g.moveTo(7,-21).lineTo(21,-17).moveTo(7,-10).lineTo(20,-8).stroke({color:c.light,width:2});break;
   case 'ray':g.poly([0,-20,24,-11,40,-28+Math.sin(o.age*7+o.index)*12,29,15,0,25,-29,15,-40,-28+Math.sin(o.age*7+o.index)*12,-24,-11]).fill(o.index?c.main:PAPER).stroke({color:c.dark,width:2});eyes(g,0,0);g.moveTo(0,24).quadraticCurveTo(17+Math.sin(o.age*5)*10,39,7,54).stroke({color:GOLD,width:2});break;
   case 'mirror':g.ellipse(0,0,23,29).fill(c.dark).stroke({color:GOLD,width:4});g.ellipse(0,0,16,21).fill(c.light);g.moveTo(-9,-10).lineTo(9,9).stroke({color:PAPER,width:3});diamond(g,0,-33,5,GOLD);break;
   case 'shuttle':g.poly([-28,0,0,-15,28,0,0,15]).fill(c.main).stroke({color:GOLD,width:2});g.moveTo(-10,-7).lineTo(3,9).moveTo(-3,-10).lineTo(10,6).stroke({color:PAPER,width:2});break;
   case 'stamp':{const lift=o.stage?0:Math.max(0,1-o.age/o.warn)*17;g.roundRect(-r,-r*.7-lift,r*2,r*1.3,5).fill(c.main).stroke({color:GOLD,width:3});g.rect(-r+8,-r*.7+8-lift,r*2-16,r*1.3-16).stroke({color:PAPER,width:2});diamond(g,0,-lift,r*.34,GOLD);break;}
   case 'blade':g.save().transform(Math.cos(o.angle),Math.sin(o.angle),-Math.sin(o.angle),Math.cos(o.angle),0,0);g.moveTo(-28,-22).quadraticCurveTo(44,-26,18,29).quadraticCurveTo(22,-6,-28,-22).fill(PAPER).stroke({color:GOLD,width:2});g.restore();break;
   case 'ice':g.poly([-r,-r*.25,-r*.45,-r,r*.5,-r*.83,r,r*.1,r*.4,r,-r*.7,r*.7]).fill(c.main).stroke({color:PAPER,width:2});g.moveTo(-7,-16).lineTo(5,1).lineTo(-3,16).stroke({color:c.dark,width:3});break;
   case 'snowball':g.circle(0,0,r).fill(PAPER).stroke({color:c.main,width:3});g.ellipse(-r*.2,-r*.3,r*.4,r*.2).fill(0xfff8e4);g.arc(0,0,r*.7,o.age*2,o.age*2+2).stroke({color:c.light,width:3});break;
   case 'deer':g.ellipse(0,6,30,17).fill(o.index?c.main:PAPER);g.ellipse(20,-10,14,19).fill(o.index?c.main:PAPER);for(const side of [-1,1]){g.moveTo(side*15,17).lineTo(side*20+Math.sin(o.age*10+side)*10*(o.stage===1&&o.index===0?0:1),37).stroke({color:c.dark,width:5});g.moveTo(20+side*7,-23).lineTo(20+side*14,-41).lineTo(20+side*11,-50).moveTo(20+side*12,-37).lineTo(20+side*23,-42).stroke({color:GOLD,width:3});}g.circle(23,-12,3).fill(INK);break;
   case 'flower':for(let i=0;i<5;i++){const a=i*Math.PI*.4;g.ellipse(Math.cos(a)*8,Math.sin(a)*8,7,6).fill(c.light);}g.circle(0,0,5).fill(GOLD);break;
  }
 }
}
