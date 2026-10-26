import type {Enemy} from '../core/types';
import {WORLD} from '../core/types';
import type {Point} from '../input/recognizer';
import {distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import {ELITE_CATALOG,type EliteKind} from './elite-catalog';
export type FieldShape='parasol'|'lantern'|'thread'|'stele'|'moth'|'claw'|'tentacle'|'pearl'|'boat'|'ray'|'mirror'|'shuttle'|'ring'|'stamp'|'blade'|'ice'|'snowLamp'|'snowball'|'deer'|'flower'|'crack';
export type FieldObject=Point&{id:number;owner:number;kind:EliteKind;shape:FieldShape;origin:Point;prev:Point;vx:number;vy:number;radius:number;age:number;life:number;warn:number;friendly:boolean;dead:boolean;nextTouch:number;angle:number;power:number;index:number;stage:number;nodes:Point[];marks:Set<number>;hit:Set<number>;history:Point[]};
export type FieldEffect=Point&{owner:number;kind:EliteKind;style:'burst'|'cut'|'beam'|'recoil'|'fog'|'ice'|'stamp'|'wave';age:number;life:number;radius:number;nodes:Point[];text:string};
type Round={owner:number;kind:EliteKind;age:number;cycle:number;goal:number;made:number};
export type FieldHit={enemy:Enemy;amount:number};
const FOX={x:WORLD.foxX,y:WORLD.foxY};
const norm=(x:number,y:number)=>{const n=Math.hypot(x,y)||1;return {x:x/n,y:y/n};};
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const mid=(a:Point,b:Point)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
export const FIELD_GOALS:Record<EliteKind,number>={umbrella:3,lantern:3,puppet:3,stele:2,moth:4,reefCrab:2,jelly:3,clam:3,hermit:2,rays:2,mirror:2,weaver:3,bell:3,official:2,blade:3,frostApe:2,crone:3,pineApe:2,deer:2,guardian:2};
/** All enemy attacks live in arena coordinates, independently of the small owner sprite. */
export class EliteField{
 blockProjectile?: (a:Point,b:Point,radius:number)=>boolean;
 objects:FieldObject[]=[];effects:FieldEffect[]=[];rounds=new Map<number,Round>();reinforcements:{owner:number;x:number;y:number}[]=[];
 notices:string[]=[];hits=0;private tone:'parry'|'impact'|'break'|null=null;private serial=0;private queued:FieldHit[]=[];private lure:Point|null=null;private lureAge=0;
 bounds:Arena={left:20,right:700,top:260,bottom:990};
 takeTone(){const tone=this.tone;this.tone=null;return tone;}
 reset(){this.tone=null;this.objects=[];this.effects=[];this.rounds.clear();this.reinforcements=[];this.notices=[];this.queued=[];this.lure=null;this.lureAge=0;this.hits=0;this.serial=0;}
 clear(ids:Set<number>){this.objects=this.objects.filter(o=>!ids.has(o.owner));this.effects=this.effects.filter(o=>!ids.has(o.owner));this.reinforcements=this.reinforcements.filter(o=>!ids.has(o.owner));this.queued=this.queued.filter(h=>!ids.has(h.enemy.id));for(const id of ids)this.rounds.delete(id);}
 private animate(e:Enemy,action:'prepare'|'cast'|'impact'|'parry'|'break',power=1,side=1){const s=e.elite;if(s)s.motion={action,age:0,power,side,serial:(s.motion?.serial??0)+1};}
 private anchor(i:number,n:number,cycle=0){const b=this.bounds,a=-Math.PI/2+i/n*Math.PI*2+cycle*.34;return {x:(b.left+b.right)/2+Math.cos(a)*(b.right-b.left-105)/2,y:(b.top+b.bottom)/2+Math.sin(a)*(b.bottom-b.top-110)/2};}
 private add(e:Enemy,shape:FieldShape,p:Point,index:number,radius=23){
  const kind=e.elite!.kind,o:FieldObject={...p,id:++this.serial,owner:e.id,kind,shape,origin:{...p},prev:{...p},vx:0,vy:0,radius,age:0,life:9,warn:.8,friendly:false,dead:false,nextTouch:0,angle:0,power:1,index,stage:0,nodes:[],marks:new Set(),hit:new Set(),history:[]};
  this.objects.push(o);return o;
 }
 private velocity(o:FieldObject,t:Point,speed:number){const d=norm(t.x-o.x,t.y-o.y);o.vx=d.x*speed;o.vy=d.y*speed;o.angle=Math.atan2(d.y,d.x);}
 private fx(o:Pick<FieldObject,'owner'|'kind'|'x'|'y'>,style:FieldEffect['style'],radius=38,text='',nodes:Point[]=[],life=.55){if(text&&this.tone!=='break'){if(style==='burst')this.tone='impact';else if(this.tone!=='impact')this.tone='parry';}this.effects.push({owner:o.owner,kind:o.kind,x:o.x,y:o.y,style,age:0,life,radius,nodes:nodes.map(p=>({x:p.x,y:p.y})),text});if(this.effects.length>80)this.effects.splice(0,this.effects.length-80);}
 private hit(e:Enemy,amount:number){if(e.hp>0)this.queued.push({enemy:e,amount});}
 private score(o:Pick<FieldObject,'owner'|'kind'|'x'|'y'>,enemies:Enemy[],n=1){const e=enemies.find(e=>e.id===o.owner&&e.hp>0),r=this.rounds.get(o.owner);if(!e?.elite||!r||e.elite.phase==='stagger')return;e.elite.progress+=n;this.animate(e,'parry',.8,o.x<e.x?-1:1);this.fx(o,'burst',40,'反制 +'+n);if(e.elite.progress>=r.goal){this.tone='break';this.animate(e,'break',1.3);e.elite.phase='stagger';e.elite.age=0;e.elite.attackHit=false;this.notices.push(ELITE_CATALOG[r.kind].breakText+' · 全卷反制成功！');for(const q of this.objects)if(q.owner===o.owner)q.dead=true;this.rounds.delete(o.owner);}}
 private blast(o:FieldObject,enemies:Enemy[],radius:number,damage:number,credit=true){this.fx(o,'burst',radius,'破！');for(const e of enemies)if(e.hp>0&&(dist(e,o)<=radius+30||e.id===o.owner&&credit)){this.hit(e,e.id===o.owner?damage:damage*1.2);if(e.id===o.owner&&dist(e,o)>radius+30)this.fx(o,'recoil',20,'',[o,e],.55);}if(credit)this.score(o,enemies);}
 private beam(o:FieldObject,a:Point,b:Point,enemies:Enemy[],damage:number,width=25){this.fx({owner:o.owner,kind:o.kind,x:b.x,y:b.y},'beam',width,'',[{...a},{...b}],.42);for(const e of enemies)if(e.hp>0&&distanceToSegment(e,{a,b})<=width+30)this.hit(e,damage);}
 private returnToOwner(o:FieldObject,enemies:Enemy[],speed=390){o.friendly=true;o.warn=0;o.life=Math.max(o.life,o.age+3);o.hit.clear();const e=enemies.find(e=>e.id===o.owner);if(e){this.velocity(o,e,speed);this.animate(e,'parry',.6,o.x<e.x?-1:1);}this.fx(o,'cut',o.radius+15,'反打');}
 begin(e:Enemy,b:Arena,enemies:Enemy[]){
  this.clear(new Set([e.id]));this.bounds={...b};const s=e.elite!,kind=s.kind,cycle=s.cycle;
  this.animate(e,'prepare');s.progress=0;s.hits=0;s.goal=FIELD_GOALS[kind];s.phase='dash';s.age=0;s.attackHit=false;
  this.rounds.set(e.id,{owner:e.id,kind,age:0,cycle,goal:s.goal,made:0});
  this.notices.push(ELITE_CATALOG[kind].name+' · '+ELITE_CATALOG[kind].hint);
  const spawn=(shape:FieldShape,n:number,r=23)=>Array.from({length:n},(_,i)=>this.add(e,shape,this.anchor(i,n,cycle),i,r));
  switch(kind){
   case 'umbrella':for(const o of spawn('parasol',3,31)){o.life=8;this.velocity(o,FOX,65);}break;
   case 'lantern':for(const o of spawn('lantern',4,23)){o.life=9;this.velocity(o,FOX,48);}break;
   case 'puppet':for(const o of spawn('thread',4,15)){o.nodes=[{x:e.x,y:e.y+10},{x:o.x,y:o.y}];o.life=7;}break;
   case 'stele':for(const o of spawn('stele',4,31)){this.velocity(o,this.anchor((o.index+2)%4,4,cycle),83);o.life=8;}break;
   case 'moth':for(const o of spawn('moth',6,18)){o.life=9;this.velocity(o,FOX,38);}break;
   case 'reefCrab':for(const side of [-1,1]){const o=this.add(e,'claw',{x:side<0?b.left+42:b.right-42,y:FOX.y-100},side<0?0:1,42);this.velocity(o,{x:FOX.x,y:FOX.y-100},65);o.life=8;}break;
   case 'jelly':for(const o of spawn('tentacle',3,18)){const tip={x:FOX.x+(o.index-1)*90,y:FOX.y+70};o.nodes=[{x:o.x,y:o.y},{x:o.x+(tip.x-o.x)*.4+70*Math.sin(o.index*2),y:o.y+(tip.y-o.y)*.5},{...tip}];o.life=7;}break;
   case 'clam':for(const o of spawn('pearl',4,22)){o.warn=1.7;o.life=9;this.velocity(o,e,95);}break;
   case 'hermit':for(const o of spawn('boat',3,30)){this.velocity(o,this.anchor((o.index+1)%3,3,cycle),67);o.life=9;}break;
   case 'rays':for(const o of spawn('ray',2,36)){this.velocity(o,this.anchor((o.index+1)%2,2,cycle),95);o.life=9;}break;
   case 'mirror':for(const o of spawn('mirror',3,29)){o.life=8;o.angle=Math.atan2(FOX.y-o.y,FOX.x-o.x);o.warn=1.4;}break;
   case 'weaver':{
    const sh=spawn('shuttle',2,23);for(const o of sh){o.life=8;this.velocity(o,this.anchor(o.index+1,2,cycle),65);}
    for(let i=0;i<3;i++){const o=this.add(e,'thread',this.anchor(i,3,cycle),i,13);o.nodes=[this.anchor(i,3,cycle),this.anchor((i+1)%3,3,cycle)];o.life=7;}break;
   }
   case 'bell':for(let i=0;i<3;i++){const o=this.add(e,'ring',this.anchor(i,3,cycle),i,28);o.warn=.7+i*.65;o.life=7.5;o.power=1;}break;
   case 'official':for(const o of spawn('stamp',3,40)){o.warn=2.5;o.life=6;o.stage=0;}break;
   case 'blade':for(const o of spawn('blade',3,27)){o.life=8;this.velocity(o,this.anchor(o.index+1,3,cycle),130);}break;
   case 'frostApe':for(const o of spawn('ice',4,32)){o.life=8;this.velocity(o,this.anchor(o.index+2,4,cycle),87);}break;
   case 'crone':for(const o of spawn('snowLamp',3,22)){o.life=9;this.velocity(o,this.anchor(o.index+1,3,cycle),65);}break;
   case 'pineApe':for(const o of spawn('snowball',3,22)){o.life=9;this.velocity(o,this.anchor(o.index+1,3,cycle),83);}break;
   case 'deer':{
    const front=this.add(e,'deer',{x:b.left+65,y:FOX.y},0,34),rear=this.add(e,'deer',{x:b.right-65,y:b.top+115},1,25);front.life=rear.life=9;this.velocity(front,{x:b.right-65,y:FOX.y},110);this.velocity(rear,{x:b.left+65,y:b.top+115},55);
    for(const o of spawn('flower',5,17)){o.warn=1;o.life=9;this.velocity(o,front,65);}break;
   }
   case 'guardian':{
    for(let i=0;i<3;i++){const end=this.anchor(i+1,4,cycle),o=this.add(e,'crack',end,i,18);o.life=8;o.nodes=[{x:e.x,y:e.y+70},{x:(e.x+end.x)/2+(i-1)*80,y:(e.y+end.y)/2},end];}
    break;
   }
  }
  // Keep a lone giant from spawning an unlimited amount of runtime objects.
  if(this.objects.length>48)this.objects.splice(0,this.objects.length-48);
 }
 private touch(o:FieldObject,a:Point,b:Point,radius:number){
  if(o.dead)return false;
  if(o.shape==='thread'||o.shape==='tentacle'||o.shape==='crack')return o.nodes.slice(1).some((p,i)=>segmentsNear(a,b,o.nodes[i],p,radius+9));
  if(o.shape==='claw'&&segmentsNear(a,b,o.origin,o,radius+12))return true;
  if(o.shape==='ring'){const d=distanceToSegment(o,{a,b}),far=Math.max(dist(a,o),dist(b,o));return d<=o.radius+radius+8&&far>=o.radius-radius-8;}
  return distanceToSegment(o,{a,b})<=o.radius+radius;
 }
 trace(a:Point,b:Point,radius:number,enemies:Enemy[],now:number){
  if(![a.x,a.y,b.x,b.y,radius,now].every(Number.isFinite))return {hits:[] as FieldHit[],messages:[] as string[]};
  this.lure={...b};this.lureAge=0;const d=norm(b.x-a.x,b.y-a.y),length=dist(a,b);
  for(const o of [...this.objects]){
   if(!this.rounds.has(o.owner)||!this.touch(o,a,b,radius)||now<o.nextTouch)continue;
   o.nextTouch=now+.28;const owner=enemies.find(e=>e.id===o.owner&&e.hp>0);if(!owner)continue;this.animate(owner,'parry',.35,o.x<owner.x?-1:1);
   switch(o.shape){
    case 'parasol':if(!o.friendly)this.returnToOwner(o,enemies);break;
    case 'lantern':o.friendly=true;o.vx=d.x*250;o.vy=d.y*250;o.warn=0;this.fx(o,'cut',30,'赶灯');break;
    case 'thread':{
     o.dead=true;this.fx(o,'recoil',24,'断线',o.nodes,.55);
     if(o.kind==='puppet'){this.beam(o,b,owner,enemies,42,22);this.hit(owner,35);}else{this.beam(o,a,{x:b.x+d.x*450,y:b.y+d.y*450},enemies,65,25);this.hit(owner,26);}this.score(o,enemies);break;
    }
    case 'tentacle':{
     o.dead=true;this.fx(o,'recoil',30,'切断触须',o.nodes,.7);for(let i=1;i<o.nodes.length;i++)this.beam(o,o.nodes[i],o.nodes[i-1],enemies,35,26);this.hit(owner,52);this.score(o,enemies);break;
    }
    case 'stele':case 'boat':case 'ice':case 'snowball':{
     if(o.shape==='snowball'&&o.vx*d.x+o.vy*d.y<-35){this.beam(o,o,{x:o.x+d.x*240,y:o.y+d.y*240},enemies,50+o.radius,60);this.blast(o,enemies,65+o.radius*.8,35+o.radius);o.dead=true;break;}
     o.friendly=true;o.warn=0;const speed=o.shape==='snowball'?290:245;this.velocity(o,{x:o.x+d.x*100,y:o.y+d.y*100},speed);o.life=Math.max(o.life,o.age+3);o.power+=.3;this.fx(o,'wave',o.radius+14,o.shape==='boat'?'掀浪':o.shape==='snowball'?'拨雪':'推撞');break;
    }
    case 'claw':o.friendly=true;o.warn=0;o.vx=d.x*230;o.vy=d.y*230;this.fx(o,'cut',45,'拨偏巨钳');break;
    case 'moth':o.dead=true;this.blast(o,enemies,85,30);break;
    case 'pearl':o.friendly=true;o.warn=0;o.vx=d.x*330;o.vy=d.y*330;this.fx(o,'cut',27,'截珠');break;
    case 'ray':o.friendly=true;this.velocity(o,{x:o.x+d.x*100,y:o.y+d.y*100},190);this.hit(owner,18);this.fx(o,'wave',40,'转向');break;
    case 'mirror':{
     const angle=Math.atan2(d.y,d.x);if(o.friendly&&o.marks.has(0)&&Math.cos(angle-o.angle)>.94)break;
     o.angle=angle;o.friendly=true;o.stage++;const end=rayEnd(o,d,this.bounds);this.beam(o,o,end,enemies,85,25);this.fx(o,'cut',30,'转镜');if(distanceToSegment(owner,{a:o,b:end})<=55&&!o.marks.has(0)){o.marks.add(0);this.score(o,enemies);}break;
    }
    case 'shuttle':o.dead=true;this.hit(owner,35);this.fx(o,'recoil',30,'断梭',[o,owner]);this.score(o,enemies);break;
    case 'ring':{
     // A large ring can be parried at separate arcs, never by rubbing the same patch.
     const angle=Math.atan2(b.y-o.y,b.x-o.x),sector=Math.floor((angle+Math.PI)/(.5*Math.PI))%4;
     if(o.marks.has(sector)||o.marks.size>=2)break;o.marks.add(sector);const p={x:o.x+Math.cos(angle)*o.radius,y:o.y+Math.sin(angle)*o.radius};this.beam(o,p,owner,enemies,60,27);this.score({...o,...p},enemies);this.fx({...o,...p},'wave',45,'反敲');break;
    }
    case 'stamp':o.friendly=true;o.warn=Math.min(o.warn,o.age+.8);o.vx=d.x*160;o.vy=d.y*160;this.fx(o,'stamp',42,'移印');break;
    case 'blade':if(!o.friendly){if(o.vx*d.x+o.vy*d.y>=-15){o.friendly=true;this.velocity(o,{x:o.x+d.x*100,y:o.y+d.y*100},330);this.fx(o,'cut',30,'借刃');}else{o.dead=true;this.beam(o,o,owner,enemies,66,23);this.score(o,enemies);this.fx(o,'burst',45,'碎刃反噬');}}break;
    case 'snowLamp':{
     o.dead=true;this.effects=this.effects.filter(f=>!(f.owner===o.owner&&f.style==='fog'&&f.text===String(o.id)));
     const route=[...o.history,o];for(let i=1;i<route.length;i++)this.beam(o,route[i-1],route[i],enemies,20,43);this.hit(owner,48);this.score(o,enemies);this.fx(o,'wave',75,'驱雪');break;
    }
    case 'deer':this.hit(owner,o.index===1?28:16);this.fx(o,'cut',35,o.index?'打断补给':'截鹿');if(o.index===1&&o.stage===0){this.score(o,enemies);o.stage=1;o.vx*=.6;o.vy*=.6;}break;
    case 'flower':o.dead=true;this.fx(o,'ice',62,'',[],3);this.hit(owner,12);this.fx(o,'cut',28,'截霜花');break;
    case 'crack':{
     for(let i=1;i<o.nodes.length;i++)for(let k=0;k<4;k++){const key=(i-1)*4+k;if(o.marks.has(key))continue;const p={x:o.nodes[i-1].x+(o.nodes[i].x-o.nodes[i-1].x)*(k+.5)/4,y:o.nodes[i-1].y+(o.nodes[i].y-o.nodes[i-1].y)*(k+.5)/4};if(distanceToSegment(p,{a,b})<=radius+22){o.marks.add(key);this.hit(owner,8);this.fx({...o,...p},'cut',22,'回流');}}
     if(o.marks.size>=6){o.dead=true;this.beam(o,o.nodes.at(-1)!,owner,enemies,85,32);this.score(o,enemies);}break;
    }
   }
  }
  // Painting a long route attracts moths; sweeping the flock can start a chain burst.
  for(const f of this.effects)if(f.style==='fog'&&distanceToSegment(f,{a,b})<=radius+f.radius){f.age=f.life;this.fx({...f},'cut',20,'扫雪');}
  this.objects=this.objects.filter(o=>!o.dead);
  return this.drain();
 }
 drain(){const hits=this.queued.splice(0),messages=this.notices.splice(0);return {hits,messages};}
 advance(dt:number,enemies:Enemy[],hurt:(n:number)=>void){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);this.lureAge+=dt;
  const alive=new Set(enemies.filter(e=>e.elite&&e.hp>0).map(e=>e.id));for(const id of this.rounds.keys())if(!alive.has(id))this.clear(new Set([id]));
  for(const f of this.effects)f.age+=dt;this.effects=this.effects.filter(f=>f.age<f.life);
  for(const r of this.rounds.values())r.age+=dt;
  for(const o of [...this.objects]){
   if(o.dead||!this.rounds.has(o.owner))continue;const owner=enemies.find(e=>e.id===o.owner&&e.hp>0);if(!owner)continue;
   o.prev={x:o.x,y:o.y};o.age+=dt;const active=o.age>=o.warn;
   if(active&&!o.friendly&&!o.hit.has(-2)){o.hit.add(-2);this.animate(owner,'cast',['claw','stele','stamp'].includes(o.shape)?1.2:1,o.x<owner.x?-1:1);}
   if(o.shape==='crack'||o.shape==='thread'||o.shape==='tentacle'){
    if(o.shape==='thread'&&o.kind==='puppet'){o.nodes[0]={x:owner.x,y:owner.y+15};const p=this.anchor(o.index,4,owner.elite!.cycle);o.nodes[1]={x:p.x+Math.sin(o.age+o.index)*18,y:p.y+Math.cos(o.age+o.index)*18};o.x=o.nodes[1].x;o.y=o.nodes[1].y;}
    if(o.shape==='tentacle'){const end=o.nodes[2],d=norm(FOX.x-end.x,FOX.y-end.y);if(active){end.x+=d.x*13*dt;end.y+=d.y*13*dt;}}
    if(active&&o.age>=5.8&&o.stage===0){o.stage=1;const touched=o.nodes.slice(1).some((p,i)=>distanceToSegment(FOX,{a:o.nodes[i],b:p})<28);if(touched){this.hits++;hurt(12);}}
   }else if(o.shape==='ring'){
    if(active){const previous=o.radius;o.radius+=62*dt;if(previous<dist(o,FOX)+16&&o.radius>=dist(o,FOX)-16&&o.stage===0){const a=Math.atan2(FOX.y-o.y,FOX.x-o.x),sector=Math.floor((a+Math.PI)/(.5*Math.PI))%4;o.stage=1;if(!o.marks.has(sector)){this.hits++;hurt(12);}}}
   }else if(o.shape==='mirror'){
    if(active&&o.age>2.7+o.index*.6&&o.stage===0){o.stage=1;const end=rayEnd(o,{x:Math.cos(o.angle),y:Math.sin(o.angle)},this.bounds);this.fx(o,'beam',17,'',[o,end],.5);if(distanceToSegment(FOX,{a:o,b:end})<32){this.hits++;hurt(14);}}
   }else if(o.shape==='stamp'){
    if(o.friendly){o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=Math.exp(-dt*1.8);o.vy*=Math.exp(-dt*1.8);}
    if(active&&o.stage===0){this.animate(owner,'impact',1.2);o.stage=1;o.dead=true;if(o.friendly){this.blast(o,enemies,100,70);this.fx(o,'stamp',100,'落印！');}else{this.fx(o,'stamp',70,'落印');if(dist(o,FOX)<85){this.hits++;hurt(18);}if(this.reinforcements.filter(r=>r.owner===o.owner).length<2)this.reinforcements.push({owner:o.owner,x:o.x,y:o.y});}}
   }else{
    if(active){
     if(o.shape==='parasol'&&!o.friendly){const t=norm(owner.x-o.x,owner.y-o.y);o.vx+=(t.x*40+Math.sin(o.age*2+o.index)*25)*dt;o.vy+=t.y*40*dt;}
     if(o.shape==='lantern'&&!o.friendly){const d=norm(FOX.x-o.x,FOX.y-o.y);o.vx=d.x*38-d.y*28;o.vy=d.y*38+d.x*28;}
     if(o.shape==='moth'){const target=this.lure&&this.lureAge<1.6?this.lure:FOX;this.velocity(o,target,this.lure&&this.lureAge<1.6?125:36);}
     if(o.shape==='snowball')o.radius=Math.min(43,22+(o.age-o.warn)*3.5);
     if(o.shape==='flower'){const front=this.objects.find(q=>q.owner===o.owner&&q.shape==='deer'&&q.index===0&&!q.dead);if(front)this.velocity(o,front,75);}
     if(o.shape==='blade'&&!o.friendly&&o.age>3.2&&o.stage===0){o.stage=1;this.velocity(o,o.origin,150);}
     o.x+=o.vx*dt;o.y+=o.vy*dt;
     if(!o.friendly&&['parasol','lantern','moth','blade','ice','snowball'].includes(o.shape)&&this.blockProjectile?.(o.prev,o,o.radius)){o.dead=true;this.fx(o,'cut',o.radius+15,'挡');continue;}
     if(o.shape==='snowLamp'&&Math.floor(o.age*2)!==Math.floor((o.age-dt)*2)){o.history.push({x:o.x,y:o.y});if(o.history.length>12)o.history.shift();this.fx(o,'fog',57,String(o.id),[],2.6);}
     if(o.shape==='deer'&&o.index===0&&o.stage===0){const ice=this.effects.find(f=>f.owner===o.owner&&f.style==='ice'&&dist(f,o)<f.radius+o.radius);if(ice){o.stage=1;o.vx=o.vy=0;this.hit(owner,105);this.score(o,enemies);this.fx(o,'burst',60,'滑倒！');}}
     if(o.shape==='flower'){const front=this.objects.find(q=>q.owner===o.owner&&q.shape==='deer'&&q.index===0&&!q.dead);if(front&&dist(front,o)<front.radius+o.radius){o.dead=true;owner.hp=Math.min(owner.maxHp,owner.hp+18);}}
     if(o.shape==='pearl'&&!o.friendly&&dist(o,owner)<45){owner.hp=Math.min(owner.maxHp,owner.hp+24);o.dead=true;this.fx(o,'wave',30,'回珠 +24');}
     if(o.friendly&&o.shape!=='deer'){
      for(const e of enemies){if(e.hp<=0||o.hit.has(e.id))continue;if(distanceToSegment(e,{a:o.prev,b:o})<=o.radius+32){o.hit.add(e.id);this.hit(e,e.id===o.owner?(o.shape==='snowball'?50+o.radius*2:85):65);this.fx(o,'burst',o.radius+20,'命中');if(e.id===o.owner){this.score(o,enemies);o.dead=true;break;}}}
     }else if(!['shuttle','snowLamp','pearl'].includes(o.shape)&&distanceToSegment(FOX,{a:o.prev,b:o})<o.radius+18&&!o.hit.has(-1)){o.hit.add(-1);this.hits++;hurt(o.shape==='claw'?20:12);this.fx(o,'burst',38,'');if(o.shape!=='deer')o.dead=true;}
     const b=this.bounds;if(o.x<b.left+o.radius||o.x>b.right-o.radius){o.x=Math.max(b.left+o.radius,Math.min(b.right-o.radius,o.x));o.vx*=-1;}if(o.y<b.top+o.radius||o.y>b.bottom-o.radius){o.y=Math.max(b.top+o.radius,Math.min(b.bottom-o.radius,o.y));o.vy*=-1;}
    }
   }
   if(o.age>=o.life)o.dead=true;
  }
  // Physical collisions are independent of input sampling: pushed objects can collide a moment later.
  const moving=this.objects.filter(o=>!o.dead&&['lantern','stele','boat','ice','snowball','claw','ray','stamp'].includes(o.shape));
  for(let i=0;i<moving.length;i++)for(let j=i+1;j<moving.length;j++){
   const a=moving[i],b=moving[j];if(a.dead||b.dead||a.owner!==b.owner||(!a.friendly&&!b.friendly)||dist(a,b)>a.radius+b.radius)continue;
   a.dead=b.dead=true;this.blast({...a,...mid(a,b)},enemies,a.shape==='snowball'?125:105,a.shape==='claw'?120:90);if(['claw','ray','lantern','boat'].includes(a.shape))this.score(a,enemies);this.fx({...a,...mid(a,b)},'burst',105,a.shape==='claw'?'双钳相撞':a.shape==='ray'?'双鳐破镜':'连撞！');
  }
  // Moth explosions propagate only to nearby moths, with a bounded queue.
  const bursts=this.effects.filter(f=>f.kind==='moth'&&f.style==='burst'&&f.age<=dt+1e-7&&f.text==='破！');
  for(const f of bursts)for(const o of this.objects)if(o.shape==='moth'&&!o.dead&&o.owner===f.owner&&dist(f,o)<100){o.dead=true;this.hit(enemies.find(e=>e.id===o.owner)!,25);this.score(o,enemies);this.fx(o,'burst',65,'连爆');}
  for(const r of this.rounds.values()){
   if(r.kind==='bell'&&r.age>3.2&&r.made===0){r.made++;const owner=enemies.find(e=>e.id===r.owner);if(owner){this.animate(owner,'cast');const o=this.add(owner,'ring',this.anchor(1,3,r.cycle),3,35);o.life=5;}}
   if(r.kind==='deer'&&r.age>4.5&&r.made===0){r.made++;const owner=enemies.find(e=>e.id===r.owner),rear=this.objects.find(o=>o.owner===r.owner&&o.shape==='deer'&&o.index===1);if(owner&&rear?.stage===0){for(let i=0;i<2;i++){const o=this.add(owner,'flower',this.anchor(i+2,4,r.cycle),5+i,17);o.life=4;}}}
  }
  this.objects=this.objects.filter(o=>!o.dead&&alive.has(o.owner));
 }
}
function segmentsNear(a:Point,b:Point,c:Point,d:Point,r:number){
 const cross=(p:Point,q:Point,t:Point)=>(q.x-p.x)*(t.y-p.y)-(q.y-p.y)*(t.x-p.x);
 if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))<=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))+1e-8&&Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))<=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))+1e-8)return true;
 return Math.min(distanceToSegment(a,{a:c,b:d}),distanceToSegment(b,{a:c,b:d}),distanceToSegment(c,{a,b}),distanceToSegment(d,{a,b}))<=r;
}
function rayEnd(p:Point,d:Point,b:Arena){const candidates=[d.x>0?(b.right-p.x)/d.x:d.x<0?(b.left-p.x)/d.x:Infinity,d.y>0?(b.bottom-p.y)/d.y:d.y<0?(b.top-p.y)/d.y:Infinity].filter(t=>t>=0),t=Math.min(...candidates,1100);return {x:p.x+d.x*t,y:p.y+d.y*t};}


