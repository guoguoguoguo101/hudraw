import {ENEMIES,LEVEL} from './config';
import type {Game} from './game';
import type {EnemyKind} from '../core/types';
export class SpawnDirector{
 constructor(public config=LEVEL){}
 budget=0;bossSpawned=false;nextElite=60;disabled=false;
 reset(){this.budget=0;this.bossSpawned=false;this.nextElite=this.config.eliteAt;this.disabled=false;}
 update(game:Game,dt:number){if(this.disabled)return;
  if(game.practice){
   // Continuous replacements, with a bounded crowd so long sessions stay usable on phones.
   this.budget=Math.min(3,this.budget+dt*2);
   const count=game.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length;
   if(count<12&&this.budget>=1){game.spawn(game.random()<.35?'crow':'ink');this.budget-=1;}
   return;
  }
  const at=game.training?this.config.trainingBossAt:this.config.bossAt;if(!this.bossSpawned&&game.time>=at){game.spawn('boss',{x:360,y:365});this.bossSpawned=true;game.events.push({type:'wave',label:'赤面鬼王 · 破甲可阻咒'});}
  if(game.time>=game.duration)return;
  this.budget=Math.min(12,this.budget+dt*this.config.budgetRates[Math.min(5,Math.floor(game.time/30))]*(game.training?.65:1));
  if(game.time>=this.nextElite&&this.budget>=6&&game.enemies.filter(e=>e.kind==='oni').length<this.config.eliteCap){game.spawn('oni');this.budget-=6;this.nextElite=game.time+25;}
  const ordinary=game.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length;if(ordinary>=this.config.cap)return;
  let kind:EnemyKind='ink';if(game.time>=this.config.crowAt&&this.budget>=2&&game.random()<this.config.weights.crow/(this.config.weights.crow+this.config.weights.ink))kind='crow';const cost=ENEMIES[kind].weight;
  if(this.budget>=cost){game.spawn(kind);this.budget-=cost;}
 }
}
