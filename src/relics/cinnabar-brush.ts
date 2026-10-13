import type {Point} from '../input/recognizer';
import type {PrimaryAction,RelicCombatPort,RelicTarget} from './contracts';

export const BRUSH_STAGES=[
 {ratio:.25,name:'添朱',delay:.12},
 {ratio:.35,name:'重描',delay:.12},
 {ratio:.45,name:'灵笔生花',delay:.12}
] as const;
export type BrushStroke={id:number;castId:number;level:number;ratio:number;action:PrimaryAction;start:number;age:number;position:Point;angle:number;targetId:number|null;travel:number;trail:Point[];contacts:Point[];resolved:boolean;impactAge:number|null};
/** Independent queue/projectiles. No Skill/Game imports and no primary-skill mutations. */
export class CinnabarBrush {
 strokes:BrushStroke[]=[];
 private casts=new Map<number,{level:number;used:boolean}>();
 private serial=0;private previousTime=0;
 beginCast(id:number,level:number){this.casts.set(id,{level:Math.max(0,Math.min(3,Math.floor(level))),used:false});if(this.casts.size>64)this.casts.delete(this.casts.keys().next().value!);}
 onPrimary(action:PrimaryAction,time:number){
  const cast=this.casts.get(action.castId);if(!cast?.level||cast.used)return;cast.used=true;
  // Copy all geometry: later movement, skill disposal and editor changes cannot alter this stroke.
  const snapshot:PrimaryAction=JSON.parse(JSON.stringify(action));
  if(snapshot.kind==='chain')snapshot.hits=snapshot.hits.slice(0,3);
  const stage=BRUSH_STAGES[cast.level-1];
  this.strokes.push({id:++this.serial,castId:action.castId,level:cast.level,ratio:stage.ratio,action:snapshot,start:time+stage.delay,age:-stage.delay,position:{...snapshot.origin},angle:Math.atan2(snapshot.direction.y,snapshot.direction.x),targetId:snapshot.kind==='projectile'?snapshot.targetId:null,travel:0,trail:[],contacts:[],resolved:false,impactAge:null});
  if(this.strokes.length>24)this.strokes.shift();
 }
 update(time:number,port:RelicCombatPort){
  const previous=this.previousTime;this.previousTime=time;
  for(const s of this.strokes){s.age=time-s.start;if(s.age< -1e-8)continue;
   const a=s.action,dt=Math.max(0,time-Math.max(previous,s.start));
   if(a.kind==='projectile'&&!s.resolved){
    let target=port.targets().find(e=>e.id===s.targetId&&e.hp>0);
    if(!target){target=port.targets().filter(e=>e.hp>0&&this.inSector(e,a)).sort((x,y)=>Math.hypot(x.x-s.position.x,x.y-s.position.y)-Math.hypot(y.x-s.position.x,y.y-s.position.y)||x.id-y.id)[0];s.targetId=target?.id??null;}
    if(target){const wanted=Math.atan2(target.y-s.position.y,target.x-s.position.x),difference=Math.atan2(Math.sin(wanted-s.angle),Math.cos(wanted-s.angle));s.angle+=Math.max(-10*dt,Math.min(10*dt,difference));}
    const old={...s.position},step=a.speed*dt;s.position.x+=Math.cos(s.angle)*step;s.position.y+=Math.sin(s.angle)*step;s.travel+=step;s.trail.push({...s.position});if(s.trail.length>24)s.trail.shift();
    if(target){const dx=s.position.x-old.x,dy=s.position.y-old.y,u=Math.max(0,Math.min(1,((target.x-old.x)*dx+(target.y-old.y)*dy)/(step*step||1))),radius=target.kind==='boss'?40:target.kind==='oni'?26:18;
     if(Math.hypot(old.x+dx*u-target.x,old.y+dy*u-target.y)<=radius){s.position={x:target.x,y:target.y};this.hit(s,target,a.damage*s.ratio,port);s.resolved=true;s.impactAge=s.age;}}
    if(s.travel>a.range*1.45||s.age>2.5){s.resolved=true;s.impactAge=s.age;}
   }else if(!s.resolved){
    s.resolved=true;s.impactAge=s.age;
    if(a.kind==='ray'){
     const targets=port.targets().filter(e=>{const dx=e.x-a.origin.x,dy=e.y-a.origin.y,t=dx*a.direction.x+dy*a.direction.y,r=e.kind==='boss'?55:e.kind==='oni'?34:23;return e.hp>0&&t>=-r&&t<=a.range+r&&Math.abs(dx*a.direction.y-dy*a.direction.x)<=a.width/2+r;}).sort((x,y)=>(x.x-y.x)*a.direction.x+(x.y-y.y)*a.direction.y||x.id-y.id).slice(0,a.pierce);
     for(const e of targets)this.hit(s,e,a.damage*s.ratio,port);
    }else if(a.kind==='area'){for(const e of [...port.targets()])if(e.hp>0&&Math.hypot(e.x-a.origin.x,e.y-a.origin.y)<a.radius)this.hit(s,e,a.damage*s.ratio,port);}
    else if(a.kind==='chain'){for(const hit of a.hits){const e=port.targets().find(e=>e.id===hit.id&&e.hp>0);if(e)this.hit(s,e,hit.damage*s.ratio,port);}}
   }
  }
  this.strokes=this.strokes.filter(s=>s.age<0||!s.resolved||s.age-(s.impactAge??0)<.48);
 }
 private inSector(e:RelicTarget,a:Extract<PrimaryAction,{kind:'projectile'}>){const dx=e.x-a.origin.x,dy=e.y-a.origin.y,d=Math.hypot(dx,dy);return d<a.range&&(dx*a.direction.x+dy*a.direction.y)/Math.max(1,d)>.35;}
 private hit(s:BrushStroke,e:RelicTarget,damage:number,port:RelicCombatPort){s.contacts.push({x:e.x,y:e.y});port.damage(e.id,damage);}
 clear(){this.strokes=[];this.casts.clear();this.previousTime=0;}
}
