import {Container,Graphics,GraphicsPath,Rectangle,Text} from 'pixi.js';
import type {Hualing} from '../gameplay/hualing';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import {paperArt,sceneColor,type PaperVector} from './chapter-art/vector-art';

const GOLD=0xe5c486,IVORY=0xffedcf;
// The whale is a separately cached cut-paper layer, lifted from the approved composition.
const WHALE_CUT='M57 99 C87 74 133 92 175 102 L228 105 L286 128 L335 130 L380 151 L441 164 C496 179 558 148 590 118 C571 108 551 76 537 35 C562 66 590 62 610 39 C656 34 690 12 709 0 L720 0 C728 70 691 113 644 142 C619 169 595 201 550 223 C502 257 440 271 379 270 C384 294 411 322 418 347 C361 343 315 314 282 294 C217 286 149 236 103 181 C76 159 58 129 57 99 Z';
const SNOW_BEAST_CUT='M193 8 L224 35 L258 43 L291 62 L337 83 L389 138 C454 149 506 143 559 163 C601 175 632 206 663 228 L716 265 L714 288 C695 312 674 316 646 306 L586 295 C552 298 517 315 488 337 L414 341 L377 300 L400 255 L394 205 L374 170 L347 142 L308 121 L282 99 L246 87 L213 60 Z';
// One slow breath drives the neck, head, eyelid and exhalation together.
const SNOW_PIVOT={x:405,y:330},SNOW_BREATH=6.8;
const snowMotion=(t:number)=>{
 const phase=t/SNOW_BREATH*Math.PI*2,inhale=(1-Math.cos(phase))/2;
 return {x:Math.sin(t*.24)*1.8,y:-inhale*7,rotation:-inhale*.012+Math.sin(t*.29)*.003,scaleX:1+inhale*.004,scaleY:1+inhale*.014,inhale};
};
function onSnowBeast(x:number,y:number,m:ReturnType<typeof snowMotion>){
 const dx=(x-SNOW_PIVOT.x)*m.scaleX,dy=(y-SNOW_PIVOT.y)*m.scaleY,c=Math.cos(m.rotation),s=Math.sin(m.rotation);
 return {x:SNOW_PIVOT.x+m.x+dx*c-dy*s,y:SNOW_PIVOT.y+m.y+dx*s+dy*c};
}
function star(g:Graphics,x:number,y:number,r:number,color:number,alpha=1){
 g.poly([x,y-r,x+r*.2,y-r*.2,x+r,y,x+r*.2,y+r*.2,x,y+r,x-r*.2,y+r*.2,x-r,y,x-r*.2,y-r*.2]).fill({color,alpha});
}
function mist(g:Graphics,x:number,y:number,s:number,alpha:number){
 g.save().transform(s,0,0,s,x,y);
 g.moveTo(-90,9).bezierCurveTo(-103,-3,-78,-14,-61,-6).bezierCurveTo(-64,-31,-18,-36,-12,-14).bezierCurveTo(21,-28,38,-10,27,-2).bezierCurveTo(66,-13,93,-1,88,9).closePath().fill({color:IVORY,alpha});
 g.moveTo(-83,9).lineTo(100,9).stroke({color:GOLD,width:.7,alpha:alpha*.7});g.restore();
}
function inlay(g:Graphics,chapter:HualingChapter,stage:number){
 if(chapter==='snow')return;
 const ink=chapter==='sea'?0x184b5a:0x273451,gold=sceneColor(chapter==='sea'?'sea':'palace',stage,GOLD);
 if(chapter==='sea'){
  // Restore fine identifying cuts that palette simplification intentionally removes.
  g.moveTo(214,182).quadraticCurveTo(226,175,237,184).quadraticCurveTo(225,193,214,182).fill(ink).stroke({color:gold,width:1.4});
  g.ellipse(227,183,3.2,4).fill(gold).circle(228,181,1).fill(IVORY);
  g.moveTo(79,118).bezierCurveTo(141,119,168,154,206,173).stroke({color:gold,width:1.3,alpha:.85});
  g.moveTo(80,131).bezierCurveTo(94,166,143,212,199,237).stroke({color:gold,width:1.1,alpha:.65});
  for(let i=0;i<6;i++)g.moveTo(91+i*14,154+i*13).quadraticCurveTo(137+i*12,219+i*8,173+i*15,234+i*7).stroke({color:0xb5ad8a,width:.7,alpha:.55});
  g.moveTo(367,242).bezierCurveTo(385,221,415,234,398,246).bezierCurveTo(385,255,376,242,387,239).stroke({color:gold,width:1.6,alpha:.8});
  g.moveTo(612,68).quadraticCurveTo(638,102,631,143).moveTo(622,49).quadraticCurveTo(614,96,598,112).stroke({color:gold,width:1,alpha:.7});
 }else{
  for(const [x,y,s] of [[397,199,1],[264,223,.5],[542,209,.55]]){
   g.save().transform(s,0,0,s,x,y);
   g.moveTo(-70,0).quadraticCurveTo(0,19,70,0).moveTo(-55,-2).quadraticCurveTo(0,12,55,-2).stroke({color:gold,width:1,alpha:.8});
   for(let i=-3;i<=3;i++)g.moveTo(i*15,14).lineTo(i*15,47).stroke({color:gold,width:1,alpha:.5});g.restore();
  }
 }
}

