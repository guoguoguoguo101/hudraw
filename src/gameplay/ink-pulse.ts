import type {Game} from './game';
import type {Point} from '../input/recognizer';
import {inArena,distanceToSegment} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';
export const INK_PULSE={radius:185,damage:90,impact:.12,life:.7,refund:10,refundTargets:3};
export type PulseEffect=Point&{age:number;resolved:boolean;targets:number;ink:number};
/** A local burst released by spending one collected pulse card. */
export class InkPulse{
 clock=0;effect:PulseEffect|null=null;private tone=false;
 reset(){this.clock=0;this.effect=null;this.tone=false;}
 use(g:Game,p:Point){return g.collected.use(g,'pulse',p);}
 release(g:Game,p:Point){
  if(!g.hualingPractice||!g.active||g.campaign.supportPanel||g.hualing.upgrades.blocked||!!this.effect||!inArena(p,g.hualing.bounds))return false;
  this.effect={...p,age:0,resolved:false,targets:0,ink:0};this.tone=true;g.collected.cancel();g.hualing.say('震墨 · 破围');return true;
 }
 advance(g:Game,dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);this.clock+=dt;const p=this.effect;if(!p)return;p.age+=dt;
  if(!p.resolved&&p.age+1e-8>=INK_PULSE.impact){p.resolved=true;
   for(const e of [...g.enemies]){
    const dx=e.x-p.x,dy=e.y-p.y,n=Math.hypot(dx,dy);if(e.hp<=0||!inArena(e,g.hualing.bounds)||n>INK_PULSE.radius+brushBodyRadius(e))continue;
    const ordinary=!e.elite&&!e.chapterBoss&&e.kind!=='boss';if(ordinary){p.targets++;if(e.mountain)e.mountain.broken=true;}
    g.damage(e,ordinary?INK_PULSE.damage:e.chapterBoss||e.kind==='boss'?Math.min(40,e.maxHp*.015):60,0,{id:-7,rune:'ink'});
    if(ordinary&&e.hp>0){e.vx=dx/(n||1)*240;e.vy=dy/(n||1)*240;e.shock=Math.max(e.shock,.65);e.ai='Hit';e.stateAge=0;}
   }
   if(p.targets>=INK_PULSE.refundTargets&&!g.ink.unlimited){p.ink=Math.min(INK_PULSE.refund,g.ink.maxInk-g.ink.currentInk);g.ink.currentInk+=p.ink;if(p.ink>0){g.ink.lastRefund=p.ink;g.ink.refundSerial++;if(g.campaign.running)g.campaign.brush.flow(g,p,p.ink);}}
   g.hualing.say(p.targets>=3?`震墨破围 · ${p.targets}妖${p.ink?` · 回墨${p.ink}`:''}`:'震墨 · 范围震退');
  }
  if(p.age>=INK_PULSE.life)this.effect=null;
 }
 block(a:Point,b:Point,r:number){const p=this.effect;return !!p&&p.age>=INK_PULSE.impact&&distanceToSegment(p,{a,b})<=INK_PULSE.radius+r;}
 takeTone(){const t=this.tone;this.tone=false;return t;}
}
