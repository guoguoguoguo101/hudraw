import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {SLASH_STAGES} from '../src/gameplay/slash';
import {recognize,resample} from '../src/input/recognizer';
import {SlashRenderer} from '../src/rendering/slash';

function cast(level:number,length:number,angle=0){
 const g=new Game();g.start(false,true);g.director.disabled=true;g.practiceLevels.line=level;
 const d={x:Math.cos(angle),y:Math.sin(angle)},center={x:360,y:580};
 const points=[{x:center.x-d.x*length/2,y:center.y-d.y*length/2},{x:center.x+d.x*length/2,y:center.y+d.y*length/2}];
 assert.ok(g.cast(recognize(points)));return {g,s:g.skills[0],d};
}
for(const level of [1,2,3,4,5])for(const length of [80,300,800])for(const angle of [0,Math.PI/2,Math.PI/4,Math.PI]){
 const {g,s}=cast(level,length,angle),stage=SLASH_STAGES[level-1];
 assert.ok(Math.abs(s.range-length*1.5)<1e-7);assert.equal(s.damage,stage.damage);
 const renderer=new SlashRenderer();
 for(const age of [.02,.10,.18,.30,.50,.70,.95]){
  if(age>s.duration)continue;
  TalismanSpellFactory.update(g,s,age-s.age);renderer.update([s]);
  const item=renderer.items.get(s.id)!;assert.equal(item.root.visible,true);
  if(level===1&&age>=.10&&age<.25){
   assert.equal(item.evolution!.root.visible,true,'handwritten Lv1 must render the layered blade, not bypass its effect');
   assert.ok(item.evolution!.core.context.instructions.length>0,'Lv1 has a visible ivory cutting edge even without a hit');
   assert.ok(item.evolution!.flames.context.instructions.length>0,'Lv1 retains its cinnabar brush wake');
  }
  for(const node of [item.root,...item.root.children]){
   const b=node.getBounds();assert.ok([b.x,b.y,b.width,b.height].every(Number.isFinite));
  }
 }
 renderer.root.destroy({children:true});
}
// Same midpoint, different primary lengths: scroll bounds and secondary damage areas stay fixed.
for(const level of [4,5]){
 const boxes:number[][]=[];const centers:{x:number;y:number}[]=[];const dimensions:number[][]=[];
 for(const length of [80,300,800]){
  const {g,s}=cast(level,length);TalismanSpellFactory.update(g,s,.55);
  const renderer=new SlashRenderer();renderer.update([s]);const item=renderer.items.get(s.id)!;
  const scroll=level===5?item.evolution!.body:item.layers[0],b=scroll.getBounds();
  boxes.push([b.x,b.y,b.width,b.height]);centers.push(s.slash!.secondaryCenter!);
  const p=s.slash!.ultimate!;dimensions.push([p.scrollLength,p.scrollWidth,p.secondaryDamage]);
  renderer.root.destroy({children:true});
 }
 for(let i=1;i<boxes.length;i++){
  boxes[i].forEach((v,j)=>assert.ok(Math.abs(v-boxes[0][j])<1e-5));
  assert.deepEqual(centers[i],centers[0]);assert.deepEqual(dimensions[i],dimensions[0]);
 }
}
// All 12 targets get one main hit, including Lv3's staggered contact feedback.
for(const level of [1,2,3,4,5]){
 const {g,s}=cast(level,300);
 for(let i=0;i<12;i++){const e=g.spawn('crow',{x:180+i*30,y:580})!;e.hp=e.maxHp=1000;e.ai='Recovery';}
 for(let i=0;i<40;i++)TalismanSpellFactory.update(g,s,.01);
 assert.equal(s.hit.size,12);assert.ok([...s.hitCounts.values()].every(n=>n===1));
 assert.equal(s.slash!.contacts.filter(c=>!c.secondary).length,12);
}
for(const points of [
 [{x:100,y:500},{x:300,y:500},{x:280,y:500},{x:500,y:500}],
 [{x:100,y:500},{x:300,y:500},{x:100,y:500},{x:400,y:500}]
])for(const reverse of [false,true]){
 const r=recognize(reverse?[...points].reverse():points);assert.equal(r.rune,'ink');
 const g=new Game();g.start();g.cast(r);assert.equal(g.skills.length,0);
}
const dense=recognize(resample([{x:100,y:500},{x:700,y:500}],600));
assert.equal(dense.rune,'line');assert.equal(dense.geometry.raw.at(-1)!.x,700);
console.log('PASS hand-drawn slash: 60 visual cases, 1.5x length, all-target unique hits, preserved scroll bounds, retracing rejection and dense endpoints');
