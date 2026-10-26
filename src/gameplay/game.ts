import {MountainRun,MOUNTAIN_LEVELS,MOUNTAIN_BALANCE} from './mountain-run';
import {createElite,ELITE_NAMES,ELITE_CATALOG,chapterElites,type EliteKind} from './hualing-elites';
import {createChapterBoss,CHAPTER_BOSSES} from './hualing-bosses';
import {trailStyle} from './ink-trail';
import {brushBodyRadius} from './brush-contact';
import type {HualingChapter} from './hualing-chapters';
import {Hualing} from './hualing';
import {clipSegment,distanceToSegment} from '../input/line-interaction-geometry';
import {chapterMonsters,paperMonsterLook} from './paper-monsters';
import {FunctionalRelics} from './functional-relics';
import type {InputEvent} from '../platform/adapter';
import {BurningSea} from './burning-sea';
import {TalismanBarrage} from './talisman-barrage';
import {glyphSample} from '../input/glyph-samples';
import {LineInteractions} from './line-interactions';
import {configureInteractionLine} from './interaction-line';
import {FallbackSlashes,buildFallbackPath} from './fallback-slash';
import {containAdvancedEnemy} from './advanced-spells';
import {BrushSettings,GESTURE_INPUT} from '../input/brush-settings';
import {attachSwipe} from './slash';
import {containCircleEnemy} from './circle';
import {CinnabarBrush} from '../relics/cinnabar-brush';
import type {PrimaryAction} from '../relics/contracts';
import {WORLD,type Enemy,type EnemyKind,type EnemyLook,type Skill,type Event,type State} from '../core/types';
import {COMBAT,ENEMIES,SPELLS,BOSS} from './config';
import {CombatClock} from './clock';
import {InkResourceManager} from './ink-resource';
import {SpawnDirector} from './director';
import {EnemyAI} from './ai';
import {TalismanSpellFactory} from './spells';
import {CombatModifierSystem,RELICS,type RelicId} from './modifiers';
import {SkillTargetResolver} from './target';
import {recognize,resample,type Point,type Rune,type Recognition} from '../input/recognizer';
import type {ProgressEventType} from '../progress/tracker';
import {applySkillLevel,type ActiveRune} from './skill-levels';
export class Game{
 pen=new BrushSettings();formalCasts=0;lastAim:Point={x:0,y:-1};
 functionalRelics=new FunctionalRelics();enemiesFrozen=false;lastResourceDt=0;spellTime=0;
 freeSlashes=new FallbackSlashes();burningSea=new BurningSea();
 talismanBarrage=new TalismanBarrage();
 activateBurningSea(){return this.active&&this.practice&&!this.talismanBarrage.busy&&this.burningSea.begin();}
 activateTalismanBarrage(){
  if(!this.active||!this.interactionPractice||this.burningSea.busy)return false;
  if(this.talismanBarrage.phase==='aiming'){this.talismanBarrage.clear();return true;}
  return this.talismanBarrage.begin(this.lastAim);
 }
 handleBarrageInput(e:InputEvent){
  if(!this.active||!this.interactionPractice)return false;
  const before=this.talismanBarrage.phase,handled=this.talismanBarrage.handle(e,this.interactions.bounds);
  if(before==='aiming'&&this.talismanBarrage.phase==='charging'){
   this.lastAim={...this.talismanBarrage.direction};this.events.push({type:'talismanBarrage',kind:'start',direction:{...this.lastAim}});
  }
  return handled;
 }
 campaign=new MountainRun();hualingPractice=false;hualing=new Hualing();private hualingLookCursor=0;
 private brushHits=new Map<number,number>();private nextEliteTime=35;private eliteRound=0;
 summonHualingBoss(){
  if(!this.hualingPractice||!this.active||this.hualing.upgrades.blocked)return null;
  this.endHualingStroke(true);this.hualing.cancel();this.clearHualingElites();this.enemies=[];this.brushHits.clear();
  const chapter=this.hualing.journey.chapter,b=this.hualing.bounds,e=this.spawn('boss',{x:360,y:Math.min(b.top+255,b.bottom-185)});if(!e)return null;
  e.look=undefined;e.chapterBoss=createChapterBoss(chapter);e.chapterBoss.arena={...b};e.hp=e.maxHp=CHAPTER_BOSSES[chapter].hp;e.speed=0;e.armorPool=0;e.ai='Approach';this.bossDead=false;
  this.hualing.bosses.begin();this.hualing.say(CHAPTER_BOSSES[chapter].name+' · '+CHAPTER_BOSSES[chapter].hint);return e;
 }
 clearHualingBoss(){
  this.enemies=this.enemies.filter(e=>!e.chapterBoss);this.hualing.bosses.cleared();this.hualing.say('Boss 已清除 · 可重新挑战');
 }
 summonHualingElite(kind:EliteKind){
  if(!this.hualingPractice||!this.active||this.hualing.upgrades.blocked)return null;
  const config=ELITE_CATALOG[kind];if(this.hualing.journey.chapter!==config.chapter)this.changeHualingChapter(config.chapter);
  this.clearHualingElites(kind);const b=this.hualing.bounds,e=this.spawn('oni',{x:kind==='umbrella'?230:490,y:Math.max(b.top+125,Math.min(b.top+155,b.bottom-230))});
  if(!e){this.hualing.say('精英数量已满 · 先清除精英再召唤');return null;}
  e.look=undefined;e.elite=createElite(kind);e.hp=e.maxHp=config.hp;e.speed=0;e.ai='Approach';e.age=0;
  this.hualing.say(ELITE_NAMES[kind]+' · '+config.hint);return e;
 }
 clearHualingElites(kind?:EliteKind){
  const ids=new Set(this.enemies.filter(e=>e.elite&&(!kind||e.elite.kind===kind)).map(e=>e.id));
  this.enemies=this.enemies.filter(e=>!ids.has(e.id));for(const id of ids)this.brushHits.delete(id);this.hualing.elites.clearOwners(ids);
  if(!kind){this.hualing.elites.reset();this.nextEliteTime=Math.max(this.nextEliteTime,this.time+35);}
 }

