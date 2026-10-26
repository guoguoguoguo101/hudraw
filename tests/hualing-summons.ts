import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {PaperCrab,PAPER_CRAB} from '../src/gameplay/paper-crab';
const bounds={left:20,right:700,top:280,bottom:980};
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.hualing.bounds={...bounds};g.enemies=[];return g;};
const step=(g:Game,s:number)=>{for(let t=0;t<s-1e-8;t+=1/60)g.advance(Math.min(1/60,s-t));};
let suites=0;const test=(name:string,fn:()=>void)=>{fn();suites++;console.log('PASS summons: '+name);};
test('click claims both cards without tracing, distinct slots, duplicate and full inventory protection',()=>{
 const g=game(),h=g.hualing;assert.ok(h.claimSummon('beast'));assert.ok(h.claimSummon('crab'));assert.equal(h.sceneSeal.mode,'seal');
 const [t,c]=h.scenes.filter(s=>s.mode!=='seal');assert.equal(t.progress,0);assert.equal(c.progress,0);assert.equal(t.phase,'stored');assert.equal(c.phase,'stored');assert.notEqual(t.slotIndex,c.slotIndex);assert.equal(h.claimSummon('crab'),false);
 h.sceneSeal.phase='stored';h.sceneSeal.slotIndex=2;c.phase='spent';h.showScene('chain');h.sceneSeal.phase='stored';h.sceneSeal.slotIndex=1;assert.equal(h.claimSummon('crab'),false);assert.equal(c.phase,'spent');
});
test('real card drag summons tiger and crab together; invalid, cancelled and paused drags never consume',()=>{
 const g=game(),h=g.hualing;h.claimSummon('beast');h.claimSummon('crab');
 for(const kind of ['beast','crab'] as const){const s=h.scenes.find(s=>s.mode===kind)!,slot=s.slot(bounds);
  h.handle({kind:'down',id:7,...slot});h.handle({kind:'up',id:7,x:0,y:100});assert.equal(s.phase,'stored');
  h.handle({kind:'down',id:7,...slot});h.handle({kind:'cancel',id:7,x:200,y:600});assert.equal(s.phase,'stored');
  h.handle({kind:'down',id:7,...slot});g.pause();h.cancelInput();h.handle({kind:'up',id:7,x:200,y:600});step(g,1);assert.equal(s.phase,'stored');g.pause();
  h.handle({kind:'down',id:7,...slot});h.handle({kind:'up',id:7,x:kind==='crab'?160:500,y:700});step(g,.2);assert.equal(s.phase,'spent');
 }
 assert.ok(h.scenes.some(s=>s.beast.alive));assert.ok(h.scenes.some(s=>s.crab.alive));
 const c=h.scenes.find(s=>s.mode==='crab')!,state=c.crab.state;assert.ok(h.claimSummon('crab'));assert.equal(c.crab.state,state,'claiming a replacement must not remove the current companion');
});
test('crab prefers a lane containing multiple small enemies, and locks that line before moving',()=>{
 const g=game(),c=new PaperCrab();for(const p of [{x:400,y:650},{x:500,y:650},{x:150,y:740}]){const e=g.spawn('ink',p)!;e.ai='Approach';}
 c.summon({x:150,y:650},bounds);c.advance(.5,g.enemies,bounds,()=>{});assert.equal(c.state!.phase,'windup');assert.equal(c.state!.to.y,650);
 const dest={...c.state!.to};g.enemies[0].y=400;c.advance(.3,g.enemies,bounds,()=>{});assert.deepEqual(c.state!.to,dest);
});
test('swept charge damages all along the path once, never off the path; stable at 30/60/120 fps',()=>{
 for(const fps of [30,60,120]){
  const g=game(),c=new PaperCrab();for(const p of [{x:220,y:650},{x:370,y:650},{x:540,y:650},{x:370,y:760}]){const e=g.spawn('ink',p)!;e.ai='Approach';e.hp=1000;}
  c.summon({x:120,y:650},bounds);const hits:number[]=[];
  for(let i=0;i<Math.round(1.7*fps);i++)c.advance(1/fps,g.enemies,bounds,(e,n)=>{e.hp-=n;hits.push(e.id);});
  assert.deepEqual(g.enemies.map(e=>e.hp),[944,944,944,1000]);assert.equal(new Set(hits).size,3);assert.equal(hits.length,3);assert.equal(c.state!.charges,1);
 }
});
test('same-position targets, repeated charges, empty arena, expiry, bounds and bad inputs remain safe',()=>{
 const g=game(),c=new PaperCrab(),e=g.spawn('ink',{x:200,y:650})!;e.ai='Approach';e.hp=10000;
 assert.equal(c.summon({x:NaN,y:650},bounds),false);assert.equal(c.summon({x:20,y:650},bounds),false);c.summon({x:200,y:650},bounds);
 c.advance(4,g.enemies,bounds,(e,n)=>e.hp-=n);assert.ok(e.hp<10000);assert.ok(c.state!.charges>=2);assert.ok(c.state!.x>=bounds.left+50&&c.state!.x<=bounds.right-50);
 c.advance(100,[],bounds,()=>assert.fail('empty arena hit'));assert.equal(c.state,null);c.summon({x:200,y:650},bounds);c.advance(2,[],bounds,()=>assert.fail());assert.equal(c.state!.phase,'idle');c.advance(NaN,[],bounds,()=>{});assert.ok(Number.isFinite(c.state!.x));
});
test('pause freezes companions and delayed summon; reset, chapter switch and menu clear both',()=>{
 const g=game(),h=g.hualing;h.claimSummon('crab');const s=h.scenes.find(s=>s.mode==='crab')!,slot=s.slot(bounds);h.handle({kind:'down',id:1,...slot});h.handle({kind:'up',id:1,x:250,y:650});g.pause();step(g,1);assert.equal(s.crab.state,null);g.pause();step(g,.2);const age=s.crab.state!.age;g.pause();step(g,1);assert.equal(s.crab.state!.age,age);g.pause();
 h.select('dragon');step(g,.2);assert.ok(s.crab.alive,'other cards do not remove the companion');
 g.changeHualingChapter('sea');assert.equal(s.crab.state,null);assert.ok(h.scenes.every(s=>!s.beast.alive&&!s.crab.alive));h.claimSummon('crab');g.menu();assert.ok(h.scenes.every(s=>!s.crab.alive&&s.phase==='repairing'));
});
console.log(`PASS ${suites} hualing summon suites (${PAPER_CRAB.damage} damage per enemy per charge)`);
