import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import {clipSegment,distanceToSegment,inArena,type Arena} from '../input/line-interaction-geometry';

export const PAPER_CRAB={duration:14,damage:56,radius:43,travel:520,unfold:.45,windup:.55,dash:.6,rest:.85,fold:.4} as const;
export type CrabPhase='unfold'|'idle'|'windup'|'dash'|'rest'|'fold';
export type CrabState=Point&{age:number;remaining:number;phase:CrabPhase;phaseAge:number;from:Point;to:Point;heading:number;charges:number;hits:number;hit:Set<number>};
const live=(e:Enemy)=>e.hp>0&&e.ai!=='Death'&&e.ai!=='Spawn';
/** Locks a straight lane before charging; checks swept segments, once per target per charge. */
export class PaperCrab{
 state:CrabState|null=null;
 get alive(){return !!this.state&&this.state.phase!=='fold';}
 reset(){this.state=null;}
 valid(p:Point,b:Arena){return Number.isFinite(p.x)&&Number.isFinite(p.y)&&inArena(p,{left:b.left+100,right:b.right-100,top:b.top+75,bottom:b.bottom-25});}
 summon(p:Point,b:Arena){if(!this.valid(p,b))return false;this.state={...p,age:0,remaining:PAPER_CRAB.duration,phase:'unfold',phaseAge:0,from:{...p},to:{...p},heading:0,charges:0,hits:0,hit:new Set()};return true;}
 private phase(t:CrabState,p:CrabPhase){t.phase=p;t.phaseAge=0;}
 private lane(t:CrabState,enemies:Enemy[],b:Arena){
  const all=enemies.filter(e=>live(e)&&inArena(e,b)),small=all.filter(e=>e.kind==='ink'||e.kind==='crow'),candidates=small.length?small:all;
  let best:Point|null=null,score=-Infinity;
  for(const e of candidates){
   const dx=Math.hypot(e.x-t.x,e.y-t.y)<1?1:e.x-t.x,dy=Math.hypot(e.x-t.x,e.y-t.y)<1?0:e.y-t.y,d=Math.hypot(dx,dy);
   const segment=clipSegment({a:t,b:{x:t.x+dx/d*PAPER_CRAB.travel,y:t.y+dy/d*PAPER_CRAB.travel}},{left:b.left+100,right:b.right-100,top:b.top+75,bottom:b.bottom-25});if(!segment)continue;
   const count=candidates.filter(e=>distanceToSegment(e,segment)<=PAPER_CRAB.radius+12).length;
   const value=count*1000-d;if(value>score&&Math.hypot(segment.b.x-t.x,segment.b.y-t.y)>8){score=value;best=segment.b;}
  }
  return best;
 }
 advance(dt:number,enemies:Enemy[],b:Arena,damage:(e:Enemy,n:number)=>void){
  if(!Number.isFinite(dt)||dt<=0||!this.state)return;
  let debt=Math.min(dt,this.state.remaining+PAPER_CRAB.fold);
  while(debt>1e-9&&this.state){const step=Math.min(1/60,debt);debt-=step;this.tick(step,enemies,b,damage);}
 }
 private tick(dt:number,enemies:Enemy[],b:Arena,damage:(e:Enemy,n:number)=>void){
  const t=this.state!;t.age+=dt;t.phaseAge+=dt;
  if(t.phase==='fold'){if(t.phaseAge+1e-8>=PAPER_CRAB.fold)this.reset();return;}
  t.remaining=Math.max(0,t.remaining-dt);if(t.remaining<1e-8){this.phase(t,'fold');return;}
  if(t.phase==='unfold'){if(t.phaseAge+1e-8>=PAPER_CRAB.unfold)this.phase(t,'idle');return;}
  if(t.phase==='idle'){
   const target=this.lane(t,enemies,b);if(!target)return;t.from={x:t.x,y:t.y};t.to=target;t.heading=Math.atan2(target.y-t.y,target.x-t.x);this.phase(t,'windup');return;
  }
  if(t.phase==='windup'){
   if(t.phaseAge+1e-8>=PAPER_CRAB.windup){if(!enemies.some(live)){this.phase(t,'idle');return;}t.charges++;t.hit.clear();this.phase(t,'dash');}return;
  }
  if(t.phase==='dash'){
   const a={x:t.x,y:t.y},u=Math.min(1,t.phaseAge/PAPER_CRAB.dash);t.x=t.from.x+(t.to.x-t.from.x)*u;t.y=t.from.y+(t.to.y-t.from.y)*u;
   for(const e of [...enemies])if(live(e)&&!t.hit.has(e.id)&&distanceToSegment(e,{a,b:t})<=PAPER_CRAB.radius+12){t.hit.add(e.id);t.hits++;damage(e,PAPER_CRAB.damage);}
   if(u>=1)this.phase(t,'rest');
  }else if(t.phase==='rest'&&t.phaseAge+1e-8>=PAPER_CRAB.rest)this.phase(t,'idle');
 }
}
