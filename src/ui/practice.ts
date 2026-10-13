import {Container,Graphics} from 'pixi.js';
import {text} from './interface';
import {SKILL_LEVELS,type ActiveRune} from '../gameplay/skill-levels';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';

const RUNES=['line','circle','triangle','z'] as const;
const NAMES={line:'一字斩',circle:'圆形护阵',triangle:'追踪符箭',z:'折线雷符'};
const GOLD=0xe7ba68,INK=0x192027,PAPER=0xfff7e8;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
/** Canvas controls shared by browser and WeChat, without HTML or DOM input. */
export class PracticeUI{
 root=new Container();private picker:ActiveRune|null=null;private zones:Zone[]=[];private key='';
 constructor(private game:Game,private cancelDrawing:()=>void,private cast:(rune:ActiveRune)=>void){this.root.visible=false;}
 reset(){this.picker=null;this.key='';}
 handle(e:InputEvent){
  if(!this.root.visible||e.kind!=='down')return false;
  const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);
  if(zone){this.cancelDrawing();zone.run();this.key='';this.update();return true;}
  if(this.picker){this.cancelDrawing();this.picker=null;this.key='';this.update();return true;}
  return e.y>=1170;
 }
 update(){
  this.root.visible=this.game.practice&&this.game.active;
  if(!this.root.visible)return;
  const key=JSON.stringify([this.picker,this.game.practiceLevels]);if(key===this.key)return;this.key=key;
  this.root.removeChildren().forEach(child=>child.destroy({children:true}));this.zones=[];
  this.root.addChild(new Graphics().roundRect(16,1172,688,100,18).fill({color:INK,alpha:.97}).stroke({color:GOLD,width:1,alpha:.5}));
  for(const [i,rune] of RUNES.entries()){
   const x=24+i*170,level=this.game.practiceLevels[rune];
   this.button(x,1180,162,38,()=>{this.picker=this.picker===rune?null:rune;},this.picker===rune);
   text(this.root,`${NAMES[rune]} Lv${level}`,x+81,1200,17,PAPER,{letterSpacing:0});
   this.button(x+8,1224,146,36,()=>{this.picker=null;this.cast(rune);},false);
   text(this.root,'施放',x+81,1242,19,GOLD,{letterSpacing:2});
  }
  if(this.picker){
   const rune=this.picker,levels=SKILL_LEVELS[rune];
   this.root.addChild(new Graphics().roundRect(32,952,656,205,20).fill({color:INK,alpha:.98}).stroke({color:GOLD,width:1}));
   text(this.root,`${NAMES[rune]} · 选择下次施法等级`,360,985,23,PAPER,{letterSpacing:0});
   const width=600/levels.length;
   levels.forEach((level,i)=>{
    const x=60+i*width;
    this.button(x,1018,width-8,98,()=>{this.game.practiceLevels[rune]=i+1;this.picker=null;},this.game.practiceLevels[rune]===i+1);
    text(this.root,`Lv${i+1}`,x+(width-8)/2,1045,22,GOLD,{letterSpacing:0});
    text(this.root,level.name,x+(width-8)/2,1080,15,PAPER,{letterSpacing:0,wordWrap:true,breakWords:true,lineHeight:18,wordWrapWidth:width-16});
   });
   text(this.root,'画符或点「施放」试招 · 点击画境收起',360,1137,15,GOLD,{letterSpacing:0});
  }
 }
 private button(x:number,y:number,w:number,h:number,run:()=>void,selected:boolean){
  this.root.addChild(new Graphics().roundRect(x,y,w,h,10).fill({color:selected?0x562a34:0x29333b}).stroke({color:GOLD,width:1,alpha:selected?1:.35}));
  this.zones.push({x,y,w,h,run});
 }
}
