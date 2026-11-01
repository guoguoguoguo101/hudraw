import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {FOX_RUSH} from '../src/gameplay/fox-rush';
import {FoxRushRenderer} from '../src/rendering/fox-rush';
const setup=()=>{const g=new Game();g.startFrontline();g.hualing.upgrades.panel=null;g.hualing.upgrades.pending=0;g.hualing.upgrades.growth=false;g.director.disabled=true;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];return g;};
const step=(g:Game,t:number,hz=60)=>{for(let i=0;i<Math.round(t*hz);i++)g.advance(1/hz);};
{
 const g=setup(),e=g.spawn('ink',{x:360,y:630})!,outside=g.spawn('ink',{x:10,y:500})!;e.hp=e.maxHp=1000;outside.hp=outside.maxHp=1000;const ink=g.ink.currentInk;
 assert.ok(g.foxRush.cast(g));assert.equal(g.foxRush.units.length,9);assert.equal(g.foxRush.cast(g),false);assert.equal(g.ink.currentInk,ink);assert.equal(g.collected.total,0);assert.equal(g.foxRush.origin.y,g.playerPosition.y-50);
 step(g,.1);assert.equal(e.hp,1000,'no damage before the foxes form');step(g,1.3);assert.ok(e.hp<1000,'the physical forward wave hits');assert.equal((1000-e.hp)%FOX_RUSH.damage,0);assert.equal(outside.hp,1000);
 const hits=g.drain().filter(e=>e.type==='strike');assert.ok(hits.length);assert.ok(hits.every(e=>e.type==='strike'&&e.secondary));const hp=e.hp;step(g,.3);assert.equal(e.hp,hp,'one fox cannot repeatedly damage the same target');
 const before=JSON.stringify({units:g.foxRush.units,age:g.foxRush.age,remaining:g.foxRush.remaining});g.pause();step(g,1);assert.equal(JSON.stringify({units:g.foxRush.units,age:g.foxRush.age,remaining:g.foxRush.remaining}),before);assert.equal(g.foxRush.cast(g),false);g.pause();g.hualing.upgrades.panel='custom';step(g,1);assert.equal(JSON.stringify({units:g.foxRush.units,age:g.foxRush.age,remaining:g.foxRush.remaining}),before);g.hualing.upgrades.panel=null;
 step(g,4);assert.equal(g.foxRush.active,false);assert.equal(g.foxRush.remaining,0);assert.ok(g.foxRush.cast(g));g.changeHualingChapter('sea');assert.equal(g.foxRush.active,false);assert.equal(g.foxRush.remaining,0);g.foxRush.cast(g);g.menu();assert.equal(g.foxRush.active,false);g.start(false,true,false,false,true);assert.equal(g.foxRush.cast(g),false);
}
{
 const results=[];for(const hz of [30,60,120]){const g=setup(),e=g.spawn('ink',{x:360,y:620})!;e.hp=e.maxHp=1000;g.foxRush.cast(g);step(g,1.5,hz);results.push({hp:e.hp,positions:g.foxRush.units.map(f=>[f.x,f.y])});}
 assert.equal(results[0].hp,results[1].hp);assert.equal(results[1].hp,results[2].hp);for(let i=0;i<9;i++)for(let n=0;n<2;n++)assert.ok(Math.abs(results[0].positions[i][n]-results[2].positions[i][n])<1e-6,'30/60/120 fps follow identical paths');
}
{
 const g=setup(),boss=g.spawn('boss',{x:360,y:650})!;boss.hp=boss.maxHp=100;g.foxRush.cast(g);step(g,3);assert.ok(100-boss.hp>0&&100-boss.hp<=8+1e-8,'whole-wave boss damage respects its cap including armor');
}
{
 const g=setup(),r=new FoxRushRenderer();g.foxRush.cast(g);step(g,.55);r.update(g);assert.ok(r.front.visible&&r.back.visible);const b=r.front.getLocalBounds();assert.ok([b.x,b.y,b.width,b.height].every(Number.isFinite));g.menu();r.update(g);assert.equal(r.front.visible,false);assert.equal(r.back.visible,false);r.front.destroy({children:true});r.back.destroy({children:true});
}
console.log('PASS fox rush: nine physical foxes, forming delay, swept single hits, area exclusion, no ink/inventory cost, pause/editor gates, cooldown, chapter/restart cleanup, boss cap, finite rendering and 30/60/120fps');
