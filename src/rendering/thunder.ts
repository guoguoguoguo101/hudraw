import {FoxThunderUltimate} from './fox-thunder-ultimate';
import {Container,Graphics} from 'pixi.js';
import type {Skill} from '../core/types';
import type {Point} from '../input/recognizer';
import {THUNDER_STAGES} from '../gameplay/thunder';
import {AscendantScroll} from './ascendant-scroll';
import {AscendantCrane} from './ascendant-crane';
const WHITE=0xfff3dc,GOLD=0xe7ba68,RED=0xc84130,INK=0x27252a;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function cloud(g:Graphics,x:number,y:number,scale:number,t:number){
 g.moveTo(x-55*scale,y).bezierCurveTo(x-85*scale,y-18*scale,x-40*scale,y-34*scale,x-28*scale,y-19*scale).bezierCurveTo(x-39*scale,y-58*scale,x+14*scale,y-60*scale,x+22*scale,y-28*scale).bezierCurveTo(x+54*scale,y-43*scale,x+81*scale,y-7*scale,x+48*scale,y+7*scale).bezierCurveTo(x+16*scale,y+22*scale,x-10*scale,y+3*scale,x-55*scale,y).fill({color:WHITE}).stroke({color:GOLD,width:1.4});
 g.moveTo(x-20*scale,y-8*scale).bezierCurveTo(x-9*scale,y-35*scale,x+23*scale,y-21*scale,x+9*scale,y-8*scale).bezierCurveTo(x-5*scale,y+3*scale,x-12*scale,y-15*scale,x-1*scale,y-17*scale).stroke({color:RED,width:2*scale});
 g.moveTo(x+22*scale,y+2*scale).bezierCurveTo(x+44*scale,y+8*scale,x+71*scale+Math.sin(t)*5,y+18*scale,x+90*scale,y+6*scale).stroke({color:GOLD,width:2});
}
function seal(g:Graphics,x:number,y:number,r:number,t:number){
 g.circle(x,y,r).stroke({color:GOLD,width:1.5}).circle(x,y,r*.8).stroke({color:RED,width:3});
 for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.15;g.poly([x+Math.cos(a)*(r+2),y+Math.sin(a)*(r+2),x+Math.cos(a+.08)*(r+12),y+Math.sin(a+.08)*(r+12),x+Math.cos(a+.16)*(r+2),y+Math.sin(a+.16)*(r+2)]).fill({color:GOLD,alpha:.75});}
 g.moveTo(x-7,y-12).lineTo(x+6,y-12).lineTo(x-2,y-3).lineTo(x+8,y).lineTo(x-7,y+11).moveTo(x,y-16).lineTo(x,y+16).stroke({color:WHITE,width:2});
}
function bolt(g:Graphics,a:Point,b:Point,width:number,t:number,seed:number,alpha=1){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;const points:Point[]=[];
 const count=Math.max(4,Math.ceil(d/42));
 for(let j=0;j<=count;j++){const u=j/count,off=j===0||j===count?0:(j%2?1:-1)*(12+Math.sin(j*2.7+seed)*7+Math.sin(t*18+seed)*3);points.push({x:a.x+dx*u+nx*off,y:a.y+dy*u+ny*off});}
 for(const [w,c,al] of [[width+12,RED,alpha*.13],[width+3,GOLD,alpha*.9],[width,WHITE,alpha]] as const){g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);g.stroke({color:c,width:w,alpha:al});}
 if(width>5){g.moveTo(a.x+nx*9,a.y+ny*9).quadraticCurveTo((a.x+b.x)/2+nx*(25+Math.sin(t*3)*9),(a.y+b.y)/2+ny*25,b.x,b.y).stroke({color:RED,width:4,alpha:alpha*.8});const outline:number[]=[];points.forEach((p,i)=>outline.push(p.x+nx*width*(i%2?.75:.35),p.y+ny*width*(i%2?.75:.35)));for(const p of [...points].reverse())outline.push(p.x-nx*width*.3,p.y-ny*width*.3);g.poly(outline).fill({color:GOLD,alpha:alpha*.45});}
}
function face(g:Graphics){
 for(const sign of [-1,1]){
  g.poly([0,-75,sign*48,-104,sign*68,-175,sign*91,-106,sign*74,-56,sign*112,-34,sign*76,-28,sign*98,-2,sign*49,-13,sign*25,30,0,61]).fill({color:WHITE}).stroke({color:GOLD,width:2});
  g.poly([sign*69,-150,sign*78,-107,sign*51,-83]).fill({color:RED});
  g.poly([sign*62,-53,sign*18,-29,sign*48,-35]).fill({color:RED});
  g.moveTo(sign*59,-49).lineTo(sign*33,-35).stroke({color:INK,width:3});
  g.poly([sign*48,-20,sign*24,-8,sign*38,-9,sign*22,14,sign*56,-14]).fill({color:RED});
  g.moveTo(sign*16,-12).lineTo(sign*7,28).stroke({color:GOLD,width:1.5});
 }
 g.poly([0,-85,10,-62,0,-40,-10,-62]).fill({color:RED});g.moveTo(0,-77).lineTo(-4,-64).lineTo(5,-66).lineTo(0,-49).stroke({color:WHITE,width:2});g.poly([-7,31,7,31,0,39]).fill({color:RED});
}
class ThunderItem{
 ultimate?:FoxThunderUltimate;root=new Container();sky=new Graphics();tails=new Graphics();head=new Graphics();effects=new Graphics();ornaments=new Graphics();scrolls:AscendantScroll[]=[];cranes:AscendantCrane[]=[];
 constructor(public level:number){
  if(level===4){this.ultimate=new FoxThunderUltimate();this.root.addChild(this.ultimate);return;}
  this.root.addChild(this.sky,this.tails,this.head);
  if(level>=3)for(let i=0;i<(level===4?2:3);i++){const scroll=new AscendantScroll(level===4?i+1:i,level===4?275:150,level===4?76:48);this.root.addChild(scroll);this.scrolls.push(scroll);}
  if(level===4)face(this.head);
  this.root.addChild(this.effects,this.ornaments);
  if(level>=3)for(let i=0;i<(level===4?4:2);i++){const crane=new AscendantCrane(i);this.root.addChild(crane);this.cranes.push(crane);}
 }
 update(s:Skill){
  if(this.ultimate){this.ultimate.update(s);return;}
  const t=s.age,l=this.level,stage=THUNDER_STAGES[l-1],fade=clamp((s.duration-t)/(l===4?1.1:.45));this.root.alpha=fade;
  const g=this.effects,o=this.ornaments,sky=this.sky;g.clear();o.clear();sky.clear();this.tails.clear();
  const origin={x:s.x,y:s.y-25};
  if(l===2&&t>.12){cloud(sky,origin.x+Math.sin(t)*35,origin.y-70,.55,t);}
  if(l===4){
   const reveal=clamp((t-.12)/.85),spread=1-(1-reveal)**3;sky.alpha=reveal;
   sky.rect(30,205,660,405).fill({color:INK,alpha:.30});
   for(const sign of [-1,1]){
    const x=360+sign*(95+spread*170);cloud(sky,x,270+Math.sin(t*1.5+sign)*9,1.1,t);cloud(sky,x+sign*25,450,.7,t);
    sky.moveTo(x,235).bezierCurveTo(x-sign*70,290,x+sign*60,380,x-sign*35,445).stroke({color:RED,width:14,alpha:.65});
   }
   for(let i=0;i<9;i++){
    const a=-Math.PI*.98+i*Math.PI*.12,len=215+(i%3)*22,centers:{x:number;y:number;w:number;a:number}[]=[];
    let x=360,y=452;
    for(let j=0;j<=32;j++){const u=j/32,angle=a+Math.sin(t*1.6-i*.7-u*3)*u*.22+u**3*(i<4?-1:1)*2.9;if(j){x+=Math.cos(angle)*len*spread/32;y+=Math.sin(angle)*len*spread/32;}centers.push({x,y,w:(6+Math.sin(u*Math.PI)*24)*(1-u**6)*spread,a:angle});}
    const outline:number[]=[];for(const p of centers)outline.push(p.x-Math.sin(p.a)*p.w,p.y+Math.cos(p.a)*p.w);for(const p of [...centers].reverse())outline.push(p.x+Math.sin(p.a)*p.w,p.y-Math.cos(p.a)*p.w);
    this.tails.poly(outline).fill({color:WHITE,alpha:reveal*.94}).stroke({color:RED,width:4,alpha:.75}).poly(outline).stroke({color:GOLD,width:1.4});
    for(const side of [-.5,.55]){const pts=centers.slice(3,30);this.tails.moveTo(pts[0].x-Math.sin(pts[0].a)*pts[0].w*side,pts[0].y+Math.cos(pts[0].a)*pts[0].w*side);for(const p of pts)this.tails.lineTo(p.x-Math.sin(p.a)*p.w*side,p.y+Math.cos(p.a)*p.w*side);this.tails.stroke({color:side<0?RED:GOLD,width:2,alpha:.8});}
    for(let k=8;k<23;k+=4){const p=centers[k];this.tails.poly([p.x-10,p.y+7,p.x-2,p.y-5,p.x+6,p.y+2,p.x+12,p.y-8,p.x+17,p.y+7]).fill({color:INK,alpha:.25});}
   }
   this.head.position.set(360,426+Math.sin(t*1.6)*4);this.head.scale.set(.4+spread*.75);this.head.alpha=reveal;
   const impact=clamp((t-stage.start)/.3);if(impact>0){
    const rr=80+impact*215;const shape:number[]=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,r=i%2?rr*.8:rr;shape.push(360+Math.cos(a)*r,685+Math.sin(a)*r*.72);}g.poly(shape).stroke({color:RED,width:4,alpha:.7}).poly(shape).stroke({color:GOLD,width:1.4});
    for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.10;seal(o,360+Math.cos(a)*rr*.86,685+Math.sin(a)*rr*.61,10,t);}
    bolt(g,{x:360,y:420},{x:360,y:632},22,t,0,.75+.2*Math.sin(t*14));
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;cloud(o,360+Math.cos(a)*rr,695+Math.sin(a)*rr*.65,.35+impact*.16,t+i);}
   }else if(t>1.1){bolt(g,{x:360,y:485},{x:360,y:570},2,t,1,clamp((t-1.1)*2));}
  }
  this.scrolls.forEach((scroll,i)=>{
   const x=l===4?360+(i===0?-1:1)*235:[220,360,500][i],y=l===4?360:385+(i%2)*-52;
   scroll.position.set(x,y+Math.sin(t*1.6+i)*8);scroll.rotation=Math.PI/2+(l===4?(i===0?-.4:.4):Math.sin(t+i)*.035);scroll.update(l===4?t+.3:t+i*.14);scroll.alpha*=clamp((t-.1)/.35);
   if(l===3)cloud(sky,x,y+88,.48,t+i);
  });
  const targets=s.thunder!.targets;
  if(!targets.length&&t>=stage.start){const end={x:origin.x+s.direction.x*190,y:origin.y+s.direction.y*190};bolt(g,origin,end,l===1?2:5,t,3,.45);}
  targets.forEach((p,i)=>{
   if(t<p.at)return;const elapsed=t-p.at,al=clamp((s.duration-.2-t)/.45)*(.8+.15*Math.sin(t*24+i));
   const previous=i?targets[i-1]:origin;
   bolt(g,previous,p,l===1?2:l===2?7:3.5,t,i,al);
   if(l>=3){const a={x:l===4?360+(i-3.5)*48:[220,360,500][i%3],y:l===4?425:410};bolt(g,a,p,l===4?8:4,t,i+8,al);}
   if(l>=2){seal(o,p.x,p.y,18+clamp(elapsed/.16)*(l===4?18:6),t);}
   if(l===2){const u=.5+Math.sin(t*2+i)*.15;cloud(o,previous.x+(p.x-previous.x)*u,previous.y+(p.y-previous.y)*u,.24,t+i);}
   for(let k=0;k<(l===1?3:l===4?12:6);k++){const a=k*2.4+i,r=18+clamp(elapsed/.3)*32+Math.sin(t*4+k)*8;const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r; o.poly([x,y-5,x+3,y,x,y+5,x-3,y]).fill({color:k%2?RED:GOLD,alpha:.8});}
  });
  if(l>=2)for(let i=0;i<(l===4?18:l===3?9:3);i++){
   const a=i*2.4+t*.28,r=90+(i%5)*40,x=360+Math.cos(a)*r,y=640+Math.sin(a)*r*.8-Math.sin(t*2+i)*12;
   o.poly([x-5,y-12,x+5,y-9,x+3,y+13,x-7,y+10]).fill({color:WHITE,alpha:clamp(t/.3)}).stroke({color:RED,width:1});o.moveTo(x,y-7).lineTo(x-3,y).lineTo(x+2,y+3).lineTo(x-3,y+7).stroke({color:RED,width:1});
  }
  this.cranes.forEach((crane,i)=>{const a=t*.5+i*Math.PI*2/this.cranes.length;crane.update(t);crane.position.set(360+Math.cos(a)*(l===4?240:185),l===4?430+Math.sin(a)*140:390+Math.sin(a)*60);crane.scale.set(l===4?.45:.30);crane.rotation=Math.sin(a)*.3;crane.alpha=clamp((t-.4)/.4);});
 }
}
export class ThunderRenderer{
 root=new Container();items=new Map<number,ThunderItem>();
 update(skills:Skill[]){const alive=new Set<number>();for(const s of skills){if(s.rune!=='z'||!s.thunder)continue;alive.add(s.id);let item=this.items.get(s.id);if(!item){item=new ThunderItem(s.thunder.level);this.items.set(s.id,item);this.root.addChild(item.root);}item.update(s);}for(const [id,item] of this.items)if(!alive.has(id)){item.root.destroy({children:true});this.items.delete(id);}}
 clear(){for(const item of this.items.values())item.root.destroy({children:true});this.items.clear();}
}
