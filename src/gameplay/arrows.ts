import type {Skill} from '../core/types';
import type {Game} from './game';
import type {Point} from '../input/recognizer';
import {SkillTargetResolver as Target} from './target';
import {playFoxGuardianSkill,updateFoxGuardian,type FoxGuardianConfig} from './fox-guardian';

export const ARROW_STAGES=[
 {name:'穿甲矢',count:1,speed:850,duration:2.4,launch:.14},
 {name:'追魂矢',count:1,speed:1000,duration:2.4,launch:.20},
 {name:'诛妖矢',count:3,speed:1050,duration:2.7,launch:.26},
 {name:'灵狐降灵',count:0,speed:0,duration:3,launch:2.4}
] as const;
export type SpiritArrow={index:number;x:number;y:number;angle:number;seekDirection:Point;launch:number;target:number|null;distance:number;done:boolean;impactAt:number;impact:boolean;trail:Point[]};
export type ArrowState={level:number;projectiles:SpiritArrow[];guardian?:FoxGuardianConfig};
export function configureArrows(s:Skill,level=s.testLevel??1){
 const stage=ARROW_STAGES[level-1];s.arrows={level,projectiles:[]};s.duration=Math.max(s.duration,stage.duration);if(level===4)playFoxGuardianSkill(s);
}
function summon(s:Skill,g:Game){
 const state=s.arrows!,stage=ARROW_STAGES[state.level-1],base=Math.atan2(s.direction.y,s.direction.x);
 const targets=Target.sector(g.enemies,s.direction,s.range,.35);
 const mirrored=s.mirror&&Math.abs(s.direction.x)>.025;
 const count=stage.count*(mirrored?2:1);
 for(let i=0;i<count;i++){
  const reflected=mirrored&&i>=stage.count,seekDirection=reflected?{x:-s.direction.x,y:s.direction.y}:s.direction;
  const sourceAngle=reflected?Math.atan2(seekDirection.y,seekDirection.x):base;
  const spread=(i%stage.count-(stage.count-1)/2)*.34,a=sourceAngle+spread;
  // A fan of separate summoning anchors around the player's shoulders.
  const radius=48,x=s.x+Math.cos(a)*radius,y=s.y+Math.sin(a)*radius;
  const sector=reflected?Target.sector(g.enemies,seekDirection,s.range):targets;
  const selected=sector[i%Math.max(1,sector.length)];

  const launch=stage.launch+i*.035;
  state.projectiles.push({index:i,x,y,angle:a,seekDirection,launch,target:selected?.id??null,distance:0,done:false,impactAt:0,impact:false,trail:[{x,y}]});
 }
}
export function updateArrows(g:Game,s:Skill,dt:number){
 if(!s.arrows)configureArrows(s);const state=s.arrows!,stage=ARROW_STAGES[state.level-1];
 if(state.level===4){updateFoxGuardian(g,s);return;}
 if(!state.projectiles.length)summon(s,g);
 for(const p of state.projectiles){
  if(p.done||s.age<p.launch)continue;s.released=true;
  let target=g.enemies.find(e=>e.id===p.target&&e.hp>0);
  if(!target){
   const candidates=Target.sector(g.enemies,p.seekDirection,s.range,.35).filter(e=>!s.hit.has(e.id));
   target=candidates.sort((a,b)=>Target.distance(a,p)-Target.distance(b,p))[0];p.target=target?.id??null;
  }
  if(p.index===0&&p.distance===0)g.primaryAction({kind:'projectile',castId:s.id,origin:{x:p.x,y:p.y},direction:{...p.seekDirection},damage:s.damage,targetId:p.target,speed:stage.speed,range:s.range});
  const speed=stage.speed,step=speed*Math.min(dt,Math.max(0,s.age-p.launch));
  if(target){
   const desired=Math.atan2(target.y-p.y,target.x-p.x),difference=Math.atan2(Math.sin(desired-p.angle),Math.cos(desired-p.angle));
   const turn=10;
   p.angle+=Math.max(-dt*turn,Math.min(dt*turn,difference));
  }
  const old={x:p.x,y:p.y};p.x+=Math.cos(p.angle)*step;p.y+=Math.sin(p.angle)*step;p.distance+=step;
  p.trail.push({x:p.x,y:p.y});if(p.trail.length>30)p.trail.shift();
  if(target){
   const dx=p.x-old.x,dy=p.y-old.y,f=Math.max(0,Math.min(1,((target.x-old.x)*dx+(target.y-old.y)*dy)/(step*step||1)));
   const radius=target.kind==='boss'?40:target.kind==='oni'?26:18;
   if(Math.hypot(old.x+dx*f-target.x,old.y+dy*f-target.y)<=radius){
    p.x=target.x;p.y=target.y;p.done=p.impact=true;p.impactAt=s.age;s.target=target.id;s.aimPoints.push({x:p.x,y:p.y});
    if(!s.hit.has(target.id)){s.hit.add(target.id);g.breakArmor(target);g.damage(target,s.damage,100*s.strength);}
   }
  }
  if(!p.done&&(p.distance>s.range*1.45||s.age>s.duration-.55)){p.done=true;p.impactAt=s.age;}
 }
}
