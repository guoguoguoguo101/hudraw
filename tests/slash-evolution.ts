import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {SlashEvolution,evolutionTiming} from '../src/rendering/slash-evolution';
const capture=(r:SlashEvolution)=>r.root.children.map(g=>{
 const node=g as import('pixi.js').Graphics;return node.context.instructions.map(i=>{const p=i as unknown as {action:string;data:{path:{instructions:unknown[]}}};return {action:p.action,path:p.data.path.instructions};});
});
for(const lv of [1,2,3,5])for(const angle of [0,Math.PI/2,Math.PI/4,Math.PI]){
 const g=new Game();g.start();g.director.disabled=true;g.cast('line',{x:Math.cos(angle),y:Math.sin(angle)});const s=g.skills[0];applySkillLevel(s,lv);assert.equal(s.slash!.level,lv);
 const r=new SlashEvolution();for(const t of [.02,.06,.14,.24,.38,.56,.70,.95,1.15]){s.age=t;r.update(s);const before=capture(r);r.update(s);assert.deepEqual(capture(r),before);const instructions=JSON.stringify(before);assert.ok(!instructions.includes('NaN'));if(lv===5){assert.equal(r.landscape.mask,r.mask);assert.equal(r.landscape.visible,t>.23);}}
 r.destroy();
}
assert.equal(evolutionTiming(1,.05).travel,0);assert.ok(evolutionTiming(1,.11).travel<1);assert.equal(evolutionTiming(5,.20).open,0);assert.equal(evolutionTiming(5,.56).open,1);assert.equal(evolutionTiming(5,.56).finish,0);assert.equal(evolutionTiming(5,1.15).dissolve,1);
for(const fps of [30,60,120]){const g=new Game();g.start();g.director.disabled=true;g.cast('line');applySkillLevel(g.skills[0],5);g.pause();g.advance(1);assert.equal(g.skills[0].age,0);g.pause();for(let i=0;i<fps;i++)g.advance(1/fps,true);assert.ok(Math.abs(g.skills[0].age-.20)<1e-8);}
console.log('PASS slash evolution: four new tiers/all directions, deterministic paths, masks, phased timeline, pause and FPS-independent realm');
