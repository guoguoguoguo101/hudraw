import {Container,Graphics} from 'pixi.js';
import {atPath,pathLength,type Hualing,type SpiritCard,type SpiritEffect} from '../gameplay/hualing';
import type {Point} from '../input/recognizer';
import {drawPaperTiger,PaperTigerRenderer} from './paper-tiger';
import {SceneSealRenderer} from './scene-seal';
const RED=0xbe392b,LIGHT=0xe65a3b,DARK=0x71232a,GOLD=0xe7ba68,PAPER=0xffedcb,INK=0x20272a,JADE=0xa8cbbb;
function local(g:Graphics,x:number,y:number,angle=0,sx=1,sy=sx){return g.save().transform(Math.cos(angle)*sx,Math.sin(angle)*sx,-Math.sin(angle)*sy,Math.cos(angle)*sy,x,y);}
function simplify(points:Point[],epsilon=9):Point[]{if(points.length<=2)return points;const a=points[0],b=points.at(-1)!,dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy;let max=0,index=0;for(let i=1;i<points.length-1;i++){const p=points[i],t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/n)):0,d=Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);if(d>max){max=d;index=i;}}return max>epsilon?[...simplify(points.slice(0,index+1),epsilon).slice(0,-1),...simplify(points.slice(index),epsilon)]:[a,b];}
function stroke(g:Graphics,points:Point[],color:number,width:number,alpha=1){if(!points.length)return;g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);g.stroke({color,width,alpha,cap:'round',join:'round'});}
function shard(g:Graphics,x:number,y:number,size:number,angle:number,color:number,alpha=1){local(g,x,y,angle).poly([-size,0,0,-size*.5,size,0,0,size*.8]).fill({color,alpha}).restore();}
export function spiritIcon(g:Graphics,kind:SpiritCard){
 g.clear();if(kind==='tiger'){drawPaperTiger(g);return;}
 if(kind==='crane'){drawCrane(g,0);return;}
 if(kind==='mountain'){g.poly([-60,25,-35,-22,-10,10,14,-48,39,0,58,-20,70,25]).fill(RED).stroke({color:GOLD,width:2});g.poly([14,-48,7,10,39,0]).fill(PAPER);return;}
 if(kind==='rift'){g.poly([-45,32,-17,0,5,0,27,-43,44,-37,16,4,18,13,-32,43]).fill(RED).stroke({color:PAPER,width:4});return;}
 drawDragonHead(g);
}
function drawDragonHead(g:Graphics){
 // One flat cut-paper system, shared palette and hard-edged negative spaces with the body.
 g.poly([-52,-18,-38,-37,-20,-43,3,-30,21,-17,48,-15,61,-3,50,13,27,17,10,34,-20,28,-43,35,-33,14,-52,16]).fill(DARK).stroke({color:GOLD,width:1.5});
 g.poly([-50,-15,-33,-35,-18,-37,2,-25,22,-10,48,-10,55,-2,46,7,19,9,3,25,-20,20,-39,29,-28,8,-50,12]).fill(RED);
 g.poly([-29,-31,-50,-50,-63,-50,-52,-58,-62,-72,-42,-59,-37,-44,-24,-40,-36,-65,-26,-57,-17,-36]).fill(PAPER);
 g.poly([-30,0,-51,-6,-66,4,-53,9,-64,20,-47,20,-54,36,-34,26,-34,40,-18,25,-3,18,-18,12]).fill(PAPER);
 g.poly([-31,-24,-12,-30,3,-20,-12,-15,-26,-9]).fill(LIGHT);
 g.poly([-6,-24,13,-16,26,-15,14,-8,2,-10]).fill(PAPER);
 g.poly([1,-16,18,-12,11,-5,2,-7]).fill(INK);g.poly([9,-11,15,-10,10,-7]).fill(GOLD);
 g.poly([27,-9,46,-11,59,-2,49,4,34,0,18,6,5,1,15,-3]).fill(PAPER);
 g.poly([49,-6,58,-2,51,2,46,-1]).fill(DARK);
 g.poly([13,12,28,8,46,10,33,23,8,29,-3,21]).fill(DARK);
 g.poly([19,11,25,10,19,22]).fill(PAPER);g.poly([32,11,39,11,33,20]).fill(PAPER);
 g.poly([7,23,18,25,28,20,23,31,9,34,-2,27]).fill(RED);
 // Cheek cloud cutout, gold creases and long continuous whiskers.
 g.moveTo(-27,-9).bezierCurveTo(-16,-18,-7,-8,-16,-3).bezierCurveTo(-23,2,-14,9,-6,2).stroke({color:GOLD,width:2});
 g.moveTo(39,4).bezierCurveTo(64,7,79,27,65,32).bezierCurveTo(57,35,53,28,60,25).moveTo(35,-4).bezierCurveTo(64,-27,79,-34,77,-47).stroke({color:GOLD,width:1.7});
 g.moveTo(-42,-18).lineTo(-31,-26).moveTo(-36,13).lineTo(-25,7).stroke({color:GOLD,width:1.1});
}
function drawFoxClaw(g:Graphics,alpha:number){
 g.poly([-134,-24,-101,-35,-70,-33,-49,-49,-29,-49,-7,-60,17,-54,39,-41,62,-43,81,-32,107,-34,124,-20,114,-5,92,-2,87,12,107,19,118,35,103,45,77,40,62,34,61,51,39,60,15,43,-7,44,-30,34,-58,32,-99,36,-134,23]).fill({color:RED,alpha}).stroke({color:GOLD,width:1.5,alpha});
 g.poly([-134,-24,-101,-35,-70,-33,-49,-49,-29,-49,-7,-60,17,-54,-10,-42,-23,-25,-57,-22,-78,-10,-103,-14]).fill({color:PAPER,alpha});
 g.poly([-134,23,-99,36,-58,32,-30,34,-7,44,-17,28,-48,17,-69,21,-93,9,-117,13]).fill({color:PAPER,alpha});
 g.poly([-54,-19,-24,-24,-8,-40,15,-42,36,-30,62,-32,76,-19,57,-13,37,-16,27,-8,6,-14,-11,0,-27,-8]).fill({color:PAPER,alpha});
 g.poly([-28,7,-6,2,8,14,29,9,43,23,61,20,76,33,59,43,39,35,18,35,7,23,-9,25]).fill({color:PAPER,alpha});
 // Three long hooked claws: cream paper with a warm fold on one side.
 for(const [x,y,r] of [[89,-23,-.4],[97,7,.12],[76,35,.6]]){
  local(g,x,y,r);g.moveTo(-6,-12).quadraticCurveTo(22,-15,34,17).quadraticCurveTo(10,3,-6,3).closePath().fill({color:PAPER,alpha});g.poly([0,-7,18,-1,34,17,8,1]).fill({color:0xd6b77d,alpha});g.restore();
 }
 g.moveTo(-93,-3).bezierCurveTo(-75,-21,-46,-12,-54,3).bezierCurveTo(-65,19,-81,6,-68,0).stroke({color:GOLD,width:2,alpha});
 g.moveTo(-20,-35).lineTo(-9,-44).moveTo(23,-20).lineTo(36,-23).moveTo(9,32).lineTo(20,29).stroke({color:DARK,width:2,alpha});
}
function drawCrane(g:Graphics,flap:number,missing=false){
 g.poly([-20,10,7,-14,38,8,13,27,-20,10]).fill(PAPER).stroke({color:GOLD,width:1.2});
 g.poly([-20,10,-56,-13,-35,15,-58,33,13,27]).fill(RED).stroke({color:PAPER,width:1});
 g.poly([7,-14,-47,-92,-67,-128,-47,-31,-20,10]).fill(PAPER).stroke({color:GOLD,width:1.2});
 g.poly([7,-14,-47,-92,-47,-31]).fill(RED);
 g.moveTo(-45,-74).lineTo(-46,-40).lineTo(-19,-10).stroke({color:GOLD,width:1.2});
 if(!missing){g.poly([0,-15,20,-54-flap*13,60,-104-flap*20,113,-132+flap*25,87,-67,56,-35,0,-15]).fill(PAPER).stroke({color:GOLD,width:1.2});g.poly([0,-15,113,-132+flap*25,56,-35]).fill(RED);g.moveTo(0,-15).lineTo(60,-104-flap*20).lineTo(56,-35).stroke({color:GOLD,width:1.4});
  for(let i=0;i<4;i++){const x=34+i*10,y=-52-i*12;g.circle(x,y,3.2).stroke({color:PAPER,width:1.4});}}
 g.poly([28,10,45,-18,47,-58,57,-74,67,-71,59,-60,58,-17,38,8]).fill(PAPER).stroke({color:GOLD,width:1});
 g.poly([57,-74,69,-71,57,-65]).fill(RED);g.poly([67,-71,89,-64,65,-64]).fill(DARK);g.circle(62,-68,1.8).fill(INK);
 g.poly([-12,12,7,-3,22,10,9,18]).fill(RED);
}
/** Paper silhouettes, folds and negative-space ornament follow the approved interaction boards. */
export class HualingRenderer{
 root=new Container();private back=new Graphics();private art=new Graphics();private guide=new Graphics();private template=new Graphics();private tiger=new PaperTigerRenderer();private scene=new SceneSealRenderer();
 constructor(){this.root.addChild(this.scene.root,this.back,this.tiger.root,this.template,this.art,this.guide);}
 update(m:Hualing,enabled:boolean,low=false){
  this.root.visible=enabled;if(!enabled)return;this.back.clear();this.art.clear();this.guide.clear();this.template.clear();this.tiger.update(m.tiger,m.bounds);
  this.scene.update(m.sceneSeal,m.bounds,m.clock,!m.selected,m.scenes);
  for(const f of m.effects){if(f.kind==='dragon')this.dragon(f,low);else if(f.kind==='mountain')this.mountain(f,m.bounds.bottom);else if(f.kind==='rift')this.rift(f,low);else this.crane(f);}
  if(m.repairing){const p=m.repairAnchor,g=this.template;local(g,p.x,p.y,0,m.selected==='tiger'?1.35:1);
   if(m.selected==='tiger'){drawPaperTiger(g,false,false);}else drawCrane(g,0,true);g.restore();
   this.template.alpha=.78;
   const points=m.guide,progress=m.repairProgress;
   const len=pathLength(points),count=Math.ceil(len/11);for(let i=0;i<count;i+=2){const a=atPath(points,i/count),b=atPath(points,Math.min(1,(i+1)/count));stroke(this.guide,[a,b],GOLD,2,.65);}
   if(progress>0)stroke(this.guide,Array.from({length:Math.max(2,Math.ceil(progress*100))},(_,i)=>atPath(points,progress*i/(Math.max(2,Math.ceil(progress*100))-1))),RED,5);
   const start=atPath(points,progress);this.guide.circle(start.x,start.y,14+Math.sin(m.clock*5)*3).stroke({color:GOLD,width:1.5,alpha:.5});this.guide.circle(start.x,start.y,5).fill(PAPER);
   if(m.offGuide&&m.drawing){const p=m.path.at(-1);if(p)this.guide.circle(p.x,p.y,8).stroke({color:0xdf7761,width:2});}
   this.back.ellipse(p.x,p.y+39,95,18).fill({color:INK,alpha:.25});
  }else if(m.selected){
   const g=this.guide,top=m.bounds.top,bottom=m.bounds.bottom;
   if(!m.drawing){const hint=m.selected==='mountain'?[{x:160,y:550},{x:230,y:455},{x:300,y:535},{x:400,y:420},{x:490,y:530},{x:570,y:470}]:Array.from({length:45},(_,i)=>({x:360+Math.sin(i/44*Math.PI*2)*140,y:bottom-85-i/44*(bottom-top-180)}));
    for(let i=1;i<hint.length;i+=2)stroke(g,[hint[i-1],hint[i]],GOLD,2,.35);
    g.circle(hint[0].x,hint[0].y,11).stroke({color:GOLD,width:2,alpha:.7});g.circle(hint[0].x,hint[0].y,4).fill(PAPER);
   }
  }
  if(m.path.length>1&&!m.repairing){stroke(this.guide,m.path,RED,12,.25);stroke(this.guide,m.path,PAPER,3,.95);
   if(m.selected==='dragon'){const f:SpiritEffect={id:0,kind:'dragon',path:m.path,age:.44,duration:4,hit:new Set(),collapsing:false,collapseAge:0};this.dragon(f,low,.5);}
   if(m.selected==='mountain'){this.mountain({id:0,kind:'mountain',path:m.path,age:.5,duration:16,hit:new Set(),collapsing:false,collapseAge:0},m.bounds.bottom,.4);}
   if(m.selected==='rift'){stroke(this.back,m.path,PAPER,21,.35);stroke(this.back,m.path,DARK,11,.7);}
   const tip=m.path.at(-1)!;this.guide.circle(tip.x,tip.y,6).fill(GOLD);this.guide.circle(tip.x,tip.y,3).fill(PAPER);
  }
 }
 private dragon(f:SpiritEffect,low:boolean,opacity=1){
  const g=this.art,len=pathLength(f.path),head=opacity<1?1:Math.min(1,f.age/1.5),tail=opacity<1?0:Math.max(0,(f.age-1.5)/1.5),fade=Math.min(1,(f.duration-f.age)/.35)*opacity;
  const points=Array.from({length:60},(_,i)=>atPath(f.path,tail+(head-tail)*i/59));stroke(g,points,DARK,36,fade);stroke(g,points,GOLD,29,fade);stroke(g,points,RED,24,fade);
  const count=Math.min(low?30:64,Math.max(3,Math.floor(len*(head-tail)/13)));
  for(let i=0;i<count;i++){const q=tail+(head-tail)*i/count,p=atPath(f.path,q),next=atPath(f.path,Math.min(1,q+.01)),angle=Math.atan2(next.y-p.y,next.x-p.x);local(g,p.x,p.y,angle);g.poly([-7,-10,0,-17,7,-10,2,-2]).fill({color:PAPER,alpha:fade*.85});g.poly([-5,5,0,13,5,5]).stroke({color:GOLD,width:1,alpha:fade});if(i%4===0){g.poly([-5,-14,-20,-32,-8,-29,5,-13]).fill({color:GOLD,alpha:fade});g.poly([-5,14,-20,32,-8,29,5,13]).fill({color:PAPER,alpha:fade});}g.restore();}
  const p=atPath(f.path,head),prev=atPath(f.path,Math.max(0,head-.02)),angle=Math.atan2(p.y-prev.y,p.x-prev.x);local(g,p.x,p.y,angle,1.1);drawDragonHead(g);g.restore();
  if(f.age>.45)for(let i=0;i<12;i++){const q=(f.age*.4+i*.083)%1,p=atPath(f.path,q);shard(g,p.x+Math.sin(i*4+f.age*5)*22,p.y+Math.cos(i*2)*22,3,i,GOLD,fade*.7);}
 }
 private mountain(f:SpiritEffect,bottom:number,opacity=1){
  if(f.path.length<2)return;const g=this.art,path=simplify(f.path);if(path.length<2)return;
  const base=Math.min(bottom-8,Math.max(...f.path.map(p=>p.y))+35),rise=1-(1-Math.min(1,f.age/.45))**3,fall=f.collapsing?Math.min(1,f.collapseAge/1.1):0,alpha=opacity*(1-Math.max(0,fall-.7)/.3);
  const ridge=path.map(p=>({x:p.x,y:base-(base-p.y)*rise-fall*150}));const end=ridge.at(-1)!,first=ridge[0];
  g.poly([first.x,base,end.x,base,...[...ridge].reverse().flatMap(p=>[p.x,p.y])]).fill({color:DARK,alpha}).stroke({color:GOLD,width:1.8,alpha});
  for(let i=1;i<ridge.length;i++){const a=ridge[i-1],b=ridge[i],mid=(a.x+b.x)/2;g.poly([a.x,a.y,b.x,b.y,mid,base]).fill({color:i%2?RED:0x9d3029,alpha});g.moveTo(b.x,b.y).lineTo(mid,base).stroke({color:GOLD,width:1,alpha:alpha*.65});if(i%2===0){g.poly([b.x,b.y,b.x-8,b.y+22,b.x+3,b.y+14,b.x+11,b.y+30]).fill({color:PAPER,alpha:alpha*.8});}}
  const left=Math.min(...path.map(p=>p.x)),right=Math.max(...path.map(p=>p.x));
  for(let x=left+20;x<right-10;x+=34){g.moveTo(x,base-9).lineTo(x,base-34).moveTo(x-8,base-22).lineTo(x+8,base-22).moveTo(x-12,base-15).lineTo(x+12,base-15).stroke({color:GOLD,width:1.1,alpha:alpha*.55});}
  for(let x=left+8;x<right;x+=37){g.ellipse(x,base+2,24,7).fill({color:PAPER,alpha:alpha*.65});g.ellipse(x+8,base-4,13,8).stroke({color:GOLD,width:1.4,alpha});}
  if(f.collapsing)for(let i=0;i<24;i++){const x=left+(right-left)*(i/24)+Math.sin(i*7)*fall*35,y=base-fall*(80+(i%5)*33);shard(g,x,y,4+(i%4)*2,i+fall*4,i%2?RED:PAPER,alpha);}
 }
 private rift(f:SpiritEffect,low:boolean){
  const g=this.art,open=Math.min(1,f.age/.75),fade=Math.min(1,(f.duration-f.age)/.45),points=f.path;
  stroke(this.back,points,INK,66*open,fade*.7);stroke(g,points,PAPER,49*open,fade);stroke(g,points,DARK,35*open,fade);stroke(g,points,RED,22*open,fade*.8);
  const n=low?18:36;for(let i=0;i<n;i++){const p=atPath(points,i/n),next=atPath(points,(i+1)/n),a=Math.atan2(next.y-p.y,next.x-p.x);local(g,p.x,p.y,a);g.poly([-6,-22*open,8,-(27+(i%3)*5)*open,13,-14*open]).fill({color:PAPER,alpha:fade});g.poly([-6,22*open,10,(27+(i%4)*3)*open,15,14*open]).fill({color:0xd1b88e,alpha:fade});g.restore();}
  if(f.age>.5){const q=Math.min(1,(f.age-.5)/1.25),p=atPath(points,q),previous=atPath(points,Math.max(0,q-.03)),angle=Math.atan2(p.y-previous.y,p.x-previous.x);local(g,p.x,p.y,angle,1.05+Math.sin(q*Math.PI)*.35);drawFoxClaw(g,fade);g.restore();
  }
 }
 private crane(f:SpiritEffect){
  const g=this.art,p=f.path[0],u=Math.min(1,f.age/.55),fade=Math.min(1,(f.duration-f.age)/.6),y=p.y-Math.min(1,f.age/2)*190;
  local(g,p.x,y,0,.9+u*.2,.1+u*.9);drawCrane(g,Math.sin(f.age*7));g.restore();
  if(f.age>.45){const q=Math.min(1,(f.age-.45)/1.25),r=90+q*460;
   for(let i=0;i<5;i++){const offset=i*18;g.moveTo(p.x-r*.8,p.y-r*.55+offset).bezierCurveTo(p.x-r*.3,p.y-r-30+offset,p.x+r*.3,p.y-r-30+offset,p.x+r*.8,p.y-r*.55+offset).stroke({color:i%2?PAPER:JADE,width:i===0?7:2,alpha:fade*(1-q*.6)*(.6-i*.07)});}
   for(let i=0;i<14;i++){const angle=-Math.PI*.85+i/13*Math.PI*.7,x=p.x+Math.cos(angle)*r,y=p.y+Math.sin(angle)*r;shard(g,x,y,4,i, i%2?PAPER:GOLD,fade);}
  }
 }
}
