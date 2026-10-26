import {BOSS_PARTS,partWorld} from './boss-anatomy';
import {bossPose,deformBossVertex} from '../rendering/boss-motion';
import {createBattlefield,advanceBattlefield,traceBattlefield,type Battlefield,type AssaultHooks,comboSolved,comboProgress,COMBO_LIMIT,endBattlefieldStroke,emberSource} from './boss-battlefield';
import type {Enemy} from '../core/types';
import type {Point} from '../input/recognizer';
import {distanceToSegment,type Arena} from '../input/line-interaction-geometry';
import type {HualingChapter} from './hualing-chapters';

export const CHAPTER_BOSSES={
 valley:{name:'衔日狐王',hp:2200,color:0xc46b39,hint:'金火横斩 · 赤鞭断结 · 九尾三叠轮攻',breakName:'真火归日 · 狐王露心'},
 sea:{name:'镇潮蜃君',hp:2600,color:0x64b8b9,hint:'劈开亮色潮缝 · 抓珠按住，潮眼张开时还珠',breakName:'引珠破潮 · 独眼暴露'},
 palace:{name:'司辰傀帝',hp:2400,color:0xd7b96d,hint:'横丝竖断、竖丝横断 · 连起同色双星反射',breakName:'四极断丝 · 帝偶坠落'},
 snow:{name:'缚梦霜魇',hp:2300,color:0xa9d3dc,hint:'横断蹄震裂结 · 吐息前围暖火，结界挡霜',breakName:'护梦结界成 · 梦结显形'},
} as const;
export type BossCueKind='intro'|'step'|'break'|'danger'|'attack'|'defeat'|'victory'|'charge'|'parry'|'impact'|'release';
export type BossCue={type:'bossCue';kind:BossCueKind;chapter:HualingChapter;x:number;y:number;chain?:number;perfect?:boolean};
export type ChapterBossState={chapter:HualingChapter;phase:'arrive'|'idle'|'windup'|'attack'|'recover'|'stagger';age:number;clock:number;cycle:number;marks:boolean[];target:Point;attackHit:boolean;enraged:boolean;arena:Arena;carry:number|null;pen:Point|null;penActive:boolean;stroke:Point[];ward:boolean;weakBudget:number;lastPenalty:number;attackBeat:number;field:Battlefield};
export type BossLane={a:Point;b:Point;radius:number};
export function createChapterBoss(chapter:HualingChapter):ChapterBossState{return {chapter,phase:'arrive',age:0,clock:0,cycle:0,marks:[],target:{x:360,y:665},attackHit:false,enraged:false,arena:{left:26,right:694,top:300,bottom:970},carry:null,pen:null,penActive:false,stroke:[],ward:false,weakBudget:0,lastPenalty:-10,attackBeat:-1,field:createBattlefield()};}
export function fieldPoint(s:ChapterBossState,u:number,v:number):Point{const b=s.arena;return {x:b.left+64+u*(b.right-b.left-128),y:b.top+112+v*Math.max(150,b.bottom-b.top-220)};}
export function bossMarks(e:Enemy):Point[]{
 const s=e.chapterBoss!;
 const layouts=s.chapter==='valley'?[[.03,.06],[.96,.78],[.05,.94],[.94,.12]]:s.chapter==='sea'?[[.03,.07],[.95,.15],[.08,.94]]:s.chapter==='palace'?[[.12,.08],[.88,.28],[.12,.9],[.88,.8]]:[[.04,.08],[.94,.50],[.08,.93]];
 return layouts.map((_,i)=>{const uv=layouts[(i+(s.chapter==='valley'?s.cycle:0))%layouts.length],p=fieldPoint(s,s.cycle%2?1-uv[0]:uv[0],uv[1]);return {x:p.x+Math.sin(s.clock*.65+i)*7,y:p.y+Math.sin(s.clock*.8+i*1.9)*9};});
}
export function bossReceiver(e:Enemy){const s=e.chapterBoss!,p=fieldPoint(s,s.cycle%2?.16:.84,s.cycle%2?.16:.88);return {x:p.x+Math.sin(s.clock*.7)*8,y:p.y+Math.cos(s.clock*.6)*7};}
export function bossTraps(e:Enemy):Point[]{const s=e.chapterBoss!;if(s.chapter!=='sea')return [];const layout=s.ward?[[.08,.43],[.92,.31]]:[[.34,.40],[.68,.63]];return layout.map(([u,v],i)=>{const p=fieldPoint(s,u,v);return {x:p.x+Math.sin(s.clock*.55+i)*12,y:p.y+Math.cos(s.clock*.6+i)*10};});}
export function threadDirection(i:number):Point{return i%2?{x:0,y:1}:{x:1,y:0};}
export function threadOpen(s:ChapterBossState,i:number){return ((s.age+i*.65)%2.4)<1.55;}
export function dreamCenter(e:Enemy){const s=e.chapterBoss!,p=fieldPoint(s,.52,.78);p.y=Math.min(p.y,s.arena.bottom-205);return p;}
export function dreamFires(e:Enemy){const p=dreamCenter(e);return [{x:p.x-56,y:p.y+22},{x:p.x+56,y:p.y+22},{x:p.x,y:p.y-49}];}
export function bossTimeLimit(s:ChapterBossState){return COMBO_LIMIT[s.chapter]*(s.enraged?.88:1);}
export function bossLanes(e:Enemy,b:Arena):BossLane[]{
 const s=e.chapterBoss!,t=Math.min(1,s.age/2.35),x=b.left+30+t*(b.right-b.left-60),y=b.top+110+t*(b.bottom-b.top-180);
 if(s.chapter==='valley')return [{a:{x:b.left+20,y},b:{x:b.right-20,y:y+75},radius:32}];
 if(s.chapter==='sea')return [{a:{x,y:b.top+85},b:{x:x-65,y:b.bottom-85},radius:44}];
 if(s.chapter==='palace')return [{a:{x,y:b.top+80},b:{x,y:b.bottom-85},radius:24},{a:{x:b.left+20,y},b:{x:b.right-20,y},radius:24}];
 return [{a:{x:b.left+20,y},b:{x:b.right-20,y:y-55},radius:38}];
}
function encloses(p:Point,path:Point[]){let inside=false;for(let i=0,j=path.length-1;i<path.length;j=i++){const a=path[i],b=path[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export class HualingBosses{
 blockProjectile?: (a:Point,b:Point,radius:number)=>boolean;
 started=false;active=false;failed=false;defeated:HualingChapter|null=null;hits=0;integrity=100;notice='';resultAge=0;clock=0;sceneForce=0;sceneAttack=0;sceneParry=0;
 private cues:BossCue[]=[];private strikes:{id:number;amount:number}[]=[];
 reset(){this.started=this.active=this.failed=false;this.defeated=null;this.hits=0;this.integrity=100;this.notice='';this.resultAge=this.clock=this.sceneForce=this.sceneAttack=this.sceneParry=0;this.cues=[];this.strikes=[];}
 begin(){this.reset();this.started=this.active=true;}
 cleared(){this.reset();this.started=true;}
 takeCues(){return this.cues.splice(0);}
 takeStrikes(){return this.strikes.splice(0);}
 private cue(e:Enemy,kind:BossCueKind,p:Point=e,extras:Pick<BossCue,'chain'|'perfect'>={}){this.cues.push({...extras,type:'bossCue',kind,chapter:e.chapterBoss!.chapter,x:p.x,y:p.y});if(this.cues.length>16)this.cues.shift();}
 killed(e:Enemy){if(!e.chapterBoss)return;this.active=false;this.defeated=e.chapterBoss.chapter;this.resultAge=0;this.notice=`${CHAPTER_BOSSES[this.defeated].name}已破 · 护卷 ${Math.ceil(this.integrity)}`;this.cue(e,'victory');}
 damageScale(e:Enemy){if(!e.chapterBoss)return 1;return e.chapterBoss.phase==='stagger'&&this.active?1.9:0;}
 consumeDamage(e:Enemy,n:number){const s=e.chapterBoss!;if(!this.active||s.phase!=='stagger'||!Number.isFinite(n)||n<=0)return 0;const amount=Math.min(n,s.weakBudget);s.weakBudget-=amount;if(s.weakBudget<=.001){s.cycle++;this.phase(s,'recover');this.notice='妖心遁去 · 下一轮重新破阵';}return amount;}
 private phase(s:ChapterBossState,p:ChapterBossState['phase']){s.phase=p;s.age=0;s.attackHit=false;s.carry=null;s.stroke=[];s.attackBeat=-1;if(p==='windup'){const old=s.field;s.field={...createBattlefield(),serial:old.serial};}if(p==='stagger'){s.field.attacks.forEach(a=>{if(!a.resolved){a.resolved=true;a.parried=true;a.contact={...a.to};a.resolvedAt=a.age;}});s.field.scorches=[];}}
 private wound(e:Enemy,n:number,message:string,p:Point=e,cooldown=true){const s=e.chapterBoss!;if(!this.active||cooldown&&s.clock-s.lastPenalty<.7)return;if(cooldown)s.lastPenalty=s.clock;this.integrity=Math.max(0,this.integrity-n);this.hits++;this.notice=message;this.cue(e,'danger',p);if(this.integrity<=0){this.failed=true;this.active=false;this.resultAge=0;this.notice='画卷失守 · 点击挑战重新来过';this.strikes=[];this.cue(e,'defeat');}}
 private assaultHooks(e:Enemy):AssaultHooks{return {
  block:(a,b,r)=>this.blockProjectile?.(a,b,r)??false,
  launch:p=>this.cue(e,'charge',p),fire:p=>this.cue(e,'release',p),
  impact:(p,major,damage)=>{e.chapterBoss!.carry=null;this.wound(e,damage??(major?8:5),({valley:'日火坠地 · 山谷焚烧',sea:'巨浪拍卷 · 海珠震落',palace:'星束贯穿 · 天宫失衡',snow:'冰域蔓延 · 梦境冻结'} as const)[e.chapterBoss!.chapter],p,false);},
  parry:(p,_,shot)=>{const s=e.chapterBoss!,perfect=shot?.perfect;this.integrity=Math.min(100,this.integrity+(perfect?2:1));if(shot)s.marks[shot.part]=true;this.notice=(perfect?'妙笔！':'反制！')+' · '+comboProgress(s.chapter,s.field)+(s.field.combo>=3?` · ${s.field.combo}连断`:'');this.cue(e,'parry',p,{chain:s.field.combo,perfect});this.tryBreak(e);}
 };}
 private tryBreak(e:Enemy){const s=e.chapterBoss!;if((s.phase==='windup'||s.phase==='attack')&&comboSolved(s.chapter,s.field))this.broken(e);}

 private broken(e:Enemy){const s=e.chapterBoss!;this.phase(s,'stagger');s.weakBudget=e.maxHp*.36;this.integrity=Math.min(100,this.integrity+4);this.notice=CHAPTER_BOSSES[s.chapter].breakName+' · 追击移动妖心！';this.strikes.push({id:e.id,amount:e.maxHp*(.12+Math.min(.04,s.field.perfect*.006))});this.cue(e,'break');}
 beginStroke(enemies:Enemy[]){for(const e of enemies){const s=e.chapterBoss;if(s){s.penActive=true;s.pen=null;s.stroke=[];s.field.stroke=[];s.field.ember=false;s.field.carry=null;}}}
 endStroke(enemies:Enemy[],cancel=false){for(const e of enemies){const s=e.chapterBoss;if(!s)continue;s.penActive=false;if(endBattlefieldStroke(s.field,s.chapter,s.arena,cancel)){this.notice='暖火成界 · 挡住即将到来的角霜';this.cue(e,'step',emberSource(s.arena));}s.carry=null;s.stroke=[];}}
 trace(a:Point,b:Point,_radius:number,enemies:Enemy[]){
  if(!this.active)return;for(const e of enemies){const s=e.chapterBoss;if(!s||e.hp<=0)continue;s.pen={x:b.x,y:b.y};if(s.phase!=='windup'&&s.phase!=='attack')continue;const pose=bossPose(s);traceBattlefield(s.field,s.chapter,s.arena,s.cycle,a,b,this.assaultHooks(e),partWorld(s.chapter,3,e,(u,v)=>deformBossVertex(s.chapter,u,v,pose)));this.tryBreak(e);}
 }
 advance(dt:number,enemies:Enemy[],b:Arena,frozen:boolean,_hurt?:(n:number)=>void){
  if(!Number.isFinite(dt)||dt<=0||frozen)return;const d=Math.min(dt,.1);this.clock+=d;if(this.defeated||this.failed)this.resultAge+=d;
  if(!this.active)return;
  for(const e of enemies){const s=e.chapterBoss;if(!s||e.hp<=0)continue;s.arena={...b};s.age+=d;s.clock+=d;s.enraged=e.hp/e.maxHp<=.5;e.ai='Approach';e.vx=e.vy=0;
   advanceBattlefield(s.field,s.chapter,b,e,d,s.phase==='windup'||s.phase==='attack',s.phase==='attack',s.enraged,this.assaultHooks(e),part=>{const pose=bossPose(s);return partWorld(s.chapter,part,e,(u,v)=>deformBossVertex(s.chapter,u,v,pose));},s.penActive?s.pen??undefined:undefined);if(!this.active)return;this.tryBreak(e);
   this.sceneForce=s.field.attacks.reduce((v,a)=>Math.max(v,a.resolved||a.age<0?0:Math.min(1,a.age/a.charge)),0);this.sceneAttack=s.phase==='attack'?Math.sin(Math.min(1,s.age/2.4)*Math.PI):s.field.attacks.some(a=>!a.resolved&&a.age>=a.charge)?.45:0;this.sceneParry=s.field.flash/.32;
   if(s.penActive&&s.pen&&s.field.scorches.some(z=>Math.hypot(s.pen!.x-z.point.x,s.pen!.y-z.point.y)<45))this.wound(e,5,'笔锋触及余烬 · 绕开燃烧地面',s.pen);if(!this.active)return;
   if(s.phase==='arrive'){if(s.age>=.08&&!s.attackHit){s.attackHit=true;this.cue(e,'intro');}if(s.age>=.65)this.phase(s,'idle');continue;}
   if(s.phase==='idle'){
    e.x+=(360-e.x)*Math.min(1,d*3);e.y+=(Math.min(b.top+255,b.bottom-185)-e.y)*Math.min(1,d*3);
    if(s.age>=.22){s.marks=BOSS_PARTS[s.chapter].map(()=>false);s.ward=false;this.phase(s,'windup');this.notice=CHAPTER_BOSSES[s.chapter].hint;this.cue(e,'step',fieldPoint(s,.5,.5));}
   }else if(s.phase==='windup'&&s.age>=bossTimeLimit(s)){
    this.wound(e,s.enraged?9:6,'未能破阵 · 场景杀招发动，尽快反制！',e,false);if(!this.active)return;this.phase(s,'attack');s.field.next=0;s.cycle++;this.cue(e,'attack',fieldPoint(s,.5,.5));
   }else if(s.phase==='attack'){
    if(s.age>=1.15)this.phase(s,'recover');
   }else if(s.phase==='recover'&&s.age>=.25)this.phase(s,'idle');
   else if(s.phase==='stagger'){
    const anchors=[[.27,.38],[.75,.56],[.5,.18]],uv=anchors[s.cycle%3],p=fieldPoint(s,uv[0],uv[1]);
    e.x+=(p.x+Math.sin(s.clock*.9)*24-e.x)*Math.min(1,d*2.8);e.y+=(Math.max(b.top+242,p.y)+Math.cos(s.clock*.8)*14-e.y)*Math.min(1,d*2.8);
    if(s.age>=3.1){s.cycle++;this.phase(s,'recover');}
   }
  }
 }
}
