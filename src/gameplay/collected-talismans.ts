import type {Game} from './game';
import type {Point} from '../input/recognizer';
import {inArena,distanceToSegment} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';
import {BOSS} from './config';
import {CrescentGuard} from './crescent-guard';
export const COLLECTED_RUNES=['pulse','dragon','flower','thunder','beast','crab','heal','ward','storm','crescent'] as const;
export type CollectedRune=typeof COLLECTED_RUNES[number];
const emptyCounts=()=>Object.fromEntries(COLLECTED_RUNES.map(k=>[k,0])) as Record<CollectedRune,number>;
export const COLLECTED_NAMES={pulse:'震墨符',dragon:'游龙符',flower:'墨蝶符',thunder:'雷符',beast:'纸虎符',crab:'蟹将符',heal:'归元符',ward:'九尾结界符',storm:'天狐雷劫符',crescent:'月牙符'};
export const COLLECTED={capacity:5,pickupLimit:8,dropEvery:8,wardRadius:235,wardLife:6,stormLife:3,stormBeats:[.8,1.35,1.9],pickupLife:24};
export type RunePickup=Point&{id:number;kind:CollectedRune;born:number};
export type RuneCast=Point&{id:number;kind:'ward'|'storm';age:number;stage:number;hit:Map<number,number>;marks:Point[][]};
/** Campaign inventory and a separate, repeatable practice cast entry point. */
export class CollectedTalismans{
 crescent=new CrescentGuard();
 counts=emptyCounts();pickups:RunePickup[]=[];casts:RuneCast[]=[];clock=0;version=0;
 selected:CollectedRune|null=null;target:Point|null=null;private serial=0;private sound:CollectedRune|null=null;private meter=0;private dropped=0;private trial=0;private order:CollectedRune[]=[];
 get total(){return COLLECTED_RUNES.reduce((n,k)=>n+this.counts[k],0);}
 get owned(){return [...this.order,...COLLECTED_RUNES.filter(k=>!this.order.includes(k))].filter(k=>this.counts[k]>0); }
 cancel(){this.selected=null;this.target=null;}
 reset(){this.crescent.reset();this.counts=emptyCounts();this.order=[];this.meter=this.dropped=this.trial=0;this.pickups=[];this.casts=[];this.clock=0;this.serial=0;this.sound=null;this.cancel();this.version++;}
 grant(kind:CollectedRune){if(this.total>=COLLECTED.capacity)return false;if(!this.counts[kind]){this.order=this.order.filter(k=>k!==kind);this.order.push(kind);}this.counts[kind]++;this.version++;return true;}
 drop(g:Game,p:Point,kind:CollectedRune){if(this.pickups.length>=COLLECTED.pickupLimit)return;const b=g.hualing.bounds;this.pickups.push({id:++this.serial,kind,born:this.clock,x:Math.max(b.left+40,Math.min(b.right-40,p.x)),y:Math.max(b.top+40,Math.min(b.bottom-80,p.y))});}
 collect(id:number){const p=this.pickups.find(p=>p.id===id);if(!p||!this.grant(p.kind))return false;this.pickups=this.pickups.filter(p=>p.id!==id);return true;}
 collectAlong(a:Point,b:Point){for(const p of [...this.pickups])if(distanceToSegment(p,{a,b})<=38)this.collect(p.id);}
 killed(g:Game,p:Point,elite:boolean){if(!g.hualingPractice||g.campaign.levelId===null&&g.hualing.runeShelf)return;this.meter++;if(elite||this.meter>=(this.dropped?COLLECTED.dropEvery:4)||g.random()<.03){const pool:CollectedRune[]=elite?['ward','storm','dragon','beast','crab','heal','crescent']:['pulse','pulse','pulse','flower','flower','thunder','thunder','dragon','beast','crab','heal','ward','storm','crescent'];const kind=!this.dropped&&!elite?'pulse':pool[Math.floor(g.random()*pool.length)];this.drop(g,p,kind);this.meter=0;this.dropped++;}}
 trialDrops(g:Game){const pool:CollectedRune[]=this.trial++%2?['pulse','thunder','beast','crab','heal']:['pulse','dragon','flower','ward','storm'];for(const [i,k]of pool.entries())this.drop(g,{x:120+i*120,y:g.hualing.bounds.top+150},k);}
 use(g:Game,kind:CollectedRune,p:Point){return this.release(g,kind,p,false);}
 preview(g:Game,kind:CollectedRune,p:Point){if(g.campaign.levelId!==null)return false;return this.release(g,kind,p,true);}
 private release(g:Game,kind:CollectedRune,p:Point,preview:boolean){
  if(!g.active||!g.hualingPractice||g.campaign.supportPanel||g.hualing.upgrades.blocked||!inArena(p,g.hualing.bounds)||(!preview&&this.counts[kind]<1)||this.casts.some(c=>c.kind===kind))return false;
  let accepted=true;
  if(kind==='pulse')accepted=g.pulse.release(g,p);
  else if(kind==='dragon')g.hualing.releaseCollectedDragon(p);
  else if(kind==='flower')g.hualing.petals.activate();
  else if(kind==='thunder')g.hualing.thunder.activate();
  else if(kind==='crescent')this.crescent.activate();
  else if(kind==='heal'){if(g.life>=g.maxHp)return false;g.life=Math.min(g.maxHp,g.life+35);}
  else if(kind==='beast'||kind==='crab')accepted=g.hualing.releaseCollectedSummon(kind,p);
  else{const c:RuneCast={...p,id:++this.serial,kind,age:0,stage:0,hit:new Map(),marks:[[],[],[]]};this.casts.push(c);}
  if(!accepted)return false;if(!preview)this.counts[kind]--;this.version++;this.cancel();this.sound=kind;g.hualing.say(kind==='flower'?'墨蝶附笔十二秒 · 落笔折蝶，一秒后碎纸惊风':COLLECTED_NAMES[kind]+' · 已释放');return true;
 }

