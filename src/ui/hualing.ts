import {chapterElites,ELITE_NAMES} from '../gameplay/hualing-elites';
import {HUALING_CHAPTERS,type HualingChapter} from '../gameplay/hualing-chapters';
import {thunderBrushEmblem} from '../rendering/thunder-brush';
import {mapleEmblem} from '../rendering/petal-brush';
import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {SPIRIT_CARDS,type SpiritCard} from '../gameplay/hualing';
import {spiritIcon} from '../rendering/hualing';
import {text} from './interface';
import {SCENE_MODES,type SceneMode} from '../gameplay/scene-seal';
import {LANDSCAPE_STAGES} from '../gameplay/scroll-journey';
const GOLD=0xe1b675,PAPER=0xf4e5c6,INK=0x202b2d,WINE=0x772a2a;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
export class HualingUI{
 root=new Container();private header=0;private compactScore?:Text;private zones:Zone[]=[];private key='';private petalTime?:Text;private thunderTime?:Text;private hint?:Text;private status?:Text;private meter=new Graphics();
 constructor(private game:Game,private cancelDrawing:()=>void,private resetScene:()=>void,private pause:()=>void=()=>{}){}
 reset(){this.key='';}
 handle(e:InputEvent){
  if(!this.game.hualingPractice||!this.game.active||!this.root.visible)return false;
  if(this.game.hualing.scenes.some(s=>s.dragPointer!==null))return false;
  // Captured live strokes must see their release even over the dock.
  if(this.game.hualing.drawing&&e.id===this.game.hualing.pointer&&e.kind!=='down')return false;
  const y=e.y-this.root.y;
  if(e.kind==='down'){const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);if(zone){this.cancelDrawing();zone.run();this.key='';this.update(this.root.y);return true;}}
  return y>=990&&e.kind==='down';
 }
 private button(label:string,x:number,y:number,w:number,run:()=>void,primary=false){
  this.root.addChild(new Graphics().roundRect(x,y,w,42,9).fill({color:primary?WINE:INK,alpha:.98}).stroke({color:GOLD,width:1,alpha:primary?.85:.35}));text(this.root,label,x+w/2,y+21,20,primary?PAPER:GOLD,{letterSpacing:0});this.zones.push({x,y,w,h:42,run});
 }
 get chapterBarY(){return this.game.hualing.journey.chapter==='valley'&&!this.game.hualing.bosses.active?this.game.hualing.bounds.top-102:this.header+84;}
 get phaseBarY(){return this.game.hualing.journey.chapter==='valley'&&!this.game.hualing.bosses.active?this.game.hualing.bounds.top-58:this.header+126;}
 update(footer:number,header=this.header){
  this.header=header;
  this.root.y=footer;this.root.visible=this.game.hualingPractice&&this.game.active;if(!this.root.visible)return;
  const m=this.game.hualing,compact=m.journey.chapter!=='valley'||m.bosses.active,barY=this.phaseBarY-footer,chapterY=this.chapterBarY-footer,key=JSON.stringify([m.bosses.active,m.bosses.defeated,m.journey.chapter,m.thunder.active,m.petals.active,m.selected,m.lastCard,m.frozen,m.sceneSeal.mode,m.journey.stage,m.journey.automatic,barY,header]);
  if(this.key!==key){this.key=key;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.meter=new Graphics();this.compactScore=undefined;
   this.root.addChild(new Graphics().roundRect(20,990,680,312,20).fill({color:INK,alpha:.97}).stroke({color:GOLD,width:1,alpha:.55}));
   if(compact){
    const y=header+26-footer;
    this.root.addChild(new Graphics().roundRect(30,y,660,50,9).fill({color:INK,alpha:.78}).stroke({color:GOLD,width:1,alpha:.5}));
    text(this.root,'画灵 · '+m.journey.info.name,198,y+25,24,PAPER,{letterSpacing:1});
    this.compactScore=text(this.root,'',424,y+25,23,GOLD,{letterSpacing:0});
    text(this.root,'暂停',650,y+25,20,PAPER,{letterSpacing:0});
    this.zones.push({x:614,y,w:76,h:50,run:()=>this.pause()});
   }
   for(const [i,chapter] of (Object.keys(HUALING_CHAPTERS) as HualingChapter[]).entries()){
    const x=30+i*168,active=m.journey.chapter===chapter;
    this.root.addChild(new Graphics().roundRect(x,chapterY,160,36,7).fill(active?WINE:INK).stroke({color:GOLD,width:active?2:1,alpha:.9}));
    text(this.root,HUALING_CHAPTERS[chapter].name,x+80,chapterY+18,19,PAPER,{letterSpacing:1});
    this.zones.push({x,y:chapterY,w:160,h:36,run:()=>this.game.changeHualingChapter(chapter)});
   }
   this.root.addChild(new Graphics().roundRect(30,barY,228,32,6).fill({color:INK,alpha:.9}));
   text(this.root,m.journey.sceneName,144,barY+16,20,PAPER,{letterSpacing:1});
   for(let i=0;i<4;i++){
    const x=268+i*104,stage=LANDSCAPE_STAGES[i-1],active=i===0?m.journey.automatic:!m.journey.automatic&&m.journey.stage===stage;
    this.root.addChild(new Graphics().roundRect(x,barY,100,32,6).fill({color:INK,alpha:.86}).stroke({color:GOLD,width:1,alpha:active?.9:.35}));
    text(this.root,i===0?'自动':m.journey.info.scenes[stage],x+50,barY+16,16,active?PAPER:GOLD,{letterSpacing:1});
    this.zones.push({x,y:barY,w:100,h:32,run:()=>{if(i===0){m.journey.resume();m.selected=null;m.showScene(m.journey.event);m.say(m.journey.info.description);}else m.previewLandscape(stage);}});
   }
   for(const [i,mode] of (['seal','chain','fire'] as SceneMode[]).entries()){
    const x=34+i*102,active=m.sceneSeal.mode===mode&&!m.selected;
    const tab=m.journey.chapter==='snow'&&mode!=='beast'?mode==='seal'?'脊纹':mode==='chain'?'霜锁':'灵息':mode==='beast'?SCENE_MODES[mode].tab:m.journey.chapter==='valley'?SCENE_MODES[mode].tab:mode==='seal'?(m.journey.chapter==='sea'?'潮纹':'星图'):mode==='chain'?(m.journey.chapter==='sea'?'断缆':'破轨'):(m.journey.chapter==='sea'?'聚珠':'摘星');
    this.root.addChild(new Graphics().roundRect(x,1000,96,32,6).fill({color:active?WINE:INK,alpha:.95}).stroke({color:GOLD,width:1,alpha:active?.9:.3}));text(this.root,tab,x+48,1017,18,active?PAPER:GOLD,{letterSpacing:1});
    this.zones.push({x,y:1000,w:96,h:32,run:()=>{m.cancel();m.chooseScene(mode);m.say(m.sceneSeal.info.hint);}});
   }
   for(const [i,kind] of (['beast','crab'] as const).entries()){
    const x=344+i*116;
    this.root.addChild(new Graphics().roundRect(x,1000,110,32,6).fill(i?0x255b63:WINE).stroke({color:GOLD,width:1,alpha:.85}));
    text(this.root,i?'领蟹符':'领虎符',x+55,1017,18,PAPER,{letterSpacing:1});
    this.zones.push({x,y:1000,w:110,h:32,run:()=>m.claimSummon(kind)});
   }
   const resetLabel='重现'+m.sceneSeal.info.tab;
   this.root.addChild(new Graphics().roundRect(578,1000,108,32,6).fill({color:WINE,alpha:.9}).stroke({color:GOLD,width:1,alpha:.5}));text(this.root,resetLabel,632,1017,17,PAPER,{letterSpacing:0});
   this.zones.push({x:578,y:1000,w:108,h:32,run:()=>{m.cancel();m.sceneSeal.reset();m.say(m.sceneSeal.info.hint);}});
   for(const [i,card] of ([...Object.keys(SPIRIT_CARDS),'petals','thunder'] as (SpiritCard|'petals'|'thunder')[]).entries()){
    const x=112+i*186,isPetal=card==='petals',isThunder=card==='thunder',buff=isPetal||isThunder;
    const active=isPetal?m.petals.active:isThunder?m.thunder.active:m.selected===card,art=new Graphics();
    const edge=isThunder?0xc8c5a7:GOLD;
    this.root.addChild(new Graphics().roundRect(x,1040,124,108,9).fill({color:active?(isThunder?0x354543:WINE):0xf0dfbb}).stroke({color:edge,width:active?2:1,alpha:.85}));
    this.root.addChild(new Graphics().poly([x+106,1040,x+124,1040,x+124,1058]).fill({color:active?(isThunder?0x7c887b:0xa44735):0xd4b582}));
    if(isPetal)mapleEmblem(art);else if(isThunder)thunderBrushEmblem(art);else spiritIcon(art,card);
    art.position.set(x+62,1090);art.scale.set(buff?.82:.4);this.root.addChild(art);
    text(this.root,isPetal?'画符':isThunder?'雷符':SPIRIT_CARDS[card].verb,x+62,1127,26,active?PAPER:WINE,{letterSpacing:2});
    if(isPetal)this.petalTime=text(this.root,'',x+62,1055,14,active?0xffd492:WINE,{letterSpacing:0});
    if(isThunder)this.thunderTime=text(this.root,'',x+62,1055,14,active?0xe5dfc6:WINE,{letterSpacing:0});
    this.zones.push({x,y:1040,w:124,h:108,run:()=>{
     if(isPetal){m.cancel();m.petals.activate();m.say('画符已用 · 十二秒内，行笔飘落剪纸枫叶');}
     else if(isThunder){m.cancel();m.thunder.activate();m.say('雷符已用 · 十二秒内，落笔化雷');}
     else m.select(card);
    }});
   }
   const pool=chapterElites(m.journey.chapter);
   for(const [i,kind] of pool.entries()){
    const x=34+i*132,w=126;
    this.root.addChild(new Graphics().roundRect(x,1158,w,32,6).fill(INK).stroke({color:GOLD,width:1,alpha:.65}));
    text(this.root,ELITE_NAMES[kind],x+w/2,1174,16,PAPER,{letterSpacing:0});
    this.zones.push({x,y:1158,w,h:32,run:()=>{this.game.clearHualingBoss();this.game.clearHualingElites();this.game.summonHualingElite(kind);}});
   }
   const extraY=1194;
   for(const [i,label] of ['清精英',m.bosses.active?'重开Boss':'挑战Boss','清除Boss'].entries()){
    const x=34+i*220,w=212;
    this.root.addChild(new Graphics().roundRect(x,extraY,w,28,6).fill(i===1?WINE:INK).stroke({color:GOLD,width:1,alpha:.5}));
    text(this.root,label,x+w/2,extraY+14,16,PAPER,{letterSpacing:0});
    this.zones.push({x,y:extraY,w,h:28,run:()=>{if(i===0)this.game.clearHualingElites();else if(i===1)this.game.summonHualingBoss();else this.game.clearHualingBoss();}});
   }
   this.hint=text(this.root,'',360,1171,20,PAPER,{letterSpacing:0});this.status=text(this.root,'',360,972,21,GOLD,{letterSpacing:0});this.root.addChild(this.meter);
   this.button('示范 · 画龙',34,1233,158,()=>m.demo(),true);
   this.button(m.selected?'取消 · 回画笔':'补充敌人',200,1233,152,()=>{if(m.selected)m.cancel();else this.game.seedHualingEnemies();});
   this.button('重置画境',360,1233,152,()=>this.resetScene());
   this.button(m.frozen?'继续妖潮':'定格妖潮',520,1233,166,()=>{m.frozen=!m.frozen;m.say(m.frozen?'妖潮已定格 · 画笔和效果仍可预览':'妖潮继续');});
   // Return is also available from the existing top-right pause menu.
  }
  if(this.compactScore)this.compactScore.text=String(this.game.score).padStart(4,'0');
  if(this.petalTime)this.petalTime.text=m.petals.active?`枫舞 ${Math.ceil(m.petals.remaining)}秒`:'点按使用 · 12秒';
  if(this.thunderTime)this.thunderTime.text=m.thunder.active?`雷笔 ${Math.ceil(m.thunder.remaining)}秒`:'点按使用 · 12秒';
  const selected=m.selected;
  this.hint!.visible=false;
  this.hint!.text=selected?SPIRIT_CARDS[selected].hint:m.thunder.active?'银雷随笔 · 一脉贯通，收笔即散':m.petals.active?'朱笔染秋 · 小枫叶随笔轻翻飘落':m.sceneSeal.info.hint;
  this.status!.text=m.bosses.active||m.bosses.failed?m.bosses.notice:m.noticeTime>0?m.notice:selected?(m.drawing?`松手释放 · 剩余笔长 ${Math.max(0,Math.round(1100-m.length))}`:'从亮点试画，也可点「示范」'):
   m.elites.field.rounds.size?`全卷交锋 · 截招、拨动、反打 · 演武受击 ${m.elites.hits}`:'挥笔划妖 · 不限笔时 · 演武免伤';
  this.meter.clear();if(selected){const ratio=1-m.length/1100;this.meter.roundRect(44,1188,632,3,1).fill({color:GOLD,alpha:.15});this.meter.roundRect(44,1188,Math.max(1,632*ratio),3,1).fill({color:GOLD,alpha:.9});}
 }
}
