import {ENEMIES,LEVEL} from './config';
import type {Game} from './game';
import type {EnemyKind} from '../core/types';
const COMBAT_BOSS_INTERVAL=180;
export class SpawnDirector{
 constructor(public config=LEVEL){}
 budget=0;bossSpawned=false;nextElite=60;nextBoss=0;disabled=false;
 private entrySide=0;
 reset(){this.entrySide=0;this.budget=0;this.bossSpawned=false;this.nextBoss=this.config.bossAt;this.nextElite=this.config.eliteAt;this.disabled=false;}
 hualingEntry(game:Game){
  const b=game.hualing.bounds,side=this.entrySide++%4;let best={x:b.left+55,y:b.top+55},score=-Infinity;
  for(let i=0;i<8;i++){
   const t=.15+game.random()*.7,x=b.left+55+t*Math.max(0,b.right-b.left-110),y=b.top+55+t*Math.max(0,b.bottom-b.top-120);
   const p=side===0?{x,y:b.top+55}:side===1?{x:b.right-55,y}:side===2?{x,y:b.bottom-65}:{x:b.left+55,y};
   const clearance=Math.min(Math.hypot(p.x-360,p.y-665),...game.enemies.map(e=>Math.hypot(p.x-e.x,p.y-e.y)));
   if(clearance>score){best=p;score=clearance;}
  }
  return best;
 }
 update(game:Game,dt:number){if(this.disabled)return;
  if(game.practice){
   if(game.hualingPractice&&game.enemies.some(e=>e.chapterBoss))return;
   // Continuous replacements, with a bounded crowd so long sessions stay usable on phones.
   this.budget=Math.min(game.hualingPractice?1:3,this.budget+dt*(game.hualingPractice?1/1.5:2));
   const count=game.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length;
   if(count<(game.hualingPractice?6:12)&&this.budget>=1){game.spawn(game.random()<.35?'crow':'ink',game.hualingPractice?this.hualingEntry(game):undefined);this.budget-=1;}
   return;
  }
  const at=game.endless?this.nextBoss:game.training?this.config.trainingBossAt:this.config.bossAt;
  if((game.endless?!game.enemies.some(e=>e.kind==='boss'):!this.bossSpawned)&&game.time>=at){game.spawn('boss',{x:360,y:365});this.bossSpawned=true;this.nextBoss=game.time+COMBAT_BOSS_INTERVAL;game.events.push({type:'wave',label:'赤面鬼王 · 破甲可阻咒'});}
  if(game.time>=game.duration)return;
  this.budget=Math.min(12,this.budget+dt*this.config.budgetRates[Math.min(5,Math.floor(game.time/30))]*(game.training?.65:1)*(game.endless?Math.min(2,1+game.wave*.08):1));
  if(game.time>=this.nextElite&&this.budget>=6&&game.enemies.filter(e=>e.kind==='oni').length<this.config.eliteCap){game.spawn('oni');this.budget-=6;this.nextElite=game.time+25;}
  const ordinary=game.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length;if(ordinary>=this.config.cap)return;
  let kind:EnemyKind='ink';if(game.time>=this.config.crowAt&&this.budget>=2&&game.random()<this.config.weights.crow/(this.config.weights.crow+this.config.weights.ink))kind='crow';const cost=ENEMIES[kind].weight;
  if(this.budget>=cost){game.spawn(kind);this.budget-=cost;}
 }
}