 block(a:Point,b:Point,r:number){return this.casts.some(c=>c.kind==='storm'&&c.age>=.8&&c.age<2.3||c.kind==='ward'&&c.age>.1&&distanceToSegment(c,{a,b})<=COLLECTED.wardRadius+r);}
 private damage(g:Game,c:RuneCast,amount:number,all=false){
  for(const e of [...g.enemies]){
   if(e.hp<=0||!inArena(e,g.hualing.bounds)||!all&&Math.hypot(e.x-c.x,e.y-c.y)>COLLECTED.wardRadius+brushBodyRadius(e))continue;
   const boss=!!e.chapterBoss||e.kind==='boss';let n=amount;
   if(c.kind==='storm'){
    const paid=c.hit.get(e.id)??0,cap=boss?e.maxHp*.12:e.elite?420:Math.max(e.maxHp,1),budget=Math.max(0,cap-paid);
    n=Math.min(budget,boss?e.maxHp*.04:e.elite?140:Math.max(e.hp,e.maxHp));
    const scale=(1+e.armor)*g.hualing.elites.damageScale(e)*(e.chapterBoss?g.hualing.bosses.damageScale(e):1)*(e.kind==='boss'&&e.armorPool>0?1-BOSS.armorReduction:1);
    if(scale<=0)continue;n/=scale;if(!boss&&!e.elite&&e.mountain)e.mountain.broken=true;
   }
   if(n>0){const before=e.hp;g.damage(e,n,0,{id:-6,rune:'ink'});if(c.kind==='storm')c.hit.set(e.id,(c.hit.get(e.id)??0)+Math.max(0,before-e.hp));if(!boss&&e.hp>0){e.ai='Hit';e.stateAge=0;e.vx=e.vy=0;}}
  }
 }
 advance(g:Game,dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);this.clock+=dt;this.pickups=this.pickups.filter(p=>this.clock-p.born<COLLECTED.pickupLife);
  this.crescent.advance(g,dt);
  for(const c of this.casts){c.age+=dt;
   if(c.kind==='ward'){
    if(c.stage===0&&c.age>=.12){c.stage++;this.damage(g,c,70);for(const e of g.enemies)if(!e.elite&&!e.chapterBoss&&Math.hypot(e.x-c.x,e.y-c.y)<COLLECTED.wardRadius){const dx=e.x-c.x,dy=e.y-c.y,n=Math.hypot(dx,dy)||1;e.vx=dx/n*180;e.vy=dy/n*180;}}
    while(c.stage>=1&&c.stage<=10&&c.age>=c.stage*.5){c.stage++;this.damage(g,c,18);}
    if(c.stage===11&&c.age>=5.6){c.stage++;this.damage(g,c,110);this.sound='ward';}
   }else while(c.stage<3&&c.age>=COLLECTED.stormBeats[c.stage]){
    const b=g.hualing.bounds,marks=c.marks[c.stage];
    for(const e of g.enemies.filter(e=>e.hp>0&&inArena(e,b)).slice(0,12))marks.push({x:e.x,y:e.y});
    for(let i=0;i<9;i++)marks.push({x:b.left+55+((i*197+c.stage*79)%(b.right-b.left-110)),y:b.top+65+((i*131+c.stage*103)%(Math.max(1,b.bottom-b.top-130)))});
    this.damage(g,c,0,true);c.stage++;this.sound='storm';
   }
  }
  this.casts=this.casts.filter(c=>c.age<(c.kind==='ward'?COLLECTED.wardLife:COLLECTED.stormLife));
 }
 slow(e:Point){return this.casts.some(c=>c.kind==='ward'&&c.age>.12&&Math.hypot(e.x-c.x,e.y-c.y)<COLLECTED.wardRadius);}
 takeSound(){const s=this.sound;this.sound=null;return s;}
}
