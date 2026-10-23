import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {recognize,resample,type Point} from '../src/input/recognizer';
import {glyphSample} from '../src/input/glyph-samples';
import {InputController} from '../src/input/controller';
import {AdvancedSpellRenderer} from '../src/rendering/advanced-spells';
import {ThunderRenderer} from '../src/rendering/thunder';
import {THUNDER_STAGES} from '../src/gameplay/thunder';
import {WAVE_STAGES} from '../src/gameplay/advanced-spells';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import type {PlatformAdapter} from '../src/platform/adapter';
const world=(p:Point[])=>p.map(v=>({x:v.x+360,y:v.y+665}));
const setup=()=>{const g=new Game();g.start(false,true);g.director.disabled=true;return g;};
const enemy=(g:Game,p:Point,kind:'ink'|'oni'|'boss'='ink')=>{const e=g.spawn(kind,p)!;e.hp=e.maxHp=5000;e.armorPool=0;e.speed=0;e.ai='Telegraph';e.stateAge=-100;return e;};
const advance=(g:Game,t:number)=>{for(let i=0;i<Math.round(t*120);i++)g.advance(1/120);};
let count=0;const test=(n:string,f:()=>void)=>{f();count++;console.log('PASS advanced: '+n);};
test('all seven glyphs rotate, reverse and tolerate sample density',()=>{
 for(const rune of ['line','circle','triangle','arc','z','wave','spiral'] as const)for(const angle of [0,.7,1.57,3.14])for(const samples of [64,160,300]){
  const p=resample(glyphSample(rune),samples).map(v=>({x:360+v.x*Math.cos(angle)-v.y*Math.sin(angle),y:665+v.x*Math.sin(angle)+v.y*Math.cos(angle)}));
  assert.equal(recognize(p).rune,rune,`${rune} ${angle} ${samples}`);assert.equal(recognize([...p].reverse()).rune,rune);
 }
});
test('half circle with finger jitter or short reverse tail stays basic; shallow S never promotes',()=>{
 const arc=world(glyphSample('arc')),jitter=arc.map((v,i)=>({x:v.x+Math.sin(i)*.7,y:v.y+Math.cos(i)*.7}));assert.equal(recognize(jitter).rune,'arc');
 const end=arc.at(-1)!;assert.notEqual(recognize([...arc,{x:end.x+3,y:end.y-3},{x:end.x+6,y:end.y-2}]).rune,'wave');
 const shallow=Array.from({length:160},(_,i)=>({x:150+i*2,y:500+Math.sin(i/159*Math.PI*2)*8}));assert.notEqual(recognize(shallow).rune,'wave');
 const circle=world(glyphSample('circle'));assert.equal(recognize(circle).rune,'circle');assert.equal(recognize([...circle,...circle.slice(1)]).rune,'spiral');
 const tiny=Array.from({length:200},(_,i)=>({x:360+Math.cos(i/199*Math.PI*6)*10,y:500+Math.sin(i/199*Math.PI*6)*10}));assert.notEqual(recognize(tiny).rune,'spiral');
 assert.notEqual(recognize(resample([{x:150,y:400},{x:300,y:400},{x:300,y:550},{x:150,y:550}])).rune,'z');
});
test('lightning follows later path, ignores off-path priority, and caps nodes and repeated damage',()=>{
 for(let level=1;level<=4;level++){
  const g=setup();g.practiceLevels.z=level;const pts=world(glyphSample('z')),r=recognize(pts);g.cast(r);const s=g.skills[0],stage=THUNDER_STAGES[level-1];
  assert.ok(s.thunder!.targets.length<=stage.targets);const p=pts.at(-2)!,e=enemy(g,p),off=enemy(g,{x:600,y:950},'boss');
  advance(g,stage.start-.02);assert.equal(e.hp,5000);advance(g,1.1);assert.ok(e.hp<5000,'late path must hit');assert.equal(off.hp,5000,'priority does not attract lightning');
  assert.ok(5000-e.hp<=s.damage*(level===4?1.35:1)+1e-6);const hp=e.hp;advance(g,1);assert.equal(e.hp,hp);
 }
 const g=setup(),p=resample(Array.from({length:12},(_,i)=>({x:120+i*42,y:500+(i%2?85:-85)})),300);g.cast(recognize(p));assert.equal(g.skills[0].thunder!.targets.length,3);
});
test('wave has different curve directions, limited segments, off-path exclusion and bounded finisher',()=>{
 for(let level=1;level<=4;level++){
  const g=setup();g.practiceLevels.wave=level;g.cast(recognize(world(glyphSample('wave'))));const s=g.skills[0],w=s.wave!;assert.equal(w.segments.length,WAVE_STAGES[level-1].segments);
  assert.ok(w.segments[0].turn*w.segments[1].turn<0);const e=enemy(g,w.segments[0].points[8]),off=enemy(g,{x:620,y:950});advance(g,2);assert.ok(e.hp<5000);assert.equal(off.hp,5000);assert.ok(5000-e.hp<=s.damage*1.65+1e-6);
  const hp=e.hp;advance(g,.3);assert.equal(e.hp,hp);
 }
 const g=setup();g.practiceLevels.wave=4;g.cast(recognize(world(glyphSample('wave'))));const s=g.skills[0],anchor=s.wave!.segments.at(-1)!.center,e=enemy(g,s.wave!.segments.at(-1)!.points[8]);const initial=Math.hypot(e.x-anchor.x,e.y-anchor.y);advance(g,1.7);assert.ok(Math.hypot(e.x-anchor.x,e.y-anchor.y)<initial,'last segment reels targets inward');
});
test('binding centers on drawing, gathers and holds, releases, respects elite/Boss and total damage',()=>{
 for(let level=1;level<=4;level++){
  const g=setup();g.practiceLevels.spiral=level;g.cast(recognize(world(glyphSample('spiral'))));const s=g.skills[0],e=enemy(g,{x:s.x+70,y:s.y}),boss=enemy(g,{x:s.x,y:s.y},'boss'),elite=enemy(g,{x:s.x-70,y:s.y},'oni');
  const bx=boss.x,by=boss.y;advance(g,.3);assert.ok(e.x<s.x+70);assert.ok(elite.x>s.x-70);assert.ok(s.x+70-e.x>elite.x-(s.x-70));assert.equal(boss.x,bx);assert.equal(boss.y,by);
  advance(g,2);assert.ok(5000-e.hp<=s.damage+1e-6);assert.equal(s.binding!.captured.get(e.id)?.released,true);const x=e.x;e.speed=35;e.ai='Approach';advance(g,.2);assert.notEqual(e.x,x,'AI movement recovers');
 }
});
test('real input pays once; three-second timeout and pause retain existing rules',()=>{
 for(const rune of ['z','wave','spiral'] as const){const g=setup();g.ink.setUnlimited(false);const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,r=>g.cast(r),()=>false,undefined,g.pen,g.ink);const p=world(glyphSample(rune));input.event({...p[0],kind:'down',id:9});for(const v of p.slice(1))input.event({...v,kind:'move',id:9});const paid=g.ink.pending!.cost;input.update(3.01);assert.equal(input.success,true);assert.equal(g.skills.length,1);assert.equal(g.ink.last.cost,paid);const amount=g.ink.currentInk;input.event({...p.at(-1)!,kind:'up',id:9});assert.equal(g.ink.currentInk,amount);const age=g.skills[0].age;g.pause();g.advance(1);assert.equal(g.skills[0].age,age);}
});
test('extra wave arcs cap at five; repeated level setting and overlapping bindings never stack strength',()=>{
 const g=setup();g.practiceLevels.wave=4;const long=Array.from({length:300},(_,i)=>({x:60+i/299*600,y:600+Math.sin(i/299*Math.PI*6)*60}));assert.equal(recognize(long).rune,'wave');g.cast(recognize(long));assert.equal(g.skills[0].wave?.segments.length,5);
 g.cast('z');const thunder=g.skills.at(-1)!;applySkillLevel(thunder,4);const damage=thunder.damage;applySkillLevel(thunder,4);assert.equal(thunder.damage,damage);applySkillLevel(thunder,1);assert.equal(thunder.damage,45);
 const h=setup();h.cast('spiral');const s=h.skills[0],e=enemy(h,{x:s.x+50,y:s.y});advance(h,.2);h.cast('spiral');advance(h,.2);assert.ok(!h.skills.at(-1)!.binding!.captured.has(e.id),'overlapping cast cannot refresh a held target');advance(h,1.5);assert.ok(e.bindingImmunity===0);h.cast('spiral');advance(h,.2);assert.ok(h.skills.at(-1)!.binding!.captured.has(e.id),'target becomes eligible after recovery');
});
test('vector renderer supports every stage and cleans bounded pools, Lv4 reuses original thunder',()=>{
 const g=setup(),v=new AdvancedSpellRenderer(),t=new ThunderRenderer();for(const rune of ['wave','spiral','z'] as const)for(let level=1;level<=4;level++){g.practiceLevels[rune]=level;g.cast(recognize(world(glyphSample(rune))));const s=g.skills.at(-1)!;for(let frame=0;frame<180;frame++){s.age=frame/60;v.update([s]);t.update([s]);}}
 v.update([]);t.update([]);assert.equal(v.items.size,0);assert.equal(t.items.size,0);v.clear();t.clear();v.root.destroy({children:true});t.root.destroy({children:true});
});
console.log(`${count} advanced suites passed`);
