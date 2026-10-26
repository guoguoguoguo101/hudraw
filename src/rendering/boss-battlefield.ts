import {BOSS_PARTS,partWorld} from '../gameplay/boss-anatomy';
import {bossPose,deformBossVertex} from './boss-motion';
import {Graphics} from 'pixi.js';
import type {Enemy} from '../core/types';
import type {Arena} from '../input/line-interaction-geometry';
import {assaultPosition,assaultRadius,emberSource,mirrorStars,arenaPoint,type BossAssault,eyeOpen,assaultProgress} from '../gameplay/boss-battlefield';

const GOLD=0xf3c875,WHITE=0xfff2d5,ICE=0xc6edf4;
function star(g:Graphics,x:number,y:number,r:number,color:number,alpha=1){g.poly([x,y-r,x+r*.24,y-r*.23,x+r,y,x+r*.24,y+r*.23,x,y+r,x-r*.24,y+r*.23,x-r,y,x-r*.24,y-r*.23]).fill({color,alpha});}
function fire(g:Graphics,x:number,y:number,r:number,t:number,color:number,alpha=1){
 g.circle(x,y,r*1.8).fill({color,alpha:alpha*.08}).circle(x,y,r*1.3).fill({color,alpha:alpha*.14});
 for(let i=0;i<3;i++){const w=r*(1-i*.27),yy=y+i*r*.1,sway=Math.sin(t*8+i)*r*.19;g.moveTo(x-w,yy+w*.6).bezierCurveTo(x-w*1.5,yy-w*.4,x+sway,yy-w*1.8,x+sway,yy-w*2).bezierCurveTo(x+w*.35,yy-w*.4,x+w*1.4,yy,x+w*.5,yy+w*.7).closePath().fill({color:[color,GOLD,WHITE][i],alpha});}
}
function crack(g:Graphics,x:number,y:number,r:number,t:number,alpha:number){
 for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.03,c=Math.cos(a),s=Math.sin(a),len=r*(.68+i%3*.15);g.moveTo(x,y).lineTo(x+c*len*.36-s*7,y+s*len*.36+c*7).lineTo(x+c*len*.68+s*5,y+s*len*.68-c*5).lineTo(x+c*len,y+s*len).stroke({color:ICE,width:2,alpha});const px=x+c*len*.65,py=y+s*len*.65;g.moveTo(px,py).lineTo(px+c*len*.17-s*12,py+s*len*.17+c*12).stroke({color:WHITE,width:1,alpha:alpha*.7});}
}
function ribbon(g:Graphics,a:{x:number;y:number},b:{x:number;y:number},bend:number,color:number,width:number,alpha:number){
 for(const [w,opacity] of [[width*2,.12],[width,.38],[Math.max(2,width*.21),.9]])g.moveTo(a.x,a.y).quadraticCurveTo((a.x+b.x)/2+bend,(a.y+b.y)/2-bend,b.x,b.y).stroke({color,width:w,alpha:alpha*opacity,cap:'round'});
}
function ring(g:Graphics,x:number,y:number,r:number,t:number,color:number,alpha:number){
 g.circle(x,y,r).stroke({color,width:2,alpha});for(let i=0;i<12;i++){const a=i*Math.PI/6+t;g.moveTo(x+Math.cos(a)*(r-7),y+Math.sin(a)*(r-7)).lineTo(x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7)).stroke({color,width:i%3?1:3,alpha});}
}

