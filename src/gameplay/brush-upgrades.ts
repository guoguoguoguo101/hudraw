import {DualBrush,DUAL_BRUSH_TIERS} from './dual-brush';
import type {Point} from '../input/recognizer';
import type {Enemy} from '../core/types';
import {clipSegment,distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {InkTrail,INK_TRAIL_CONFIG,type TrailStyle} from './ink-trail';
import {brushBodyRadius} from './brush-contact';
import {InkCarp,INK_CARP_TIERS} from './ink-carp';

/** splash is the legacy loadout key; its entire route now represents 双毫. */
export type BrushSkill='spray'|'wide'|'splash'|'trail';
export type BrushLevels=Record<BrushSkill,number>;
export type BrushGrowthSnapshot={levels:BrushLevels;growth:boolean;picks:number;kills:number;pending:number;nextKills:number};
export const BRUSH_SKILLS:BrushSkill[]=['spray','wide','splash','trail'];
export const BRUSH_NAMES:Record<BrushSkill,string>={spray:'喷墨',wide:'阔锋',splash:'双毫',trail:'留墨'};
export const BRUSH_BASE_WIDTH=16;
/** All balance values live here; level zero disables a skill. */
export const BRUSH_UPGRADE_CONFIG={
 spray:INK_CARP_TIERS,
 wide:[{scale:1,damage:30},{scale:1.65,damage:36},{scale:2.15,damage:44},{scale:2.65,damage:52},{scale:3.1,damage:60}],
 splash:DUAL_BRUSH_TIERS,
 trail:INK_TRAIL_CONFIG,
};
export const BRUSH_DESCRIPTIONS:Record<BrushSkill,string[]>={
 spray:['关闭','游墨 · 小墨鲤 · 内置冷却0.85秒','双鲤 · 双鱼分流 · 内置冷却0.8秒','领游 · 大鲤带双小鲤 · 冷却0.95秒','跃浪 · 巨鲤穿敌拍浪 · 冷却1.4秒'],
 wide:['关闭','展锋 · 宽笔横扫 · 伤害36','横扫 · 更宽笔迹 · 伤害44','重锋 · 墨刃随笔 · 扫中轻推敌','破空 · 宽幅虚空 · 星流内爆 · 无冷却'],
 splash:['关闭','分毫 · 一道金锋 · 主笔35%伤害','并毫 · 金朱双锋 · 各35%伤害','灵毫初醒 · 双灵蛇随笔 · 各45%伤害','双龙伴笔 · 短距扑敌 · 各55%伤害'],
 trail:['关闭','留痕2秒 · 每半秒6伤害','墨障 · 留痕3秒 · 墨线拦截弹道','成阵 · 画圈展开镇妖阵 · 阵内持续攻击','唤墨魁 · 画圈成池 · 巨掌三叠镇压'],
};
type Drop={x:number;y:number;vx:number;vy:number;age:number;life:number;damage:number;size:number;volley:boolean;spray?:boolean;high?:boolean;remaining?:number;hit?:Set<number>};
type Splash={from:Point;center:Point;age:number;delay:number;radius:number;damage:number;hit:boolean;seed:number;secondary:boolean};
export const WIDE_FINISHER={move:0,cooldown:0,impact:.045,tear:.08,fade:.65,life:1.1,radius:44,damage:180,burstDelay:.32,burstDamage:96,burstRadius:38,visualLimit:6,points:96,spacing:12};
export type RiftPoint=Point&{born:number;distance:number;break?:boolean};
/** Geometry is the accepted brush polyline, without extrapolation or chord shortcuts. */
export type WideWave={x:number;y:number;dx:number;dy:number;length:number;age:number;life:number;radius:number;hit:Set<number>;burstHit:Set<number>;style:TrailStyle;id:number;stroke:number;resolved:boolean;path:RiftPoint[];pending:{a:Point;b:Point;born:number;opened?:boolean}[]};
export type WideCut={x:number;y:number;dx:number;dy:number;age:number;void?:boolean};
export class BrushUpgrades{
 carp=new InkCarp();dual=new DualBrush();
 levels:BrushLevels={spray:0,wide:0,splash:0,trail:0};trail=new InkTrail();
 drops:Drop[]=[];splashes:Splash[]=[];
 wideWaves:WideWave[]=[];wideAnchor:Point={x:360,y:650};wideCastAt=-Infinity;
 wideCuts:WideCut[]=[];wideEvolvedAt=-Infinity;
 private wideEvolved=false;private wideTone:'evolve'|'cast'|null=null;
 private wideActive:WideWave|null=null;private wideStroke=0;
 private widePending:WideWave[]=[];
 clock=0;charge=0;stroke=false;tip:Point|null=null;direction:Point={x:0,y:-1};
 runMode=false;choiceSeed=37;private runChoices:BrushSkill[]=[];panel:'custom'|'upgrade'|null=null;growth=false;picks=0;kills=0;pending=0;nextKills=4;
 private serial=0;
 get blocked(){return this.panel!==null;}
 get sprayActive(){return this.carp.active&&!this.blocked;}
 get choices(){const pool=BRUSH_SKILLS.filter(id=>this.levels[id]<4);return this.runMode&&this.panel==='upgrade'?this.runChoices.filter(id=>pool.includes(id)):pool;}
 get wideRemaining(){return 0;}
 get wideReady(){return this.levels.wide===4;}
 get bladeRadius(){return this.levels.wide>=3?38:this.width/2;}
 get contactRadius(){return this.bladeRadius;}
 get width(){return BRUSH_BASE_WIDTH*BRUSH_UPGRADE_CONFIG.wide[this.levels.wide].scale;}
 get mainDamage(){return BRUSH_UPGRADE_CONFIG.wide[this.levels.wide].damage;}
 takeWideTone(){const tone=this.wideTone;this.wideTone=null;return tone;}
 get chargeRatio(){return 0;}
 reset(){this.runMode=false;this.runChoices=[];this.choiceSeed=37;this.levels={spray:0,wide:0,splash:0,trail:0};this.wideEvolved=false;this.clearEffects();this.clock=0;this.panel=null;this.growth=false;this.picks=0;this.kills=0;this.pending=0;this.nextKills=4;}
 snapshot():BrushGrowthSnapshot{return {levels:{...this.levels},growth:this.growth,picks:this.picks,kills:this.kills,pending:this.pending,nextKills:this.nextKills};}
 restore(saved:BrushGrowthSnapshot){this.reset();this.levels={...saved.levels};this.wideEvolved=this.levels.wide===4;this.growth=saved.growth;this.picks=saved.picks;this.kills=saved.kills;this.pending=saved.pending;this.nextKills=saved.nextKills;}
 clearEffects(){this.dual.reset();this.dual.level=this.levels.splash;this.carp.reset();this.carp.level=this.levels.spray;this.trail.reset();this.drops=[];this.splashes=[];this.wideWaves=[];this.widePending=[];this.wideCuts=[];this.wideActive=null;this.wideStroke=0;this.wideTone=null;this.wideCastAt=this.wideEvolvedAt=-Infinity;this.wideAnchor={x:360,y:650};this.charge=0;this.stroke=false;this.tip=null;this.direction={x:0,y:-1};}
 setLevel(id:BrushSkill,level:number){
  if(!BRUSH_SKILLS.includes(id)||!Number.isFinite(level))return;
  this.levels[id]=Math.max(0,Math.min(4,Math.floor(level)));this.clearEffects();
  if(id==='wide'&&this.levels.wide===4&&!this.wideEvolved){this.wideEvolved=true;this.wideEvolvedAt=this.clock;this.wideTone='evolve';}
 }
 startGrowth(){this.reset();this.growth=true;this.pending=1;this.panel='upgrade';}
 kill(){if(this.runMode)return;if(!this.growth||this.picks+this.pending>=8)return;this.kills++;if(this.kills>=this.nextKills){this.kills-=this.nextKills;this.nextKills+=2;this.pending++;}}
 offer(safe:boolean){if(safe&&!this.panel&&this.growth&&this.pending>0&&this.choices.length){if(this.runMode){const pool=this.choices;const owned=pool.filter(id=>this.levels[id]>0).sort((a,b)=>this.levels[b]-this.levels[a]);const chosen=owned.slice(0,2),rest=pool.filter(id=>!chosen.includes(id));while(chosen.length<3&&rest.length){this.choiceSeed=(Math.imul(this.choiceSeed,1664525)+1013904223)>>>0;chosen.push(rest.splice(this.choiceSeed%rest.length,1)[0]);}this.runChoices=chosen;}this.panel='upgrade';}}
 choose(id:BrushSkill){if(this.panel!=='upgrade'||!this.choices.includes(id))return;this.setLevel(id,this.levels[id]+1);this.picks++;this.pending=Math.max(0,this.pending-1);this.panel=null;}
 begin(){this.dual.begin();this.carp.begin();this.trail.begin();this.stroke=true;this.tip=null;this.wideActive=null;this.wideStroke++;}
 end(bounds:Arena,cancel=false){
  this.carp.end();
  this.dual.end(cancel);this.trail.end(cancel,bounds);
  this.stroke=false;this.tip=null;this.wideActive=null;
 }
 directHit(){}
 trace(a:Point,b:Point,style:TrailStyle='cinnabar'){
  const d=Math.hypot(b.x-a.x,b.y-a.y);if(!Number.isFinite(d)||d<.01||this.blocked)return;
  const moving=this.sprayActive,dx=(b.x-a.x)/d,dy=(b.y-a.y)/d;
  const blend=moving?.62:1,nx=this.direction.x*(1-blend)+dx*blend,ny=this.direction.y*(1-blend)+dy*blend,n=Math.hypot(nx,ny)||1;
  this.tip={...b};this.direction={x:nx/n,y:ny/n};
  this.dual.level=this.levels.splash;this.dual.trace(a,b,this.mainDamage,this.width);
  this.wideAnchor={...b};this.carp.level=this.levels.spray;this.carp.trace(a,b);
  if(this.stroke&&this.wideReady){
   let w=this.wideActive;
   if(!w){
    w={x:a.x,y:a.y,dx,dy,length:0,age:0,life:WIDE_FINISHER.life,radius:WIDE_FINISHER.radius,hit:new Set(),burstHit:new Set(),style,id:++this.serial,stroke:this.wideStroke,resolved:false,path:[],pending:[]};
    this.wideActive=w;this.wideTone='cast';this.wideCastAt=this.clock;
   }
   if(!this.wideWaves.includes(w)){this.wideWaves.push(w);if(this.wideWaves.length>WIDE_FINISHER.visualLimit)this.wideWaves.shift();}
   if(!this.widePending.includes(w))this.widePending.push(w);
   const last=w.path.at(-1);
   if(!last||Math.hypot(last.x-a.x,last.y-a.y)>.1)w.path.push({...a,born:this.clock,distance:w.length,break:!!last});
   const count=Math.min(64,Math.ceil(d/WIDE_FINISHER.spacing)),start=w.length;
   for(let i=1;i<=count;i++)w.path.push({x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count,born:this.clock,distance:start+d*i/count});
   if(w.path.length>WIDE_FINISHER.points)w.path.splice(0,w.path.length-WIDE_FINISHER.points);
   w.pending.push({a:{...a},b:{...b},born:this.clock});w.length+=d;w.dx=dx;w.dy=dy;w.age=0;
  }
  this.trail.trace(a,b,this.width,this.levels.trail,style);

 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,bounds?:Arena){
  if(this.blocked||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);
  this.carp.level=this.levels.spray;if(bounds)this.carp.bounds={...bounds};this.carp.advance(dt,enemies,damage);
  this.clock+=dt;this.dual.level=this.levels.splash;this.dual.advance(dt,enemies,damage,bounds??{left:0,right:720,top:0,bottom:1280});
  this.trail.advance(dt,enemies,damage);
  for(const cut of this.wideCuts)cut.age+=dt;this.wideCuts=this.wideCuts.filter(c=>c.age<.24);
  const visible=new Set(this.wideWaves);for(const w of this.wideWaves)w.age+=dt;
  // Two one-shot stages per real segment: opening cut, then an interior star collapse.
  // Independent queues preserve committed hits even when their visuals are evicted.
  for(const w of this.widePending){
   if(!visible.has(w))w.age+=dt;
   const waiting:WideWave['pending']=[];
   for(const raw of w.pending){
    const age=this.clock-raw.born;
    if(age+1e-8<WIDE_FINISHER.impact){waiting.push(raw);continue;}
    const segment=bounds?clipSegment(raw,bounds):raw;if(!segment)continue;
    const dx=segment.b.x-segment.a.x,dy=segment.b.y-segment.a.y,n=Math.hypot(dx,dy)||1;
    const strike=(burst:boolean)=>{
     const hit=burst?w.burstHit:w.hit,radius=burst?WIDE_FINISHER.burstRadius:w.radius;
     for(const e of [...enemies])if(e.hp>0&&!hit.has(e.id)&&distanceToSegment(e,segment)<=radius+brushBodyRadius(e)){
      hit.add(e.id);this.wideCuts.push({x:e.x,y:e.y,dx:dx/n,dy:dy/n,age:0,void:burst});if(this.wideCuts.length>12)this.wideCuts.shift();
      damage(e,burst?WIDE_FINISHER.burstDamage:WIDE_FINISHER.damage);
      if(e.hp>0&&!e.elite&&e.kind!=='boss'){
       e.ai='Hit';e.stateAge=burst?.14:.10;
       if(burst){
        const u=Math.max(0,Math.min(1,((e.x-segment.a.x)*dx+(e.y-segment.a.y)*dy)/(n*n)));
        const px=segment.a.x+dx*u-e.x,py=segment.a.y+dy*u-e.y,d=Math.hypot(px,py)||1;
        const pull=Math.min(85,d/.14);e.vx=px/d*pull;e.vy=py/d*pull;
       }else{e.vx=dx/n*75;e.vy=dy/n*75;}
      }
     }
    };
    if(!raw.opened){raw.opened=true;w.resolved=true;strike(false);}
    if(age+1e-8>=WIDE_FINISHER.burstDelay)strike(true);else waiting.push(raw);
   }
   w.pending=waiting;
  }
  this.widePending=this.widePending.filter(w=>w.pending.length>0);
  for(const w of this.wideWaves)w.path=w.path.filter(p=>this.clock-p.born<w.life);
  this.wideWaves=this.wideWaves.filter(w=>w.age<w.life);
  for(const p of this.drops){const a={x:p.x,y:p.y},step=Math.min(dt,p.life-p.age);p.x+=p.vx*step;p.y+=p.vy*step;p.age+=dt;
   const touched=enemies.filter(e=>e.hp>0&&!p.hit?.has(e.id)&&distanceToSegment(e,{a,b:p})<=(p.spray?brushBodyRadius(e)+p.size:12)).sort((e,f)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(f.x-a.x,f.y-a.y));
   for(const e of touched){
    p.hit??=new Set();p.hit.add(e.id);damage(e,p.damage);p.remaining=(p.remaining??1)-1;
    if(p.remaining<=0){p.age=p.life;break;}
   }
  }
  this.drops=this.drops.filter(p=>p.age<p.life);
 }
}
