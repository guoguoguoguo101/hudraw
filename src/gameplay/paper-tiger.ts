import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import type {InputEvent} from '../platform/adapter';
import {inArena,type Arena} from '../input/line-interaction-geometry';

export const PAPER_TIGER={duration:12,uses:2,damage:48,reach:66,jump:260,unfold:.5,windup:.28,leap:.42,land:.24,rest:.56,fold:.45} as const;
export type TigerPhase='unfold'|'idle'|'windup'|'leap'|'land'|'rest'|'fold';
export type TigerState=Point&{age:number;remaining:number;phase:TigerPhase;phaseAge:number;from:Point;to:Point;facing:number;target:number|null;command:Point|null;jumps:number;hits:number};
/** Independent, bounded real-time companion; no rune/ink/upgrade side effects. */
export class PaperTiger{
 state:TigerState|null=null;uses:number=PAPER_TIGER.uses;dragging=false;preview:Point|null=null;
 private pointer:number|null=null;
 notice='按住纸虎拖到地面召唤 · 自动跳扑十二秒';
 reset(){this.state=null;this.uses=PAPER_TIGER.uses;this.cancel();this.notice='按住纸虎拖到地面召唤 · 自动跳扑十二秒';}
 get alive(){return !!this.state&&this.state.phase!=='fold';}
 get busy(){return this.state!==null;}
 hitTest(p:Point){const t=this.state;return !!t&&t.phase!=='leap'&&t.phase!=='fold'&&Math.abs(p.x-t.x)<57&&p.y>t.y-80&&p.y<t.y+15;}
 begin(e:InputEvent){if(e.kind!=='down'||this.dragging||this.state?.phase==='fold'||!this.alive&&this.uses<=0)return false;this.dragging=true;this.pointer=e.id;this.preview={x:e.x,y:e.y};return true;}
 valid(p:Point,b:Arena){return Number.isFinite(p.x)&&Number.isFinite(p.y)&&inArena(p,{left:b.left+45,right:b.right-45,top:b.top+55,bottom:b.bottom-10});}
 input(e:InputEvent,b:Arena){
  if(!this.dragging)return false;if(e.id!==this.pointer)return true;
  if(Number.isFinite(e.x)&&Number.isFinite(e.y))this.preview={x:e.x,y:e.y};
  if(e.kind==='cancel'){this.cancel();return true;}
  if(e.kind==='up'){
   this.cancel();if(!this.valid(e,b)){this.notice='已取消 · 请拖到画境内';return true;}
   if(this.alive){this.state!.command={x:e.x,y:e.y};this.notice='已指路 · 下一扑优先前往这里';}
   else if(!this.state&&this.uses>0){this.uses--;this.state={x:e.x,y:e.y,age:0,remaining:12,phase:'unfold',phaseAge:0,from:{x:e.x,y:e.y},to:{x:e.x,y:e.y},facing:1,target:null,command:null,jumps:0,hits:0};this.notice='纸虎得形 · 自行寻妖，拖动可指路';}
  }
  return true;
 }
 cancel(){this.dragging=false;this.preview=null;this.pointer=null;}
 advance(dt:number,enemies:Enemy[],bounds:Arena,damage:(e:Enemy,n:number)=>void){
  if(!Number.isFinite(dt)||dt<=0||!this.state)return;
  // At most the remaining summon and exit animation can be simulated, even after a long frame.
  let debt=Math.min(dt,this.state.remaining+PAPER_TIGER.fold);
  while(debt>1e-9&&this.state){const step=Math.min(1/60,debt);debt-=step;this.tick(step,enemies,bounds,damage);}
 }
 private phase(t:TigerState,p:TigerPhase){t.phase=p;t.phaseAge=0;}
 private choose(t:TigerState,enemies:Enemy[],b:Arena){
  const live=enemies.filter(e=>e.hp>0&&e.ai!=='Death'&&e.ai!=='Spawn'&&e.x>=b.left&&e.x<=b.right&&e.y>=b.top&&e.y<=b.bottom);
  const small=live.filter(e=>e.kind==='ink'||e.kind==='crow');
  return (small.length?small:live).sort((a,c)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(c.x-t.x,c.y-t.y))[0];
 }
 private tick(dt:number,enemies:Enemy[],b:Arena,damage:(e:Enemy,n:number)=>void){
  const t=this.state!;t.age+=dt;t.phaseAge+=dt;
  if(t.phase==='fold'){if(t.phaseAge+1e-8>=PAPER_TIGER.fold){this.state=null;this.notice='纸虎归纸 · 可再次召唤或重置';}return;}
  t.remaining=Math.max(0,t.remaining-dt);
  if(t.remaining<1e-8){t.remaining=0;this.phase(t,'fold');this.cancel();return;}
  if(t.phase==='unfold'){if(t.phaseAge+1e-8>=PAPER_TIGER.unfold)this.phase(t,'idle');return;}
  if(t.phase==='idle'){
   const target=this.choose(t,enemies,b);if(!target&&!t.command)return;
   t.target=t.command?null:target!.id;t.to={...(t.command??target!)};t.command=null;
   if(Math.abs(t.to.x-t.x)>3)t.facing=t.to.x>=t.x?1:-1;
   this.phase(t,'windup');return;
  }
  if(t.phase==='windup'&&t.phaseAge+1e-8>=PAPER_TIGER.windup){
   const e=t.target===null?null:enemies.find(e=>e.id===t.target&&e.hp>0&&e.ai!=='Death');
   if(t.target!==null&&!e){this.phase(t,'idle');return;}
   if(e)t.to={x:e.x,y:e.y};t.from={x:t.x,y:t.y};
   const dx=t.to.x-t.x,dy=t.to.y-t.y,d=Math.hypot(dx,dy)||1,travel=Math.min(d,PAPER_TIGER.jump);
   t.to={x:Math.max(b.left+40,Math.min(b.right-40,t.x+dx/d*travel)),y:Math.max(b.top+45,Math.min(b.bottom-10,t.y+dy/d*travel))};
   if(Math.abs(dx)>3)t.facing=dx>=0?1:-1;t.jumps++;this.phase(t,'leap');return;
  }
  if(t.phase==='leap'){
   const p=Math.min(1,t.phaseAge/PAPER_TIGER.leap),ease=p*p*(3-2*p);t.x=t.from.x+(t.to.x-t.from.x)*ease;t.y=t.from.y+(t.to.y-t.from.y)*ease;
   if(p>=1){
    this.phase(t,'land');
    // A single landing can strike one real target, never once per rendered frame.
    const within=enemies.filter(e=>e.hp>0&&e.ai!=='Death'&&e.ai!=='Spawn'&&Math.hypot(e.x-t.x,e.y-t.y)<=PAPER_TIGER.reach);
    const e=within.find(e=>e.id===t.target)??this.choose(t,within,b);
    if(e){t.hits++;damage(e,PAPER_TIGER.damage);}
   }
  }else if(t.phase==='land'&&t.phaseAge+1e-8>=PAPER_TIGER.land)this.phase(t,'rest');
  else if(t.phase==='rest'&&t.phaseAge+1e-8>=PAPER_TIGER.rest)this.phase(t,'idle');
 }
}