/** Scene-sized geometry, with the same timing and positions used by combat collision. */
export function drawBossBattlefield(back:Graphics,front:Graphics,e:Enemy,b:Arena,low:boolean,skyY=248){
 const s=e.chapterBoss!,f=s.field,t=s.clock,ch=s.chapter,active=s.phase==='windup'||s.phase==='attack',major=s.phase==='attack',weak=s.phase==='stagger';
 const activity=active?1:weak?.25:.5,pulse=(Math.sin(t*2)+1)/2,cx=(b.left+b.right)/2;
 if(ch==='valley'){
  // The chapter's setting sun becomes the boss's solar furnace.
  back.circle(355,skyY,132).fill({color:0xb44229,alpha:.18*activity}).circle(355,skyY,100).stroke({color:GOLD,width:3,alpha:.4*activity});
  back.circle(355+Math.sin(t*.3)*12,skyY-6,92).fill({color:0x34272b,alpha:active?.64:.26});
  for(let i=0;i<(low?6:10);i++){const a=t*.08+i*Math.PI*2/(low?6:10),r=117+Math.sin(t*3+i)*10;back.moveTo(355+Math.cos(a)*105,skyY+Math.sin(a)*105).lineTo(355+Math.cos(a)*r,skyY+Math.sin(a)*r).stroke({color:GOLD,width:3,alpha:.5*activity});}
  for(let i=0;i<4;i++){const p=arenaPoint(b,i%2?.94:.06,i<2?.24:.89),lit=s.marks[i];back.poly([p.x-19,p.y+25,p.x+19,p.y+25,p.x+12,p.y-5,p.x-12,p.y-5]).fill(0x493b31).stroke({color:GOLD,width:1,alpha:.7});fire(back,p.x,p.y-8,lit?17:9,t+i,lit?0xff8c3a:0x9e4739,lit?.95:.46);}
  for(let i=0;i<(low?12:24);i++){const x=(i*143+t*25)%720,y=b.bottom-(i*79+t*(35+i%4*12))%(b.bottom-b.top),r=1+i%3;back.poly([x,y-r*3,x+r,y,x,y+r*2,x-r,y]).fill({color:i%2?GOLD:0xf47c43,alpha:.4*activity});}
 }else if(ch==='sea'){
  // A visible water level and deep currents connect the encounter to the whale sea.
  const level=b.bottom-95-(major?Math.sin(Math.min(1,s.age/2.4)*Math.PI)*170:Math.sin(t*.55)*20);
  back.moveTo(0,level).bezierCurveTo(180,level-65,480,level+50,720,level-15).lineTo(720,b.bottom).lineTo(0,b.bottom).closePath().fill({color:0x145b74,alpha:.35*activity});
  for(let i=0;i<(low?4:8);i++){const y=b.top+160+i*61+Math.sin(t*.8+i)*15;back.moveTo(-20,y).bezierCurveTo(180,y-50,440,y+50,740,y-8).stroke({color:i%2?0x72ced4:WHITE,width:i%3?1.5:4,alpha:.16*activity});}
  for(const u of [.08,.92]){const p=arenaPoint(b,u,.79);for(let i=0;i<4;i++){const a=t*(u<.5?1:-1)+i*.6;back.save().transform(Math.cos(a),Math.sin(a)*.4,-Math.sin(a),Math.cos(a)*.4,p.x,p.y).ellipse(0,0,34+i*13,34+i*13).stroke({color:0x80d8e3,width:2,alpha:.19*activity}).restore();}}
 }else if(ch==='palace'){
  const p=arenaPoint(b,.5,.55),radius=Math.min(260,(b.bottom-b.top)*.45);
  for(let i=0;i<3;i++){const r=radius-i*31;back.save().transform(Math.cos(t*.09*(i%2?-1:1)),Math.sin(t*.09*(i%2?-1:1)),-Math.sin(t*.09*(i%2?-1:1)),Math.cos(t*.09*(i%2?-1:1)),p.x,p.y);ring(back,0,0,r,0,GOLD,.12+activity*.08);back.restore();}
  const stars=mirrorStars(b,s.cycle),beam=f.attacks.some(a=>a.kind==='beam'&&!a.resolved&&a.age>=0);
  back.moveTo(stars[0].x,stars[0].y).lineTo(stars[1].x,stars[1].y).stroke({color:0x92b9ee,width:2,alpha:beam?.6:.18});
  for(let i=0;i<2;i++){const q=stars[i];back.circle(q.x,q.y,31+pulse*5).fill({color:0x12304e,alpha:.8}).stroke({color:beam?WHITE:GOLD,width:2,alpha:.8});star(back,q.x,q.y,23,beam?WHITE:GOLD);ring(back,q.x,q.y,35,t*(i?1:-1),GOLD,.5);}
 }else{
  // Ice advances along the existing cliffs, while the central warm flame remains legible.
  for(let side=0;side<2;side++)for(let i=0;i<(low?5:9);i++){const x=side?b.right+20:b.left-20,y=b.top+140+i*(b.bottom-b.top-160)/(low?5:9),len=35+Math.sin(i*4+t*.3)*18+(major?70:15)*activity,dir=side?-1:1;back.poly([x,y-35,x+dir*len,y-7,x+dir*(len+19),y+21,x+dir*len*.4,y+37,x,y+47]).fill({color:0x91c6db,alpha:.35}).stroke({color:ICE,width:1,alpha:.4});}
  const source=emberSource(b);back.ellipse(source.x,source.y+12,47,16).fill({color:GOLD,alpha:.16});fire(back,source.x,source.y,18,t,0xf29a4c);
  for(let i=0;i<(low?8:18);i++){const x=(i*89+t*(major?210:80))%820-50,y=b.top+80+(i*71+t*24)%(b.bottom-b.top-90);back.moveTo(x,y).lineTo(x+30+(major?45:0),y+12).stroke({color:ICE,width:1.5,alpha:.22});}
  if(f.ember&&s.pen){ribbon(front,source,s.pen,15,GOLD,6,.65);fire(front,s.pen.x,s.pen.y,15,t,0xffa448);}
 }
 for(const z of f.scorches){const alpha=Math.min(1,(5.5-z.age)*2);back.ellipse(z.point.x,z.point.y,55,24).fill({color:0x462326,alpha:alpha*.8}).stroke({color:0xff8c44,width:2,alpha:alpha*.7});for(let i=0;i<4;i++)fire(back,z.point.x+(i-1.5)*20,z.point.y-4,9+Math.sin(t*4+i)*3,t+i,0xda5d34,alpha*.85);}
 const charging=f.attacks.find(a=>!a.resolved&&a.age>=0&&a.age<a.charge);
 if(charging){const u=Math.min(1,charging.age/charging.charge),r=60+u*65;
  
  if(ch==='sea')for(let i=0;i<3;i++)back.ellipse(e.x,e.y+45,r+i*18,(r+i*18)*.28).stroke({color:i?ICE:GOLD,width:i?2:5,alpha:.2+u*.45});
  if(ch==='palace'){ring(back,e.x,e.y-34,r,t*.7,GOLD,.4+u*.4);for(let i=0;i<6;i++){const a=t+i*Math.PI/3;star(back,e.x+Math.cos(a)*r,e.y-34+Math.sin(a)*r,7+u*5,WHITE,.8);}}
  if(ch==='snow'){crack(back,e.x,e.y-67,r,t,u*.7);back.ellipse(e.x,e.y+58,r*.8,15).stroke({color:ICE,width:4,alpha:u*.6});}
 }
 const pose=bossPose(s);for(const [part,definition] of BOSS_PARTS[ch].entries()){
  const p=partWorld(ch,part,e,(u,v)=>deformBossVertex(ch,u,v,pose)),a=f.attacks.find(a=>a.part===part&&!a.resolved&&a.age>=0&&a.age<a.charge+.35),hit=f.attacks.find(a=>a.part===part&&a.parried&&a.age-a.resolvedAt<.5);
  if(a){const power=Math.min(1,a.age/a.charge);ring(front,p.x,p.y,10+power*11,-t*2,a.kind==='lash'||a.kind==='hoof'?0xff7959:GOLD,.8);front.circle(p.x,p.y,19+power*12).fill({color:GOLD,alpha:power*.16});if(ch==='valley'){ribbon(back,{x:e.x+20,y:e.y+45},p,part%2?18:-18,a.kind==='lash'?0xe35d41:GOLD,7+power*5,.25+power*.35);fire(front,p.x,p.y,7+power*8,t+part,a.kind==='lash'?0xe35d41:0xeab952);}else star(front,p.x,p.y,9+power*7,ch==='snow'?ICE:GOLD);}
  else if(hit)front.circle(p.x,p.y,12+(hit.age-hit.resolvedAt)*10).stroke({color:GOLD,width:3,alpha:.8});
 }
 if(ch==='sea'){
  const eye=partWorld(ch,3,e,(u,v)=>deformBossVertex(ch,u,v,pose)),open=eyeOpen(f);front.ellipse(eye.x,eye.y,23,open?11:2).fill({color:open?WHITE:0x234252,alpha:.85}).stroke({color:GOLD,width:2});
  if(f.carry!==null&&s.pen){const p=s.pen;ribbon(front,p,eye,25,GOLD,3,.65);front.circle(p.x,p.y,15).fill(WHITE).stroke({color:GOLD,width:4});}
 }
 if(ch==='snow'&&f.shelterUntil>f.clock){const p=emberSource(b),life=Math.min(1,(f.shelterUntil-f.clock)*2);front.ellipse(p.x,p.y,81,66).fill({color:GOLD,alpha:.08*life}).stroke({color:GOLD,width:4,alpha:life});ring(front,p.x,p.y,73,-t,GOLD,life*.5);}
 for(const shot of f.attacks){if(shot.age>=0)drawAssault(back,front,shot,s.clock,b,low); }
 if(major){
  const power=Math.sin(Math.min(1,s.age/2.4)*Math.PI);
  if(ch==='valley')for(let i=0;i<5;i++){const angle=.25+i*.27,p={x:e.x+Math.cos(angle)*460*(i%2?1:-1),y:b.bottom+40};ribbon(back,e,p,Math.sin(t*2+i)*70,0xe46c32,18+power*26,power*.45);}
  if(ch==='sea')for(let i=0;i<3;i++){const y=b.bottom-(s.age/2.4)*(b.bottom-b.top-90)+i*25;back.moveTo(-30,y+30).bezierCurveTo(180,y-115,490,y+70,750,y-35).stroke({color:i?0x87d8df:0x145d7b,width:i?9:65,alpha:power*(i?.6:.5)});}
  if(ch==='palace')for(let i=0;i<4;i++){const a=t*.6+i*Math.PI/2,p={x:cx+Math.cos(a)*450,y:b.top+300+Math.sin(a)*450};ribbon(back,{x:cx,y:b.top+300},p,0,0xf1bb73,24,power*.65);}
  if(ch==='snow'){crack(back,cx,b.top+310,360,s.clock,power*.6);back.rect(b.left,b.top+100,b.right-b.left,b.bottom-b.top-100).fill({color:ICE,alpha:power*.09});}
 }
 if(f.flash>0)front.rect(b.left,b.top+97,b.right-b.left,b.bottom-b.top-97).fill({color:WHITE,alpha:f.flash*.24});
}

