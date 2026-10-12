import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {THUNDER_STAGES} from '../src/gameplay/thunder';
for(let level=1;level<=4;level++){
 const g=new Game();g.start();g.director.disabled=true;
 for(let i=0;i<9;i++){const e=g.spawn('crow',{x:470+i*12,y:580+i*12})!;e.hp=e.maxHp=3000;}
 g.cast('z',{x:1,y:0});const s=g.skills[0];applySkillLevel(s,level);const stage=THUNDER_STAGES[level-1];
 TalismanSpellFactory.update(g,s,stage.start-.09);assert.equal(s.hit.size,0);
 TalismanSpellFactory.update(g,s,.02);const first=s.thunder!.targets[0];const e=g.enemies.find(e=>e.id===first.id)!;e.x+=10;
 TalismanSpellFactory.update(g,s,.08);assert.equal(first.x,e.x);assert.equal(s.hit.size,1);
 const second=s.thunder!.targets[1];if(second){const dead=g.enemies.find(e=>e.id===second.id)!;g.enemies=g.enemies.filter(e=>e!==dead);}
 TalismanSpellFactory.update(g,s,1);assert.equal(s.hit.size,stage.targets-(second?1:0));
 const hp=g.enemies.map(e=>e.hp);TalismanSpellFactory.update(g,s,.3);assert.deepEqual(g.enemies.map(e=>e.hp),hp);
 assert.equal(s.thunder!.targets.length,stage.targets);
}
const g=new Game();g.start();g.director.disabled=true;g.cast('z');const s=g.skills[0];applySkillLevel(s,4);TalismanSpellFactory.update(g,s,2);assert.equal(s.hit.size,0);assert.equal(s.thunder!.targets.length,0);
console.log('PASS thunder four-stage delay, target caps, moving/dead targets, damage deduplication, empty cast');
