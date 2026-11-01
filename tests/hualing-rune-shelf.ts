import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {COLLECTED_RUNES} from '../src/gameplay/collected-talismans';

const setup=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.openRuneShelf();g.enemies=[];return g;};
for(const kind of COLLECTED_RUNES){
 const g=setup();g.life=50;const p={x:360,y:600};assert.equal(g.collected.total,0);assert.ok(g.collected.preview(g,kind,p),kind+' is available without claiming');assert.equal(g.collected.total,0);assert.ok(COLLECTED_RUNES.every(k=>g.collected.counts[k]===0));
 g.advance(.1);g.advance(.1);
 if(kind==='beast'||kind==='crab'){const scene=g.hualing.scenes.find(s=>s.mode===kind)!;assert.ok(kind==='beast'?scene.beast.state:scene.crab.state,'legacy tasks disabled while companions remain functional');}
 assert.ok(g.hualing.scenes.every(s=>s.phase==='spent'));
}
{
 const g=setup(),m=g.hualing;m.chooseScene('chain');assert.equal(m.sceneSeal.mode,'seal');assert.equal(m.sceneSeal.phase,'spent');
 for(const stage of ['wind','night','sunset'] as const){m.previewLandscape(stage);assert.equal(m.sceneSeal.phase,'spent');assert.ok(m.runeShelf);}
 const c=m.sceneSeal.center(m.bounds);for(const path of m.sceneSeal.paths)for(let i=1;i<path.length;i++)m.traceScene({x:c.x+path[i-1].x,y:c.y+path[i-1].y},{x:c.x+path[i].x,y:c.y+path[i].y});assert.equal(m.sceneSeal.progress,0);assert.equal(m.sceneSeal.phase,'spent');
 for(let i=0;i<100;i++)g.collected.killed(g,{x:300,y:600},i%10===0);assert.equal(g.collected.pickups.length,0);
 for(const chapter of ['sea','palace','snow','valley'] as const){g.changeHualingChapter(chapter);assert.ok(m.runeShelf);assert.equal(m.journey.autoEvents,false);assert.ok(m.scenes.every(s=>s.phase==='spent'));}
 g.collected.grant('thunder');const count=g.collected.total;assert.ok(g.collected.preview(g,'thunder',{x:360,y:600}));assert.equal(g.collected.total,count,'preview never alters collected ownership');
 g.pause();assert.equal(g.collected.preview(g,'dragon',{x:360,y:600}),false);g.pause();assert.equal(g.collected.preview(g,'dragon',{x:0,y:0}),false);
 g.hualing.upgrades.panel='custom';assert.equal(g.collected.preview(g,'dragon',{x:360,y:600}),false);g.hualing.upgrades.panel=null;
 g.startMountainLevel(0);assert.equal(m.runeShelf,false);assert.equal(g.collected.total,0);for(const kind of COLLECTED_RUNES){assert.equal(g.collected.preview(g,kind,{x:360,y:600}),false);assert.equal(g.collected.use(g,kind,{x:360,y:600}),false);}
 for(let i=0;i<4;i++)g.collected.killed(g,{x:300,y:600},false);assert.ok(g.collected.pickups.length>0,'campaign pickups still work');
}
console.log('PASS practice rune shelf: all nine free real casts, companions, no old tasks or random drops, scenery/chapter persistence, unchanged inventory, pause/target/upgrade gates and campaign pickup-only isolation');
