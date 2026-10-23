import {drawPaperTiger} from '../rendering/paper-tiger';
import {Container,Graphics} from 'pixi.js';
import {text} from './interface';
import type {Game} from '../gameplay/game';
import {FUNCTIONAL_RELICS,RESCUE_STROKES} from '../gameplay/functional-relics';
import {drawFunctionalRelic} from '../rendering/functional-relics';
import type {InputEvent} from '../platform/adapter';
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
const GOLD=0xdcb36b,PAPER=0xffedce,INK=0x19282e;
export class FunctionalRelicUI{
 root=new Container();private key='';private zones:Zone[]=[];private open=false;private lanternZone:Zone|undefined;private tigerZone:Zone|undefined;
 constructor(private game:Game,private cancel:()=>void,private blocked:()=>boolean,private pause:()=>void){}
 reset(){this.open=false;this.key='';}
 handle(e:InputEvent){
  if(!this.game.functionalRelics.enabled||this.game.state==='paused'||this.game.state==='menu')return false;
  if(!this.game.active&&this.game.state!=='reviving')return false;
  if(this.blocked()&&this.game.state!=='reviving')return false;
  const tiger=this.game.functionalRelics.paperTiger;
  if(tiger.dragging)return this.game.handleFunctionalInput(e);
  if(!this.open&&this.game.active&&e.kind==='down'&&tiger.hitTest(e)){this.cancel();tiger.begin(e);return true;}
  if(this.game.functionalRelics.placing)return this.game.handleFunctionalInput(e);
  if(e.kind==='down'){const zone=[...this.zones].reverse().find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);if(zone){this.cancel();if(zone===this.lanternZone)this.game.functionalRelics.beginPlacement(e);else if(zone===this.tigerZone)tiger.begin(e);else zone.run();this.key='';return true;}}
  if(this.game.state==='reviving')return this.game.handleFunctionalInput(e);
  if(this.open)return true;
  return false;
 }
 update(footer:number,top:number,bottom:number){
  const r=this.game.functionalRelics,reviving=this.game.state==='reviving';
  this.root.visible=r.enabled&&(this.game.active||reviving)&&(!this.blocked()||reviving);
  if(!this.root.visible){this.key='';return;}
  const tiger=r.paperTiger;
  const key=JSON.stringify([tiger.uses,tiger.dragging,tiger.notice,Math.ceil((tiger.state?.remaining??0)*10),tiger.state?.phase,footer,top,bottom,this.open,r.levels,r.uses,r.placing,r.notice,r.lantern?.hits,Math.ceil(r.stopRemaining*10),reviving,Math.ceil(r.reviveRemaining*10),r.reviveStroke,r.reviveProgress,r.reviveReady>0]);
  if(key===this.key)return;this.key=key;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.lanternZone=undefined;this.tigerZone=undefined;
  if(reviving){this.recovery(top,bottom);return;}
  const ty=774+footer;
  this.root.addChild(new Graphics().roundRect(24,ty,672,78,13).fill({color:0x352c29,alpha:.97}).stroke({color:GOLD,width:1,alpha:.7}));
  this.button('',36,ty+7,164,64,()=>{},tiger.alive||tiger.dragging);this.tigerZone=this.zones.at(-1);
  const tigerIcon=new Graphics();drawPaperTiger(tigerIcon);tigerIcon.position.set(77,ty+48);tigerIcon.scale.set(.42);tigerIcon.alpha=tiger.uses>0||tiger.alive?1:.35;this.root.addChild(tigerIcon);
  text(this.root,'镇山纸虎',144,ty+24,16,PAPER,{letterSpacing:0});
  text(this.root,tiger.alive?'拖动指路':`Lv1 · ${tiger.uses} 次`,144,ty+49,14,GOLD,{letterSpacing:0});
  text(this.root,tiger.alive?`寻妖跳扑 · 余 ${tiger.state!.remaining.toFixed(1)} 秒`:'拖到地面召唤 · 自行寻妖跳扑',439,ty+24,17,PAPER,{letterSpacing:0});
  text(this.root,tiger.dragging?'松手确认 · 拖回栏内取消':tiger.notice,439,ty+52,14,GOLD,{letterSpacing:0});
  const y=874+footer;
  this.root.addChild(new Graphics().roundRect(24,y,672,120,17).fill({color:INK,alpha:.97}).stroke({color:GOLD,width:1,alpha:.6}));
  const notice=r.stopped?`停时 ${r.stopRemaining.toFixed(1)} 秒 · 敌停，笔不停`:r.placing?'拖到地面后松手放灯 · 拖回栏内取消':r.notice;
  text(this.root,notice,360,y-16,16,r.stopped?0xc3e4e7:GOLD,{letterSpacing:0});
  FUNCTIONAL_RELICS.forEach((item,i)=>{
   const x=36+i*138,active=item.id==='lantern'&&r.placing||item.id==='hourglass'&&r.stopped;
   this.button('',x,y+8,128,102,()=>{if(item.id==='hourglass')this.game.activateHourglass();if(item.id==='soul')r.notice='致命伤自动触发 · 可点右侧受击测试';},active);
   if(item.id==='lantern')this.lanternZone=this.zones.at(-1);
   const icon=new Graphics();drawFunctionalRelic(icon,item.id);icon.position.set(x+37,y+45);icon.scale.set(.48);icon.alpha=r.uses[item.id]>0?1:.3;this.root.addChild(icon);
   text(this.root,String(r.uses[item.id]),x+97,y+45,24,PAPER,{letterSpacing:0});
   text(this.root,item.name,x+64,y+78,16,PAPER,{letterSpacing:0});text(this.root,`Lv${r.levels[item.id]} · ${item.id==='soul'?'被动':item.id==='lantern'?'拖动':'点击'}`,x+64,y+97,12,GOLD,{letterSpacing:0});
  });
  this.button('强化',460,y+12,100,38,()=>{this.open=true;},false);this.button('重置',570,y+12,112,38,()=>this.game.resetFunctionalRelics(),false);
  this.button('致命受击测试',460,y+66,222,38,()=>this.game.testFatalHit(),true);
  if(r.stopped&&!this.open){
   this.root.addChild(new Graphics().roundRect(265,top+238,190,64,22).fill({color:0x18303f,alpha:.95}).stroke({color:GOLD,width:1.2}));
   const timerIcon=new Graphics();drawFunctionalRelic(timerIcon,'hourglass',r.clock);timerIcon.position.set(295,top+270);timerIcon.scale.set(.43);this.root.addChild(timerIcon);
   text(this.root,`停时 ${r.stopRemaining.toFixed(1)} 秒`,377,top+270,21,PAPER,{letterSpacing:0});
  }
  if(this.open)this.enhancements(top,bottom);
 }
 private button(label:string,x:number,y:number,w:number,h:number,run:()=>void,active=false){
  this.root.addChild(new Graphics().roundRect(x,y,w,h,9).fill({color:active?0x66302d:0x24363d,alpha:.98}).stroke({color:GOLD,width:1,alpha:active?.95:.4}));if(label)text(this.root,label,x+w/2,y+h/2,17,PAPER,{letterSpacing:0});this.zones.push({x,y,w,h,run});
 }
 private enhancements(top:number,bottom:number){
  const r=this.game.functionalRelics;this.root.addChild(new Graphics().rect(0,top,720,bottom-top).fill({color:0x101b22,alpha:.94}));this.zones=[];
  text(this.root,'灵宝试验 · 强化预览',360,235,30,PAPER,{letterSpacing:0});
  text(this.root,'三件功能灵宝可切阶段 · 纸虎本轮仅 Lv1',360,273,17,GOLD,{letterSpacing:0});
  const details=['按住灯笼拖到地面 · 诱敌5秒 / 耐久3次','点一下，敌人停时 · 画符和己方技能继续','致命伤自动触发 · 三秒内描完两笔自救'];
  FUNCTIONAL_RELICS.forEach((item,i)=>{
   const y=315+i*174;
   this.root.addChild(new Graphics().roundRect(42,y,636,156,14).fill({color:0x26363a}).stroke({color:GOLD,width:1,alpha:.35}));
   const icon=new Graphics();drawFunctionalRelic(icon,item.id);icon.position.set(105,y+69);icon.scale.set(.9);this.root.addChild(icon);
   text(this.root,item.name,182,y+31,24,PAPER,{letterSpacing:0}).anchor.x=0;
   text(this.root,details[i],182,y+66,15,GOLD,{letterSpacing:0}).anchor.x=0;
   for(let level=1;level<=3;level++)this.button(`Lv${level}`,182+(level-1)*114,y+98,104,35,()=>r.setLevel(item.id,level),r.levels[item.id]===level);
  });
  text(this.root,r.notice,360,872,16,GOLD,{letterSpacing:0,wordWrap:true,wordWrapWidth:620});
  text(this.root,'Lv1 功能完整 · Lv2 / Lv3 测培养效果',360,913,16,PAPER,{letterSpacing:0});
  this.button('返回画境',210,957,300,48,()=>{this.open=false;},true);
 }
 private recovery(top:number,bottom:number){
  const r=this.game.functionalRelics,g=new Graphics();this.root.addChild(g);
  g.rect(0,top,720,bottom-top).fill({color:0x12232a,alpha:.82});
  text(this.root,'描完两笔 · 引魂归来',360,310,29,PAPER,{letterSpacing:1});
  text(this.root,'从亮点起笔，先横后竖 · 可抬手续画',360,351,16,GOLD,{letterSpacing:0});
  g.roundRect(205,390,310,320,11).fill({color:0xf1e5c5,alpha:.97}).stroke({color:GOLD,width:2});
  for(const [x,y,sx,sy] of [[218,403,1,1],[502,403,-1,1],[218,697,1,-1],[502,697,-1,-1]])g.moveTo(x,y+19*sy).lineTo(x,y).lineTo(x+19*sx,y).stroke({color:0xa58b57,width:1.4});
  for(let i=0;i<2;i++){
   const [a,b]=RESCUE_STROKES[i],done=i<r.reviveStroke,current=i===r.reviveStroke;
   g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:current?0xc1a46d:0xb7ad94,width:25,alpha:done?0:.16,cap:'round'});
   g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:done?0xb33a2e:0x9b8d6b,width:done?15:3,alpha:done?1:.4,cap:'round'});
   if(current){g.circle(a.x,a.y,8).fill({color:0xf4c76e});g.circle(a.x,a.y,13).stroke({color:0xa78a50,width:1,alpha:.5});}
   g.circle(344+i*32,370,5).fill({color:done?GOLD:0x58625b});
  }
  if(r.revivePath.length>1){g.moveTo(r.revivePath[0].x,r.revivePath[0].y);for(const p of r.revivePath.slice(1))g.lineTo(p.x,p.y);g.stroke({color:0xc34a32,width:13,cap:'round',join:'round'});}
  text(this.root,r.reviveReady>0?'凝魂…':`余 ${r.reviveRemaining.toFixed(1)} 秒`,360,751,26,PAPER,{letterSpacing:0});
  text(this.root,`第 ${Math.min(2,r.reviveStroke+1)} 笔 / 共 2 笔 · 完成即复生`,360,793,17,GOLD,{letterSpacing:0});
  const lotus=new Graphics();drawFunctionalRelic(lotus,'soul');lotus.position.set(360,869);lotus.scale.set(1.35);this.root.addChild(lotus);
  g.moveTo(360,827).bezierCurveTo(317,800,399,778,360,729).stroke({color:0xb1ded4,width:1.4,alpha:.5});
  this.button('放弃回魂',270,957,180,42,()=>this.game.giveUpRevive(),false);this.button('暂停',562,275,110,38,this.pause,false);
 }
}
