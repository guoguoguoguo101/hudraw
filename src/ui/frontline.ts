import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {HUALING_CHAPTERS,type HualingChapter} from '../gameplay/hualing-chapters';
import {chapterElites,ELITE_NAMES} from '../gameplay/hualing-elites';
import {LANDSCAPE_STAGES} from '../gameplay/scroll-journey';
import {COLLECTED_NAMES} from '../gameplay/collected-talismans';
import {text} from './interface';
import {BRUSH_SKILLS,BRUSH_NAMES} from '../gameplay/brush-upgrades';
const INK=0x203333,PAPER=0xf2e4c4,GOLD=0xc7a369,RED=0x9e493a;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
/** A dedicated HUD keeps experimental controls out of the drawing field. */
export class FrontlineUI{
 root=new Container();opened=false;private zones:Zone[]=[];private key='';private header=0;private footer=0;private pointer:number|null=null;
 private growth?:Text;private stats?:Text;private hint?:Text;private bars=new Graphics();
 constructor(private game:Game,private cancel:()=>void,private action:(a:'pause'|'restart'|'menu')=>void){}
 reset(){this.opened=false;this.key='';this.pointer=null;}
 handle(e:InputEvent){
  if(!this.root.visible||!this.game.active||this.game.hualing.upgrades.blocked)return false;
  if(this.pointer===e.id){if(e.kind==='up'||e.kind==='cancel')this.pointer=null;return true;}
  if(e.kind==='down'){const z=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);if(z){this.cancel();this.pointer=e.id;z.run();this.key='';return true;}}
  return this.opened||e.y<this.header+250;
 }
 private button(label:string,x:number,y:number,w:number,run:()=>void,active=false,h=42){
  this.root.addChild(new Graphics().roundRect(x,y,w,h,9).fill(active?RED:INK).stroke({color:GOLD,width:1,alpha:.8}));
  text(this.root,label,x+w/2,y+h/2,18,active?PAPER:0xf0d7a5,{letterSpacing:0});this.zones.push({x,y,w,h,run});
 }
 update(header:number,footer:number){
  const g=this.game,m=g.hualing;this.header=header;this.footer=footer;this.root.visible=g.frontlineTest&&g.active;
  if(!g.frontlineTest){this.reset();return;}if(!this.root.visible)return;
  const key=[header,footer,this.opened,m.journey.chapter,m.journey.stage,m.frozen,m.upgrades.growth,JSON.stringify(m.upgrades.levels),m.bosses.active].join(':');
  if(key!==this.key){this.key=key;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.bars=new Graphics();
   this.root.addChild(new Graphics().rect(0,footer+1090,720,190).fill({color:INK,alpha:.96}).moveTo(28,footer+1090).lineTo(692,footer+1090).stroke({color:GOLD,width:1,alpha:.5}));
   this.root.addChild(new Graphics().roundRect(24,header+22,672,112,17).fill({color:INK,alpha:.96}).stroke({color:GOLD,width:1}));
   text(this.root,'前 线 画 境',137,header+52,25,PAPER,{letterSpacing:2});text(this.root,'美术试版 V2 · 厚纸山海',137,header+82,12,GOLD,{letterSpacing:1});
   this.stats=text(this.root,'',375,header+53,18,PAPER,{letterSpacing:0});
   this.button('画境设置',493,header+39,112,()=>{this.opened=!this.opened;});this.button('Ⅱ',617,header+39,57,()=>this.action('pause'));
   // These are primary navigation and progression, rather than hidden test controls.
   (Object.keys(HUALING_CHAPTERS) as HualingChapter[]).forEach((ch,i)=>this.button(HUALING_CHAPTERS[ch].name,26+i*169,header+144,161,()=>{if(ch!==m.journey.chapter)g.changeHualingChapter(ch);},ch===m.journey.chapter,40));
   this.root.addChild(new Graphics().roundRect(26,header+194,668,51,10).fill({color:INK,alpha:.94}).stroke({color:GOLD,width:1,alpha:.65}));
   text(this.root,BRUSH_SKILLS.map(id=>BRUSH_NAMES[id]+m.upgrades.levels[id]).join('  '),245,header+209,15,PAPER,{letterSpacing:0});
   this.growth=text(this.root,'',245,header+231,13,GOLD,{letterSpacing:0});
   this.button('画笔升级',486,header+201,101,()=>{if(!m.upgrades.growth)m.upgrades.startGrowth();else if(m.upgrades.picks<8&&m.upgrades.choices.length){m.upgrades.pending=Math.max(1,m.upgrades.pending);m.upgrades.panel='upgrade';}else m.say('本卷悟道已完成或笔法已满级 · 可用自选等级继续试验');},true,36);
   this.button('自选等级',595,header+201,89,()=>{m.upgrades.panel='custom';},false,36);
   this.root.addChild(this.bars);
   this.hint=text(this.root,'',360,footer+1078,16,0xf2d59e,{letterSpacing:0,stroke:{color:INK,width:3},wordWrap:true,wordWrapWidth:650});
   text(this.root,HUALING_CHAPTERS[m.journey.chapter].name+' · '+m.journey.sceneName,375,header+80,15,GOLD,{letterSpacing:0});
   if(this.opened){
    const y=header+272;this.root.addChild(new Graphics().rect(0,header+250,720,footer+1090-header-250).fill({color:0x101e24,alpha:.85}));
    this.root.addChild(new Graphics().roundRect(35,y,650,734,20).fill(PAPER).stroke({color:GOLD,width:2}));
    text(this.root,'画境设置',160,y+39,30,INK);this.button('继续战斗',519,y+20,140,()=>{this.opened=false;});
    const label=(s:string,dy:number)=>text(this.root,s,151,y+dy,19,RED,{letterSpacing:0});
    label('四卷山海',98);
    (Object.keys(HUALING_CHAPTERS) as HualingChapter[]).forEach((ch,i)=>this.button(HUALING_CHAPTERS[ch].name,57+i*153,y+122,145,()=>g.changeHualingChapter(ch),ch===m.journey.chapter));
    label('画卷时段',196);this.button('自动流转',57,y+220,145,()=>m.journey.resume(),m.journey.automatic);
    LANDSCAPE_STAGES.forEach((stage,i)=>this.button(m.journey.info.scenes[stage],210+i*153,y+220,145,()=>m.previewLandscape(stage),!m.journey.automatic&&m.journey.stage===stage));
    label('本卷精英 · 点击挑战',294);
    chapterElites(m.journey.chapter).forEach((kind,i)=>this.button(ELITE_NAMES[kind],57+i*123,y+318,115,()=>{g.clearHualingBoss();g.clearHualingElites();g.summonHualingElite(kind);this.opened=false;}));
    this.button('挑战首领',57,y+376,145,()=>{g.summonHualingBoss();this.opened=false;});this.button('清除精英 / 首领',210,y+376,210,()=>{g.clearHualingBoss();g.clearHualingElites();});this.button(m.frozen?'继续妖潮':'定格妖潮',429,y+376,231,()=>{m.frozen=!m.frozen;});
    label('画笔与成长',452);this.button('五系画笔 · 自选等级',57,y+476,295,()=>{this.opened=false;m.upgrades.panel='custom';});this.button(m.upgrades.growth?'暂停击杀升级':'开启击杀升级',365,y+476,295,()=>{this.opened=false;if(m.upgrades.growth){m.upgrades.growth=false;m.upgrades.pending=0;m.upgrades.panel=null;}else m.upgrades.startGrowth();});
    label('原画灵交互',550);
    this.button('补绘封印',57,y+574,145,()=>{m.chooseScene('seal');this.opened=false;});this.button('挥笔断链',210,y+574,145,()=>{m.chooseScene('chain');this.opened=false;});this.button('挥笔收火',363,y+574,145,()=>{m.chooseScene('fire');this.opened=false;});this.button('自由画龙',516,y+574,145,()=>{m.select('dragon');this.opened=false;});
    this.button('补充小怪',57,y+658,180,()=>g.seedHualingEnemies());this.button('重置测试服',249,y+658,205,()=>{this.reset();this.action('restart');});this.button('返回主入口',466,y+658,194,()=>{this.reset();this.action('menu');});
   }
  }
  if(this.growth)this.growth.text=m.upgrades.growth?(m.upgrades.picks>=8?'八次悟道已完成 · 可继续自选等级':`击杀升级  ${m.upgrades.kills} / ${m.upgrades.nextKills}    已悟道 ${m.upgrades.picks} / 8`):'点击画笔升级开启成长 · 或自选五系等级';
  if(this.stats)this.stats.text='斩妖 '+g.kills+'  ·  '+Math.floor(g.time)+'s';
  const p=m.selected?'游龙绘制中 · 沿战场画出龙的路线':g.collected.selected?'已选 '+COLLECTED_NAMES[g.collected.selected]+' · 点击战场选落点':m.bosses.active?m.bosses.notice:m.noticeTime>0?m.notice:'划动挥笔斩妖 · 点选下方符卡，再点战场投放';
  if(this.hint){this.hint.text=p;this.hint.visible=!this.opened;}

  const art=this.bars;art.clear();if(!this.opened){art.roundRect(48,header+109,300,5,2).fill(0x46534d).roundRect(48,header+109,Math.max(1,300*g.life/g.maxHp),5,2).fill(0xd37862);art.roundRect(370,header+109,300,5,2).fill(0x46534d).roundRect(370,header+109,Math.max(1,300*g.ink.currentInk/g.ink.maxInk),5,2).fill(0x9cc6be);}
 }
}
