import {pathSlice,pathPoint} from '../input/advanced-geometry';
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
  const t=s.age,l=this.level,state=s.thunder!,stage=THUNDER_STAGES[l-1],fade=clamp((s.duration-t)/.35);this.root.alpha=fade;
  const g=this.effects,o=this.ornaments;g.clear();o.clear();this.sky.clear();this.tails.clear();
  this.scrolls.forEach((v,i)=>{v.visible=l>=3;v.update(t+i*.14);v.position.set(220+i*140,340);v.rotation=Math.PI/2;v.alpha*=.4;});
  this.cranes.forEach(c=>c.visible=false);
  const path=state.path;g.moveTo(path[0].x,path[0].y);for(const p of path.slice(1))g.lineTo(p.x,p.y);g.stroke({color:GOLD,width:1,alpha:.18});
  if(state.travel>0){const p=pathSlice(path,Math.max(0,state.travel-state.length*.4),state.travel);for(let i=1;i<p.length;i++)bolt(g,p[i-1],p[i],l===1?2:l===2?4:5,t,i,.85);const tip=pathPoint(path,state.travel);g.circle(tip.x,tip.y,5+l).fill({color:WHITE});}
  for(const [i,p] of state.targets.entries()){if(t<p.at)continue;const age=t-p.at,alpha=clamp(1-age/(l>=3?.8:.4));if(alpha<=0)continue;seal(o,p.x,p.y,12+l*4+clamp(age/.2)*12,t);o.alpha=fade;g.circle(p.x,p.y,12+age*60).stroke({color:RED,width:2,alpha});if(l>=2)cloud(o,p.x,p.y-25,.2,t+i);}
  for(const chain of state.chains){const alpha=clamp(1-(t-chain.at)/.25);if(alpha)bolt(g,chain.from,chain.to,2,t,1,alpha);}

 }
}
export class ThunderRenderer{
 root=new Container();items=new Map<number,ThunderItem>();
 update(skills:Skill[]){const alive=new Set<number>();for(const s of skills){if(s.rune!=='z'||!s.thunder)continue;alive.add(s.id);let item=this.items.get(s.id);if(!item){item=new ThunderItem(s.thunder.level);this.items.set(s.id,item);this.root.addChild(item.root);}item.update(s);}for(const [id,item] of this.items)if(!alive.has(id)){item.root.destroy({children:true});this.items.delete(id);}}
 clear(){for(const item of this.items.values())item.root.destroy({children:true});this.items.clear();}
}