function arrows(g:Graphics,x:number,y:number,dx:number,dy:number,color:number){for(const sign of [-1,1]){const xx=x+dx*sign*33,yy=y+dy*sign*33;g.moveTo(xx-dx*sign*8-dy*5,yy-dy*sign*8+dx*5).lineTo(xx,yy).lineTo(xx-dx*sign*8+dy*5,yy-dy*sign*8-dx*5).stroke({color,width:3,alpha:.9});}}
function drawAssault(back:Graphics,g:Graphics,a:BossAssault,t:number,b:Arena,low:boolean){
 const charge=Math.min(1,a.age/a.charge),live=a.age>=a.charge,u=assaultProgress(a),p=assaultPosition(a),after=a.age-a.resolvedAt,color=a.kind==='lash'||a.kind==='hoof'?0xff8362:a.kind==='frost'?ICE:GOLD;
 if(a.resolved){
  if(a.parried){const v=Math.min(1,after/.32),x=a.contact.x+(a.from.x-a.contact.x)*v,y=a.contact.y+(a.from.y-a.contact.y)*v-Math.sin(v*Math.PI)*30;if(v<1){ribbon(g,a.contact,{x,y},15,GOLD,a.perfect?14:9,1-v*.3);star(g,x,y,15,WHITE);}g.circle(a.contact.x,a.contact.y,18+after*140).stroke({color:a.perfect?WHITE:GOLD,width:a.perfect?5:3,alpha:Math.max(0,1-after/.65)});}
  else{const alpha=Math.max(0,1-after/.65);g.ellipse(a.to.x,a.to.y,25+after*110,12+after*55).stroke({color,width:5,alpha});for(let i=0;i<(low?5:9);i++){const angle=i*2.4,r=20+after*90;star(g,a.to.x+Math.cos(angle)*r,a.to.y+Math.sin(angle)*r*.6,4,color,alpha);}}return;
 }
 if(a.kind==='sun'){
  if(!live){g.moveTo(a.from.x,a.from.y).quadraticCurveTo((a.from.x+a.to.x)/2,(a.from.y+a.to.y)/2-45,a.to.x,a.to.y).stroke({color:GOLD,width:1.5,alpha:.18+charge*.3});}
  else{const tail={x:p.x-(a.to.x-a.from.x)*.17,y:p.y-(a.to.y-a.from.y)*.17};ribbon(g,tail,p,8,0xf29434,23,.9);fire(g,p.x,p.y,23,t,0xe88632);g.circle(p.x,p.y,7).fill(WHITE);if(u>=.18&&u<=.91){ring(g,p.x,p.y,29,-t*3,u>=.42&&u<=.72?WHITE:GOLD,.95);const vx=a.to.x-a.from.x,vy=a.to.y-a.from.y,n=Math.hypot(vx,vy)||1;arrows(g,p.x,p.y,-vy/n,vx/n,WHITE);}}
 }else if(a.kind==='lash'||a.kind==='hoof'){
  const knot={x:a.from.x+(a.to.x-a.from.x)*.72,y:a.from.y+(a.to.y-a.from.y)*.72},grow=live?Math.min(1,u*5):charge*.18,end={x:a.from.x+(a.to.x-a.from.x)*grow,y:a.from.y+(a.to.y-a.from.y)*grow};
  ribbon(back,a.from,a.to,a.kind==='lash'?20:0,color,live?25:2,live?.8:.25);if(live){ribbon(g,a.from,end,a.kind==='lash'?18:0,color,17,.9);if(a.kind==='hoof')crack(back,a.to.x,a.to.y,60+u*100,t,.65);g.poly([knot.x,knot.y-18,knot.x+15,knot.y,knot.x,knot.y+18,knot.x-15,knot.y]).fill({color:0x522b35,alpha:.95}).stroke({color:u>=.18&&u<=.91?WHITE:color,width:3});const dx=a.to.x-a.from.x,dy=a.to.y-a.from.y,n=Math.hypot(dx,dy)||1;arrows(g,knot.x,knot.y,-dy/n,dx/n,WHITE);}
 }else if(a.kind==='tide'){
  const x=live?p.x:a.from.x,dir=a.to.x>a.from.x?1:-1,opacity=live?.86:.2+charge*.25;
  back.rect(Math.min(x,a.from.x),b.top+105,Math.abs(x-a.from.x),b.bottom-b.top-115).fill({color:0x155a76,alpha:.2});
  for(let layer=0;layer<3;layer++){const xx=x-dir*(2-layer)*17;g.moveTo(xx,b.top+110);for(let y=b.top+110;y<b.bottom-25;y+=72)g.bezierCurveTo(xx+dir*45,y+5,xx-dir*25,y+55,xx,y+72);g.stroke({color:[0x14546f,0x5eb8cc,ICE][layer],width:[100,43,4][layer],alpha:opacity});}
  if(live){g.roundRect(x-36,a.to.y-25,72,50,12).fill({color:0xe3ead7,alpha:.42}).stroke({color:WHITE,width:3});arrows(g,x,a.to.y,1,0,WHITE);}
 }else if(a.kind==='pearl'){
  g.circle(p.x,p.y,22).fill({color:0x62a7c5,alpha:.25}).circle(p.x,p.y,12).fill(WHITE).stroke({color:GOLD,width:3});ring(g,p.x,p.y,21,t,GOLD,.7);if(!live)ribbon(back,a.from,a.to,10,ICE,2,.2);
 }else if(a.kind==='beam'){
  const ready=a.age>=a.charge*.65,[s,two]=a.nodes;back.moveTo(s.x,s.y).lineTo(two.x,two.y).stroke({color:0x8ecff4,width:ready?3:1,alpha:ready?.8:.22});for(const q of a.nodes){g.circle(q.x,q.y,25).fill({color:0x243c65,alpha:.96}).stroke({color:ready?WHITE:GOLD,width:ready?3:1});star(g,q.x,q.y,17,ready?WHITE:GOLD);}
  ribbon(g,a.from,a.to,0,GOLD,live?36:2+charge*3,live?.9:.23);if(live)g.moveTo(a.from.x,a.from.y).lineTo(a.to.x,a.to.y).stroke({color:WHITE,width:6,alpha:.9});
 }else if(a.kind==='thread'){
  const vertical=a.part%2===0,dx=vertical?0:1,dy=vertical?1:0,q=a.to;
  ribbon(back,a.from,q,18,GOLD,live?6:1,live?.8:.3);g.moveTo(q.x-dx*66,q.y-dy*66).lineTo(q.x+dx*66,q.y+dy*66).stroke({color:live?WHITE:GOLD,width:live?6:2,alpha:live?.95:.4});g.circle(q.x,q.y,10).fill(GOLD);if(live)arrows(g,q.x,q.y,-dy,dx,WHITE);
 }else{
  const r=assaultRadius(a),source=emberSource(b);if(!live){ribbon(back,a.from,source,-35,ICE,5,.5*charge);ring(g,a.to.x,a.to.y,28,t,ICE,.5);}
  else{const n=7;for(let i=0;i<n;i++){const end={x:source.x+(i-3)*38,y:source.y+Math.abs(i-3)*7};ribbon(back,a.from,end,Math.sin(i)*20,ICE,9,Math.sin(u*Math.PI)*.3);}g.poly(Array.from({length:12},(_,i)=>{const angle=i*Math.PI/6,rr=r*(i%2?.85:1);return [a.to.x+Math.cos(angle)*rr,a.to.y+Math.sin(angle)*rr*.65];}).flat()).fill({color:0x669eb8,alpha:.3}).stroke({color:ICE,width:2,alpha:.75});crack(g,a.to.x,a.to.y,r,t,.8);}
 }
}
