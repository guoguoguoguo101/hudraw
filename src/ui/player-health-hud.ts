import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {WORLD} from '../core/types';
import {text} from './interface';
import {MOUNTAIN_THEMES} from './mountain-theme';

/** Health stays separate from ink/XP, close to the player's combat controls. */
export class PlayerHealthHUD{
 readonly root=new Container();private paper=new Graphics();private art=new Graphics();private nearby=new Graphics();
 private value:Text;private status:Text;private artKey='';private paperKey='';
 private lastLife=0;private lastMax=0;private trail=1;private lastClock=0;private lastGameTime=0;private changedAt=-10;private change=0;private initialized=false;private level:number|null=null;
 private reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 constructor(){
  this.root.eventMode='none';this.root.addChild(this.paper,this.art,this.nearby);
  const label=text(this.root,'生命',96,0,23,0xfff1d5,{letterSpacing:1,fontWeight:'bold'});label.anchor.x=0;label.name='health-label';
  this.value=text(this.root,'',662,0,25,0xfff1d5,{letterSpacing:0,fontWeight:'bold',fontFamily:['Georgia','serif']});this.value.anchor.x=1;
  this.status=text(this.root,'',360,0,20,0xffdbb9,{letterSpacing:0,fontWeight:'bold'});
 }
 update(game:Game,footer:number){
  const c=game.campaign,clock=c.age,maximum=Math.max(1,game.maxHp),life=Math.max(0,Math.min(maximum,game.life)),ratio=life/maximum;
  if(!this.initialized||this.level!==c.levelId||clock<this.lastClock||game.time<this.lastGameTime){
   this.initialized=true;this.level=c.levelId;this.lastLife=life;this.lastMax=maximum;this.trail=ratio;this.changedAt=-10;this.change=0;
  }
  this.lastGameTime=game.time;
  const dt=Math.min(.1,Math.max(0,clock-this.lastClock));this.lastClock=clock;
  if(this.lastMax!==maximum){this.lastMax=maximum;this.trail=ratio;this.lastLife=life;this.change=0;this.changedAt=-10;}
  if(life!==this.lastLife){
   this.change=life-this.lastLife;this.changedAt=clock;
   this.trail=this.change>0?ratio:Math.max(this.trail,this.lastLife/maximum);
   this.lastLife=life;
  }
  const age=clock-this.changedAt,damaged=this.change<0&&age<.85,healed=this.change>0&&age<.85,critical=ratio<=.3;
  if(age>.28)this.trail=Math.max(ratio,this.trail-dt*.7);
  const chapter=c.level?.chapter??game.hualing.journey.chapter,t=MOUNTAIN_THEMES[chapter],dark=chapter==='palace';
  const color=critical?0xd74d3e:ratio<=.5?0xb07c3d:0xb65b48;
  const pulse=this.reducedMotion?1:.72+.28*Math.sin(clock*5)**2;
  const ghost=Math.max(0,Math.min(1,this.trail));
  const y=footer+990,x=96,w=566,h=11,by=y+42;
  const label=this.root.getChildByName('health-label')!;
  const paperKey=[chapter,footer].join(':');
  if(this.paperKey!==paperKey){
   this.paperKey=paperKey;const p=this.paper;p.clear();
   // A slim folded paper tag shares the chapter's scroll material. Its frame and
   // quiet fibers are immutable while life and damage trails move above it.
   p.poly([39,y+5,681,y+5,690,y+14,687,y+65,35,y+65,30,y+56,33,y+13]).fill({color:t.dark,alpha:.19});
   p.poly([38,y+1,677,y+1,687,y+11,685,y+59,35,y+59,29,y+50,32,y+10]).fill({color:t.paper,alpha:.96}).stroke({color:t.line,width:1,alpha:.8});
   p.poly([677,y+1,677,y+12,687,y+11]).fill({color:t.line,alpha:.42});
   p.moveTo(39,y+8).lineTo(668,y+8).moveTo(39,y+55).lineTo(675,y+55).stroke({color:t.line,width:.7,alpha:.34});
   p.moveTo(84,y+12).lineTo(84,y+48).stroke({color:t.line,width:.8,alpha:.55});
   p.poly([44,y+17,73,y+14,77,y+43,48,y+47]).fill({color:t.accent,alpha:dark?.25:.1}).stroke({color:t.accent,width:.7,alpha:.4});
   p.rect(x,by,w,h).fill({color:t.ink,alpha:dark?.13:.12});
   for(let i=1;i<4;i++)p.moveTo(x+w*i/4,by+2).lineTo(x+w*i/4,by+h-2).stroke({color:t.paper,width:1,alpha:.7});
   for(let i=0;i<8;i++){const px=112+i*67,py=y+13+(i%3)*9;p.moveTo(px,py).lineTo(px+7,py-1).stroke({color:t.muted,width:.6,alpha:.1});}
   label.y=y+20;this.value.y=this.status.y=y+20;
   (label as Text).style.fill=t.ink;this.value.style.fill=t.ink;
  }
  // Stable full life never rebuilds either the paper or the health geometry.
  const artKey=[chapter,footer,life,maximum,ghost,damaged,healed,critical,critical?pulse:1,this.change].join(':');
  if(artKey===this.artKey)return;this.artKey=artKey;
  const g=this.art;g.clear();this.nearby.clear();
  if(damaged||critical)g.poly([38,y+1,677,y+1,687,y+11,685,y+59,35,y+59,29,y+50,32,y+10]).stroke({color:dark?0xffa68c:0xc74736,width:critical?2.1:1.7,alpha:critical?pulse:.9});
  // An angular heart reads as a small cut-paper seal rather than a glossy icon.
  g.poly([61,y+42,48,y+31,48,y+24,54,y+20,61,y+25,68,y+20,74,y+24,74,y+31]).fill(color);
  g.poly([61,y+25,68,y+20,74,y+24,74,y+31,61,y+42]).fill({color:0x702c29,alpha:.16});
  if(ghost>ratio&&ghost*w>.1)g.rect(x,by,w*ghost,h).fill({color:t.line,alpha:.8});
  if(ratio>0){const fill=w*ratio;g.rect(x,by,fill,h).fill(color);if(fill>6)g.moveTo(x+2,by+2).lineTo(x+fill-2,by+2).stroke({color:dark?0xffdcaa:t.paper,width:1,alpha:.42});}
  for(let i=1;i<4;i++)g.moveTo(x+w*i/4,by+2).lineTo(x+w*i/4,by+h-2).stroke({color:t.paper,width:1,alpha:.55});
  this.value.text=`${Math.ceil(life)} / ${Math.ceil(maximum)}`;
  this.status.text=damaged?`受伤 −${Math.ceil(-this.change)}`:healed?`恢复 +${Math.ceil(this.change)}`:critical?'生命危险':ratio<=.5?'生命偏低':'';
  this.status.style.fill=healed?(dark?0xb7e1bc:0x2b6f56):critical||damaged?(dark?0xffa28d:0xaf3e30):(dark?0xf3c983:0x8d6433);
  // A local reminder is visible only when it is useful, directly below the fox.
  if(critical||damaged){
   const n=this.nearby,nx=WORLD.foxX-52,ny=WORLD.foxY+48;
   n.roundRect(nx-5,ny-5,114,20,6).fill({color:0x10252a,alpha:.94}).stroke({color:0xffc8a3,width:1,alpha:critical?pulse:.8});
   n.roundRect(nx,ny,104,10,3).fill(0x07171b);
   if(ratio>0)n.roundRect(nx,ny,104*ratio,10,Math.min(3,52*ratio)).fill(color);
  }
 }
}
