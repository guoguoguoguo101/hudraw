import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {COLLECTED_RUNES,type CollectedRune} from '../src/gameplay/collected-talismans';
const setup=()=>{const g=new Game();g.startMountainLevel(0);g.hualing.frozen=true;g.enemies=[];g.ink.setAmount(0);g.hualing.bounds={left:26,right:694,top:250,bottom:990};return g;};
const point={x:360,y:600};
for(const kind of COLLECTED_RUNES){
 const g=setup(),m=g.collected;assert.equal(m.total,0);assert.deepEqual(m.owned,[]);assert.equal(m.use(g,kind,point),false);
 m.drop(g,point,kind);assert.equal(m.total,0);assert.equal(m.pickups[0].kind,kind);assert.ok(m.collect(m.pickups[0].id));assert.equal(m.counts[kind],1);assert.deepEqual(m.owned,[kind]);
 assert.equal(m.use(g,kind,{x:0,y:0}),false);assert.equal(m.counts[kind],1);g.life=50;assert.ok(m.use(g,kind,{...point,kind:'up',id:1} as typeof point),kind+' can be consumed');assert.equal(m.counts[kind],0);assert.equal(m.total,0);assert.deepEqual(m.owned,[]);assert.equal(g.ink.currentInk,0);
 g.advance(.1);g.advance(.1);
 if(kind==='pulse')assert.ok(g.pulse.effect);if(kind==='dragon')assert.equal(g.hualing.effects.length,1);if(kind==='flower')assert.ok(g.hualing.petals.active);if(kind==='thunder')assert.ok(g.hualing.thunder.active);if(kind==='heal')assert.equal(g.life,85);if(kind==='crescent')assert.equal(g.collected.crescent.units.length,3);
 if(kind==='beast')assert.ok(g.hualing.scenes.find(s=>s.mode==='beast')?.beast.state);if(kind==='crab')assert.ok(g.hualing.scenes.find(s=>s.mode==='crab')?.crab.state);
 assert.equal(g.hualing.scenes.some(s=>s.phase==='stored'),false,'consumables never enter the old three-slot tray');
 for(let i=0;i<800;i++)g.advance(1/60);assert.equal(m.total,0,'no automatic card regeneration');
}
{
 const g=setup(),m=g.collected;for(let i=0;i<5;i++)assert.ok(m.grant('pulse'));assert.equal(m.grant('dragon'),false);assert.equal(m.total,5);assert.deepEqual(m.owned,['pulse']);
 m.drop(g,point,'dragon');assert.equal(m.collect(m.pickups[0].id),false);assert.equal(m.pickups.length,1);m.use(g,'pulse',point);assert.equal(m.total,4);assert.equal(m.use(g,'pulse',point),false);assert.equal(m.total,4);assert.ok(m.collect(m.pickups[0].id));assert.equal(m.total,5);assert.deepEqual(m.owned,['pulse','dragon']);
 for(let i=0;i<50;i++)g.advance(1/60);assert.ok(m.use(g,'pulse',point));assert.equal(m.counts.pulse,3);
 g.startMountainLevel(1);assert.equal(m.total,0);assert.equal(g.campaign.support,null);assert.equal(g.campaign.dragon(g),false);assert.equal(g.pulse.use(g,point),false);
}
{
 const g=setup(),m=g.collected,seen=new Set<CollectedRune>();for(let i=0;i<800;i++){m.killed(g,point,i%20===19);for(const p of m.pickups)seen.add(p.kind);m.pickups=[];}assert.equal(seen.size,COLLECTED_RUNES.length);
 m.grant('heal');assert.equal(m.use(g,'heal',point),false);assert.equal(m.counts.heal,1);
 for(const kind of ['beast','crab'] as const){m.grant(kind);assert.equal(m.use(g,kind,{x:30,y:255}),false);assert.equal(m.counts[kind],1);}
}
console.log('PASS consumable inventory: all ten types drop/pick/use, five total with stacking/order, full-ground retention, no defaults/cooldown refill/old tray, invalid/full-health/summon cancellation and restart');
