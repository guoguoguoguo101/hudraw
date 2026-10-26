import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import {comboTier,comboPraise,strokeTitle} from '../gameplay/hualing-combo';
import {text} from './interface';
const GOLD=0xe9bc70,IVORY=0xffefd0,RED=0xd95036,INK=0x172724;

/** Brush swipes and cut-paper flecks, inspired by the archived AI direction sheet. */
export class HualingComboUI{
 root=new Container();private chain=new Container();private stroke=new Container();private chainArt=new Graphics();private strokeArt=new Graphics();private timer=new Graphics();private sparks=new Graphics();
 private label:Text;private count:Text;private hint:Text;private strokeLabel:Text;private strokeHint:Text;private seal:Text;private lastTier=-1;private lastStrokeTier=-1;
 constructor(private game:Game){
  this.root.scale.set(.65);this.root.eventMode='none';this.root.addChild(this.chain,this.stroke,this.sparks);
  this.chain.addChild(this.chainArt,this.timer);
  this.label=text(this.chain,'连斩',62,38,36,IVORY,{fontWeight:'bold',letterSpacing:-1});this.label.rotation=-.055;
  this.count=text(this.chain,'',159,30,61,IVORY,{fontFamily:'Georgia',fontWeight:'bold',fontStyle:'italic',letterSpacing:-2});this.count.rotation=-.06;
  this.hint=text(this.chain,'',115,89,18,IVORY,{letterSpacing:1});
  this.seal=text(this.chain,'连\n斩',222,51,10,IVORY,{letterSpacing:0,lineHeight:11});
  this.stroke.addChild(this.strokeArt);
  this.strokeLabel=text(this.stroke,'',115,34,35,IVORY,{fontWeight:'bold',letterSpacing:1});this.strokeLabel.rotation=-.045;
  this.strokeHint=text(this.stroke,'',115,84,18,IVORY,{letterSpacing:0});
  text(this.stroke,'收\n笔',220,53,10,IVORY,{letterSpacing:0,lineHeight:11});
 }
 private paint(g:Graphics,tier:number){
  g.clear();
  // Jagged, tapered brush silhouettes with transparent fly-white cuts.
  for(let i=0;i<5;i++){const y=13+i*11;g.poly([4+i*3,y+12,32,y-4,223-i*4,y-16,242-i*5,y-10,208,y+7,22,y+23]).fill({color:INK,alpha:i===2?.68:.38});}
  for(let i=0;i<3+tier;i++){const x=12+i*31;g.moveTo(x,65-i*2).quadraticCurveTo(125,59-i*3,237-i*7,47-i*3).stroke({color:i%2?IVORY:GOLD,width:i===0?3:1,alpha:.22+i*.09});}
  g.poly([7,76,85,65,231,57,186,64,30,80]).fill({color:GOLD,alpha:.9});
  g.poly([209,41,228,39,230,66,211,69]).fill({color:RED,alpha:.92});g.poly([212,44,225,43,226,63,214,65],true).stroke({color:IVORY,width:.7,alpha:.65});
  for(let i=0;i<4+tier*2;i++){const x=15+(i*53)%219,y=7+(i*17)%59;g.poly([x,y,x+4+tier,y-5,x+8,y-4,x+3,y+2]).fill({color:i%3?GOLD:RED,alpha:.5});}
  if(tier>=2){g.moveTo(125,5).bezierCurveTo(225,-24,252,9,194,34).stroke({color:GOLD,width:1.6,alpha:.7});g.moveTo(136,2).bezierCurveTo(224,-17,242,4,210,25).stroke({color:IVORY,width:.8,alpha:.45});}
  if(tier>=3)g.poly([20,65,64,39,48,60,166,15,130,36,8,82]).fill({color:RED,alpha:.5});
 }
 update(){
  const g=this.game,c=g.hualing.combo;this.root.visible=g.hualingPractice&&g.active;if(!this.root.visible)return;
  this.root.position.set(g.hualing.bounds.right-168,g.hualing.bounds.top+6);
  const result=c.chainResult,chainCount=c.count>=2?c.count:result?.kills??0,tier=comboTier(chainCount),age=c.time-c.lastKill;
  this.chain.visible=chainCount>=2;
  if(this.chain.visible){
   if(tier!==this.lastTier){this.paint(this.chainArt,tier);this.lastTier=tier;}
   this.count.text=`×${chainCount}`;this.count.style.fontSize=chainCount>=100?46:61;this.seal.text=tier>=3?'绝\n笔':'连\n斩';
   this.hint.text=c.remaining>0?`${c.remaining.toFixed(1)}秒续斩`:`连斩收势 · ${result!.kills}杀`;
   this.label.style.fill=tier>=3?GOLD:IVORY;
   const pop=Math.max(0,1-age/.24);this.count.scale.set(1+Math.sin(pop*Math.PI)*.07);
   this.chain.alpha=c.remaining>0?1:Math.min(1,Math.max(0,1-(c.time-result!.at-1)/.6));
   this.chain.x=c.remaining>0?Math.max(0,1-age/.16)*4:0;
   this.timer.clear();if(c.remaining>0){const w=207*c.remaining/2;this.timer.poly([15,73,15+w,65-w*.018,Math.max(15,15+w-6),70-w*.018,15,76]).fill({color:c.remaining<.5?RED:GOLD,alpha:.95});}
  }
  const live=c.strokeActive&&c.strokeKills>0,s=c.result,kills=live?c.strokeKills:s?.kills??0;
  this.stroke.visible=kills>0;
  if(this.stroke.visible){
   const st=comboTier(kills);if(st!==this.lastStrokeTier){this.paint(this.strokeArt,st);this.lastStrokeTier=st;}
   this.stroke.y=this.chain.visible?98:5;
   this.strokeLabel.text=live?`一笔 ×${kills}`:strokeTitle(kills);
   this.strokeLabel.style.fontSize=kills>=20?31:35;
   this.strokeHint.text=live?`行笔 ${(c.time-c.strokeStart).toFixed(1)}秒`:`${s!.seconds.toFixed(1)}秒 · ${comboPraise(kills)}`;
   const a=live?0:c.time-s!.at;this.stroke.alpha=live?1:Math.min(1,Math.max(0,(2.6-a)/.5));
   this.stroke.x=live?0:-Math.max(0,1-a/.22)*6;
   this.strokeLabel.scale.set(live?1:1+Math.max(0,1-a/.3)*.04);
  }
  this.sparks.clear();
 }
}
