import type {Game} from './game';
import type {Point} from '../input/recognizer';
import {inArena,distanceToSegment} from '../input/line-interaction-geometry';
import {BOSS} from './config';
import {brushBodyRadius} from './brush-contact';
export const FOX_RUSH={count:9,forming:.18,stagger:.045,speed:365,radius:18,damage:34,cooldown:4.2,eliteCap:200,bossCap:.08};
export type RushingFox=Point&{id:number;from:Point;previous:Point;targetX:number;age:number;delay:number;angle:number;hit:Set<number>;done:boolean};
/** One bounded, physical fan of foxes: damage follows each fox's swept contact. */
export class FoxRush{
 units:RushingFox[]=[];age=0;remaining=0;serial=0;origin:Point={x:360,y:950};private paid=new Map<number,number>();private tone:'summon'|'impact'|null=null;
 get active(){return this.units.length>0;}
 reset(){this.units=[];this.age=this.remaining=this.serial=0;this.paid.clear();this.tone=null;}
 cast(g:Game){
  if(!g.frontlineTest||!g.active||g.hualing.upgrades.blocked||g.campaign.supportPanel||this.active||this.remaining>1e-8)return false;
  const b=g.hualing.bounds;if(b.bottom-b.top<150)return false;
  this.age=0;this.remaining=FOX_RUSH.cooldown;this.paid.clear();this.serial++;this.tone='summon';this.origin={x:g.playerPosition.x,y:Math.max(b.top+70,g.playerPosition.y-50)};
  this.units=Array.from({length:FOX_RUSH.count},(_,i)=>{const from={x:this.origin.x+(i-4)*9,y:this.origin.y+Math.abs(i-4)*2};return{...from,id:i,from,previous:{...from},targetX:b.left+42+i*(b.right-b.left-84)/8,age:-FOX_RUSH.forming-i*FOX_RUSH.stagger,delay:FOX_RUSH.forming+i*FOX_RUSH.stagger,angle:-Math.PI/2,hit:new Set<number>(),done:false};});
  g.hualing.say('狐群冲阵 · 九灵应召，向前破阵');return true;
 }
 advance(g:Game,dt:number){
  if(!g.frontlineTest||!g.active||g.hualing.upgrades.blocked||g.campaign.supportPanel||!Number.isFinite(dt)||dt<=0)return;
  let debt=Math.min(dt,.1);while(debt>1e-9){const step=Math.min(debt,1/120);debt-=step;this.tick(g,step);}
 }
 private tick(g:Game,dt:number){
  this.remaining=Math.max(0,this.remaining-dt);if(!this.active)return;this.age+=dt;const b=g.hualing.bounds;
  for(const f of this.units){
   f.age=this.age-f.delay;if(f.age<=0||f.done)continue;f.previous={x:f.x,y:f.y};const distance=f.age*FOX_RUSH.speed,u=Math.max(0,Math.min(1,distance/Math.max(120,f.from.y-b.top))),ease=u*u*(3-2*u);
   f.x=f.from.x+(f.targetX-f.from.x)*ease;f.y=f.from.y-distance;f.angle=Math.atan2(f.y-f.previous.y,f.x-f.previous.x);
   if(f.y<b.top-35){f.done=true;continue;}
   for(const e of [...g.enemies]){if(e.hp<=0||f.hit.has(e.id)||!inArena(e,b)||distanceToSegment(e,{a:f.previous,b:f})>FOX_RUSH.radius+brushBodyRadius(e))continue;
    f.hit.add(e.id);const boss=!!e.chapterBoss||e.kind==='boss',paid=this.paid.get(e.id)??0,cap=boss?e.maxHp*FOX_RUSH.bossCap:e.elite?FOX_RUSH.eliteCap:Infinity;
    const scale=(e.kind==='boss'&&e.armorPool>0?1-BOSS.armorReduction:1)*(1+e.armor)*g.hualing.elites.damageScale(e)*(e.chapterBoss?g.hualing.bosses.damageScale(e):1),budget=Math.max(0,cap-paid);
    const amount=Math.min(FOX_RUSH.damage,scale>0?budget/scale:0);if(amount<=0)continue;
    const hp=e.hp;g.damage(e,amount,0,{id:-8,rune:'ink'});this.paid.set(e.id,paid+Math.max(0,hp-e.hp));if(e.hp<hp)this.tone='impact';
   }
  }
  this.units=this.units.filter(f=>!f.done);if(!this.active)this.paid.clear();
 }
 takeTone(){const t=this.tone;this.tone=null;return t;}
}
