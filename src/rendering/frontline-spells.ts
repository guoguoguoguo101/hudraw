import {Container,Graphics} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {INK_PULSE} from '../gameplay/ink-pulse';
const INK=0x243936,RED=0xbd5037,GOLD=0xe4b873,PAPER=0xffedc8;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Contact={x:number;y:number;age:number;dead:boolean;seed:number};
function seal(g:Graphics,x:number,y:number,angle:number,scale:number,alpha:number){
 const c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;g.save().transform(c,s,-s,c,x,y);
 g.poly([-9,-15,8,-15,11,-10,8,16,-8,15]).fill({color:INK,alpha:alpha*.65});
 g.poly([-10,-18,7,-18,10,-13,7,13,-9,12]).fill({color:PAPER,alpha}).stroke({color:GOLD,width:1,alpha});
 g.poly([-4,-13,3,-13,3,-9,-4,-9]).fill({color:RED,alpha});g.moveTo(-4,-5).lineTo(4,-5).lineTo(-3,1).lineTo(4,3).lineTo(-2,8).stroke({color:RED,width:1.6,alpha});g.restore();
}
function wave(g:Graphics,x:number,y:number,r:number,t:number,alpha:number){
 const points:number[]=[];for(let i=0;i<=52;i++){const a=i/52*Math.PI*2,rr=r*(1+Math.sin(a*7+t*5)*.025+Math.sin(a*13)*.013);points.push(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}
 for(const [color,width,opacity]of [[INK,18,.5],[RED,12,.8],[GOLD,2.5,1]])g.poly(points).stroke({color,width,alpha:alpha*opacity});
}
/** Cosmetic layers follow real effect clocks and contacts. No damage, targets or timers change. */
export class FrontlineSpellRenderer{
 back=new Container();front=new Container();enabled=false;private ground=new Graphics();private art=new Graphics();private maskBack=new Graphics();private maskFront=new Graphics();private contacts:Contact[]=[];private serial=0;private boundsKey='';
 constructor(){this.back.eventMode=this.front.eventMode='none';this.back.addChild(this.ground,this.maskBack);this.front.addChild(this.art,this.maskFront);this.back.mask=this.maskBack;this.front.mask=this.maskFront;}
 clear(){this.contacts=[];this.art.clear();this.ground.clear();}
 hit(x:number,y:number,dead:boolean){if(!this.enabled)return;this.contacts.push({x,y,age:0,dead,seed:++this.serial});if(this.contacts.length>32)this.contacts.shift();}
 update(g:Game,dt:number,low=false){
  this.enabled=g.frontlineTest&&g.state!=='menu';this.back.visible=this.front.visible=this.enabled;if(!this.enabled){this.clear();return;}
  const b=g.hualing.bounds,key=[b.left,b.top,b.right,b.bottom].join(':');if(this.boundsKey!==key){this.boundsKey=key;for(const m of [this.maskBack,this.maskFront])m.clear().rect(b.left,b.top,b.right-b.left,b.bottom-b.top).fill(0xffffff);}
  const a=this.art,d=this.ground;a.clear();d.clear();
  const p=g.pulse.effect;if(p){const t=p.age,expand=1-(1-clamp(t/.23))**3,fade=1-clamp((t-.22)/.48),r=INK_PULSE.radius*(.12+.88*expand);
   // Pigment settles beneath the actor layer; the rim and airborne paper cross in front.
   d.circle(p.x,p.y,r*.95).fill({color:INK,alpha:.26*fade});
   for(let j=0;j<7;j++){const angle=j*2.399+.3,rx=p.x+Math.cos(angle)*r*.53,ry=p.y+Math.sin(angle)*r*.53;d.ellipse(rx,ry,r*.44,r*.25).fill({color:INK,alpha:.09*fade});}
   wave(a,p.x,p.y,r,t,fade);wave(d,p.x,p.y,r*.76,-t,fade*.35);
   for(let i=0;i<7;i++){const angle=i*Math.PI*2/7+t*.4,polar=(angle:number,rr:number)=>({x:p.x+Math.cos(angle)*rr,y:p.y+Math.sin(angle)*rr}),q=polar(angle-.13,r*.62),tip=polar(angle+.29,r*.98),bend=polar(angle+.03,r*1.01),inside=polar(angle+.13,r*.72);
    a.moveTo(q.x,q.y).quadraticCurveTo(bend.x,bend.y,tip.x,tip.y).quadraticCurveTo(inside.x,inside.y,q.x,q.y).fill({color:RED,alpha:fade*.7});
    a.moveTo(q.x,q.y).quadraticCurveTo(bend.x,bend.y,tip.x,tip.y).stroke({color:GOLD,width:1.7,alpha:fade*.85});
   }
   const flash=1-clamp(Math.abs(t-INK_PULSE.impact)/.15);
   a.circle(p.x,p.y,24+flash*21).fill({color:GOLD,alpha:flash*.2});a.poly([p.x,p.y-48*flash,p.x+8,p.y-8,p.x+42*flash,p.y,p.x+8,p.y+8,p.x,p.y+48*flash,p.x-8,p.y+8,p.x-42*flash,p.y,p.x-8,p.y-8]).fill({color:PAPER,alpha:flash});
   for(let i=0;i<(low?8:14);i++){const angle=i*2.399,rr=r*(.5+i%4*.11),xx=p.x+Math.cos(angle)*rr,yy=p.y+Math.sin(angle)*rr-Math.sin(clamp(t/.7)*Math.PI)*24;if(i%3===0)seal(a,xx,yy,angle+t*2,.45+i%2*.2,fade);else{a.save().translateTransform(xx,yy).rotateTransform(angle+t*2).poly([-3,-8,4,-4,3,8,-4,4]).fill({color:i%2?PAPER:RED,alpha:fade}).restore();}}
  }
  for(const scene of g.hualing.scenes)for(const burst of scene.bursts){if(burst.age>.6)continue;const u=clamp(burst.age/.6),fade=1-u,r=30+75*u,p=burst.center;d.ellipse(p.x,p.y,r,r*.55).fill({color:INK,alpha:fade*.15}).stroke({color:GOLD,width:2,alpha:fade});for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;seal(a,p.x+Math.cos(angle)*r,p.y+Math.sin(angle)*r*.55,angle+u, .45,fade);}}
  for(const f of this.contacts){f.age+=Math.max(0,dt);const u=clamp(f.age/(f.dead?.55:.29)),fade=1-u,angle=f.seed*2.399,r=(f.dead?45:24)*Math.sin(u*Math.PI*.5);
   d.ellipse(f.x,f.y+15,r,r*.4).fill({color:INK,alpha:fade*.13});
   a.save().translateTransform(f.x,f.y).rotateTransform(angle);for(const [color,width,opacity]of [[INK,10,.7],[RED,6,1],[PAPER,2,1]])a.moveTo(-r,-r*.45).quadraticCurveTo(0,-8,r,r*.45).stroke({color,width:width*fade,alpha:fade*opacity});a.restore();
   for(let i=0;i<(low?3:f.dead?9:5);i++){const angle=i*2.399+f.seed*.7,dist=r*(.5+i%3*.24),x=f.x+Math.cos(angle)*dist,y=f.y+Math.sin(angle)*dist-24*Math.sin(u*Math.PI),w=(f.dead?4:3)*fade;a.save().translateTransform(x,y).rotateTransform(angle+u*3).poly([-w,-w*1.6,w,-w,w*.7,w*1.6,-w,w]).fill({color:i%3?PAPER:RED,alpha:fade}).restore();}
  }
  this.contacts=this.contacts.filter(f=>f.age<(f.dead?.55:.29));
 }
}
