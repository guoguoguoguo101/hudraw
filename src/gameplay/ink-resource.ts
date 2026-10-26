import {INK} from './ink-config';
export type InkEnd='release'|'timeout'|'invalid'|'cancel'|'rejected'|'automatic';
export type InkStroke={id:number;length:number;cost:number;effective:boolean;exhausted:boolean};
/** A stroke debits immediately, but remains reversible until it has settled. */
export class InkResourceManager{
 costScale=1;regenScale=1;retainOnCancel=false;currentInk=INK.initialInk;readonly maxInk=INK.maxInk;unlimited=false;regenPaused=false;refundVisual=true;
 pending:InkStroke|null=null;isWaitingRelease=false;delay=0;regenRunning=false;
 last={id:0,length:0,cost:0,refund:0,rune:'',reason:'cancel' as InkEnd,exhausted:false};
 refundSerial=0;blockedSerial=0;resetSerial=0;lastRefund=0;
 stats={blockedStarts:0,casts:0,totalCost:0,emptySeconds:0};
 private previousDelay=0;private serial=0;
 get canStart(){return !this.pending&&!this.isWaitingRelease&&(this.unlimited||this.currentInk>=INK.minInkToStart);}
 get state(){return this.isWaitingRelease?'等待抬指':this.pending?(this.pending.exhausted?'灵墨耗尽':this.pending.effective?'有效绘制':'起笔待确认'):this.delay>0?'恢复延迟':this.regenRunning?'恢复中':'空闲';}
 reset(unlimited=false){this.costScale=this.regenScale=1;this.retainOnCancel=false;this.pending=null;this.isWaitingRelease=false;this.delay=0;this.currentInk=INK.initialInk;this.unlimited=unlimited;this.regenRunning=false;this.regenPaused=false;this.lastRefund=0;this.last={id:0,length:0,cost:0,refund:0,rune:'',reason:'cancel',exhausted:false};this.stats={blockedStarts:0,casts:0,totalCost:0,emptySeconds:0};this.resetSerial++;}
 setAmount(amount:number){this.cancel();this.currentInk=Math.max(0,Math.min(this.maxInk,amount));this.resetSerial++;}
 setUnlimited(value:boolean){this.cancel();this.unlimited=value;this.currentInk=this.maxInk;this.delay=0;this.resetSerial++;}
 costFor(length:number,width=720){return length<INK.minDrawLengthRatio*width?0:(INK.baseStrokeCost+INK.lengthCostPerBattleWidth*length/width)*this.costScale;}
 begin(id:number){
  if(!this.canStart){if(!this.pending&&!this.isWaitingRelease){this.blockedSerial++;this.stats.blockedStarts++;}return false;}
  this.previousDelay=this.delay;this.pending={id,length:0,cost:0,effective:false,exhausted:false};this.regenRunning=false;return true;
 }
 /** Return the portion of this segment paid for, including an exact depletion cutoff. */
 extend(distance:number,width=720){
  const p=this.pending;if(!p||p.exhausted||distance<=0||!Number.isFinite(distance))return 0;
  const proposed=p.length+distance,target=this.costFor(proposed,width);
  if(target===0){p.length=proposed;return distance;}
  if(this.unlimited){p.length=proposed;p.effective=true;return distance;}
  const needed=target-p.cost,paid=Math.min(needed,this.currentInk);
  this.currentInk=Math.max(0,this.currentInk-paid);p.cost+=paid;p.effective=true;
  const accepted=Math.min(proposed,Math.max(0,(p.cost/this.costScale-INK.baseStrokeCost)*width/INK.lengthCostPerBattleWidth));
  const increment=Math.max(0,accepted-p.length);p.length=accepted;
  p.exhausted=this.currentInk<=1e-8;if(p.exhausted)this.currentInk=0;
  return Math.min(distance,increment);
 }
 settle(id:number,success:boolean,rune:string,reason:InkEnd,waiting=false){
  const p=this.pending;if(!p||p.id!==id)return false;
  if(!p.effective){this.pending=null;this.delay=this.previousDelay;this.last={id,length:p.length,cost:0,refund:0,rune:'',reason:'invalid',exhausted:false};}
  else{
   const refund=success&&rune!=='ink'&&!this.unlimited?Math.max(0,Math.min(p.cost*INK.normalRefundRate,INK.maxRefundPerStroke,p.cost-INK.minNetCostPerStroke,this.maxInk-this.currentInk)):0;
   this.currentInk=Math.min(this.maxInk,this.currentInk+refund);this.lastRefund=refund;if(refund>0)this.refundSerial++;
   this.last={id,length:p.length,cost:p.cost,refund,rune,reason,exhausted:p.exhausted};this.stats.totalCost+=p.cost-refund;if(success)this.stats.casts++;
   this.pending=null;this.delay=INK.regenDelayAfterCast;
  }
  this.isWaitingRelease=waiting;return true;
 }
 release(){if(this.isWaitingRelease){this.isWaitingRelease=false;if(this.last.cost>0)this.delay=INK.regenDelayAfterCast;}}
 cancel(reason:InkEnd='cancel'){
  const p=this.pending;if(p&&this.retainOnCancel){this.settle(p.id,false,'brush',reason);return;}if(p){this.currentInk=Math.min(this.maxInk,this.currentInk+p.cost);this.delay=this.previousDelay;this.last={id:p.id,length:p.length,cost:0,refund:0,rune:'',reason,exhausted:p.exhausted};this.pending=null;}
  this.release();this.regenRunning=false;
 }
 update(realDt:number,active:boolean){
  this.regenRunning=false;if(!active||!Number.isFinite(realDt)||realDt<=0)return;
  if(!this.unlimited&&this.currentInk<INK.minInkToStart)this.stats.emptySeconds+=realDt;
  if(this.pending||this.isWaitingRelease||this.regenPaused||this.unlimited)return;
  const dt=Math.max(0,realDt-this.delay);this.delay=Math.max(0,this.delay-realDt);
  if(dt>0&&this.currentInk<this.maxInk){this.regenRunning=true;this.currentInk=Math.min(this.maxInk,this.currentInk+INK.inkRegenPerSecond*this.regenScale*dt);}
 }
 /** Non-handwritten casts (practice helpers) still pay for their complete generated path. */
 automatic(length:number){
  if(this.costFor(length)<=0||this.pending||this.isWaitingRelease||(!this.unlimited&&(this.currentInk<INK.minInkToStart||this.costFor(length)>this.currentInk))){this.blockedSerial++;return null;}
  const id=--this.serial;if(!this.begin(id))return null;this.extend(length);return id;
 }
}
