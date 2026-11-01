import assert from 'node:assert/strict';
import {PetalBrush,FLOWER_BRUSH as F} from '../src/gameplay/petal-brush';
import {Game} from '../src/gameplay/game';
import {EnemyAI} from '../src/gameplay/ai';
const setup=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];return g;};
const enemy=(g:Game,x:number,y=550)=>{const e=g.spawn('ink',{x,y},'paper-lantern')!;e.hp=e.maxHp=10000;e.ai='Approach';e.speed=0;return e;};
const advance=(m:PetalBrush,t:number,es:ReturnType<typeof enemy>[]=[])=>{for(let n=0;n<t-1e-8;n+=1/60)m.advance(Math.min(1/60,t-n),es,(e,n)=>e.hp-=n);};
const step=(g:Game,t:number)=>{for(let n=0;n<t-1e-8;n+=1/60)g.advance(Math.min(1/60,t-n));};
{
 const a=new PetalBrush(),b=new PetalBrush();a.activate();b.activate();a.trace({x:50,y:550},{x:650,y:550});
 for(let x=50;x<650;x+=5)b.trace({x,y:550},{x:x+5,y:550});
 assert.deepEqual(a.buds.map(p=>p.x),b.buds.map(p=>p.x),'plant spacing independent of input sampling');
 assert.ok(a.leaves.length>a.buds.length,'falling maple leaves coexist with the sparse rooted buds');const leafY=a.leaves[0].y;
 const positions=a.buds.map(p=>({x:p.x,y:p.y}));advance(a,.8);assert.deepEqual(a.buds.map(p=>({x:p.x,y:p.y})),positions,'buds are rooted');
 assert.ok(a.leaves[0].y>leafY,'maple leaves drift down while flower buds remain fixed');
 advance(a,.22);assert.equal(a.buds.length,0);assert.equal(a.blooms.length,positions.length,'buds open on time even without enemies');advance(a,1.1);assert.equal(a.blooms.length,0,'empty explosions finish normally');
}
{
 const g=setup(),e=enemy(g,250),near=enemy(g,330),far=enemy(g,600),m=new PetalBrush();m.activate();m.trace({x:250-F.spacing,y:550},{x:250,y:550});
 advance(m,.8,[e,near,far]);assert.equal(m.blooms.length,0);advance(m,.22,[e,near,far]);assert.equal(m.blooms.length,1);assert.equal(e.hp,10000,'opening windup precedes damage');
 advance(m,.18,[e,near,far]);assert.equal(e.hp,10000-F.damage);assert.equal(near.hp,10000-F.damage);assert.equal(far.hp,10000);assert.ok(m.isSlowed(e.id));assert.ok(m.isSlowed(near.id));
 advance(m,.7,[e,near,far]);assert.equal(e.hp,10000-F.damage,'each bloom damages once');advance(m,.7,[e,near,far]);assert.equal(m.isSlowed(e.id),false);
 m.reset();assert.equal(m.blooms.length,0);assert.equal(m.clock,0);assert.equal(m.remaining,0);
}
{
 const g=setup(),m=g.hualing.petals;g.collected.grant('flower');assert.ok(g.collected.use(g,'flower',{x:360,y:600}));assert.equal(g.collected.total,0);assert.equal(m.remaining,12);
 g.beginHualingStroke({x:100,y:550});g.strokeHualing({x:100,y:550},{x:100+F.spacing,y:550});g.endHualingStroke();const e=enemy(g,100+F.spacing);step(g,F.budLife+.4);
 assert.equal(e.hp,10000-F.damage,'buds trigger after pen release');assert.ok(g.drain().some(e=>e.type==='strike'&&e.secondary));
 const snapshot=JSON.stringify([m.remaining,m.clock,m.buds,m.blooms]);g.pause();step(g,1);assert.equal(JSON.stringify([m.remaining,m.clock,m.buds,m.blooms]),snapshot);g.pause();
 g.hualing.upgrades.panel='custom';step(g,1);assert.equal(JSON.stringify([m.remaining,m.clock,m.buds,m.blooms]),snapshot);g.hualing.upgrades.panel=null;
 g.hualing.select('dragon');const count=m.buds.length;g.strokeHualing({x:100,y:500},{x:600,y:500});assert.equal(m.buds.length,count);g.hualing.cancel();
 m.remaining=.02;m.begin();m.trace({x:450,y:700},{x:450+F.spacing,y:700});step(g,.1);assert.equal(m.active,false);assert.ok(m.buds.length>0,'existing buds survive enchantment expiry');
 m.trace({x:100,y:500},{x:600,y:500});g.menu();assert.equal(m.buds.length,0);assert.equal(m.isSlowed(e.id),false);
}
{
 const g=setup(),e=enemy(g,200,400),m=g.hualing.petals;m.activate();m.trace({x:200-F.spacing,y:400},{x:200,y:400});advance(m,F.budLife+.4,[e]);assert.ok(m.isSlowed(e.id));
 e.speed=80;EnemyAI.update(g,e,.05);const slowed=Math.hypot(e.x-200,e.y-400);e.x=200;e.y=400;e.age=e.stateAge=0;e.ai='Approach';m.reset();EnemyAI.update(g,e,.05);const normal=Math.hypot(e.x-200,e.y-400);assert.ok(Math.abs(slowed/normal-F.moveScale)<.001,'slow changes movement, not AI clocks');
}
{
 const g=new Game();g.startMountainLevel(0);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];g.campaign.spawn=999;
 for(const x of [250,280,300]){const e=g.spawn('ink',{x,y:550})!;g.campaign.brush.configure(e,'paper');e.hp=1;e.ai='Approach';}
 const m=g.hualing.petals;m.activate();m.trace({x:250-F.spacing,y:550},{x:250,y:550});step(g,F.budLife+.4);assert.equal(g.kills,3);assert.equal(g.campaign.xp,3);assert.equal(g.campaign.brush.kills,0,'flower kills do not inflate direct stroke rewards');
}
{
 const g=setup(),boss=enemy(g,250),m=new PetalBrush();boss.kind='boss';m.activate();m.trace({x:250-F.spacing,y:550},{x:250,y:550});advance(m,F.budLife+.4,[boss]);assert.equal(boss.hp,10000-F.damage);assert.equal(m.isSlowed(boss.id),false,'bosses take damage but resist slow');
 for(let n=0;n<300;n++){m.trace({x:50,y:500+n%8*50},{x:650,y:500+n%8*50});}assert.ok(m.buds.length<=F.maxBuds);assert.ok(m.blooms.length<=F.maxBlooms);
 const count=m.buds.length;m.trace({x:NaN,y:0},{x:100,y:100});m.advance(NaN);m.advance(-1);assert.equal(m.buds.length,count);assert.ok(Number.isFinite(m.clock));
}
{
 const g=setup(),e=enemy(g,600),m=new PetalBrush();m.activate();m.trace({x:250-F.spacing,y:550},{x:250,y:550});
 advance(m,F.budLife+F.bloomDelay+.1,[e]);assert.equal(e.hp,10000,'an empty explosion does not find distant targets');
 e.x=250;advance(m,.4,[e]);assert.equal(e.hp,10000,'walking into a spent explosion cannot cause a delayed hit');
}
{
 const m=new PetalBrush();m.activate();for(const y of [400,550,700])m.trace({x:50,y},{x:650,y});
 assert.equal(m.buds.length,F.maxBuds);advance(m,F.budLife+.02);assert.equal(m.buds.length,0);assert.equal(m.blooms.length,F.maxBuds,'a full field detonates on time without queueing');
}
{
 const targets=new Proxy([] as ReturnType<typeof enemy>[],{get(target,key,receiver){if(key==='filter'||key===Symbol.iterator)throw new Error('empty flower state must not inspect monsters');return Reflect.get(target,key,receiver);}});
 const m=new PetalBrush();m.advance(.05,targets);assert.equal(m.clock,.05);
 m.activate();m.trace({x:100,y:550},{x:130,y:550});assert.equal(m.buds.length,0);assert.ok(m.leaves.length>0);
 const y=m.leaves[0].y;m.advance(.05,targets);assert.ok(m.leaves[0].y>y,'cosmetic leaves keep falling without building a target list');assert.ok(m.remaining<12,'the enchantment still expires on schedule');
}
console.log('PASS flower brush: spaced rooted buds, no idle planting, fixed fuse/empty detonation/windup, single AoE, timed movement slow, shared kills/XP, pause/upgrade/reset/expiry, boss resistance, bounded geometry and no idle target scans');
