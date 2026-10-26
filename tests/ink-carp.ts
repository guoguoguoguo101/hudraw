import assert from 'node:assert/strict';
import {InkCarp,INK_CARP_TIERS} from '../src/gameplay/ink-carp';
import {Game} from '../src/gameplay/game';
const game=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;return g;};
const step=(g:Game,t:number)=>{for(let i=0;i<t*60;i++)g.advance(1/60);};
let suites=0;function test(name:string,fn:()=>void){fn();suites++;console.log('PASS ink carp: '+name);}
test('every tier fires a short stroke immediately, rejects input spam and automatically repeats mid-stroke',()=>{
 for(let level=1;level<=4;level++){
  const m=new InkCarp();m.level=level;m.begin();m.trace({x:100,y:500},{x:104,y:500});assert.equal(m.fishes.length,INK_CARP_TIERS[level].count);assert.equal(m.casts,1);
  for(let i=0;i<1000;i++){m.end();m.begin();m.trace({x:100,y:500},{x:104,y:500});}assert.equal(m.casts,1,'lifting cannot bypass cooldown');
  for(let i=0;i<100;i++){m.trace({x:100+i,y:500},{x:104+i,y:500});m.advance(1/60,[],()=>{});}assert.ok(m.casts>=2,'no target or new stroke is required');
  m.end();const casts=m.casts;for(let i=0;i<120;i++)m.advance(1/60,[],()=>{});assert.equal(m.casts,casts);assert.equal(m.ready,true);assert.equal(m.fishes.length,0);
 }
});
test('Lv4 flight and final wave damage every touched enemy once per phase',()=>{
 const g=game(),m=new InkCarp();m.level=4;const targets=[[250,500],[460,500],[600,500],[300,700]].map(([x,y])=>{const e=g.spawn('ink',{x,y})!;e.hp=10000;return e;});
 m.begin();m.trace({x:100,y:500},{x:130,y:500});m.end();for(let i=0;i<65;i++)m.advance(1/60,targets,(e,n)=>{e.hp-=n;});
 assert.deepEqual(targets.map(e=>10000-e.hp),[145,255,110,0]);assert.equal(m.fish,null);assert.equal(m.casts,1);
});
test('eight directions and boundary casts stay forward and inside the arena',()=>{
 for(let i=0;i<8;i++){const a=i*Math.PI/4,dx=Math.cos(a),dy=Math.sin(a),m=new InkCarp();m.level=4;m.begin();m.trace({x:360-dx*25,y:600-dy*25},{x:360,y:600});m.end();for(let n=0;n<35;n++)m.advance(1/60,[],()=>{});assert.ok(m.fish);assert.ok(m.fish.x>=m.bounds.left&&m.fish.x<=m.bounds.right&&m.fish.y>=m.bounds.top&&m.fish.y<=m.bounds.bottom);assert.ok((m.fish.x-360)*dx+(m.fish.y-600)*dy>=0);}
});
test('pause and editor freeze cooldown; chapter switch, restart and old modes clear active fish',()=>{
 const g=game(),u=g.hualing.upgrades;u.setLevel('spray',4);g.beginHualingStroke();g.strokeHualing({x:100,y:500},{x:104,y:500});g.endHualingStroke();step(g,.2);const age=u.carp.fish!.age,remaining=u.carp.remaining;
 g.pause();step(g,1);assert.equal(u.carp.fish!.age,age);assert.equal(u.carp.remaining,remaining);g.pause();u.panel='custom';step(g,1);assert.equal(u.carp.remaining,remaining);u.panel=null;
 g.changeHualingChapter('sea');assert.equal(u.carp.fish,null);assert.equal(u.carp.remaining,0);g.menu();g.start(false,true,false,true);assert.equal(u.carp.fish,null);assert.equal(u.carp.level,0);
});
test('tier silhouettes grow from small single fish to twin fish, school and giant wave carp',()=>{
 for(let level=1;level<=4;level++){const m=new InkCarp();m.level=level;m.begin();m.trace({x:100,y:500},{x:104,y:500});assert.equal(m.fish!.scale,INK_CARP_TIERS[level].scale);assert.equal(m.fish!.waveRadius>0,level===4);if(level===2)assert.notEqual(m.fishes[0].dy,m.fishes[1].dy);if(level===3)assert.ok(m.fishes.slice(1).every(f=>f.scale<m.fish!.scale));}
});
console.log(`PASS ${suites} ink carp suites`);
