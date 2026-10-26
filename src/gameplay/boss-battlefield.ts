import type {Point} from '../input/recognizer';
import {distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import type {HualingChapter} from './hualing-chapters';
import {partWorld} from './boss-anatomy';
export type AssaultKind='sun'|'lash'|'tide'|'pearl'|'beam'|'thread'|'frost'|'hoof';
export type BossAssault={id:number;kind:AssaultKind;part:number;from:Point;to:Point;age:number;charge:number;duration:number;resolved:boolean;parried:boolean;major:boolean;resolvedAt:number;contact:Point;released:boolean;announced:boolean;perfect:boolean;nodes:[Point,Point];damage:number};
export type BossScorch={point:Point;age:number};
export type Battlefield={clock:number;next:number;serial:number;attacks:BossAssault[];scorches:BossScorch[];counter:number;combo:number;stroke:Point[];ember:boolean;ritualDone:boolean;flash:number;lastMajor:number;started:boolean;perfect:number;types:Partial<Record<AssaultKind,number>>;parts:number[];minimumTime:number;carry:number|null;shelterUntil:number;shelterHits:number;lastCounter:number;faults:number};
export const createBattlefield=():Battlefield=>({clock:0,next:.1,serial:0,attacks:[],scorches:[],counter:0,combo:0,stroke:[],ember:false,ritualDone:false,flash:0,lastMajor:-1,started:false,perfect:0,types:{},parts:[],minimumTime:0,carry:null,shelterUntil:0,shelterHits:0,lastCounter:-10,faults:0});
export const COMBO_NAMES={valley:'九尾焚天 · 三叠轮攻',sea:'蜃口交潮 · 夺珠还潮',palace:'双掌织命 · 断线逆星',snow:'角霜蹄震 · 护火破冰'} as const;
export const COMBO_LIMIT={valley:8.6,sea:10.2,palace:9.2,snow:10.0} as const;
export function arenaPoint(b:Arena,u:number,v:number):Point{return {x:b.left+48+u*(b.right-b.left-96),y:b.top+125+v*Math.max(160,b.bottom-b.top-250)};}
export function emberSource(b:Arena){return arenaPoint(b,.5,.84);}
export function mirrorStars(b:Arena,cycle:number):[Point,Point]{return [arenaPoint(b,.17,cycle%2?.72:.46),arenaPoint(b,.83,cycle%2?.43:.73)];}
export function eyeOpen(f:Battlefield){return (f.clock%2.1)>1.02;}
export function assaultProgress(a:BossAssault){return Math.max(0,Math.min(1,(a.age-a.charge)/a.duration));}
export function assaultPosition(a:BossAssault):Point{const u=assaultProgress(a);return {x:a.from.x+(a.to.x-a.from.x)*u,y:a.from.y+(a.to.y-a.from.y)*u-(a.kind==='sun'?Math.sin(u*Math.PI)*45:0)};}
export function assaultRadius(a:BossAssault){return a.kind==='frost'?35+assaultProgress(a)*110:a.kind==='sun'?22:34;}
export type Beat={at:number;part:number;kind:AssaultKind;u:number;v:number};
export const COMBO_SCRIPT:Record<HualingChapter,Beat[]>={
 valley:Array.from({length:9},(_,i)=>({at:Math.floor(i/3)*1.8+i%3*.23,part:[0,3,6,1,4,7,2,5,8][i],kind:i%3===2?'lash':'sun',u:[.13,.5,.87][i%3],v:[.83,.59,.89][Math.floor(i/3)]})) as Beat[],
 sea:[{at:0,part:0,kind:'tide',u:.9,v:.42},{at:.45,part:1,kind:'pearl',u:.78,v:.73},{at:1.7,part:1,kind:'tide',u:.1,v:.72},{at:2.5,part:0,kind:'pearl',u:.18,v:.57},{at:3.5,part:0,kind:'tide',u:.9,v:.56},{at:4.9,part:1,kind:'pearl',u:.75,v:.82},{at:5.3,part:1,kind:'tide',u:.1,v:.80},{at:6.7,part:0,kind:'pearl',u:.2,v:.72}],
 palace:[{at:0,part:0,kind:'thread',u:.2,v:.5},{at:.65,part:1,kind:'beam',u:.8,v:.88},{at:1.7,part:1,kind:'thread',u:.8,v:.62},{at:2.8,part:0,kind:'beam',u:.2,v:.82},{at:3.8,part:3,kind:'thread',u:.2,v:.85},{at:4.8,part:4,kind:'beam',u:.8,v:.7},{at:6.1,part:0,kind:'thread',u:.5,v:.68}],
 snow:[{at:0,part:0,kind:'frost',u:.16,v:.63},{at:1.0,part:2,kind:'hoof',u:.78,v:.78},{at:2.3,part:1,kind:'frost',u:.85,v:.59},{at:3.3,part:3,kind:'hoof',u:.23,v:.72},{at:4.6,part:0,kind:'frost',u:.18,v:.80},{at:5.6,part:2,kind:'hoof',u:.8,v:.55},{at:6.5,part:1,kind:'frost',u:.82,v:.78}],
};
export function spawnAssault(f:Battlefield,chapter:HualingChapter,b:Arena,origin:Point,major=false,beat?:Beat){
 const id=++f.serial,part=beat?.part??0,kind:AssaultKind=beat?.kind??({valley:'sun',sea:'tide',palace:'beam',snow:'frost'} as const)[chapter],from=partWorld(chapter,part,origin),to=arenaPoint(b,beat?.u??.72,beat?.v??.8);
 const charge=({sun:.62,lash:.8,tide:.7,pearl:.48,beam:1.1,thread:.7,frost:.72,hoof:.62} as const)[kind],duration=({sun:1.7,lash:1.35,tide:1.85,pearl:3.0,beam:1.2,thread:1.65,frost:1.35,hoof:1.25} as const)[kind];
 const nodes=mirrorStars(b,id),a:BossAssault={id,kind,part,from,to,age:beat?-beat.at:0,charge,duration,resolved:false,parried:false,major,resolvedAt:0,contact:{...to},released:false,announced:false,perfect:false,nodes,damage:kind==='pearl'?3:kind==='lash'||kind==='hoof'?7:5};
 f.attacks.push(a);return a;
}
export type AssaultHooks={block?:(a:Point,b:Point,radius:number)=>boolean;impact:(point:Point,major:boolean,damage?:number)=>void;parry:(point:Point,from:Point,shot?:BossAssault)=>void;launch:(point:Point)=>void;fire?:(point:Point)=>void};
export function comboSolved(chapter:HualingChapter,f:Battlefield){
 if(f.clock<f.minimumTime)return false;
 if(chapter==='valley')return f.counter>=6&&f.parts.length>=6&&(f.types.lash??0)>=1;
 if(chapter==='sea')return (f.types.tide??0)>=2&&(f.types.pearl??0)>=2;
 if(chapter==='palace')return (f.types.thread??0)>=2&&(f.types.beam??0)>=2;
 return (f.types.hoof??0)>=2&&(f.types.frost??0)>=2;
}
export function comboProgress(chapter:HualingChapter,f:Battlefield){return chapter==='valley'?`破尾 ${f.parts.length}/6 · 断鞭 ${f.types.lash??0}/1`:chapter==='sea'?`劈潮 ${f.types.tide??0}/2 · 还珠 ${f.types.pearl??0}/2`:chapter==='palace'?`断丝 ${f.types.thread??0}/2 · 逆星 ${f.types.beam??0}/2`:`破震 ${f.types.hoof??0}/2 · 护火 ${f.types.frost??0}/2`;}
function resolve(f:Battlefield,a:BossAssault,hooks:AssaultHooks,p:Point){
 if(a.resolved)return;a.resolved=a.parried=true;a.resolvedAt=a.age;a.contact={x:p.x,y:p.y};const u=assaultProgress(a);a.perfect=u>=.42&&u<=.72;f.counter++;if(a.perfect)f.perfect++;f.combo=f.clock-f.lastCounter<1.45?f.combo+1:1;f.lastCounter=f.clock;f.flash=.25;f.types[a.kind]=(f.types[a.kind]??0)+1;if(!f.parts.includes(a.part))f.parts.push(a.part);if(f.carry===a.id)f.carry=null;hooks.parry(p,a.from,a);
}
export function advanceBattlefield(f:Battlefield,chapter:HualingChapter,b:Arena,origin:Point,dt:number,attacking:boolean,major:boolean,enraged:boolean,hooks:AssaultHooks,socket?:(part:number)=>Point,pen?:Point){
 if(attacking&&!f.started){f.started=true;f.clock=0;const speed=enraged?.88:1;for(const beat of COMBO_SCRIPT[chapter]){const a=spawnAssault(f,chapter,b,origin,major,{...beat,at:beat.at*speed});a.charge*=speed;a.duration*=speed;}f.minimumTime=Math.max(...f.attacks.map(a=>-a.age+a.charge))+.15;}
 f.clock+=dt;f.flash=Math.max(0,f.flash-dt);f.scorches.forEach(z=>z.age+=dt);f.scorches=f.scorches.filter(z=>z.age<3);
 for(const a of f.attacks){
  const previous=assaultPosition(a);a.age+=dt;if(a.age<0||a.resolved)continue;
  if(!a.released&&socket)a.from=socket(a.part);
  if(!a.announced){a.announced=true;hooks.launch(a.from);}
  if(!a.released&&a.age>=a.charge){a.released=true;if(!a.resolved)hooks.fire?.(a.from);}
  if(a.resolved)continue;
  if(a.kind==='sun'&&a.released&&hooks.block?.(previous,assaultPosition(a),assaultRadius(a))){a.resolved=true;a.resolvedAt=a.age;a.contact=assaultPosition(a);continue;}
  if(a.kind==='pearl'&&f.carry===a.id&&pen&&eyeOpen(f)){const eye=socket?.(3)??partWorld('sea',3,origin);if(Math.hypot(pen.x-eye.x,pen.y-eye.y)<30){resolve(f,a,hooks,eye);continue;}}
  if(a.age>=a.charge+a.duration){
   if(a.kind==='frost'&&f.shelterUntil>=f.clock){f.shelterHits++;resolve(f,a,hooks,emberSource(b));continue;}
   a.resolved=true;a.resolvedAt=a.age;f.combo=0;f.faults++;if(f.carry===a.id)f.carry=null;hooks.impact(a.to,a.major,a.damage);if(a.kind==='sun')f.scorches.push({point:{...a.to},age:0});
  }
 }
 f.attacks=f.attacks.filter(a=>!a.resolved||a.age-a.resolvedAt<.8);
}
function pathLength(path:Point[]){let n=0;for(let i=1;i<path.length;i++)n+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);return n;}
function push(f:Battlefield,a:Point,b:Point){if(!f.stroke.length)f.stroke.push({x:a.x,y:a.y});f.stroke.push({x:b.x,y:b.y});if(f.stroke.length>160)f.stroke=f.stroke.filter((_,i)=>i%2===0||i===f.stroke.length-1);}
export function traceBattlefield(f:Battlefield,chapter:HualingChapter,bounds:Arena,cycle:number,a:Point,b:Point,hooks:AssaultHooks,receiver?:Point){
 push(f,a,b);const start=f.stroke[0],span=Math.hypot(b.x-start.x,b.y-start.y),length=pathLength(f.stroke);
 if(chapter==='snow'&&!f.ember&&distanceToSegment(emberSource(bounds),{a,b})<25)f.ember=true;
 for(const shot of f.attacks){
  if(shot.resolved||shot.age<0)continue;const u=assaultProgress(shot),p=assaultPosition(shot),dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
  if(shot.kind==='pearl'){
   if(shot.age<shot.charge)continue;
   if(f.carry===null&&distanceToSegment(p,{a,b})<24){f.carry=shot.id;}
   const eye=receiver??partWorld('sea',3,{x:360,y:bounds.top+255});
   if(f.carry===shot.id&&eyeOpen(f)&&Math.hypot(b.x-eye.x,b.y-eye.y)<30){resolve(f,shot,hooks,eye);f.stroke=[{...b}];}continue;
  }
  if(shot.kind==='beam'){
   if(shot.age<shot.charge*.65||shot.age>shot.charge+shot.duration*.8)continue;
   const [s,t]=shot.nodes,forward=Math.hypot(start.x-s.x,start.y-s.y)<27&&Math.hypot(b.x-t.x,b.y-t.y)<27,back=Math.hypot(start.x-t.x,start.y-t.y)<27&&Math.hypot(b.x-s.x,b.y-s.y)<27;
   if((forward||back)&&length<span*1.25&&span>180){resolve(f,shot,hooks,{x:(s.x+t.x)/2,y:(s.y+t.y)/2});f.stroke=[{...b}];}continue;
  }
  if(shot.age<shot.charge||u<.18||u>.91)continue;
  if(shot.kind==='sun'||shot.kind==='lash'||shot.kind==='hoof'){
   const target=shot.kind==='sun'?p:{x:shot.from.x+(shot.to.x-shot.from.x)*.72,y:shot.from.y+(shot.to.y-shot.from.y)*.72},vx=shot.to.x-shot.from.x,vy=shot.to.y-shot.from.y,vn=Math.hypot(vx,vy)||1;
   if(span>=42&&length<span*2&&distanceToSegment(target,{a,b})<24&&Math.abs((dx*vx+dy*vy)/(n*vn))<.64){resolve(f,shot,hooks,target);f.stroke=[{...b}];}
  }else if(shot.kind==='tide'){
   if(span>115&&Math.abs(b.x-start.x)>110&&Math.abs(b.y-start.y)<45&&length<span*1.3&&Math.abs(b.y-shot.to.y)<48&&Math.min(start.x,b.x)<p.x&&Math.max(start.x,b.x)>p.x){resolve(f,shot,hooks,{x:p.x,y:shot.to.y});f.stroke=[{...b}];}
  }else if(shot.kind==='thread'){
   const vertical=shot.part%2===0,target=shot.to;
   if(span>65&&length<span*1.4&&distanceToSegment(target,{a,b})<24&&(vertical?Math.abs(dx)/n>.85:Math.abs(dy)/n>.85)){resolve(f,shot,hooks,target);f.stroke=[{...b}];}
  }else if(shot.kind==='frost'&&f.ember&&Math.hypot(b.x-shot.to.x,b.y-shot.to.y)<30){resolve(f,shot,hooks,shot.to);f.ember=false;f.stroke=[{...b}];}
 }
}
function encloses(p:Point,path:Point[]){let inside=false;for(let i=0,j=path.length-1;i<path.length;j=i++){const a=path[i],b=path[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function endBattlefieldStroke(f:Battlefield,chapter:HualingChapter,b:Arena,cancel=false){
 let shield=false;
 if(!cancel&&chapter==='snow'&&f.stroke.length>=10){const path=f.stroke,first=path[0],last=path[path.length-1];let area=0;for(let i=0;i<path.length;i++){const a=path[i],c=path[(i+1)%path.length];area+=a.x*c.y-c.x*a.y;}area=Math.abs(area)/2;
  if(Math.hypot(last.x-first.x,last.y-first.y)<30&&area>4500&&area<35000&&encloses(emberSource(b),path)){f.shelterUntil=f.clock+1.6;shield=true;}
 }
 f.carry=null;f.ember=false;f.stroke=[];return shield;
}
