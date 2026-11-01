import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {clipSegment,distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {brushBodyRadius} from './brush-contact';

export const DUAL_BRUSH_TIERS=[
 {name:'关闭',count:0,ratio:0,offset:24,wave:0,width:0,radius:0},
 {name:'分毫',count:1,ratio:.35,offset:24,wave:0,width:4,radius:4},
 {name:'并毫',count:2,ratio:.35,offset:26,wave:0,width:5,radius:4.5},
 {name:'灵毫初醒',count:2,ratio:.45,offset:28,wave:8,width:14,radius:8},
 {name:'双龙巡天',count:2,ratio:.55,offset:68,wave:7,width:47.5,radius:27.5},
] as const;
export const DUAL_BRUSH_CONFIG={autoAttack:false,hitInterval:.35,range:96,dashDuration:.22,dashCooldown:.65,fade:.26,idleGrace:.10,spacing:5,maxPoints:80,bodyLength:170,turnLength:36};
export const PAPER_DRAGON_MOTION={length:395,samples:49,wave:17,frequency:4.8};
export const DUAL_ROAM={speed:208,turn:3.9,targetRadius:42,reacquire:1.05,margin:140};
export const DUAL_SWIM={follow:5,speed:280,turn:2.4,headBob:8,cruiseForward:32,cruiseSide:9,cruiseFrequency:.9,yaw:.14,bend:.95};
type Mark=Point&{distance:number};
export type BrushLunge={targetId:number;target:Point;age:number;hit:Set<number>;previous:Point;lastAnchor:Point};
type Roam={targetId:number|null;waypoint:number;nextTarget:number;speed:number;yaw:number;flight:'glide'|'swoop'|'coil'|'cross';spine:Point[];visited:Map<number,number>};
export type DualSide={roam?:Roam;index:number;path:Mark[];cooldowns:Map<number,number>;cooldownUntil:number;lunge:BrushLunge|null;head:Point;direction:Point};
type Pending={side:number;a:Point;b:Point;amount:number};
const finite=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y);
const lerp=(a:Point,b:Point,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

/** Lower tiers follow the brush; Lv4 roams independently through the arena.
 * Secondary paths never feed input or upgrades. */
export class DualBrush{
 level=0;clock=0;drawing=false;tip:Point|null=null;distance=0;lastMotion=-Infinity;started=0;
 sides:DualSide[]=[];hits:{x:number;y:number;dx:number;dy:number;age:number}[]=[];
 private pending:Pending[]=[];private serial=0;private consumed=0;private mainDamage=30;
 private roamAccumulator=0;private roamTime=0;
 private roamCandidates:Enemy[]=[];
 private bounds:Arena={left:26,right:694,top:280,bottom:962};
 private direction:Point={x:0,y:-1};private normal:Point|null=null;
 private swimCenter:Point|null=null;private swimDirection:Point={x:0,y:-1};private swimOffset=28;private releasedAt=-Infinity;
 get tier(){return DUAL_BRUSH_TIERS[this.level];}
 get moving(){return this.drawing&&(this.level>=3?this.tip!==null:this.clock-this.lastMotion<=DUAL_BRUSH_CONFIG.idleGrace);}
 get opacity(){const elapsed=this.level>=3?this.clock-this.releasedAt:this.clock-this.lastMotion-DUAL_BRUSH_CONFIG.idleGrace;return Math.max(0,Math.min(1,(this.clock-this.started+.02)/.08))*(this.moving?1:Math.max(0,1-elapsed/DUAL_BRUSH_CONFIG.fade));}
 reset(){this.roamAccumulator=this.roamTime=0;this.clock=0;this.drawing=false;this.tip=null;this.sides=[];this.pending=[];this.hits=[];this.distance=0;this.lastMotion=-Infinity;this.normal=null;this.serial=this.consumed=0;this.swimCenter=null;this.swimDirection={x:0,y:-1};this.releasedAt=-Infinity;}
 begin(origin?:Point,mainDamage=30,mainWidth=16){const resume=this.level===4&&this.sides.length===2&&this.sides.every(s=>s.path.length>0)&&this.clock-this.releasedAt<DUAL_BRUSH_CONFIG.fade;this.drawing=true;this.started=this.clock;this.normal=null;this.distance=0;this.tip=null;this.swimCenter=null;this.releasedAt=-Infinity;if(this.level===4){this.mainDamage=mainDamage;this.tip=origin&&finite(origin)?{...origin}:{x:360,y:620};this.pending=[];if(!resume)this.startRoam();return;}for(const s of this.sides){s.path=[];s.lunge=null;}if(this.level>=3&&origin&&finite(origin)){this.mainDamage=mainDamage;this.tip={...origin};this.startSwim(origin,this.direction,mainWidth);}}
 end(cancel=false){if(this.drawing)this.releasedAt=this.clock;this.drawing=false;if(cancel)for(const s of this.sides)s.lunge=null;}
 private side(index:number){let s=this.sides[index];if(!s){s={index,path:[],cooldowns:new Map(),cooldownUntil:0,lunge:null,head:{x:0,y:0},direction:{x:0,y:-1}};this.sides[index]=s;}return s;}
 trace(a:Point,b:Point,mainDamage:number,mainWidth:number){
  if(!this.level||!this.drawing||!finite(a)||!finite(b))return;
  if(this.level===4){this.mainDamage=mainDamage;this.tip={...b};this.lastMotion=this.clock;return;}
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
 private startRoam(){
  const b=this.bounds,w=b.right-b.left,h=b.bottom-b.top;
  for(let i=0;i<2;i++){
   const side=this.side(i);side.head={x:b.left+w*(i===0?.64:.36),y:b.top+h*(i===0?.36:.64)};
   side.direction=i===0?{x:1,y:.15}:{x:-1,y:-.15};const n=Math.hypot(side.direction.x,side.direction.y);side.direction.x/=n;side.direction.y/=n;
   const spine:Point[]=[{...side.head}],angle=Math.atan2(side.direction.y,side.direction.x),step=PAPER_DRAGON_MOTION.length/(PAPER_DRAGON_MOTION.samples-1);
   for(let k=1;k<PAPER_DRAGON_MOTION.samples;k++){const u=k/(PAPER_DRAGON_MOTION.samples-1),bend=Math.sin(u*7+i*2.4)*.65*Math.max(0,(u-.3)/.7),p=spine[k-1];spine.push({x:p.x-Math.cos(angle+bend)*step,y:p.y-Math.sin(angle+bend)*step});}
   side.roam={targetId:null,waypoint:i===0?1:4,nextTarget:this.clock+.2+i*.38,speed:160,yaw:0,flight:'glide',spine,visited:new Map()};side.path=[{...side.head,distance:0}];side.lunge=null;
  }
 }
 private roamPoint(side:DualSide,b:Arena):Point{
  const route=[[.2,.22],[.78,.27],[.72,.77],[.25,.7],[.52,.43],[.82,.55],[.3,.82],[.18,.4]],p=route[side.roam!.waypoint%route.length];
  return{x:b.left+(b.right-b.left)*p[0],y:b.top+(b.bottom-b.top)*p[1]};
 }
 private advanceRoam(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,b:Arena){
  for(const side of this.sides)for(const [id,until] of side.cooldowns)if(until<=this.clock)side.cooldowns.delete(id);
  if(!this.drawing)return;if(this.sides.length!==2)this.startRoam();
  for(const side of this.sides){
   const roam=side.roam!,previous={...side.head},other=this.sides[1-side.index];
   for(const [id,until] of roam.visited)if(until<=this.clock||!enemies.some(e=>e.id===id&&e.hp>0))roam.visited.delete(id);
   let target=enemies.find(e=>e.id===roam.targetId&&e.hp>0&&e.x>=b.left&&e.x<=b.right&&e.y>=b.top&&e.y<=b.bottom);
   if(!target)roam.targetId=null;
   if(this.clock>=roam.nextTarget){
    const candidates=enemies.filter(e=>e.hp>0&&!roam.visited.has(e.id)&&e.x>=b.left&&e.x<=b.right&&e.y>=b.top&&e.y<=b.bottom);
    const unclaimed=candidates.filter(e=>other?.roam?.targetId!==e.id);
    const choices=unclaimed.length?unclaimed:candidates;
    choices.sort((a,c)=>{
     const score=(e:Enemy)=>Math.hypot(e.x-side.head.x,e.y-side.head.y)+(other?.roam?.targetId===e.id?240:0)+(side.cooldowns.has(e.id)?140:0);
     return score(a)-score(c);
    });
    target=choices[0];roam.targetId=target?.id??null;roam.nextTarget=this.clock+DUAL_ROAM.reacquire+side.index*.21;
   }
   if(target&&Math.hypot(target.x-side.head.x,target.y-side.head.y)<DUAL_ROAM.targetRadius){roam.visited.set(target.id,this.clock+3.2);roam.targetId=null;target=undefined;roam.waypoint++;roam.nextTarget=this.clock+.6+side.index*.13;}
   let aim:Point=target??this.roamPoint(side,b);
   if(!target&&Math.hypot(aim.x-side.head.x,aim.y-side.head.y)<65){roam.waypoint++;aim=this.roamPoint(side,b);}
   const margin=DUAL_ROAM.margin;
   if(side.head.x<b.left+margin&&side.direction.x<0||side.head.x>b.right-margin&&side.direction.x>0||side.head.y<b.top+margin&&side.direction.y<0||side.head.y>b.bottom-margin&&side.direction.y>0){
    target=undefined;roam.targetId=null;roam.waypoint=4;roam.nextTarget=this.clock+.6;aim=this.roamPoint(side,b);
   }
   const time=this.clock,phase=time*(side.index===0?2.2:1.8)+side.index*2.3,cycle=(time+side.index*1.9)%6.4,cross=time%8.4;
   roam.flight=cycle>1&&cycle<2?'swoop':cycle>4.1&&cycle<5.15?'coil':'glide';
   if(cross>6.2&&cross<7.3){
    roam.flight='cross';aim={x:(b.left+b.right)/2+(side.index===0?105:-105),y:(b.top+b.bottom)/2+(side.index===0?-50:50)};
   }
   const dx=aim.x-side.head.x,dy=aim.y-side.head.y,desired=Math.atan2(dy,dx)+Math.sin(phase)*.19;
   const angle=Math.atan2(side.direction.y,side.direction.x),difference=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));
   const turnLimit=roam.flight==='coil'?DUAL_ROAM.turn:roam.flight==='swoop'?2.5:3.3;
   const wantedYaw=Math.max(-turnLimit,Math.min(turnLimit,difference*(roam.flight==='coil'?4.6:3.1)));
   roam.yaw+=(wantedYaw-roam.yaw)*(1-Math.exp(-dt*8));
   const next=angle+roam.yaw*dt;side.direction={x:Math.cos(next),y:Math.sin(next)};
   const burst=roam.flight==='swoop'?1.45+Math.sin((cycle-1)*Math.PI)*.24:roam.flight==='coil'?.57:roam.flight==='cross'?1.28:.88+Math.sin(phase*.73)*.12;
   const desiredSpeed=DUAL_ROAM.speed*burst*(target?1.06:1)*(1-Math.min(.23,Math.abs(difference)*.08));
   roam.speed+=(desiredSpeed-roam.speed)*(1-Math.exp(-dt*5.5));
   const keep=Math.min(104,(b.right-b.left)*.18,(b.bottom-b.top)*.18);
   side.head={x:Math.max(b.left+keep,Math.min(b.right-keep,side.head.x+side.direction.x*roam.speed*dt)),y:Math.max(b.top+keep,Math.min(b.bottom-keep,side.head.y+side.direction.y*roam.speed*dt))};
   this.advanceSpine(side,dt,b);
   // Edge pressure bends the next turn inward instead of wrapping or teleporting.
   if(side.head.x<=b.left+30||side.head.x>=b.right-30||side.head.y<=b.top+40||side.head.y>=b.bottom-40){roam.targetId=null;roam.waypoint=(side.index===0?4:0);roam.nextTarget=this.clock+.65;}
   const distance=(side.path.at(-1)?.distance??0)+Math.hypot(side.head.x-previous.x,side.head.y-previous.y);
   side.path.push({...side.head,distance});side.path=side.path.filter(p=>distance-p.distance<=PAPER_DRAGON_MOTION.length+30).slice(-DUAL_BRUSH_CONFIG.maxPoints);
   // The complete spine is still tested at 120 Hz, in its original tail-to-head
   // order. Build one broad-phase snapshot instead of copying every monster
   // array for all 49 contact segments of each dragon substep.
   const body=roam.spine,candidates=this.roamCandidates;
   let left=previous.x,right=previous.x,top=previous.y,bottom=previous.y;
   for(const p of body){left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);}
   candidates.length=0;
   for(const e of enemies){
    if(e.hp<=0||(side.cooldowns.get(e.id)??-Infinity)>this.clock||e.x<b.left||e.x>b.right||e.y<b.top||e.y>b.bottom)continue;
    const radius=this.tier.radius+brushBodyRadius(e);
    if(e.x<left-radius||e.x>right+radius||e.y<top-radius||e.y>bottom+radius)continue;
    candidates.push(e);
   }
   if(candidates.length){
    this.contact(side,previous,side.head,this.mainDamage*this.tier.ratio,candidates,damage,b,undefined,true);
    for(let i=body.length-1;i>0;i--)this.contact(side,body[i],body[i-1],this.mainDamage*this.tier.ratio,candidates,damage,b,undefined,true);
   }
   candidates.length=0;
  }
 }
 private advanceSpine(side:DualSide,dt:number,b:Arena){
  const spine=side.roam!.spine,step=PAPER_DRAGON_MOTION.length/(PAPER_DRAGON_MOTION.samples-1),phase=this.clock*PAPER_DRAGON_MOTION.frequency+side.index*2.4;
  spine[0].x=side.head.x;spine[0].y=side.head.y;
  for(let i=1;i<spine.length;i++){
   const prev=spine[i-1],point=spine[i];
   if(i<=14){point.x=side.head.x-side.direction.x*step*i;point.y=side.head.y-side.direction.y*step*i;continue;}
   // Each link follows its old position, so a head turn travels down the body over time.
   // A small lateral impulse keeps the tail paddling independently of translation.
   const u=i/(spine.length-1),edge=Math.min(prev.x-b.left,b.right-prev.x,prev.y-b.top,b.bottom-prev.y),push=Math.sin(phase-i*.34)*260*dt*(u-.25)*Math.max(0,Math.min(1,edge/45)),back=spine[i-2];
   const baseAngle=Math.atan2(prev.y-back.y,prev.x-back.x);
   const px=point.x-Math.sin(baseAngle)*push,py=point.y+Math.cos(baseAngle)*push;
   const repel=(distance:number)=>Math.max(0,1-distance/65)*step*3.5;
   const vx=px-prev.x+repel(prev.x-b.left)-repel(b.right-prev.x),vy=py-prev.y+repel(prev.y-b.top)-repel(b.bottom-prev.y);
   const wanted=Math.atan2(vy,vx),delta=Math.atan2(Math.sin(wanted-baseAngle),Math.cos(wanted-baseAngle));
   const bend=Math.max(-.22,Math.min(.22,delta)),angle=baseAngle+bend;
   point.x=prev.x+Math.cos(angle)*step;point.y=prev.y+Math.sin(angle)*step;
  }
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
 private contact(s:DualSide,a:Point,b:Point,amount:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds:Arena,lunge?:BrushLunge,snapshot=false){
  const segment=clipSegment({a,b},bounds);if(!segment)return;
  const left=Math.min(segment.a.x,segment.b.x),right=Math.max(segment.a.x,segment.b.x),top=Math.min(segment.a.y,segment.b.y),bottom=Math.max(segment.a.y,segment.b.y);
  for(const e of snapshot?enemies:[...enemies]){
   if(this.level===4&&(e.x<bounds.left||e.x>bounds.right||e.y<bounds.top||e.y>bounds.bottom))continue;
   if(e.hp<=0||(s.cooldowns.get(e.id)??-Infinity)>this.clock||lunge?.hit.has(e.id))continue;
   const radius=this.tier.radius+brushBodyRadius(e);
   if(e.x<left-radius||e.x>right+radius||e.y<top-radius||e.y>bottom+radius)continue;
   if(distanceToSegment(e,segment)>radius)continue;
   if(lunge&&this.tip&&Math.hypot(e.x-this.tip.x,e.y-this.tip.y)>this.leash(bounds)+brushBodyRadius(e))continue;
   s.cooldowns.set(e.id,this.clock+DUAL_BRUSH_CONFIG.hitInterval);lunge?.hit.add(e.id);
   if(this.level===4&&s.roam){
    s.roam.visited.set(e.id,this.clock+3.2);
    if(s.roam.targetId===e.id){s.roam.targetId=null;s.roam.nextTarget=this.clock+.35;s.roam.waypoint++;}
   }
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
  if(this.level===4&&s.path.length&&s.roam)return s.roam.spine.map(p=>({...p})).reverse();
  if((this.level===4||this.level>=3&&this.swimCenter)&&s.path.length){
   // Body phase and material length depend on simulation time alone. Input
   // steers a gently following center; it never drags samples through the body.
   const head=this.level===4?s.head:s.lunge?this.dashHead(s,bounds):this.swimAnchor(s),d=this.level===4?s.direction:this.swimDirection,length=this.level===4?PAPER_DRAGON_MOTION.length:DUAL_BRUSH_CONFIG.bodyLength;
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
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.clock+=dt;this.bounds={...bounds};
  if(this.level===4){this.pending=[];this.roamAccumulator+=dt;while(this.roamAccumulator+1e-10>=1/120){const endClock=this.clock;this.roamTime+=1/120;this.clock=this.roamTime;this.advanceRoam(1/120,enemies,damage,bounds);this.clock=endClock;this.roamAccumulator=Math.max(0,this.roamAccumulator-1/120);}for(const h of this.hits)h.age+=dt;this.hits=this.hits.filter(h=>h.age<.16);if(this.opacity<=0)for(const side of this.sides)side.path=[];return;}
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
