export const COMBO_WINDOW=2;
export const COMBO_THRESHOLDS=[3,5,8,12] as const;
export const comboTier=(kills:number)=>COMBO_THRESHOLDS.filter(n=>kills>=n).length;
export const comboPraise=(kills:number)=>['挥笔斩妖','锋芒初露','笔走游龙','一气破阵','一笔诛群妖'][comboTier(kills)];
export function strokeTitle(kills:number){
 const digits=['零','一','二','三','四','五','六','七','八','九'];
 const n=kills<10?digits[kills]:kills<20?'十'+(kills%10?digits[kills%10]:''):String(kills);
 return `一笔${n}斩`;
}
export type StrokeResult={kills:number;seconds:number;at:number};
/** Active play time only. A stroke credits direct brush kills, a chain credits all kills. */
export class HualingCombo{
 time=0;count=0;remaining=0;lastKill=-Infinity;best=0;
 strokeActive=false;strokeKills=0;strokeStart=0;
 result:StrokeResult|null=null;chainResult:StrokeResult|null=null;
 private chainStart=0;private tone=0;
 reset(){this.time=0;this.count=0;this.remaining=0;this.lastKill=-Infinity;this.best=0;this.strokeActive=false;this.strokeKills=0;this.strokeStart=0;this.result=this.chainResult=null;this.chainStart=0;this.tone=0;}
 beginStroke(){this.endStroke();this.strokeActive=true;this.strokeKills=0;this.strokeStart=this.time;}
 endStroke(){if(!this.strokeActive)return;if(this.strokeKills>0)this.result={kills:this.strokeKills,seconds:Math.max(0,this.time-this.strokeStart),at:this.time};this.strokeActive=false;this.strokeKills=0;}
 kill(directBrush:boolean){
  if(this.remaining<=0){this.count=0;this.chainStart=this.time;this.chainResult=null;}
  const before=comboTier(this.count);this.count++;this.best=Math.max(this.best,this.count);this.remaining=COMBO_WINDOW;this.lastKill=this.time;
  if(directBrush&&this.strokeActive)this.strokeKills++;
  const tier=comboTier(this.count);if(tier>before)this.tone=Math.max(this.tone,tier);
 }
 advance(dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;
  this.time+=dt;
  if(this.remaining>0){this.remaining=Math.max(0,this.remaining-dt);if(this.remaining<1e-8){this.remaining=0;if(this.count>=2)this.chainResult={kills:this.count,seconds:this.time-this.chainStart,at:this.time};this.count=0;}}
  if(this.result&&this.time-this.result.at>2.6)this.result=null;
  if(this.chainResult&&this.time-this.chainResult.at>1.6)this.chainResult=null;
 }
 takeTone(){const tone=this.tone;this.tone=0;return tone;}
}
