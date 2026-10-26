import type {Enemy} from '../core/types';
import {WORLD} from '../core/types';
import type {Point} from '../input/recognizer';
import {distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {ELITE_CATALOG,type EliteKind} from './elite-catalog';
import {EliteField,FIELD_GOALS} from './elite-field';
export {ELITE_CATALOG,ELITE_NAMES,chapterElites,type EliteKind} from './elite-catalog';
export type EliteMotion={action:'idle'|'prepare'|'cast'|'impact'|'parry'|'break'|'recall';age:number;power:number;side:number;serial:number};
export type EliteState={motion?:EliteMotion;kind:EliteKind;phase:'arrive'|'approach'|'windup'|'dash'|'recover'|'stagger';age:number;ribs:boolean[];shell:number;nextShell:number;target:Point;attackHit:boolean;clock:number;cycle:number;broken:boolean[];progress:number;hits:number;goal:number};
type Shard=Point&{age:number;angle:number;color:number};
export type EliteRelic=Point&{kind:EliteKind;marks:boolean[];collected:boolean;age:number};
// Kept as a renderer contract for the native fallback; encounters no longer use local body marks.
export type ElitePart=Point&{index:number;active:boolean;broken:boolean;radius:number;shape:'knot'|'moth'|'pearl'|'sail'|'mirror'|'shuttle'|'clapper'|'seal'|'blade'|'ice'|'lamp'|'snow'|'stone'|'ray'|'antler'|'crack'};
export function createElite(kind:EliteKind):EliteState{return {kind,phase:'arrive',age:0,ribs:[],shell:0,nextShell:0,target:{x:WORLD.foxX,y:WORLD.foxY},attackHit:false,clock:0,cycle:0,broken:[],progress:0,hits:0,goal:FIELD_GOALS[kind]};}
export function eliteRibPoints(e:Enemy){return [-1,-.36,.36,1].map((x,i)=>({x:e.x+x*58,y:e.y-30+(i===0||i===3?-2:11)}));}
export function eliteRelicPoints(r:EliteRelic){return Array.from({length:12},(_,i)=>({x:r.x+Math.cos(i/12*Math.PI*2)*34,y:r.y+Math.sin(i/12*Math.PI*2)*23}));}
export function eliteParts(_e:Enemy):ElitePart[]{return [];}
export function eliteHint(e:Enemy){const s=e.elite!;if(s.phase==='stagger')return '全卷反制成功 · 伤害 ×1.6';if(s.phase==='arrive')return '精英入画';if(s.phase==='windup')return '全卷出招 · 留意四周';if(s.phase==='dash')return `${ELITE_CATALOG[s.kind].hint}  ${s.progress}/${s.goal}`;return '下一轮将至 · 可以先清小怪';}
export class HualingElites{
 field=new EliteField();shards:Shard[]=[];relics:EliteRelic[]=[];private protected=new Set<number>();notice='';
 get hits(){return this.field.hits;}
 get reinforcements(){return this.field.reinforcements;}
 get wisps(){return this.field.objects.filter(o=>o.shape==='lantern');}
 reset(){this.field.reset();this.shards=[];this.relics=[];this.protected.clear();this.notice='';}
 clearOwners(ids:Set<number>){this.field.clear(ids);this.protected.clear();}
 private burst(p:Point,color=0xe8c68b){for(let i=0;i<8;i++)this.shards.push({...p,age:0,angle:i*2.399,color});if(this.shards.length>96)this.shards.splice(0,this.shards.length-96);}
 damageScale(e:Enemy){const s=e.elite;if(!s)return this.protected.has(e.id)?.5:1;return s.phase==='stagger'?1.6:.55;}
 isProtected(e:Enemy){return this.protected.has(e.id);}
 killed(e:Enemy,b:Arena){if(!e.elite)return;this.clearOwners(new Set([e.id]));this.burst(e);this.relics.push({kind:e.elite.kind,x:Math.max(b.left+50,Math.min(b.right-50,e.x)),y:Math.max(b.top+85,Math.min(b.bottom-140,e.y)),marks:Array(12).fill(false),collected:false,age:0});if(this.relics.length>4)this.relics.shift();}
 trace(a:Point,b:Point,radius:number,enemies:Enemy[],now:number){
  const out=this.field.trace(a,b,radius,enemies,now),rewards:EliteKind[]=[];
  for(const r of this.relics)if(!r.collected){eliteRelicPoints(r).forEach((p,i)=>{if(distanceToSegment(p,{a,b})<=radius+12)r.marks[i]=true;});if(r.marks.every(Boolean)){r.collected=true;r.age=0;this.burst(r);rewards.push(r.kind);}}
  return {messages:out.messages,rewards,counterHits:out.hits};
 }
 advance(dt:number,enemies:Enemy[],frozen:boolean,hurt:(amount:number)=>void,damage:(e:Enemy,n:number)=>void=()=>{}){
  if(frozen||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);
  for(const p of this.shards)p.age+=dt;this.shards=this.shards.filter(p=>p.age<.45);for(const r of this.relics)r.age+=dt;this.relics=this.relics.filter(r=>!r.collected||r.age<.8);
  this.field.advance(dt,enemies,hurt);const out=this.field.drain();for(const h of out.hits)if(h.enemy.hp>0)damage(h.enemy,h.amount);if(out.messages.length)this.notice=out.messages.at(-1)!;
  this.protected.clear();for(const r of this.field.rounds.values())if(r.kind==='puppet'&&this.field.objects.some(o=>o.owner===r.owner&&o.shape==='thread'))for(const e of enemies)if(!e.elite&&!e.chapterBoss)this.protected.add(e.id);
 }
 updateEnemy(e:Enemy,dt:number,b:Arena,_hurt:(amount:number)=>void){
  const s=e.elite;if(!s||e.hp<=0)return;e.age+=dt;s.age+=dt;s.clock+=dt;if(s.motion)s.motion.age+=dt;e.vx=e.vy=0;this.field.bounds={...b};
  const enter=(phase:EliteState['phase'])=>{s.phase=phase;s.age=0;s.attackHit=false;if(phase==='windup')s.motion={action:'prepare',age:0,power:1,side:1,serial:(s.motion?.serial??0)+1};if(phase==='recover')s.motion={action:'recall',age:0,power:1,side:1,serial:(s.motion?.serial??0)+1};};
  if(s.phase==='arrive'&&s.age>.65)enter('approach');
  else if(s.phase==='approach'&&s.age>1.15)enter('windup');
  else if(s.phase==='windup'&&s.age>.9)this.field.begin(e,b,[]);
  else if(s.phase==='dash'&&s.age>9.2){this.field.clear(new Set([e.id]));s.cycle++;enter('recover');}
  else if(s.phase==='stagger'&&s.age>2.5){this.field.clear(new Set([e.id]));s.cycle++;enter('recover');}
  else if(s.phase==='recover'&&s.age>1.1)enter('approach');
  // The caster stays readable and far from the fox. Its attacks travel around the scroll.
  e.x=Math.max(b.left+115,Math.min(b.right-115,e.x));e.y=Math.max(b.top+115,Math.min(b.top+165,e.y));
 }
}
