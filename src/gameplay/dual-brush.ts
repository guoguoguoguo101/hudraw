import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {clipSegment,distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const DUAL_BRUSH_TIERS=[
 {name:'关闭',count:0,ratio:0,offset:24,wave:0,width:0,radius:0},
 {name:'分毫',count:1,ratio:.35,offset:24,wave:0,width:4,radius:4},
 {name:'并毫',count:2,ratio:.35,offset:26,wave:0,width:5,radius:4.5},
 {name:'灵毫初醒',count:2,ratio:.45,offset:28,wave:8,width:8,radius:6},
 {name:'双龙伴笔',count:2,ratio:.55,offset:46,wave:7,width:22,radius:12},
] as const;
export const DUAL_BRUSH_CONFIG={hitInterval:.35,range:96,dashDuration:.22,dashCooldown:.65,fade:.26,idleGrace:.10,spacing:5,maxPoints:80,bodyLength:170,turnLength:36};
export const PAPER_DRAGON_MOTION={length:196,samples:49,wave:13,frequency:2.8};
type Mark=Point&{distance:number};
export type BrushLunge={targetId:number;target:Point;age:number;hit:Set<number>;previous:Point;lastAnchor:Point};
export type DualSide={index:number;path:Mark[];cooldowns:Map<number,number>;cooldownUntil:number;lunge:BrushLunge|null;head:Point;direction:Point};
type Pending={side:number;a:Point;b:Point;amount:number};
const finite=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y);
const lerp=(a:Point,b:Point,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

/** Only accepted main-brush segments enter this model. Secondary paths never feed input or upgrades. */
export class DualBrush{
 level=0;clock=0;drawing=false;tip:Point|null=null;distance=0;lastMotion=-Infinity;started=0;
 sides:DualSide[]=[];hits:{x:number;y:number;dx:number;dy:number;age:number}[]=[];
 private pending:Pending[]=[];private serial=0;private consumed=0;private mainDamage=30;
 private direction:Point={x:0,y:-1};private normal:Point|null=null;
 get tier(){return DUAL_BRUSH_TIERS[this.level];}
 get moving(){return this.drawing&&this.clock-this.lastMotion<=DUAL_BRUSH_CONFIG.idleGrace;}
 get opacity(){const elapsed=this.clock-this.lastMotion;return Math.max(0,Math.min(1,(this.clock-this.started+.02)/.08))*(this.moving?1:Math.max(0,1-(elapsed-DUAL_BRUSH_CONFIG.idleGrace)/DUAL_BRUSH_CONFIG.fade));}
 reset(){this.clock=0;this.drawing=false;this.tip=null;this.sides=[];this.pending=[];this.hits=[];this.distance=0;this.lastMotion=-Infinity;this.normal=null;this.serial=this.consumed=0;}
 begin(){this.drawing=true;this.started=this.clock;this.normal=null;this.distance=0;this.tip=null;for(const s of this.sides){s.path=[];s.lunge=null;}}
 end(cancel=false){this.drawing=false;if(cancel)for(const s of this.sides)s.lunge=null;}
 private side(index:number){let s=this.sides[index];if(!s){s={index,path:[],cooldowns:new Map(),cooldownUntil:0,lunge:null,head:{x:0,y:0},direction:{x:0,y:-1}};this.sides[index]=s;}return s;}
 trace(a:Point,b:Point,mainDamage:number,mainWidth:number){
  if(!this.level||!this.drawing||!finite(a)||!finite(b))return;
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.01)return;
  const direction={x:(b.x-a.x)/length,y:(b.y-a.y)/length},normal={x:-direction.y,y:direction.x};
  const old=this.normal??normal,offset=Math.max(this.tier.offset,mainWidth*.65+12),count=Math.ceil(length/DUAL_BRUSH_CONFIG.spacing);
  const turn=Math.atan2(old.x*normal.y-old.y*normal.x,old.x*normal.x+old.y*normal.y)*(1-Math.exp(-length/DUAL_BRUSH_CONFIG.turnLength));
  this.mainDamage=mainDamage;this.tip={...b};this.direction=direction;this.lastMotion=this.clock;this.serial++;
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
 private anchor(s:DualSide){return s.path.at(-1)??this.tip??s.head;}
 private dashHead(s:DualSide,bounds:Arena){
  const l=s.lunge!;let target=l.target;
  if(this.tip){const dx=target.x-this.tip.x,dy=target.y-this.tip.y,n=Math.hypot(dx,dy)||1,r=this.leash(bounds);if(n>r)target={x:this.tip.x+dx/n*r,y:this.tip.y+dy/n*r};}
  const u=Math.min(1,l.age/DUAL_BRUSH_CONFIG.dashDuration),amount=Math.sin(Math.PI*u),anchor=this.anchor(s);
  return lerp(anchor,target,amount);
 }
 geometry(s:DualSide,bounds:Arena):Point[]{
  let path=s.path.map(p=>({x:p.x,y:p.y}));if(!path.length)return path;
  if(s.lunge){
   const anchor=path.at(-1)!,head=this.dashHead(s,bounds),n=Math.hypot(head.x-anchor.x,head.y-anchor.y),control={x:anchor.x+s.direction.x*n*.35,y:anchor.y+s.direction.y*n*.35};
   for(let i=1;i<=12;i++){const u=i/12;path.push({x:(1-u)**2*anchor.x+2*(1-u)*u*control.x+u*u*head.x,y:(1-u)**2*anchor.y+2*(1-u)*u*control.y+u*u*head.y});}
  }
  if(this.level===4){
   // Complete summoned anatomy exists even after a short stroke. It keeps its
   // material length as it swims around turns and follows a lunging head.
   const clean=path.filter((p,i)=>!i||Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y)>.05);
   const distances=[0];for(let i=1;i<clean.length;i++)distances.push(distances[i-1]+Math.hypot(clean[i].x-clean[i-1].x,clean[i].y-clean[i-1].y));
   const total=distances.at(-1)!;
   const point=(d:number)=>{
    if(d<0){const a=clean[0],b=clean[1]??{x:a.x+s.direction.x,y:a.y+s.direction.y},n=Math.hypot(b.x-a.x,b.y-a.y)||1;return{x:a.x+(b.x-a.x)/n*d,y:a.y+(b.y-a.y)/n*d};}
    let i=1;while(i<distances.length-1&&distances[i]<d)i++;const a=clean[i-1]??clean[0],b=clean[i]??a,u=(d-(distances[i-1]??0))/Math.max(.001,(distances[i]??0)-(distances[i-1]??0));return lerp(a,b,Math.max(0,Math.min(1,u)));
   };
   path=Array.from({length:PAPER_DRAGON_MOTION.samples},(_,i)=>{
    const u=i/(PAPER_DRAGON_MOTION.samples-1),d=total-PAPER_DRAGON_MOTION.length*(1-u),p=point(d),a=point(d-3),b=point(d+3),n=Math.hypot(b.x-a.x,b.y-a.y)||1;
    const wave=Math.sin(u*7-this.clock*PAPER_DRAGON_MOTION.frequency+s.index*2.4)*PAPER_DRAGON_MOTION.wave*Math.sin(u*Math.PI)*(1-u*.5);
    return{x:p.x-(b.y-a.y)/n*wave,y:p.y+(b.x-a.x)/n*wave};
   });
   const head=path.at(-1)!,neck=path.at(-4)!,headN=Math.hypot(head.x-neck.x,head.y-neck.y)||1;
   path=path.map((p,i)=>{const u=i/(path.length-1),t=Math.max(0,Math.min(1,(u-.62)/.17)),blend=t*t*(3-2*t);return lerp(p,{x:head.x+(head.x-neck.x)/headN*(u-1)*PAPER_DRAGON_MOTION.length,y:head.y+(head.y-neck.y)/headN*(u-1)*PAPER_DRAGON_MOTION.length},blend);});
  }
  if(!this.moving&&!s.lunge&&this.tip){const t=Math.min(1,Math.max(0,(this.clock-this.lastMotion-DUAL_BRUSH_CONFIG.idleGrace)/DUAL_BRUSH_CONFIG.fade));return path.map(p=>lerp(p,this.tip!,t*t*.9));}
  return path;
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds:Arena){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.clock+=dt;
  for(const h of this.hits)h.age+=dt;this.hits=this.hits.filter(h=>h.age<.16);
  if(!this.level){this.pending=[];return;}
  for(const p of this.pending)this.contact(this.side(p.side),p.a,p.b,p.amount,enemies,damage,bounds);this.pending=[];
  for(const s of this.sides){
   for(const [id,until] of s.cooldowns)if(until<=this.clock)s.cooldowns.delete(id);
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
  if(this.level===4&&fresh&&this.moving&&this.tip){
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
