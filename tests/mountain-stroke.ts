import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {brushBodyRadius} from '../src/gameplay/brush-contact';

function run(){const g=new Game();g.startMountainLevel(0);g.ink.setAmount(50);g.invulnerable=1e6;return g;}
const a={x:80,y:520},b={x:650,y:520};
for(const [kills,reward] of [[2,0],[3,3],[5,6],[8,10],[9,10]]){
 const g=run();for(let i=0;i<kills;i++)g.spawn('ink',{x:125+i*58,y:520},'paper-rabbit');
 g.beginHualingStroke(a);g.strokeHualing(a,b);assert.equal(g.campaign.brush.kills,kills);assert.equal(g.enemies.length,0,'basic paper monsters fall to one deliberate pass');
 g.endHualingStroke();assert.equal(g.ink.currentInk,50+reward);assert.equal(g.campaign.brush.result?.ink,reward);g.endHualingStroke();assert.equal(g.ink.currentInk,50+reward,'a stroke settles at most once');
}
const stop=run();for(let i=0;i<3;i++)stop.spawn('ink',{x:150+i*80,y:520});stop.beginHualingStroke(a);stop.strokeHualing(a,b);assert.ok(stop.hitStopRemaining>0);const before=stop.time;stop.advance(.02);assert.equal(stop.time,before,'a sweep tier briefly holds campaign simulation');stop.advance(.08);assert.ok(stop.time>before,'the hold releases without trapping simulation');stop.endHualingStroke();
const cancelled=run();for(let i=0;i<5;i++)cancelled.spawn('ink',{x:140+i*70,y:520});cancelled.beginHualingStroke(a);cancelled.strokeHualing(a,b);cancelled.endHualingStroke(true);assert.equal(cancelled.ink.currentInk,50,'pause/menu cancellation cannot manufacture a reward');
const full=run();full.ink.setAmount(99);for(let i=0;i<5;i++)full.spawn('ink',{x:140+i*70,y:520});full.beginHualingStroke(a);full.strokeHualing(a,b);full.endHualingStroke();assert.equal(full.ink.currentInk,100);assert.equal(full.campaign.brush.result?.ink,1);
const secondary=run();secondary.beginHualingStroke(a);for(let i=0;i<6;i++)secondary.damage(secondary.spawn('ink',{x:170+i*55,y:520})!,100,0,{id:-2,rune:'ink'});secondary.endHualingStroke();assert.equal(secondary.campaign.brush.kills,0);assert.equal(secondary.ink.currentInk,50,'companions and effects never claim primary-stroke rewards');
const armor=run(),plate=armor.spawn('ink',{x:350,y:520})!;armor.campaign.brush.configure(plate,'armor');
armor.beginHualingStroke(a);armor.strokeHualing(a,b);assert.equal(plate.hp,30);assert.equal(plate.mountain!.broken,true);
for(let i=0;i<30;i++)armor.advance(1/60);armor.strokeHualing({x:plate.x-80,y:plate.y},{x:plate.x+80,y:plate.y});assert.equal(plate.hp,30,'rubbing back over broken armor in the same stroke cannot hit again');
armor.endHualingStroke();armor.beginHualingStroke();armor.strokeHualing({x:plate.x-80,y:plate.y},{x:plate.x+80,y:plate.y});armor.endHualingStroke();assert.ok(!armor.enemies.includes(plate),'the next deliberate stroke finishes armor');
const shield=run(),guard=shield.spawn('ink',{x:360,y:450})!;shield.campaign.brush.configure(guard,'shield');shield.beginHualingStroke();shield.strokeHualing({x:360,y:350},{x:360,y:550});assert.equal(guard.hp,26);assert.equal(guard.mountain!.broken,false);assert.equal(shield.campaign.brush.notices[0].kind,'blocked');
shield.strokeHualing({x:260,y:450},{x:460,y:450});assert.ok(!shield.enemies.includes(guard),'a sideways cut breaks the shield');shield.endHualingStroke();
const eye=run(),core=eye.spawn('ink',{x:300,y:520})!,near=eye.spawn('ink',{x:420,y:520})!,far=eye.spawn('ink',{x:660,y:520})!;eye.campaign.brush.configure(core,'eye');
eye.beginHualingStroke();eye.strokeHualing({x:250,y:520},{x:340,y:520});eye.endHualingStroke();assert.ok(near.mountain!.staggerUntil>eye.campaign.age);assert.equal(far.mountain!.staggerUntil,0);assert.ok(eye.campaign.steer(eye,near,1/60));assert.ok(eye.campaign.brush.notices.some(n=>n.kind==='eye'));
const size=run(),small=size.spawn('ink',{x:300,y:500},'paper-rabbit')!;assert.equal(small.mountain!.scale,.8);assert.equal(brushBodyRadius(small),23*.8);const elite=size.summonHualingElite('umbrella')!;const hp=elite.hp;size.campaign.brush.configure(elite);assert.equal(elite.hp,hp);assert.equal(elite.mountain,undefined,'elite footprint and health remain separate');
size.ink.begin(1);size.beginHualingStroke();size.campaign.dropInk(size,300,520);size.strokeHualing(a,b);assert.equal(size.campaign.brush.flows.length,1);assert.deepEqual(size.campaign.brush.flows[0].to,b);assert.ok(size.campaign.brush.inkBoostUntil>size.campaign.age);size.endHualingStroke();
const outside=new Game();outside.start(false,true,false,false,true);const normal=outside.spawn('ink',{x:300,y:520})!;assert.equal(normal.mountain,undefined,'other modes retain their monster stats');
console.log('PASS deliberate campaign strokes: one-pass paper kills, 3/5/8 highest-tier rewards, single settlement/cancel/cap, secondary exclusion, two-stroke armor, lateral shield cuts, array-eye stagger, smaller matched footprints, ink-to-tip flows and practice isolation');
