import {configureThunder,updateThunder} from './thunder';
import {configureArrows,updateArrows} from './arrows';
import {circleStage} from './circle-levels';
import {configureSlash,updateSlash} from './slash';
import {WORLD,type Skill} from '../core/types';
import {SPELLS} from './config';
import {SkillTargetResolver as Target} from './target';
import type {Recognition,Point,Rune} from '../input/recognizer';
import type {Game} from './game';
export class TalismanSpellFactory{
 static create(game:Game,r:Recognition):Skill{const rune=r.rune!,cfg=SPELLS[rune],m=game.modifiers.resolve(rune);const len=Math.hypot(r.direction.x,r.direction.y)||1,direction={x:r.direction.x/len,y:r.direction.y/len};const skill:Skill={id:++game.serial,rune,age:0,direction,x:WORLD.foxX,y:WORLD.foxY,released:false,hit:new Set(),hitCounts:new Map(),geometry:r.geometry,quality:r.quality,damage:cfg.damage*(.8+.2*r.quality)*m.damage*(1+game.cultivation*.03),radius:cfg.radius*m.radius,range:cfg.range,duration:m.seal?Math.max(cfg.duration,m.sealDuration):cfg.duration,strength:m.strength,copies:m.copies,mirror:m.mirror,seal:m.seal,sealPower:m.sealPower,shock:m.shock,shockDuration:m.shockDuration,nextTick:.5,rotation:r.geometry.rotation,target:null,aimPoints:[]};if(rune==='z')configureThunder(skill);if(rune==='line')configureSlash(skill);if(rune==='triangle')configureArrows(skill);return skill;}
 static directions(s:Skill):Point[]{let dirs:Point[]=[s.direction];if(s.rune==='star'){const c=s.geometry.center;dirs=s.geometry.vertices.length===5?s.geometry.vertices.map(p=>{const d={x:p.x-c.x,y:p.y-c.y},n=Math.hypot(d.x,d.y)||1;return {x:d.x/n,y:d.y/n};}):Array.from({length:5},(_,i)=>({x:Math.cos(s.rotation+i*Math.PI*2/5),y:Math.sin(s.rotation+i*Math.PI*2/5)}));}if(s.mirror&&['line','triangle','star'].includes(s.rune)){for(const d of [...dirs]){const mirror={x:-d.x,y:d.y};if(!dirs.some(v=>Math.hypot(v.x-mirror.x,v.y-mirror.y)<.05))dirs.push(mirror);}}return dirs;}
 static update(g:Game,s:Skill,dt:number){s.age+=dt;
  if(s.rune==='z'){updateThunder(g,s);return;}if(s.rune==='line')updateSlash(g,s);if(s.rune==='triangle')updateArrows(g,s,dt);
  if(s.rune!=='line'&&s.rune!=='triangle'&&!s.released&&s.age>=.08){s.released=true;const cfg=SPELLS[s.rune];
   if(s.rune==='star'){for(const d of this.directions(s)){const targets=Target.ray(g.enemies,d,s.range,cfg.width*(s.testLevel&&s.testLevel>=3?1.5:1)).slice(0,8);for(const e of targets){const count=s.hitCounts.get(e.id)??0;if(count>=2)continue;s.hitCounts.set(e.id,count+1);s.hit.add(e.id);g.damage(e,s.damage,90*s.strength);}}}
   if(s.rune==='circle'){g.primaryAction({kind:'area',castId:s.id,origin:{x:s.x,y:s.y},direction:{...s.direction},damage:s.damage,radius:s.radius});g.shield=Math.max(g.shield,circleStage(s.testLevel).shield);g.shieldTime=s.duration;for(const e of [...g.enemies])if(Target.distance(e)<s.radius){s.hit.add(e.id);g.damage(e,s.damage,240*s.strength);}}
   if(s.rune==='spiral'){const e=Target.priority(g.enemies,s.direction,s.range);s.x=e?.x??WORLD.foxX+s.direction.x*180;s.y=e?.y??WORLD.foxY+s.direction.y*180;}
   if(s.rune==='ink')for(const e of Target.sector(g.enemies,s.direction,160,-.1).slice(0,2)){s.hit.add(e.id);g.damage(e,s.damage,30);}
  }
  if(s.rune==='spiral'&&s.released){for(const e of g.enemies){const d=Target.distance(e,s);if(d<s.radius&&d>8&&e.kind!=='oni'&&e.kind!=='boss'){e.x+=(s.x-e.x)/d*55*s.strength*dt;e.y+=(s.y-e.y)/d*55*s.strength*dt;}}}
  if(s.released&&(s.rune==='spiral'||s.seal)&&s.age+1e-8>=s.nextTick){s.nextTick+=.5;for(const e of [...g.enemies])if(Target.distance(e,s)<(s.rune==='spiral'?s.radius:160))g.damage(e,s.rune==='spiral'?s.damage:s.damage*.15*s.sealPower,0);}
 }
}
