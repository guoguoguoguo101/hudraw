import {WORLD,type Enemy,type AIState} from '../core/types';
import {ENEMIES,BOSS} from './config';
import type {Game} from './game';
function state(e:Enemy,ai:AIState){e.ai=ai;e.stateAge=0;}
export class BossController{
 static update(g:Game,e:Enemy,dt:number){
  const phase=e.hp/e.maxHp>BOSS.thresholds[0]?1:e.hp/e.maxHp>BOSS.thresholds[1]?2:3;
  if(phase!==e.phase){e.phase=phase;if(phase>1)e.armorPool=0;state(e,'Recovery');g.events.push({type:'wave',label:phase===2?'鬼王召妖 · 群符镇压':'血月咒印 · 护阵或破甲'});}
  if(e.ai==='Spawn'){if(e.stateAge>.8)state(e,'Recovery');return;}
  if(e.ai==='Hit'){if(e.stateAge>.45)state(e,'Recovery');return;}
  if(e.ai==='Recovery'&&e.stateAge>BOSS.recoveries[phase-1]){state(e,'Telegraph');e.vx=0;e.aim={x:0,y:1};if(phase===2){for(let i=0;i<4;i++)g.spawn(i%2?'crow':'ink');}return;}
  if(e.ai==='Telegraph'&&e.stateAge>=BOSS.windups[phase-1]){state(e,'Attack');g.hurt(BOSS.damage[phase-1]);return;}
  if(e.ai==='Attack'&&e.stateAge>.45)state(e,'Recovery');
 }
}
export class EnemyAI{
 static status(g:Game,e:Enemy,dt:number){e.hit=Math.max(0,e.hit-dt);e.armorTime=Math.max(0,e.armorTime-dt);if(!e.armorTime)e.armor=0;if(e.shock>0){const old=e.shock;e.shock=Math.max(0,e.shock-dt);if(Math.ceil(old)!==Math.ceil(e.shock))g.damage(e,12,0);}}
 static update(g:Game,e:Enemy,dt:number){if(e.hp<=0||e.ai==='Death')return;e.bindingImmunity=Math.max(0,(e.bindingImmunity??0)-dt);e.age+=dt;e.stateAge+=dt;this.status(g,e,dt);if(e.hp<=0)return;
  if(e.kind==='boss'){BossController.update(g,e,dt);return;}
  const target=g.functionalRelics.target(e),moveScale=g.functionalRelics.moveScale(e),stats=ENEMIES[e.kind],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1;
  e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-dt*6);e.vy*=Math.exp(-dt*6);
  // Keep bodies readable around the fox; only a telegraphed attack may enter this space.
  if(g.hualingPractice&&!e.lureId&&e.ai!=='Attack'&&e.ai!=='Recovery'){
   const fx=e.x-WORLD.foxX,fy=e.y-WORLD.foxY,fd=Math.hypot(fx,fy),clearance=e.kind==='crow'?190:150;
   if(fd<clearance){e.x=WORLD.foxX+(fd?fx/fd:0)*clearance;e.y=WORLD.foxY+(fd?fy/fd:-1)*clearance;return;}
  }
  if(e.ai==='Spawn'){if(e.stateAge>.3)state(e,'Approach');return;}
  if(e.ai==='Hit'){if(e.stateAge>.18)state(e,'Approach');return;}
  if(e.ai==='Recovery'){const retreat=g.hualingPractice?180:e.kind==='crow'?65:35;e.x-=dx/d*retreat*dt;e.y-=dy/d*retreat*dt;if(e.stateAge>=stats.recovery)state(e,'Approach');return;}
  if(e.ai==='Approach'){
   let sx=0,sy=0;for(const other of g.enemies){if(other===e||other.hp<=0||other.kind==='boss')continue;const ox=e.x-other.x,oy=e.y-other.y,od=Math.hypot(ox,oy),gap=g.hualingPractice?(other.elite?145:95):47;if(od>0&&od<gap){sx+=ox/od*(gap-od)*1.1;sy+=oy/od*(gap-od)*1.1;}}
   const special=g.hualingPractice?e.look:undefined;
   const orbit=special==='snow-owl'?Math.sin(e.age*2.2+e.id)*.65:special==='sea-fish'?Math.sin(e.age*4+e.id)*.85:special==='sea-crab'?Math.sin(e.age*2+e.id)*1.5:special==='star-ray'?.85:special==='star-kite'?Math.sign(Math.sin(e.age*3+e.id))*.7:e.kind==='crow'?Math.sin(e.age*2+e.id)*.45:0;
   const pulse=special==='snow-marten'?.55+.65*Math.max(0,Math.sin(e.age*4)):special==='snow-shell'?.75:special==='sea-jelly'?.55+.65*Math.max(0,Math.sin(e.age*3)):special==='star-bell'?.45+.9*Math.max(0,Math.sin(e.age*2.2)):1;e.x+=(dx/d*e.speed*moveScale*pulse*(g.hualingPractice&&g.hualing.upgrades.trail.isSlowed(e.id)?.72:1)-dy/d*e.speed*orbit+sx)*dt;e.y+=(dy/d*e.speed*moveScale*pulse*(g.hualingPractice&&g.hualing.upgrades.trail.isSlowed(e.id)?.72:1)+dx/d*e.speed*orbit+sy)*dt;
   if(d<(e.lureId?(e.kind==='crow'?90:55):g.hualingPractice?(e.kind==='crow'?220:180):(e.kind==='crow'?155:68))){state(e,'Telegraph');e.aim={x:dx/d,y:dy/d};e.attackOrigin={x:e.x,y:e.y};e.lureHit=false;}return;
  }
  if(e.ai==='Telegraph'&&e.stateAge>=stats.windup){state(e,'Attack');if(e.kind!=='crow'&&d<100&&!g.hualingPractice)g.hitEnemyTarget(e,stats.damage);return;}
  if(e.ai==='Attack'&&g.hualingPractice&&!e.lureId){
   e.x+=e.aim.x*320*dt;e.y+=e.aim.y*320*dt;
   if(Math.hypot(e.x-target.x,e.y-target.y)<60){g.hitEnemyTarget(e,stats.damage);state(e,'Recovery');}
   else if(e.stateAge>.7)state(e,'Recovery');return;
  }
  if(e.ai==='Attack'){if(e.kind==='crow'){e.x+=e.aim.x*390*dt;e.y+=e.aim.y*390*dt;if(Math.hypot(e.x-target.x,e.y-target.y)<55)g.hitEnemyTarget(e,stats.damage);}if(e.stateAge>(e.kind==='crow'?.46:.25))state(e,'Recovery');}
 }
}
