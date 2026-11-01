import {chapterElites,ELITE_NAMES} from '../gameplay/hualing-elites';
import {HUALING_CHAPTERS,type HualingChapter} from '../gameplay/hualing-chapters';
import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {text} from './interface';
import {LANDSCAPE_STAGES} from '../gameplay/scroll-journey';
import {MOUNTAIN_THEMES} from './mountain-theme';
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
export class HualingUI{
 root=new Container();private header=0;private compactScore?:Text;private zones:Zone[]=[];private key='';private status?:Text;
 constructor(private game:Game,private cancelDrawing:()=>void,private resetScene:()=>void,private pause:()=>void=()=>{}){}
 reset(){this.key='';}
 handle(e:InputEvent){
  if(!this.game.hualingPractice||!this.game.active||!this.root.visible)return false;
  if(this.game.hualing.drawing&&e.id===this.game.hualing.pointer&&e.kind!=='down')return false;
  const y=e.y-this.root.y;
  if(e.kind==='down'){const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);if(zone){this.cancelDrawing();zone.run();this.key='';this.update(this.root.y);return true;}}
  return y>=950&&e.kind==='down';
 }
 private button(label:string,x:number,y:number,w:number,h:number,run:()=>void,active=false,size=17){
  const chapter=this.game.hualing.journey.chapter,t=MOUNTAIN_THEMES[chapter],g=new Graphics();this.root.addChild(g);
  g.poly([x+5,y,x+w-7,y,x+w,y+7,x+w-2,y+h,x+2,y+h,x,y+h-7]).fill({color:active?(chapter==='palace'?t.dark:t.ink):t.paper,alpha:.95}).stroke({color:t.line,width:active?1.6:.8,alpha:active?.9:.7});
  if(active)g.moveTo(x+12,y+h-4).lineTo(x+w-12,y+h-4).stroke({color:t.line,width:1,alpha:.8});
  text(this.root,label,x+w/2,y+h/2,size,active?t.title:t.ink,{letterSpacing:0});this.zones.push({x,y,w,h,run});
 }
 get chapterBarY(){return this.game.hualing.journey.chapter==='valley'&&!this.game.hualing.bosses.active?this.game.hualing.bounds.top-102:this.header+84;}
 get phaseBarY(){return this.game.hualing.journey.chapter==='valley'&&!this.game.hualing.bosses.active?this.game.hualing.bounds.top-58:this.header+126;}
 update(footer:number,header=this.header){
  this.header=header;this.root.y=footer;this.root.visible=this.game.hualingPractice&&this.game.active&&this.game.campaign.levelId===null;if(!this.root.visible)return;
  const m=this.game.hualing,compact=m.journey.chapter!=='valley'||m.bosses.active,barY=this.phaseBarY-footer,chapterY=this.chapterBarY-footer;
  const key=JSON.stringify([m.bosses.active,m.bosses.defeated,m.journey.chapter,m.frozen,m.journey.stage,m.journey.automatic,barY,header]);
  if(this.key!==key){
   this.key=key;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.compactScore=undefined;
   const t=MOUNTAIN_THEMES[m.journey.chapter];
   if(compact){
    const y=header+26-footer;
    const sheet=new Graphics();this.root.addChild(sheet);
    sheet.poly([37,y,680,y,690,y+10,687,y+50,33,y+50,30,y+42,33,y+8]).fill({color:t.paper,alpha:.95}).stroke({color:t.line,width:1,alpha:.75});
    sheet.moveTo(44,y+6).lineTo(674,y+6).stroke({color:t.line,width:.65,alpha:.3});
    text(this.root,'画灵 · '+m.journey.info.name,198,y+25,24,t.ink,{letterSpacing:1});this.compactScore=text(this.root,'',424,y+25,23,t.accent,{letterSpacing:0});
    this.button('暂停',614,y,76,50,()=>this.pause(),false,20);
   }
   for(const [i,chapter] of (Object.keys(HUALING_CHAPTERS) as HualingChapter[]).entries())this.button(HUALING_CHAPTERS[chapter].name,30+i*168,chapterY,160,36,()=>this.game.changeHualingChapter(chapter),m.journey.chapter===chapter,19);
   this.root.addChild(new Graphics().poly([35,barY,251,barY,258,barY+7,256,barY+32,32,barY+32,30,barY+25]).fill({color:t.paper,alpha:.95}).stroke({color:t.line,width:.8,alpha:.65}));text(this.root,m.journey.sceneName,144,barY+16,20,t.ink,{letterSpacing:1});
   for(let i=0;i<4;i++){
    const stage=LANDSCAPE_STAGES[i-1],active=i===0?m.journey.automatic:!m.journey.automatic&&m.journey.stage===stage;
    this.button(i===0?'自动':m.journey.info.scenes[stage],268+i*104,barY,100,32,()=>{if(i===0){m.journey.resume();m.selected=null;}else m.previewLandscape(stage);},active,16);
   }
   for(const [i,kind]of chapterElites(m.journey.chapter).entries())this.button(ELITE_NAMES[kind],30+i*132,960,126,30,()=>{this.game.clearHualingBoss();this.game.clearHualingElites();this.game.summonHualingElite(kind);},false,16);
   const controls:[string,()=>void][]=[
    ['补充敌人',()=>this.game.seedHualingEnemies()],
    ['清精英',()=>this.game.clearHualingElites()],
    [m.bosses.active?'重开首领':'挑战首领',()=>this.game.summonHualingBoss()],
    ['清首领',()=>this.game.clearHualingBoss()],
    [m.frozen?'继续妖潮':'定格妖潮',()=>{m.frozen=!m.frozen;}],
    ['重置画境',()=>this.resetScene()],
   ];
   for(const [i,[label,run]]of controls.entries())this.button(label,28+i*112,996,104,32,run,false,16);
   this.status=text(this.root,'',360,936,17,t.title,{letterSpacing:0,stroke:{color:t.dark,width:3}});
  }
  if(this.compactScore)this.compactScore.text=String(this.game.score).padStart(4,'0');
  if(this.status){this.status.text=m.bosses.active||m.bosses.failed?m.bosses.notice:m.noticeTime>0?m.notice:'';this.status.visible=!!this.status.text;}
 }
}
