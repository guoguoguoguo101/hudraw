import {BURNING_SEA_STYLES} from '../gameplay/burning-sea-styles';
import {castPracticeRune} from '../gameplay/practice-cast';
import {Container,Graphics,Text} from 'pixi.js';
import type {InputController} from '../input/controller';
import {COMBAT} from '../gameplay/config';
import {text} from './interface';
import {SKILL_LEVELS,type ActiveRune} from '../gameplay/skill-levels';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';

const RUNES=['line','circle','triangle','arc','z','wave','spiral','sancai'] as const;
const INTERACTION_RUNES=['line','circle','z','triangle','sancai'] as const;
const NAMES={sancai:'三才符',line:'一字斩',circle:'圆形护阵',triangle:'追踪符箭',z:'九霄雷诏',arc:'揽月狐尾',wave:'千叠月',spiral:'缚妖咒'};
const GOLD=0xe7ba68,INK=0x192027,PAPER=0xfff7e8;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
/** Canvas controls shared by browser and WeChat, without HTML or DOM input. */
export class PracticeUI{
 root=new Container();private picker:ActiveRune|null=null;private zones:Zone[]=[];private key='';private info:Text|null=null;
 constructor(private game:Game,private cancelDrawing:()=>void,private cast:(rune:ActiveRune)=>void,private tune:()=>void=()=>{},private input?:()=>InputController){this.root.visible=false;}
 get isPicking(){return this.picker!==null;}
 reset(){this.picker=null;this.key='';}
 handle(e:InputEvent){
  if(!this.root.visible||e.kind!=='down')return false;
  e={...e,y:e.y-this.root.y};
  const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);
  if(zone){this.cancelDrawing();zone.run();this.key='';this.update();return true;}
  if(this.picker){this.cancelDrawing();this.picker=null;this.key='';this.update();return true;}
  return e.y>=1094;
 }
 update(){
  this.root.visible=this.game.practice&&!this.game.hualingPractice&&this.game.active;
  if(!this.root.visible)return;
  const key=JSON.stringify([this.picker,this.game.practiceLevels,this.game.ink.unlimited,this.game.interactionPractice,this.game.interactionTriangle,this.game.burningSea.phase,this.game.talismanBarrage.phase,this.game.pen.id,this.game.interactions.refractionEnabled]);if(key===this.key){this.updateInfo();return;}this.key=key;
  this.root.removeChildren().forEach(child=>child.destroy({children:true}));this.zones=[];
  this.root.addChild(new Graphics().roundRect(16,1094,688,178,18).fill({color:INK,alpha:.97}).stroke({color:GOLD,width:1,alpha:.5}));
  for(const [i,rune] of (this.game.interactionPractice?INTERACTION_RUNES:RUNES).entries()){
   const experimental=this.game.interactionPractice,w=experimental?216:164;
   const x=experimental?(24+(i%3)*224):24+(i%4)*172,y=1102+Math.floor(i/(experimental?3:4))*82,level=this.game.practiceLevels[rune];
   const select=()=>{if(experimental&&(rune==='triangle'||rune==='sancai'))this.game.interactionTriangle=rune;};
   this.button(x,y,w,34,()=>{select();this.picker=this.picker===rune?null:rune;},this.picker===rune||(experimental&&this.game.interactionTriangle===rune));
   text(this.root,`${experimental&&rune==='line'?'留痕一字斩':NAMES[rune]} Lv${level}`,x+w/2,y+18,17,PAPER,{letterSpacing:0});
   if(rune==='sancai'){
    const half=(w-4)/2;for(const [j,form] of (['small','large'] as const).entries()){this.button(x+4+j*half,y+39,half-4,32,()=>{select();this.picker=null;castPracticeRune(this.game,rune,form);},false);text(this.root,form==='small'?'飞刃':'阵法',x+4+j*half+(half-4)/2,y+56,16,GOLD,{letterSpacing:0});}
   }else{this.button(x+10,y+39,w-20,32,()=>{select();this.picker=null;this.cast(rune);},false);text(this.root,'施放',x+w/2,y+56,17,GOLD,{letterSpacing:2});}
  }
  this.button(505,1006,183,42,()=>{this.picker=null;this.tune();},false);text(this.root,'画笔 / 特效',596,1027,19,GOLD,{letterSpacing:0});
  this.button(48,1006,268,42,()=>this.game.ink.setUnlimited(!this.game.ink.unlimited),false);text(this.root,this.game.ink.unlimited?'无限灵墨 · 切换有限':'有限灵墨 · 切换无限',182,1027,17,GOLD,{letterSpacing:0});
  if(!this.game.interactionPractice){this.button(330,1006,160,42,()=>this.game.activateBurningSea(),this.game.burningSea.busy);text(this.root,'焚山煮海',410,1027,17,GOLD,{letterSpacing:0});}
  if(this.game.interactionPractice){this.button(330,1006,160,42,()=>{this.game.interactions.clear();this.game.burningSea.clear();this.game.talismanBarrage.clear();},false);text(this.root,'清空残痕',410,1027,17,GOLD,{letterSpacing:0});}
  if(this.game.interactionPractice){this.button(472,1184,216,34,()=>{this.picker=null;if(this.game.activateBurningSea())this.cancelDrawing();},this.game.burningSea.busy);text(this.root,this.game.burningSea.active?'焚山煮海 · 绘火中':this.game.burningSea.phase==='charging'?'焚山煮海 · 待引爆':this.game.burningSea.phase==='exploding'?'焚山煮海 · 齐爆':'焚山煮海 · 开启',580,1202,15,this.game.burningSea.active?0xffb04b:PAPER,{letterSpacing:0});this.button(472,1226,216,34,()=>{this.picker=null;this.game.activateTalismanBarrage();},this.game.talismanBarrage.busy);text(this.root,this.game.talismanBarrage.phase==='aiming'?'万符洪流 · 取消瞄准':this.game.talismanBarrage.busy?'万符洪流 · 连射中':'万符洪流 · 定向',580,1243,15,PAPER,{letterSpacing:0});}
  if(this.game.interactionPractice){this.button(482,1052,206,34,()=>{this.game.interactions.refractionEnabled=!this.game.interactions.refractionEnabled;},this.game.interactions.refractionEnabled);text(this.root,this.game.interactions.refractionEnabled?'三角折射 · 试验开':'三角折射 · 试验关',585,1069,15,GOLD,{letterSpacing:0});}
  this.info=this.picker?null:text(this.root,'',this.game.interactionPractice?245:360,1070,this.game.interactionPractice?14:17,GOLD,{letterSpacing:0});
  if(this.picker){
   const rune=this.picker,levels=SKILL_LEVELS[rune];
   this.root.addChild(new Graphics().roundRect(32,830,656,205,20).fill({color:INK,alpha:.98}).stroke({color:GOLD,width:1}));
   text(this.root,`${NAMES[rune]} · 选择下次施法等级`,360,863,23,PAPER,{letterSpacing:0});
   const width=600/levels.length;
   levels.forEach((level,i)=>{
    const x=60+i*width;
    this.button(x,896,width-8,98,()=>{this.game.practiceLevels[rune]=i+1;this.picker=null;},this.game.practiceLevels[rune]===i+1);
    text(this.root,`Lv${i+1}`,x+(width-8)/2,923,22,GOLD,{letterSpacing:0});
    text(this.root,level.name,x+(width-8)/2,958,15,PAPER,{letterSpacing:0,wordWrap:true,breakWords:true,lineHeight:18,wordWrapWidth:width-16});
   });
   text(this.root,'画符或点「施放」试招 · 点击画境收起',360,1015,15,GOLD,{letterSpacing:0});
  }
  this.updateInfo();
 }
 private updateInfo(){if(!this.info)return;const barrage=this.game.talismanBarrage;if(this.game.interactionPractice&&barrage.busy){this.info.text=barrage.phase==='aiming'?'按住地面瞄准 · 松手锁向连射':barrage.phase==='charging'?'万符蓄势 · 方向已锁定':barrage.phase==='firing'?`万符洪流 · 余 ${barrage.remaining.toFixed(1)} 秒`:'万符洪流 · 尾浪收束';return;}if(!this.game.interactionPractice&&this.game.burningSea.busy){const f=this.game.burningSea;this.info.text=f.active?`绘火余 ${f.remaining.toFixed(1)} 秒`:f.phase==='charging'?`${f.chargeRemaining.toFixed(1)} 秒后全部齐爆`:'焚山煮海 · 万焰齐爆';return;}if(this.game.interactionPractice){const m=this.game.interactions;if(this.game.burningSea.active){this.info.text=`${BURNING_SEA_STYLES[this.game.pen.id].name} · 余 ${this.game.burningSea.remaining.toFixed(1)} 秒 · 可松手续画`;return;}if(this.game.burningSea.phase==='charging'){this.info.text=`全部留痕 · ${this.game.burningSea.chargeRemaining.toFixed(1)} 秒后一起爆炸`;return;}if(this.game.burningSea.phase==='exploding'){this.info.text='焚山煮海 · 万焰齐爆';return;}this.info.text=this.input?.().drawing?'收笔施符 · 未成符沿笔迹划斩':`残痕 ${m.traces.length}/6 · 手画三角：${this.game.interactionTriangle==='sancai'?'三才符':'追踪符箭'}`;return;}const input=this.input?.(),array=[...this.game.skills].reverse().find(s=>s.sancai?.form==='large');this.info.text=input?.drawing?`收笔释放 · ${(Math.max(0,COMBAT.drawLimit-input.drawAge)).toFixed(1)}秒${input.preview?.rune==='z'?` · 节点${Math.min(input.preview.geometry.advanced?.corners.length??0,this.game.practiceLevels.z+2)}/${this.game.practiceLevels.z+2}`:input.preview?.rune==='wave'?` · 弧段${Math.min(input.preview.geometry.advanced?.curves.length??0,this.game.practiceLevels.wave+1)}/${this.game.practiceLevels.wave+1}`:input.preview?.rune==='spiral'?` · ${(input.preview.geometry.advanced?.turns??0).toFixed(1)}圈`:''}${input.exhausted?' · 灵墨耗尽':''}`:input?.last&&input.traceAge<.7?`${input.last.reason}${input.timedOut?' · 自动封笔':''}`:array?`三才诛妖阵 · 持续成阵 · 余 ${Math.max(0,array.duration-array.age).toFixed(1)} 秒`:'三才符：小三角飞刃 · 大三角成阵';}
 private button(x:number,y:number,w:number,h:number,run:()=>void,selected:boolean){
  this.root.addChild(new Graphics().roundRect(x,y,w,h,10).fill({color:selected?0x562a34:0x29333b}).stroke({color:GOLD,width:1,alpha:selected?1:.35}));
  this.zones.push({x,y,w,h,run});
 }
}
