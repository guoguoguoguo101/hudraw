import {MOUNTAIN_THEMES,chapterPanel,chapterMark,brushGlyph} from './mountain-theme';
import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {BRUSH_SKILLS,BRUSH_NAMES,BRUSH_DESCRIPTIONS,type BrushSkill} from '../gameplay/brush-upgrades';
import {HUALING_CHAPTERS} from '../gameplay/hualing-chapters';
import {text} from './interface';
const GOLD=0xe1b675,PAPER=0xf4e5c6,INK=0x202b2d,RED=0x913d32;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
export class BrushUpgradeUI{
 compactUI=false;
 root=new Container();private header=0;private zones:Zone[]=[];private key='';private status?:Text;
 constructor(private game:Game,private cancel:()=>void){}
 handle(e:InputEvent){
  if(!this.game.hualingPractice||!this.game.active||!this.root.visible)return false;
  const m=this.game.hualing.upgrades;
  if(e.kind==='down'){
   const z=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);
   if(z){this.cancel();z.run();this.key='';this.update();return true;}
  }
  return m.blocked;
 }
 private button(label:string,x:number,y:number,w:number,h:number,run:()=>void,active=false){
  this.root.addChild(new Graphics().roundRect(x,y,w,h,8).fill(active?RED:INK).stroke({color:GOLD,width:active?2:1,alpha:.8}));
  text(this.root,label,x+w/2,y+h/2,19,active?PAPER:GOLD,{letterSpacing:0});this.zones.push({x,y,w,h,run});
 }
 private icon(id:BrushSkill,x:number,y:number){
  const g=new Graphics();g.position.set(x,y);this.root.addChild(g);
  if(id==='spray')for(let i=0;i<3;i++){const px=(i-1)*13,py=i===1?-12:2;g.moveTo(px-7,py+12).quadraticCurveTo(px+12,py-12,px+7,py+8).quadraticCurveTo(px+3,py+17,px-7,py+12).fill(0xe86b46);}
  if(id==='wide')g.poly([-25,12,-16,-8,22,-17,30,4,-3,16]).fill(0xe86b46).stroke({color:GOLD,width:1});
  if(id==='splash'){for(const side of [-1,1])g.moveTo(-26,side*10).bezierCurveTo(-9,side*22,11,-side*3,28,side*10).stroke({color:side===1?GOLD:0xd56b48,width:4,cap:'round'});}
  if(id==='trail'){
   g.ellipse(0,5,27,18).fill({color:0x111f24,alpha:.9}).stroke({color:GOLD,width:2});g.ellipse(0,5,20,12).stroke({color:GOLD,width:.8,alpha:.8});
   for(let i=0;i<8;i++){const a=i*Math.PI/4;g.moveTo(Math.cos(a)*22,5+Math.sin(a)*14).lineTo(Math.cos(a)*26,5+Math.sin(a)*18).stroke({color:PAPER,width:1});}
   g.moveTo(-10,-8).quadraticCurveTo(-14,-24,-5,-18).lineTo(0,-23).lineTo(6,-18).quadraticCurveTo(16,-23,10,-8).quadraticCurveTo(0,7,-10,-8).fill(PAPER);g.moveTo(-6,-12).lineTo(-2,-9).moveTo(6,-12).lineTo(2,-9).stroke({color:INK,width:2});
  }
 }
 update(header=this.header){
  this.header=header;
  const g=this.game,m=g.hualing.upgrades;this.root.visible=g.hualingPractice&&g.active&&(!this.compactUI||m.panel!==null);if(!this.root.visible){this.key='';return;}
  const chapter=g.hualing.journey.chapter,compact=chapter!=='valley'||g.hualing.bosses.active,y=compact?header+168:g.hualing.bounds.top-18,top=g.hualing.bounds.top+35;
  const key=JSON.stringify([m.levels,m.panel,m.growth,m.picks,m.pending,y,chapter,this.compactUI]);
  if(key===this.key){if(this.status)this.status.text=this.summary();return;}
  this.key=key;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.status=undefined;
  if(!this.compactUI){
  this.root.addChild(new Graphics().roundRect(30,y,660,34,7).fill({color:INK,alpha:.94}).stroke({color:GOLD,width:1,alpha:.45}));
  this.status=text(this.root,this.summary(),183,y+17,14,PAPER,{letterSpacing:0});
  this.button(m.growth?'成长详情':'成长试演',350,y,142,34,()=>{if(m.growth)m.panel='custom';else m.startGrowth();},m.growth);
  this.button('自定义等级',502,y,182,34,()=>{m.panel='custom';});
  }
  if(!m.panel)return;
  if(m.runMode&&m.panel==='upgrade'){this.runPanel(header);return;}
  this.root.addChild(new Graphics().rect(0,-500,720,2400).fill({color:0x10201f,alpha:.76}));
  this.zones=[];
  this.root.addChild(new Graphics().roundRect(38,top,644,545,18).fill(INK).stroke({color:GOLD,width:2}));
  text(this.root,m.panel==='upgrade'?'画笔悟道 · 选择一项':'画笔试演 · 自定义等级',360,top+40,30,PAPER,{fontWeight:'bold',letterSpacing:1});
  text(this.root,m.panel==='upgrade'?`${HUALING_CHAPTERS[chapter].name} · 本轮成长 ${m.picks+1} / 8`:`${HUALING_CHAPTERS[chapter].name} · 本场景独立设置`,360,top+77,18,GOLD,{letterSpacing:0});
  if(m.panel==='upgrade'){
   for(const [i,id] of m.choices.entries()){
    const yy=top+106+i*84,next=m.levels[id]+1;
    this.root.addChild(new Graphics().roundRect(64,yy,592,76,10).fill(0xf0dfbb).stroke({color:GOLD,width:1.5}));this.icon(id,106,yy+38);
    text(this.root,`${BRUSH_NAMES[id]}  ${m.levels[id]===0?'解锁 Lv1':`Lv${m.levels[id]} → Lv${next}`}`,375,yy+22,24,RED,{fontWeight:'bold',letterSpacing:0});
    text(this.root,BRUSH_DESCRIPTIONS[id][next],390,yy+53,18,INK,{letterSpacing:0});
    this.zones.push({x:64,y:yy,w:592,h:76,run:()=>m.choose(id)});
   }
   text(this.root,`${m.runMode?'精修两门笔法 · 八次悟道可双满级':'有效击杀积累灵气 · 下次仍可升级同一项'}`,360,top+472,18,GOLD,{letterSpacing:0});
   if(!this.compactUI)this.button('切换自定义',245,top+497,230,34,()=>{m.panel='custom';});
  }else{
   for(const [i,id] of BRUSH_SKILLS.entries()){
    const yy=top+107+i*82;this.icon(id,94,yy+17);text(this.root,BRUSH_NAMES[id],160,yy+17,25,PAPER,{letterSpacing:1});
    for(let l=0;l<=4;l++)this.button(l?`Lv${l}`:'关闭',232+l*82,yy-2,73,38,()=>m.setLevel(id,l),m.levels[id]===l);
    text(this.root,BRUSH_DESCRIPTIONS[id][m.levels[id]],367,yy+52,18,GOLD,{letterSpacing:0});
   }
   this.button('全部满级',64,top+440,174,38,()=>{for(const id of BRUSH_SKILLS)m.setLevel(id,4);});
   this.button('全部关闭',270,top+440,174,38,()=>{for(const id of BRUSH_SKILLS)m.setLevel(id,0);});
   this.button('继续试画',476,top+440,174,38,()=>{m.panel=null;},true);
   this.button('墨鲤试喷',64,top+493,174,36,()=>{m.setLevel('spray',4);m.carp.prime();m.panel=null;g.hualing.say('挥笔即出墨鲤 · 持续画，每1.4秒再喷一条');},true);
   this.button('从零开始成长 · 击杀再升级',250,top+493,400,36,()=>m.startGrowth());
  }
 }
 private runPanel(header:number){
  const m=this.game.hualing.upgrades,ch=this.game.hualing.journey.chapter,t=MOUNTAIN_THEMES[ch],top=header+300;
  this.root.addChild(new Graphics().rect(0,-1000,720,3400).fill({color:t.dark,alpha:ch==='palace'?.66:.55}));this.zones=[];
  const mark=new Graphics();this.root.addChild(mark);chapterMark(mark,ch,360,header+142,26);
  text(this.root,'笔 法 悟 道',360,header+213,48,t.title,{letterSpacing:3});
  text(this.root,`三选一 · 强化本局笔法     ${m.picks+1} / 8`,360,header+264,20,t.title,{letterSpacing:1});
  for(const [i,id]of m.choices.entries()){
   const y=top+i*180,next=m.levels[id]+1;chapterPanel(this.root,ch,40,y,640,158);brushGlyph(this.root,ch,id,129,y+77,1.08);
   text(this.root,BRUSH_NAMES[id],277,y+34,31,t.ink,{fontWeight:'bold',letterSpacing:4});
   text(this.root,m.levels[id]?`Lv${m.levels[id]} → Lv${next}`:'领悟 Lv1',552,y+34,22,t.accent,{letterSpacing:0});
   text(this.root,BRUSH_DESCRIPTIONS[id][next],426,y+79,20,t.ink,{letterSpacing:0,wordWrap:true,wordWrapWidth:399});
   const dots=new Graphics();this.root.addChild(dots);for(let n=0;n<4;n++){const x=260+n*30,yy=y+128;dots.poly([x,yy-6,x+6,yy,x,yy+6,x-6,yy]).fill({color:n<next?t.accent:t.paper,alpha:1}).stroke({color:t.accent,width:1});}
   text(this.root,next===4?'圆满 · 笔法大成':m.levels[id]?'精进此法':'新入笔法',536,y+127,17,t.muted,{letterSpacing:1});
   this.zones.push({x:40,y,w:640,h:158,run:()=>m.choose(id)});
  }
  text(this.root,'优先精进已有笔法，更容易修至 Lv4',360,top+576,20,t.title,{letterSpacing:1});
  text(this.root,`${HUALING_CHAPTERS[ch].name} · 选择后继续战斗`,360,top+615,17,t.title,{letterSpacing:0});
 }
 private summary(){const m=this.game.hualing.upgrades;return `喷${m.levels.spray} · 阔${m.levels.wide} · 双${m.levels.splash} · 留墨${m.levels.trail}${m.levels.spray?(m.carp.ready?'  鲤可喷':`  鲤${m.carp.remaining.toFixed(1)}秒`):''}${m.growth?`  ${m.kills}/${m.nextKills}`:''}`;}
}
