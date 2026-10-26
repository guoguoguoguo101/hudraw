import type {Game} from './game';
import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import {distanceToSegment} from '../input/line-interaction-geometry';
import {chapterMonsters} from './paper-monsters';
import {chapterElites} from './hualing-elites';
import {type HualingChapter} from './hualing-chapters';
export const MOUNTAIN_CHAPTERS:HualingChapter[]=['valley','sea','palace','snow'];
const TITLES={valley:['落笔秋径','灯影追风','纸翼过隘','赤林围猎','衔日初战','暮色回廊','四面来风','百鬼夜行','双煞守关','九尾焚天'],sea:['浅湾试墨','鱼群回游','珊瑚暗流','礁间逐浪','蜃潮初战','鲸背漂流','双潮夹岸','月湾珠雨','深海双卫','镇潮归梦'],palace:['云阶启卷','星鸢穿庭','银铃悬道','日宫疾行','傀帝初战','星梭回廊','四极巡守','月阙流光','双使封门','司辰归位'],snow:['霁雪初行','雪貂逐迹','寒鸮越岭','冰甲围阵','霜魇初战','风雪孤径','冻泉追影','月下守梦','双灵踏雪','巨兽苏灵']} as const;
const MODS=[{name:'初墨',text:'循序交锋 · 击妖积累经验',hp:.8,speed:.85,cap:7},{name:'群涌',text:'薄甲群妖 · 连斩快速成型',hp:.64,speed:1,cap:11},{name:'疾影',text:'飞妖增多 · 留意突进前摇',hp:.85,speed:1.2,cap:9},{name:'重甲',text:'厚甲围阵 · 集中笔力破局',hp:1.15,speed:.88,cap:8},{name:'试锋',text:'本章首领 · 拆招再追心',hp:.9,speed:1,cap:9}] as const;
export const MOUNTAIN_LEVELS=MOUNTAIN_CHAPTERS.flatMap((chapter,c)=>Array.from({length:10},(_,i)=>({id:c*10+i,chapter,number:i+1,title:TITLES[chapter][i],modifier:MODS[i%5],boss:(i+1)%5===0,stage:i<3?'sunset' as const:i<7?'wind' as const:'night' as const})));
export type RunSupport='flower'|'thunder'|'beast'|'crab'|'heal';
export const SUPPORT_NAMES:Record<RunSupport,string>={flower:'枫舞附笔',thunder:'雷符附笔',beast:'纸虎协战',crab:'蟹将冲阵',heal:'归元护卷'};
export const SUPPORT_TEXT:Record<RunSupport,string>={flower:'每隔14秒可附笔枫舞，持续12秒',thunder:'每隔16秒可附笔雷符，持续12秒',beast:'获得虎符，拖出召唤；18秒后可再领',crab:'获得蟹将符，拖出直线冲阵；18秒后可再领',heal:'立即恢复35生命，此后每段间隙恢复8生命'};
export const MOUNTAIN_BALANCE={picks:5,xpCosts:[8,18,28,40,54],roomGoals:[24,36,0,48],inkCostScale:.85,inkRegenScale:.7,clearInk:10,quickClearHeal:6,dragonInk:18,dragonCooldown:14,chainInterval:.32,chainGap:1.75,inkEveryKills:6,inkPickup:28,eliteInk:42,pickupLife:24,emergencyCooldown:16};
export type InkPickup={id:number;x:number;y:number;born:number;amount:number};
export type MountainFormation='chain'|'fan'|'pincer'|'ring';
export const FORMATION_NAMES:Record<MountainFormation,string>={chain:'长队穿行',fan:'扇面涌入',pincer:'双路夹击',ring:'三面合围'};
type Formation={kind:MountainFormation;count:number;emitted:number;edge:number;lane:number;look:number};
type Chain={edge:number;lane:number;age:number;duration:number};
export class MountainRun{
 levelId:number|null=null;room=0;age=0;roomAge=0;spawn=0;roomStartKills=0;spawned=0;roomKills=0;finalStarted=false;support:RunSupport|null=null;supportChoices:RunSupport[]=[];supportPanel=false;supportReady=0;dragonReady=0;granted=0;cleared=false;completed=new Set<number>();private lastRoom=-1;
 get running(){return this.levelId!==null&&!this.cleared;}
 get level(){return this.levelId===null?null:MOUNTAIN_LEVELS[this.levelId];}
 xp=0;xpSerial=0;lastXp=0;lastXpAt=-100;pickups:InkPickup[]=[];inkSerial=0;lastInkAt=-100;lastInkAmount=0;
 private pickupId=0;private ordinaryKills=0;private emergencyAt=0;private upgradeAt=Infinity;
 formation:MountainFormation='chain';waveSerial=0;waveAt=-100;entryWarnings:Point[]=[];
 private pack:Formation|null=null;private chainNumber=0;private chains=new Map<number,Chain>();
 get xpNeeded(){return MOUNTAIN_BALANCE.xpCosts[this.granted]??0;}
 get growthComplete(){return this.granted>=MOUNTAIN_BALANCE.picks;}
 get nextFormation(){return (this.pack&&this.pack.emitted===0?'将至 · ':'')+FORMATION_NAMES[this.formation];}
 get roomName(){return ['起笔 · 巡山','泼墨 · 破围','锋试 · 精英','成势 · 狂潮','落印 · 守关'][this.room];}
 reset(){this.levelId=null;this.room=0;this.age=this.roomAge=this.spawn=this.spawned=this.roomKills=this.granted=0;this.finalStarted=this.supportPanel=this.cleared=false;this.support=null;this.supportChoices=[];this.lastRoom=-1;this.supportReady=this.dragonReady=0;this.xp=this.xpSerial=this.ordinaryKills=0;this.lastXpAt=this.lastInkAt=-100;this.lastXp=this.lastInkAmount=0;this.pickups=[];this.pickupId=this.inkSerial=0;this.emergencyAt=0;this.upgradeAt=Infinity;this.pack=null;this.chainNumber=this.waveSerial=0;this.waveAt=-100;this.formation='chain';this.entryWarnings=[];this.chains.clear();}
 begin(g:Game,id:number){this.reset();this.levelId=id;g.hualing.upgrades.reset();g.hualing.upgrades.runMode=true;g.hualing.upgrades.choiceSeed=id*97+734;g.hualing.upgrades.growth=true;g.hualing.sceneSeal.phase='spent';g.hualing.journey.preview(this.level!.stage);g.hualing.journey.autoEvents=false;g.hualing.journey.automatic=false;}
 grant(g:Game,n:number){const u=g.hualing.upgrades,take=Math.max(0,Math.min(n,MOUNTAIN_BALANCE.picks-this.granted));this.granted+=take;u.pending+=take;}
 killed(g:Game,e:Enemy){
  if(!this.running)return;
  const amount=e.chapterBoss?12:e.elite?6:1;this.xp+=amount;this.lastXp=amount;this.lastXpAt=this.age;this.xpSerial++;
  this.chains.delete(e.id);
  if(e.elite||e.chapterBoss)this.dropInk(g,e.x,e.y,MOUNTAIN_BALANCE.eliteInk);
  else if(++this.ordinaryKills%MOUNTAIN_BALANCE.inkEveryKills===0)this.dropInk(g,e.x,e.y);
 }
 dropInk(g:Game,x:number,y:number,amount:number=MOUNTAIN_BALANCE.inkPickup){
  if(this.pickups.length>=3)return;
  const b=g.hualing.bounds;this.pickups.push({id:++this.pickupId,x:Math.max(b.left+42,Math.min(b.right-42,x)),y:Math.max(b.top+60,Math.min(b.bottom-95,y)),born:this.age,amount});
 }
 collectInk(g:Game,id:number){
  if(!this.running||!g.active||this.supportPanel||g.hualing.upgrades.blocked)return false;
  const p=this.pickups.find(p=>p.id===id);if(!p||g.ink.currentInk>=g.ink.maxInk)return false;
  const amount=Math.min(p.amount,g.ink.maxInk-g.ink.currentInk);g.ink.currentInk+=amount;this.pickups=this.pickups.filter(p=>p.id!==id);this.inkSerial++;this.lastInkAmount=Math.round(amount);this.lastInkAt=this.age;return true;
 }
 collectAlong(g:Game,a:Point,b:Point){for(const p of [...this.pickups])if(distanceToSegment(p,{a,b})<=42)this.collectInk(g,p.id);}
 /** Enemies entering together follow the same curve, with their spawn delay preserving the train. */
 steer(g:Game,e:Enemy,dt:number){
  const chain=this.chains.get(e.id);if(!chain||e.elite||e.chapterBoss)return false;
  if(e.ai==='Hit'||e.shock>0||g.hualing.upgrades.trail.isSlowed(e.id)){this.chains.delete(e.id);return false;}
  chain.age+=dt;if(chain.age>=chain.duration){this.chains.delete(e.id);e.ai='Approach';e.stateAge=0;return false;}
  e.age+=dt;e.stateAge+=dt;e.ai='Approach';const p=this.chainPoint(g,chain,chain.age/chain.duration);e.x=p.x;e.y=p.y;e.vx=e.vy=0;return true;
 }
 private chainPoint(g:Game,c:Chain,u:number){
  const b=g.hualing.bounds,w=b.right-b.left-64,h=Math.max(100,b.bottom-b.top-205),wave=Math.sin(u*Math.PI*2)*45;
  if(c.edge%2===0)return{x:b.left+32+w*(c.edge===0?u:1-u),y:b.top+72+h*c.lane+wave};
  return{x:b.left+66+(w-68)*c.lane+wave,y:b.top+50+h*(c.edge===1?u:1-u)};
 }
 private formationPoint(g:Game,f:Formation,slot:number):Point{
  if(f.kind==='chain')return this.chainPoint(g,{edge:f.edge,lane:f.lane,age:0,duration:5.4},0);
  const b=g.hualing.bounds;
  const edge=f.kind==='pincer'?(slot%2===0?0:2):f.kind==='ring'?[0,1,2][slot%3]:f.edge;
  const lane=f.kind==='fan'?.17+.66*slot/Math.max(1,f.count-1):f.kind==='pincer'?.3+Math.floor(slot/2)*.28:.24+Math.floor(slot/3)*.42;
  return{x:edge===0?b.left+32:edge===2?b.right-32:b.left+58+(b.right-b.left-116)*lane,y:edge===1?b.top+34:edge===3?b.bottom-165:b.top+72+Math.max(100,b.bottom-b.top-240)*lane};
 }
 advance(g:Game,dt:number){
  if(!this.running||!g.active||g.hualing.frozen||this.supportPanel)return;const l=this.level!;this.age+=dt;this.roomAge+=dt;this.roomKills=g.kills-this.roomStartKills;
  this.pickups=this.pickups.filter(p=>this.age-p.born<MOUNTAIN_BALANCE.pickupLife);
  if(g.ink.currentInk<20&&!this.pickups.length&&this.age>=this.emergencyAt){this.dropInk(g,360,g.hualing.bounds.bottom-150);this.emergencyAt=this.age+MOUNTAIN_BALANCE.emergencyCooldown;}
  const u=g.hualing.upgrades;
  if(!this.growthComplete&&!u.pending&&!u.blocked&&this.xp>=this.xpNeeded){
   if(this.upgradeAt===Infinity)this.upgradeAt=this.age+.7;
   if(this.age>=this.upgradeAt){this.xp-=this.xpNeeded;this.grant(g,1);this.upgradeAt=Infinity;}
  }else if(this.xp<this.xpNeeded)this.upgradeAt=Infinity;
  if(g.hualing.bosses.failed){g.life=0;g.state='lose';g.events.push({type:'lose'});return;}
  if(this.lastRoom!==this.room){this.lastRoom=this.room;this.roomAge=this.spawn=this.spawned=0;this.pack=null;this.entryWarnings=[];this.roomStartKills=g.kills;this.roomKills=0;g.hualing.say(this.roomName+' · '+l.modifier.text);if(this.room===2){const kinds=chapterElites(l.chapter);g.summonHualingElite(kinds[(l.number+1)%5]);if(l.number===9)g.summonHualingElite(kinds[(l.number+3)%5]);}}
  if(this.room===4){
   if(u.blocked||u.pending)return;
   if(!this.finalStarted){this.finalStarted=true;if(l.boss)g.summonHualingBoss();else g.summonHualingElite(chapterElites(l.chapter)[(l.number-1)%5]);}
   else if(!g.enemies.some(e=>e.elite||e.chapterBoss)){this.cleared=true;this.completed.add(l.id);g.state='win';g.events.push({type:'win'});}return;
  }
  if(this.room===2){if(!g.enemies.some(e=>e.elite)){this.supportChoices=(['flower','thunder','beast','crab','heal'] as RunSupport[]).map(id=>({id,r:g.random()})).sort((a,b)=>a.r-b.r).slice(0,3).map(v=>v.id);this.supportPanel=true;this.room++;}return;}
  const goal=MOUNTAIN_BALANCE.roomGoals[this.room]+Math.floor((l.number-1)*1.6),basePool=chapterMonsters(l.chapter),pool=l.modifier.name==='疾影'?[...basePool,...basePool.filter(m=>m.kind==='crow')]:basePool;
  this.spawn-=dt;const normal=g.enemies.filter(e=>!e.elite&&!e.chapterBoss).length,cap=l.modifier.cap+3;
  // Refill a nearly empty arena promptly; busy screens stay bounded by the same cap.
  if(!this.pack&&normal<=2&&this.spawn>.35)this.spawn=.35;
  if(this.spawned<goal&&normal<cap&&this.spawn<=0){
   if(!this.pack){
    const sequences:MountainFormation[][]=[['chain','fan','pincer','chain','ring','fan'],['pincer','chain','ring','fan','chain','pincer'],['ring','chain','pincer','fan','ring','chain']];
    const sequence=sequences[this.room===0?0:this.room===1?1:2],offset=l.number===1?0:(l.number-1)%sequence.length,kind=sequence[(this.chainNumber+offset)%sequence.length];
    const base=kind==='chain'?(this.room===3?6:4):kind==='fan'?5:kind==='pincer'?4:6;
    const count=Math.min(base,goal-this.spawned),edge=(this.chainNumber+this.room+1)%4,lane=.27+(this.chainNumber%3)*.18;
    this.pack={kind,count,emitted:0,edge,lane,look:(this.chainNumber+l.number-1)%pool.length};
    this.formation=kind;this.waveSerial++;this.waveAt=this.age;this.chainNumber++;
    this.entryWarnings=Array.from({length:count},(_,i)=>this.formationPoint(g,this.pack!,i));
    this.spawn=.55;
   }else{
    const pack=this.pack,available=cap-normal;
    // Chains trail one by one; fans arrive together; pincers and surrounds arrive in short paired pulses.
    const batch=pack.kind==='chain'?1:pack.kind==='fan'?pack.count:2,count=Math.min(batch,pack.count-pack.emitted,available);
    for(let i=0;i<count;i++){
     const slot=pack.emitted,m=pool[(pack.look+(pack.kind==='chain'?0:slot%2))%pool.length],at=this.formationPoint(g,pack,slot),e=g.spawn(m.kind,at,m.id);
     if(!e)break;
     e.hp=e.maxHp=Math.max(24,Math.min(100,e.hp)*l.modifier.hp*(.85+l.number*.035));e.speed*=l.modifier.speed;e.age=0;
     if(pack.kind==='chain')this.chains.set(e.id,{edge:pack.edge,lane:pack.lane,age:0,duration:5.4});
     this.spawned++;pack.emitted++;
    }
    this.entryWarnings=[];
    if(pack.emitted>=pack.count){this.pack=null;this.spawn=(this.room===3?.8:this.room===1?1.2:MOUNTAIN_BALANCE.chainGap)+(pack.kind==='ring'?.35:0);}
    else this.spawn=pack.kind==='chain'?MOUNTAIN_BALANCE.chainInterval:.22;
   }
  }
  if(this.spawned>=goal&&!g.enemies.some(e=>!e.elite&&!e.chapterBoss)){
   if(this.roomAge<18)g.life=Math.min(g.maxHp,g.life+MOUNTAIN_BALANCE.quickClearHeal);if(this.support==='heal')g.life=Math.min(g.maxHp,g.life+8);g.ink.currentInk=Math.min(g.ink.maxInk,g.ink.currentInk+MOUNTAIN_BALANCE.clearInk);this.room++;
  }
 }
 chooseSupport(g:Game,id:RunSupport){if(!this.supportPanel||!this.supportChoices.includes(id))return false;this.support=id;this.supportPanel=false;this.supportReady=0;if(id==='heal')g.life=Math.min(g.maxHp,g.life+35);else this.useSupport(g);return true;}
 useSupport(g:Game){if(!this.support||this.age<this.supportReady||!g.active)return false;const id=this.support;if(id==='heal')return false;g.hualing.cancel();if(id==='flower')g.hualing.petals.activate();else if(id==='thunder')g.hualing.thunder.activate();else if(!g.hualing.claimSummon(id))return false;this.supportReady=this.age+(id==='flower'?14:id==='thunder'?16:18);return true;}
 dragon(g:Game){if(!g.active||this.age<this.dragonReady)return false;if(g.ink.currentInk<MOUNTAIN_BALANCE.dragonInk){g.hualing.say('游龙需要18墨');return false;}g.ink.currentInk-=MOUNTAIN_BALANCE.dragonInk;g.hualing.select('dragon');this.dragonReady=this.age+MOUNTAIN_BALANCE.dragonCooldown;return true;}
}
