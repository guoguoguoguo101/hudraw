import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
const setup=(campaign=false)=>{const g=new Game();if(campaign)g.startMountainLevel(0);else g.start(false,true,false,false,true);g.director.disabled=true;g.enemies=[];g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.hualing.bounds={left:26,right:694,top:250,bottom:990};return g;};
const step=(g:Game,t:number)=>{for(let i=0;i<t*60;i++)g.advance(1/60);};
{
 const g=setup(),m=g.collected;assert.ok(m.grant('ward'));assert.ok(m.grant('storm'));assert.ok(m.grant('ward'));m.grant('flower');m.grant('thunder');assert.equal(m.grant('storm'),false);const ink=g.ink.currentInk;
 assert.equal(m.use(g,'ward',{x:10,y:500}),false);assert.equal(m.total,5);assert.ok(m.use(g,'ward',{x:360,y:600}));assert.equal(m.total,4);assert.equal(m.use(g,'ward',{x:360,y:600}),false);assert.equal(g.ink.currentInk,ink);
 assert.ok(m.block({x:100,y:600},{x:600,y:600},10)===false);step(g,.2);assert.ok(m.block({x:100,y:600},{x:600,y:600},10));assert.ok(m.slow({x:360,y:600}));assert.equal(m.slow({x:680,y:900}),false);
 const age=m.clock;g.pause();step(g,1);assert.equal(m.clock,age);g.pause();g.hualing.upgrades.panel='custom';step(g,1);assert.equal(m.clock,age);g.hualing.upgrades.panel=null;step(g,6);assert.equal(m.casts.length,0);
}
{
 const g=setup(true),m=g.collected;m.drop(g,{x:300,y:600},'storm');assert.equal(m.collect(999),false);m.collectAlong({x:100,y:600},{x:500,y:600});assert.equal(m.counts.storm,1);assert.equal(m.pickups.length,0);g.ink.setAmount(0);
 const a=g.spawn('ink',{x:300,y:600})!,b=g.spawn('ink',{x:630,y:800})!;g.campaign.brush.configure(a,'armor');g.campaign.brush.configure(b,'shield');assert.ok(m.use(g,'storm',{x:360,y:500}));step(g,.85);assert.ok(a.hp<=0&&b.hp<=0);assert.equal(g.campaign.brush.kills,0);assert.equal(g.ink.currentInk,0);
 const fresh=g.spawn('ink',{x:150,y:700})!;step(g,.55);assert.ok(fresh.hp<=0);assert.ok(m.block({x:0,y:0},{x:1,y:1},1));step(g,2);assert.equal(m.casts.length,0);assert.equal(m.block({x:0,y:0},{x:1,y:1},1),false);
}
{
 const g=setup(),m=g.collected;const e=g.spawn('ink',{x:360,y:600})!,out=g.spawn('ink',{x:680,y:900})!;e.hp=e.maxHp=1000;out.hp=out.maxHp=1000;m.grant('ward');m.use(g,'ward',{x:360,y:600});step(g,.2);assert.equal(e.hp,930);assert.equal(out.hp,1000);step(g,5.9);assert.equal(e.hp,640);assert.equal(out.hp,1000);
 m.grant('storm');g.changeHualingChapter('sea');assert.equal(m.total,0);assert.equal(m.casts.length,0);g.menu();assert.equal(m.pickups.length,0);
}
{
 const g=setup(true),c=g.campaign,m=g.collected;c.support='flower';c.supportPanel=true;c.supportChoices=['ward'];assert.ok(c.chooseSupport(g,'ward'));assert.equal(m.counts.ward,0);assert.equal(m.pickups.length,1);m.collect(m.pickups[0].id);assert.equal(m.counts.ward,1);
 m.grant('ward');m.grant('storm');m.grant('flower');m.grant('thunder');m.drop(g,{x:300,y:600},'storm');assert.equal(m.collect(m.pickups[0].id),false);assert.equal(m.pickups.length,1);g.startMountainLevel(1);assert.equal(m.total,0);assert.equal(m.pickups.length,0);
}
for(const fps of [30,60,120]){
 const g=setup(),m=g.collected,e=g.spawn('oni',{x:360,y:600})!;e.hp=e.maxHp=5000;m.grant('storm');m.use(g,'storm',{x:360,y:600});e.elite={phase:'stagger'} as never;
 for(let i=0;i<fps*3.1;i++)m.advance(g,1/fps);assert.ok(Math.abs(e.hp-4580)<1e-6);assert.equal(m.casts.length,0);
 const bossGame=setup(),boss=bossGame.summonHualingBoss()!;boss.chapterBoss!.phase='stagger';boss.chapterBoss!.weakBudget=boss.maxHp*.5;const hp=boss.hp;
 bossGame.collected.grant('storm');bossGame.collected.use(bossGame,'storm',{x:360,y:600});for(let i=0;i<fps*3.1;i++)bossGame.collected.advance(bossGame,1/fps);assert.ok(Math.abs(hp-boss.hp-boss.maxHp*.12)<1e-6);
}
console.log('PASS collected talismans: capacity, pickup, cancel/invalid/single use, no ink cost, ward pulses/block/slow, storm armor clear/new arrivals/damage cap, pause, rewards and restart isolation at 30/60/120 fps');
