import assert from 'node:assert/strict';
import {BrushLine} from '../src/gameplay/brush-line';
import {BrushUpgrades} from '../src/gameplay/brush-upgrades';
import {Game} from '../src/gameplay/game';
const bounds={left:26,right:694,top:280,bottom:962};
const strokes=[[{x:100,y:750},{x:380,y:390}],[{x:340,y:390},{x:620,y:750}],[{x:100,y:680},{x:620,y:680}]];
function draw(m:BrushLine,p=strokes[0],cancel=false){m.begin();m.trace(p[0],p[1]);m.end(bounds,cancel);}
const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.hualing.frozen=true;
const template=g.spawn('oni',{x:360,y:570})!;
const enemy=(x:number,y:number)=>({...template,x,y,hp:2000});
const damage=(e:ReturnType<typeof enemy>,n:number)=>e.hp-=n;
{
 const m=new BrushLine();m.level=1;draw(m,undefined,true);assert.equal(m.effects.length,0);
 m.begin();m.trace({x:100,y:600},{x:250,y:604});m.trace({x:250,y:604},{x:400,y:600});assert.equal(m.effects.length,0);m.end(bounds);assert.equal(m.effects.length,1);
 const e=enemy(250,600);m.advance(.1,[e],damage);assert.equal(e.hp,1930);m.advance(.1,[e],damage);assert.equal(e.hp,1930);
 m.reset();m.level=1;m.begin();m.trace({x:100,y:500},{x:300,y:700});m.trace({x:300,y:700},{x:500,y:500});m.end(bounds);assert.equal(m.effects.length,0);
 m.begin();m.trace({x:100,y:500},{x:200,y:500});m.trace({x:400,y:500},{x:500,y:500});m.end(bounds);assert.equal(m.effects.length,0);
}
{
 const m=new BrushLine();m.level=2;draw(m);draw(m,strokes[1]);assert.equal(m.effects.filter(e=>e.kind==='cross').length,1);assert.equal(m.traces.length,2);m.advance(5.1,[],()=>{});assert.equal(m.traces.length,0);
}
for(const level of [3,4]){
 const m=new BrushLine();m.level=level;for(const s of strokes)draw(m,s);const seal=m.effects.find(e=>e.kind==='seal')!;assert.ok(seal);assert.equal(m.traces.length,0);
 const inside=enemy(360,570),outside=enemy(600,430);m.advance(.71,[inside,outside],damage);const before=inside.hp;m.advance(.02,[inside,outside],damage);assert.equal(before-inside.hp,245);assert.equal(outside.hp,2000);assert.equal(m.takeRefund(),8);m.advance(.1,[inside],damage);assert.equal(m.takeRefund(),0);
 draw(m,[{x:60,y:580},{x:650,y:580}]);assert.equal(m.effects.filter(e=>e.kind==='borrow').length,level===4?1:0);
 if(level===4){assert.equal(m.effects.find(e=>e.kind==='borrow')!.segments.length,3);draw(m,[{x:60,y:590},{x:650,y:590}]);assert.equal(m.effects.filter(e=>e.kind==='borrow').length,1);}
}
{
 const u=g.hualing.upgrades;u.setLevel('line',4);g.enemies=[];for(const s of strokes){g.beginHualingStroke(s[0]);g.strokeHualing(s[0],s[1]);g.endHualingStroke();}assert.ok(u.line.effects.some(e=>e.kind==='seal'));
 const clock=u.line.clock;u.panel='custom';g.advance(.1);assert.equal(u.line.clock,clock);u.panel=null;
 const saved=u.snapshot();delete (saved.levels as Partial<typeof saved.levels>).line;new BrushUpgrades().restore(saved);const old=new BrushUpgrades();old.restore(saved);assert.equal(old.levels.line,0);
 g.changeHualingChapter('sea');assert.equal(u.line.effects.length,0);
 g.startMountainLevel(0);u.setLevel('line',1);const y=g.hualing.bounds.top+200;g.beginHualingStroke({x:100,y});g.strokeHualing({x:100,y},{x:500,y});g.endHualingStroke();assert.ok(u.line.effects.some(e=>e.kind==='slash'));
}
console.log('PASS brush line: release/cancel, wobble/curve/break, expiry, triangle-only hit/refund, single-use borrowing, sandbox/campaign, pause/reset/legacy snapshot');
