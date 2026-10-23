import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {recognize,resample,type Point} from '../src/input/recognizer';
import {mirrorSegment,segmentTouchesTriangle,length,type Triangle} from '../src/input/line-interaction-geometry';
import {triangleWindowFrame} from '../src/gameplay/triangle-window';
import {LINE_INTERACTION as C} from '../src/gameplay/line-interaction-config';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function scene(){const g=new Game();g.start(false,true,false,true);g.director.disabled=true;return g;}
function line(g:Game,a:Point,b:Point){const r=recognize(resample([a,b],30));assert.equal(r.rune,'line');assert.equal(g.cast(r),true);return g.skills.at(-1)!;}
function window(g:Game){line(g,{x:180,y:650},{x:540,y:650});line(g,{x:250,y:720},{x:360,y:390});line(g,{x:360,y:390},{x:470,y:720});return g.interactions.effects.find(e=>e.kind==='triangle')!;}
function tick(g:Game,dt:number){g.interactions.advance(dt,g.enemies,(e,n,source)=>g.damage(e,n,0,source));}
let count=0;function test(name:string,fn:()=>void){fn();count++;console.log('PASS refraction: '+name);}
test('mirror across horizontal, vertical and diagonal edges preserves finite segment length',()=>{
 const s={a:{x:20,y:30},b:{x:80,y:50}};
 assert.deepEqual(mirrorSegment(s,{a:{x:0,y:0},b:{x:100,y:0}}),{a:{x:20,y:-30},b:{x:80,y:-50}});
 assert.deepEqual(mirrorSegment(s,{a:{x:0,y:0},b:{x:0,y:100}}),{a:{x:-20,y:30},b:{x:-80,y:50}});
 const axis={a:{x:0,y:0},b:{x:100,y:100}},m=mirrorSegment(s,axis);near(m.a.x,30);near(m.a.y,20);near(length(m.a,m.b),length(s.a,s.b));
 const twice=mirrorSegment(m,axis);near(twice.b.x,s.b.x);near(twice.b.y,s.b.y);
});
test('touch detection accepts interior, edge and vertex, and rejects extension-only contact',()=>{
 const t:Triangle=[{x:0,y:0},{x:100,y:0},{x:0,y:100}];
 for(const s of [{a:{x:10,y:10},b:{x:20,y:20}},{a:{x:-20,y:0},b:{x:120,y:0}},{a:{x:-20,y:-20},b:{x:0,y:0}}])assert.equal(segmentTouchesTriangle(s,t),true);
 assert.equal(segmentTouchesTriangle({a:{x:120,y:20},b:{x:200,y:20}},t),false);
});
test('window hold equals its total lifetime; shared turning frame does not mutate the damage area',()=>{
 assert.equal(C.triangleHoldUntil,2.2);assert.equal(C.triangleDuration,2.2);
 const g=scene(),e=window(g),original=JSON.stringify(e.vertices),turned=triangleWindowFrame(e.vertices!,e.center,1.5);
 assert.notDeepEqual(turned,e.vertices);assert.equal(JSON.stringify(e.vertices),original);
});
test('hitting a live window creates three mirrors, consumes no new trace and does not recursively combine',()=>{
 const g=scene();window(g);tick(g,.5);const crosses=g.interactions.crossCount,s=line(g,{x:300,y:520},{x:420,y:520});
 assert.equal(s.interactionConsumed,true);assert.equal(g.interactions.refractions.count,1);assert.equal(g.interactions.refractions.items[0].mirrors.length,3);assert.equal(g.interactions.traces.length,0);assert.equal(g.interactions.crossCount,crosses);assert.equal(g.interactions.triangleCount,1);
 const r=g.interactions.refractions.items[0];tick(g,C.refractionHitAt+.01);assert.equal(r.settled,true);assert.equal(g.interactions.refractions.count,1);tick(g,C.refractionDuration);assert.equal(g.interactions.refractions.items.length,0);assert.equal(g.interactions.traces.length,0);
});
test('mirror axes match the visible rotating triangle at release time',()=>{
 const g=scene(),e=window(g);tick(g,1.2);line(g,{x:300,y:520},{x:420,y:520});
 const r=g.interactions.refractions.items[0];assert.deepEqual(r.triangle,triangleWindowFrame(e.vertices!,e.center,1.2));
});
test('each reflected slash damages at most once and uses normal damage/death handling',()=>{
 const g=scene();window(g);line(g,{x:300,y:520},{x:420,y:520});g.skills=[];
 const r=g.interactions.refractions.items[0],m=r.mirrors[0],p={x:(m.a.x+m.b.x)/2,y:(m.a.y+m.b.y)/2},e=g.spawn('oni',p)!;
 tick(g,.11);const hp=e.hp;assert.ok(hp<240);assert.ok(hp>=240-3*r.damage);tick(g,.1);near(e.hp,hp);
});
test('window remains refractable after its final area hit, but not after its 2.2-second expiry',()=>{
 const g=scene();window(g);tick(g,2.0);line(g,{x:300,y:520},{x:420,y:520});assert.equal(g.interactions.refractions.count,1);
 tick(g,.21);line(g,{x:300,y:520},{x:420,y:520});assert.equal(g.interactions.refractions.count,1);assert.equal(g.interactions.traces.length,1);
});
test('prototype toggle, misses, pause and clear preserve original scene behavior',()=>{
 const g=scene();window(g);g.interactions.refractionEnabled=false;line(g,{x:300,y:520},{x:420,y:520});assert.equal(g.interactions.refractions.count,0);assert.equal(g.interactions.traces.length,1);
 g.interactions.refractionEnabled=true;line(g,{x:580,y:850},{x:660,y:850});assert.equal(g.interactions.refractions.count,0);
 line(g,{x:300,y:520},{x:420,y:520});assert.equal(g.interactions.refractions.count,1);g.pause();g.advance(10);assert.equal(g.interactions.now,0);g.menu();assert.equal(g.interactions.refractions.items.length,0);
});
console.log(`PASS ${count} refraction suites`);
