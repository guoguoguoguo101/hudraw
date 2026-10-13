import assert from 'node:assert/strict';
import {CinnabarBrush} from '../src/relics/cinnabar-brush';
import {Game} from '../src/gameplay/game';
import {applySkillLevel} from '../src/gameplay/skill-levels';
import type {PrimaryAction,RelicCombatPort} from '../src/relics/contracts';
const base={castId:1,origin:{x:0,y:0},direction:{x:1,y:0},damage:100};
const ray:PrimaryAction={...base,kind:'ray',range:500,width:70,pierce:3};
let count=0;const test=(name:string,run:()=>void)=>{run();count++;console.log('PASS '+name);};
test('25/35/45% independently delayed, snapshotted and deduplicated',()=>{for(let level=1;level<=3;level++){
 const b=new CinnabarBrush(),enemy={id:2,x:200,y:0,hp:1000,kind:'ink'};let hits=0;
 const port:RelicCombatPort={targets:()=>[enemy],damage:(_,amount)=>{enemy.hp-=amount;hits++;}};
 b.beginCast(1,level);b.onPrimary(ray,0);b.onPrimary(ray,0);b.update(.119,port);assert.equal(hits,0);b.update(.12,port);assert.equal(enemy.hp,1000-[25,35,45][level-1]);b.update(.5,port);assert.equal(hits,1);
}});
test('ray finds newly entered targets, forward bounds and inherited piercing',()=>{
 const b=new CinnabarBrush();b.beginCast(1,1);const mutable={...ray,origin:{x:0,y:0}};b.onPrimary(mutable,0);mutable.origin.x=500;
 const enemies=[10,40,80,120,160].map((x,i)=>({id:i+1,x,y:0,hp:100,kind:'ink'}));enemies.push({id:9,x:-100,y:0,hp:100,kind:'ink'});b.update(.12,{targets:()=>enemies,damage:(id,n)=>{enemies.find(e=>e.id===id)!.hp-=n;}});assert.equal(enemies.filter(e=>e.hp===75).length,3);assert.equal(enemies.at(-1)!.hp,100);
});
test('area is a second damage pulse, dead targets skipped, capped chain keeps per-hit decay',()=>{
 for(const kind of ['area','chain'] as const){const b=new CinnabarBrush();b.beginCast(1,2);const enemies=Array.from({length:5},(_,i)=>({id:i,x:30+i*10,y:0,hp:i===1?0:1000,kind:'ink'}));
 const action:PrimaryAction=kind==='area'?{...base,kind,radius:100}:{...base,kind,hits:enemies.map((e,i)=>({id:e.id,position:{x:e.x,y:e.y},damage:100*.9**i}))};b.onPrimary(action,0);
 b.update(.12,{targets:()=>enemies,damage:(id,n)=>enemies.find(e=>e.id===id)!.hp-=n});assert.equal(enemies[1].hp,0);assert.equal(enemies[0].hp,965);if(kind==='chain'){assert.equal(enemies[3].hp,1000);assert.ok(Math.abs(enemies[2].hp-(1000-35*.81))<1e-8);}
 }
});
test('one projectile retargets within original sector, cannot hit twice',()=>{
 const b=new CinnabarBrush();b.beginCast(1,3);b.onPrimary({...base,kind:'projectile',range:500,speed:1000,targetId:99},0);
 const e={id:2,x:200,y:0,hp:1000,kind:'ink'};let hits=0;const port={targets:()=>[e],damage:(_id:number,n:number)=>{e.hp-=n;hits++;}};
 for(let i=0;i<60;i++)b.update(i/60,port);assert.equal(e.hp,955);assert.equal(hits,1);assert.equal(b.strokes.length,0);
});
const isolated=()=>{const g=new Game();g.start();g.director.disabled=true;g.duration=1e9;g.maxHp=g.life=1e6;return g;};
test('four real skill pipelines, all brush levels and higher skill levels inherit correctly',()=>{
 for(const rune of ['line','circle','triangle','z'] as const)for(let brushLevel=1;brushLevel<=3;brushLevel++)for(const skillLevel of [1,2,3,4]){
  const run=(brush:number)=>{const g=isolated(),e=g.spawn('boss',{x:510,y:665})!;e.hp=e.maxHp=1e6;e.armorPool=0;e.ai='Recovery';g.modifiers.owned.set('brush',brush);g.cast(rune);applySkillLevel(g.skills[0],skillLevel);const main=g.skills[0].damage;const initialPapers=g.charges.papers;
   let contacts=0;for(let i=0;i<4*120;i++){g.update(1/120);for(const s of g.brush.strokes)contacts=Math.max(contacts,s.contacts.length);}return {damage:1e6-e.hp,main,papers:g.charges.papers,initialPapers,casts:g.casts,contacts,shield:g.shield};};
  const plain=run(0),enhanced=run(brushLevel);assert.equal(enhanced.main,plain.main);assert.equal(enhanced.casts,1);assert.equal(enhanced.papers,plain.papers);assert.equal(enhanced.shield,plain.shield);assert.ok(enhanced.damage>plain.damage,JSON.stringify({rune,brushLevel,skillLevel,plain,enhanced}));
 }
});
test('pause/realm use battle time; in-flight level captured; reset removes queues; ink excluded',()=>{
 const g=isolated();g.modifiers.add('brush');g.cast('line');g.modifiers.owned.set('brush',3);g.update(.06);assert.equal(g.brush.strokes[0].level,1);g.pause();g.advance(2);assert.ok(g.brush.strokes[0].age<0);g.pause();const before=g.time;g.advance(.5,true);assert.ok(Math.abs(g.time-before-.2)<1e-8);assert.ok(g.brush.strokes[0].age>=0&&g.brush.strokes[0].age<.2);g.start();assert.equal(g.brush.strokes.length,0);g.modifiers.add('brush');g.cast('ink');g.update(.5);assert.equal(g.brush.strokes.length,0);
});
test('queues bounded, unequipped base untouched, rank capped',()=>{const g=isolated();for(let i=0;i<9;i++)g.modifiers.add('brush');assert.equal(g.modifiers.count('brush'),3);const b=new CinnabarBrush();for(let i=0;i<100;i++){b.beginCast(i,3);b.onPrimary({...ray,castId:i},0);}assert.ok(b.strokes.length<=24);});
console.log(count+' cinnabar brush suites passed');
