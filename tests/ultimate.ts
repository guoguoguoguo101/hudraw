import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {ultimateTiming,scrollWidth,selectUltimate,ultimateParams} from '../src/gameplay/ultimate';
for(const variant of ['A','B'] as const)for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5]){
 selectUltimate(variant);const g=new Game();g.start();g.director.disabled=true;const d={x:Math.cos(angle),y:Math.sin(angle)},n={x:-d.y,y:d.x};
 const e=g.spawn('ink',{x:360+d.x*170,y:665+d.y*170})!;e.hp=e.maxHp=1000;
 const side=g.spawn('crow',{x:360+d.x*170+n.x*125,y:665+d.y*170+n.y*125})!;side.hp=side.maxHp=1000;
 const outside=g.spawn('ink',{x:360+d.x*170+n.x*300,y:665+d.y*170+n.y*300})!;
 g.cast('line',d);const s=g.skills[0];applySkillLevel(s,4);TalismanSpellFactory.update(g,s,.14);
 assert.equal(e.hp,855);assert.equal(side.hp,1000);assert.ok(g.hitStopRemaining>0);const age=s.age;g.advance(.01);assert.equal(s.age,age);
 TalismanSpellFactory.update(g,s,.07);assert.equal(e.hp,855);assert.equal(s.slash!.secondaryDone,undefined);TalismanSpellFactory.update(g,s,.14);assert.equal(e.hp,795);assert.equal(side.hp,940);assert.equal(outside.hp,40);
 assert.equal(s.slash!.extraHit.size,2);assert.ok(e.vx*d.x+e.vy*d.y>=ultimateParams.knockbackForce-1e-8);
 TalismanSpellFactory.update(g,s,.25);assert.equal(e.hp,795);assert.equal(side.hp,940);
 const original=s.slash!.ultimate!.slashWidth;ultimateParams.slashWidth=220;assert.equal(s.slash!.ultimate!.slashWidth,original);
}
selectUltimate('B');console.log('PASS A/B: five directions, primary/secondary separate IDs, off-path AoE, hit stop, directional knockback, config snapshots');

selectUltimate('B');
assert.ok(scrollWidth(ultimateParams,.05)<scrollWidth(ultimateParams,.48));
assert.ok(scrollWidth(ultimateParams,.48)<scrollWidth(ultimateParams,.82));
assert.equal(scrollWidth(ultimateParams,1),0);
assert.equal(ultimateParams.slashLength,780);
const spreadGame=new Game();spreadGame.start();spreadGame.director.disabled=true;
const near=spreadGame.spawn('ink',{x:440,y:725})!;near.hp=1000;
const far=spreadGame.spawn('ink',{x:940,y:745})!;far.hp=1000;
spreadGame.cast('line',{x:1,y:0});const expanded=spreadGame.skills[0];applySkillLevel(expanded,4);
TalismanSpellFactory.update(spreadGame,expanded,.14);
assert.equal(near.hp,1000);assert.equal(far.hp,855);
console.log('PASS final scroll: progressive width, closed tip, expanded reach, narrow origin and wide downstream hit region');

const p=ultimateParams;assert.equal(ultimateTiming(p,.18).scrollProgress,0);assert.ok(ultimateTiming(p,.18).waveProgress>1-1e-8);assert.ok(ultimateTiming(p,.27).scrollProgress>0&&ultimateTiming(p,.27).scrollProgress<1);assert.equal(ultimateTiming(p,.48).scrollAlpha,1);assert.ok(ultimateTiming(p,.65).scrollAlpha>0);assert.equal(ultimateTiming(p,.92).scrollAlpha,0);
console.log('PASS wave precedes scroll, unfolding interval, hold and extended fade');

for(const t of [.18,.48,.56,.65,.80,.92])assert.equal(ultimateTiming(p,t).waveAlpha,ultimateTiming(p,t).scrollAlpha);
assert.ok(ultimateTiming(p,.65).waveAlpha>.7);
console.log("PASS wave holds through scroll opening and fades together over 0.35 seconds");
