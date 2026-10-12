import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {SLASH_STAGES} from '../src/gameplay/slash';
import {visualEnd} from '../src/gameplay/ultimate';
for(const stage of SLASH_STAGES)for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI])for(const count of [1,3,5,8]){
 const g=new Game();g.start();g.director.disabled=true;const d={x:Math.cos(angle),y:Math.sin(angle)};
 const enemies=Array.from({length:count},(_,i)=>{const e=g.spawn('ink',{x:360+d.x*(70+i*40),y:665+d.y*(70+i*40)})!;e.hp=e.maxHp=1000;return e;});
 const outside=g.spawn('ink',{x:360-d.y*200,y:665+d.x*200})!;
 g.cast('line',d);const s=g.skills[0];applySkillLevel(s,stage.level);
 TalismanSpellFactory.update(g,s,stage.primary_hit_at-.001);assert.equal(s.hit.size,0);
 TalismanSpellFactory.update(g,s,.001);assert.equal(s.hit.size,stage.level===3?1:Math.min(count,stage.pierce));
 for(let i=0;i<100;i++)TalismanSpellFactory.update(g,s,.01);
 assert.equal(s.hit.size,Math.min(count,stage.pierce));assert.equal(outside.hp,outside.maxHp);
 enemies.forEach((e,i)=>{const center=s.slash?.secondaryCenter;const extra=stage.level===3&&i<stage.pierce?25:stage.level===4&&center&&Math.abs((e.x-center.x)*d.x+(e.y-center.y)*d.y)<=s.slash!.ultimate!.scrollWidth/2+23&&Math.abs(-(e.x-center.x)*d.y+(e.y-center.y)*d.x)<=s.slash!.ultimate!.scrollLength/2+23?s.slash!.ultimate!.secondaryDamage:0;assert.equal(e.hp,1000-(i<stage.pierce?stage.damage:0)-extra);assert.ok((s.hitCounts.get(e.id)??0)<=1);});
 assert.equal(s.range,stage.range);assert.equal(s.duration,stage.level===4?Math.max(visualEnd(s.slash!.ultimate!),s.slash!.ultimate!.scrollHoldUntil+s.slash!.ultimate!.fadeOutDuration):stage.visual_duration);assert.ok(s.slash!.extraHit.size<=count);
}
const clockGame=new Game();clockGame.start();clockGame.director.disabled=true;clockGame.cast('line');applySkillLevel(clockGame.skills[0],4);clockGame.pause();clockGame.advance(1);assert.equal(clockGame.skills[0].age,0);clockGame.pause();clockGame.advance(.5,true);assert.ok(Math.abs(clockGame.skills[0].age-.1)<1e-8);
console.log('PASS slash: 64 cases, four levels/directions/enemy counts; timing, caps, secondary IDs, off-axis exclusion, pause and slow motion');
