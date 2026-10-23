import {WORLD,type Skill} from '../core/types';
import type {Game} from './game';
import type {Point} from '../input/recognizer';
import {capTriangle,insideTriangle,type TriangleGeometry} from '../input/triangle-geometry';
import {segmentDistance} from '../input/advanced-geometry';
import {SANCAI,SANCAI_STAGES,sancaiArrayTimeline} from './sancai-config';
export type SancaiChild={index:number;x:number;y:number;angle:number;distance:number;hit:Set<number>;done:boolean;impact?:Point};
export type SancaiState={level:number;form:'small'|'large';triangle:TriangleGeometry;destination:Point;origin:Point;position:Point;angle:number;arrival:number;splitAt:number;phase:'gather'|'flight'|'spin'|'split'|'strike'|'sustain'|'cut'|'finish'|'fade';children:SancaiChild[];targetId:number|null;strikePoint:Point;strikeLocked:boolean};
export function configureSancai(s:Skill,level=1){
 const shape=s.geometry.triangle;if(!shape)throw new Error('三才符缺少闭合三角结构');
 const lv=Math.max(1,Math.min(4,Math.floor(level))),cfg=SANCAI_STAGES[lv-1],triangle=capTriangle(shape),origin={x:WORLD.foxX,y:WORLD.foxY},destination={...shape.center};
 const arrival=SANCAI.launch+Math.hypot(destination.x-origin.x,destination.y-origin.y)/cfg.speed;
 s.testLevel=lv;s.damage=0;s.mirror=false;s.seal=false;s.shock=false;
 s.sancai={level:lv,form:shape.form,triangle,destination,origin,position:{...origin},angle:Math.atan2(s.direction.y,s.direction.x),arrival,splitAt:arrival+cfg.spinDuration,phase:'gather',children:[],targetId:null,strikePoint:{...triangle.center},strikeLocked:false};
 s.duration=shape.form==='small'?arrival+cfg.spinDuration+cfg.childRange/cfg.childSpeed+SANCAI.fade:cfg.arrayDuration;
}
/** Presentation prototype: collision changes blade lifecycle, never enemy state or HP. */
export function updateSancai(g:Game,s:Skill,dt:number){
 const t=s.sancai!,cfg=SANCAI_STAGES[t.level-1],previous=s.age-dt;s.released=s.age>=SANCAI.launch;
 if(t.form==='large'){
  if(!t.strikeLocked){
   if(t.targetId===null){const target=g.enemies.filter(e=>e.hp>0&&insideTriangle(e,t.triangle)).sort((a,b)=>Math.hypot(a.x-t.triangle.center.x,a.y-t.triangle.center.y)-Math.hypot(b.x-t.triangle.center.x,b.y-t.triangle.center.y)||a.id-b.id)[0];t.targetId=target?.id??-1;}
   const target=g.enemies.find(e=>e.id===t.targetId&&e.hp>0&&insideTriangle(e,t.triangle));t.strikePoint=target?{x:target.x,y:target.y}:{...t.triangle.center};
   if(s.age>=cfg.gather)t.strikeLocked=true;
  }
  const timeline=sancaiArrayTimeline(t.level);
  t.phase=s.age<cfg.gather?'gather':s.age<timeline.strikeEnd?'strike':s.age<timeline.sustainEnd?'sustain':cfg.cut&&s.age<timeline.cutEnd?'cut':cfg.finish&&s.age<timeline.finishEnd?'finish':'fade';return;
 }
 const flight=Math.max(0,Math.min(1,(s.age-SANCAI.launch)/(t.arrival-SANCAI.launch||1)));
 t.position={x:t.origin.x+(t.destination.x-t.origin.x)*flight,y:t.origin.y+(t.destination.y-t.origin.y)*flight};
 if(s.age<SANCAI.launch){t.phase='gather';return;}if(s.age<t.arrival){t.phase='flight';return;}
 if(s.age<t.splitAt){t.phase='spin';return;}
 t.phase='split';
 if(!t.children.length)for(let i=0;i<3;i++)t.children.push({index:i,x:t.destination.x,y:t.destination.y,angle:t.angle+(i-1)*SANCAI.spread,distance:0,hit:new Set(),done:false});
 const activeDt=Math.max(0,s.age-Math.max(previous,t.splitAt));
 for(const p of t.children){
  if(p.done)continue;const from={x:p.x,y:p.y},step=Math.min(cfg.childSpeed*activeDt,cfg.childRange-p.distance),to={x:p.x+Math.cos(p.angle)*step,y:p.y+Math.sin(p.angle)*step};
  const contacts=g.enemies.filter(e=>e.hp>0&&!p.hit.has(e.id)&&segmentDistance(e,from,to)<=(e.kind==='boss'?40:e.kind==='oni'?26:18)+cfg.size*.2).sort((a,b)=>((a.x-from.x)*Math.cos(p.angle)+(a.y-from.y)*Math.sin(p.angle))-((b.x-from.x)*Math.cos(p.angle)+(b.y-from.y)*Math.sin(p.angle)));
  for(const e of contacts){p.hit.add(e.id);p.impact={x:e.x,y:e.y};if(p.hit.size>cfg.pierce){p.done=true;const along=Math.max(0,Math.min(step,(e.x-from.x)*Math.cos(p.angle)+(e.y-from.y)*Math.sin(p.angle)));to.x=from.x+Math.cos(p.angle)*along;to.y=from.y+Math.sin(p.angle)*along;break;}}
  p.x=to.x;p.y=to.y;p.distance+=step;if(p.distance>=cfg.childRange-1e-6)p.done=true;
 }
 if(t.children.every(p=>p.done))t.phase='fade';
}
