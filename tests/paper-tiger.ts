import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {PaperTiger,PAPER_TIGER} from '../src/gameplay/paper-tiger';
const bounds={left:0,right:720,top:245,bottom:850};
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function game(){const g=new Game();g.start(false,true,false,true);g.director.disabled=true;g.interactions.bounds=bounds;return g;}
function summon(g:Game,x=360,y=500){const t=g.functionalRelics.paperTiger;assert.ok(t.begin({kind:'down',id:8,x:80,y:820}));g.handleFunctionalInput({kind:'move',id:8,x,y});g.handleFunctionalInput({kind:'up',id:8,x,y});assert.ok(t.alive);return t;}
function step(g:Game,s:number,drawing=false){for(let t=0;t<s-1e-9;t+=1/60)g.advance(Math.min(1/60,s-t),drawing);}
let suites=0;function test(name:string,run:()=>void){run();suites++;console.log('PASS paper tiger: '+name);}

test('release-to-summon, invalid/cancelled drop is free, pointer captured, no ink or rune casts',()=>{
 const g=game(),t=g.functionalRelics.paperTiger;
 t.begin({kind:'down',id:8,x:80,y:820});g.handleFunctionalInput({kind:'up',id:2,x:350,y:450});assert.equal(t.state,null);assert.ok(t.dragging);
 g.handleFunctionalInput({kind:'cancel',id:8,x:350,y:450});assert.equal(t.dragging,false);assert.equal(t.uses,2);
 t.begin({kind:'down',id:8,x:80,y:920});g.handleFunctionalInput({kind:'up',id:8,x:80,y:920});assert.equal(t.state,null);assert.equal(t.uses,2);
 summon(g);assert.equal(t.uses,1);assert.equal(g.casts,0);assert.equal(g.freeSlashes.totalCasts,0);near(g.ink.currentInk,100);
});
test('ordinary monsters take priority; one landing is one real damage and normal kill reward',()=>{
 const g=game(),t=summon(g);const boss=g.spawn('boss',{x:370,y:500})!,small=g.spawn('ink',{x:440,y:500})!;boss.ai=small.ai='Approach';boss.speed=small.speed=0;
 step(g,.65);assert.equal(t.state!.target,small.id);assert.equal(t.state!.phase,'windup');assert.equal(g.kills,0);
 step(g,.65);assert.equal(g.kills,1);assert.equal(g.score,10);assert.ok(!g.enemies.includes(small));assert.equal(t.state!.hits,1);assert.equal(boss.hp,boss.maxHp);step(g,.08);assert.equal(t.state!.hits,1);
});
test('windup retargets a dead enemy and a missed moving target is not damaged remotely',()=>{
 const g=game(),t=summon(g);const e=g.spawn('oni',{x:440,y:500})!;e.ai='Approach';e.speed=0;
 step(g,.65);g.enemies=[];step(g,.3);assert.equal(t.state!.jumps,0);
 g.enemies=[e];step(g,.5);assert.equal(t.state!.phase,'leap');e.x=100;e.y=800;e.prevX=e.x;e.prevY=e.y;
 step(g,.5);assert.equal(e.hp,e.maxHp);assert.equal(t.state!.hits,0);
});
test('manual command consumes no extra charge, respects jump reach and does not refresh duration',()=>{
 const g=game(),t=summon(g,180,450);step(g,.6);const left=t.state!.remaining;
 t.begin({kind:'down',id:9,x:80,y:820});g.handleFunctionalInput({kind:'up',id:9,x:600,y:600});assert.equal(t.uses,1);near(t.state!.remaining,left);
 step(g,.9);assert.equal(t.state!.jumps,1);assert.ok(Math.hypot(t.state!.x-180,t.state!.y-450)<=PAPER_TIGER.jump+1e-6);assert.ok(t.state!.x>180);
});
test('twelve real seconds even while drawing or stopping enemies; pause and rescue freeze it',()=>{
 const g=game(),t=summon(g);step(g,2,true);near(t.state!.remaining,10);g.activateHourglass();step(g,1);near(t.state!.remaining,9);
 g.pause();g.advance(30);near(t.state!.remaining,9);g.pause();g.testFatalHit();g.advance(.5);near(t.state!.remaining,9);g.giveUpRevive();g.resetFunctionalRelics();assert.equal(t.state,null);assert.equal(t.uses,2);
});
test('continues hitting frozen enemies, expires without an extra attack, long frames bounded',()=>{
 const g=game(),t=summon(g);const e=g.spawn('oni',{x:440,y:500})!;e.ai='Approach';e.speed=0;g.activateHourglass();step(g,1.5);assert.ok(e.hp<e.maxHp);near(e.x,440);
 const hp=e.hp;t.advance(30,[],bounds,()=>assert.fail('empty battlefield cannot hit'));assert.equal(t.state,null);near(e.hp,hp);assert.equal(t.uses,1);
 const m=new PaperTiger();m.begin({kind:'down',id:1,x:80,y:920});m.input({kind:'up',id:1,x:350,y:450},bounds);m.advance(12,[],bounds,()=>{});assert.equal(m.alive,false);assert.equal(m.state!.remaining,0);m.advance(.5,[],bounds,()=>{});assert.equal(m.state,null);
});
test('finite two charges, restart/reset/menu clear companion and pending drag; no formal entry',()=>{
 const g=game(),t=summon(g);t.advance(13,[],bounds,()=>{});summon(g);assert.equal(t.uses,0);t.advance(13,[],bounds,()=>{});assert.equal(t.begin({kind:'down',id:1,x:80,y:820}),false);
 g.resetFunctionalRelics();assert.equal(t.uses,2);summon(g);t.begin({kind:'down',id:2,x:80,y:820});g.menu();assert.equal(t.state,null);assert.equal(t.dragging,false);g.start(false,true);assert.equal(g.functionalRelics.enabled,false);g.start();assert.equal(g.functionalRelics.enabled,false);
});
console.log(`PASS ${suites} paper-tiger suites`);
