import type {HualingChapter} from './hualing-chapters';
import type {Point} from '../input/recognizer';
import type {InputEvent} from '../platform/adapter';
import {clipSegment,distanceToSegment,inArena,type Arena} from '../input/line-interaction-geometry';
import {PaperTiger} from './paper-tiger';
import {PaperCrab} from './paper-crab';

type SealMark={a:Point;b:Point;lit:boolean;length:number};
export type SceneMode='seal'|'chain'|'fire'|'beast'|'crab';
export const SCENE_MODES:Record<SceneMode,{tab:string;title:string;hint:string;reward:string}>={
 seal:{tab:'封印',title:'残缺封印',hint:'笔迹经过就点亮 · 随时停笔',reward:'破印符'},
 chain:{tab:'断链',title:'挥笔断链',hint:'沿锁链挥笔划断 · 分次划过也保留',reward:'裂空符'},
 fire:{tab:'收火',title:'挥笔收火',hint:'笔尖扫过五团妖火 · 收齐凝成焰聚符',reward:'焰聚符'},
 beast:{tab:'虎符',title:'纸虎召唤',hint:'点击领虎符 · 拖进画境召唤纸虎',reward:'虎符'},
 crab:{tab:'蟹符',title:'螃蟹大将军',hint:'点击领蟹符 · 拖进画境召唤直线冲锋的蟹将',reward:'螃蟹符'},
};
export type SealBurst={center:Point;age:number;hit:boolean;kind:SceneMode;power:number};
const valid=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y);

