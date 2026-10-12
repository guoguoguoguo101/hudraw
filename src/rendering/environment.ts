import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
import {sprite,type Art} from './rigs';
import type {State} from '../core/types';

/** Decorative layers only. No world positions, timers or combat rules are changed. */
export class Environment{
 sunlight=new Graphics();water=new Graphics();waterMask=new Graphics();rune=new Graphics();banners=new Graphics();branches!:Sprite;lastTime=0;castAge=10;castRune='circle';
 back=new Container();front=new Container();sun!:Sprite;layers:Record<string,Sprite>={};clouds:Sprite[]=[];mist:Sprite[]=[];lanterns:Sprite[]=[];leaves:Sprite[]=[];papers:Sprite[]=[];
 constructor(art:Art,textures:Record<string,Texture>){
  for(const name of ['sky','sun','far_mountains','valley','shrines','arena']){const s=new Sprite(textures[name]);this.layers[name]=s;this.back.addChild(s);if(name==='sun'){this.sun=s;s.pivot.set(365,268);s.position.set(365,268);this.back.addChild(this.sunlight);}if(name==='valley')this.back.addChild(this.water,this.waterMask);}
  // Masks follow the authored river and waterfall exactly; moving highlights cannot spill onto rock.
  this.waterMask.moveTo(356,450).bezierCurveTo(398,463,357,483,357,483).bezierCurveTo(299,495,339,506,339,506).bezierCurveTo(452,528,413,551,413,551).bezierCurveTo(351,566,434,595,434,595).lineTo(562,725).lineTo(152,725).bezierCurveTo(262,640,335,606,335,606).bezierCurveTo(388,577,315,560,315,560).bezierCurveTo(231,538,296,516,296,516).bezierCurveTo(338,503,309,493,309,493).bezierCurveTo(300,478,348,470,348,470).closePath().fill(0xffffff);
  this.waterMask.moveTo(648,380).quadraticCurveTo(641,452,619,479).quadraticCurveTo(626,515,600,547).lineTo(609,550).quadraticCurveTo(638,519,631,485).quadraticCurveTo(650,449,655,383).closePath().fill(0xffffff);this.water.mask=this.waterMask;
  this.back.addChild(this.rune);
  for(let i=0;i<5;i++){const s=sprite(art,'cloud',this.back,[42,594,166,550,365][i],[225,183,360,408,525][i],[.57,.60,.41,.33,.44][i]);s.alpha=[.68,.67,.38,.28,.16][i];this.clouds.push(s);}
  this.front.addChild(new Sprite(textures.foreground));this.branches=new Sprite(textures.branches);this.branches.pivot.set(360,100);this.branches.position.set(360,100);this.front.addChild(this.branches,this.banners);
  for(let i=0;i<6;i++){const s=sprite(art,'env_lantern',this.front,[56,664,102,617,65,668][i],[513,466,925,846,1152,1084][i],[.46,.4,.57,.44,.73,.68][i]);this.lanterns.push(s);}
  for(let i=0;i<4;i++){const s=sprite(art,'env_mist',this.back,[-5,697,104,650][i],[580,548,946,1060][i],i<2?1.2:1.5);s.alpha=i<2?.09:.055;this.mist.push(s);}
  for(let i=0;i<14;i++){const s=sprite(art,'env_leaf',this.front,0,0,.15+i%4*.025);s.alpha=.7;this.leaves.push(s);}
  for(let i=0;i<5;i++){const s=sprite(art,'env_talisman',this.front,0,0,.18+i%3*.025);s.alpha=.63;this.papers.push(s);}
 }
 cast(rune:string){this.castAge=0;this.castRune=rune;}
 update(t:number,progress:number,state:State){
  this.castAge+=Math.max(0,t-this.lastTime);this.lastTime=t;
  // Subpixel paper-cut parallax: the floor and combat coordinates remain stable.
  this.layers.far_mountains.x=Math.sin(t*.12)*1.6;this.layers.valley.x=Math.sin(t*.12+.6)*.7;this.layers.shrines.x=this.layers.valley.x;
  this.branches.rotation=Math.sin(t*.63)*.0035+Math.sin(t*1.1)*.001;
  this.sun.scale.set(1+Math.sin(t*.32)*.0025);this.sun.y=268+Math.sin(t*.18)*.8;
  this.sunlight.clear();for(let j=0;j<3;j++)this.sunlight.circle(365,268,176+j*3+Math.sin(t*.38)*1.5).stroke({color:0xe7ba68,width:1+j*.5,alpha:(.055-j*.012)*(1+Math.sin(t*.55)*.25)});
  // Moving river glints, descending waterfall threads and a quiet splash at its foot.
  this.water.clear();for(let i=0;i<38;i++){const y=466+(i*17+t*5)%111,x=285+(i*43%135)+Math.sin(t*.4+i)*12;this.water.moveTo(x,y).lineTo(x+9+i%5*6,y).stroke({color:i%3?0xe7ba68:0xfff7e8,width:i%3?.8:1.2,alpha:.13+.13*(.5+.5*Math.sin(t*1.4+i))});}
  for(let i=0;i<14;i++){const u=(t*.16+i/14)%1,y=386+u*156,x=y<480?650-(y-386)*.25:627-(y-480)*.30;this.water.moveTo(x+i%3*1.2,y).quadraticCurveTo(x-1,y+5,x-2,y+10).stroke({color:0xfff7e8,width:1,alpha:Math.sin(u*Math.PI)*.42});}
  for(let i=0;i<4;i++){const u=(t*.48+i*.25)%1;this.water.ellipse(606,544,3+u*14,1+u*3).stroke({color:0xf3e7cb,width:.8,alpha:(1-u)*.16});}
  // Banner tops stay tied to the gate; the free hem curves with the wind.
  this.banners.clear();for(const [x,y,w,h,phase] of [[18,674,20,72,0],[697,624,19,64,1.7]]){const wind=Math.sin(t*1.6+phase)*3.5;this.banners.moveTo(x-w/2,y).lineTo(x+w/2,y).bezierCurveTo(x+w/2+wind,y+h*.35,x+w/2-wind,y+h*.7,x+w/2+wind,y+h).lineTo(x+wind,y+h-7).lineTo(x-w/2+wind,y+h).bezierCurveTo(x-w/2-wind,y+h*.7,x-w/2+wind,y+h*.35,x-w/2,y).fill({color:0x8b2333}).stroke({color:0xe7ba68,width:.7,alpha:.75});this.banners.moveTo(x,y+12).lineTo(x+wind*.4+5,y+23).lineTo(x+wind*.6-5,y+35).lineTo(x+wind*.7+5,y+39).lineTo(x+wind*.8-4,y+52).stroke({color:0xe7ba68,width:1,alpha:.75});}
  // Perspective engraving wakes briefly beneath a cast, then settles back into the stone.
  this.rune.clear();const pulse=this.castAge<1.4?Math.sin(Math.min(1,this.castAge/.18)*Math.PI/2)*Math.exp(-this.castAge*2.6):0;
  if(pulse>.005){const radius=this.castRune==='circle'?181:165;this.rune.ellipse(360,719,radius, radius*.36).stroke({color:0xe7ba68,width:1.8,alpha:pulse*.32});this.rune.ellipse(360,719,radius-15,(radius-15)*.36).stroke({color:0xfff7e8,width:.9,alpha:pulse*.2});for(let i=0;i<8;i++){const a=i*Math.PI/4,x=360+Math.cos(a)*(radius-28),y=719+Math.sin(a)*(radius-28)*.36;this.rune.moveTo(x,y-5).lineTo(x+5,y).lineTo(x,y+5).lineTo(x-5,y).closePath().fill({color:0xe7ba68,alpha:pulse*.28});}}
  // A gradual bloodmoon grade only changes artwork; the battle model remains untouched.
  const f=['menu','tutorial'].includes(state)?0:Math.max(0,Math.min(1,(progress-30)/18));const blend=f*f*(3-2*f);
  const tint=(to:number)=>{const r=255+((to>>16&255)-255)*blend,g=255+((to>>8&255)-255)*blend,b=255+((to&255)-255)*blend;return (Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b);};
  this.layers.sky.tint=tint(0x55313a);this.layers.far_mountains.tint=tint(0xb97d77);this.layers.valley.tint=tint(0xd6a391);this.layers.shrines.tint=tint(0xd6a391);
  this.clouds.forEach((s,i)=>{s.x=[42,594,166,550,365][i]+Math.sin(t*.09+i)*23;});
  this.mist.forEach((s,i)=>{s.x=[-5,697,104,650][i]+Math.sin(t*.12+i)*34;s.alpha=(i<2?.08:.045)+Math.sin(t*.2+i)*.012;});
  this.lanterns.forEach((s,i)=>{s.alpha=.84+.16*Math.sin(t*1.7+i*.83);s.rotation=Math.sin(t*.7+i)*.035;});
  this.leaves.forEach((s,i)=>{const phase=(t*(13+i%3*3)+i*97)%1100;s.position.set(i%2?650+Math.sin(t*.38+i)*44:62+Math.sin(t*.4+i)*49,160+phase);s.rotation=t*(i%2?.38:-.31)+i;});
  this.papers.forEach((s,i)=>{s.position.set(i%2?645+Math.sin(t*.2+i)*23:73+Math.sin(t*.24+i)*21,330+(t*9+i*153)%770);s.rotation=Math.sin(t*.7+i)*.24;s.scale.x=(.18+i%3*.025)*(.78+.22*Math.cos(t*.8+i));});
 }
}
