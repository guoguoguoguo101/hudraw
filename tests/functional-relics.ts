import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {FunctionalRelics,RESCUE_STROKES} from '../src/gameplay/functional-relics';
const bounds={left:0,right:720,top:252,bottom:850};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function scene(){const g=new Game();g.start(false,true,false,true);g.director.disabled=true;g.interactions.bounds=bounds;return g;}
function place(g:Game,x=500,y=500){const r=g.functionalRelics;assert.ok(r.beginPlacement({kind:'down',id:99,x:100,y:919}));g.handleFunctionalInput({kind:'up',id:99,x,y});assert.ok(r.lantern);}
function step(g:Game,time:number,drawing=false){for(let t=0;t<time-1e-9;t+=1/60)g.advance(Math.min(1/60,time-t),drawing);}
function rescue(g:Game){for(const [a,b] of RESCUE_STROKES){g.handleFunctionalInput({...a,kind:'down',id:1});for(let i=1;i<=10;i++)g.handleFunctionalInput({x:a.x+(b.x-a.x)*i/10,y:a.y+(b.y-a.y)*i/10,kind:'move',id:1});g.handleFunctionalInput({...b,kind:'up',id:1});}}
let count=0;const test=(name:string,run:()=>void)=>{run();count++;console.log('PASS functional relics: '+name);};
test('interaction practice only, all relics available, finite independent charges and reset',()=>{
 const g=scene(),r=g.functionalRelics;assert.equal(r.enabled,true);assert.ok(g.activateHourglass());assert.equal(r.uses.hourglass,1);assert.equal(g.activateHourglass(),false);r.reset();assert.equal(r.uses.hourglass,2);g.start();assert.equal(r.enabled,false);assert.equal(g.activateHourglass(),false);g.start(false,true);assert.equal(r.enabled,false);g.start(false,true,false,true);assert.equal(r.enabled,true);
});
test('placement validates on release, cancellation and UI modes never debit ink',()=>{
 const g=scene(),r=g.functionalRelics;g.ink.setUnlimited(false);r.beginPlacement({kind:'down',id:1,x:100,y:919});g.handleFunctionalInput({kind:'up',id:1,x:360,y:665});assert.equal(r.lantern,null);assert.equal(r.uses.lantern,3);r.cancelInput();assert.equal(r.placing,false);place(g);assert.equal(r.uses.lantern,2);assert.equal(r.beginPlacement({kind:'down',id:1,x:100,y:919}),false);near(g.ink.currentInk,100);assert.equal(g.casts,0);
});
test('ordinary enemies actually approach and attack the lamp, three hits extinguish it',()=>{
 const g=scene();place(g,500,550);const r=g.functionalRelics,e=g.spawn('ink',{x:535,y:550})!;e.ai='Approach';g.update(1/60);assert.equal(e.lureId,r.lantern!.id);assert.equal(e.ai,'Telegraph');const life=g.life;e.stateAge=10;g.update(1/60);assert.equal(r.lantern!.hits,2);near(g.life,life);const id=r.lantern!.id;r.hitLantern(id);r.hitLantern(id);assert.equal(r.lantern,null);e.ai='Approach';g.update(1/60);assert.equal(e.lureId,undefined);
});
test('crow consumes at most one durability per attack; elites, boss and committed attacks resist lure',()=>{
 const g=scene();place(g,500,500);const r=g.functionalRelics,id=r.lantern!.id,c=g.spawn('crow',{x:500,y:500})!;c.lureId=id;c.lureHit=false;g.hitEnemyTarget(c,8);g.hitEnemyTarget(c,8);assert.equal(r.lantern!.hits,2);
 for(const kind of ['oni','boss'] as const){const e=g.spawn(kind,{x:510,y:500})!;e.ai='Approach';r.target(e);assert.equal(e.lureId,undefined);}
 const committed=g.spawn('ink',{x:505,y:505})!;committed.ai='Telegraph';r.target(committed);assert.equal(committed.lureId,undefined);
});
test('stop freezes enemy positions, windups, boss and spawning while own skills advance',()=>{
 const g=scene(),r=g.functionalRelics;const e=g.spawn('ink',{x:100,y:500})!;e.ai='Approach';const boss=g.spawn('boss',{x:360,y:365})!;boss.ai='Telegraph';boss.stateAge=1;g.cast('circle');const skill=g.skills[0],age=skill.age,time=g.time,phase=boss.stateAge;assert.ok(g.activateHourglass());step(g,.3);near(e.x,100);near(e.y,500);near(g.time,time);near(boss.stateAge,phase);assert.ok(skill.age>age);assert.ok(r.stopped);step(g,3);assert.ok(e.x>100);assert.ok(g.time>time);assert.equal(r.stopped,false);
});
test('real-time stop boundary and drawing slowdown do not multiply stop duration',()=>{
 const g=scene(),r=g.functionalRelics;g.activateHourglass();g.advance(2,true,2);near(r.stopRemaining,1);near(g.time,0);g.advance(2,false,2);near(r.stopRemaining,0);near(g.time,1);near(g.lastResourceDt,1);
});
test('lantern retains five active seconds during stop, burning sea still detonates at six seconds',()=>{
 const g=scene(),r=g.functionalRelics;place(g);g.activateBurningSea();g.burningSea.handle({kind:'down',id:1,x:200,y:500},bounds);g.burningSea.handle({kind:'up',id:1,x:200,y:500},bounds);step(g,3);near(r.lantern!.remaining,2);g.activateHourglass();step(g,3);assert.equal(g.burningSea.detonations,1);near(r.lantern!.remaining,2);assert.equal(r.stopped,false);
});
test('fatal practice test intercepts defeat, rescue consumes once and pauses all world timers',()=>{
 const g=scene(),r=g.functionalRelics;g.activateBurningSea();step(g,1);const fire=g.burningSea.remaining;assert.ok(g.testFatalHit());assert.equal(g.state,'reviving');assert.equal(r.uses.soul,0);assert.ok(!g.events.some(e=>e.type==='lose'));step(g,.3);rescue(g);assert.equal(g.state,'playing');near(g.life,30);near(g.invulnerable,2);near(g.burningSea.remaining,fire);assert.equal(g.casts,0);assert.ok(g.events.some(e=>e.type==='functionalRelic'&&e.kind==='reviveSuccess'));g.testFatalHit();assert.equal(g.state,'lose');assert.equal(g.events.filter(e=>e.type==='lose').length,1);
});
test('wrong rescue stroke, timeout, pause and background-style cancellation',()=>{
 const g=scene(),r=g.functionalRelics;g.testFatalHit();step(g,.3);g.handleFunctionalInput({kind:'down',id:1,x:360,y:445});g.handleFunctionalInput({kind:'up',id:1,x:360,y:655});assert.equal(r.reviveStroke,0);g.pause();g.advance(20);near(r.reviveRemaining,3);assert.equal(g.state,'paused');g.pause();r.cancelInput();step(g,3);assert.equal(g.state,'lose');assert.equal(g.events.filter(e=>e.type==='lose').length,1);
});
test('tiers change only promised benefits, reset/restart/menu clear transient effects',()=>{
 const g=scene(),r=g.functionalRelics;r.setLevel('lantern',3);r.setLevel('soul',3);place(g);near(r.lantern!.radius,220);r.hitLantern(r.lantern!.id);r.hitLantern(r.lantern!.id);r.hitLantern(r.lantern!.id);assert.ok(r.lanternEcho);g.testFatalHit();step(g,.3);rescue(g);near(g.life,40);near(g.shield,20);near(g.shieldTime,4);g.resetFunctionalRelics();assert.equal(r.lantern,null);assert.equal(r.uses.soul,1);assert.equal(r.stopRemaining,0);g.menu();assert.equal(r.enabled,false);assert.equal(r.lanternEcho,null);g.start(false,true);assert.equal(r.uses.soul,1);
});
test('declining rescue or spent charges loses normally, normal practice remains immune',()=>{
 const g=scene();g.hurt(1000);near(g.life,100);g.testFatalHit();g.giveUpRevive();assert.equal(g.state,'lose');const h=scene();h.functionalRelics.uses.soul=0;h.testFatalHit();assert.equal(h.state,'lose');assert.equal(h.functionalRelics.uses.soul,0);
});
test('frozen shock damage continues, enemy visual age stays frozen',()=>{
 const g=scene(),r=g.functionalRelics;const e=g.spawn('oni',{x:100,y:500})!;e.ai='Approach';e.shock=2;g.activateHourglass();step(g,1.1);near(e.x,100);near(e.age,0);assert.ok(e.hp<240);
});


test('drag placement captures one pointer, cancels invalid drops and never draws a rune',()=>{
 const g=scene(),r=g.functionalRelics;
 r.beginPlacement({kind:'down',id:1,x:100,y:919});
 g.handleFunctionalInput({kind:'move',id:1,x:500,y:500});assert.deepEqual(r.preview,{x:500,y:500});
 g.handleFunctionalInput({kind:'up',id:2,x:500,y:500});assert.equal(r.lantern,null);assert.equal(r.placing,true);
 g.handleFunctionalInput({kind:'cancel',id:1,x:500,y:500});assert.equal(r.placing,false);assert.equal(r.uses.lantern,3);
 r.beginPlacement({kind:'down',id:1,x:100,y:919});g.handleFunctionalInput({kind:'up',id:1,x:100,y:919});assert.equal(r.placing,false);assert.equal(r.uses.lantern,3);
 place(g);assert.equal(r.uses.lantern,2);assert.equal(g.casts,0);assert.equal(g.freeSlashes.totalCasts,0);
});

console.log(`PASS ${count} functional relic groups`);
