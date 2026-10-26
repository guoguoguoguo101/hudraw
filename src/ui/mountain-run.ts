import {MOUNTAIN_THEMES,chapterPanel,chapterMark} from './mountain-theme';
import {ScrollLandscapeRenderer} from '../rendering/scroll-landscape';
import {Hualing} from '../gameplay/hualing';
import {Container,Graphics} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {MOUNTAIN_LEVELS,MOUNTAIN_CHAPTERS,SUPPORT_NAMES,SUPPORT_TEXT} from '../gameplay/mountain-run';
import {HUALING_CHAPTERS} from '../gameplay/hualing-chapters';
import {BRUSH_NAMES,BRUSH_SKILLS} from '../gameplay/brush-upgrades';
import {text} from './interface';
const PAPER=0xf2e3c5,INK=0x20342f,GOLD=0xd4ad6b,RED=0x9d4736;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
export class MountainUI{
 root=new Container();private surface=new Container();landscape=new ScrollLandscapeRenderer();private model=new Hualing();opened=false;chapter=0;selected=0;private zones:Zone[]=[];private key='';
 constructor(private game:Game,private cancel:()=>void,private start:(id:number)=>void,private home:()=>void,private pause:()=>void){this.root.addChild(this.landscape.back,this.landscape.front,this.surface);}
 open(){this.cancel();const l=this.game.campaign.level;if(l){this.chapter=Math.floor(l.id/10);this.selected=l.id;}this.opened=true;this.key='';}
 handle(e:InputEvent){const c=this.game.campaign;if(!this.opened&&c.levelId===null)return false;if(this.game.state==='paused'&&!this.opened)return false;if(!this.opened&&this.game.hualing.upgrades.blocked)return false;if(e.kind==='down'){const z=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);if(z){this.cancel();z.run();this.key='';return true;}}return this.opened||c.supportPanel||['win','lose'].includes(this.game.state);}
 private label(s:string,x:number,y:number,size=20,color:number=this.theme.ink){return text(this.surface,s,x,y,size,color,{letterSpacing:0});}
 private get ch(){return this.opened?MOUNTAIN_CHAPTERS[this.chapter]:this.game.campaign.level?.chapter??'valley';}
 private get theme(){return MOUNTAIN_THEMES[this.ch];}
 private box(x:number,y:number,w:number,h:number,color=INK){chapterPanel(this.surface,this.ch,x,y,w,h,false,.92);}
 private button(s:string,x:number,y:number,w:number,h:number,run:()=>void,active=false){chapterPanel(this.surface,this.ch,x,y,w,h,active);this.label(s,x+w/2,y+h/2,20,active?this.theme.accent:this.theme.ink);this.zones.push({x,y,w,h,run});}
 update(header=0,footer=0){const g=this.game,c=g.campaign;this.root.visible=this.opened||c.levelId!==null&&g.state!=='paused';if(!this.root.visible){this.key='';return;}
 if(this.model.journey.chapter!==MOUNTAIN_CHAPTERS[this.chapter]){this.model.journey.chapter=MOUNTAIN_CHAPTERS[this.chapter];this.model.journey.preview(this.chapter===2?'night':'sunset');}this.model.clock+=1/60;this.landscape.back.visible=this.landscape.front.visible=this.opened;if(this.opened){this.landscape.back.y=this.landscape.front.y=header;this.landscape.back.scale.y=this.landscape.front.scale.y=(1280+footer-header)/1280;this.landscape.update(this.model,true);}
 const key=JSON.stringify([this.opened,this.chapter,this.selected,header,footer,g.state,c.room,c.spawned,c.roomKills,c.supportPanel,c.supportChoices,c.support,Math.ceil(c.supportReady-c.age),Math.ceil(c.dragonReady-c.age),Math.floor(g.life),Math.floor(g.ink.currentInk),Math.ceil(c.spawn),g.hualing.upgrades.levels,c.completed.size]);if(key===this.key)return;this.key=key;this.surface.removeChildren().forEach(v=>v.destroy({children:true}));this.zones=[];
 if(this.opened){
  this.drawMap(header,footer);return;
 }

 this.box(20,header+10,680,132);const l=c.level!;this.label(`${HUALING_CHAPTERS[l.chapter].name}  ${l.number} / 10 · ${l.title}`,315,header+35,22);this.button('Ⅱ',624,header+22,54,42,this.pause);this.label(`${c.roomName}  ${c.room+1}/5`,165,header+70,19,this.theme.muted);this.label(c.room===2||c.room===4?'拆招破势 · 留意攻击预兆':`击破${c.roomKills} · ${c.nextFormation} ${Math.max(0,Math.ceil(c.spawn))}s`,478,header+70,17,this.theme.muted);
 const bar=(x:number,y:number,width:number,ratio:number,color:number)=>{this.surface.addChild(new Graphics().roundRect(x,y,width,9,4).fill(0x101f1c).roundRect(x,y,Math.max(1,width*Math.max(0,Math.min(1,ratio))),9,4).fill(color));};
 this.label(`生命 ${Math.ceil(g.life)}/${g.maxHp}`,105,header+100,15);bar(185,header+96,145,g.life/g.maxHp,0xc1684e);this.label(`墨 ${Math.floor(g.ink.currentInk)}`,385,header+100,15);bar(425,header+96,245,g.ink.currentInk/100,0x77bbbc);
 this.label(BRUSH_SKILLS.filter(id=>g.hualing.upgrades.levels[id]).map(id=>`${BRUSH_NAMES[id]} Lv${g.hualing.upgrades.levels[id]}`).join('   ·   ')||'起笔悟道 · 选择主修',360,header+128,16,this.theme.muted);
 const y=footer+1150;this.box(20,y-12,680,118);this.button(c.age<c.dragonReady?`游龙 ${Math.ceil(c.dragonReady-c.age)}s`:'游龙 · 18墨',34,y,186,48,()=>c.dragon(g));this.button(c.support?(SUPPORT_NAMES[c.support]+(c.age<c.supportReady?` ${Math.ceil(c.supportReady-c.age)}s`:'')):'破精英后择灵符',234,y,452,48,()=>c.useSupport(g));this.label(g.ink.currentInk<20?'墨量不足 · 抬笔回墨后再出击':'抬笔回墨 · 连线扫群妖 · 清段补25墨',360,y+77,18,this.theme.muted);
 if(c.supportPanel){this.shade();this.box(36,header+300,648,550);this.label('破阵得灵 · 择一相伴',360,header+345,32);this.label('灵符伴随本局，可反复使用',360,header+386,18,this.theme.muted);c.supportChoices.forEach((id,i)=>{this.button(SUPPORT_NAMES[id],60,header+420+i*126,600,110,()=>c.chooseSupport(g,id));this.label(SUPPORT_TEXT[id],360,header+496+i*126,17,this.theme.muted);});}
 if(g.state==='win'||g.state==='lose'){this.shade();this.box(60,header+340,600,520);this.label(g.state==='win'?'此境 · 已落印':'墨尽 · 再起笔',360,header+400,39);this.label(l.title,360,header+449,27,this.theme.muted);this.label(`击破 ${g.kills}  ·  用时 ${Math.floor(g.time)}秒`,360,header+495,21);this.label(BRUSH_SKILLS.filter(id=>g.hualing.upgrades.levels[id]).map(id=>`${BRUSH_NAMES[id]} Lv${g.hualing.upgrades.levels[id]}`).join(' · '),360,header+536,21,this.theme.muted);this.button('再战本关',100,header+590,520,58,()=>this.start(l.id));this.button(g.state==='win'&&l.id<39?'游历下一关':'返回选关',100,header+664,520,58,()=>{if(g.state==='win'&&l.id<39)this.start(l.id+1);else this.open();},true);this.button('选择其他关卡',100,header+738,520,58,()=>this.open());}
 }
 private drawMap(header:number,footer:number){
  const ch=this.ch,t=this.theme,c=this.game.campaign;
  this.surface.addChild(new Graphics().rect(0,-1000,720,3400).fill({color:t.dark,alpha:ch==='snow'?.12:ch==='palace'?.47:.16}));
  this.surface.addChild(new Graphics().rect(0,header,720,175).fill({color:t.dark,alpha:.7}));
  this.label('入画山海',360,header+40,33,t.title);this.label('四卷 · 四十境 / 自由选关',360,header+80,17,t.title);
  MOUNTAIN_CHAPTERS.forEach((chapter,i)=>this.button(HUALING_CHAPTERS[chapter].name,20+i*175,header+112,155,44,()=>{this.chapter=i;this.selected=i*10;},this.chapter===i));
  const name=HUALING_CHAPTERS[ch].name;for(let i=0;i<name.length;i++)this.label(name[i],67,header+248+i*49,42,t.title);
  this.label(['卷一 · 枫火照途','卷二 · 潮声引梦','卷三 · 万星同轨','卷四 · 万山同眠'][this.chapter],213,header+205,19,t.title);
  const top=header+310,bottom=footer+948,h=bottom-top,points:Array<{x:number;y:number}>=[];
  for(let i=0;i<10;i++){
   const u=i/9;
   if(ch==='palace'){const a=Math.PI/2+i*Math.PI*2/10;points.push({x:408+Math.cos(a)*214,y:(top+bottom)/2+Math.sin(a)*h*.41});}
   else if(ch==='sea')points.push({x:382+Math.sin(i*.99-1)*170,y:bottom-u*h});
   else if(ch==='snow')points.push({x:210+u*290+Math.sin(i*1.9)*79,y:bottom-u*h});
   else points.push({x:376+Math.sin(i*1.19-1)*165,y:bottom-u*h});
  }
  const path=new Graphics();this.surface.addChild(path);
  if(ch==='palace'){const cy=(top+bottom)/2;for(const r of[166,218,240])path.ellipse(408,cy,r,r/240*h*.46).stroke({color:t.line,width:r===240?1.5:.7,alpha:.7});for(let i=0;i<48;i++){const a=i/48*Math.PI*2;path.moveTo(408+Math.cos(a)*244,cy+Math.sin(a)*h*.47).lineTo(408+Math.cos(a)*(i%4?249:258),cy+Math.sin(a)*h*(i%4?.48:.49)).stroke({color:t.line,width:1,alpha:.55});}chapterMark(path,ch,408,cy,45);}
  else{path.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];path.bezierCurveTo(a.x,a.y-32,b.x,b.y+32,b.x,b.y);}path.stroke({color:ch==='snow'?0x914c44:t.line,width:ch==='sea'?14:ch==='valley'?9:2.4,alpha:ch==='sea'?.4:.65});if(ch==='sea'){for(let j=0;j<3;j++){path.moveTo(points[0].x-20+j*11,points[0].y);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];path.bezierCurveTo(a.x-30+j*18,a.y-30,b.x-25+j*18,b.y+33,b.x-20+j*11,b.y);}path.stroke({color:0xe6f0d8,width:1,alpha:.65});}}}
  points.forEach((p,i)=>{const l=MOUNTAIN_LEVELS[this.chapter*10+i],selected=this.selected===l.id,done=c.completed.has(l.id),r=selected?30:25,g=new Graphics();this.surface.addChild(g);
   if(selected)for(let k=0;k<3;k++)g.circle(p.x,p.y,r+5+k*5).stroke({color:t.line,width:1,alpha:.55-k*.14});
   if(ch==='snow'){g.poly([p.x-r,p.y+r*.7,p.x-r*.6,p.y-r*.65,p.x+5,p.y-r,p.x+r*.6,p.y-r*.4,p.x+r,p.y+r*.75]).fill(selected?t.ink:0x59707d).stroke({color:0xe9eff0,width:1.5});g.moveTo(p.x-r*.6,p.y-r*.65).lineTo(p.x+5,p.y-r).lineTo(p.x+r*.6,p.y-r*.4).stroke({color:0xf9fcfa,width:4});}
   else if(ch==='valley'){g.circle(p.x,p.y,r).fill(selected?t.accent:0x7c332b).stroke({color:0xffe2ad,width:1.5});g.circle(p.x,p.y,r-5).stroke({color:0xffdfb1,width:.6,alpha:.65});}
   else if(ch==='sea'){g.circle(p.x,p.y,r).fill(selected?0xffefca:0xc7e0d9).stroke({color:t.line,width:1.5});g.circle(p.x-8,p.y-9,r*.25).fill({color:0xffffff,alpha:.45});g.ellipse(p.x,p.y+r,40,7).stroke({color:0xc8eee1,width:1,alpha:.6});}
   else g.circle(p.x,p.y,r).fill(t.dark).stroke({color:t.line,width:selected?2:1.2});
   this.label(String(i+1).padStart(2,'0'),p.x,p.y+1,25,ch==='sea'?t.ink:0xffebca);
   if(l.boss){chapterMark(g,ch,p.x+r+12,p.y-r,10);this.label('首领',p.x,p.y+r+17,14,t.title);}else if(done)this.label('印',p.x+r+12,p.y-15,14,t.title);
   this.zones.push({x:p.x-36,y:p.y-36,w:72,h:72,run:()=>{this.selected=l.id;}});
  });
  const l=MOUNTAIN_LEVELS[this.selected];this.box(28,footer+1015,664,102);this.label(`${String(l.number).padStart(2,'0')} · ${l.title}`,360,footer+1046,28,t.ink);this.label(`${l.boss?'首领镇守':l.number===9?'双精英守关':'精英试炼'} · ${l.modifier.name} · ${c.completed.has(l.id)?'已落印':'可游历'}`,360,footer+1085,18,t.muted);
  this.button('归卷',30,footer+1145,154,67,()=>{this.opened=false;this.home();});this.button('落 笔 入 画',208,footer+1145,484,67,()=>{this.opened=false;this.start(this.selected);},true);
  this.label('八次悟道 · 喷墨 / 阔锋 / 双毫 / 留墨',360,footer+1245,17,t.title);
 }
 private shade(){this.surface.addChild(new Graphics().rect(0,-1000,720,3400).fill({color:0x0b1715,alpha:.85}));this.zones=[];}
}
