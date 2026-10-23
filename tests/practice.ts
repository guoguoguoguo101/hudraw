import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {SKILL_LEVELS,type ActiveRune} from '../src/gameplay/skill-levels';
import {castPracticeRune} from '../src/gameplay/practice-cast';
import {FoxVestment} from '../src/rendering/fox-vestment';

const game=new Game(),progress:string[]=[];game.onProgress=type=>progress.push(type);
game.start(false,true);assert.equal(game.duration,Infinity);
for(const rune of ['line','circle','triangle','z','arc'] as ActiveRune[]){
 for(let level=1;level<=SKILL_LEVELS[rune].length;level++){
  game.practiceLevels[rune]=level;game.ink.setAmount(0);
  assert.equal(game.cast(rune),true);const skill=game.skills[game.skills.length-1];
  assert.equal(skill.testLevel,level);assert.equal(game.ink.unlimited,true);
  if(rune==='line')assert.equal(skill.slash?.level,level);
  if(rune==='triangle')assert.equal(skill.arrows?.level,level);
  if(rune==='z')assert.equal(skill.thunder?.level,level);
 }
}
assert.equal(game.practiceLevels.line,5);assert.equal(game.practiceLevels.triangle,4);
const angles=new Set<string>();
for(const rune of ['line','circle','triangle','z','arc'] as ActiveRune[]){
 for(let i=0;i<8;i++){
  assert.equal(castPracticeRune(game,rune),true);
  const skill=game.skills[game.skills.length-1];assert.equal(skill.rune,rune);assert.equal(skill.testLevel,game.practiceLevels[rune]);
  assert.ok(skill.geometry.raw.length>=64);assert.ok(Math.abs(Math.hypot(skill.direction.x,skill.direction.y)-1)<1e-8);
  angles.add(Math.atan2(skill.direction.y,skill.direction.x).toFixed(5));
 }
}
assert.equal(angles.size,40,'each auto-cast uses a fresh random direction');
game.cast('triangle');const guardian=game.skills[game.skills.length-1],vestment=new FoxVestment();
for(let i=0;i<48;i++){guardian.age=i*.1;vestment.update(guardian);}
const cachedParts=[...vestment.parts.back.values(),...vestment.parts.front.values()];
for(let i=0;i<48;i++){guardian.age=i*.1;vestment.update(guardian);}
assert.equal(vestment.parts.back.size+vestment.parts.front.size,cachedParts.length,'repeated phases reuse the same bounded glyph parts');
assert.ok(cachedParts.every(part=>!part.graphic.destroyed),'phase changes do not destroy cached glyph parts');
vestment.root.destroy({children:true});vestment.back.destroy({children:true});
game.skills=[];game.hurt(10000);assert.equal(game.life,100);assert.equal(game.state,'playing');
for(let i=0;i<220*60;i++)game.update(1/60);
assert.equal(game.state,'playing');assert.ok(game.enemies.length>0&&game.enemies.length<=12);
assert.ok(game.enemies.every(e=>e.kind==='ink'||e.kind==='crow'));
for(let round=0;round<50;round++){
 const enemy=game.enemies[0];if(enemy)game.damage(enemy,10000);
 for(let i=0;i<40;i++)game.update(1/60);
}
assert.ok(game.enemies.length>0);assert.equal(game.pendingLevels,0);assert.equal(game.state,'playing');assert.equal(progress.length,0);
game.menu();assert.equal(game.practice,false);game.start();assert.equal(game.duration,180);
assert.equal(castPracticeRune(game,'line'),false,'auto-cast is restricted to practice');
assert.ok(progress.includes('RUN_STARTED'));game.ink.setAmount(0);assert.equal(game.cast('line'),false);
game.hurt(10000);assert.equal(game.state,'lose');
console.log('PASS: practice levels, infinite ink, invulnerability, endless bounded spawning, no upgrade interruption, progress isolation, normal mode restored');
