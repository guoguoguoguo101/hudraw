import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {ThunderBrush,THUNDER_BRUSH} from '../src/gameplay/thunder-brush';

const setup=()=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;g.hualing.journey.autoEvents=false;g.enemies=[];return g;};
const enemy=(g:Game,x:number,y=600)=>{const e=g.spawn('ink',{x,y},'paper-lantern')!;e.hp=e.maxHp=10000;e.speed=0;e.ai='Approach';return e;};
const step=(g:Game,t:number,drawing=false)=>{for(let n=0;n<t-1e-8;n+=1/60)g.advance(Math.min(1/60,t-n),drawing);};
{
 const g=setup(),t=g.hualing.thunder,near=enemy(g,270),other=enemy(g,300,675),chain=enemy(g,420),far=enemy(g,680);
 g.collected.grant('thunder');assert.ok(g.collected.use(g,'thunder',{x:360,y:600}));assert.equal(g.collected.total,0);
 step(g,.2);assert.equal(near.hp,10000,'using a rune does not attack without drawing');
 g.beginHualingStroke({x:200,y:600});step(g,.02,true);
 assert.equal(near.hp,10000-THUNDER_BRUSH.damage);assert.equal(other.hp,10000-THUNDER_BRUSH.damage);assert.equal(chain.hp,10000,'hop waits for the electricity to arrive');
 assert.equal(new Set(t.links.map(a=>a.target)).size,t.links.length);step(g,.08,true);
 assert.equal(chain.hp,10000-THUNDER_BRUSH.damage*THUNDER_BRUSH.falloff);assert.equal(far.hp,10000);
 assert.ok(g.drain().filter(e=>e.type==='strike').every(e=>e.type==='strike'&&e.secondary));
 g.endHualingStroke();const hp=near.hp;step(g,.6);assert.equal(near.hp,hp);assert.equal(t.links.length,0);assert.equal(t.conducting,false);
}
{
 const g=setup(),t=g.hualing.thunder;for(const x of [270,300,350,390,430,470,500])enemy(g,x);
 t.activate();g.beginHualingStroke({x:200,y:600});step(g,.16,true);
 assert.equal(t.links.length,THUNDER_BRUSH.targets);assert.equal(new Set(t.links.map(a=>a.target)).size,THUNDER_BRUSH.targets);assert.ok(t.links.every(a=>Math.hypot(a.b.x-200,a.b.y-600)<=THUNDER_BRUSH.reach));
 const clock=t.clock,remaining=t.remaining,hp=g.enemies.map(e=>e.hp);g.pause();step(g,.5,true);assert.equal(t.clock,clock);assert.equal(t.remaining,remaining);assert.deepEqual(g.enemies.map(e=>e.hp),hp);g.pause();
 g.hualing.upgrades.panel='custom';step(g,.5,true);assert.equal(t.clock,clock);g.hualing.upgrades.panel=null;
 g.endHualingStroke(true);step(g,.5);g.menu();assert.equal(t.links.length,0);assert.equal(t.tip,null);assert.equal(t.remaining,0);
}
{
 const g=setup(),t=g.hualing.thunder,e=enemy(g,280);t.activate();g.beginHualingStroke({x:200,y:600});g.hualing.select('dragon');step(g,.2,true);assert.equal(e.hp,10000);g.hualing.cancel();
 g.ink.begin(300);g.ink.pending!.exhausted=true;step(g,.2,true);assert.equal(e.hp,10000,'a dry brush cannot keep conducting from an old tip');g.ink.cancel();
 g.endHualingStroke();step(g,12.1);g.beginHualingStroke({x:200,y:600});step(g,.5,true);assert.equal(e.hp,10000);assert.equal(t.active,false);
}
{
 const g=new Game();g.startMountainLevel(0);g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];g.campaign.spawn=999;
 for(const x of [320,350,390]){const e=g.spawn('ink',{x,y:600})!;g.campaign.brush.configure(e,'paper');e.speed=0;e.ai='Approach';e.hp=1;}
 g.collected.grant('thunder');g.collected.use(g,'thunder',{x:360,y:600});g.beginHualingStroke({x:280,y:600});step(g,.15,true);
 assert.equal(g.kills,3);assert.equal(g.campaign.xp,3);assert.equal(g.campaign.brush.kills,0,'conducted kills do not inflate direct-brush multi-kill rewards');g.endHualingStroke();
}
const hits:number[]=[];
for(const fps of [30,60,120]){
 const g=setup(),e=enemy(g,280),t=new ThunderBrush();let count=0;t.activate();t.begin({x:200,y:600});
 for(let i=0;i<fps*2;i++){for(let n=0;n<20;n++)t.trace({x:190,y:600},{x:200,y:600});t.advance(1/fps,[e],()=>count++,true,g.hualing.bounds);}
 hits.push(count);assert.ok(t.arcs.length<=120);assert.ok(t.links.length<=20);assert.ok(t.contacts.length<=16);
}
assert.deepEqual(hits,[5,5,5],'conduction cadence is independent of frame rate and pointer-event frequency');
{
 const t=new ThunderBrush();t.activate();t.begin({x:NaN,y:600});t.advance(1/60,[],undefined,true);assert.equal(t.conducting,false);t.advance(NaN);t.advance(-1);assert.ok(Number.isFinite(t.clock));
}
console.log('PASS thunder brush: collected use, nearby roots, delayed enemy-to-enemy conduction, target/range limits, release/dry/selection guards, shared damage and XP, no direct-sweep credit, pause/upgrade/expiry/reset, 30/60/120 fps and bounded geometry');
