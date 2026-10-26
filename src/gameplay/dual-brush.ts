import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {clipSegment,distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const DUAL_BRUSH_TIERS=[
 {name:'关闭',count:0,ratio:0,offset:24,wave:0,width:0,radius:0},
 {name:'分毫',count:1,ratio:.35,offset:24,wave:0,width:4,radius:4},
 {name:'并毫',count:2,ratio:.35,offset:26,wave:0,width:5,radius:4.5},
 {name:'灵毫初醒',count:2,ratio:.45,offset:28,wave:8,width:14,radius:8},
 {name:'双龙伴笔',count:2,ratio:.55,offset:68,wave:7,width:38,radius:22},
] as const;
export const DUAL_BRUSH_CONFIG={autoAttack:false,hitInterval:.35,range:96,dashDuration:.22,dashCooldown:.65,fade:.26,idleGrace:.10,spacing:5,maxPoints:80,bodyLength:170,turnLength:36};
export const PAPER_DRAGON_MOTION={length:316,samples:49,wave:17,frequency:4.8};
export const DUAL_SWIM={follow:5,speed:280,turn:2.4,headBob:8,cruiseForward:32,cruiseSide:9,cruiseFrequency:.9,yaw:.14,bend:.95};
type Mark=Point&{distance:number};
export type BrushLunge={targetId:number;target:Point;age:number;hit:Set<number>;previous:Point;lastAnchor:Point};
export type DualSide={index:number;path:Mark[];cooldowns:Map<number,number>;cooldownUntil:number;lunge:BrushLunge|null;head:Point;direction:Point};
type Pending={side:number;a:Point;b:Point;amount:number};
const finite=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y);
const lerp=(a:Point,b:Point,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

/** Stroke input steers companions; simulation time drives their swimming rhythm.
 * Secondary paths never feed input or upgrades. */
export class DualBrush{
 level=0;clock=0;drawing=false;tip:Point|null=null;distance=0;lastMotion=-Infinity;started=0;
 sides:DualSide[]=[];hits:{x:number;y:number;dx:number;dy:number;age:number}[]=[];
 private pending:Pending[]=[];private serial=0;private consumed=0;private mainDamage=30;
 private direction:Point={x:0,y:-1};private normal:Point|null=null;
 private swimCenter:Point|null=null;private swimDirection:Point={x:0,y:-1};private swimOffset=28;private releasedAt=-Infinity;
 get tier(){return DUAL_BRUSH_TIERS[this.level];}
 get moving(){return this.drawing&&(this.level>=3?this.tip!==null:this.clock-this.lastMotion<=DUAL_BRUSH_CONFIG.idleGrace);}
 get opacity(){const elapsed=this.level>=3?this.clock-this.releasedAt:this.clock-this.lastMotion-DUAL_BRUSH_CONFIG.idleGrace;return Math.max(0,Math.min(1,(this.clock-this.started+.02)/.08))*(this.moving?1:Math.max(0,1-elapsed/DUAL_BRUSH_CONFIG.fade));}
 reset(){this.clock=0;this.drawing=false;this.tip=null;this.sides=[];this.pending=[];this.hits=[];this.distance=0;this.lastMotion=-Infinity;this.normal=null;this.serial=this.consumed=0;this.swimCenter=null;this.swimDirection={x:0,y:-1};this.releasedAt=-Infinity;}
 begin(origin?:Point,mainDamage=30,mainWidth=16){this.drawing=true;this.started=this.clock;this.normal=null;this.distance=0;this.tip=null;this.swimCenter=null;this.releasedAt=-Infinity;for(const s of this.sides){s.path=[];s.lunge=null;}if(this.level>=3&&origin&&finite(origin)){this.mainDamage=mainDamage;this.tip={...origin};this.startSwim(origin,this.direction,mainWidth);}}
 end(cancel=false){if(this.drawing)this.releasedAt=this.clock;this.drawing=false;if(cancel)for(const s of this.sides)s.lunge=null;}
 private side(index:number){let s=this.sides[index];if(!s){s={index,path:[],cooldowns:new Map(),cooldownUntil:0,lunge:null,head:{x:0,y:0},direction:{x:0,y:-1}};this.sides[index]=s;}return s;}
 trace(a:Point,b:Point,mainDamage:number,mainWidth:number){
  if(!this.level||!this.drawing||!finite(a)||!finite(b))return;
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.01)return;
  const direction={x:(b.x-a.x)/length,y:(b.y-a.y)/length},normal={x:-direction.y,y:direction.x};
  const old=this.normal??normal,offset=Math.max(this.tier.offset,mainWidth*.65+12),count=Math.ceil(length/DUAL_BRUSH_CONFIG.spacing);
  const turn=Math.atan2(old.x*normal.y-old.y*normal.x,old.x*normal.x+old.y*normal.y)*(1-Math.exp(-length/DUAL_BRUSH_CONFIG.turnLength));
  this.mainDamage=mainDamage;this.tip={...b};this.direction=direction;this.lastMotion=this.clock;this.serial++;
  if(this.level>=3){if(!this.swimCenter)this.startSwim(b,direction,mainWidth);this.swimOffset=Math.max(this.tier.offset,mainWidth*.65+12);if(length>DUAL_BRUSH_CONFIG.range)for(const s of this.sides)s.lunge=null;}
  if(this.level>=3&&this.distance===0)for(const s of this.sides)s.path=[];
  for(let index=0;index<this.tier.count;index++){
   const s=this.side(index),sign=index===0?1:-1;
   // An interrupted/outside input begins a fresh contour rather than drawing a shortcut.
   const prior=s.path.at(-1);const expected={x:a.x+old.x*offset*sign,y:a.y+old.y*offset*sign};
   if(prior&&Math.hypot(prior.x-expected.x,prior.y-expected.y)>offset*2+18)s.path=[];
   let previous=s.path.at(-1);
   for(let i=0;i<=count;i++){
    const u=i/count,angle=turn*u,nxSafe=old.x*Math.cos(angle)-old.y*Math.sin(angle),nySafe=old.x*Math.sin(angle)+old.y*Math.cos(angle);
    const distance=this.distance+length*u,wave=this.tier.wave*Math.sin(distance/26+index*Math.PI*.8);
    const p={x:a.x+(b.x-a.x)*u+nxSafe*(offset*sign+wave),y:a.y+(b.y-a.y)*u+nySafe*(offset*sign+wave),distance};
    if(previous&&Math.hypot(previous.x-p.x,previous.y-p.y)>.01)this.pending.push({side:index,a:{x:previous.x,y:previous.y},b:p,amount:mainDamage*this.tier.ratio});
    s.path.push(p);previous=p;
   }
   const end=s.path.at(-1)!;s.head={x:end.x,y:end.y};s.direction={...direction};
   s.path=s.path.filter(p=>end.distance-p.distance<=DUAL_BRUSH_CONFIG.bodyLength).slice(-DUAL_BRUSH_CONFIG.maxPoints);
  }
  this.normal={x:old.x*Math.cos(turn)-old.y*Math.sin(turn),y:old.x*Math.sin(turn)+old.y*Math.cos(turn)};this.direction=direction;this.distance+=length;
 }
 private startSwim(origin:Point,direction:Point,width:number){
  this.swimCenter={...origin};this.swimDirection={...direction};this.swimOffset=Math.max(this.tier.offset,width*.65+12);
  for(let i=0;i<this.tier.count;i++){const s=this.side(i),p=this.swimAnchor(s);s.path=[{...p,distance:0}];s.head=p;s.direction={...direction};}
 }
 private swimAnchor(s:DualSide):Point{
  const c=this.swimCenter??this.tip??s.head,d=this.swimDirection,phase=this.clock*PAPER_DRAGON_MOTION.frequency+s.index*2.4;
  const cruise=this.clock*DUAL_SWIM.cruiseFrequency+s.index*2.4;
  const side=(s.index===0?1:-1)*this.swimOffset+Math.sin(phase)*DUAL_SWIM.headBob+Math.sin(cruise*2)*DUAL_SWIM.cruiseSide;
  const forward=Math.sin(cruise)*DUAL_SWIM.cruiseForward;
  return{x:c.x+d.x*forward-d.y*side,y:c.y+d.y*forward+d.x*side};
 }
 private advanceSwim(dt:number){
  if(this.level<3||!this.swimCenter||!this.tip||!this.drawing)return;
  const c=this.swimCenter,dx=this.tip.x-c.x,dy=this.tip.y-c.y,n=Math.hypot(dx,dy);
  if(n>1e-8){const move=Math.min(n*(1-Math.exp(-DUAL_SWIM.follow*dt)),DUAL_SWIM.speed*dt);c.x+=dx/n*move;c.y+=dy/n*move;}
  const d=this.swimDirection,want=this.direction,angle=Math.atan2(d.x*want.y-d.y*want.x,d.x*want.x+d.y*want.y),turn=Math.max(-DUAL_SWIM.turn*dt,Math.min(DUAL_SWIM.turn*dt,angle));
  this.swimDirection={x:d.x*Math.cos(turn)-d.y*Math.sin(turn),y:d.x*Math.sin(turn)+d.y*Math.cos(turn)};
  for(const s of this.sides){s.head=this.swimAnchor(s);s.direction={...this.swimDirection};}
 }
 private contact(s:DualSide,a:Point,b:Point,amount:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds:Arena,lunge?:BrushLunge){
  const segment=clipSegment({a,b},bounds);if(!segment)return;
  for(const e of [...enemies]){
   if(e.hp<=0||(s.cooldowns.get(e.id)??-Infinity)>this.clock||lunge?.hit.has(e.id))continue;
   if(distanceToSegment(e,segment)>this.tier.radius+brushBodyRadius(e))continue;
   if(lunge&&this.tip&&Math.hypot(e.x-this.tip.x,e.y-this.tip.y)>this.leash(bounds)+brushBodyRadius(e))continue;
   s.cooldowns.set(e.id,this.clock+DUAL_BRUSH_CONFIG.hitInterval);lunge?.hit.add(e.id);
   const d=Math.hypot(b.x-a.x,b.y-a.y)||1;this.hits.push({x:e.x,y:e.y,dx:(b.x-a.x)/d,dy:(b.y-a.y)/d,age:0});if(this.hits.length>12)this.hits.shift();damage(e,amount);
  }
 }
 private leash(bounds:Arena){return Math.min(DUAL_BRUSH_CONFIG.range,(bounds.right-bounds.left)*.15);}
 private anchor(s:DualSide){return this.level>=3&&this.swimCenter?this.swimAnchor(s):s.path.at(-1)??this.tip??s.head;}
 private dashHead(s:DualSide,bounds:Arena){
  const l=s.lunge!;let target=l.target;
  if(this.tip){const dx=target.x-this.tip.x,dy=target.y-this.tip.y,n=Math.hypot(dx,dy)||1,r=this.leash(bounds);if(n>r)target={x:this.tip.x+dx/n*r,y:this.tip.y+dy/n*r};}
  const u=Math.min(1,l.age/DUAL_BRUSH_CONFIG.dashDuration),amount=Math.sin(Math.PI*u),anchor=this.anchor(s);
  return lerp(anchor,target,amount);
 }
 geometry(s:DualSide,bounds:Arena):Point[]{
  if(this.level>=3&&this.swimCenter&&s.path.length){
   // Body phase and material length depend on simulation time alone. Input
   // steers a gently following center; it never drags samples through the body.
   const head=s.lunge?this.dashHead(s,bounds):this.swimAnchor(s),d=this.swimDirection,length=this.level===4?PAPER_DRAGON_MOTION.length:DUAL_BRUSH_CONFIG.bodyLength;
   const phase=this.clock*PAPER_DRAGON_MOTION.frequency+s.index*2.4;
   // Integrate equal-length spine links from the head toward the tail. Large
   // traveling turns bend the whole body into C/S shapes without stretching it.
   // The head quarter remains rigid, preserving the approved face and horns.
   const angle=Math.atan2(d.y,d.x)+Math.sin(phase)*DUAL_SWIM.yaw,step=length/(PAPER_DRAGON_MOTION.samples-1),path:Point[]=[head];
   let p={...head};
   for(let i=1;i<PAPER_DRAGON_MOTION.samples;i++){
    const tail=(i-.5)/(PAPER_DRAGON_MOTION.samples-1),t=Math.max(0,Math.min(1,(tail-.30)/.30)),gain=t*t*(3-2*t),bend=Math.sin(tail*7-phase)*DUAL_SWIM.bend*gain;
    p={x:p.x-Math.cos(angle+bend)*step,y:p.y-Math.sin(angle+bend)*step};path.push(p);
   }
   return path.reverse();
  }
  let path=s.path.map(p=>({x:p.x,y:p.y}));if(!path.length)return path;
  if(s.lunge){
   const anchor=path.at(-1)!,head=this.dashHead(s,bounds),n=Math.hypot(head.x-anchor.x,head.y-anchor.y),control={x:anchor.x+s.direction.x*n*.35,y:anchor.y+s.direction.y*n*.35};
   for(let i=1;i<=12;i++){const u=i/12;path.push({x:(1-u)**2*anchor.x+2*(1-u)*u*control.x+u*u*head.x,y:(1-u)**2*anchor.y+2*(1-u)*u*control.y+u*u*head.y});}
  }
  if(!this.moving&&!s.lunge&&this.tip){const t=Math.min(1,Math.max(0,(this.clock-this.lastMotion-DUAL_BRUSH_CONFIG.idleGrace)/DUAL_BRUSH_CONFIG.fade));return path.map(p=>lerp(p,this.tip!,t*t*.9));}
  return path;
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds:Arena){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.clock+=dt;
  this.advanceSwim(dt);
  for(const h of this.hits)h.age+=dt;this.hits=this.hits.filter(h=>h.age<.16);
  if(!this.level){this.pending=[];return;}
  for(const p of this.pending)this.contact(this.side(p.side),p.a,p.b,p.amount,enemies,damage,bounds);this.pending=[];
  for(const s of this.sides){
   for(const [id,until] of s.cooldowns)if(until<=this.clock)s.cooldowns.delete(id);
   if(!DUAL_BRUSH_CONFIG.autoAttack)s.lunge=null;
   if(s.lunge){
    const l=s.lunge,anchor=this.anchor(s);
    if(Math.hypot(anchor.x-l.lastAnchor.x,anchor.y-l.lastAnchor.y)>this.leash(bounds)){s.lunge=null;continue;}
    l.lastAnchor={...anchor};const from=l.age;l.age=Math.min(DUAL_BRUSH_CONFIG.dashDuration,l.age+dt);
    // Substep a whole out-and-back lunge so low frame rates cannot skip the attack tip.
    const to=l.age,steps=Math.max(1,Math.ceil((to-from)/.012));
    for(let i=1;i<=steps;i++){l.age=from+(to-from)*i/steps;const head=this.dashHead(s,bounds);this.contact(s,l.previous,head,this.mainDamage*this.tier.ratio,enemies,damage,bounds,l);l.previous=head;}
    l.age=to;
    const curve=this.geometry(s,bounds);for(let i=1;i<curve.length;i++)this.contact(s,curve[i-1],curve[i],this.mainDamage*this.tier.ratio,enemies,damage,bounds,l);
    if(to>=DUAL_BRUSH_CONFIG.dashDuration)s.lunge=null;
   }
  }
  const fresh=this.serial!==this.consumed;this.consumed=this.serial;
  if(this.level===4&&fresh&&this.moving)for(const s of this.sides){const curve=this.geometry(s,bounds);for(let i=1;i<curve.length;i++)this.contact(s,curve[i-1],curve[i],this.mainDamage*this.tier.ratio,enemies,damage,bounds,s.lunge??undefined);}
  if(DUAL_BRUSH_CONFIG.autoAttack&&this.level===4&&fresh&&this.moving&&this.tip){
   const claimed=new Set(this.sides.flatMap(s=>s.lunge?[s.lunge.targetId]:[]));
   for(const s of this.sides){
    if(s.lunge||s.cooldownUntil>this.clock)continue;
    const candidates=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-this.tip!.x,e.y-this.tip!.y)<=this.leash(bounds)&&(e.kind==='boss'||!claimed.has(e.id))).sort((a,b)=>Math.hypot(a.x-s.head.x,a.y-s.head.y)-Math.hypot(b.x-s.head.x,b.y-s.head.y));
    const target=candidates[0];if(!target)continue;claimed.add(target.id);const anchor=this.anchor(s);
    s.lunge={targetId:target.id,target:{x:target.x,y:target.y},age:0,hit:new Set(),previous:{...anchor},lastAnchor:{...anchor}};s.cooldownUntil=this.clock+DUAL_BRUSH_CONFIG.dashCooldown;
   }
  }
  if(this.opacity<=0&&!this.sides.some(s=>s.lunge)){for(const s of this.sides)s.path=[];}
 }
}
