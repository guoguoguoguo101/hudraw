import {Container,Graphics} from 'pixi.js';
import type {Enemy,Skill} from '../core/types';
import {CIRCLE_BREAK_FADE} from '../gameplay/circle';
import {SealRitual,sealFlower} from './seal-ornaments';
const RED=0xe74631,GOLD=0xf0be72,CREAM=0xffedc9,INK=0x161b22;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function crest(g:Graphics,size:number){
 g.poly([0,-size,size,0,0,size,-size,0]).fill({color:INK,alpha:.8}).stroke({color:RED,width:3});
 g.poly([0,-size*.8,size*.8,0,0,size*.8,-size*.8,0]).stroke({color:GOLD,width:1});
 const u=size*.37;g.moveTo(-u,-u).lineTo(u,-u).lineTo(u,0).lineTo(-u,0).lineTo(-u,u).lineTo(u,u).moveTo(0,-u*1.45).lineTo(0,u*1.45).stroke({color:CREAM,width:2.2});
}
/** Independent flat seal artwork. The existing ward/fox-spirit assets are untouched. */
export class DemonSeal{
 root=new Container();front=new Container();inner=new Container();outer=new Container();core=new Graphics();pulse=new Graphics();marks=new Graphics();chains=new Graphics();
 gates:Container[]=[];papers:Container[]=[];shards:Graphics[]=[];
 ritual:SealRitual;
 constructor(public level:number,public radius:number){
  const r=radius,base=new Graphics();this.root.addChild(base,this.outer,this.inner,this.core,this.chains);
  base.circle(0,0,r).fill({color:INK,alpha:.42}).circle(0,0,r*.68).fill({color:RED,alpha:.075});
  base.circle(0,0,r).stroke({color:RED,width:13,alpha:.12}).circle(0,0,r).stroke({color:RED,width:3.5});
  base.circle(0,0,r-7).stroke({color:GOLD,width:1.5,alpha:.85});
  for(let j=0;j<2+Math.min(level,3);j++){
   const g=new Graphics(),rr=r*(.86-j*.135);(j%2?this.inner:this.outer).addChild(g);
   g.circle(0,0,rr).stroke({color:j%2?GOLD:RED,width:j===0?2.3:1.4,alpha:.8});
   const count=j===0?64:12+level*4;
   for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count,x=Math.cos(a)*rr,y=Math.sin(a)*rr;
    if(j===0){const len=i%4===0?12:5;g.moveTo(x,y).lineTo(Math.cos(a)*(rr-len),Math.sin(a)*(rr-len)).stroke({color:GOLD,width:1.2,alpha:.8});}
    else if(i%2===0)g.poly([x,y-4,x+4,y,x,y+4,x-4,y]).stroke({color:GOLD,width:1,alpha:.8});
   }
  }
  const geometric=new Graphics();this.inner.addChild(geometric);
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2,x=Math.cos(a)*r*.56,y=Math.sin(a)*r*.56;
   geometric.moveTo(x,y).lineTo(Math.cos(a+Math.PI/2)*r*.56,Math.sin(a+Math.PI/2)*r*.56).stroke({color:GOLD,width:1.2,alpha:.5});
   if(level>=2)geometric.moveTo(x,y).quadraticCurveTo(0,0,Math.cos(a+Math.PI*.75)*r*.7,Math.sin(a+Math.PI*.75)*r*.7).stroke({color:RED,width:1.5,alpha:.35});
  }
  crest(this.core,Math.min(48,25+level*6));
  if(level>=3){for(let i=0;i<8;i++){const c=new Graphics(),a=i*Math.PI/4;c.position.set(Math.cos(a)*r*.7,Math.sin(a)*r*.7);c.scale.set(.43);crest(c,28);this.outer.addChild(c);}}
  for(let i=0;i<[4,6,8,12][level-1];i++){
   const p=new Container(),g=new Graphics();p.addChild(g);this.front.addChild(p);this.papers.push(p);
   const wide=level>=3?18:13,length=level>=3?40:31;
   g.moveTo(-wide,-length).lineTo(wide,-length).quadraticCurveTo(wide-4,0,wide+3,length-2).lineTo(-wide+2,length+4).quadraticCurveTo(-wide-5,2,-wide,-length).fill({color:CREAM}).stroke({color:RED,width:1.5});
   g.moveTo(-wide+4,-length+5).lineTo(wide-4,-length+5).stroke({color:GOLD,width:1});
   g.circle(0,-length*.48,10).fill({color:RED});sealFlower(g,0,-length*.48,7);
   g.moveTo(0,-3).lineTo(0,length-7).moveTo(-7,3).lineTo(7,7).moveTo(-7,14).lineTo(7,17).moveTo(-5,length-9).lineTo(0,length-15).lineTo(6,length-7).stroke({color:RED,width:2});
  }
  if(level===4){
   for(let i=0;i<4;i++){
    const gate=new Container(),g=new Graphics(),a=-Math.PI/2+i*Math.PI/2;gate.position.set(Math.cos(a)*r*.81,Math.sin(a)*r*.81);gate.addChild(g);(gate.y>0?this.front:this.root).addChild(gate);this.gates.push(gate);
    g.rect(-36,-46,11,88).rect(25,-46,11,88).fill({color:RED});
    g.rect(-42,-26,84,10).fill({color:RED}).stroke({color:GOLD,width:1});
    g.moveTo(-57,-65).bezierCurveTo(-26,-55,26,-55,57,-65).lineTo(47,-48).quadraticCurveTo(0,-40,-47,-48).closePath().fill({color:INK}).stroke({color:GOLD,width:1.6});
    g.moveTo(-32,-42).lineTo(-32,40).moveTo(32,-42).lineTo(32,40).stroke({color:GOLD,width:1.5,alpha:.7});
    g.moveTo(-26,-9).quadraticCurveTo(0,8,26,-9).stroke({color:GOLD,width:2});
    g.rect(-8,2,16,31).fill({color:CREAM});g.moveTo(0,6).lineTo(0,28).moveTo(-5,12).lineTo(5,15).moveTo(-5,22).lineTo(5,20).stroke({color:RED,width:1.7});
    g.moveTo(-45,45).lineTo(-25,45).moveTo(25,45).lineTo(45,45).stroke({color:GOLD,width:3});
    g.rect(-42,-29,84,3).fill({color:CREAM,alpha:.6});g.circle(0,-49,12).fill({color:RED}).stroke({color:GOLD,width:1.6});sealFlower(g,0,-49,8);
    for(const sign of [-1,1]){g.rect(sign*31-5,-39,10,5).fill({color:GOLD});g.rect(sign*31-5,31,10,4).fill({color:GOLD});
     g.poly([sign*12,-7,sign*20,1,sign*15,8,sign*23,15,sign*16,22,sign*10,16,sign*14,10,sign*7,3]).fill({color:CREAM});}
   }
   for(let i=0;i<4;i++){
    const a=-Math.PI/2+i*Math.PI/2,b=a+Math.PI/2,rr=r*.81;
    for(let k=0;k<=30;k++){
     const u=a+(b-a)*k/30,x=Math.cos(u)*rr,y=Math.sin(u)*rr;
     if(k===0)this.chains.moveTo(x,y);else this.chains.lineTo(x,y);
    }
    this.chains.stroke({color:RED,width:2.8,alpha:.75});
    for(let k=0;k<=30;k+=3){const u=a+(b-a)*k/30,x=Math.cos(u)*rr,y=Math.sin(u)*rr;this.chains.poly([x-3,y,x,y-3,x+3,y,x,y+3]).stroke({color:GOLD,width:1,alpha:.7});}
   }
  }
  this.front.addChild(this.marks,this.pulse);
  this.pulse.circle(0,0,r).stroke({color:RED,width:9,alpha:.3}).circle(0,0,r).stroke({color:CREAM,width:2.5});
  for(let i=0;i<20;i++){const g=new Graphics();g.poly([-3,-9,4,-2,2,10,-3,3]).fill({color:i%3?RED:GOLD});this.front.addChild(g);this.shards.push(g);}
  this.ritual=new SealRitual(level,radius);this.root.addChild(this.ritual.back);this.front.addChildAt(this.ritual.front,0);
 }
 update(s:Skill,enemies:Enemy[]){
  const t=s.age,r=this.radius,open=1-(1-clamp(t/.38))**3;
  this.inner.rotation=-t*.12*s.geometry.winding;this.outer.rotation=t*.08*s.geometry.winding;
  this.core.alpha=(.7+Math.sin(t*3)*.12)*clamp(t/.2);this.core.scale.set(.7+.3*open);
  this.chains.alpha=clamp((t-.26)/.35)*(.8+.2*Math.sin(t*2)**2);
  this.gates.forEach((gate,i)=>{const u=clamp((t-.18-i*.055)/.28);gate.scale.set(.75+.25*u);gate.alpha=u;});
  this.papers.forEach((paper,i)=>{
   const a=i*Math.PI*2/this.papers.length-.3-t*.09*s.geometry.winding,rr=r*(.91+Math.sin(t*2+i)*.008);
   paper.position.set(Math.cos(a)*rr*open,Math.sin(a)*rr*open);paper.rotation=a-Math.PI/2+Math.sin(t*2+i)*.045;paper.alpha=clamp((t-.12-i*.012)/.18);
  });
  this.marks.clear();
  if(!s.circle?.broken)for(const e of enemies){
   const x=e.x-s.x,y=e.y-s.y;if(!s.circle?.captured.has(e.id)||e.hp<=0||Math.hypot(x,y)>r)continue;
   const size=e.kind==='oni'?36:e.kind==='boss'?52:24,alpha=e.kind==='boss'?.3:e.kind==='oni'?.45:.75;
   for(const sign of [-1,1])this.marks.moveTo(x+sign*size,y-16).lineTo(x+sign*size,y-25).lineTo(x+sign*(size-9),y-25).moveTo(x+sign*size,y+18).lineTo(x+sign*size,y+25).lineTo(x+sign*(size-9),y+25);
   this.marks.stroke({color:GOLD,width:1.6,alpha});
   if(this.level===4){const a=Math.atan2(y,x),gx=Math.cos(a)*r*.8,gy=Math.sin(a)*r*.8;this.marks.moveTo(gx,gy).quadraticCurveTo((gx+x)*.5,(gy+y)*.5-18,x,y).stroke({color:RED,width:1.1,alpha:.2});}
  }
  const breaking=clamp((t-(s.duration-CIRCLE_BREAK_FADE))/CIRCLE_BREAK_FADE);
  this.ritual.update(t,breaking);
  const ignition=clamp((t-.08)/.48);this.pulse.scale.set(breaking>0?1+breaking*.1:.55+ignition*.45);this.pulse.alpha=breaking>0?Math.sin(breaking*Math.PI):Math.max(0,1-ignition)*clamp(t/.08);
  this.shards.forEach((g,i)=>{const a=i*Math.PI*2/this.shards.length;g.position.set(Math.cos(a)*r*(.94+breaking*.19),Math.sin(a)*r*(.94+breaking*.19));g.rotation=a+breaking*(i%2?1:-1);g.alpha=breaking>0?Math.sin(breaking*Math.PI):0;});
 }
}
