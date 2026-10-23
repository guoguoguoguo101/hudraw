import type {Enemy} from '../core/types';
import type {Point,Recognition} from '../input/recognizer';
import type {InputEvent} from '../platform/adapter';
import {inArena,distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {PaperTiger} from './paper-tiger';
import {SceneSeal,type SceneMode} from './scene-seal';
import {ScrollJourney,type LandscapeStage} from './scroll-journey';

export type SpiritCard='dragon'|'mountain'|'rift'|'tiger'|'crane';
export const SPIRIT_CARDS:Record<SpiritCard,{name:string;verb:string;hint:string}>={
 dragon:{name:'一笔游龙',verb:'画龙',hint:'一笔穿过敌群 · 松手放龙，沿你的笔迹冲阵'},
 mountain:{name:'落笔成山',verb:'画山',hint:'横向勾出起伏山脊 · 成山挡怪，再点「推山」'},
 rift:{name:'裁纸开天',verb:'裁纸',hint:'自由划一道裁口 · 松手后，狐爪沿裂痕撕开'},
 tiger:{name:'补灵 · 纸虎',verb:'补虎',hint:'从亮点起笔，沿淡金线补上卷尾 · 可抬手接着补'},
 crane:{name:'补灵 · 纸鹤',verb:'补鹤',hint:'从亮点起笔，补好残缺翅膀 · 展翼吹退前方敌人'},
};
export type SpiritEffect={id:number;kind:'dragon'|'mountain'|'rift'|'crane';path:Point[];age:number;duration:number;hit:Set<number>;collapsing:boolean;collapseAge:number};
export function pathLength(path:Point[]){let n=0;for(let i=1;i<path.length;i++)n+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);return n;}
export function atPath(path:Point[],fraction:number):Point{
 if(!path.length)return {x:360,y:500};let remaining=pathLength(path)*Math.max(0,Math.min(1,fraction));
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(remaining<=d&&d>0)return {x:a.x+(b.x-a.x)*remaining/d,y:a.y+(b.y-a.y)*remaining/d};remaining-=d;}
 return {...path[path.length-1]};
}
/** Explicit selected-card input; no gesture recognition, ink charges or progression side effects. */
export class Hualing{
 selected:SpiritCard|null=null;lastCard:SpiritCard='dragon';path:Point[]=[];effects:SpiritEffect[]=[];
 bounds:Arena={left:20,right:700,top:260,bottom:990};pointer:number|null=null;length=0;age=0;clock=0;serial=0;
 notice='直接画直线 / 圆，或选一张灵符开始';noticeTime=0;repairProgress=0;repairAnchor:Point={x:360,y:535};
 tiger=new PaperTiger();sceneSeal=new SceneSeal();frozen=false;private badStroke=false;private tail:Point|null=null;
 journey=new ScrollJourney();private sceneMemory=new Map<SceneMode,SceneSeal>();private journeyEvent:SceneMode='seal';private pendingScene:SceneMode|null=null;
 constructor(){this.sceneMemory.set('seal',this.sceneSeal);}
 get scenes(){return [...new Set([...this.sceneMemory.values(),this.sceneSeal])];}
 showScene(mode:SceneMode,reset=false){
  this.sceneMemory.set(this.sceneSeal.mode,this.sceneSeal);
  let next=this.sceneMemory.get(mode);
  if(!next){next=new SceneSeal();next.setMode(mode);this.sceneMemory.set(mode,next);}
  else if(reset)next.reset();
  this.sceneSeal=next;this.cancelInput();
 }
 chooseScene(mode:SceneMode){this.journey.autoEvents=false;this.pendingScene=null;this.selected=null;this.showScene(mode,true);}
 previewLandscape(stage:LandscapeStage){this.journey.preview(stage);this.journeyEvent=this.journey.event;this.pendingScene=null;this.selected=null;this.cancelInput();this.showScene(this.journey.event);this.say(`${stage==='sunset'?'丹霞照谷':stage==='wind'?'风过秋山':'月照山灵'} · 进度与成品符保留`);}
 get drawing(){return this.pointer!==null;}
 get repairing(){return this.selected==='tiger'||this.selected==='crane';}
 get guide(){const a=this.repairAnchor;const points=this.selected==='tiger'?
  [[-86,-54],[-121,-59],[-143,-80],[-148,-108],[-136,-132],[-108,-137],[-90,-119],[-92,-100],[-108,-87]]:
  [[0,-15],[20,-54],[60,-104],[113,-132],[87,-67],[56,-35],[0,-15]];
 return points.map(([x,y])=>({x:a.x+x,y:a.y+y}));}
 get canPush(){return this.effects.some(e=>e.kind==='mountain'&&!e.collapsing);}
 say(message:string){this.notice=message;this.noticeTime=3;}
 select(card:SpiritCard){this.cancelInput();this.selected=card;this.lastCard=card;this.path=[];this.length=0;this.repairProgress=0;
  this.repairAnchor={x:360,y:Math.max(this.bounds.top+155,Math.min(550,this.bounds.bottom-160))};this.say(SPIRIT_CARDS[card].hint);}
 cancelInput(){for(const s of this.scenes)s.cancelDrag();this.pointer=null;this.tail=null;this.age=0;this.badStroke=false;this.path=[];this.length=0;}
 cancel(){this.cancelInput();this.selected=null;this.repairProgress=0;this.say('已收笔 · 直线斩击 / 圆形护阵');}
 reset(){this.cancel();this.effects=[];this.tiger.reset();for(const s of this.scenes)s.reset();this.sceneMemory.clear();this.sceneSeal.setMode('seal');this.sceneSeal.slotIndex=1;this.sceneMemory.set('seal',this.sceneSeal);this.journey.reset();this.journeyEvent='seal';this.pendingScene=null;this.frozen=false;this.clock=0;this.serial=0;this.noticeTime=0;this.notice='落日山谷 · 画卷将随时间起风、入夜';}
 traceScene(a:Point,b:Point){if(!this.selected){const seal=this.sceneSeal;if(seal.trace(a,b,this.bounds)&&seal.phase==='collecting')this.say(`${seal.info.title}完成 · ${seal.info.reward}收入符匣`);}}
 castScene(r:Recognition){const s=this.sceneSeal;if(!this.selected&&s.onCast(r,this.bounds))this.say(s.phase==='collecting'?`${s.info.reward}入匣${s.mode==='fire'?` · 收拢 ${s.power} 团妖火`:''}`:`锁链已断 ${Math.round(s.progress*100)}% · 可接着斩`);}
 pushMountains(){let n=0;for(const effect of this.effects)if(effect.kind==='mountain'&&!effect.collapsing){effect.collapsing=true;effect.collapseAge=0;effect.hit.clear();n++;}if(n)this.say('推山 · 纸峰向前倾倒！');return n>0;}
 handle(e:InputEvent){
  if(!this.selected){const captured=this.scenes.find(s=>s.dragPointer!==null);if(captured)return captured.handle(e,this.bounds);for(const s of this.scenes)if(s.handle(e,this.bounds))return true;}
  if(!this.selected)return false;
  if(e.kind==='cancel'){if(e.id===this.pointer)this.cancelInput();return true;}
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return true;
  if(e.kind==='down'){
   if(this.pointer!==null||!inArena(e,this.bounds))return true;
   if(this.repairing){const start=atPath(this.guide,this.repairProgress);if(Math.hypot(e.x-start.x,e.y-start.y)>42){this.say('从发亮的笔尖继续补画');return true;}}
   this.pointer=e.id;this.tail={x:e.x,y:e.y};this.path=[{...this.tail}];this.length=0;this.age=0;this.badStroke=false;return true;
  }
  if(e.id!==this.pointer)return true;
  // Exiting into controls cancels this stroke instead of projecting off-canvas input into damage.
  if(!inArena(e,this.bounds)){if(e.kind==='up')this.cancelInput();return true;}
  if(e.kind==='move'||e.kind==='up')this.sample(e);
  if(e.kind==='up'){
   this.pointer=null;this.tail=null;
   if(this.repairing){this.path=[];if(this.repairProgress>=.985)this.finishRepair();else this.say('已保留进度 · 从亮点接着补');}
   else this.release();
  }
  return true;
 }
 private sample(e:Point){
  const a=this.tail??e,d=Math.hypot(e.x-a.x,e.y-a.y);if(d<2)return;
  if(this.repairing){
   const guide=this.guide,total=pathLength(guide),from=this.repairProgress;
   let best=from,bestDistance=Infinity;
   // Only the next nearby section can advance. A long scribble cannot sweep the whole stencil.
   const limit=Math.min(1,from+Math.min(.12,(d+12)/total));
   for(let q=from;q<=limit+.001;q+=.004){const p=atPath(guide,q),dist=Math.hypot(e.x-p.x,e.y-p.y);if(dist<bestDistance){bestDistance=dist;best=q;}}
   this.badStroke=bestDistance>26;if(!this.badStroke)this.repairProgress=Math.min(1,best);
   this.tail={...e};this.path=[a,{...e}];return;
  }
  const take=Math.min(d,1100-this.length);if(take<=0)return;
  const p={x:a.x+(e.x-a.x)*take/d,y:a.y+(e.y-a.y)*take/d};this.length+=take;this.tail=p;
  // Bounded sampling without creating chords across discarded turns.
  if(this.path.length<600)this.path.push(p);
 }
 private release(){
  if(this.length<65||this.path.length<2){this.path=[];this.length=0;this.say('笔画太短 · 再画一次，不消耗次数');return;}
  if(this.selected==='mountain'){
   const xs=this.path.map(p=>p.x),ys=this.path.map(p=>p.y);if(Math.max(...xs)-Math.min(...xs)<130||Math.max(...ys)-Math.min(...ys)<22){this.path=[];this.length=0;this.say('横着画一段有高低的山脊');return;}
   if(this.effects.filter(e=>e.kind==='mountain'&&!e.collapsing).length>=2){this.say('最多两座纸山 · 先推倒或清场');this.path=[];this.length=0;return;}
  }
  const kind=this.selected as 'dragon'|'mountain'|'rift',path=this.path.map(p=>({...p}));
  this.effects.push({id:++this.serial,kind,path,age:0,duration:kind==='mountain'?16:kind==='dragon'?3.3:2.3,hit:new Set(),collapsing:false,collapseAge:0});
  if(this.effects.length>8)this.effects.shift();this.selected=null;this.cancelInput();this.say(kind==='dragon'?'纸龙得形 · 沿笔迹冲阵':kind==='mountain'?'纸山已立 · 挡住群妖，点「推山」释放':'裁口蓄势 · 狐爪破纸而出');
 }
 private finishRepair(){
  const p=this.repairAnchor;
  if(this.selected==='tiger'){this.tiger.reset();this.tiger.begin({kind:'down',id:99,...p});this.tiger.input({kind:'up',id:99,...p},this.bounds);this.say('纸虎补全 · 十二秒自动寻妖跳扑');}
  else{this.effects.push({id:++this.serial,kind:'crane',path:[{...p}],age:0,duration:3.5,hit:new Set(),collapsing:false,collapseAge:0});if(this.effects.length>8)this.effects.shift();this.say('纸鹤展翼 · 吹退前方群妖');}
  this.selected=null;this.repairProgress=0;this.cancelInput();
 }
 demo(){const card=this.selected??this.lastCard;this.select(card);
  
  const points=card==='tiger'||card==='crane'?Array.from({length:180},(_,i)=>atPath(this.guide,i/179)):
   card==='mountain'?[{x:140,y:570},{x:215,y:470},{x:280,y:540},{x:385,y:410},{x:470,y:525},{x:560,y:465},{x:600,y:575}]:
   Array.from({length:90},(_,i)=>({x:360+Math.sin(i/89*Math.PI*2)*180,y:this.bounds.bottom-90-(i/89)*(this.bounds.bottom-this.bounds.top-170)}));
  this.handle({kind:'down',id:90,...points[0]});for(const p of points.slice(1))this.handle({kind:'move',id:90,...p});this.handle({kind:'up',id:90,...points[points.length-1]});
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,brushDown=false){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);this.clock+=dt;this.noticeTime=Math.max(0,this.noticeTime-dt);
  this.journey.advance(dt);
  if(this.journey.autoEvents&&this.journey.event!==this.journeyEvent){this.journeyEvent=this.journey.event;this.pendingScene=this.journey.event;}
  if(this.pendingScene&&!brushDown&&!this.drawing&&!this.selected&&!this.scenes.some(s=>s.dragPointer!==null)){this.showScene(this.pendingScene);this.pendingScene=null;}
  for(const scene of this.scenes){
  // Keep earned cards visible across scenery changes; each card claims one of three slots.
  if(scene.phase==='collecting'){const used=this.scenes.filter(s=>s!==scene&&(s.phase==='stored'||s.phase==='collecting'&&s.age>scene.age)).map(s=>s.slotIndex);const available=[scene.slotIndex,0,1,2].find(i=>!used.includes(i));if(available===undefined)continue;scene.slotIndex=available;}
  scene.advance(dt);
  for(const burst of scene.bursts)if(!burst.hit&&burst.age>=.12){
   burst.hit=true;
   if(burst.kind==='beast'){
    const beast=scene.beast;beast.reset();beast.begin({kind:'down',id:98,...burst.center});beast.input({kind:'up',id:98,...burst.center},this.bounds);this.say('山虎出卷 · 十二秒自动跳扑');continue;
   }
   for(const e of [...enemies])if(burst.kind==='chain'?Math.abs(e.x-burst.center.x)<=260&&Math.abs(e.y-burst.center.y)<=65:Math.hypot(e.x-burst.center.x,e.y-burst.center.y)<=(burst.kind==='fire'?115+burst.power*18:135)){
    damage(e,burst.kind==='fire'?60+burst.power*30:burst.kind==='chain'?160:120);if(e.kind!=='boss'&&e.hp>0){const dx=e.x-burst.center.x,dy=e.y-burst.center.y,n=Math.hypot(dx,dy)||1;e.vx=dx/n*320;e.vy=dy/n*320;e.ai='Hit';e.stateAge=0;e.hit=.25;}
   }
   this.say(burst.kind==='fire'?`焰聚爆发 · ${burst.power} 火之力`:burst.kind==='chain'?'裂空横斩 · 扫荡一线':'破印冲击 · 范围震退');
  }
  scene.beast.advance(dt,enemies,this.bounds,damage);
  }
  if(this.drawing){this.age+=dt;if(this.age>6){this.cancelInput();this.say('本笔已取消 · 可重新起笔');}}
  this.tiger.advance(dt,enemies,this.bounds,damage);
  for(const f of this.effects){const previous=f.age;f.age+=dt;if(f.collapsing)f.collapseAge+=dt;
   if(f.kind==='dragon'){const from=Math.min(1,previous/1.5),to=Math.min(1,f.age/1.5);for(const e of [...enemies])if(!f.hit.has(e.id)){
    let contact=false;for(let q=from;q<=to+.015;q+=.015){const p=atPath(f.path,q);if(Math.hypot(e.x-p.x,e.y-p.y)<54){contact=true;break;}}
    if(contact){f.hit.add(e.id);damage(e,160);}
   }}
   if(f.kind==='rift'&&previous<.72&&f.age>=.72)for(const e of [...enemies])if(f.path.some((b,i)=>i>0&&distanceToSegment(e,{a:f.path[i-1],b})<57)){f.hit.add(e.id);damage(e,180);}
   if(f.kind==='mountain'&&f.collapsing&&f.collapseAge>.15)for(const e of [...enemies])if(!f.hit.has(e.id)&&f.path.some((p,i)=>i>0&&distanceToSegment(e,{a:{x:f.path[i-1].x,y:f.path[i-1].y-145*Math.min(1,f.collapseAge)},b:{x:p.x,y:p.y-145*Math.min(1,f.collapseAge)}})<90)){f.hit.add(e.id);damage(e,120);}
   if(f.kind==='crane'&&f.age>.45){const p=f.path[0],reach=100+Math.min(1,(f.age-.45)/1.25)*500;for(const e of enemies)if(e.kind!=='boss'&&!f.hit.has(e.id)){
    const dx=e.x-p.x,dy=e.y-p.y;if(dy<55&&Math.hypot(dx,dy)<reach&&Math.abs(dx)<130+Math.max(0,-dy)*.85){f.hit.add(e.id);const n=Math.hypot(dx,dy)||1,scale=e.kind==='oni'?.45:1;e.vx=dx/n*680*scale;e.vy=Math.min(-.45,dy/n)*680*scale;e.ai='Hit';e.stateAge=0;e.hit=.25;}
   }}
  }
  this.effects=this.effects.filter(f=>f.age<f.duration&&(!f.collapsing||f.collapseAge<1.5));
 }
 contain(enemies:Enemy[]){
  for(const f of this.effects)if(f.kind==='mountain'&&!f.collapsing&&f.age>.25)for(const e of enemies){if(e.kind==='boss')continue;
   const bottom=Math.min(this.bounds.bottom-5,Math.max(...f.path.map(p=>p.y))+35);
   for(let i=1;i<f.path.length;i++){const a=f.path[i-1],b=f.path[i];if(e.x<Math.min(a.x,b.x)-20||e.x>Math.max(a.x,b.x)+20)continue;
    const t=Math.abs(b.x-a.x)<1?0:Math.max(0,Math.min(1,(e.x-a.x)/(b.x-a.x))),ridge=a.y+(b.y-a.y)*t;
    if(e.y>ridge-20&&e.y<bottom+20){e.y=e.prevY<=ridge?ridge-21:bottom+21;e.vy=0;e.prevY=e.y;break;}
   }
  }
 }
 get offGuide(){return this.badStroke;}
}
