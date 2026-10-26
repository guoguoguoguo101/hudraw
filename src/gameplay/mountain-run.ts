import type {Game} from './game';
import {chapterMonsters} from './paper-monsters';
import {chapterElites} from './hualing-elites';
import {type HualingChapter} from './hualing-chapters';
export const MOUNTAIN_CHAPTERS:HualingChapter[]=['valley','sea','palace','snow'];
const TITLES={valley:['落笔秋径','灯影追风','纸翼过隘','赤林围猎','衔日初战','暮色回廊','四面来风','百鬼夜行','双煞守关','九尾焚天'],sea:['浅湾试墨','鱼群回游','珊瑚暗流','礁间逐浪','蜃潮初战','鲸背漂流','双潮夹岸','月湾珠雨','深海双卫','镇潮归梦'],palace:['云阶启卷','星鸢穿庭','银铃悬道','日宫疾行','傀帝初战','星梭回廊','四极巡守','月阙流光','双使封门','司辰归位'],snow:['霁雪初行','雪貂逐迹','寒鸮越岭','冰甲围阵','霜魇初战','风雪孤径','冻泉追影','月下守梦','双灵踏雪','巨兽苏灵']} as const;
const MODS=[{name:'初墨',text:'均衡交锋 · 先定一门主修',hp:.8,speed:.85,cap:7},{name:'群涌',text:'薄甲群妖 · 连斩快速成型',hp:.64,speed:1,cap:11},{name:'疾影',text:'飞妖增多 · 留意突进前摇',hp:.85,speed:1.2,cap:9},{name:'重甲',text:'厚甲围阵 · 集中笔力破局',hp:1.15,speed:.88,cap:8},{name:'试锋',text:'本章首领 · 拆招再追心',hp:.9,speed:1,cap:9}] as const;
export const MOUNTAIN_LEVELS=MOUNTAIN_CHAPTERS.flatMap((chapter,c)=>Array.from({length:10},(_,i)=>({id:c*10+i,chapter,number:i+1,title:TITLES[chapter][i],modifier:MODS[i%5],boss:(i+1)%5===0,stage:i<3?'sunset' as const:i<7?'wind' as const:'night' as const})));
export type RunSupport='flower'|'thunder'|'beast'|'crab'|'heal';
export const SUPPORT_NAMES:Record<RunSupport,string>={flower:'枫舞附笔',thunder:'雷符附笔',beast:'纸虎协战',crab:'蟹将冲阵',heal:'归元护卷'};
export const SUPPORT_TEXT:Record<RunSupport,string>={flower:'每隔14秒可附笔枫舞，持续12秒',thunder:'每隔16秒可附笔雷符，持续12秒',beast:'获得虎符，拖出召唤；18秒后可再领',crab:'获得蟹将符，拖出直线冲阵；18秒后可再领',heal:'立即恢复35生命，此后每段间隙恢复8生命'};
export const MOUNTAIN_BALANCE={picks:8,inkCostScale:.65,inkRegenScale:1.5,clearInk:25,quickClearHeal:6,dragonInk:18,dragonCooldown:14,singleInterval:1.45,pairInterval:1.4,groupInterval:1.25};
export class MountainRun{
 levelId:number|null=null;room=0;age=0;roomAge=0;spawn=0;roomStartKills=0;spawned=0;roomKills=0;finalStarted=false;support:RunSupport|null=null;supportChoices:RunSupport[]=[];supportPanel=false;supportReady=0;dragonReady=0;granted=0;cleared=false;completed=new Set<number>();private lastRoom=-1;
 get running(){return this.levelId!==null&&!this.cleared;}
 get level(){return this.levelId===null?null:MOUNTAIN_LEVELS[this.levelId];}
 get nextFormation(){return this.room===0&&this.spawned<3?'单妖试锋':this.room===0?'同路双妖':this.room===1?'双路夹击':'群妖合围';}
 get roomName(){return ['起笔 · 定势','泼墨 · 破围','锋试 · 精英','成势 · 狂潮','落印 · 守关'][this.room];}
 reset(){this.levelId=null;this.room=0;this.age=this.roomAge=this.spawn=this.spawned=this.roomKills=this.granted=0;this.finalStarted=this.supportPanel=this.cleared=false;this.support=null;this.supportChoices=[];this.lastRoom=-1;this.supportReady=this.dragonReady=0;}
 begin(g:Game,id:number){this.reset();this.levelId=id;g.hualing.upgrades.reset();g.hualing.upgrades.runMode=true;g.hualing.upgrades.choiceSeed=id*97+734;g.hualing.upgrades.growth=false;this.grant(g,1);g.hualing.sceneSeal.phase='spent';g.hualing.journey.preview(this.level!.stage);g.hualing.journey.autoEvents=false;g.hualing.journey.automatic=false;g.hualing.sceneSeal.phase='spent';}
 grant(g:Game,n:number){const u=g.hualing.upgrades,take=Math.max(0,Math.min(n,MOUNTAIN_BALANCE.picks-this.granted));this.granted+=take;u.pending+=take;u.growth=true;}
 advance(g:Game,dt:number){
  if(!this.running||!g.active||g.hualing.frozen||this.supportPanel)return;const l=this.level!;this.age+=dt;this.roomAge+=dt;this.roomKills=g.kills-this.roomStartKills;
  if(g.hualing.bosses.failed){g.life=0;g.state='lose';g.events.push({type:'lose'});return;}
  if(this.lastRoom!==this.room){this.lastRoom=this.room;this.roomAge=this.spawn=this.spawned=0;this.roomStartKills=g.kills;this.roomKills=0;g.hualing.say(this.roomName+' · '+l.modifier.text);if(this.room===2){const kinds=chapterElites(l.chapter);g.summonHualingElite(kinds[(l.number+1)%5]);if(l.number===9)g.summonHualingElite(kinds[(l.number+3)%5]);}if(this.room===4){g.enemies=g.enemies.filter(e=>e.elite);this.grant(g,8-this.granted);}}
  if(this.room===4){
   if(g.hualing.upgrades.blocked||g.hualing.upgrades.pending)return;
   if(!this.finalStarted){this.finalStarted=true;if(l.boss)g.summonHualingBoss();else g.summonHualingElite(chapterElites(l.chapter)[(l.number-1)%5]);}
   else if(!g.enemies.some(e=>e.elite||e.chapterBoss)){this.cleared=true;this.completed.add(l.id);g.state='win';g.events.push({type:'win'});}return;
  }
  if(this.room===2){if(!g.enemies.some(e=>e.elite)){this.grant(g,Math.max(0,6-this.granted));this.supportChoices=(['flower','thunder','beast','crab','heal'] as RunSupport[]).map(id=>({id,r:g.random()})).sort((a,b)=>a.r-b.r).slice(0,3).map(v=>v.id);this.supportPanel=true;this.room++;}return;}
  const goal=[10,14,0,20][this.room]+Math.floor((l.number-1)*.8),basePool=chapterMonsters(l.chapter),pool=l.modifier.name==='疾影'?[...basePool,...basePool.filter(m=>m.kind==='crow')]:basePool;
  this.spawn-=dt;const normal=g.enemies.filter(e=>!e.elite&&!e.chapterBoss).length;
  if(this.spawned<goal&&normal<l.modifier.cap&&this.spawn<=0){
   // First three opponents are deliberately single; later beats alternate a pair and a small formation.
   const intro=this.room===0&&this.spawned<3;
   const burst=intro?1:this.room===0?2:this.room===1?2:Math.min(4,3+Math.floor(l.number/8));
   const count=Math.min(burst,goal-this.spawned,l.modifier.cap-normal),bounds=g.hualing.bounds;
   for(let i=0;i<count;i++){
    const m=pool[(this.spawned+l.number-1)%pool.length],edge=(Math.floor((this.spawned-i)/Math.max(1,burst))+this.room+(this.room>0&&i%2?2:0))%4;
    const t=(i+1)/(count+1),x=edge===0?bounds.left+24:edge===2?bounds.right-24:bounds.left+60+(bounds.right-bounds.left-120)*t;
    const y=edge===1?bounds.top+24:edge===3?bounds.bottom-145:bounds.top+65+(bounds.bottom-bounds.top-130)*t;
    const e=g.spawn(m.kind,{x,y},m.id);if(e){e.hp=e.maxHp=Math.max(24,Math.min(100,e.hp)*l.modifier.hp*(.85+l.number*.035));e.speed*=l.modifier.speed;e.age=0;this.spawned++;}
   }
   this.spawn=intro?MOUNTAIN_BALANCE.singleInterval:this.room===0?1.65:this.room===1?MOUNTAIN_BALANCE.pairInterval:MOUNTAIN_BALANCE.groupInterval;
  }
  const milestones=[4,10,17,25,33,42,50];while(this.granted<8&&g.kills>=milestones[this.granted-1])this.grant(g,1);
  if(this.spawned>=goal&&!g.enemies.some(e=>!e.elite&&!e.chapterBoss)){if(this.roomAge<18)g.life=Math.min(g.maxHp,g.life+MOUNTAIN_BALANCE.quickClearHeal);if(this.support==='heal')g.life=Math.min(g.maxHp,g.life+8);g.ink.currentInk=Math.min(g.ink.maxInk,g.ink.currentInk+MOUNTAIN_BALANCE.clearInk);this.room++;if(this.room===2)this.grant(g,Math.max(0,5-this.granted));}
 }
 chooseSupport(g:Game,id:RunSupport){if(!this.supportPanel||!this.supportChoices.includes(id))return false;this.support=id;this.supportPanel=false;this.supportReady=0;if(id==='heal')g.life=Math.min(g.maxHp,g.life+35);else this.useSupport(g);return true;}
 useSupport(g:Game){if(!this.support||this.age<this.supportReady||!g.active)return false;const id=this.support;if(id==='heal')return false;g.hualing.cancel();if(id==='flower')g.hualing.petals.activate();else if(id==='thunder')g.hualing.thunder.activate();else if(!g.hualing.claimSummon(id))return false;this.supportReady=this.age+(id==='flower'?14:id==='thunder'?16:18);return true;}
 dragon(g:Game){if(!g.active||this.age<this.dragonReady)return false;if(g.ink.currentInk<MOUNTAIN_BALANCE.dragonInk){g.hualing.say('游龙需要18墨');return false;}g.ink.currentInk-=MOUNTAIN_BALANCE.dragonInk;g.hualing.select('dragon');this.dragonReady=this.age+MOUNTAIN_BALANCE.dragonCooldown;return true;}
}
