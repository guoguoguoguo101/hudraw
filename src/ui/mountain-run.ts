import {MOUNTAIN_THEMES,chapterPanel,chapterMark} from './mountain-theme';
import {mapStartButton,mapBackdrop} from './mountain-map-art';
import {MountainMapLife} from './mountain-map-life';
import {MountainCombatHUD} from './mountain-combat-hud';
import {Container,Graphics,type Texture} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {MOUNTAIN_LEVELS,MOUNTAIN_CHAPTERS,SUPPORT_NAMES,SUPPORT_TEXT} from '../gameplay/mountain-run';
import {HUALING_CHAPTERS} from '../gameplay/hualing-chapters';
import {BRUSH_NAMES,BRUSH_SKILLS} from '../gameplay/brush-upgrades';
import {text} from './interface';
const PAPER=0xf2e3c5,INK=0x20342f,GOLD=0xd4ad6b,RED=0x9d4736;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
export class MountainUI{
 set mascotLoader(loader:()=>Promise<Texture>){this.mapLife.loader=loader;}
 get mapReady(){return this.opened&&this.mapLife.ready;}
 root=new Container();private mapBase=new Graphics();private mapLife=new MountainMapLife();private combatHUD=new MountainCombatHUD();private baseKey='';private surface=new Container();opened=false;chapter=0;selected=0;private zones:Zone[]=[];private key='';
 constructor(private game:Game,private cancel:()=>void,private start:(id:number)=>void,private home:()=>void,private pause:()=>void){this.root.addChild(this.mapBase,this.mapLife.root,this.surface,this.combatHUD.root);}
 open(){this.cancel();const l=this.game.campaign.level;if(l){this.chapter=Math.floor(l.id/10);this.selected=l.id;}this.opened=true;this.key='';}
 handle(e:InputEvent){const c=this.game.campaign;if(!this.opened&&c.levelId===null)return false;if(this.game.state==='paused'&&!this.opened)return false;if(!this.opened&&this.game.hualing.upgrades.blocked)return false;if(e.kind==='down'){if(!this.opened&&!c.supportPanel&&this.game.active){const pickup=c.pickups.find(p=>Math.hypot(p.x-e.x,p.y-e.y)<=46);if(pickup){this.cancel();if(c.collectInk(this.game,pickup.id))return true;}}const z=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);if(z){this.cancel();z.run();this.key='';return true;}}return this.opened||c.supportPanel||['win','lose'].includes(this.game.state);}
 private label(s:string,x:number,y:number,size=20,color:number=this.theme.ink){return text(this.surface,s,x,y,size,color,{letterSpacing:0});}
 private get ch(){return this.opened?MOUNTAIN_CHAPTERS[this.chapter]:this.game.campaign.level?.chapter??'valley';}
 private get theme(){return MOUNTAIN_THEMES[this.ch];}
 private box(x:number,y:number,w:number,h:number,color=INK){chapterPanel(this.surface,this.ch,x,y,w,h,false,.92);}
 private button(s:string,x:number,y:number,w:number,h:number,run:()=>void,active=false){chapterPanel(this.surface,this.ch,x,y,w,h,active);this.label(s,x+w/2,y+h/2,20,active?this.theme.accent:this.theme.ink);this.zones.push({x,y,w,h,run});}
 update(header=0,footer=0){const g=this.game,c=g.campaign;this.root.visible=this.opened||c.levelId!==null&&g.state!=='paused';if(!this.root.visible){this.key='';return;}
 this.combatHUD.update(g,header,footer);this.combatHUD.root.visible=this.combatHUD.root.visible&&!this.opened;
 this.mapBase.visible=this.opened;
 this.mapLife.root.visible=this.opened;
 if(this.opened){
  this.mapLife.update(this.ch,header,footer);
  const baseKey=[this.chapter,header,footer].join(':');
  if(baseKey!==this.baseKey){this.baseKey=baseKey;mapBackdrop(this.mapBase,this.ch,header,footer);}
 }
 const key=JSON.stringify([this.opened,this.chapter,this.selected,header,footer,g.state,c.room,c.spawned,c.waveSerial,c.roomKills,c.supportPanel,c.supportChoices,c.support,Math.ceil(c.supportReady-c.age),Math.ceil(c.dragonReady-c.age),Math.floor(g.life),Math.floor(g.ink.currentInk),Math.ceil(c.spawn),g.hualing.upgrades.levels,c.completed.size]);if(key===this.key)return;this.key=key;this.surface.removeChildren().forEach(v=>v.destroy({children:true}));this.zones=[];
 if(this.opened){
  this.drawMap(header,footer);return;
 }

 this.box(20,header+10,680,132);const l=c.level!;this.label(`${HUALING_CHAPTERS[l.chapter].name}  ${l.number} / 10 · ${l.title}`,315,header+35,22);this.button('Ⅱ',624,header+22,54,42,this.pause);this.label(`${c.roomName}  ${c.room+1}/5`,165,header+70,19,this.theme.muted);this.label(c.room===2||c.room===4?'拆招破势 · 留意攻击预兆':`击破${c.roomKills} · ${c.nextFormation} ${Math.max(0,Math.ceil(c.spawn))}s`,478,header+70,17,this.theme.muted);
 const bar=(x:number,y:number,width:number,ratio:number,color:number)=>{this.surface.addChild(new Graphics().roundRect(x,y,width,9,4).fill(0x101f1c).roundRect(x,y,Math.max(1,width*Math.max(0,Math.min(1,ratio))),9,4).fill(color));};
 this.label(`生命 ${Math.ceil(g.life)}/${g.maxHp}`,105,header+100,15);bar(185,header+96,145,g.life/g.maxHp,0xc1684e);this.label(`墨 ${Math.floor(g.ink.currentInk)}`,385,header+100,15);bar(425,header+96,245,g.ink.currentInk/100,g.ink.currentInk<20?0xda7652:0x77bbbc);
 this.label(BRUSH_SKILLS.filter(id=>g.hualing.upgrades.levels[id]).map(id=>`${BRUSH_NAMES[id]} Lv${g.hualing.upgrades.levels[id]}`).join('   ·   ')||'基础笔法 · 击妖积累经验后悟道',360,header+128,16,this.theme.muted);
 const y=footer+1150;this.box(20,y-12,680,118);this.button(c.age<c.dragonReady?`游龙 ${Math.ceil(c.dragonReady-c.age)}s`:'游龙 · 18墨',34,y,186,48,()=>c.dragon(g));this.button(c.support?(SUPPORT_NAMES[c.support]+(c.age<c.supportReady?` ${Math.ceil(c.supportReady-c.age)}s`:'')):'破精英后择灵符',234,y,452,48,()=>c.useSupport(g));this.label(g.ink.currentInk<20?'墨量不足 · 抬笔点击场中墨水符':'击妖攒经验 · 每六只掉落墨水符 · 点击或划过获取',360,y+77,18,this.theme.muted);
 if(c.supportPanel){this.shade();this.box(36,header+300,648,550);this.label('破阵得灵 · 择一相伴',360,header+345,32);this.label('灵符伴随本局，可反复使用',360,header+386,18,this.theme.muted);c.supportChoices.forEach((id,i)=>{this.button(SUPPORT_NAMES[id],60,header+420+i*126,600,110,()=>c.chooseSupport(g,id));this.label(SUPPORT_TEXT[id],360,header+496+i*126,17,this.theme.muted);});}
 if(g.state==='win'||g.state==='lose'){this.shade();this.box(60,header+340,600,520);this.label(g.state==='win'?'此境 · 已落印':'墨尽 · 再起笔',360,header+400,39);this.label(l.title,360,header+449,27,this.theme.muted);this.label(`击破 ${g.kills}  ·  用时 ${Math.floor(g.time)}秒`,360,header+495,21);this.label(BRUSH_SKILLS.filter(id=>g.hualing.upgrades.levels[id]).map(id=>`${BRUSH_NAMES[id]} Lv${g.hualing.upgrades.levels[id]}`).join(' · '),360,header+536,21,this.theme.muted);this.button('再战本关',100,header+590,520,58,()=>this.start(l.id));this.button(g.state==='win'&&l.id<39?'游历下一关':'返回选关',100,header+664,520,58,()=>{if(g.state==='win'&&l.id<39)this.start(l.id+1);else this.open();},true);this.button('选择其他关卡',100,header+738,520,58,()=>this.open());}
 }
 private drawMap(header:number,footer:number){
  const c=this.game.campaign,t=this.theme,ch=this.ch,art=new Graphics();this.surface.addChild(art);
  const label=(s:string,x:number,y:number,size=20,color:number=t.title)=>this.label(s,x,y,size,color);
  const left=(s:string,x:number,y:number,size=20,color:number=t.title)=>{const v=label(s,x,y,size,color);v.anchor.x=0;return v;};
  art.rect(0,header,720,148).fill({color:t.dark,alpha:.96});
  left('入画山海',32,header+34,30);
  const total=label('已落印 '+c.completed.size+' / 40',687,header+34,16);total.anchor.x=1;
  MOUNTAIN_CHAPTERS.forEach((chapter,i)=>{
   const x=28+i*170,y=header+71,w=154,h=69,on=this.chapter===i,ct=MOUNTAIN_THEMES[chapter],g=new Graphics();this.surface.addChild(g);g.alpha=on?1:.55;
   chapterMark(g,chapter,x+w/2,y+14,16);
   const tab=label(HUALING_CHAPTERS[chapter].name,x+w/2,y+45,18,t.title);tab.alpha=on?1:.64;
   if(on)g.moveTo(x+33,y+64).lineTo(x+w-33,y+64).stroke({color:ct.line,width:2});
   this.zones.push({x,y,w,h,run:()=>{this.chapter=i;this.selected=i*10;}});
  });
  // Fixed, evenly spaced level menu. The scenery changes; navigation stays familiar.
  const ink=ch==='palace'?t.title:t.ink,stroke=ch==='palace'?t.dark:t.paper;
  const top=header+294,bottom=footer+898,step=(bottom-top)/4;
  const heading=header+209;
  art.roundRect(174,heading-34,372,68,25).fill({color:t.dark,alpha:.88}).stroke({color:t.line,width:1.5});
  chapterMark(art,ch,210,heading,17);
  label(HUALING_CHAPTERS[ch].name,360,heading,33,t.title);
  chapterMark(art,ch,510,heading,17);
  const levels=MOUNTAIN_LEVELS.slice(this.chapter*10,this.chapter*10+10);
  levels.forEach((l,i)=>{
   const x=i%2===0?212:508,y=top+Math.floor(i/2)*step,on=this.selected===l.id,done=c.completed.has(l.id),g=new Graphics();this.surface.addChild(g);
   // Raised medallions have a common silhouette across all four chapters.
   if(on)g.roundRect(x-123,y-56,246,122,28).fill({color:t.title,alpha:ch==='palace'?.10:.28}).stroke({color:t.accent,width:2,alpha:.8});
   g.ellipse(x,y+30,58,17).fill({color:t.dark,alpha:.22});
   g.circle(x,y+5,43).fill(t.dark);
   g.circle(x,y,43).fill(on?t.accent:ch==='palace'?0x394564:t.paper).stroke({color:t.line,width:on?3:2});
   g.circle(x,y-2,35).stroke({color:on?t.title:t.line,width:1,alpha:.7});
   g.moveTo(x-26,y-23).quadraticCurveTo(x,y-40,x+26,y-23).stroke({color:t.title,width:2.5,alpha:.55});
   label(String(l.number).padStart(2,'0'),x,y-1,37,on?(ch==='palace'?t.dark:t.title):ink);
   const name=label(l.title,x,y+66,24,ink);name.style.fontWeight=on?'bold':'normal';name.style.stroke={color:stroke,width:3};
   if(l.boss){
    g.roundRect(x+25,y-44,55,27,10).fill(t.dark).stroke({color:t.line,width:1});label('首领',x+52,y-31,14,t.title);
   }
   if(done){
    g.circle(x+35,y+30,13).fill(t.accent).stroke({color:t.title,width:1});g.moveTo(x+29,y+30).lineTo(x+34,y+35).lineTo(x+43,y+24).stroke({color:ch==='palace'?t.dark:t.title,width:2.5});
   }
   if(on){
    g.poly([x-67,y-6,x-57,y,x-67,y+6]).fill(t.accent);
    g.poly([x+67,y-6,x+57,y,x+67,y+6]).fill(t.accent);
   }
   this.zones.push({x:x-123,y:y-56,w:246,h:138,run:()=>{this.selected=l.id;this.mapLife.wake();}});
  });
  const l=MOUNTAIN_LEVELS[this.selected],summary=new Graphics();this.surface.addChild(summary);const y=footer+1012;
  summary.moveTo(0,y+13).bezierCurveTo(180,y-7,390,y+32,720,y+3).lineTo(720,footer+1280).lineTo(0,footer+1280).closePath().fill({color:t.dark,alpha:.97});
  summary.moveTo(0,y+10).bezierCurveTo(180,y-10,390,y+29,720,y).stroke({color:t.line,width:2});
  chapterMark(summary,ch,61,y+62,23);left('第'+l.number+'境 · '+l.title,106,y+45,29);left(l.modifier.text,106,y+82,18);
  const by=footer+1138;
  chapterPanel(this.surface,ch,36,by,150,65,false,.95);label('返回主页',111,by+32,19,t.ink);
  const start=new Graphics();this.surface.addChild(start);mapStartButton(start,ch,206,by,478,65);label('落笔入画',435,by+32,25,ch==='palace'?t.dark:t.title);
  this.zones.push({x:36,y:by,w:150,h:65,run:()=>{this.opened=false;this.home();}});
  this.zones.push({x:206,y:by,w:478,h:65,run:()=>{this.opened=false;this.start(this.selected);}});
  label(l.boss?'本境镇守首领 · 破招后再落笔':'循山海入境 · 起笔择道，破阵得灵',360,footer+1238,16);
 }
 private shade(){this.surface.addChild(new Graphics().rect(0,-1000,720,3400).fill({color:0x0b1715,alpha:.85}));this.zones=[];}
}
