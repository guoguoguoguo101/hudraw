import type {Enemy} from '../core/types';
import {WORLD} from '../core/types';
import type {Point} from '../input/recognizer';
import type {Game} from './game';

export type MountainEnemy={role:'paper'|'armor'|'shield'|'eye';broken:boolean;facing:Point;staggerUntil:number;scale:number};
type Notice=Point&{kind:'armor'|'blocked'|'eye'|'shield';at:number};
export const SWEEP_TIERS=[{kills:3,ink:3,label:'斩三妖'},{kills:5,ink:6,label:'一扫五妖'},{kills:8,ink:10,label:'八妖尽破'}] as const;
export type SweepResult=Point&{kills:number;tier:number;ink:number;at:number;cancelled:boolean};
export type InkFlow={from:Point;to:Point;at:number;amount:number};

/** Campaign-only primary strokes. Secondary skills never impersonate a player's sweep. */
export class MountainStroke{
 active=false;kills=0;tier=0;tierAt=-100;tip:Point={x:360,y:600};path:Point[]=[];result:SweepResult|null=null;
 notices:Notice[]=[];flows:InkFlow[]=[];inkBoostUntil=-100;lastTrace=-100;
 private touched=new Set<number>();private blocked=new Set<number>();private tone=0;
 reset(){this.active=false;this.kills=this.tier=this.tone=0;this.path=[];this.result=null;this.notices=[];this.flows=[];this.touched.clear();this.blocked.clear();this.inkBoostUntil=this.lastTrace=this.tierAt=-100;}
 configure(e:Enemy,role:MountainEnemy['role']='paper'){
  if(e.elite||e.chapterBoss||e.kind==='boss')return;
  const dx=WORLD.foxX-e.x,dy=WORLD.foxY-e.y,n=Math.hypot(dx,dy)||1;
  e.mountain={role,broken:false,facing:{x:dx/n,y:dy/n},staggerUntil:0,scale:.8};
  e.hp=e.maxHp=role==='eye'?22:role==='armor'?30:26;
 }
 begin(origin?:Point){this.active=true;this.kills=this.tier=0;this.touched.clear();this.blocked.clear();this.path=origin?[{...origin}]:[];if(origin)this.tip={...origin};}
 trace(g:Game,a:Point,b:Point){
  if(!this.active)return;this.tip={...b};this.lastTrace=g.campaign.age;
  if(!this.path.length)this.path.push({...a});this.path.push({...b});if(this.path.length>64)this.path.splice(0,this.path.length-64);
 }
 hit(g:Game,e:Enemy,a:Point,b:Point){
  if(!this.active||this.touched.has(e.id))return false;
  const m=e.mountain,now=g.campaign.age;
  if(!m||e.elite||e.chapterBoss)return true;
  if(m.role==='armor'&&!m.broken){
   this.touched.add(e.id);m.broken=true;e.hit=.24;e.ai='Hit';e.stateAge=0;
   this.notice('armor',e,now);g.events.push({type:'brushCue',kind:'armor',x:e.x,y:e.y,tier:0});return false;
  }
  if(m.role==='shield'&&!m.broken){
   const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1,parallel=Math.abs((dx*m.facing.x+dy*m.facing.y)/n);
   if(parallel>.65){if(!this.blocked.has(e.id)){this.blocked.add(e.id);this.notice('blocked',e,now);g.events.push({type:'brushCue',kind:'blocked',x:e.x,y:e.y,tier:0});}return false;}
   m.broken=true;this.notice('shield',e,now);g.events.push({type:'brushCue',kind:'shield',x:e.x,y:e.y,tier:0});
  }
  this.touched.add(e.id);return true;
 }
 killed(g:Game,e:Enemy,direct:boolean){
  const now=g.campaign.age;
  if(e.mountain?.role==='eye'){
   for(const other of g.enemies){if(other===e||other.elite||other.chapterBoss||other.kind==='boss'||Math.hypot(other.x-e.x,other.y-e.y)>175)continue;
    if(!other.mountain)this.configure(other);other.mountain!.staggerUntil=now+1.1;other.ai='Hit';other.stateAge=0;other.vx=other.vy=0;
   }
   this.notice('eye',e,now);g.events.push({type:'brushCue',kind:'eye',x:e.x,y:e.y,tier:0});
  }
  if(!direct||!this.active||e.elite||e.chapterBoss||e.kind==='boss')return;
  this.kills++;const tier=SWEEP_TIERS.filter(t=>this.kills>=t.kills).length;
  if(tier>this.tier){this.tier=tier;this.tierAt=now;this.tone=Math.max(this.tone,tier);g.hitStopRemaining=Math.max(g.hitStopRemaining,[0,.035,.055,.075][tier]);g.events.push({type:'brushCue',kind:'tier',x:e.x,y:e.y,tier});}
 }
 end(g:Game,cancel=false){
  if(!this.active)return;this.active=false;const now=g.campaign.age;
  if(!this.kills)return;
  const reward=cancel?0:SWEEP_TIERS[this.tier-1]?.ink??0,actual=Math.min(reward,g.ink.maxInk-g.ink.currentInk);
  if(actual>0){g.ink.currentInk+=actual;this.inkBoostUntil=now+.8;}
  this.result={...this.tip,kills:this.kills,tier:this.tier,ink:actual,at:now,cancelled:cancel};
  if(!cancel&&this.tier)g.events.push({type:'brushCue',kind:'settle',x:this.tip.x,y:this.tip.y,tier:this.tier});
 }
 flow(g:Game,from:Point,amount:number){
  const to=g.ink.pending?{...this.tip}:{x:550,y:g.hualing.bounds.top-133};
  this.flows.push({from:{...from},to,at:g.campaign.age,amount});if(this.flows.length>6)this.flows.shift();this.inkBoostUntil=g.campaign.age+1;g.events.push({type:'brushCue',kind:'ink',x:from.x,y:from.y,tier:0});
 }
 advance(g:Game){const now=g.campaign.age;this.notices=this.notices.filter(n=>now-n.at<1.1);this.flows=this.flows.filter(f=>now-f.at<.7);if(this.result&&now-this.result.at>2)this.result=null;}
 private notice(kind:Notice['kind'],p:Point,at:number){this.notices.push({kind,x:p.x,y:p.y,at});if(this.notices.length>12)this.notices.shift();}
 takeTone(){const t=this.tone;this.tone=0;return t;}
}
