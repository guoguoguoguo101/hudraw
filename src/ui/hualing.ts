import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {SPIRIT_CARDS,type SpiritCard} from '../gameplay/hualing';
import {spiritIcon} from '../rendering/hualing';
import {text} from './interface';
import {SCENE_MODES,type SceneMode} from '../gameplay/scene-seal';
import {LANDSCAPE_STAGES,LANDSCAPE_NAMES} from '../gameplay/scroll-journey';
const GOLD=0xe1b675,PAPER=0xf4e5c6,INK=0x202b2d,WINE=0x772a2a;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
export class HualingUI{
 root=new Container();private zones:Zone[]=[];private key='';private hint?:Text;private status?:Text;private meter=new Graphics();
 constructor(private game:Game,private cancelDrawing:()=>void,private resetScene:()=>void){}
 reset(){this.key='';}
 handle(e:InputEvent){
  if(!this.game.hualingPractice||!this.game.active)return false;
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
 update(footer:number){
  this.root.y=footer;this.root.visible=this.game.hualingPractice&&this.game.active;if(!this.root.visible)return;
  const m=this.game.hualing,barY=m.bounds.top-58-footer,key=JSON.stringify([m.selected,m.lastCard,m.canPush,m.frozen,m.sceneSeal.mode,m.journey.stage,m.journey.automatic,barY]);
  if(this.key!==key){this.key=key;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.meter=new Graphics();
   this.root.addChild(new Graphics().roundRect(20,990,680,274,20).fill({color:INK,alpha:.97}).stroke({color:GOLD,width:1,alpha:.55}));
   text(this.root,`山河流转 · ${LANDSCAPE_NAMES[m.journey.stage]}`,134,barY+16,20,m.journey.stage==='night'?PAPER:WINE,{letterSpacing:1});
   for(let i=0;i<4;i++){
    const x=268+i*104,stage=LANDSCAPE_STAGES[i-1],active=i===0?m.journey.automatic:!m.journey.automatic&&m.journey.stage===stage;
    this.root.addChild(new Graphics().roundRect(x,barY,96,32,6).fill({color:INK,alpha:.86}).stroke({color:GOLD,width:1,alpha:active?.9:.35}));
    text(this.root,i===0?'自动':LANDSCAPE_NAMES[stage],x+48,barY+16,18,active?PAPER:GOLD,{letterSpacing:1});
    this.zones.push({x,y:barY,w:96,h:32,run:()=>{if(i===0){m.journey.resume();m.selected=null;m.showScene(m.journey.event);m.say('画卷自动流转 · 落日、起风、夜色');}else m.previewLandscape(stage);}});
   }
   for(const [i,mode] of (Object.keys(SCENE_MODES) as SceneMode[]).entries()){
    const x=34+i*122,active=m.sceneSeal.mode===mode&&!m.selected;
    this.root.addChild(new Graphics().roundRect(x,1000,114,32,6).fill({color:active?WINE:INK,alpha:.95}).stroke({color:GOLD,width:1,alpha:active?.9:.3}));text(this.root,SCENE_MODES[mode].tab,x+57,1017,19,active?PAPER:GOLD,{letterSpacing:1});
    this.zones.push({x,y:1000,w:114,h:32,run:()=>{m.cancel();m.chooseScene(mode);m.say(SCENE_MODES[mode].hint);}});
   }
   const resetLabel='重现'+m.sceneSeal.info.tab;
   this.root.addChild(new Graphics().roundRect(536,1000,144,32,6).fill({color:WINE,alpha:.9}).stroke({color:GOLD,width:1,alpha:.5}));text(this.root,resetLabel,608,1017,18,PAPER,{letterSpacing:0});
   this.zones.push({x:536,y:1000,w:144,h:32,run:()=>{m.cancel();m.sceneSeal.reset();m.say(m.sceneSeal.info.hint);}});
   for(const [i,card] of (Object.keys(SPIRIT_CARDS) as SpiritCard[]).entries()){
    const x=34+i*132,active=m.selected===card,art=new Graphics();
    this.root.addChild(new Graphics().roundRect(x,1040,124,108,9).fill({color:active?WINE:0xf0dfbb,alpha:1}).stroke({color:GOLD,width:active?2:1,alpha:.85}));
    const fold=new Graphics().poly([x+106,1040,x+124,1040,x+124,1058]).fill({color:active?0xa44735:0xd4b582});this.root.addChild(fold);
    spiritIcon(art,card);art.position.set(x+62,1093);art.scale.set(card==='tiger'?.34:card==='crane'?.34:.4);art.alpha=active?1:.9;this.root.addChild(art);
    text(this.root,SPIRIT_CARDS[card].verb,x+62,1127,28,active?PAPER:WINE,{letterSpacing:2});this.zones.push({x,y:1040,w:124,h:108,run:()=>m.select(card)});
   }
   this.hint=text(this.root,'',360,1171,20,PAPER,{letterSpacing:0});this.status=text(this.root,'',360,972,21,GOLD,{letterSpacing:0});this.root.addChild(this.meter);
   this.button(m.canPush&&!m.selected?'推山 · 释放':`示范 · ${SPIRIT_CARDS[m.selected??m.lastCard].verb}`,34,1207,158,()=>m.canPush&&!m.selected?m.pushMountains():m.demo(),true);
   this.button(m.selected?'取消 · 回基础':'补充敌人',200,1207,152,()=>{if(m.selected)m.cancel();else this.game.seedHualingEnemies();});
   this.button('重置画境',360,1207,152,()=>this.resetScene());
   this.button(m.frozen?'继续妖潮':'定格妖潮',520,1207,166,()=>{m.frozen=!m.frozen;m.say(m.frozen?'妖潮已定格 · 画符和效果仍可预览':'妖潮继续');});
   // Return is also available from the existing top-right pause menu.
  }
  const selected=m.selected;
  this.hint!.text=selected?SPIRIT_CARDS[selected].hint:m.sceneSeal.info.hint;
  this.status!.text=m.noticeTime>0?m.notice:selected?(m.repairing?`补灵进度 ${Math.round(m.repairProgress*100)}% · ${m.offGuide?'靠近淡金轮廓继续':'可抬手，进度保留'}`:m.drawing?`松手释放 · 剩余笔长 ${Math.max(0,Math.round(1100-m.length))}`:'从亮点试画，也可点「示范」'):
   m.tiger.alive?`纸虎寻妖 · 剩余 ${Math.ceil(m.tiger.state!.remaining)} 秒`:m.canPush?'纸山正在挡怪 · 点「推山」释放':'无限灵墨 · 演武免伤 · 封印进度保留';
  this.meter.clear();if(selected){const ratio=m.repairing?m.repairProgress:1-m.length/1100;this.meter.roundRect(44,1188,632,3,1).fill({color:GOLD,alpha:.15});this.meter.roundRect(44,1188,Math.max(1,632*ratio),3,1).fill({color:m.offGuide?0xc9664b:GOLD,alpha:.9});}
 }
}
