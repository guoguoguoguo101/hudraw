import assert from 'node:assert/strict';
import {createBattlefield,spawnAssault,advanceBattlefield} from '../src/gameplay/boss-battlefield';
import {INK_RITUAL} from '../src/gameplay/ink-formations';
import {Game} from '../src/gameplay/game';
import {InkTrail,INK_TRAIL_CONFIG,INK_TRAIL_LIMITS,trailStyle} from '../src/gameplay/ink-trail';
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;return g;};
const step=(g:Game,seconds:number)=>{for(let t=0;t<seconds-1e-8;t+=1/60)g.advance(Math.min(1/60,seconds-t));};
let suites=0;const test=(name:string,fn:()=>void)=>{fn();suites++;console.log('PASS ink trail: '+name);};
test('all four levels have real delayed damage, level-specific lifetime and no out-of-path damage',()=>{
 for(let l=1;l<=4;l++){
  const g=game(),u=g.hualing.upgrades;u.setLevel('trail',l);u.begin();u.trace({x:100,y:500},{x:400,y:500});u.end(g.hualing.bounds);
  const e=g.spawn('oni',{x:300,y:500})!,outside=g.spawn('oni',{x:300,y:650})!;e.hp=outside.hp=1000;
  step(g,.24);assert.equal(e.hp,1000);step(g,.02);assert.equal(e.hp,1000-INK_TRAIL_CONFIG[l].damage);step(g,.5);assert.equal(e.hp,1000-2*INK_TRAIL_CONFIG[l].damage);assert.equal(outside.hp,1000);
  step(g,INK_TRAIL_CONFIG[l].duration);assert.equal(u.trail.segments.length,0);const after=e.hp;step(g,1);assert.equal(e.hp,after);
 }
});
test('curves follow actual segments, crossings do not multiply damage and repeated paint refreshes expiry',()=>{
 const reverse=new InkTrail();reverse.trace({x:100,y:500},{x:110,y:500},16,1,'cinnabar');reverse.trace({x:110,y:500},{x:96,y:500},16,1,'cinnabar');assert.ok(reverse.segments.some(s=>s.b.x===110),'a short reverse turn must not erase the original footprint');
 const g=game(),u=g.hualing.upgrades;u.setLevel('trail',1);u.begin();
 u.trace({x:100,y:400},{x:100,y:600});u.trace({x:100,y:600},{x:300,y:600});
 const chord=g.spawn('oni',{x:200,y:500})!,on=g.spawn('oni',{x:100,y:500})!;chord.hp=on.hp=1000;
 step(g,.3);assert.equal(chord.hp,1000);assert.equal(on.hp,994);
 const count=u.trail.segments.length;for(let i=0;i<100;i++){u.trace({x:100,y:400},{x:100,y:600});u.trace({x:100,y:600},{x:300,y:600});}
 assert.equal(u.trail.segments.length,count);step(g,.5);assert.equal(on.hp,988);step(g,1.3);assert.ok(u.trail.segments.length>0);step(g,.3);assert.equal(u.trail.segments.length,0);
});
test('maple / thunder / both are captured per footprint and survive buff expiration',()=>{
 const g=game(),h=g.hualing,u=h.upgrades;u.setLevel('trail',4);g.beginHualingStroke();
 g.strokeHualing({x:100,y:400},{x:300,y:400});h.petals.activate();h.petals.remaining=.1;
 g.strokeHualing({x:100,y:500},{x:300,y:500});h.thunder.activate();h.thunder.remaining=.1;
 g.strokeHualing({x:100,y:600},{x:300,y:600});step(g,.2);
 assert.equal(h.petals.active,false);assert.equal(h.thunder.active,false);
 g.strokeHualing({x:100,y:700},{x:300,y:700});
 assert.deepEqual(new Set(u.trail.segments.map(s=>s.style)),new Set(['cinnabar','maple','maple-thunder']));
 h.thunder.activate();g.strokeHualing({x:350,y:500},{x:550,y:500});assert.ok(u.trail.segments.some(s=>s.style==='thunder'));
 assert.equal(trailStyle(false,false),'cinnabar');assert.equal(trailStyle(true,false),'maple');assert.equal(trailStyle(false,true),'thunder');assert.equal(trailStyle(true,true),'maple-thunder');
});
const circle=(m:InkTrail,level:number,cancel=false,rx=120,ry=100)=>{
 m.begin();const pts=Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return{x:350+Math.cos(a)*rx,y:600+Math.sin(a)*ry};});
 for(let i=1;i<pts.length;i++)m.trace(pts[i-1],pts[i],16,level,'cinnabar');return m.end(cancel,{left:26,right:694,top:280,bottom:962});
};
test('circles form only at Lv3+, ellipses work, open lines/cancellation/discontinuities never summon',()=>{
 for(const level of [1,2,3,4]){const m=new InkTrail();assert.equal(circle(m,level),level>=3);assert.equal(m.rituals.formations.length,level>=3?1:0);}
 const m=new InkTrail();assert.equal(circle(m,4,true),false);m.begin();for(let i=0;i<30;i++)m.trace({x:100+i*10,y:500},{x:110+i*10,y:500},16,4,'cinnabar');assert.equal(m.end(),false);
 m.begin();m.trace({x:100,y:400},{x:100,y:600},16,4,'cinnabar');m.trace({x:300,y:600},{x:300,y:400},16,4,'cinnabar');assert.equal(m.end(),false);
 assert.equal(circle(m,3,false,160,70),true);m.reset();assert.equal(m.rituals.formations.length,0);
});
test('Lv3 formation and Lv4 guardian deal real interior damage without hitting outside at 30/60/120fps',()=>{
 const totals:number[][]=[];
 for(const fps of [30,60,120]){
  const g=game(),base=g.spawn('oni',{x:350,y:600})!;const values=[];
  for(const level of [3,4]){
   const m=new InkTrail(),inside={...base,hp:10000},outside={...base,id:900,x:600,y:600,hp:10000};circle(m,level);
   const counts:number[]=[];for(let i=0;i<fps*5.5;i++)m.advance(1/fps,[inside,outside],(e,n)=>{e.hp-=n;if(e.id===inside.id)counts.push(n);});
   assert.equal(outside.hp,10000);assert.equal(counts.filter(n=>n===INK_RITUAL.arrival).length,1);assert.equal(counts.filter(n=>n===INK_RITUAL.slamDamage).length,level===4?3:0);assert.equal(m.rituals.formations.length,0);values.push(inside.hp);
  }
  assert.ok(values[1]<values[0]-400);totals.push(values);
 }
 assert.deepEqual(totals[0],totals[1]);assert.deepEqual(totals[1],totals[2]);
});
test('pause and tuning freeze trail timers/damage; scene reset, chapter switch and old modes clear it',()=>{
 const g=game(),u=g.hualing.upgrades;u.setLevel('trail',4);u.trace({x:100,y:500},{x:400,y:500});const e=g.spawn('oni',{x:300,y:500})!;e.hp=1000;
 g.pause();step(g,2);assert.equal(u.trail.time,0);assert.equal(e.hp,1000);g.pause();u.panel='custom';step(g,2);assert.equal(u.trail.time,0);u.panel=null;step(g,.3);assert.equal(e.hp,988);
 u.setLevel('wide',2);assert.equal(u.trail.segments.length,0);assert.equal(u.levels.trail,4);
 u.trace({x:100,y:500},{x:400,y:500});g.changeHualingChapter('sea');assert.equal(u.trail.segments.length,0);assert.equal(u.levels.trail,0);
 g.menu();g.start(false,true,false,true);g.strokeHualing({x:100,y:500},{x:400,y:500});assert.equal(u.trail.segments.length,0);
});
test('dense paint stays bounded and an evicted footprint cannot keep dealing damage',()=>{
 const m=new InkTrail();m.begin();for(let i=0;i<2000;i++)m.trace({x:i*20,y:500},{x:i*20+20,y:500},16,4,'maple-thunder');
 assert.ok(m.segments.length<=INK_TRAIL_LIMITS.segments);assert.ok(m.length<=INK_TRAIL_LIMITS.length);
 const g=game(),e=g.spawn('oni',{x:100,y:500})!;let hits=0;for(let i=0;i<150;i++)m.advance(1/60,[e],()=>hits++);assert.equal(hits,0);
 m.reset();assert.equal(m.segments.length,0);assert.equal(m.rituals.formations.length,0);
});
test('trail kills count toward chains and growth but never charge splash or count as direct brush kills',()=>{
 const g=game(),u=g.hualing.upgrades;u.setLevel('trail',1);u.setLevel('splash',4);g.beginHualingStroke();u.trace({x:100,y:500},{x:400,y:500});
 const e=g.spawn('ink',{x:300,y:500})!;e.hp=1;step(g,.3);assert.equal(g.kills,1);assert.equal(g.hualing.combo.count,1);assert.equal(g.hualing.combo.strokeKills,0);assert.equal(u.charge,0);assert.equal(u.drops.length,0);
});
test('30/60/120fps have the same sustained damage budget and stationary brush cannot create new trails',()=>{
 const totals=[];for(const fps of [30,60,120]){const m=new InkTrail(),g=game(),e=g.spawn('oni',{x:300,y:500})!;m.trace({x:100,y:500},{x:400,y:500},16,3,'cinnabar');let damage=0;for(let i=0;i<1.6*fps;i++)m.advance(1/fps,[e],(_,n)=>damage+=n);totals.push(damage);const n=m.segments.length;m.trace({x:300,y:500},{x:300,y:500},16,3,'cinnabar');assert.equal(m.segments.length,n);}
 assert.deepEqual(totals,[30,30,30]);
});
test('Lv2+ intercept swept projectiles, reject Lv1, exhaust locally, expire and reset safely',()=>{
 for(const level of [1,2,3,4]){
  const m=new InkTrail();m.begin();m.trace({x:100,y:500},{x:600,y:500},16,level,'thunder');m.advance(.1,[],()=>{});
  assert.equal(m.blockProjectile({x:200,y:300},{x:200,y:700},5),level>=2);
  if(level>=2){assert.equal(m.rituals.blocks.length,1);assert.equal(m.blockProjectile({x:200,y:300},{x:200,y:700},5),false);for(const x of [300,400,500])assert.equal(m.blockProjectile({x,y:300},{x,y:700},5),true);assert.equal(m.blockProjectile({x:580,y:300},{x:580,y:700},5),false);}
  for(let i=0;i<60;i++)m.advance(.1,[],()=>{});assert.equal(m.blockProjectile({x:220,y:300},{x:220,y:700},5),false);m.reset();assert.equal(m.rituals.blocks.length,0);
 }
});
test('formation budgets, a single guardian, reset and slow immunity stay bounded',()=>{
 const m=new InkTrail();for(let i=0;i<8;i++)circle(m,3);assert.equal(m.rituals.formations.length,2);
 for(let i=0;i<8;i++)circle(m,4);assert.equal(m.rituals.formations.filter(f=>f.level===4).length,1);assert.ok(m.rituals.formations.length<=2);
 const g=game(),base=g.spawn('oni',{x:350,y:600})!,boss={...base,kind:'boss' as const,hp:10000,ai:'Approach' as const},normal={...base,id:900,hp:10000};
 for(let i=0;i<120;i++)m.advance(1/60,[boss,normal],(e,n)=>{e.hp-=n;});assert.equal(boss.ai,'Approach');assert.equal(m.isSlowed(boss.id),false);assert.equal(m.isSlowed(normal.id),true);
 m.reset();assert.equal(m.rituals.formations.length,0);assert.equal(m.isSlowed(normal.id),false);
});
test('retained ink absorbs a real boss sun projectile without granting manual counter credit',()=>{
 const m=new InkTrail();m.begin();m.trace({x:100,y:500},{x:500,y:500},16,2,'cinnabar');m.advance(.1,[],()=>{});
 const f=createBattlefield(),bounds={left:26,right:694,top:280,bottom:962},a=spawnAssault(f,'valley',bounds,{x:200,y:400});a.from={x:200,y:400};a.to={x:200,y:800};a.charge=.1;a.duration=.5;
 let impacts=0,parries=0;
 for(let i=0;i<12;i++)advanceBattlefield(f,'valley',bounds,{x:200,y:400},.1,false,false,false,{impact:()=>impacts++,parry:()=>parries++,launch:()=>{},block:(a,b,r)=>m.blockProjectile(a,b,r)});
 assert.equal(impacts,0);assert.equal(parries,0);assert.equal(f.counter,0);assert.equal(m.rituals.blocks.length,1);
});
console.log(`PASS ${suites} ink trail suites`);