/** Scene progress observes paid brush segments; it never captures or redirects the brush. */
export class SceneSeal{
 chapter:HualingChapter='valley';mode:SceneMode='seal';beast=new PaperTiger();crab=new PaperCrab();power=1;
 slotIndex=1;
 marks:SealMark[]=[];phase:'repairing'|'collecting'|'stored'|'spent'='repairing';
 age=0;flash=0;dragPointer:number|null=null;dragPoint:Point|null=null;bursts:SealBurst[]=[];
 fragments:{x:number;y:number;angle:number;age:number}[]=[];sweeps:{a:Point;b:Point;age:number}[]=[];
 readonly flames:Point[]=[{x:-205,y:-65},{x:-100,y:85},{x:0,y:-115},{x:110,y:85},{x:205,y:-55}];
 captured=new Set<number>();captureCenter:Point|null=null;
 private traced=0;private total=0;
 // Stable local coordinates: resizing a phone moves the event without erasing its progress.
 private readonly sealPaths:Point[][]=[
  [[-145,-45],[-55,-45],[0,-100],[55,-45],[145,-45]],
  [[-130,25],[-55,25],[0,80],[55,25],[130,25]],
  [[0,-40],[0,35]],
 ].map(path=>path.map(([x,y])=>({x,y})));
 get paths():Point[][]{
  if(this.mode==='crab'||this.mode==='beast')return [];
  if(this.mode==='chain')return [[[-285,-70],[285,25]],[[-275,35],[275,-60]],[[-230,100],[230,100]]].map(path=>path.map(([x,y])=>({x,y})));
  if(this.mode==='seal'&&this.chapter==='sea')return [0,1,2].map(i=>Array.from({length:9},(_,j)=>({x:-144+j*36,y:-64+i*61+Math.sin(j*Math.PI/2)*24})));
  if(this.mode==='seal'&&this.chapter==='palace')return [[[-140,20],[-92,-65],[-12,-24],[48,-95],[140,-15],[65,70],[-12,-24],[-40,95],[-140,20]]].map(path=>path.map(([x,y])=>({x,y})));
  if(this.mode==='seal'&&this.chapter==='snow')return [
   [[-145,35],[-107,-7],[-68,3],[-26,-48],[17,-20],[62,-69],[104,-37],[145,-52]],
   [[-91,69],[-56,38],[-15,58],[26,19],[64,41],[104,15]],
   [[-26,-48],[-37,-89],[-62,-108]],[[62,-69],[71,-105],[98,-118]],
  ].map(path=>path.map(([x,y])=>({x,y})));
  return this.mode==='fire'?[]:this.sealPaths;
 }
 constructor(){this.reset();}
 get progress(){return this.mode==='fire'?this.captured.size/this.flames.length:this.total?this.traced/this.total:0;}
 get info(){
  if(this.chapter==='valley'||this.mode==='beast'||this.mode==='crab')return SCENE_MODES[this.mode];
  if(this.chapter==='snow'){
   if(this.mode==='seal')return {tab:'脊纹',title:'补亮眠山脊纹',hint:'沿雪山纹路挥笔补亮 · 可分笔续画',reward:'眠山符'};
   if(this.mode==='chain')return {tab:'霜锁',title:'划断缚梦霜锁',hint:'挥笔划断三道霜锁 · 唤回山间灵息',reward:'裂霜符'};
   return {tab:'灵息',title:'汇聚五缕山灵息',hint:'笔尖触碰五缕灵息 · 收齐唤醒巨兽',reward:'灵息符'};
  }
  const sea=this.chapter==='sea';
  if(this.mode==='seal')return {tab:sea?'潮纹':'星图',title:sea?'补全潮汐纹':'接续散落星图',hint:'沿虚线挥笔补亮 · 可分笔续画',reward:sea?'回潮符':'星图符'};
  if(this.mode==='chain')return {tab:sea?'断缆':'破轨',title:sea?'割断缚潮索':'划破封锁星轨',hint:'笔迹划过就切断 · 不必一笔完成',reward:sea?'断潮符':'破轨符'};
  return {tab:sea?'聚珠':'摘星',title:sea?'聚拢五颗海珠':'摘取五点星芒',hint:sea?'笔尖触碰五颗海珠 · 收齐凝符':'笔尖触碰五点星芒 · 收齐凝符',reward:sea?'海珠符':'聚星符'};
 }
 get radius(){return this.mode==='fire'?115+this.power*18:this.mode==='chain'?260:135;}
 get damage(){return this.mode==='fire'?60+this.power*30:this.mode==='chain'?160:120;}
 center(bounds:Arena){const offset=this.mode==='seal'?180:this.mode==='chain'?210:250;return {x:(bounds.left+bounds.right)/2,y:Math.max(bounds.top+150,Math.min(bounds.top+offset,bounds.bottom-300))};}
 setMode(mode:SceneMode){this.mode=mode;this.reset();}
 slot(bounds:Arena,index=this.slotIndex){return {x:360+(index-1)*92,y:bounds.bottom-51};}
 reset(){
  this.marks=[];this.traced=this.total=0;this.phase='repairing';this.age=this.flash=0;this.bursts=[];this.fragments=[];this.sweeps=[];this.captured.clear();this.captureCenter=null;this.power=1;this.beast.reset();this.crab.reset();this.cancelDrag();
  for(const path of this.paths)for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(length/7);
   for(let j=0;j<n;j++)this.marks.push({a:{x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n},b:{x:a.x+(b.x-a.x)*(j+1)/n,y:a.y+(b.y-a.y)*(j+1)/n},lit:false,length:length/n});
   this.total+=length;
  }
 }
 trace(a:Point,b:Point,bounds:Arena){
  if(this.mode==='fire'){
   if(this.phase!=='repairing'||!valid(a)||!valid(b))return false;
   const segment=clipSegment({a,b},bounds);if(!segment)return false;
   const c=this.center(bounds),before=this.captured.size;
   this.flames.forEach((p,i)=>{if(distanceToSegment({x:c.x+p.x,y:c.y+p.y},segment)<=26)this.captured.add(i);});
   if(this.captured.size===this.flames.length){this.power=this.captured.size;this.captureCenter=c;this.phase='collecting';this.age=0;}
   return before!==this.captured.size;
  }
  return this.paint(a,b,bounds);
 }
 private paint(a:Point,b:Point,bounds:Arena){
  if(this.phase!=='repairing'||!valid(a)||!valid(b))return false;
  const clipped=clipSegment({a,b},bounds);if(!clipped)return false;
  const c=this.center(bounds),segment={a:{x:clipped.a.x-c.x,y:clipped.a.y-c.y},b:{x:clipped.b.x-c.x,y:clipped.b.y-c.y}};
  let added=0;
  for(const mark of this.marks)if(!mark.lit){
   const middle={x:(mark.a.x+mark.b.x)/2,y:(mark.a.y+mark.b.y)/2};
   if(distanceToSegment(middle,segment)<=(this.mode==='beast'?26:this.mode==='chain'?22:16)){
    mark.lit=true;added+=mark.length;
    if(this.mode==='chain'&&this.fragments.length<96)this.fragments.push({...middle,angle:this.marks.indexOf(mark)*2.399,age:0});
   }
  }
  if(!added)return false;
  this.traced+=added;this.flash=.22;
  // Close only tiny gaps flanked by lit marks, never an unvisited endpoint or whole branch.
  for(let i=1;i<this.marks.length-1;i++){
   const mark=this.marks[i],before=this.marks[i-1],after=this.marks[i+1];
   if(!mark.lit&&before.lit&&after.lit&&Math.hypot(before.b.x-mark.a.x,before.b.y-mark.a.y)<.01&&Math.hypot(mark.b.x-after.a.x,mark.b.y-after.a.y)<.01){mark.lit=true;this.traced+=mark.length;}
  }
  if(this.marks.every(mark=>mark.lit)){this.traced=this.total;this.phase='collecting';this.age=0;}
  return true;
 }
 cancelDrag(){this.dragPointer=null;this.dragPoint=null;}
 handle(e:InputEvent,bounds:Arena){
  if(this.dragPointer!==null){
   if(e.id!==this.dragPointer)return true;
   if(e.kind==='cancel'){this.cancelDrag();return true;}
   if(!valid(e)){this.cancelDrag();return true;}
   if(e.kind==='move'||e.kind==='up')this.dragPoint={x:e.x,y:e.y};
   if(e.kind==='up'){
    const slot=this.slot(bounds),canCast=this.validTarget(e,bounds)&&e.y<slot.y-70;
    if(canCast){this.phase='spent';this.age=0;this.bursts.push({center:{x:e.x,y:e.y},age:0,hit:false,kind:this.mode,power:this.power});}
    this.cancelDrag();
   }
   return true;
  }
  if(e.kind!=='down'||this.phase!=='stored'||!valid(e))return false;
  const p=this.slot(bounds);if(Math.abs(e.x-p.x)>36||Math.abs(e.y-p.y)>42)return false;
  this.dragPointer=e.id;this.dragPoint={x:e.x,y:e.y};return true;
 }
 validTarget(p:Point,bounds:Arena){return this.mode==='beast'?this.beast.valid(p,bounds):this.mode==='crab'?this.crab.valid(p,bounds):inArena(p,bounds);}
 advance(dt:number){
  this.age+=dt;this.flash=Math.max(0,this.flash-dt);
  if(this.phase==='collecting'&&this.age>=.9){this.phase='stored';this.age=0;}
  for(const burst of this.bursts)burst.age+=dt;
  this.bursts=this.bursts.filter(burst=>burst.age<.85);
  for(const fragment of this.fragments)fragment.age+=dt;this.fragments=this.fragments.filter(f=>f.age<.75);
  for(const sweep of this.sweeps)sweep.age+=dt;this.sweeps=this.sweeps.filter(s=>s.age<.6);
 }
}
