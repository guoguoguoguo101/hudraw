import {Hualing} from './hualing';
import {PAPER_MONSTERS,paperMonsterLook} from './paper-monsters';
import {FunctionalRelics} from './functional-relics';
import type {InputEvent} from '../platform/adapter';
import {BurningSea} from './burning-sea';
import {TalismanBarrage} from './talisman-barrage';
import {glyphSample} from '../input/glyph-samples';
import {LineInteractions} from './line-interactions';
import {configureInteractionLine} from './interaction-line';
import {FallbackSlashes,buildFallbackPath} from './fallback-slash';
import {containAdvancedEnemy} from './advanced-spells';
import {BrushSettings} from '../input/brush-settings';
import {attachSwipe} from './slash';
import {containCircleEnemy} from './circle';
import {CinnabarBrush} from '../relics/cinnabar-brush';
import type {PrimaryAction} from '../relics/contracts';
import {WORLD,type Enemy,type EnemyKind,type Skill,type Event,type State} from '../core/types';
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
 hualingPractice=false;hualing=new Hualing();private hualingLookCursor=0;
 seedHualingEnemies(){if(!this.hualingPractice)return;const b=this.hualing.bounds;for(let i=0;i<8&&this.enemies.length<16;i++){const x=110+(i%4)*165,y=b.top+95+Math.floor(i/4)*135,m=PAPER_MONSTERS[i%PAPER_MONSTERS.length];const e=this.spawn(m.kind,{x,y});if(e){e.look=m.id;e.ai='Approach';e.age=1;}}}
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
 start(training=false,practice=false,endless=false,interactionPractice=false,hualingPractice=false){this.hualingPractice=hualingPractice;this.hualingLookCursor=0;this.hualing.reset();practice=practice||hualingPractice;this.functionalRelics.reset(interactionPractice);this.enemiesFrozen=false;this.spellTime=0;this.interactionPractice=interactionPractice;this.interactionTriangle='sancai';this.interactions.clear();this.freeSlashes.clear();this.burningSea.clear();this.talismanBarrage.clear();practice=practice||interactionPractice;this.lastAim={x:0,y:-1};this.practice=practice;this.endless=endless&&!practice&&!training;this.brush.clear();this.hitStopRemaining=0;this.training=training;this.state=training?'tutorial':'playing';this.time=0;this.duration=practice||this.endless?Infinity:training?COMBAT.trainingDuration:COMBAT.duration;this.score=0;this.maxHp=100+Math.min(10,this.cultivation)*4;this.life=this.maxHp;this.invulnerable=0;this.cooldown=0;this.enemies=[];this.skills=[];this.events=[];this.casts=0;this.formalCasts=0;this.kills=0;this.taught.clear();this.wave=0;this.seed=734;this.clock.reset();this.ink.reset(practice);this.director.reset();this.modifiers=new CombatModifierSystem();this.shield=this.shieldTime=0;this.level=1;this.xp=0;this.pendingLevels=0;this.choices=[];this.bossDead=false;this.reportProgress('RUN_STARTED',{chapterId:'sunset-valley',training});this.reportProgress('CHAPTER_ENTERED',{chapterId:'sunset-valley'});}
 menu(){if(['playing','tutorial','paused','upgrade'].includes(this.state))this.reportProgress('RUN_ENDED',{result:'abandoned',score:this.score,seconds:this.time},true);this.brush.clear();this.interactions.clear();this.freeSlashes.clear();this.burningSea.clear();this.talismanBarrage.clear();this.functionalRelics.reset(false);this.hualing.reset();this.hualingPractice=false;this.interactionPractice=false;this.practice=false;this.endless=false;this.state='menu';this.enemies=[];this.skills=[];this.events=[];}
 pause(){if(this.active||this.state==='reviving'){this.previous=this.state;this.state='paused';}else if(this.state==='paused')this.state=this.previous;}
 spawn(kind:EnemyKind,at?:Point){if(kind==='boss'&&this.enemies.some(e=>e.kind==='boss'))return null;if(kind==='oni'&&this.enemies.filter(e=>e.kind==='oni').length>=COMBAT.eliteCap)return null;if((kind==='ink'||kind==='crow')&&this.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length>=COMBAT.ordinaryCap)return null;
 const side=Math.floor(this.random()*4),p=at??(side===0?{x:50,y:300+this.random()*650}:side===1?{x:670,y:300+this.random()*650}:side===2?{x:100+this.random()*520,y:260}:{x:120+this.random()*480,y:1050});const m=ENEMIES[kind];
 const e:Enemy={id:++this.serial,kind,...p,prevX:p.x,prevY:p.y,hp:m.hp,maxHp:m.hp,speed:m.speed,age:0,hit:0,vx:0,vy:0,ai:'Spawn',stateAge:0,aim:{x:0,y:1},armor:0,armorTime:0,shock:0,attackOrigin:{...p},phase:1,armorPool:kind==='boss'?BOSS.armorPool:0};if(this.hualingPractice)e.look=paperMonsterLook(kind,this.hualingLookCursor++);this.enemies.push(e);this.reportProgress('ENEMY_SEEN',{enemyTypeId:kind,name:kind==='boss'?'赤面鬼王':kind==='oni'?'赤面鬼':kind==='crow'?'纸鸦':'墨团妖'});return e;
 }
 cast(recognition:Recognition|Rune,direction:Point={x:1,y:0}){if(!this.active)return false;
 const r=typeof recognition==='string'?this.synthetic(recognition,direction):recognition;
 if(this.hualingPractice){
  if(this.hualing.selected)return false;
  if(!(r.valid&&r.rune&&['line','circle'].includes(r.rune))){
   if(typeof recognition!=='string')return this.castFallback(r);
   this.hualing.say('基础手势：直线、圆，其余笔迹沿路径划斩');return false;
  }
 }
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
 if(this.hualingPractice&&typeof recognition!=='string')this.hualing.castScene(r);
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
 damage(e:Enemy,amount:number,push=0,source:Pick<Skill,'id'|'rune'>|undefined=this.trackingSkill){if(e.hp<=0||!this.enemies.includes(e))return;const reduction=e.kind==='boss'&&e.armorPool>0?1-BOSS.armorReduction:1,actual=amount*reduction*(1+e.armor);e.hp-=actual;e.hit=.23;this.reportProgress('SPELL_DAMAGE',{spellId:source?.rune??'',castId:source?.id??'',enemyInstanceId:e.id,amount:actual});if(source)this.reportProgress('SPELL_HIT',{spellId:source.rune,castId:source.id,enemyInstanceId:e.id});
 if(e.kind==='boss'){e.armorPool=Math.max(0,e.armorPool-amount*.18);if(e.ai==='Telegraph'){e.vx+=actual;if(e.vx>=BOSS.burstInterrupt){e.ai='Hit';e.stateAge=0;e.vx=0;}}}
 else{const dx=e.x-WORLD.foxX,dy=e.y-WORLD.foxY,d=Math.hypot(dx,dy)||1;e.vx=dx/d*push*(e.kind==='oni'?.7:1);e.vy=dy/d*push*(e.kind==='oni'?.7:1);if(e.kind!=='oni'||push>=200){e.ai='Hit';e.stateAge=0;}}
 const dead=e.hp<=0;this.events.push({type:'strike',x:e.x,y:e.y,kind:e.kind,dead,amount:actual});
 if(dead){e.ai='Death';e.shock=0;e.vx=e.vy=0;this.score+=ENEMIES[e.kind].score;this.kills++;this.reportProgress('ENEMY_KILLED',{enemyTypeId:e.kind,name:e.kind==='boss'?'赤面鬼王':e.kind==='oni'?'赤面鬼':e.kind==='crow'?'纸鸦':'墨团妖',enemyInstanceId:e.id,spellId:source?.rune??'',castId:source?.id??''});if(e.kind==='boss'){this.bossDead=true;this.reportProgress('BOSS_DEFEATED',{lowHealth:this.life<this.maxHp*.2});}this.enemies=this.enemies.filter(v=>v.id!==e.id);this.xp+=this.practice?0:ENEMIES[e.kind].xp;while(this.xp>=this.xpNeeded){this.xp-=this.xpNeeded;this.level++;this.pendingLevels++;}if(this.pendingLevels&&this.active&&!this.enemiesFrozen&&!this.functionalRelics.stopped)this.offer();}
 }
 hurt(amount:number,practiceTest=false){if(this.practice&&!practiceTest)return;if(!this.active||this.invulnerable>0)return;const incoming=amount*(this.training?.65:1),absorbed=Math.min(this.shield,incoming);this.shield-=absorbed;const damage=incoming-absorbed;this.life=Math.max(0,this.life-damage);this.invulnerable=COMBAT.invulnerability;this.events.push({type:'hurt',amount:damage});if(damage>0)this.reportProgress('PLAYER_DAMAGED',{amount:damage});if(!this.life){if(this.functionalRelics.beginRevive()){this.state='reviving';this.events.push({type:'functionalRelic',kind:'reviveStart'});}else this.finishDefeat();}}
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
  this.lastResourceDt=0;
  if(this.state==='reviving'){this.functionalRelics.advanceRevive(interactionRealDt);this.resolveRevive();return;}
  if(!this.active)return;
  if(this.hualingPractice)this.hualing.advance(interactionRealDt,this.enemies,(e,n)=>this.damage(e,n,0,{id:-2,rune:'ink'}),drawing);
  if(this.interactionPractice)this.talismanBarrage.advance(interactionRealDt,this.enemies,(e,n)=>this.damage(e,n,0,{id:-1,rune:'ink'}),()=>this.events.push({type:'talismanBarrage',kind:'pulse',direction:{...this.talismanBarrage.direction}}));
  if(this.functionalRelics.enabled)this.functionalRelics.paperTiger.advance(interactionRealDt,this.enemies,this.interactions.bounds,(e,n)=>this.damage(e,n,0));
  const frozen=this.functionalRelics.advance(interactionRealDt);this.lastResourceDt=Math.max(0,interactionRealDt-frozen);
  if(this.practice&&this.burningSea.advance(interactionRealDt,this.enemies,(e,n)=>this.damage(e,n,0,{id:0,rune:'ink'})))this.events.push({type:'burningSeaExplosion'});
  if(this.interactionPractice)this.interactions.advance(interactionRealDt,this.enemies,(e,amount,source)=>this.damage(e,amount,0,source),event=>this.events.push({type:'lineInteraction',kind:event.kind,x:event.center.x,y:event.center.y}));
  const simulate=(dt:number,stopped:boolean)=>{this.enemiesFrozen=stopped||(this.hualingPractice&&this.hualing.frozen);const held=Math.min(dt,this.hitStopRemaining);this.hitStopRemaining=Math.max(0,this.hitStopRemaining-held);this.clock.real+=held;this.clock.advance(dt-held,!this.active,drawing||(this.hualingPractice&&this.hualing.drawing),step=>{this.update(step);return this.active&&this.hitStopRemaining<=0;});};
  const ratio=interactionRealDt>0?Math.min(1,frozen/interactionRealDt):0;
  if(ratio>0)simulate(realDt*ratio,true);if(ratio<1)simulate(realDt*(1-ratio),false);this.enemiesFrozen=false;
  if(this.pendingLevels&&this.active&&!this.practice&&!this.functionalRelics.stopped)this.offer();
  this.renderAlpha=Math.max(0,Math.min(1,this.clock.accumulator/this.clock.step));
 }
 update(dt:number){if(!this.active)return;this.renderAlpha=1;for(const e of this.enemies){e.prevX=e.x;e.prevY=e.y;}if(!this.enemiesFrozen)this.time+=dt;this.spellTime+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.shieldTime=Math.max(0,this.shieldTime-dt);if(!this.shieldTime)this.shield=0;
 this.wave=this.endless?Math.floor(this.time/30):Math.min(5,Math.floor(this.time/30));if(!this.enemiesFrozen)this.director.update(this,dt);
 for(const s of [...this.skills]){this.trackingSkill=s;TalismanSpellFactory.update(this,s,dt);this.trackingSkill=undefined;if(!this.active)break;}
 if(this.active)this.brush.update(this.spellTime,{targets:()=>this.enemies,damage:(id,amount)=>{const e=this.enemies.find(e=>e.id===id);if(e)this.damage(e,amount,0);}});
 this.skills=this.skills.filter(s=>s.age<s.duration);
 if(this.interactionPractice||this.hualingPractice)this.freeSlashes.update(dt,this.enemies,(e,n,id)=>this.damage(e,n,0,{id,rune:'ink'}));
 if(!this.active)return;for(const e of [...this.enemies]){if(this.enemiesFrozen){EnemyAI.status(this,e,dt);if(this.hualingPractice){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-dt*6);e.vy*=Math.exp(-dt*6);}else{e.x=e.prevX;e.y=e.prevY;}}else{EnemyAI.update(this,e,dt);containCircleEnemy(this,e);containAdvancedEnemy(this,e);}if(!this.active)break;}
 if(this.hualingPractice){this.hualing.contain(this.enemies);for(const e of this.enemies){const b=this.hualing.bounds;e.x=Math.max(b.left+15,Math.min(b.right-15,e.x));e.y=Math.max(b.top+20,Math.min(b.bottom-15,e.y));}}
 if(this.active&&this.time+1e-8>=this.duration&&this.bossDead){this.time=Math.max(this.duration,this.time);this.state='win';this.events.push({type:'win'});this.reportProgress('CHAPTER_CLEARED',{chapterId:'sunset-valley',seconds:this.time,score:this.score},true);this.reportProgress('RUN_ENDED',{result:'win',score:this.score,seconds:this.time},true);}
 }
 drain(){return this.events.splice(0);}
}
