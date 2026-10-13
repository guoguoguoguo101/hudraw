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
 pen=new BrushSettings();formalCasts=0;
 practice=false;endless=false;
 practiceLevels:Record<ActiveRune,number>={line:1,circle:1,triangle:1,z:1};
 onProgress?: (type:ProgressEventType,payload:Record<string,unknown>,critical?:boolean)=>void;
 private reportProgress(type:ProgressEventType,payload:Record<string,unknown>,critical=false){if(!this.training&&!this.practice)this.onProgress?.(type,payload,critical);}
 trackingSkill?:Skill;
 hitStopRemaining=0;renderAlpha=1;state:State='menu';previous:State='playing';time=0;score=0;life=100;maxHp=100;invulnerable=0;cooldown=0;enemies:Enemy[]=[];skills:Skill[]=[];events:Event[]=[];serial=0;seed=734;casts=0;kills=0;taught=new Set<Rune>();wave=0;
 brush=new CinnabarBrush();
 primaryAction(action:PrimaryAction){this.brush.onPrimary(action,this.time);}
 clock=new CombatClock();ink=new InkResourceManager();director=new SpawnDirector();modifiers=new CombatModifierSystem();shield=0;shieldTime=0;level=1;xp=0;pendingLevels=0;choices:RelicId[]=[];training=false;bossDead=false;cultivation=0;duration=COMBAT.duration;
 get active(){return this.state==='playing'||this.state==='tutorial';}
 get xpNeeded(){return 24+this.level*18;}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 start(training=false,practice=false,endless=false){this.practice=practice;this.endless=endless&&!practice&&!training;this.brush.clear();this.hitStopRemaining=0;this.training=training;this.state=training?'tutorial':'playing';this.time=0;this.duration=practice||this.endless?Infinity:training?COMBAT.trainingDuration:COMBAT.duration;this.score=0;this.maxHp=100+Math.min(10,this.cultivation)*4;this.life=this.maxHp;this.invulnerable=0;this.cooldown=0;this.enemies=[];this.skills=[];this.events=[];this.casts=0;this.formalCasts=0;this.kills=0;this.taught.clear();this.wave=0;this.seed=734;this.clock.reset();this.ink.reset(practice);this.director.reset();this.modifiers=new CombatModifierSystem();this.shield=this.shieldTime=0;this.level=1;this.xp=0;this.pendingLevels=0;this.choices=[];this.bossDead=false;this.reportProgress('RUN_STARTED',{chapterId:'sunset-valley',training});this.reportProgress('CHAPTER_ENTERED',{chapterId:'sunset-valley'});}
 menu(){if(['playing','tutorial','paused','upgrade'].includes(this.state))this.reportProgress('RUN_ENDED',{result:'abandoned',score:this.score,seconds:this.time},true);this.brush.clear();this.practice=false;this.endless=false;this.state='menu';this.enemies=[];this.skills=[];this.events=[];}
 pause(){if(this.active){this.previous=this.state;this.state='paused';}else if(this.state==='paused')this.state=this.previous;}
 spawn(kind:EnemyKind,at?:Point){if(kind==='boss'&&this.enemies.some(e=>e.kind==='boss'))return null;if(kind==='oni'&&this.enemies.filter(e=>e.kind==='oni').length>=COMBAT.eliteCap)return null;if((kind==='ink'||kind==='crow')&&this.enemies.filter(e=>e.kind==='ink'||e.kind==='crow').length>=COMBAT.ordinaryCap)return null;
 const side=Math.floor(this.random()*4),p=at??(side===0?{x:50,y:300+this.random()*650}:side===1?{x:670,y:300+this.random()*650}:side===2?{x:100+this.random()*520,y:260}:{x:120+this.random()*480,y:1050});const m=ENEMIES[kind];
 const e:Enemy={id:++this.serial,kind,...p,prevX:p.x,prevY:p.y,hp:m.hp,maxHp:m.hp,speed:m.speed,age:0,hit:0,vx:0,vy:0,ai:'Spawn',stateAge:0,aim:{x:0,y:1},armor:0,armorTime:0,shock:0,attackOrigin:{...p},phase:1,armorPool:kind==='boss'?BOSS.armorPool:0};this.enemies.push(e);this.reportProgress('ENEMY_SEEN',{enemyTypeId:kind,name:kind==='boss'?'赤面鬼王':kind==='oni'?'赤面鬼':kind==='crow'?'纸鸦':'墨团妖'});return e;
 }
 cast(recognition:Recognition|Rune,direction:Point={x:1,y:0}){if(!this.active)return false;
 const r=typeof recognition==='string'?this.synthetic(recognition,direction):recognition;if(!r.valid||!r.rune)return false;
 let automatic:number|null=null;
 if(r.gestureId!==undefined){if(this.ink.pending?.id!==r.gestureId||!this.ink.pending.effective)return false;}
 else{let length=0;for(let i=1;i<r.geometry.raw.length;i++)length+=Math.hypot(r.geometry.raw[i].x-r.geometry.raw[i-1].x,r.geometry.raw[i].y-r.geometry.raw[i-1].y);automatic=this.ink.automatic(length);if(automatic===null)return false;}
 // A valid failed glyph is a settled input, never a combat skill.
 if(r.rune==='ink'){if(automatic!==null)this.ink.settle(automatic,false,'ink','automatic');return true;}
 let s:Skill;try{s=TalismanSpellFactory.create(this,r);}catch(error){this.ink.cancel('rejected');throw error;}
 this.casts++;this.formalCasts++;this.taught.add(r.rune);if(this.practice){if(r.rune in this.practiceLevels)applySkillLevel(s,this.practiceLevels[r.rune as ActiveRune]);}if(typeof recognition!=='string'&&s.rune==='line')attachSwipe(s);this.brush.beginCast(s.id,this.modifiers.count('brush'));this.reportProgress('SPELL_CAST_SUCCESS',{spellId:r.rune,name:r.reason,castId:s.id,points:r.normalized});
 if(s.rune==='spiral'){const vortices=this.skills.filter(v=>v.rune==='spiral');if(vortices.length>=2)this.skills=this.skills.filter(v=>v.id!==vortices[0].id);}
 if(this.skills.length>=12)this.skills.shift();this.skills.push(s);this.events.push({type:'cast',rune:s.rune,direction:s.direction});
 if(s.rune!=='ink'&&this.modifiers.count('feather')&&this.formalCasts%3===0){const e=[...this.enemies].sort((a,b)=>SkillTargetResolver.score(b)-SkillTargetResolver.score(a))[0];if(e){this.events.push({type:'foxfire',from:{x:360,y:665},to:{x:e.x,y:e.y}});this.damage(e,45*(1+.25*Math.max(0,this.modifiers.count('feather')-1)),60);}}
 if(automatic!==null)this.ink.settle(automatic,true,r.rune,'automatic');return true;}
 synthetic(rune:Rune,direction:Point){const r=recognize(resample([{x:230,y:580},{x:450,y:580}]));r.rune=rune;r.reason=rune;r.direction=direction;r.quality=1;r.confidence=1;r.valid=true;return r;}
 breakArmor(e:Enemy){e.armor=SPELLS.triangle.armor;e.armorTime=3;e.armorPool=0;if(e.ai==='Telegraph'||e.ai==='Attack'){e.ai='Hit';e.stateAge=0;}}
 damage(e:Enemy,amount:number,push=0){if(e.hp<=0||!this.enemies.includes(e))return;const reduction=e.kind==='boss'&&e.armorPool>0?1-BOSS.armorReduction:1,actual=amount*reduction*(1+e.armor);e.hp-=actual;e.hit=.23;const source=this.trackingSkill;this.reportProgress('SPELL_DAMAGE',{spellId:source?.rune??'',castId:source?.id??'',enemyInstanceId:e.id,amount:actual});if(source)this.reportProgress('SPELL_HIT',{spellId:source.rune,castId:source.id,enemyInstanceId:e.id});
 if(e.kind==='boss'){e.armorPool=Math.max(0,e.armorPool-amount*.18);if(e.ai==='Telegraph'){e.vx+=actual;if(e.vx>=BOSS.burstInterrupt){e.ai='Hit';e.stateAge=0;e.vx=0;}}}
 else{const dx=e.x-WORLD.foxX,dy=e.y-WORLD.foxY,d=Math.hypot(dx,dy)||1;e.vx=dx/d*push*(e.kind==='oni'?.7:1);e.vy=dy/d*push*(e.kind==='oni'?.7:1);if(e.kind!=='oni'||push>=200){e.ai='Hit';e.stateAge=0;}}
 const dead=e.hp<=0;this.events.push({type:'strike',x:e.x,y:e.y,kind:e.kind,dead,amount:actual});
 if(dead){e.ai='Death';e.shock=0;e.vx=e.vy=0;this.score+=ENEMIES[e.kind].score;this.kills++;this.reportProgress('ENEMY_KILLED',{enemyTypeId:e.kind,name:e.kind==='boss'?'赤面鬼王':e.kind==='oni'?'赤面鬼':e.kind==='crow'?'纸鸦':'墨团妖',enemyInstanceId:e.id,spellId:source?.rune??'',castId:source?.id??''});if(e.kind==='boss'){this.bossDead=true;this.reportProgress('BOSS_DEFEATED',{lowHealth:this.life<this.maxHp*.2});}this.enemies=this.enemies.filter(v=>v.id!==e.id);this.xp+=this.practice?0:ENEMIES[e.kind].xp;while(this.xp>=this.xpNeeded){this.xp-=this.xpNeeded;this.level++;this.pendingLevels++;}if(this.pendingLevels&&this.active)this.offer();}
 }
 hurt(amount:number){if(this.practice)return;if(!this.active||this.invulnerable>0)return;const incoming=amount*(this.training?.65:1),absorbed=Math.min(this.shield,incoming);this.shield-=absorbed;const damage=incoming-absorbed;this.life=Math.max(0,this.life-damage);this.invulnerable=COMBAT.invulnerability;this.events.push({type:'hurt',amount:damage});if(damage>0)this.reportProgress('PLAYER_DAMAGED',{amount:damage});if(!this.life){this.state='lose';this.events.push({type:'lose'});this.reportProgress('RUN_ENDED',{result:'lose',score:this.score,seconds:this.time},true);}}
 offer(){this.previous=this.training?'tutorial':'playing';this.state='upgrade';const pool=RELICS.filter(r=>r.id!=='brush'||this.modifiers.count('brush')<3).map(r=>r.id);this.choices=[];for(let i=0;i<3;i++)this.choices.push(pool.splice(Math.floor(this.random()*pool.length),1)[0]);this.events.push({type:'upgrade'});}
 choose(index:number){if(this.state!=='upgrade'||!this.choices[index])return;const id=this.choices[index];this.modifiers.add(id);this.reportProgress('ITEM_ACQUIRED',{itemId:id,name:RELICS.find(r=>r.id===id)?.name,level:this.modifiers.count(id)},true);this.pendingLevels--;this.life=Math.min(this.maxHp,this.life+8);if(this.pendingLevels)this.offer();else{this.state=this.previous;this.choices=[];}}
 advance(realDt:number,drawing=false){if(!this.active)return;const held=Math.min(realDt,this.hitStopRemaining);this.hitStopRemaining=Math.max(0,this.hitStopRemaining-held);this.clock.real+=held;realDt-=held;this.clock.advance(realDt,!this.active,drawing,dt=>{this.update(dt);return this.active&&this.hitStopRemaining<=0;});this.renderAlpha=Math.max(0,Math.min(1,this.clock.accumulator/this.clock.step));}
 update(dt:number){if(!this.active)return;this.renderAlpha=1;for(const e of this.enemies){e.prevX=e.x;e.prevY=e.y;}this.time+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.shieldTime=Math.max(0,this.shieldTime-dt);if(!this.shieldTime)this.shield=0;
 this.wave=this.endless?Math.floor(this.time/30):Math.min(5,Math.floor(this.time/30));this.director.update(this,dt);
 for(const s of [...this.skills]){this.trackingSkill=s;TalismanSpellFactory.update(this,s,dt);this.trackingSkill=undefined;if(!this.active)break;}
 if(this.active)this.brush.update(this.time,{targets:()=>this.enemies,damage:(id,amount)=>{const e=this.enemies.find(e=>e.id===id);if(e)this.damage(e,amount,0);}});
 this.skills=this.skills.filter(s=>s.age<s.duration);
 if(!this.active)return;for(const e of [...this.enemies]){EnemyAI.update(this,e,dt);containCircleEnemy(this,e);if(!this.active)break;}
 if(this.active&&this.time+1e-8>=this.duration&&this.bossDead){this.time=Math.max(this.duration,this.time);this.state='win';this.events.push({type:'win'});this.reportProgress('CHAPTER_CLEARED',{chapterId:'sunset-valley',seconds:this.time,score:this.score},true);this.reportProgress('RUN_ENDED',{result:'win',score:this.score,seconds:this.time},true);}
 }
 drain(){return this.events.splice(0);}
}
