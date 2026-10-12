import {Container,Graphics,Text,type TextStyleOptions} from 'pixi.js';
import {sprite,type Art} from '../rendering/rigs';
import {COMBAT,BOSS} from '../gameplay/config';
import {RELICS} from '../gameplay/modifiers';
import type {InputController} from '../input/controller';
import type {Game} from '../gameplay/game';
import type {Point} from '../input/recognizer';
export type Action='start'|'teach'|'pause'|'resume'|'restart'|'menu'|'sound'|'quality'|'debug'|'choose0'|'choose1'|'choose2'|'cultivate';
const COLORS={gold:0xe7ba68,ink:0x192027,white:0xfff7e8,red:0xd84332,wine:0x562a34,paper:0xf3e7cb,jade:0x72b5a4};
export function text(parent:Container,str:string,x:number,y:number,size:number,color=COLORS.gold,opts:Partial<TextStyleOptions>={}){const t=new Text({text:str,style:{fontFamily:['KaiTi','STKaiti','serif'],fontSize:size,fill:color,align:'center',letterSpacing:2,...opts}});t.anchor.set(.5);t.position.set(x,y);parent.addChild(t);return t;}
type Zone={x:number;y:number;w:number;h:number;action:Action};
export class Interface{
 root=new Container();hud=new Container();overlay=new Container();tip:Text;score:Text;timer:Text;phase:Text;hearts:Container[]=[];progress=new Graphics();zones:Zone[]=[];lastState='';lastLife=-1;panelAge=0;hintAge=0;muted=false;low=false;best=0;debug=false;counter:Text;practice:Text;runeStatus:Text;castMeter=new Graphics();drawMeter=new Graphics();levelLabel:Text;relicStatus:Text;drawStatus:Text;bossLabel:Text;bossMeter=new Graphics();cultivation=0;spirit=0;
 constructor(private art:Art,private onAction:(a:Action)=>void){this.root.addChild(this.hud,this.overlay);
 this.hud.addChild(new Graphics().roundRect(24,32,672,117,24).fill({color:COLORS.ink,alpha:.91}).stroke({color:COLORS.gold,width:1,alpha:.35}));
 text(this.hud,'灵狐画符',126,68,29,COLORS.paper);this.phase=text(this.hud,'山 海 试 炼',129,107,15,COLORS.gold);
 for(let i=0;i<3;i++){const c=new Container();c.position.set(284+i*39,95);const s=sprite(art,'env_talisman',c,0,0,.33);s.rotation=.05;this.hearts.push(c);this.hud.addChild(c);}
 this.score=text(this.hud,'0000',515,82,32,COLORS.white,{fontFamily:'Georgia',letterSpacing:1});this.levelLabel=text(this.hud,'灵魄 · LV 1',515,116,14,COLORS.gold);
 this.timer=text(this.hud,'60',348,63,25,COLORS.gold,{fontFamily:'Georgia',letterSpacing:0});
 this.hud.addChild(new Graphics().circle(647,87,29).stroke({color:COLORS.gold,width:1,alpha:.6}));text(this.hud,'Ⅱ',649,86,24,COLORS.paper);
 this.hud.addChild(this.progress);this.tip=text(this.hud,'落笔成符 · 妖影莫近',360,189,21,COLORS.wine);this.practice=text(this.hud,'',360,237,19,COLORS.wine);
 // Compact legend and the existing shared cooldown. These are not skill buttons.
 this.hud.addChild(new Graphics().roundRect(64,1190,592,62,15).fill({color:COLORS.ink,alpha:.65}).stroke({color:COLORS.gold,width:.8,alpha:.19}));
 text(this.hud,'一 斩    ○ 阵    △ 破    ☆ 星    Z 雷    ↻ 风',360,1221,18,COLORS.paper,{letterSpacing:1});
 this.runeStatus=text(this.hud,'符纸 2 / 3',354,163,16,COLORS.gold,{letterSpacing:1});this.hud.addChild(this.castMeter,this.drawMeter,this.bossMeter);
 this.relicStatus=text(this.hud,'',360,1090,15,COLORS.gold,{letterSpacing:0});this.drawStatus=text(this.hud,'',360,1137,19,COLORS.gold,{letterSpacing:1});this.bossLabel=text(this.hud,'',360,207,19,COLORS.paper,{letterSpacing:1});
 this.counter=text(this.root,'',360,1265,12,COLORS.gold,{fontFamily:'monospace',letterSpacing:0});
 }
 button(label:string,x:number,y:number,w:number,h:number,action:Action,primary=false){this.overlay.addChild(new Graphics().roundRect(x-w/2,y-h/2,w,h,13).fill({color:primary?COLORS.red:COLORS.ink,alpha:primary?1:.9}).stroke({color:COLORS.gold,width:1,alpha:.65}));text(this.overlay,label,x,y,primary?29:23,COLORS.paper);this.zones.push({x:x-w/2,y:y-h/2,w,h,action});}
 show(state:Game['state'],game:Game){this.lastState=state;this.overlay.removeChildren().forEach(c=>c.destroy());this.zones=[];this.hud.visible=!['menu'].includes(state);this.counter.visible=this.debug;
 if(['playing','tutorial'].includes(state)){this.zones.push({x:610,y:48,w:80,h:80,action:'pause'});return;}
 if(state==='upgrade'){this.overlay.addChild(new Graphics().rect(0,0,720,1280).fill({color:COLORS.ink,alpha:.78}));text(this.overlay,'灵气凝华',360,346,54,COLORS.paper);text(this.overlay,`LV ${game.level} · 战斗暂停，选择一件法宝`,360,410,22,COLORS.gold);game.choices.forEach((id,i)=>{const item=RELICS.find(r=>r.id===id)!;const y=544+i*142;this.button(item.name,360,y,562,112,('choose'+i) as Action);text(this.overlay,item.description,360,y+34,18,COLORS.gold,{letterSpacing:0,wordWrap:true,wordWrapWidth:510});});return;}
 if(state==='menu'){
  text(this.overlay,'山 海 剪 纸 幻 想',360,174,18,COLORS.wine,{letterSpacing:7});
  text(this.overlay,'灵狐画符',360,286,78,COLORS.ink,{letterSpacing:8,fontWeight:'normal'});
  text(this.overlay,'一笔镇妖  ·  三符守山海',360,366,24,COLORS.ink);
  this.overlay.addChild(new Graphics().moveTo(184,405).lineTo(298,405).moveTo(422,405).lineTo(536,405).stroke({color:COLORS.wine,width:1}));
  text(this.overlay,'◆',360,405,18,COLORS.wine);
  text(this.overlay,'六种自由符术 · 落笔进入慢动作符境',360,457,19,COLORS.wine,{letterSpacing:0});
  this.button('进入三分钟试炼',360,942,410,76,'start',true);this.button('九十秒符术入门',360,1038,410,65,'teach');
  text(this.overlay,`最佳灵魄 ${this.best} · 灵玉 ${this.spirit}`,360,1104,18,COLORS.gold,{letterSpacing:1});this.button(`修行 ${this.cultivation} 阶 · 消耗100灵玉`,360,1150,410,43,'cultivate');
  text(this.overlay,'一 / 圆 / 三角 / 五角星 / Z / 螺旋',360,1192,17,COLORS.paper);
  this.button(this.muted?'音效：关':'音效：开',181,1238,210,43,'sound');this.button(this.low?'画质：轻盈':'画质：精致',539,1238,210,43,'quality');return;
 }
 const isPause=state==='paused';
 this.overlay.addChild(new Graphics().rect(0,0,720,1280).fill({color:COLORS.ink,alpha:isPause?.74:.67}));
 this.overlay.addChild(new Graphics().roundRect(80,334,560,650,26).fill({color:COLORS.paper,alpha:.98}).stroke({color:COLORS.gold,width:2}));
 text(this.overlay,isPause?'歇笔片刻':state==='win'?'山海安宁':'灵火未尽',360,428,54,COLORS.wine);
 text(this.overlay,isPause?'画卷静止，灵狐等你':state==='win'?'九尾展灵，万妖归寂':'收拾笔意，再守一回山海',360,499,21,COLORS.wine,{letterSpacing:1});
 if(!isPause){text(this.overlay,String(game.score).padStart(4,'0'),360,588,66,COLORS.red,{fontFamily:'Georgia',letterSpacing:3});text(this.overlay,`灵魄 · 斩妖 ${game.kills} · 施符 ${game.casts}`,360,653,21,COLORS.wine,{letterSpacing:0});text(this.overlay,`守护 ${Math.floor(game.time)} / ${game.duration} 秒`,360,706,21,COLORS.wine);}
 this.button(isPause?'继续画符':'再守一卷',360,isPause?609:794,402,72,isPause?'resume':'restart',true);
 if(isPause){this.button(this.muted?'音效：关':'音效：开',249,716,190,54,'sound');this.button(this.low?'画质：轻盈':'画质：精致',470,716,190,54,'quality');this.button(this.debug?'关闭手势调试':'查看手势调试',360,796,402,54,'debug');}
 this.button('回到山海',360,isPause?880:884,402,61,'menu');
 }
 hint(str:string){this.tip.text=str;this.hintAge=1.8;}
 update(game:Game,dt:number,fps:number,input?:InputController){
 this.hintAge=Math.max(0,this.hintAge-dt);if(!this.hintAge)this.tip.text=game.time>=game.duration&&!game.bossDead?'决胜 · 斩灭鬼王完成试炼':game.training?'按住绘符 · 两秒符境 · 松手释放':'按住绘符 · 观察方向 · 三分钟试炼';
 this.timer.text=String(Math.max(0,Math.ceil(game.duration-game.time)));this.score.text=String(game.score).padStart(4,'0');this.phase.text=`生命 ${Math.ceil(game.life)} / ${game.maxHp}${game.shield?' +'+Math.ceil(game.shield)+'盾':''}`;
 this.levelLabel.text=`LV ${game.level} · ${Math.floor(game.xp)}/${game.xpNeeded}灵气`;this.hearts.forEach((h,i)=>h.alpha=i<game.charges.papers?1:.15);
 this.runeStatus.text=`符纸 ${game.charges.papers}/3${game.charges.papers<3?' · '+(COMBAT.chargePeriod-game.charges.progress).toFixed(1)+'秒充能':''}`;
 this.progress.clear().moveTo(48,139).lineTo(672,139).stroke({color:COLORS.red,width:3,alpha:.12}).moveTo(48,139).lineTo(48+624*game.life/game.maxHp,139).stroke({color:COLORS.red,width:3,alpha:.7});
 this.castMeter.clear().moveTo(286,127).lineTo(392,127).stroke({color:COLORS.gold,width:1.5,alpha:.18}).moveTo(286,127).lineTo(286+106*(game.charges.papers===3?1:game.charges.progress/COMBAT.chargePeriod),127).stroke({color:COLORS.gold,width:1.5,alpha:.65});
 const preview=input?.drawing?input.preview:input?.last;this.drawStatus.text=input?.drawing?`符境 ${(COMBAT.drawLimit-input.drawAge).toFixed(1)}秒 · ${preview?.valid?preview.reason+' '+Math.round(preview.quality*100)+'分':'凝神落笔'}`:input&&input.traceAge<.7&&preview?preview.reason:'';
 this.drawMeter.clear();if(input?.drawing)this.drawMeter.moveTo(208,1165).lineTo(512,1165).stroke({color:COLORS.gold,width:2,alpha:.18}).moveTo(208,1165).lineTo(208+304*(1-input.drawAge/COMBAT.drawLimit),1165).stroke({color:COLORS.gold,width:2,alpha:.8});
 this.relicStatus.text=[...game.modifiers.owned].map(([id,n])=>RELICS.find(r=>r.id===id)!.name.slice(2)+'×'+n).join(' · ');this.practice.text='';const boss=game.enemies.find(e=>e.kind==='boss');this.tip.visible=!boss;this.bossLabel.text=boss?`赤面鬼王 · ${['','甲胄','召妖','血月'][boss.phase]} ${boss.ai==='Telegraph'?'蓄力 '+Math.max(0,BOSS.windups[boss.phase-1]-boss.stateAge).toFixed(1)+'秒':''}`:'';this.bossMeter.clear();if(boss)this.bossMeter.moveTo(168,229).lineTo(552,229).stroke({color:COLORS.ink,width:6}).moveTo(168,229).lineTo(168+384*Math.max(0,boss.hp/boss.maxHp),229).stroke({color:COLORS.red,width:4});
 this.counter.text=this.debug?`FPS ${Math.round(fps)}  ENEMIES ${game.enemies.length} · 时速 ${input?.drawing?'20%':'100%'}`:'';
 }
 hit(p:Point){const z=[...this.zones].reverse().find(z=>p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h);if(z){this.onAction(z.action);return true;}return ['menu','paused','upgrade','win','lose'].includes(this.lastState);}
}
