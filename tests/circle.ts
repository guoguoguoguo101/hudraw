import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {WORLD} from '../src/core/types';
import {recognize,type Point} from '../src/input/recognizer';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import {circleStage} from '../src/gameplay/circle-levels';
import {CIRCLE_BREAK_FADE,circleMode} from '../src/gameplay/circle';
import {TalismanSpellFactory} from '../src/gameplay/spells';
import {CircleRenderer} from '../src/rendering/circle';
const points=(center:Point,radius=100)=>Array.from({length:100},(_,i)=>{const a=i/99*Math.PI*2;return {x:center.x+Math.cos(a)*radius,y:center.y+Math.sin(a)*radius};});
const isolated=()=>{const g=new Game();g.start();g.director.disabled=true;g.invulnerable=999;return g;};
const advance=(g:Game,time:number)=>{for(let i=0;i<Math.round(time*120);i++)g.update(1/120);};
const cast=(g:Game,center:Point,level=1,radius=100)=>{g.ink.setAmount(100);const r=recognize(points(center,radius));assert.equal(r.rune,'circle');assert.ok(g.cast(r));const s=g.skills.at(-1)!;applySkillLevel(s,level);return s;};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

for(const level of [1,2,3,4]){
 const r=circleStage(level).radius;
 assert.equal(circleMode({x:WORLD.foxX,y:WORLD.foxY-r},r,level),'ward');
 assert.equal(circleMode({x:WORLD.foxX,y:WORLD.foxY-r-.01},r,level),'seal');
 for(const strokeSize of [55,100,175]){
  const g=isolated(),s=cast(g,{x:360,y:320},level,strokeSize);
  assert.equal(s.circle?.mode,'seal');assert.equal(s.radius,r);near(s.x,s.geometry.center.x);near(s.y,s.geometry.center.y);
  const damage=s.damage;applySkillLevel(s,level);near(s.damage,damage);
 }
}
{
 const g=isolated(),s=cast(g,{x:360,y:420});assert.equal(s.circle?.mode,'seal');
 applySkillLevel(s,4);assert.equal(s.circle?.mode,'ward');assert.equal(s.y,WORLD.foxY);
 advance(g,.1);const damage=s.damage;applySkillLevel(s,1);near(s.damage,damage);assert.equal(s.circle?.mode,'ward');
}
{
 const g=isolated(),inside=g.spawn('ink',{x:360,y:320})!,outside=g.spawn('ink',{x:620,y:900})!;
 inside.hp=inside.maxHp=2000;outside.hp=outside.maxHp=2000;
 g.shield=12;g.shieldTime=20;
 const s=cast(g,{x:360,y:320});advance(g,1);
 near(inside.hp,2000-s.damage*.9);assert.equal(outside.hp,2000);assert.equal(g.shield,12);
 assert.ok(s.circle?.captured.has(inside.id));assert.ok(!s.circle?.captured.has(outside.id));
}
{
 const g=isolated(),s=cast(g,{x:360,y:320}),e=g.spawn('crow',{x:s.x+160,y:s.y})!;
 e.hp=e.maxHp=2000;e.ai='Recovery';advance(g,.1);
 e.ai='Attack';e.stateAge=0;e.aim={x:1,y:0};
 advance(g,1.5);assert.ok(Math.hypot(e.x-s.x,e.y-s.y)<=s.radius-8+1e-6,'walking and dash cannot escape');
 const entering=g.spawn('ink',{x:s.x+s.radius+20,y:s.y})!;entering.hp=2000;entering.x=s.x+s.radius-4;advance(g,.05);assert.ok(s.circle?.captured.has(entering.id));
}
{
 const slow=isolated(),free=isolated(),a=slow.spawn('oni',{x:360,y:320})!,b=free.spawn('oni',{x:360,y:320})!;
 a.hp=b.hp=3000;a.ai=b.ai='Approach';cast(slow,{x:360,y:320});advance(slow,1);advance(free,1);
 assert.ok(a.y-320<(b.y-320)*.6,'elite movement slows');
 const g=isolated(),s=cast(g,{x:360,y:320}),boss=g.spawn('boss',{x:360,y:320})!;
 boss.ai='Telegraph';boss.stateAge=.1;advance(g,.1);assert.equal(boss.ai,'Telegraph');assert.ok(boss.stateAge>.15,'boss windup is not sealed');
 assert.equal(s.circle?.mode,'seal');
}
{
 const g=isolated(),s=cast(g,{x:360,y:320}),e=g.spawn('ink',{x:400,y:320})!;e.hp=e.maxHp=2000;advance(g,.1);
 // Check the final pulse directly so no AI movement obscures its radial knockback.
 advance(g,s.duration-CIRCLE_BREAK_FADE-.12);s.age=s.duration-CIRCLE_BREAK_FADE-.01;const hp=e.hp;TalismanSpellFactory.update(g,s,.02);
 near(e.hp,hp-s.damage*.6);assert.ok(e.vx>0,'burst points away from circle center');assert.equal(s.circle?.broken,true);
 const after=e.hp;TalismanSpellFactory.update(g,s,.1);near(e.hp,after);advance(g,.5);assert.ok(!g.skills.includes(s));
}
{
 const g=isolated(),s=cast(g,{x:360,y:320}),e=g.spawn('ink',{x:360,y:320})!;e.hp=1000;e.ai='Telegraph';e.stateAge=.4;
 advance(g,.1);assert.equal(e.ai,'Telegraph');assert.ok(e.stateAge>=.49,'damage does not create permanent hit-stun');
}
for(const level of [1,2,3,4,5]){
 const g=isolated(),s=cast(g,{x:360,y:665},level);advance(g,.1);
 assert.equal(s.circle?.mode,level===5?'ultimate':'ward');assert.equal(g.shield,circleStage(level).shield);
 if(level===5){const far=isolated(),u=cast(far,{x:360,y:320},5);assert.equal(u.circle?.mode,'ultimate');assert.equal(u.x,360);assert.equal(u.y,665);advance(far,.1);assert.equal(far.shield,120);}
}
{
 const renderer=new CircleRenderer();
 for(let level=1;level<=4;level++){
  const g=isolated(),s=cast(g,{x:360,y:320},level);advance(g,.8);renderer.update([s],g.enemies);
  const item=renderer.wards.get(s.id)!;assert.ok(item.seal);assert.equal(item.grand,undefined);assert.equal(item.seal.gates.length,level===4?4:0);assert.equal(item.back.x,s.x);assert.equal(item.front.y,s.y);
  const ritual=item.seal.ritual;assert.equal(ritual.lanterns.length,level===4?8:level>=2?4:0);assert.equal(ritual.folds.length,level===4?24:level===3?18:level===2?12:0);assert.equal(ritual.blades.length,level>=3?4:0);assert.equal(ritual.knots.length,level===4?4:0);
  const flamePath=()=>JSON.stringify(ritual.fires[0].art.context.instructions.map(i=>i.action==='fill'||i.action==='stroke'?i.data.path.instructions:[]));
  const children=ritual.back.children.length+ritual.front.children.length,flame=flamePath();
  s.age=1.3;renderer.update([s],g.enemies);assert.notEqual(flamePath(),flame,'fire shape bends during continuous state');
  for(let i=0;i<40;i++){s.age=1.3+i*.01;renderer.update([s],g.enemies);}assert.equal(ritual.back.children.length+ritual.front.children.length,children,'ornaments reuse cached parts');
  s.age=s.duration-.15;s.circle!.broken=true;renderer.update([s],g.enemies);assert.ok(ritual.rope.alpha<.5,'rope unlocks during rupture');renderer.clear();
 }
 assert.equal(renderer.wards.size,0);renderer.back.destroy({children:true});renderer.front.destroy({children:true});
}
console.log('PASS circle: center/level classification, stroke-size independence, ward and Lv5 preservation, DoT, confinement, elite/Boss resistance, one radial rupture, vector gates and cleanup');
