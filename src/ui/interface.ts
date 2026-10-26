import {InkHUD} from './ink-hud';
import {Container,Graphics,Text,type TextStyleOptions} from 'pixi.js';
import {type Art} from '../rendering/rigs';
import {COMBAT,BOSS} from '../gameplay/config';
import {RELICS} from '../gameplay/modifiers';
import type {InputController} from '../input/controller';
import type {Game} from '../gameplay/game';
import type {Point} from '../input/recognizer';
import type {ProgressTracker} from '../progress/tracker';
import type {GameViewport} from '../platform/viewport';
export type Action='hualingPractice'|'diagnostics'|'interactionPractice'|'practice'|'start'|'endless'|'settings'|'profile'|'closePanel'|'teach'|'pause'|'resume'|'restart'|'menu'|'sound'|'quality'|'debug'|'choose0'|'choose1'|'choose2'|'cultivate'|'archive'|'achievements'|'cultivationArchive'|'journal';
const COLORS={gold:0xe7ba68,ink:0x192027,white:0xfff7e8,red:0xd84332,wine:0x562a34,paper:0xf3e7cb,jade:0x72b5a4};
export function text(parent:Container,str:string,x:number,y:number,size:number,color=COLORS.gold,opts:Partial<TextStyleOptions>={}){const t=new Text({text:str,style:{fontFamily:['KaiTi','STKaiti','serif'],fontSize:size,fill:color,align:'center',letterSpacing:2,...opts}});t.anchor.set(.5);t.position.set(x,y);parent.addChild(t);return t;}
type Zone={x:number;y:number;w:number;h:number;action:Action};
export class Interface{
 canDiagnostics=false;tracker?:ProgressTracker;
 menuPanel:'settings'|'profile'|null=null;menuNotice='';
 private currentGame?:Game;private title:Text;
 inkHUD=new InkHUD();
 root=new Container();hud=new Container();footer=new Container();overlay=new Container();private shade:Graphics|null=null;private viewportTop=0;private viewportHeight=1280;tip:Text;score:Text;timer:Text;phase:Text;progress=new Graphics();zones:Zone[]=[];lastState='';lastLife=-1;panelAge=0;hintAge=0;muted=false;low=false;best=0;debug=false;counter:Text;practice:Text;drawMeter=new Graphics();levelLabel:Text;relicStatus:Text;drawStatus:Text;bossLabel:Text;bossMeter=new Graphics();cultivation=0;spirit=0;
 constructor(private art:Art,private onAction:(a:Action)=>void){this.root.addChild(this.hud,this.footer,this.overlay);
 this.hud.addChild(new Graphics().roundRect(24,32,672,177,24).fill({color:COLORS.ink,alpha:.91}).stroke({color:COLORS.gold,width:1,alpha:.35}));
 this.title=text(this.hud,'灵狐绘卷',126,68,29,COLORS.paper);this.phase=text(this.hud,'山 海 试 炼',129,107,15,COLORS.gold);

 this.score=text(this.hud,'0000',515,82,32,COLORS.white,{fontFamily:'Georgia',letterSpacing:1});this.levelLabel=text(this.hud,'灵魄 · LV 1',515,116,14,COLORS.gold);
 this.timer=text(this.hud,'60',348,63,25,COLORS.gold,{fontFamily:'Georgia',letterSpacing:0});
 this.hud.addChild(new Graphics().circle(647,87,29).stroke({color:COLORS.gold,width:1,alpha:.6}));text(this.hud,'Ⅱ',649,86,24,COLORS.paper);
 this.hud.addChild(this.progress);this.tip=text(this.hud,'落笔成符 · 妖影莫近',360,223,21,COLORS.wine);this.practice=text(this.hud,'',360,271,19,COLORS.wine);
 // Compact legend and the existing shared cooldown. These are not skill buttons.
 this.footer.addChild(new Graphics().roundRect(64,1190,592,62,15).fill({color:COLORS.ink,alpha:.65}).stroke({color:COLORS.gold,width:.8,alpha:.19}));
 text(this.footer,'一 斩    ○ 阵    ∧ 箭    Z 雷    ⌒ 狐尾',360,1221,18,COLORS.paper,{letterSpacing:1});
 this.hud.addChild(this.inkHUD.root,this.bossMeter);this.footer.addChild(this.drawMeter);
 this.relicStatus=text(this.footer,'',360,1090,15,COLORS.gold,{letterSpacing:0});this.drawStatus=text(this.footer,'',360,1137,19,COLORS.gold,{letterSpacing:1});this.bossLabel=text(this.hud,'',360,251,19,COLORS.paper,{letterSpacing:1});
 this.counter=text(this.root,'',360,1265,12,COLORS.gold,{fontFamily:'monospace',letterSpacing:0});
 }
 button(label:string,x:number,y:number,w:number,h:number,action:Action,primary=false){this.overlay.addChild(new Graphics().roundRect(x-w/2,y-h/2,w,h,13).fill({color:primary?COLORS.red:COLORS.ink,alpha:primary?1:.9}).stroke({color:COLORS.gold,width:1,alpha:.65}));text(this.overlay,label,x,y,primary?29:w<230?16:23,COLORS.paper);this.zones.push({x:x-w/2,y:y-h/2,w,h,action});}
 get brushViewport(){return {top:this.viewportTop,height:this.viewportHeight};}
 resize(rect:GameViewport){this.hud.y=rect.headerOffset;this.footer.y=rect.footerOffset;this.counter.y=1265+rect.footerOffset;this.viewportTop=rect.top;this.viewportHeight=rect.bottom-rect.top;if(this.shade){this.shade.y=rect.top;this.shade.scale.y=this.viewportHeight/1280;}if(this.lastState==='menu'&&this.currentGame)this.show('menu',this.currentGame);}
 private dim(alpha:number){this.shade=new Graphics().rect(0,0,720,1280).fill({color:COLORS.ink,alpha});this.shade.y=this.viewportTop;this.shade.scale.y=this.viewportHeight/1280;this.overlay.addChild(this.shade);}
 show(state:Game['state'],game:Game){this.currentGame=game;this.lastState=state;this.overlay.removeChildren().forEach(c=>c.destroy());this.zones=[];this.shade=null;this.footer.visible=this.hud.visible=!['menu'].includes(state);this.counter.visible=this.debug;
 if(['playing','tutorial','reviving'].includes(state)){this.zones.push({x:610,y:48,w:80,h:80,action:'pause'});return;}
 if(state==='upgrade'){this.dim(.78);text(this.overlay,'灵气凝华',360,346,54,COLORS.paper);text(this.overlay,`LV ${game.level} · 战斗暂停，选择一件法宝`,360,410,22,COLORS.gold);game.choices.forEach((id,i)=>{const item=RELICS.find(r=>r.id===id)!;const y=544+i*142;this.button(item.name,360,y,562,112,('choose'+i) as Action);text(this.overlay,item.description,360,y+34,18,COLORS.gold,{letterSpacing:0,wordWrap:true,wordWrapWidth:510});});return;}
 if(state==='menu'){
  this.overlay.addChild(new Graphics().roundRect(126,218,468,190,24).fill({color:COLORS.ink,alpha:.55}));
  this.button('设置',623,this.viewportTop+66,110,54,'settings');
  text(this.overlay,'山 海 剪 纸 幻 想',360,251,17,COLORS.gold,{letterSpacing:6});
  text(this.overlay,'灵狐绘卷',360,314,68,COLORS.paper,{letterSpacing:6,fontWeight:'normal'});
  text(this.overlay,'一笔镇妖 · 四符守山海',360,374,21,COLORS.paper);
  this.button('入画山海',360,838,440,96,'start',true);
  text(this.overlay,'四卷山海 · 四十关试炼',360,863,17,COLORS.paper,{letterSpacing:1});
  // Keep the fox and scenery clear above a compact, consistently aligned menu.
  this.button('无尽妖潮',360,953,440,90,'endless');
  text(this.overlay,'无限闯关 · 一笔续守山海',360,977,16,COLORS.gold,{letterSpacing:1});
  this.button('灵狐志',360,1060,440,68,'profile');
  this.button('画灵 · 绘物试验',360,1137,440,60,'hualingPractice');
  this.button('演武画境 · 自由试符',246,1207,212,52,'practice');
  this.button('符术交互 · 试验画境',474,1207,212,52,'interactionPractice');
  if(this.menuPanel)this.showMenuPanel();return;
 }
 const isPause=state==='paused';
 this.dim(isPause?.74:.67);
 this.overlay.addChild(new Graphics().roundRect(80,334,560,650,26).fill({color:COLORS.paper,alpha:.98}).stroke({color:COLORS.gold,width:2}));
 text(this.overlay,isPause?'歇笔片刻':state==='win'?'山海安宁':'灵火未尽',360,428,54,COLORS.wine);
 text(this.overlay,isPause?'画卷静止，灵狐等你':state==='win'?'九尾展灵，万妖归寂':'收拾笔意，再守一回山海',360,499,21,COLORS.wine,{letterSpacing:1});
 if(!isPause){text(this.overlay,String(game.score).padStart(4,'0'),360,568,62,COLORS.red,{fontFamily:'Georgia',letterSpacing:3});text(this.overlay,`灵魄 · 斩妖 ${game.kills} · 施符 ${game.casts}`,360,628,21,COLORS.wine,{letterSpacing:0});text(this.overlay,game.endless?`守护 ${Math.floor(game.time)} 秒 · 第 ${game.wave+1} 关`:`守护 ${Math.floor(game.time)} / ${game.duration} 秒`,360,675,21,COLORS.wine);const notes=this.tracker?.runNotices??[];if(notes.length)text(this.overlay,notes.slice(-2).join(' · '),360,716,17,COLORS.red,{letterSpacing:0,wordWrap:true,wordWrapWidth:490});}
 this.button(isPause?'继续画符':'再守一卷',360,isPause?609:780,402,68,isPause?'resume':'restart',true);
 if(isPause){if(this.canDiagnostics)this.button('复制运行诊断',360,543,402,44,'diagnostics');this.button(this.muted?'音效：关':'音效：开',249,716,190,54,'sound');this.button(this.low?'画质：轻盈':'画质：精致',470,716,190,54,'quality');this.button(this.debug?'关闭手势调试':'查看手势调试',360,796,402,54,'debug');}
 if(!isPause)this.button('万象符录',360,855,402,58,'archive');
 this.button('回到山海',360,isPause?880:927,402,56,'menu');
 }
 private showMenuPanel(){
  this.zones=[];this.dim(.86);
  this.overlay.addChild(new Graphics().roundRect(90,300,540,810,24).fill({color:COLORS.ink}).stroke({color:COLORS.gold,width:1,alpha:.6}));
  const settings=this.menuPanel==='settings';
  text(this.overlay,settings?'设置':'灵狐志',360,366,38,COLORS.paper);
  this.button('关闭',555,358,100,48,'closePanel');
  if(settings){
   this.button(this.muted?'音效：关':'音效：开',360,475,440,66,'sound');
   this.button(this.low?'画质：轻盈':'画质：精致',360,567,440,66,'quality');
   this.button('九十秒符术入门',360,685,440,66,'teach');
   this.button('万象符录',360,777,440,66,'archive');
   if(this.canDiagnostics)this.button('复制运行诊断',360,869,440,60,'diagnostics');
   text(this.overlay,'按住绘符 · 松手释放',360,1006,19,COLORS.gold);
  }else{
   const stats=this.tracker?.data.stats;
   text(this.overlay,'山海行者',360,457,29,COLORS.paper);
   const rows=[['最佳灵魄',this.best],['灵玉',this.spirit],['累计斩妖',stats?.totalKills??0],['完成试炼',stats?.totalChapterClears??0]];
   rows.forEach(([name,value],i)=>{const x=245+(i%2)*230,y=542+Math.floor(i/2)*100;text(this.overlay,String(value),x,y,30,COLORS.gold);text(this.overlay,String(name),x,y+35,17,COLORS.paper);});
   this.button(this.cultivation>=10?'修行已满阶':`修行 ${this.cultivation} 阶 · 100灵玉升阶`,360,779,440,64,'cultivate');
   this.button('镇妖功绩',245,873,210,64,'achievements');
   this.button('游历记录',475,873,210,64,'journal');
   this.button('万象符录',360,967,440,64,'archive');
   if(this.menuNotice)text(this.overlay,this.menuNotice,360,1045,18,COLORS.gold,{letterSpacing:0});
  }
 }
 hint(str:string){this.tip.text=str;this.hintAge=1.8;}
 update(game:Game,dt:number,fps:number,input?:InputController){
 if(game.hualingPractice&&game.active)this.hud.visible=game.hualing.journey.chapter==='valley'&&!game.hualing.bosses.active;
 this.title.text=game.hualingPractice?'画 灵':'灵狐绘卷';this.hintAge=Math.max(0,this.hintAge-dt);if(!this.hintAge)this.tip.text=game.time>=game.duration&&!game.bossDead?'决胜 · 斩灭鬼王完成试炼':game.training?'按住绘符 · 三秒符境 · 松手释放':'按住绘符 · 观察方向 · 三分钟试炼';
 this.timer.text=game.endless?'∞':String(Math.max(0,Math.ceil(game.duration-game.time)));this.score.text=String(game.score).padStart(4,'0');this.phase.text=`生命 ${Math.ceil(game.life)} / ${game.maxHp}${game.shield?' +'+Math.ceil(game.shield)+'盾':''}`;
 if(game.endless){this.phase.text=`第 ${game.wave+1} 关 · 生命 ${Math.ceil(game.life)}`;if(!this.hintAge)this.tip.text='无限闯关 · 每三十秒迎来下一关';}
 this.levelLabel.text=`LV ${game.level} · ${Math.floor(game.xp)}/${game.xpNeeded}灵气`;
 this.inkHUD.update(game.ink,dt);
 this.progress.clear().moveTo(48,139).lineTo(672,139).stroke({color:COLORS.red,width:3,alpha:.12}).moveTo(48,139).lineTo(48+624*game.life/game.maxHp,139).stroke({color:COLORS.red,width:3,alpha:.7});

 const preview=input?.drawing?input.preview:input?.last;this.drawStatus.text=input?.drawing?`符境 ${(COMBAT.drawLimit-input.drawAge).toFixed(1)}秒 · ${preview?.valid?(preview.rune==='line'?'松手出刀 · 划过小怪':preview.rune==='ink'?'未成符 · 松手消散':preview.reason+' · 松手施符'):'落笔 · 划动施符'}`:input&&input.traceAge<.7&&preview?preview.reason:'';
 this.drawMeter.clear();if(input?.drawing)this.drawMeter.moveTo(208,1165).lineTo(512,1165).stroke({color:COLORS.gold,width:2,alpha:.18}).moveTo(208,1165).lineTo(208+304*(1-input.drawAge/COMBAT.drawLimit),1165).stroke({color:COLORS.gold,width:2,alpha:.8});
 this.relicStatus.text=[...game.modifiers.owned].map(([id,n])=>RELICS.find(r=>r.id===id)!.name.slice(2)+'×'+n).join(' · ');this.practice.text='';const boss=game.enemies.find(e=>e.kind==='boss'&&!e.chapterBoss);this.tip.visible=!boss;this.bossLabel.text=boss?`赤面鬼王 · ${['','甲胄','召妖','血月'][boss.phase]} ${boss.ai==='Telegraph'?'蓄力 '+Math.max(0,BOSS.windups[boss.phase-1]-boss.stateAge).toFixed(1)+'秒':''}`:'';this.bossMeter.clear();if(boss)this.bossMeter.moveTo(168,272).lineTo(552,272).stroke({color:COLORS.ink,width:6}).moveTo(168,272).lineTo(168+384*Math.max(0,boss.hp/boss.maxHp),272).stroke({color:COLORS.red,width:4});
 this.footer.visible=this.hud.visible&&!game.practice;
 if(game.practice){this.timer.text='∞';this.levelLabel.text='演武画境';this.phase.text=game.functionalRelics.enabled?`生命 ${Math.ceil(game.life)} / ${game.maxHp} · 演武免伤`:'无伤试符 · 小怪源源不绝';if(!game.interactionPractice)this.tip.text='下方选等级 · 画符看效果';this.relicStatus.text='';}
 if(game.interactionPractice){this.levelLabel.text='符术交互 · 原型';this.phase.text=`留痕 ${game.interactions.traces.length}/6 · 三秒连斩`;if(!this.hintAge)this.tip.text=input?.drawing?'落笔搭形 · 松手出刀':'两线交叉爆发 · 三线围合绞杀';}
 if(game.hualingPractice){this.tip.visible=false;this.levelLabel.text='画灵 · 绘物试验';this.drawStatus.text='';this.drawMeter.clear();this.phase.text='挥笔划妖 · 自在绘物';this.tip.text='笔尖划过即命中 · 选纸符绘物成灵';this.practice.text='';this.timer.text='∞';}
 this.counter.text=this.debug?`FPS ${Math.round(fps)}  ENEMIES ${game.enemies.length} · 时速 ${input?.drawing&&!game.hualingPractice?'50%':'100%'}`:'';
 }
 hit(p:Point){if(['playing','tutorial','reviving'].includes(this.lastState))p={x:p.x,y:p.y-this.hud.y};const z=[...this.zones].reverse().find(z=>p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h);if(z){this.onAction(z.action);return true;}return ['menu','paused','upgrade','win','lose'].includes(this.lastState);}
}
