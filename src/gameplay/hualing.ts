import {HualingElites} from './hualing-elites';
import {HualingBosses} from './hualing-bosses';
import type {HualingChapter} from './hualing-chapters';
import {BrushUpgrades,type BrushGrowthSnapshot} from './brush-upgrades';
import {ThunderBrush} from './thunder-brush';
import {HualingCombo} from './hualing-combo';
import {PetalBrush} from './petal-brush';
import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import type {InputEvent} from '../platform/adapter';
import {inArena,type Arena} from '../input/line-interaction-geometry';
import {SceneSeal,type SceneMode} from './scene-seal';
import {ScrollJourney,type LandscapeStage} from './scroll-journey';

export type SpiritCard='dragon';
export const SPIRIT_CARDS:Record<SpiritCard,{name:string;verb:string;hint:string}>={
 dragon:{name:'一笔游龙',verb:'画龙',hint:'一笔穿过敌群 · 松手放龙，沿你的笔迹冲阵'},
};
export type SpiritEffect={id:number;kind:'dragon';path:Point[];age:number;duration:number;hit:Set<number>};
export function pathLength(path:Point[]){let n=0;for(let i=1;i<path.length;i++)n+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);return n;}
export function atPath(path:Point[],fraction:number):Point{
 if(!path.length)return {x:360,y:500};let remaining=pathLength(path)*Math.max(0,Math.min(1,fraction));
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(remaining<=d&&d>0)return {x:a.x+(b.x-a.x)*remaining/d,y:a.y+(b.y-a.y)*remaining/d};remaining-=d;}
 return {...path[path.length-1]};
}
/** Explicit selected-card input; no gesture recognition, ink charges or progression side effects. */
export class Hualing{
 bosses=new HualingBosses();
 elites=new HualingElites();upgrades=new BrushUpgrades();
 private growthByChapter=new Map<HualingChapter,BrushGrowthSnapshot>();
 combo=new HualingCombo();
 thunder=new ThunderBrush();petals=new PetalBrush();
 selected:SpiritCard|null=null;lastCard:SpiritCard='dragon';path:Point[]=[];effects:SpiritEffect[]=[];
 bounds:Arena={left:20,right:700,top:260,bottom:990};pointer:number|null=null;length=0;age=0;clock=0;serial=0;
 notice='挥笔划过纸妖 · 或选纸符绘物成灵';noticeTime=0;
 sceneSeal=new SceneSeal();frozen=false;private tail:Point|null=null;
 journey=new ScrollJourney();private sceneMemory=new Map<SceneMode,SceneSeal>();private journeyEvent:SceneMode='seal';private pendingScene:SceneMode|null=null;
 constructor(){this.sceneMemory.set('seal',this.sceneSeal);}
 get scenes(){return [...new Set([...this.sceneMemory.values(),this.sceneSeal])];}
 claimSummon(kind:'beast'|'crab'){
  this.cancel();let s=this.sceneMemory.get(kind);
  if(s&&(s.phase==='stored'||s.phase==='collecting')){this.say(`${s.info.reward}已在符匣 · 拖到画境召唤`);return false;}
  if(s?.bursts.some(b=>!b.hit)){this.say('召唤符正在展开 · 稍候再领');return false;}
  const used=this.scenes.filter(s=>s.phase==='stored'||s.phase==='collecting').map(s=>s.slotIndex),slot=[0,1,2].find(i=>!used.includes(i));
  if(slot===undefined){this.say('符匣已满 · 先拖出一张符使用');return false;}
  if(!s){s=new SceneSeal();s.chapter=this.journey.chapter;s.setMode(kind);this.sceneMemory.set(kind,s);}
  s.phase='stored';s.age=0;s.slotIndex=slot;s.cancelDrag();this.say(`${s.info.reward}已入匣 · 拖进画境召唤`);return true;
 }
 showScene(mode:SceneMode,reset=false){
  this.sceneMemory.set(this.sceneSeal.mode,this.sceneSeal);
  let next=this.sceneMemory.get(mode);
  if(!next){next=new SceneSeal();next.chapter=this.journey.chapter;next.setMode(mode);this.sceneMemory.set(mode,next);}
  else if(reset)next.reset();
  this.sceneSeal=next;this.cancelInput();
 }
 chooseScene(mode:SceneMode){if(mode==='beast'||mode==='crab'){this.claimSummon(mode);return;}this.journey.autoEvents=false;this.pendingScene=null;this.selected=null;this.showScene(mode,true);}
 previewLandscape(stage:LandscapeStage){this.journey.preview(stage);this.journeyEvent=this.journey.event;this.pendingScene=null;this.selected=null;this.cancelInput();this.showScene(this.journey.event);this.say(`${this.journey.sceneName} · 进度与成品符保留`);}
 changeChapter(chapter:HualingChapter){this.growthByChapter.set(this.journey.chapter,this.upgrades.snapshot());this.reset(false);this.journey.chapter=chapter;const saved=this.growthByChapter.get(chapter);if(saved)this.upgrades.restore(saved);this.sceneSeal.chapter=chapter;this.sceneSeal.reset();this.say(this.journey.info.description);}
 get drawing(){return this.pointer!==null;}
 say(message:string){this.notice=message;this.noticeTime=3;}
 select(card:SpiritCard){if(card!=='dragon')return false;this.cancelInput();this.selected=card;this.lastCard=card;this.path=[];this.length=0;this.say(SPIRIT_CARDS[card].hint);}
 cancelInput(){for(const s of this.scenes)s.cancelDrag();this.pointer=null;this.tail=null;this.age=0;this.path=[];this.length=0;}
 cancel(){this.cancelInput();this.selected=null;this.say('已收笔 · 挥笔划过纸妖');}
 reset(clearGrowth=true){this.bosses.reset();if(clearGrowth)this.growthByChapter.clear();this.elites.reset();this.upgrades.reset();this.combo.reset();this.cancel();this.thunder.reset();this.petals.reset();this.effects=[];for(const s of this.scenes)s.reset();this.sceneMemory.clear();this.sceneSeal.chapter=this.journey.chapter;this.sceneSeal.setMode('seal');this.sceneSeal.slotIndex=1;this.sceneMemory.set('seal',this.sceneSeal);this.journey.reset();this.journeyEvent='seal';this.pendingScene=null;this.frozen=false;this.clock=0;this.serial=0;this.noticeTime=0;this.notice='落日山谷 · 画卷将随时间起风、入夜';}
 traceScene(a:Point,b:Point){if(!this.selected&&!this.bosses.active){const seal=this.sceneSeal;if(seal.trace(a,b,this.bounds)&&seal.phase==='collecting')this.say(`${seal.info.title}完成 · ${seal.info.reward}收入符匣`);}}
 handle(e:InputEvent){
  if(!this.selected){const captured=this.scenes.find(s=>s.dragPointer!==null);if(captured)return captured.handle(e,this.bounds);for(const s of this.scenes)if(s.handle(e,this.bounds))return true;}
  if(!this.selected)return false;
  if(e.kind==='cancel'){if(e.id===this.pointer)this.cancelInput();return true;}
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return true;
  if(e.kind==='down'){
   if(this.pointer!==null||!inArena(e,this.bounds))return true;
   this.pointer=e.id;this.tail={x:e.x,y:e.y};this.path=[{...this.tail}];this.length=0;this.age=0;return true;
  }
  if(e.id!==this.pointer)return true;
  // Exiting into controls cancels this stroke instead of projecting off-canvas input into damage.
  if(!inArena(e,this.bounds)){if(e.kind==='up')this.cancelInput();return true;}
  if(e.kind==='move'||e.kind==='up')this.sample(e);
  if(e.kind==='up'){
   this.pointer=null;this.tail=null;
   this.release();
  }
  return true;
 }
 private sample(e:Point){
  const a=this.tail??e,d=Math.hypot(e.x-a.x,e.y-a.y);if(d<2)return;
  const take=Math.min(d,1100-this.length);if(take<=0)return;
  const p={x:a.x+(e.x-a.x)*take/d,y:a.y+(e.y-a.y)*take/d};this.length+=take;this.tail=p;
  // Bounded sampling without creating chords across discarded turns.
  if(this.path.length<600)this.path.push(p);
 }
 private release(){
  if(this.length<65||this.path.length<2){this.path=[];this.length=0;this.say('笔画太短 · 再画一次，不消耗次数');return;}
  const kind:SpiritCard='dragon',path=this.path.map(p=>({...p}));
  this.effects.push({id:++this.serial,kind,path,age:0,duration:3.3,hit:new Set()});
  if(this.effects.length>8)this.effects.shift();this.selected=null;this.cancelInput();this.say('纸龙得形 · 沿笔迹冲阵');
 }
 demo(){const card=this.selected??this.lastCard;this.select(card);
  
  const points=
   Array.from({length:90},(_,i)=>({x:360+Math.sin(i/89*Math.PI*2)*180,y:this.bounds.bottom-90-(i/89)*(this.bounds.bottom-this.bounds.top-170)}));
  this.handle({kind:'down',id:90,...points[0]});for(const p of points.slice(1))this.handle({kind:'move',id:90,...p});this.handle({kind:'up',id:90,...points[points.length-1]});
 }
 advance(dt:number,enemies:Enemy[],damage:(e:Enemy,n:number)=>void,brushDown=false){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);this.clock+=dt;this.combo.advance(dt);this.petals.advance(dt);this.thunder.advance(dt);this.noticeTime=Math.max(0,this.noticeTime-dt);
  this.upgrades.advance(dt,enemies,damage,this.bounds);
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
   if(burst.kind==='crab'){scene.crab.summon(burst.center,this.bounds);this.say('蟹将出阵 · 寻妖蓄势，沿直线贯穿敌群');continue;}
   for(const e of [...enemies])if(burst.kind==='chain'?Math.abs(e.x-burst.center.x)<=260&&Math.abs(e.y-burst.center.y)<=65:Math.hypot(e.x-burst.center.x,e.y-burst.center.y)<=(burst.kind==='fire'?115+burst.power*18:135)){
    damage(e,burst.kind==='fire'?60+burst.power*30:burst.kind==='chain'?160:120);if(e.kind!=='boss'&&e.hp>0){const dx=e.x-burst.center.x,dy=e.y-burst.center.y,n=Math.hypot(dx,dy)||1;e.vx=dx/n*320;e.vy=dy/n*320;e.ai='Hit';e.stateAge=0;e.hit=.25;}
   }
   this.say(scene.chapter==='snow'?(burst.kind==='fire'?`灵息苏醒 · ${burst.power} 缕山灵`:burst.kind==='chain'?'裂霜横斩 · 扫荡一线':'眠山震荡 · 范围震退'):burst.kind==='fire'?`焰聚爆发 · ${burst.power} 火之力`:burst.kind==='chain'?'裂空横斩 · 扫荡一线':'破印冲击 · 范围震退');
  }
  scene.beast.advance(dt,enemies,this.bounds,damage);
  scene.crab.advance(dt,enemies,this.bounds,damage);
  }
  if(this.drawing){this.age+=dt;if(this.age>6){this.cancelInput();this.say('本笔已取消 · 可重新起笔');}}
  for(const f of this.effects){const previous=f.age;f.age+=dt;
   if(f.kind==='dragon'){const from=Math.min(1,previous/1.5),to=Math.min(1,f.age/1.5);for(const e of [...enemies])if(!f.hit.has(e.id)){
    let contact=false;for(let q=from;q<=to+.015;q+=.015){const p=atPath(f.path,q);if(Math.hypot(e.x-p.x,e.y-p.y)<54){contact=true;break;}}
    if(contact){f.hit.add(e.id);damage(e,160);}
   }}

  }
  this.effects=this.effects.filter(f=>f.age<f.duration);
 }
}
