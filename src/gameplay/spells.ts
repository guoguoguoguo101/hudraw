import {updateInteractionLine} from './interaction-line';
import {configureSancai,updateSancai} from './sancai';
import {SANCAI} from './sancai-config';
import {configureWave,updateWave,configureBinding,updateBinding} from './advanced-spells';
import {configureMoonTail,updateMoonTail} from './moon-tail';
import {configureThunder,updateThunder} from './thunder';
import {configureArrows,updateArrows} from './arrows';
import {configureCircle,updateCircle} from './circle';
import {configureSlash,updateSlash} from './slash';
import {WORLD,type Skill} from '../core/types';
import {SPELLS} from './config';
import {SkillTargetResolver as Target} from './target';
import type {Recognition,Point,Rune} from '../input/recognizer';
import type {Game} from './game';
export class TalismanSpellFactory{
 static create(game:Game,r:Recognition):Skill{if(r.rune==='ink')throw new Error('未成符不得创建战斗技能');const rune=r.rune!,cfg=SPELLS[rune],m=game.modifiers.resolve(rune);const aim=rune==='arc'||rune==='sancai'?{x:r.geometry.center.x-WORLD.foxX,y:r.geometry.center.y-WORLD.foxY}:r.direction;const chosen=(rune==='arc'||rune==='sancai')&&Math.hypot(aim.x,aim.y)<(rune==='sancai'?SANCAI.nearFox:48)?game.lastAim:aim;const len=Math.hypot(chosen.x,chosen.y)||1,direction={x:chosen.x/len,y:chosen.y/len};const skill:Skill={id:++game.serial,rune,age:0,direction,x:WORLD.foxX,y:WORLD.foxY,released:false,hit:new Set(),hitCounts:new Map(),geometry:r.geometry,quality:r.quality,damage:cfg.damage*(['arc','z','wave','spiral'].includes(rune)?1:(.8+.2*r.quality))*m.damage*(1+game.cultivation*.03),radius:cfg.radius*m.radius,range:cfg.range,duration:m.seal?Math.max(cfg.duration,m.sealDuration):cfg.duration,strength:m.strength,copies:m.copies,mirror:m.mirror,seal:m.seal,sealPower:m.sealPower,shock:m.shock,shockDuration:m.shockDuration,nextTick:.5,rotation:r.geometry.rotation,target:null,aimPoints:[]};if(rune==='sancai')configureSancai(skill);if(rune==='arc'){skill.x+=direction.x*24;skill.y+=direction.y*24;configureMoonTail(skill);}if(rune==='z')configureThunder(skill);if(rune==='wave')configureWave(skill);if(rune==='spiral')configureBinding(skill);if(rune==='line')configureSlash(skill);if(rune==='triangle')configureArrows(skill);if(rune==='circle')configureCircle(skill);return skill;}
 static directions(s:Skill):Point[]{let dirs:Point[]=[s.direction];if(s.rune==='star'){const c=s.geometry.center;dirs=s.geometry.vertices.length===5?s.geometry.vertices.map(p=>{const d={x:p.x-c.x,y:p.y-c.y},n=Math.hypot(d.x,d.y)||1;return {x:d.x/n,y:d.y/n};}):Array.from({length:5},(_,i)=>({x:Math.cos(s.rotation+i*Math.PI*2/5),y:Math.sin(s.rotation+i*Math.PI*2/5)}));}if(s.mirror&&['line','triangle','star'].includes(s.rune)){for(const d of [...dirs]){const mirror={x:-d.x,y:d.y};if(!dirs.some(v=>Math.hypot(v.x-mirror.x,v.y-mirror.y)<.05))dirs.push(mirror);}}return dirs;}
 static update(g:Game,s:Skill,dt:number){s.age+=dt;if(s.rune==='ink'){s.duration=0;s.released=true;return;}
  if(s.rune==='sancai'){updateSancai(g,s,dt);return;}
  if(s.rune==='wave'){updateWave(g,s,dt);return;}if(s.rune==='spiral'){updateBinding(g,s,dt);return;}if(s.rune==='arc'){updateMoonTail(g,s,dt);return;}if(s.rune==='z'){updateThunder(g,s);return;}if(s.rune==='circle'){if(!s.circle)configureCircle(s);updateCircle(g,s);return;}if(s.rune==='line'){if(s.interactionLine)updateInteractionLine(g,s);else updateSlash(g,s);}if(s.rune==='triangle')updateArrows(g,s,dt);
  if(s.rune!=='line'&&s.rune!=='triangle'&&!s.released&&s.age>=.08){s.released=true;const cfg=SPELLS[s.rune];
   if(s.rune==='star'){for(const d of this.directions(s)){const targets=Target.ray(g.enemies,d,s.range,cfg.width*(s.testLevel&&s.testLevel>=3?1.5:1)).slice(0,8);for(const e of targets){const count=s.hitCounts.get(e.id)??0;if(count>=2)continue;s.hitCounts.set(e.id,count+1);s.hit.add(e.id);g.damage(e,s.damage,90*s.strength);}}}


  }

 }
}
