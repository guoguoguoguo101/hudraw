import {brushBodyRadius} from '../src/gameplay/brush-contact';
import assert from 'node:assert/strict';
import {BrushUpgrades,BRUSH_SKILLS,BRUSH_UPGRADE_CONFIG,BRUSH_BASE_WIDTH,WIDE_FINISHER} from '../src/gameplay/brush-upgrades';
import {Game} from '../src/gameplay/game';
import {InputController} from '../src/input/controller';
import type {PlatformAdapter} from '../src/platform/adapter';
const bounds={left:26,right:694,top:280,bottom:962};
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;return g;};
const step=(g:Game,n:number)=>{for(let t=0;t<n-1e-8;t+=1/60)g.advance(Math.min(1/60,n-t));};
let suites=0;function test(name:string,fn:()=>void){fn();suites++;console.log('PASS brush upgrades: '+name);}
test('manual levels clamp safely, reset clears runtime state, each skill remains independent',()=>{
 const m=new BrushUpgrades();m.setLevel('spray',9);m.setLevel('wide',2);m.setLevel('splash',-2);assert.deepEqual(m.levels,{spray:4,wide:2,splash:0,trail:0});m.setLevel('spray',NaN);assert.equal(m.levels.spray,4);
 m.begin();m.trace({x:100,y:500},{x:240,y:500});assert.ok(m.carp.fishes.length);m.setLevel('spray',0);assert.equal(m.drops.length,0);assert.equal(m.levels.wide,2);m.reset();assert.deepEqual(m.levels,{spray:0,wide:0,splash:0,trail:0});
});
test('four spray tiers cast immediately off the brush path and obey an internal cooldown',()=>{
 for(let level=1;level<=4;level++){
  const g=game(),m=g.hualing.upgrades;m.setLevel('spray',level);const e=g.spawn('oni',{x:240,y:500})!;e.hp=1000;
  m.begin();m.trace({x:100,y:500},{x:104,y:500});assert.equal(m.carp.fishes.length,BRUSH_UPGRADE_CONFIG.spray[level].count);assert.equal(m.drops.length,0);
  for(let i=0;i<1000;i++)m.trace({x:104,y:500},{x:108,y:500});assert.equal(m.carp.casts,1);step(g,.6);assert.ok(e.hp<1000);assert.equal(m.charge,0);assert.equal(g.hualing.combo.strokeKills,0);
 }
});

