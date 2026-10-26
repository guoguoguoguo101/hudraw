import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {ELITE_CATALOG,chapterElites,eliteRelicPoints,type EliteKind} from '../src/gameplay/hualing-elites';
import type {FieldObject} from '../src/gameplay/elite-field';
export const make=(kind:EliteKind)=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.journey.automatic=false;const e=g.summonHualingElite(kind)!;g.enemies=[e];const m=g.hualing.elites;m.field.begin(e,g.hualing.bounds,g.enemies);return {g,e,m,f:m.field,s:e.elite!};};
export const step=(g:Game,t:number)=>{for(let n=0;n<t*60-1e-6;n++)g.advance(1/60);};
export function stroke(g:Game,o:{x:number;y:number},target:{x:number;y:number}={x:o.x+10,y:o.y}){g.hualing.clock+=.35;const n=Math.hypot(target.x-o.x,target.y-o.y)||1;g.strokeHualing({x:o.x,y:o.y},{x:o.x+(target.x-o.x)/n*14,y:o.y+(target.y-o.y)/n*14});}
let suites=0;function test(name:string,run:()=>void){run();suites++;console.log('PASS elite field: '+name);}
test('all twenty draw real objects over the arena, no small body targets, natural full rounds and unique chapter pools',()=>{
 const names=new Set<string>();for(const chapter of ['valley','sea','palace','snow'] as const){assert.equal(chapterElites(chapter).length,5);for(const kind of chapterElites(chapter)){names.add(ELITE_CATALOG[kind].name);const {g,e,f}=make(kind);assert.equal(g.hualing.journey.chapter,chapter);assert.equal(e.maxHp,ELITE_CATALOG[kind].hp);assert.ok(f.objects.length>=2,kind);const pts=f.objects.flatMap(o=>[o,...o.nodes]);const span=Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),height=Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y));assert.ok(span>330||height>330,kind+' must use arena-sized movement');assert.ok(pts.some(p=>Math.hypot(p.x-e.x,p.y-e.y)>220),kind);const g2=new Game();g2.start(false,true,false,false,true);g2.director.disabled=true;g2.summonHualingElite(kind);step(g2,2.9);assert.equal(g2.enemies.find(e=>e.elite)!.elite!.phase,'dash');assert.ok(g2.hualing.elites.field.objects.length,kind+' natural launch');}}assert.equal(names.size,20);
});
test('parasol reflections travel across the map and cause real hits, not immediate remote body marks',()=>{
 const {g,e,f,s}=make('umbrella'),hp=e.hp;for(const o of [...f.objects])stroke(g,o,e);assert.equal(e.hp,hp);step(g,2.1);assert.ok(e.hp<hp);assert.equal(s.phase,'stagger');assert.equal(f.objects.length,0);
});
test('puppet threads and jelly tentacles are cuttable along their whole distant length and give partial rewards',()=>{
 for(const kind of ['puppet','jelly'] as const){const {g,e,f,s}=make(kind);for(const o of [...f.objects]){if(!f.rounds.has(e.id))break;const a=o.nodes[0],b=o.nodes[1],p={x:a.x+(b.x-a.x)*.75,y:a.y+(b.y-a.y)*.75};stroke(g,p,{x:p.x+10,y:p.y+3});}assert.equal(s.phase,'stagger',kind);assert.ok(e.hp<e.maxHp);}
 const {g,e,f,m}=make('puppet'),small=g.spawn('ink',{x:120,y:800})!;m.advance(.01,g.enemies,false,()=>{});assert.equal(m.damageScale(small),.5);for(const o of [...f.objects])stroke(g,{x:(o.nodes[0].x+o.nodes[1].x)/2,y:(o.nodes[0].y+o.nodes[1].y)/2});m.advance(.01,g.enemies,false,()=>{});assert.equal(m.damageScale(small),1);
});
test('stones, boats, ice blocks and lanterns are pushed by actual brush direction and collide with damage and cleanup',()=>{
 for(const kind of ['stele','hermit','frostApe','lantern'] as const){const {g,e,f,s}=make(kind);const [a,b]=f.objects;a.x=190;a.y=760;a.vx=a.vy=0;b.x=330;b.y=760;b.vx=b.vy=0;a.warn=b.warn=0;for(const q of f.objects.slice(2)){q.x=650;q.y=300;q.vx=q.vy=0;q.warn=20;}
 const small=g.spawn('ink',{x:280,y:760})!;small.hp=small.maxHp=1000;small.speed=0;const hp=e.hp;stroke(g,a,{x:330,y:760});assert.ok(a.vx>200,kind);step(g,.6);assert.ok(e.hp<hp,kind+' return burst');assert.ok(small.hp<1000,kind+' collateral damage');assert.ok(s.progress>=1||s.phase==='stagger',kind);assert.ok(f.effects.some(f=>f.style==='burst'),kind);}
});
test('the two giant claws and manta rays collide after a real steering stroke across the arena',()=>{
 for(const kind of ['reefCrab','rays'] as const){const {g,e,f,s}=make(kind);const [a,b]=f.objects;stroke(g,a,b);step(g,2.8);assert.equal(s.phase,'stagger',kind);assert.ok(e.hp<e.maxHp);}
});
test('pearls return healing if ignored, and aimed brush pushes them back into the shell',()=>{
 const a=make('clam');a.e.hp=200;step(a.g,8.4);assert.ok(a.e.hp>=272);
 const {g,e,f,s}=make('clam');for(const o of f.objects.slice(0,3))stroke(g,o,e);step(g,2.2);assert.equal(s.phase,'stagger');assert.ok(e.hp<e.maxHp);
});
test('moths follow recent brush traces, with local chain explosions rather than global auto-clearing',()=>{
 const {g,e,f,s}=make('moth'),moth=f.objects[0],target={x:170,y:790};const before=Math.hypot(moth.x-target.x,moth.y-target.y);stroke(g,target);step(g,1.1);assert.ok(Math.hypot(moth.x-target.x,moth.y-target.y)<before);const [a,b]=f.objects;a.x=190;a.y=760;b.x=260;b.y=760;a.warn=b.warn=0;stroke(g,a);step(g,.02);assert.ok(s.progress>=2);assert.ok(e.hp<e.maxHp);assert.ok(f.objects.length>=1,'distant moths survive a local explosion');
});
test('mirrors aim reflected beams, web cuts throw lines, and bell parries require different expanding arcs',()=>{
 const a=make('mirror');for(const o of a.f.objects.slice(0,2))stroke(a.g,o,a.e);assert.equal(a.s.phase,'stagger');assert.ok(a.e.hp<a.e.maxHp);
 const w=make('weaver');for(const o of [...w.f.objects].filter(o=>o.shape==='thread')){const p={x:(o.nodes[0].x+o.nodes[1].x)/2,y:(o.nodes[0].y+o.nodes[1].y)/2};stroke(w.g,p);}assert.equal(w.s.phase,'stagger');assert.ok(w.f.effects.some(f=>f.style==='beam'));
 const q=make('bell'),rings=[...q.f.objects];for(const [i,o] of rings.entries()){const p={x:o.x+o.radius,y:o.y};stroke(q.g,p,{x:p.x-10,y:p.y});if(q.s.phase==='stagger')break;}assert.equal(q.s.phase,'stagger');
 const r=make('bell'),o=r.f.objects[0];const p={x:o.x+o.radius,y:o.y};for(let i=0;i<5;i++)stroke(r.g,p,{x:p.x-10,y:p.y});assert.equal(r.s.progress,1,'same arc cannot be rubbed into a full break');
});
test('moving stamps land with enemy damage; missed stamps release bounded guards; blades can be borrowed or shattered',()=>{
 const a=make('official');for(const o of a.f.objects.slice(0,2))stroke(a.g,o,{x:o.x+100,y:o.y});step(a.g,1.1);assert.equal(a.s.phase,'stagger');assert.ok(a.e.hp<a.e.maxHp);
 const b=make('official');step(b.g,3.3);assert.ok(b.g.enemies.some(e=>!e.elite));assert.ok(b.g.enemies.filter(e=>!e.elite).length<=2);
 for(const mode of ['borrow','shatter']){const v=make('blade'),o=v.f.objects[0],n=Math.hypot(o.vx,o.vy);stroke(v.g,o,{x:o.x+o.vx/n*100*(mode==='borrow'?1:-1),y:o.y+o.vy/n*100*(mode==='borrow'?1:-1)});assert.ok(mode==='borrow'?o.friendly:!v.f.objects.includes(o));if(mode==='shatter')assert.ok(v.e.hp<v.e.maxHp);}
});
test('snow lamps leave clearable local fog, snowballs grow and smash, deer slip on intercepted flowers, cracks accept any branch',()=>{
 const a=make('crone');step(a.g,1.5);assert.ok(a.f.effects.some(f=>f.style==='fog'));for(const o of [...a.f.objects]){if(o.shape==='snowLamp')stroke(a.g,o);}assert.equal(a.s.phase,'stagger');assert.ok(!a.f.effects.some(f=>f.style==='fog'));
 const p=make('pineApe'),ball=p.f.objects[0];step(p.g,2);assert.ok(ball.radius>25);stroke(p.g,ball,{x:ball.x-ball.vx,y:ball.y-ball.vy});assert.ok(!p.f.objects.includes(ball));assert.ok(p.s.progress>=1);
 const d=make('deer'),rear=d.f.objects.find(o=>o.shape==='deer'&&o.index===1)!,front=d.f.objects.find(o=>o.shape==='deer'&&o.index===0)!,flower=d.f.objects.find(o=>o.shape==='flower')!;stroke(d.g,rear);flower.x=front.x+90;flower.y=front.y;stroke(d.g,flower);step(d.g,1.7);assert.equal(d.s.phase,'stagger');
 const c=make('guardian');for(const o of c.f.objects.slice(0,2))for(let i=1;i<o.nodes.length;i++){c.g.hualing.clock+=.35;c.g.strokeHualing(o.nodes[i-1],o.nodes[i]);}assert.equal(c.s.phase,'stagger');assert.ok(c.e.hp<c.e.maxHp);
});
test('all twenty can be countered in a natural arena round with brush strokes alone, without moving test targets',()=>{
 for(const kind of Object.keys(ELITE_CATALOG) as EliteKind[]){const {g,e,f,s}=make(kind);
  const direction=(o:FieldObject,target:{x:number;y:number})=>stroke(g,o,target);
  if(kind==='deer'){step(g,3);const rear=f.objects.find(o=>o.shape==='deer'&&o.index===1)!;stroke(g,rear);for(const o of [...f.objects].filter(o=>o.shape==='flower'))stroke(g,o);step(g,4);}
  else if(kind==='reefCrab'||kind==='rays'){direction(f.objects[0],f.objects[1]);step(g,3);}
  else if(kind==='guardian'){for(const o of f.objects.slice(0,2))for(let i=1;i<o.nodes.length;i++){g.hualing.clock+=.35;g.strokeHualing(o.nodes[i-1],o.nodes[i]);}}
  else if(kind==='bell'){for(const o of [...f.objects])stroke(g,{x:o.x+o.radius,y:o.y},{x:o.x+o.radius-10,y:o.y});}
  else if(kind==='puppet'||kind==='jelly'||kind==='weaver'){for(const o of [...f.objects].filter(o=>o.nodes.length)){const a=o.nodes[0],b=o.nodes[1];stroke(g,{x:a.x+(b.x-a.x)*.7,y:a.y+(b.y-a.y)*.7});}}
  else if(kind==='blade'||kind==='pineApe'){for(const o of [...f.objects])direction(o,{x:o.x-o.vx,y:o.y-o.vy});}
  else if(kind==='moth'||kind==='crone'){for(const o of [...f.objects])stroke(g,o);}
  else{for(const o of [...f.objects])direction(o,e);step(g,3);}
  assert.ok(s.progress>=s.goal||e.hp<=0,kind+' must be solvable by its actual arena interaction');
 }
});
test('30/60/120fps preserve reflected hits; long battles stay bounded and mirrored beams reject same-direction rubbing',()=>{
 const outcomes:number[]=[];
 for(const fps of [30,60,120]){const {g,e,f,s}=make('umbrella');for(const o of [...f.objects])stroke(g,o,e);for(let i=0;i<2.1*fps;i++)g.advance(1/fps);assert.equal(s.phase,'stagger');outcomes.push(e.hp);}assert.ok(Math.max(...outcomes)-Math.min(...outcomes)<1e-6);
 const a=make('mirror'),o=a.f.objects[0];stroke(a.g,o,a.e);const hp=a.e.hp,progress=a.s.progress;for(let n=0;n<6;n++)stroke(a.g,o,a.e);assert.equal(a.e.hp,hp);assert.equal(a.s.progress,progress);
 for(const kind of ['bell','crone','guardian'] as const){const {g,e,f}=make(kind);for(let n=0;n<2400;n++)g.advance(1/60);assert.ok(f.objects.length<=48);assert.ok(f.effects.length<=80);assert.ok(f.objects.every(o=>Number.isFinite(o.x+o.y+o.radius)));g.clearHualingElites();const hp=e.hp;step(g,2);assert.equal(e.hp,hp);assert.equal(f.objects.length,0);assert.equal(f.effects.length,0);}
});
test('pause, tuning, freeze, death, chapter switch, reset and old modes cannot leave invisible field damage',()=>{
 const {g,e,f}=make('umbrella');step(g,.9);const x=f.objects[0].x,age=f.objects[0].age;g.pause();step(g,1);assert.equal(f.objects[0].age,age);g.pause();g.hualing.upgrades.panel='custom';step(g,1);assert.equal(f.objects[0].x,x);g.hualing.upgrades.panel=null;g.hualing.frozen=true;step(g,1);assert.equal(f.objects[0].age,age);g.hualing.frozen=false;g.damage(e,10000);assert.equal(f.objects.length,0);assert.equal(f.rounds.size,0);assert.equal(g.hualing.elites.relics.length,1);g.changeHualingChapter('sea');assert.equal(f.effects.length,0);g.menu();assert.equal(f.objects.length,0);g.start(false,true);assert.equal(g.summonHualingElite('umbrella'),null);
});
test('natural chapter rotation still selects all five, rewards remain traceable once',()=>{
 for(const chapter of ['valley','sea','palace','snow'] as const){const g=new Game();g.start(false,true,false,false,true);g.changeHualingChapter(chapter);g.director.disabled=false;g.hualing.journey.automatic=false;for(const kind of chapterElites(chapter)){g.time+=60;g.advance(1/60);assert.equal(g.enemies.find(e=>e.elite)?.elite?.kind,kind);g.clearHualingElites();}}
 const {g,e,m}=make('umbrella');g.damage(e,10000);const r=m.relics[0],points=eliteRelicPoints(r);for(let i=0;i<points.length;i++)g.strokeHualing(points[i],points[(i+1)%points.length]);assert.equal(r.collected,true);assert.equal(g.hualing.petals.remaining,12);
});
console.log(`PASS ${suites} arena elite suites`);

