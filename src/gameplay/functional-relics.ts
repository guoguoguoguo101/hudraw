import {PaperTiger} from './paper-tiger';
import {WORLD,type Enemy} from '../core/types';
import type {InputEvent} from '../platform/adapter';
import type {Point} from '../input/recognizer';
import {inArena,type Arena} from '../input/line-interaction-geometry';

export const FUNCTIONAL_RELICS=[{id:'lantern',name:'引路灯笼',uses:3},{id:'hourglass',name:'停时沙漏',uses:2},{id:'soul',name:'回魂灯',uses:1}] as const;
export type FunctionalRelicId=typeof FUNCTIONAL_RELICS[number]['id'];
export type LureLantern=Point&{id:number;remaining:number;hits:number;radius:number};
export const RESCUE_STROKES=[[{x:255,y:505},{x:465,y:505}],[{x:360,y:445},{x:360,y:655}]] as const;
export class FunctionalRelics{
 paperTiger=new PaperTiger();
 enabled=false;levels:Record<FunctionalRelicId,number>={lantern:1,hourglass:1,soul:1};
 uses:Record<FunctionalRelicId,number>={lantern:3,hourglass:2,soul:1};
 lantern:LureLantern|null=null;lanternEcho:(LureLantern&{fade:number})|null=null;placing=false;preview:Point|null=null;
 stopRemaining=0;stopSlow=0;clock=0;notice='拖动灯笼放置 · 点击沙漏停时 · 回魂自动触发';
 reviving=false;reviveRemaining=3;reviveReady=.3;reviveStroke=0;reviveProgress=0;reviveResult:'success'|'failed'|null=null;revivePath:Point[]=[];
 private serial=0;private pointer:number|null=null;private placementPointer:number|null=null;
 get stopped(){return this.stopRemaining>1e-8;}
 get busy(){return !!this.lantern||this.stopped||this.reviving||this.paperTiger.busy;}
 reset(enabled=this.enabled){this.paperTiger.reset();this.enabled=enabled;this.uses={lantern:3,hourglass:2,soul:1};this.lantern=null;this.lanternEcho=null;this.stopRemaining=this.stopSlow=0;this.reviving=false;this.reviveRemaining=3;this.reviveStroke=this.reviveProgress=0;this.reviveResult=null;this.clock=0;this.cancelInput();this.notice='灵宝次数已重置 · 可重新测试';}
 setLevel(id:FunctionalRelicId,level:number){if(this.busy){this.notice='请在效果结束后调整阶段';return false;}this.levels[id]=Math.max(1,Math.min(3,level));return true;}
 private ready(id:FunctionalRelicId){if(!this.enabled)return false;if(this.uses[id]<=0){this.notice='本局次数用尽 · 测试可点重置';return false;}return true;}
 beginPlacement(e:InputEvent){if(e.kind!=='down'||this.placing||!this.ready('lantern')||this.lantern||this.reviving)return false;this.placing=true;this.placementPointer=e.id;this.preview={x:e.x,y:e.y};this.notice='拖到地面后松手放灯 · 拖回栏内取消';return true;}
 validPlacement(p:Point,bounds:Arena){return inArena(p,bounds)&&Math.hypot(p.x-WORLD.foxX,p.y-WORLD.foxY)>=100;}
 placementInput(e:InputEvent,bounds:Arena){
  if(!this.placing)return false;
  if(e.id!==this.placementPointer)return true;
  if(Number.isFinite(e.x)&&Number.isFinite(e.y))this.preview={x:e.x,y:e.y};
  if(e.kind==='cancel'){this.cancelInput();this.notice='已取消放灯';return true;}
  if(e.kind==='up'){this.cancelInput();if(this.validPlacement(e,bounds)){this.lantern={x:e.x,y:e.y,id:++this.serial,remaining:5,hits:3,radius:this.levels.lantern>=2?220:180};this.uses.lantern--;this.notice='引路灯已亮 · 普通怪会围灯攻击';}else this.notice='已取消 · 请拖到画境内，离狐狸稍远';}
  return true;
 }
 activateStop(){if(!this.ready('hourglass')||this.stopped||this.reviving)return false;this.uses.hourglass--;this.stopRemaining=this.levels.hourglass>=2?3.5:3;this.placing=false;this.notice='敌人定格 · 绘符和己方技能继续';return true;}
 advance(dt:number){
  if(!this.enabled||!Number.isFinite(dt)||dt<=0||this.reviving)return 0;
  this.clock+=dt;const frozen=Math.min(dt,this.stopRemaining),wasStopped=this.stopped;
  this.stopRemaining=Math.max(0,this.stopRemaining-dt);this.stopSlow=Math.max(0,this.stopSlow-dt);
  if(wasStopped&&!this.stopped&&this.levels.hourglass>=3)this.stopSlow=1;
  if(this.lanternEcho){this.lanternEcho.fade-=dt;if(this.lanternEcho.fade<=0)this.lanternEcho=null;}
  if(this.lantern){this.lantern.remaining-=dt-frozen;if(this.lantern.remaining<=1e-8)this.extinguish();}
  return frozen;
 }
 hitLantern(id:number){if(this.stopped||!this.lantern||this.lantern.id!==id)return;this.lantern.hits--;if(this.lantern.hits<=0)this.extinguish();}
 private extinguish(){if(!this.lantern)return;this.lanternEcho={...this.lantern,fade:1};this.lantern=null;this.notice='灯已熄灭 · 妖怪重新追向狐狸';}
 target(e:Enemy):Point{
  if(this.enabled&&e.ai==='Approach')e.lureId=(e.kind==='ink'||e.kind==='crow')&&this.lantern&&Math.hypot(e.x-this.lantern.x,e.y-this.lantern.y)<=this.lantern.radius?this.lantern.id:undefined;
  if(e.lureId)return this.lantern?.id===e.lureId?this.lantern:{x:e.x+e.aim.x*200,y:e.y+e.aim.y*200};
  return {x:WORLD.foxX,y:WORLD.foxY};
 }
 moveScale(e:Enemy){if(e.kind==='boss'||e.kind==='oni')return 1;return (this.stopSlow>0||this.levels.lantern>=3&&this.lanternEcho&&Math.hypot(e.x-this.lanternEcho.x,e.y-this.lanternEcho.y)<this.lanternEcho.radius)? .7:1;}
 beginRevive(){if(!this.ready('soul')||this.reviving)return false;this.uses.soul--;this.reviving=true;this.reviveRemaining=3;this.reviveReady=.3;this.reviveStroke=this.reviveProgress=0;this.reviveResult=null;this.cancelInput();this.notice='描完两笔 · 引魂归来';return true;}
 advanceRevive(dt:number){
  if(!this.reviving)return null;if(this.reviveResult)return this.reviveResult;
  const ready=Math.min(dt,this.reviveReady);this.reviveReady-=ready;if(this.reviveReady<1e-8)this.reviveReady=0;this.reviveRemaining=Math.max(0,this.reviveRemaining-(dt-ready));
  if(this.reviveRemaining<=1e-8)this.reviveResult='failed';return this.reviveResult;
 }
 reviveInput(e:InputEvent){
  if(!this.reviving)return false;if(this.reviveReady>0||this.reviveResult)return true;
  const [a,b]=RESCUE_STROKES[Math.min(1,this.reviveStroke)];
  if(e.kind==='cancel'){if(e.id===this.pointer){this.pointer=null;this.revivePath=[];this.reviveProgress=0;}return true;}
  if(e.kind==='down'){if(this.pointer===null&&Math.hypot(e.x-a.x,e.y-a.y)<=60){this.pointer=e.id;this.revivePath=[{x:e.x,y:e.y}];this.reviveProgress=0;}return true;}
  if(e.id!==this.pointer)return true;
  const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=((e.x-a.x)*dx+(e.y-a.y)*dy)/den,perp=Math.abs((e.x-a.x)*dy-(e.y-a.y)*dx)/Math.sqrt(den);
  if(perp<=48&&t>=-.2&&t<=1.25){this.reviveProgress=Math.max(this.reviveProgress,Math.min(1,t));this.revivePath.push({x:e.x,y:e.y});if(this.revivePath.length>80)this.revivePath=this.revivePath.filter((_,i)=>i%2===0);}
  else{this.reviveProgress=0;this.revivePath=[];this.pointer=null;}
  if(e.kind==='up'){if(this.reviveProgress>=.85&&Math.hypot(e.x-b.x,e.y-b.y)<=60){this.reviveStroke++;if(this.reviveStroke>=2)this.reviveResult='success';}this.pointer=null;this.reviveProgress=0;this.revivePath=[];}
  return true;
 }
 cancelInput(){this.paperTiger.cancel();this.placing=false;this.preview=null;this.placementPointer=null;this.pointer=null;this.revivePath=[];this.reviveProgress=0;}
}