test('holding one moving stroke recasts without hits, release or charge and stops when stationary',()=>{
 for(let level=1;level<=4;level++){
  const m=new BrushUpgrades();m.setLevel('spray',level);m.begin();let peak=0;
  for(let i=0;i<180;i++){m.trace({x:100+i%10,y:500},{x:104+i%10,y:500});m.advance(1/60,[],()=>{});peak=Math.max(peak,m.carp.fishes.length);}
  assert.ok(m.carp.casts>=3);assert.ok(peak<=3);const count=m.carp.casts;
  for(let i=0;i<120;i++)m.advance(1/60,[],()=>{});assert.ok(m.carp.casts<=count+1);assert.equal(m.carp.fishes.length,0);assert.equal(m.sprayActive,false);
 }
});
test('wide tiers widen actual contact and increase direct damage while retaining cross-stroke cooldown',()=>{
 for(let level=0;level<=4;level++){
  const g=game(),m=g.hualing.upgrades;m.setLevel('wide',level);const r=m.contactRadius+brushBodyRadius({kind:'oni'});
  const inside=g.spawn('oni',{x:300,y:500+r-1})!,outside=g.spawn('oni',{x:300,y:500+r+2})!;inside.hp=outside.hp=1000;
  g.strokeHualing({x:250,y:500},{x:350,y:500});assert.equal(inside.hp,1000-BRUSH_UPGRADE_CONFIG.wide[level].damage);assert.equal(outside.hp,1000);
  g.endHualingStroke();g.beginHualingStroke();g.strokeHualing({x:350,y:500},{x:250,y:500});assert.equal(inside.hp,1000-BRUSH_UPGRADE_CONFIG.wide[level].damage);
 }
 const m=new BrushUpgrades();m.setLevel('wide',3);assert.equal(m.contactRadius,38);m.setLevel('wide',4);assert.equal(m.wideReady,true);assert.equal(m.mainDamage,60);assert.equal(m.width,BRUSH_BASE_WIDTH*3.1);assert.equal(m.contactRadius,38);
});
test('wide Lv4 follows input curves, retains breaks, bounds samples and has no cooldown',()=>{
 const m=new BrushUpgrades();m.setLevel('wide',4);assert.equal(m.takeWideTone(),'evolve');
 m.begin();m.end(bounds);assert.equal(m.wideWaves.length,0);
 m.begin();m.trace({x:100,y:400},{x:100,y:650});m.trace({x:100,y:650},{x:400,y:650});
 const w=m.wideWaves[0];assert.ok(w.path.every(p=>p.x===100||p.y===650));assert.equal(w.length,550);assert.equal(m.takeWideTone(),'cast');
 m.trace({x:500,y:700},{x:510,y:700});assert.ok(w.path.some(p=>p.break));
 for(let i=0;i<150;i++)m.trace({x:510,y:700},{x:520,y:700});assert.ok(w.path.length<=WIDE_FINISHER.points);
 m.end(bounds);m.begin();m.trace({x:200,y:500},{x:205,y:500});assert.equal(m.takeWideTone(),'cast');assert.equal(m.wideWaves.length,2);assert.equal(m.wideRemaining,0);
 m.panel='custom';const time=m.clock;m.advance(.1,[],()=>{});assert.equal(m.clock,time);m.panel=null;
 for(let i=0;i<15;i++)m.advance(.1,[],()=>{});assert.equal(m.wideWaves.length,0);assert.equal(m.wideReady,true);
 m.begin();m.trace({x:100,y:500},{x:150,y:500});m.setLevel('wide',0);assert.equal(m.wideWaves.length,0);
});
test('wide evolution plays once per run and restores do not replay it',()=>{
 const m=new BrushUpgrades();m.setLevel('wide',4);assert.equal(m.takeWideTone(),'evolve');m.setLevel('wide',4);assert.equal(m.takeWideTone(),null);
 m.setLevel('wide',3);m.setLevel('wide',4);assert.equal(m.takeWideTone(),null);const saved=m.snapshot();m.restore(saved);assert.equal(m.takeWideTone(),null);
 m.reset();m.setLevel('wide',4);assert.equal(m.takeWideTone(),'evolve');
});
test('long strokes keep their own slash; every new stroke immediately gets another at all frame rates',()=>{
 for(const fps of [30,60,120]){
  const m=new BrushUpgrades();m.setLevel('wide',4);m.takeWideTone();m.begin();let casts=0;
  for(let i=0;i<fps*3.4;i++){m.trace({x:100+i%10,y:500},{x:105+i%10,y:500});if(m.takeWideTone()==='cast')casts++;m.advance(1/fps,[],()=>{});}
  assert.equal(casts,1);for(let i=0;i<fps*2;i++)m.advance(1/fps,[],()=>{});assert.equal(m.wideWaves.length,0);assert.equal(m.takeWideTone(),null);m.end(bounds);assert.equal(m.wideWaves.length,0);
  for(let i=0;i<3;i++){m.begin();m.trace({x:100,y:500},{x:160,y:500});assert.equal(m.takeWideTone(),'cast');m.end(bounds);}assert.equal(m.wideWaves.length,3);
 }
});
test('visual afterimage budget never drops damage from rapid consecutive strokes',()=>{
 const g=game(),template=g.spawn('oni',{x:300,y:500})!,target={...template,hp:100000},m=g.hualing.upgrades;m.setLevel('wide',4);
 for(let i=0;i<20;i++){m.begin();m.trace({x:100,y:500},{x:350,y:500});m.end(bounds);}
 assert.equal(m.wideWaves.length,WIDE_FINISHER.visualLimit);m.advance(.05,[target],(e,n)=>{e.hp-=n;});assert.equal(target.hp,100000-WIDE_FINISHER.damage*20);
 const hp=target.hp;for(let i=0;i<15;i++)m.advance(.1,[target],(e,n)=>{e.hp-=n;});assert.equal(target.hp,hp-WIDE_FINISHER.burstDamage*20);assert.equal(m.wideWaves.length,0);assert.equal(m.wideCuts.length,0);
});
test('rift damage follows real segments, never their chord or forward extension, at all frame rates',()=>{
 const totals=[];
 for(const fps of [30,60,120]){
  const g=game(),m=g.hualing.upgrades;m.setLevel('wide',4);
  const template=g.spawn('oni',{x:100,y:500})!;
  const targets=[{x:100,y:500},{x:300,y:650},{x:250,y:525},{x:550,y:650}].map((p,i)=>({...template,...p,id:template.id+i,hp:1000}));
  const damage=(e:typeof template,n:number)=>{e.hp-=n;};
  m.begin();m.trace({x:100,y:400},{x:100,y:650},'maple-thunder');
  for(let i=0;i<fps/10;i++)m.advance(1/fps,targets,damage);
  m.trace({x:100,y:650},{x:400,y:650},'maple-thunder');
  for(let i=0;i<fps/10;i++)m.advance(1/fps,targets,damage);
  m.trace({x:400,y:650},{x:100,y:650});m.advance(.08,targets,damage);m.end(bounds);
  assert.deepEqual(targets.map(e=>e.hp),[820,820,1000,1000]);
  for(let i=0;i<fps/2;i++)m.advance(1/fps,targets,damage);
  assert.deepEqual(targets.map(e=>e.hp),[724,724,1000,1000]);
  m.begin();m.trace({x:100,y:400},{x:100,y:650});m.advance(.08,targets,damage);m.end(bounds);
  assert.equal(targets[0].hp,544);totals.push(targets.map(e=>e.hp));
  for(let i=0;i<fps*2;i++)m.advance(1/fps,targets,damage);
  assert.equal(m.wideWaves.length,0);assert.equal(m.wideCuts.length,0);assert.equal(m.charge,0);
 }
 assert.deepEqual(totals[0],totals[1]);assert.deepEqual(totals[1],totals[2]);
 const g=game(),m=g.hualing.upgrades;m.setLevel('wide',4);g.beginHualingStroke();g.strokeHualing({x:100,y:500},{x:140,y:500});g.endHualingStroke();
 const age=m.wideWaves[0].age;g.pause();step(g,1);assert.equal(m.wideWaves[0].age,age);g.pause();g.changeHualingChapter('sea');assert.equal(m.wideWaves.length,0);
});
test('void interior catches arrivals once, never fills curve chords, freezes and clears pending bursts',()=>{
 const g=game(),m=g.hualing.upgrades;m.setLevel('wide',4);
 const template=g.spawn('oni',{x:280,y:500})!,target={...template,hp:1000};
 m.begin();m.trace({x:100,y:650},{x:450,y:650});m.end(bounds);
 const damage=(e:typeof template,n:number)=>{e.hp-=n;};
 m.advance(.08,[target],damage);assert.equal(target.hp,1000);
 target.y=650+WIDE_FINISHER.burstRadius+brushBodyRadius(target)-1;
 m.panel='custom';for(let i=0;i<10;i++)m.advance(.1,[target],damage);assert.equal(target.hp,1000);m.panel=null;
 m.advance(.1,[target],damage);m.advance(.1,[target],damage);assert.equal(target.hp,1000);
 m.advance(.05,[target],damage);assert.equal(target.hp,1000-WIDE_FINISHER.burstDamage);assert.ok(target.vy<0);
 for(let i=0;i<15;i++)m.advance(.1,[target],damage);assert.equal(target.hp,904);
 m.begin();m.trace({x:100,y:650},{x:450,y:650});m.end(bounds);m.advance(.05,[],damage);m.clearEffects();
 for(let i=0;i<10;i++)m.advance(.1,[target],damage);assert.equal(target.hp,904);
});
test('dual route retains four levels through growth and snapshots',()=>{
 const m=new BrushUpgrades();m.startGrowth();for(let level=1;level<=4;level++){if(level>1){m.pending=1;m.panel='upgrade';}m.choose('splash');assert.equal(m.levels.splash,level);m.begin();m.trace({x:100,y:500},{x:240,y:500});assert.equal(m.dual.sides.length,level===1?1:2);m.end(bounds);}
 const copy=new BrushUpgrades();copy.restore(m.snapshot());assert.equal(copy.levels.splash,4);copy.begin();copy.trace({x:100,y:500},{x:200,y:500});assert.equal(copy.dual.level,4);
});
test('real pointer cancellation, pause and release stop dragon acquisition',()=>{
 const g=game(),m=g.hualing.upgrades;m.setLevel('splash',4);
 const input=new InputController({input:()=>()=>{}} as unknown as PlatformAdapter,{} as never,()=>g.active,()=>false,()=>false,undefined,g.pen,g.ink);
 input.simpleBrush=()=>true;input.onStrokeSegment=(a,b)=>g.strokeHualing(a,b);input.onSimpleStroke=p=>p==='begin'?g.beginHualingStroke():g.endHualingStroke(p==='cancel');
 const prime=()=>{input.event({kind:'down',id:1,x:100,y:500});input.event({kind:'move',id:1,x:200,y:500});};
 prime();input.cancel();assert.equal(m.dual.drawing,false);assert.ok(m.dual.sides.every(s=>!s.lunge));
 prime();input.event({kind:'up',id:1,x:200,y:500});assert.equal(m.dual.drawing,false);
 prime();g.pause();input.cancel();const t=m.dual.clock;step(g,1);assert.equal(m.dual.clock,t);g.pause();
 prime();input.event({kind:'up',id:2,x:220,y:500});assert.equal(m.dual.drawing,true);input.event({kind:'up',id:1,x:230,y:500});assert.equal(m.dual.drawing,false);
 step(g,.6);assert.ok(m.dual.sides.every(s=>s.path.length===0));g.changeHualingChapter('sea');assert.equal(m.dual.sides.length,0);
});
test('growth gives eight choices, never exceeds Lv4, defers offers until release and freezes all combat',()=>{
 const g=game(),m=g.hualing.upgrades;m.startGrowth();const time=g.time,journey=g.hualing.journey.time;step(g,1);assert.equal(g.time,time);assert.equal(g.hualing.journey.time,journey);
 m.choose('spray');assert.equal(m.levels.spray,1);for(let i=0;i<4;i++)m.kill();g.advance(.1,true);assert.equal(m.panel,null);g.advance(.1,false);assert.equal(m.panel,'upgrade');m.choose('spray');
 while(m.picks<8){while(!m.pending)m.kill();m.offer(true);m.choose(m.choices[0]);}
 assert.equal(m.levels.spray,4);assert.equal(m.levels.wide,4);for(let i=0;i<100;i++)m.kill();assert.equal(m.pending,0);assert.equal(m.picks,8);
 m.panel='custom';const c=m.clock;step(g,1);assert.equal(m.clock,c);m.panel=null;g.start(false,true,false,false,true);assert.equal(m.growth,false);assert.equal(m.panel,null);
});
test('combining all skills keeps secondary damage out of direct-brush credit and old modes isolated',()=>{
 const g=game(),m=g.hualing.upgrades;for(const id of BRUSH_SKILLS)m.setLevel(id,4);g.beginHualingStroke();const e=g.spawn('ink',{x:300,y:500})!;e.hp=1;m.trace({x:100,y:500},{x:200,y:500});const shot=m.carp.fish!;e.x=shot.x+shot.dx*90;e.y=shot.y+shot.dy*90;step(g,.6);assert.equal(g.hualing.combo.strokeKills,0);assert.equal(g.hualing.combo.count,1);
 g.menu();g.start(false,true,false,true);g.strokeHualing({x:200,y:500},{x:400,y:500});assert.equal(g.hualing.upgrades.drops.length,0);assert.equal(g.hualing.upgrades.panel,null);
});
console.log(`PASS ${suites} brush upgrade suites`);
