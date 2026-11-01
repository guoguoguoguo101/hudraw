import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {INK_PULSE} from '../src/gameplay/ink-pulse';
const setup=()=>{const g=new Game();g.startMountainLevel(0);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];g.hualing.bounds={left:26,right:694,top:250,bottom:990};g.ink.setAmount(0);g.collected.grant('pulse');return g;};
const step=(g:Game,t:number)=>{for(let n=0;n<t-1e-8;n+=1/60)g.advance(Math.min(1/60,t-n));};
{
 const g=setup(),p=g.pulse;assert.equal(g.collected.counts.pulse,1);assert.equal(p.use(g,{x:0,y:600}),false);assert.equal(p.use(g,{x:NaN,y:600}),false);assert.equal(g.collected.counts.pulse,1);
 for(const [i,role]of (['paper','armor','shield'] as const).entries()){const e=g.spawn('ink',{x:320+i*40,y:600})!;g.campaign.brush.configure(e,role);}
 const outside=g.spawn('ink',{x:650,y:600})!;g.campaign.brush.begin();assert.ok(p.use(g,{x:360,y:600}));assert.equal(g.ink.currentInk,0);assert.equal(p.use(g,{x:400,y:600}),false);step(g,.1);assert.equal(g.kills,0);step(g,.04);assert.equal(g.kills,3);assert.equal(g.ink.currentInk,10);assert.equal(g.campaign.brush.kills,0);assert.equal(g.campaign.xp,3);assert.equal(g.collected.total,0);assert.ok(outside.hp>0);
 assert.ok(p.block({x:300,y:600},{x:450,y:600},4));assert.equal(p.block({x:640,y:850},{x:680,y:900},4),false);step(g,.8);assert.equal(g.ink.currentInk,10);assert.equal(p.effect,null);assert.equal(p.block({x:360,y:600},{x:361,y:600},4),false);step(g,11.2);assert.equal(g.collected.counts.pulse,0);assert.equal(p.use(g,{x:360,y:600}),false);
}
{
 const g=setup(),p=g.pulse;for(let i=0;i<3;i++)g.spawn('ink',{x:340+i*20,y:600});g.ink.setAmount(98);p.use(g,{x:360,y:600});step(g,.2);assert.equal(g.ink.currentInk,100);assert.equal(p.effect!.ink,2);
 const time=p.clock,age=p.effect!.age,remaining=g.collected.counts.pulse;g.pause();step(g,1);assert.equal(p.clock,time);assert.equal(p.effect!.age,age);g.pause();g.hualing.upgrades.panel='custom';step(g,1);assert.equal(g.collected.counts.pulse,remaining);g.hualing.upgrades.panel=null;g.campaign.supportPanel=true;step(g,1);assert.equal(p.clock,time);g.campaign.supportPanel=false;g.startMountainLevel(1);assert.equal(g.collected.counts.pulse,0);assert.equal(p.effect,null);
}
{
 const g=setup();g.spawn('ink',{x:340,y:600});g.spawn('ink',{x:380,y:600});g.pulse.use(g,{x:360,y:600});step(g,.2);assert.equal(g.ink.currentInk,0);assert.equal(g.pulse.effect!.targets,2);
 g.menu();assert.equal(g.pulse.effect,null);g.start(false,true,false,true);assert.equal(g.pulse.use(g,{x:360,y:600}),false);
}
for(const fps of [30,60,120]){
 const g=setup(),e=g.spawn('ink',{x:360,y:600})!;e.hp=e.maxHp=1000;g.pulse.use(g,{x:360,y:600});for(let n=0;n<fps;n++)g.pulse.advance(g,1/fps);assert.equal(e.hp,1000-INK_PULSE.damage);assert.ok(e.shock>=.65);assert.equal(g.collected.counts.pulse,0);
}
console.log('PASS ink pulse: zero-ink use, aimed area/armor/shield clear, no direct-sweep credit, three-target refund/cap, one hit, projectile block expiry, no regeneration, pause/support/upgrade, restart/mode isolation and 30/60/120 fps');