 beginHualingStroke(origin?:Point){if(!this.hualingPractice||!this.active||this.hualing.upgrades.blocked)return;this.hualing.bosses.beginStroke(this.enemies);this.hualing.combo.beginStroke();this.hualing.upgrades.begin(origin);}
 endHualingStroke(cancel=false){if(!this.hualingPractice)return;this.hualing.bosses.endStroke(this.enemies,cancel);this.flushBossEffects();this.hualing.combo.endStroke();this.hualing.upgrades.end(this.hualing.bounds,cancel);}
 strokeHualing(a:Point,b:Point){
  if(!this.hualingPractice||!this.active||this.hualing.selected||this.hualing.upgrades.blocked)return;
  if(![a.x,a.y,b.x,b.y].every(Number.isFinite)||Math.hypot(b.x-a.x,b.y-a.y)+1e-8<GESTURE_INPUT.sampleDistance)return;
  const segment=clipSegment({a,b},this.hualing.bounds);if(!segment)return;
  if(this.campaign.running)this.campaign.collectAlong(this,segment.a,segment.b);
  if(!this.enemies.some(e=>e.elite&&e.hp>0))this.hualing.traceScene(segment.a,segment.b);this.hualing.petals.trace(segment.a,segment.b);this.hualing.thunder.trace(segment.a,segment.b);
  const upgrades=this.hualing.upgrades;upgrades.trace(segment.a,segment.b,trailStyle(this.hualing.petals.active,this.hualing.thunder.active));
  const now=this.hualing.clock;
  const radius=upgrades.contactRadius,amount=upgrades.mainDamage;
  this.hualing.bosses.trace(segment.a,segment.b,radius,this.enemies);this.flushBossEffects();
  const interaction=this.hualing.elites.trace(segment.a,segment.b,radius,this.enemies,now);
  for(const hit of interaction.counterHits)this.damage(hit.enemy,hit.amount,0,{id:-2,rune:'ink'});
  for(const message of interaction.messages)this.hualing.say(message);
  for(const reward of interaction.rewards){if(reward==='umbrella')this.hualing.petals.activate();else this.hualing.thunder.activate();this.hualing.say('遗物补绘完成 · '+(reward==='umbrella'?'画符':'雷符')+'附笔十二秒');}
  for(const [id,until] of this.brushHits)if(until<=now)this.brushHits.delete(id);
  for(const e of [...this.enemies])if(!this.brushHits.has(e.id)&&distanceToSegment(e,segment)<=radius+brushBodyRadius(e)){
   upgrades.directHit();this.hualing.thunder.hit(e.x,e.y);this.brushHits.set(e.id,now+.35);this.damage(e,amount,0,{id:-3,rune:'ink'});
   if(upgrades.levels.wide>=3&&e.hp>0&&!e.elite&&e.kind!=='boss'){
    const b=this.hualing.bounds,dx=segment.b.x-segment.a.x,dy=segment.b.y-segment.a.y,n=Math.hypot(dx,dy)||1,push=upgrades.levels.wide===4?16:10;
    e.x=Math.max(b.left+12,Math.min(b.right-12,e.x+dx/n*push));e.y=Math.max(b.top+12,Math.min(b.bottom-12,e.y+dy/n*push));
   }
  }
 }
 changeHualingChapter(chapter:HualingChapter){if(!this.hualingPractice||!this.active)return;this.endHualingStroke(true);this.hualing.changeChapter(chapter);this.hualing.elites.reset();this.nextEliteTime=this.time+35;this.eliteRound=0;this.brushHits.clear();this.enemies=[];this.skills=[];this.events=[];this.hualingLookCursor=0;this.seedHualingEnemies();}
 seedHualingEnemies(){if(!this.hualingPractice)return;const pool=chapterMonsters(this.hualing.journey.chapter);for(let i=0;i<4&&this.enemies.length<6;i++){const m=pool[i%pool.length];const e=this.spawn(m.kind,this.director.hualingEntry(this),m.id);if(e){e.look=m.id;e.ai='Approach';e.age=1;}}}
 practice=false;endless=false;interactionPractice=false;interactionTriangle:'triangle'|'sancai'='sancai';interactions=new LineInteractions();
 practiceLevels:Record<ActiveRune,number>={sancai:1,line:1,circle:1,triangle:1,z:1,arc:1,wave:1,spiral:1};
 onProgress?: (type:ProgressEventType,payload:Record<string,unknown>,critical?:boolean)=>void;
 private reportProgress(type:ProgressEventType,payload:Record<string,unknown>,critical=false){if(!this.training&&!this.practice)this.onProgress?.(type,payload,critical);}
 trackingSkill?:Skill;
 hitStopRemaining=0;renderAlpha=1;state:State='menu';previous:State='playing';time=0;score=0;life=100;maxHp=100;invulnerable=0;cooldown=0;enemies:Enemy[]=[];skills:Skill[]=[];events:Event[]=[];serial=0;seed=734;casts=0;kills=0;taught=new Set<Rune>();wave=0;
 brush=new CinnabarBrush();
 primaryAction(action:PrimaryAction){this.brush.onPrimary(action,this.spellTime);}
 clock=new CombatClock();ink=new InkResourceManager();director=new SpawnDirector();modifiers=new CombatModifierSystem();shield=0;shieldTime=0;level=1;xp=0;pendingLevels=0;choices:RelicId[]=[];training=false;bossDead=false;cultivation=0;duration=COMBAT.duration;
 get active(){return this.state==='playing'||this.state==='tutorial';}
 get xpNeeded(){return 24+this.level*18;}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 startMountainLevel(id:number){const l=MOUNTAIN_LEVELS[id];if(!l)return false;this.start(false,true,false,false,true);this.changeHualingChapter(l.chapter);this.enemies=[];this.events=[];this.director.disabled=true;this.ink.reset(false);this.ink.costScale=MOUNTAIN_BALANCE.inkCostScale;this.ink.regenScale=MOUNTAIN_BALANCE.inkRegenScale;this.ink.retainOnCancel=true;this.campaign.begin(this,id);return true;}
 start(training=false,practice=false,endless=false,interactionPractice=false,hualingPractice=false){this.campaign.reset();this.hualingPractice=hualingPractice;this.hualingLookCursor=0;this.brushHits.clear();this.hualing.reset();this.nextEliteTime=35;this.eliteRound=0;practice=practice||hualingPractice;this.functionalRelics.reset(interactionPractice);this.enemiesFrozen=false;this.spellTime=0;this.interactionPractice=interactionPractice;this.interactionTriangle='sancai';this.interactions.clear();this.freeSlashes.clear();this.burningSea.clear();this.talismanBarrage.clear();practice=practice||interactionPractice;this.lastAim={x:0,y:-1};this.practice=practice;this.endless=endless&&!practice&&!training;this.brush.clear();this.hitStopRemaining=0;this.training=training;this.state=training?'tutorial':'playing';this.time=0;this.duration=practice||this.endless?Infinity:training?COMBAT.trainingDuration:COMBAT.duration;this.score=0;this.maxHp=100+Math.min(10,this.cultivation)*4;this.life=this.maxHp;this.invulnerable=0;this.cooldown=0;this.enemies=[];this.skills=[];this.events=[];this.casts=0;this.formalCasts=0;this.kills=0;this.taught.clear();this.wave=0;this.seed=734;this.clock.reset();this.ink.reset(practice);this.director.reset();this.modifiers=new CombatModifierSystem();this.shield=this.shieldTime=0;this.level=1;this.xp=0;this.pendingLevels=0;this.choices=[];this.bossDead=false;this.reportProgress('RUN_STARTED',{chapterId:'sunset-valley',training});this.reportProgress('CHAPTER_ENTERED',{chapterId:'sunset-valley'});}
 menu(){this.campaign.reset();if(['playing','tutorial','paused','upgrade'].includes(this.state))this.reportProgress('RUN_ENDED',{result:'abandoned',score:this.score,seconds:this.time},true);this.brush.clear();this.interactions.clear();this.freeSlashes.clear();this.burningSea.clear();this.talismanBarrage.clear();this.functionalRelics.reset(false);this.hualing.reset();this.hualingPractice=false;this.interactionPractice=false;this.practice=false;this.endless=false;this.state='menu';this.enemies=[];this.skills=[];this.events=[];}
 pause(){if(this.active||this.state==='reviving'){this.previous=this.state;this.state='paused';}else if(this.state==='paused')this.state=this.previous;}
 spawn(kind:EnemyKind,at?:Point,look?:EnemyLook){if(kind==='boss'&&this.enemies.some(e=>e.kind==='boss'))return null;if(kind==='oni'&&this.enemies.filter(e=>e.kind==='oni').length>=COMBAT.eliteCap)return null;if((kind==='ink'||kind==='crow')&&this.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length>=COMBAT.ordinaryCap)return null;
 const side=Math.floor(this.random()*4),p=at??(side===0?{x:50,y:300+this.random()*650}:side===1?{x:670,y:300+this.random()*650}:side===2?{x:100+this.random()*520,y:260}:{x:120+this.random()*480,y:1050});const m=ENEMIES[kind];
 const e:Enemy={id:++this.serial,kind,...p,prevX:p.x,prevY:p.y,hp:m.hp,maxHp:m.hp,speed:m.speed,age:0,hit:0,vx:0,vy:0,ai:'Spawn',stateAge:0,aim:{x:0,y:1},armor:0,armorTime:0,shock:0,attackOrigin:{...p},phase:1,armorPool:kind==='boss'?BOSS.armorPool:0};if(this.hualingPractice)e.look=look??paperMonsterLook(kind,this.hualingLookCursor++,this.hualing.journey.chapter);if(e.look?.startsWith('sea-')||e.look?.startsWith('star-')){const tough=e.look==='sea-crab'||e.look==='star-bell';e.hp=e.maxHp=tough?100:60;e.speed*=e.look==='sea-jelly'?.65:tough?.8:1.1;}this.enemies.push(e);this.reportProgress('ENEMY_SEEN',{enemyTypeId:kind,name:kind==='boss'?'赤面鬼王':kind==='oni'?'赤面鬼':kind==='crow'?'纸鸦':'墨团妖'});return e;
 }
 cast(recognition:Recognition|Rune,direction:Point={x:1,y:0}){if(!this.active)return false;
 const r=typeof recognition==='string'?this.synthetic(recognition,direction):recognition;
 if(this.hualingPractice)return false;
 if(this.interactionPractice&&typeof recognition!=='string'&&!(r.valid&&r.rune&&['line','circle','triangle','sancai','z'].includes(r.rune)))return this.castFallback(r);
 if(!r.valid||!r.rune)return false;
 if(this.interactionPractice){
  if(!['line','circle','triangle','sancai','z','ink'].includes(r.rune)){this.interactions.lastReason='本场暂不支持此符';return false;}
  if(typeof recognition!=='string'&&(r.rune==='sancai'||r.rune==='triangle')&&r.geometry.triangle)r.rune=this.interactionTriangle;
 }
 let automatic:number|null=null;
 if(r.gestureId!==undefined){if(this.ink.pending?.id!==r.gestureId||!this.ink.pending.effective)return false;}
 else{let length=0;for(let i=1;i<r.geometry.raw.length;i++)length+=Math.hypot(r.geometry.raw[i].x-r.geometry.raw[i-1].x,r.geometry.raw[i].y-r.geometry.raw[i-1].y);automatic=this.ink.automatic(length);if(automatic===null)return false;}
 // A valid failed glyph is a settled input, never a combat skill.
 if(r.rune==='ink'){if(automatic!==null)this.ink.settle(automatic,false,'ink','automatic');return true;}
 let s:Skill;try{s=TalismanSpellFactory.create(this,r);}catch(error){this.ink.cancel('rejected');throw error;}
 this.lastAim={...s.direction};this.casts++;this.formalCasts++;this.taught.add(r.rune);if(this.practice){if(r.rune in this.practiceLevels)applySkillLevel(s,this.practiceLevels[r.rune as ActiveRune]);}if(s.rune==='line'){if(this.interactionPractice){configureInteractionLine(this,s);}else if(typeof recognition!=='string')attachSwipe(s);}if(s.rune!=='sancai')this.brush.beginCast(s.id,this.modifiers.count('brush'));this.reportProgress('SPELL_CAST_SUCCESS',{spellId:r.rune,name:r.reason,castId:s.id,points:r.normalized});
 if(s.rune==='spiral'){const vortices=this.skills.filter(v=>v.rune==='spiral');if(vortices.length>=2)this.skills=this.skills.filter(v=>v.id!==vortices[0].id);}
 if(this.skills.length>=12)this.skills.shift();this.skills.push(s);this.events.push({type:'cast',rune:s.rune,direction:s.direction});
 if(s.rune!=='ink'&&s.rune!=='sancai'&&this.modifiers.count('feather')&&this.formalCasts%3===0){const e=[...this.enemies].sort((a,b)=>SkillTargetResolver.score(b)-SkillTargetResolver.score(a))[0];if(e){this.events.push({type:'foxfire',from:{x:360,y:665},to:{x:e.x,y:e.y}});this.damage(e,45*(1+.25*Math.max(0,this.modifiers.count('feather')-1)),60);}}
 if(automatic!==null)this.ink.settle(automatic,true,r.rune,'automatic');return true;}
 synthetic(rune:Rune,direction:Point){const angle=Math.atan2(direction.y,direction.x);const r=recognize(glyphSample(rune).map(p=>({x:WORLD.foxX+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:WORLD.foxY+p.x*Math.sin(angle)+p.y*Math.cos(angle)})));r.rune=rune;r.reason=rune;r.direction=direction;if(rune==='arc')r.geometry.center={x:WORLD.foxX+direction.x*180,y:WORLD.foxY+direction.y*180};r.quality=1;r.confidence=1;r.valid=true;return r;}
 private castFallback(r:Recognition){
  const path=buildFallbackPath(r.fallbackPath??r.geometry.raw,this.interactions.bounds);
  if(!path||!this.freeSlashes.canAdd)return false;
  let automatic:number|null=null;
  if(r.gestureId!==undefined){if(this.ink.pending?.id!==r.gestureId||!this.ink.pending.effective)return false;}
  else{let length=0;for(let i=1;i<r.geometry.raw.length;i++)length+=Math.hypot(r.geometry.raw[i].x-r.geometry.raw[i-1].x,r.geometry.raw[i].y-r.geometry.raw[i-1].y);automatic=this.ink.automatic(length);if(automatic===null)return false;}
  const id=++this.serial;this.freeSlashes.add(id,path,r.fallbackPen??this.pen.snapshot());
  r.fallback=true;r.reason='随笔划斩 · 沿笔迹切割';
  const first=path.segments[0],n=first.end-first.start;
  this.events.push({type:'freeStroke',direction:{x:(first.b.x-first.a.x)/n,y:(first.b.y-first.a.y)/n}});
  if(automatic!==null)this.ink.settle(automatic,false,'freeStroke','automatic');return true;
 }
 breakArmor(e:Enemy){e.armor=SPELLS.triangle.armor;e.armorTime=3;e.armorPool=0;if(e.ai==='Telegraph'||e.ai==='Attack'){e.ai='Hit';e.stateAge=0;}}
 private flushBossEffects(){for(const strike of this.hualing.bosses.takeStrikes()){const e=this.enemies.find(e=>e.id===strike.id);if(e)this.damage(e,strike.amount,0,{id:-2,rune:'ink'});}this.events.push(...this.hualing.bosses.takeCues());}
 damage(e:Enemy,amount:number,push=0,source:Pick<Skill,'id'|'rune'>|undefined=this.trackingSkill){if(e.hp<=0||!this.enemies.includes(e))return;const reduction=e.kind==='boss'&&e.armorPool>0?1-BOSS.armorReduction:1,proposed=amount*reduction*(1+e.armor)*(this.hualingPractice?this.hualing.elites.damageScale(e):1)*(e.chapterBoss?this.hualing.bosses.damageScale(e):1);const actual=e.chapterBoss?this.hualing.bosses.consumeDamage(e,proposed):proposed;if(actual<=0)return;e.hp-=actual;e.hit=.23;this.reportProgress('SPELL_DAMAGE',{spellId:source?.rune??'',castId:source?.id??'',enemyInstanceId:e.id,amount:actual});if(source)this.reportProgress('SPELL_HIT',{spellId:source.rune,castId:source.id,enemyInstanceId:e.id});
 if(e.kind==='boss'){e.armorPool=Math.max(0,e.armorPool-amount*.18);if(e.ai==='Telegraph'){e.vx+=actual;if(e.vx>=BOSS.burstInterrupt){e.ai='Hit';e.stateAge=0;e.vx=0;}}}
 else{const dx=e.x-WORLD.foxX,dy=e.y-WORLD.foxY,d=Math.hypot(dx,dy)||1;e.vx=dx/d*push*(e.kind==='oni'?.7:1);e.vy=dy/d*push*(e.kind==='oni'?.7:1);if(e.kind!=='oni'||push>=200){e.ai='Hit';e.stateAge=0;}}
 const dead=e.hp<=0;if(dead&&this.campaign.running)this.campaign.killed(this,e);this.events.push({type:'strike',x:e.x,y:e.y,kind:e.kind,dead,amount:actual,targetId:e.id,secondary:source?.id===-2});
 if(dead){if(e.chapterBoss){this.hualing.bosses.killed(e);this.hualing.say(this.hualing.bosses.notice);}if(e.elite)this.hualing.elites.killed(e,this.hualing.bounds);if(this.hualingPractice){this.hualing.combo.kill(source?.id===-3);this.hualing.upgrades.kill();}e.ai='Death';e.shock=0;e.vx=e.vy=0;this.score+=ENEMIES[e.kind].score;this.kills++;this.reportProgress('ENEMY_KILLED',{enemyTypeId:e.kind,name:e.kind==='boss'?'赤面鬼王':e.kind==='oni'?'赤面鬼':e.kind==='crow'?'纸鸦':'墨团妖',enemyInstanceId:e.id,spellId:source?.rune??'',castId:source?.id??''});if(e.kind==='boss'){this.bossDead=true;this.reportProgress('BOSS_DEFEATED',{lowHealth:this.life<this.maxHp*.2});}this.enemies=this.enemies.filter(v=>v.id!==e.id);this.xp+=this.practice?0:ENEMIES[e.kind].xp;while(this.xp>=this.xpNeeded){this.xp-=this.xpNeeded;this.level++;this.pendingLevels++;}if(this.pendingLevels&&this.active&&!this.enemiesFrozen&&!this.functionalRelics.stopped)this.offer();}
 }
 hurt(amount:number,practiceTest=false){if(this.practice&&!practiceTest&&!this.campaign.running)return;if(!this.active||this.invulnerable>0)return;const incoming=amount*(this.training?.65:1),absorbed=Math.min(this.shield,incoming);this.shield-=absorbed;const damage=incoming-absorbed;this.life=Math.max(0,this.life-damage);this.invulnerable=COMBAT.invulnerability;this.events.push({type:'hurt',amount:damage});if(damage>0)this.reportProgress('PLAYER_DAMAGED',{amount:damage});if(!this.life){if(this.functionalRelics.beginRevive()){this.state='reviving';this.events.push({type:'functionalRelic',kind:'reviveStart'});}else this.finishDefeat();}}
 offer(){this.previous=this.training?'tutorial':'playing';this.state='upgrade';const pool=RELICS.filter(r=>r.id!=='brush'||this.modifiers.count('brush')<3).map(r=>r.id);this.choices=[];for(let i=0;i<3;i++)this.choices.push(pool.splice(Math.floor(this.random()*pool.length),1)[0]);this.events.push({type:'upgrade'});}
 choose(index:number){if(this.state!=='upgrade'||!this.choices[index])return;const id=this.choices[index];this.modifiers.add(id);this.reportProgress('ITEM_ACQUIRED',{itemId:id,name:RELICS.find(r=>r.id===id)?.name,level:this.modifiers.count(id)},true);this.pendingLevels--;this.life=Math.min(this.maxHp,this.life+8);if(this.pendingLevels)this.offer();else{this.state=this.previous;this.choices=[];}}
 activateHourglass(){if(!this.active||!this.functionalRelics.activateStop())return false;this.events.push({type:'functionalRelic',kind:'stop'});return true;}
 testFatalHit(){if(!this.practice||!this.functionalRelics.enabled||!this.active)return false;this.invulnerable=0;this.shield=0;this.hurt(this.life+1,true);return true;}
 resetFunctionalRelics(){if(!this.practice||!this.functionalRelics.enabled)return;this.functionalRelics.reset(true);this.life=this.maxHp;this.invulnerable=1;this.shield=0;if(this.state==='lose'||this.state==='reviving')this.state='playing';}
 handleFunctionalInput(e:InputEvent){if(this.state==='reviving'){const result=this.functionalRelics.reviveInput(e);this.resolveRevive();return result;}return this.active&&(this.functionalRelics.paperTiger.input(e,this.interactions.bounds)||this.functionalRelics.placementInput(e,this.interactions.bounds));}
 giveUpRevive(){if(this.state==='reviving'){this.functionalRelics.reviveResult='failed';this.resolveRevive();}}
 private finishDefeat(){if(this.state==='lose')return;this.state='lose';this.events.push({type:'lose'});this.reportProgress('RUN_ENDED',{result:'lose',score:this.score,seconds:this.time},true);}
 private resolveRevive(){const r=this.functionalRelics;if(this.state!=='reviving'||!r.reviveResult)return;r.reviving=false;if(r.reviveResult==='failed'){this.finishDefeat();return;}this.state='playing';r.notice='回魂成功 · 本局机会已用尽';this.life=Math.max(1,this.maxHp*(r.levels.soul>=2?.4:.3));this.invulnerable=2;if(r.levels.soul>=3){this.shield=this.maxHp*.2;this.shieldTime=4;}for(const e of this.enemies){if(e.kind==='boss')continue;const dx=e.x-WORLD.foxX,dy=e.y-WORLD.foxY,n=Math.hypot(dx,dy)||1;if(n<135){const push=e.kind==='oni'?30:90;e.x+=dx/n*push;e.y+=dy/n*push;e.prevX=e.x;e.prevY=e.y;e.vx=e.vy=0;e.ai='Hit';e.stateAge=0;}}this.events.push({type:'functionalRelic',kind:'reviveSuccess'});}
 hitEnemyTarget(e:Enemy,amount:number){if(e.lureId){if(!e.lureHit){this.functionalRelics.hitLantern(e.lureId);e.lureHit=true;}}else this.hurt(amount);}
 advance(realDt:number,drawing=false,interactionRealDt=realDt){
  this.lastResourceDt=0;if(this.campaign.supportPanel)return;
  if(this.hualingPractice&&this.active){this.hualing.upgrades.offer(!drawing&&!this.hualing.drawing&&!this.hualing.selected&&!this.hualing.scenes.some(s=>s.dragPointer!==null));if(this.hualing.upgrades.blocked)return;}
  if(this.state==='reviving'){this.functionalRelics.advanceRevive(interactionRealDt);this.resolveRevive();return;}
  if(!this.active)return;
  if(this.hualingPractice){this.hualing.elites.field.blockProjectile=(a,b,r)=>this.hualing.upgrades.trail.blockProjectile(a,b,r);this.hualing.bosses.blockProjectile=(a,b,r)=>this.hualing.upgrades.trail.blockProjectile(a,b,r);this.hualing.advance(interactionRealDt,this.enemies,(e,n)=>this.damage(e,n,0,{id:-2,rune:'ink'}),drawing);this.hualing.bosses.advance(interactionRealDt,this.enemies,this.hualing.bounds,this.hualing.frozen,n=>this.hurt(n));this.flushBossEffects();if(this.hualing.bosses.failed){this.enemies=this.enemies.filter(e=>!e.chapterBoss);this.hualing.say(this.hualing.bosses.notice);}this.hualing.elites.advance(Math.min(.1,interactionRealDt),this.enemies,this.hualing.frozen,n=>this.hurt(n),(e,n)=>this.damage(e,n,0,{id:-2,rune:'ink'}));if(this.hualing.elites.notice){this.hualing.say(this.hualing.elites.notice);this.hualing.elites.notice='';}}
  if(this.interactionPractice)this.talismanBarrage.advance(interactionRealDt,this.enemies,(e,n)=>this.damage(e,n,0,{id:-1,rune:'ink'}),()=>this.events.push({type:'talismanBarrage',kind:'pulse',direction:{...this.talismanBarrage.direction}}));
  if(this.functionalRelics.enabled)this.functionalRelics.paperTiger.advance(interactionRealDt,this.enemies,this.interactions.bounds,(e,n)=>this.damage(e,n,0));
  const frozen=this.functionalRelics.advance(interactionRealDt);this.lastResourceDt=Math.max(0,interactionRealDt-frozen);
  if(this.practice&&this.burningSea.advance(interactionRealDt,this.enemies,(e,n)=>this.damage(e,n,0,{id:0,rune:'ink'})))this.events.push({type:'burningSeaExplosion'});
  if(this.interactionPractice)this.interactions.advance(interactionRealDt,this.enemies,(e,amount,source)=>this.damage(e,amount,0,source),event=>this.events.push({type:'lineInteraction',kind:event.kind,x:event.center.x,y:event.center.y}));
  const simulate=(dt:number,stopped:boolean)=>{this.enemiesFrozen=stopped||(this.hualingPractice&&this.hualing.frozen);const held=this.hualingPractice?0:Math.min(dt,this.hitStopRemaining);this.hitStopRemaining=Math.max(0,this.hitStopRemaining-held);this.clock.real+=held;this.clock.advance(dt-held,!this.active,!this.hualingPractice&&drawing,step=>{this.update(step);return this.active&&this.hitStopRemaining<=0;});};
  const ratio=interactionRealDt>0?Math.min(1,frozen/interactionRealDt):0;
  if(ratio>0)simulate(realDt*ratio,true);if(ratio<1)simulate(realDt*(1-ratio),false);this.enemiesFrozen=false;
  if(this.pendingLevels&&this.active&&!this.practice&&!this.functionalRelics.stopped)this.offer();
  this.renderAlpha=Math.max(0,Math.min(1,this.clock.accumulator/this.clock.step));
 }
 update(dt:number){if(!this.active||this.campaign.supportPanel||this.hualingPractice&&this.hualing.upgrades.blocked)return;this.renderAlpha=1;for(const e of this.enemies){e.prevX=e.x;e.prevY=e.y;}if(!this.enemiesFrozen)this.time+=dt;this.spellTime+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.shieldTime=Math.max(0,this.shieldTime-dt);if(!this.shieldTime)this.shield=0;
 this.wave=this.endless?Math.floor(this.time/30):Math.min(5,Math.floor(this.time/30));if(!this.enemiesFrozen){if(this.campaign.running)this.campaign.advance(this,dt);else this.director.update(this,dt);}
 if(this.hualingPractice&&!this.director.disabled&&!this.enemiesFrozen&&this.time>=this.nextEliteTime&&!this.enemies.some(e=>e.elite||e.chapterBoss)){
  const e=this.summonHualingElite(chapterElites(this.hualing.journey.chapter)[this.eliteRound%5]);if(e){this.eliteRound++;this.nextEliteTime=this.time+55;}else this.nextEliteTime=this.time+5;
 }
 if(this.hualingPractice&&this.hualing.journey.automatic&&this.hualing.journey.time>=90&&!this.director.disabled&&!this.enemiesFrozen&&!this.hualing.bosses.started)this.summonHualingBoss();
 for(const s of [...this.skills]){this.trackingSkill=s;TalismanSpellFactory.update(this,s,dt);this.trackingSkill=undefined;if(!this.active)break;}
 if(this.active)this.brush.update(this.spellTime,{targets:()=>this.enemies,damage:(id,amount)=>{const e=this.enemies.find(e=>e.id===id);if(e)this.damage(e,amount,0);}});
 this.skills=this.skills.filter(s=>s.age<s.duration);
 if(this.interactionPractice||this.hualingPractice)this.freeSlashes.update(dt,this.enemies,(e,n,id)=>this.damage(e,n,0,{id,rune:'ink'}));
 if(!this.active)return;for(const e of [...this.enemies]){if(this.enemiesFrozen){EnemyAI.status(this,e,dt);if(this.hualingPractice){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-dt*6);e.vy*=Math.exp(-dt*6);}else{e.x=e.prevX;e.y=e.prevY;}}else if(e.chapterBoss){EnemyAI.status(this,e,dt);}else if(e.elite){EnemyAI.status(this,e,dt);this.hualing.elites.updateEnemy(e,dt,this.hualing.bounds,n=>this.hurt(n));}else if(this.campaign.running&&this.campaign.steer(this,e,dt)){EnemyAI.status(this,e,dt);}else{EnemyAI.update(this,e,dt);containCircleEnemy(this,e);containAdvancedEnemy(this,e);}if(!this.active)break;}
 if(this.hualingPractice){for(const at of this.hualing.elites.reinforcements.splice(0)){if(this.enemies.filter(e=>!e.elite&&!e.chapterBoss).length<6){const e=this.spawn('ink',at,'star-kite');if(e)e.ai='Approach';}}for(const e of this.enemies){const b=this.hualing.bounds;e.x=Math.max(b.left+15,Math.min(b.right-15,e.x));e.y=Math.max(b.top+20,Math.min(b.bottom-(this.campaign.running&&!e.elite&&!e.chapterBoss?125:15),e.y));}}
 if(this.active&&this.time+1e-8>=this.duration&&this.bossDead){this.time=Math.max(this.duration,this.time);this.state='win';this.events.push({type:'win'});this.reportProgress('CHAPTER_CLEARED',{chapterId:'sunset-valley',seconds:this.time,score:this.score},true);this.reportProgress('RUN_ENDED',{result:'win',score:this.score,seconds:this.time},true);}
 }
 drain(){return this.events.splice(0);}
}
