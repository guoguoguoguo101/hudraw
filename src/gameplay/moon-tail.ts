import {WORLD,type Skill,type Enemy} from '../core/types';
import type {Game} from './game';
import type {Point} from '../input/recognizer';

export const MOON_TAIL_STAGES=[
 {name:'揽月',damage:45,width:150,range:400,speed:650,thickness:22,push:90,release:.12},
 {name:'狐尾扫月',damage:58.5,width:172.5,range:420,speed:650,thickness:24,push:135,release:.14},
 {name:'双尾揽月',damage:69.75,width:187.5,range:440,speed:650,thickness:26,push:150,release:.12},
 {name:'九尾揽山河',damage:90,width:210,range:460,speed:650,thickness:28,push:180,release:.32}
] as const;
export type MoonContact={id:number;at:number;anchor:Point;position:Point;done:boolean};
export type MoonTailState={level:number;width:number;travel:number;contacts:MoonContact[];end:number};
export function configureMoonTail(s:Skill,level=1){
 const previous=MOON_TAIL_STAGES[(s.moonTail?.level??1)-1];
 level=Math.max(1,Math.min(4,Math.floor(level)));const c=MOON_TAIL_STAGES[level-1];
 s.damage=s.damage/previous.damage*c.damage;s.range=c.range;
 s.duration=c.release+c.range/c.speed+(level>=3?.65:.2);
 s.moonTail={level,width:c.width,travel:0,contacts:[],end:c.release+c.range/c.speed};
}
/** Convex crescent face; shared by the collision sweep and renderer. */
export function moonFront(side:number,width:number){return 32*(1-(side/(width/2))**2);}
const radius=(e:Enemy)=>e.kind==='boss'?55:e.kind==='oni'?34:23;
export function updateMoonTail(g:Game,s:Skill,dt:number){
 const m=s.moonTail!,c=MOON_TAIL_STAGES[m.level-1];
 if(s.age+1e-8>=c.release){
  const previous=m.travel;
  m.travel=Math.min(c.range,Math.max(0,(s.age-c.release)*c.speed));
  if(!s.released){s.released=true;g.primaryAction({kind:'ray',castId:s.id,origin:{x:s.x,y:s.y},direction:{...s.direction},damage:s.damage,range:s.range,width:m.width,pierce:Number.MAX_SAFE_INTEGER});}
  if(s.age-dt<=m.end)for(const e of [...g.enemies]){
   if(e.hp<=0||s.hit.has(e.id))continue;
   const dx=e.x-s.x,dy=e.y-s.y,along=dx*s.direction.x+dy*s.direction.y,side=-dx*s.direction.y+dy*s.direction.x,r=radius(e);
   const clamped=Math.max(-m.width/2,Math.min(m.width/2,side)),front=moonFront(clamped,m.width);
   if(Math.abs(side)>m.width/2+r||along<previous+front-c.thickness/2-r-(previous===0?24:0)||along>m.travel+front+c.thickness/2+r)continue;
   s.hit.add(e.id);g.damage(e,s.damage,0);
   if(e.hp<=0)continue;
   if(e.kind!=='boss'){const resistance=e.kind==='oni'?.7:1;e.vx=s.direction.x*c.push*s.strength*resistance;e.vy=s.direction.y*c.push*s.strength*resistance;}
   m.contacts.push({id:e.id,at:s.age,anchor:{x:s.x+s.direction.x*along,y:s.y+s.direction.y*along},position:{x:e.x,y:e.y},done:m.level<3});
  }
 }
 for(const hit of m.contacts){
  if(hit.done)continue;const e=g.enemies.find(e=>e.id===hit.id&&e.hp>0);
  if(!e){hit.done=true;continue;}
  const age=s.age-hit.at,hold=m.level===4?.24:.2;
  if(age<.18)continue;
  if(e.kind!=='boss'){
   const resistance=e.kind==='oni'?.5:1,portion=Math.max(0,Math.min(s.age,hit.at+.18+hold)-Math.max(s.age-dt,hit.at+.18));
   const factor=1-Math.exp(-10*resistance*s.strength*portion);
   e.x=Math.max(radius(e),Math.min(WORLD.width-radius(e),e.x+(hit.anchor.x-e.x)*factor));
   e.y=Math.max(250,Math.min(1120,e.y+(hit.anchor.y-e.y)*factor));e.vx=e.vy=0;
  }
  hit.position={x:e.x,y:e.y};
  if(age+1e-8>=.18+hold){hit.done=true;if(m.level===4)g.damage(e,s.damage*.35,0);}
 }
}
