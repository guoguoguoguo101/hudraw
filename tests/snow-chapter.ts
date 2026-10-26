import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {sceneColor} from '../src/rendering/chapter-art/vector-art';

const g=new Game();g.start(false,true,false,false,true);g.changeHualingChapter('snow');
g.hualing.frozen=true;g.director.disabled=true;
const h=g.hualing;
const step=(seconds:number)=>{for(let t=0;t<seconds-1e-8;t+=1/60)g.advance(Math.min(1/60,seconds-t));};
for(const [stage,name,damage] of [['sunset','眠山符',120],['wind','裂霜符',160],['night','灵息符',210]] as const){
 h.previewLandscape(stage);const s=h.sceneSeal,c=s.center(h.bounds);assert.equal(s.info.reward,name);
 if(s.mode==='fire'){
  for(const [i,p] of s.flames.entries()){
   h.traceScene({x:c.x+p.x-12,y:c.y+p.y},{x:c.x+p.x+12,y:c.y+p.y});
   assert.equal(s.captured.size,i+1);assert.equal(s.phase,i===4?'collecting':'repairing');
  }
 }else for(const path of s.paths)for(let i=1;i<path.length;i++)h.traceScene({x:c.x+path[i-1].x,y:c.y+path[i-1].y},{x:c.x+path[i].x,y:c.y+path[i].y});
 assert.equal(s.progress,1);step(1);assert.equal(s.phase,'stored');
 // A stored card survives switching to another scene and back.
 h.previewLandscape(stage==='night'?'sunset':'night');h.previewLandscape(stage);assert.equal(h.sceneSeal,s);assert.equal(s.phase,'stored');
 g.enemies=[];const e=g.spawn('oni',{x:360,y:600})!;e.hp=e.maxHp=1000;e.speed=0;
 const slot=s.slot(h.bounds);assert.ok(s.handle({kind:'down',id:77,...slot},h.bounds));assert.ok(s.handle({kind:'up',id:77,x:360,y:600},h.bounds));
 step(.25);assert.equal(e.hp,1000-damage);step(.5);assert.equal(e.hp,1000-damage);assert.equal(s.phase,'spent');
}
assert.ok(h.scenes.some(s=>s.mode==='fire'&&s.progress===1),'awakening remains after spending the reward');
h.upgrades.setLevel('trail',4);h.petals.activate();h.thunder.activate();g.strokeHualing({x:100,y:700},{x:400,y:700});
assert.ok(h.upgrades.trail.segments.some(s=>s.style==='maple-thunder'));
g.changeHualingChapter('sea');assert.ok(h.scenes.every(s=>s.progress===0));assert.equal(h.upgrades.trail.segments.length,0);assert.equal(h.petals.active,false);assert.equal(h.thunder.active,false);
g.changeHualingChapter('snow');g.start(false,true,false,false,true);assert.equal(h.journey.chapter,'snow');assert.equal(h.journey.time,0);
assert.equal(sceneColor('snow',0,0xffffff),0xffffff);assert.notEqual(sceneColor('snow',1,0xffffff),sceneColor('snow',2,0xffffff));
console.log('PASS snow chapter: three real rewards and damage, five local spirits, cross-scene inventory, persistent awakening, buff ink compatibility, reset and distinct palettes');