/** Approved illustrations are simplified into native vector contours, then cached for play.
 * The two reference PNGs and generated monster sheets are authoring inputs only.
 */
export class ChapterLandscapeRenderer{
 loader?:(chapter:Exclude<HualingChapter,'valley'>)=>Promise<PaperVector>;
 private assets=new Map<string,PaperVector>();private requests=new Set<string>();private retryAt=new Map<string,number>();private message?:Text;
 get ready(){return this.chapter==='valley'||this.assets.has(this.chapter);}
 root=new Container();private layers=new Map<number,Container>();private fx=new Graphics();private chapter:HualingChapter='valley';
 private whales:Container[]=[];private beasts:Container[]=[];
 private ensure(stage:number){
  if(this.layers.has(stage))return;
  const data=this.assets.get(this.chapter)!;
  const palette=this.chapter==='sea'?'sea':this.chapter==='snow'?'snow':'palace';
  const g=paperArt(`${this.chapter}-reference-v02-${stage}`,data,c=>sceneColor(palette,stage,c));
  const layer=new Container(),still=new Container();g.scale.set(720/data.width,1280/data.height);still.addChild(g);
  const details=new Graphics();inlay(details,this.chapter,stage);still.addChild(details);
  if(this.chapter==='sea'){
   // Quiet distant paper colors fill only the sliver revealed as the whale floats.
   const patch=new Graphics().rect(0,0,720,420).fill(sceneColor('sea',stage,0xc6ded0));
   for(let i=0;i<3;i++)patch.moveTo(0,150+i*65).bezierCurveTo(200,95+i*70,470,180+i*55,720,120+i*70).lineTo(720,420).lineTo(0,420).fill({color:sceneColor('sea',stage,0x79afaa),alpha:.18+i*.08});
   layer.addChild(patch);
   const inverse=new Graphics().rect(0,0,720,1280).fill(0xffffff).path(new GraphicsPath(WHALE_CUT)).cut();still.addChild(inverse);still.mask=inverse;
   const whale=new Container(),body=paperArt(`${this.chapter}-reference-v02-${stage}`,data,c=>sceneColor('sea',stage,c));body.scale.set(720/data.width,1280/data.height);
   const rim=new Graphics().path(new GraphicsPath(WHALE_CUT)).fill(0xffffff),lines=new Graphics();inlay(lines,this.chapter,stage);
   whale.addChild(body,lines,rim);whale.mask=rim;whale.boundsArea=new Rectangle(45,-2,675,360);
   whale.pivot.set(360,170);whale.position.set(360,170);whale.cacheAsTexture({resolution:1,antialias:true});this.whales.push(whale);
   layer.addChild(still,whale);
  }else if(this.chapter==='snow'){
   const patch=new Graphics().rect(185,0,535,355).fill(sceneColor('snow',stage,0xd9e0e0));
   layer.addChild(patch);
   const inverse=new Graphics().rect(0,0,720,1280).fill(0xffffff).path(new GraphicsPath(SNOW_BEAST_CUT)).cut();still.addChild(inverse);still.mask=inverse;
   const beast=new Container(),body=paperArt(`${this.chapter}-reference-v02-${stage}`,data,c=>sceneColor('snow',stage,c));body.scale.set(720/data.width,1280/data.height);
   const rim=new Graphics().path(new GraphicsPath(SNOW_BEAST_CUT)).fill(0xffffff);beast.addChild(body,rim);beast.mask=rim;
   beast.boundsArea=new Rectangle(190,0,530,350);beast.pivot.set(SNOW_PIVOT.x,SNOW_PIVOT.y);beast.position.copyFrom(SNOW_PIVOT);beast.cacheAsTexture({resolution:1,antialias:true});this.beasts.push(beast);
   layer.addChild(still,beast);
  }else layer.addChild(still);
  // Masks and contours are resolved once. Only these cached paper layers move during play.
  still.cacheAsTexture({resolution:1,antialias:true});this.layers.set(stage,layer);
  this.root.addChildAt(layer,[...this.layers.keys()].filter(i=>i<stage).length);
 }
 update(m:Hualing,low:boolean){
  if(this.chapter!==m.journey.chapter){
   this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.layers.clear();this.whales=[];this.beasts=[];this.fx=new Graphics();this.root.addChild(this.fx);this.message=undefined;this.chapter=m.journey.chapter;
  }
  if(!this.assets.has(this.chapter)){
   if(!this.message){this.fx.rect(0,0,720,1280).fill(this.chapter==='sea'?0x397e87:0x323e5c);this.message=new Text({text:'纸上山海 · 正在展卷',style:{fontFamily:'KaiTi,serif',fontSize:25,fill:IVORY}});this.message.anchor.set(.5);this.message.position.set(360,530);this.root.addChild(this.message);}
   const chapter=this.chapter;
   if(chapter!=='valley'&&!this.requests.has(chapter)&&Date.now()>=(this.retryAt.get(chapter)??0)&&this.loader){this.requests.add(chapter);this.loader(chapter).then(data=>this.assets.set(chapter,data)).catch(()=>{this.requests.delete(chapter);this.retryAt.set(chapter,Date.now()+3000);if(this.chapter===chapter&&this.message)this.message.text='画卷加载中 · 正在重试';});}
   return;
  }
  if(this.message){this.message.destroy();this.message=undefined;}
  const force=m.bosses.active?m.bosses.sceneForce:0,attack=m.bosses.active?m.bosses.sceneAttack:0,parry=m.bosses.active?m.bosses.sceneParry:0;
  const j=m.journey,t=m.clock,opacity=[1,1-j.weights[0],j.night];
  for(let i=0;i<3;i++){
   if(opacity[i]>.001)this.ensure(i);
   const layer=this.layers.get(i);if(layer){layer.visible=opacity[i]>.001;layer.alpha=opacity[i];}
  }
  for(const whale of this.whales){whale.y=170+Math.sin(t*.48)*6-force*13+attack*10;whale.x=360+Math.sin(t*.23)*3+Math.sin(t*3)*attack*5;whale.rotation=Math.sin(t*.35)*.007-force*.018+parry*.022;}
  const breath=snowMotion(t);for(const beast of this.beasts){beast.position.set(SNOW_PIVOT.x+breath.x,SNOW_PIVOT.y+breath.y);beast.rotation=breath.rotation-force*.014+parry*.02;beast.y-=force*5;beast.scale.set(breath.scaleX+force*.009,breath.scaleY+force*.016);}
  const g=this.fx;g.clear();
  if(this.chapter==='snow'){
   const wind=Math.min(1,j.wind+attack),night=j.night,awake=m.bosses.active||m.bosses.defeated==='snow'||m.scenes.some(s=>s.chapter==='snow'&&s.mode==='fire'&&s.progress>=1);
   if(night>.01){g.circle(91,206,34).fill({color:0xe6eddf,alpha:night*.78});g.circle(91,206,39).stroke({color:GOLD,width:1,alpha:night*.14});}
   for(let i=0;i<(low?28:56);i++){
    const x=(i*137+t*(8+wind*31)+Math.sin(t*.7+i)*8)%780-30,y=(i*83+t*(14+wind*47))%1320-20,r=.7+(i%4)*.4;
    const middle=x>120&&x<600&&y>410,alpha=(.25+.25*Math.sin(i+t*.4)**2)*(middle?.5:1);
    if(i%4===0)g.poly([x,y-r*1.5,x+r,y,x,y+r*1.5,x-r,y]).fill({color:0xf5f1e2,alpha});
    else g.circle(x,y,r).fill({color:0xf5f1e2,alpha});
   }
   // Exhale after the chest reaches its peak, rather than a constant fog emitter.
   const nose=onSnowBeast(691,275,breath);
   if(attack>.05)for(let i=0;i<(low?3:7);i++){const u=(t*.55+i*.14)%1;mist(g,nose.x-u*360,nose.y+u*440,.3+u*1.1,attack*(1-u)*.32);}
   for(let i=0;i<(low?2:4);i++){
    const age=(t-SNOW_BREATH*.48-i*.27+SNOW_BREATH*10)%SNOW_BREATH,u=age/2.8;if(u>1)continue;
    mist(g,nose.x-u*98,nose.y-u*31,.14+u*.48,Math.sin(u*Math.PI)*(.3+night*.08));
   }
   // Loose snow falls from the antlers as the giant raises its head.
   for(let i=0;i<(low?7:14);i++){
    const u=(t/9+i*.071)%1;if(u>.48)continue;const fall=u/.48,side=i%3;
    const origin=onSnowBeast([292,359,464][side],[80,111,149][side],breath);
    const x=origin.x+Math.sin(i*4.7+fall*3)*17+fall*(12+j.wind*26),y=origin.y+fall*fall*106;
    const r=1.2+i%3*.7;g.poly([x-r,y,x,y-r*.6,x+r,y+1,x,y+r]).fill({color:0xf4f0e4,alpha:Math.sin(fall*Math.PI)*.72});
   }
   // A few distant birds give the otherwise still left-hand mountains some scale.
   for(let i=0;i<(low?2:3);i++){
    const x=((t*9+i*39)%390)-35,y=223+i*15+Math.sin(t*.65+i)*5,wing=Math.sin(t*3.4+i)*3;
    g.moveTo(x-5,y+wing).quadraticCurveTo(x-2,y-2,x,y).quadraticCurveTo(x+2,y-2,x+5,y+wing).stroke({color:0x3d5362,width:1.2,alpha:.45});
   }
   for(let i=0;i<(low?2:3);i++)mist(g,(i*273+t*(4+wind*8))%1050-130,355+i*98,.9,.075+wind*.045);
   if(wind>.15)for(let i=0;i<3;i++){
    const x=(t*60+i*271)%1120-240,y=265+i*125;g.moveTo(x,y).bezierCurveTo(x+65,y-15,x+130,y+18,x+205,y-5).stroke({color:0xe9eade,width:1,alpha:wind*.2});
   }
   const eye=onSnowBeast(597,229,breath);
   if(awake){
    const blink=Math.max(0,1-Math.abs(t%7.4-6.9)/.18),x=eye.x,y=eye.y,open=(.75+.2*breath.inhale)*(1-blink);
    g.moveTo(x-13,y-4).quadraticCurveTo(x+1,y-9*open,x+14,y+5).quadraticCurveTo(x,y+7*open,x-13,y-4).fill(0xe7c77f).stroke({color:0x3b5361,width:1});
    g.ellipse(x+1,y,2.2,4*open).fill(0x243d51).circle(x+3,y-2,1).fill(0xfff3d0);
   }else{
    const twitch=Math.max(0,1-Math.abs(t%11-8.4)/.6);
    g.moveTo(eye.x-12,eye.y-3).quadraticCurveTo(eye.x,eye.y+3+twitch*2,eye.x+13,eye.y+4).stroke({color:0x4c6070,width:1.8,alpha:.5+twitch*.3});
   }
   for(let i=0;i<7;i++){
    const p=onSnowBeast(474+i*18,301+Math.sin(i*.7)*13,breath),pulse=(Math.sin(t*1.15-i*.7)+1)/2;
    g.circle(p.x,p.y,awake?1.7:1.1).fill({color:GOLD,alpha:(awake?.45:.12)+pulse*(awake?.45:.24)});
    if(i){const prev=onSnowBeast(474+(i-1)*18,301+Math.sin((i-1)*.7)*13,breath);g.moveTo(prev.x,prev.y).lineTo(p.x,p.y).stroke({color:GOLD,width:awake?1:.7,alpha:(awake?.26:.07)+pulse*.17});}
   }
  }else if(this.chapter==='sea'){
   const night=j.night,wind=Math.min(1,j.wind+force*.65);
   // Slow broad ripples and drifting fish leave the center calm and the line art readable.
   for(let i=0;i<(low?8:16);i++){
    const y=460+(i*49+t*17)%730,x=72+Math.sin(i*1.7+t*.45)*43,len=220+i%4*65;
    g.moveTo(x,y).bezierCurveTo(x+len*.3,y-9,x+len*.6,y+7,x+len,y-3).stroke({color:night>.3?0x99d9df:0xf1e5b7,width:i%4?1:2,alpha:.18+.07*Math.sin(t*.7+i)**2});
   }
   for(let i=0;i<(low?3:6);i++){
    const y=590+(i*103+t*23)%650,x=360+Math.sin(t*.5+i)*80;
    g.ellipse(x,y,115+(i%3)*35,12+(i%2)*7).stroke({color:0xbfe7d9,width:1.2,alpha:.13});
   }
   for(let i=0;i<(low?5:11);i++){
    const x=(i*137+t*(7+wind*6))%940-110,y=343+i*21+Math.sin(t*.5+i)*6,r=i%3+2;
    g.save().transform(1,0,0,1,x,y).moveTo(-r*2,0).quadraticCurveTo(0,-r,r*2,0).quadraticCurveTo(0,r,-r*2,0).fill({color:i%3?0x286a79:GOLD,alpha:.32}).poly([-r*2,0,-r*3,-r,-r*3,r]).fill({color:GOLD,alpha:.3}).restore();
   }
   for(let i=0;i<(low?3:5);i++)mist(g,(i*194+t*12)%960-120,330+i%3*66,.8,.18);
   if(j.stage==='wind')for(let i=0;i<(low?7:15);i++){
    const x=i%2?654+Math.sin(t*.5+i)*24:56+Math.sin(t*.4+i)*22,y=545+(i*71-t*9+1500)%610;
    g.ellipse(x,y,2,4).fill({color:0xffc49b,alpha:.24});
   }
   if(night>.01){
    // Moon reflection and bioluminescent paper pearls distinguish the final bay.
    for(let i=0;i<(low?8:15);i++){
     const x=i%2?646+Math.sin(t*.4+i)*30:68+Math.sin(t*.5+i)*27,y=490+i*43+Math.cos(t*.6+i)*7;
     g.circle(x,y,2+i%2).fill({color:0xb3efdf,alpha:night*(.22+.25*Math.sin(t+i)**2)});
    }
    for(let i=0;i<9;i++){const x=365+Math.sin(i*2.4+t*.2)*24,y=510+i*15;g.moveTo(x-12-i*2,y).lineTo(x+12+i*2,y).stroke({color:IVORY,width:1,alpha:night*.1});}
   }
  }else{
   const day=j.stage==='sunset',sun=j.stage==='wind';
   for(let i=0;i<(low?15:34);i++){
    const x=28+i*137%660,y=24+i*79%460,a=(day?.12:.3)+.25*Math.sin(t*.7+i)**2;
    star(g,x,y,i%11?1.3:3.8,GOLD,a);
   }
   // Fine orbit glints follow the star instrument in the approved composition.
   if(!day)for(let i=0;i<(low?3:6);i++){
    const a=t*.035+i*Math.PI/3,x=414+Math.cos(a)*139,y=130+Math.sin(a)*65;
    star(g,x,y,i%2?2.1:3.2,sun?0xffdf9c:IVORY,.72);
   }
   for(let ring=0;ring<3;ring++){
    const angle=t*(ring%2?-.085:.065)+ring*.8+force*(ring%2?-.3:.3);
    g.save().transform(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),428,123).ellipse(0,0,137+ring*5,45+ring*8).stroke({color:GOLD,width:ring===1?1.8:1.1,alpha:day?.5:.8});
    for(let k=0;k<3;k++){const a=k*Math.PI*2/3+t*.08;star(g,Math.cos(a)*(137+ring*5),Math.sin(a)*(45+ring*8),3,GOLD,.9);}g.restore();
   }
   for(let i=0;i<(low?3:5);i++)mist(g,(i*207+t*(sun?23:16))%1100-170,330+i%3*78,1.08,.29);
   // Gentle cloud flow around the court, away from brush targets.
   for(let i=0;i<4;i++)mist(g,(i%2?704:14)+Math.sin(t*.35+i)*28,680+i*107+Math.sin(t*.4+i)*12,1,.34);
   if(sun)for(let i=0;i<(low?4:8);i++){
    const x=i%2?647:71,y=460+(i*97-t*8+1600)%650;
    g.poly([x,y-3,x+2,y,x,y+7,x-2,y]).fill({color:0xffd199,alpha:.38});
   }
  }
 }
}
