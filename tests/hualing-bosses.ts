import assert from 'node:assert/strict';
import {Game} from '../src/gameplay/game';
import {assaultPosition,assaultProgress,emberSource,eyeOpen,comboSolved,COMBO_SCRIPT} from '../src/gameplay/boss-battlefield';
import {partWorld} from '../src/gameplay/boss-anatomy';
import {bossPose,deformBossVertex} from '../src/rendering/boss-motion';
import type {HualingChapter} from '../src/gameplay/hualing-chapters';
import type {Point} from '../src/input/recognizer';
const game=(ch:HualingChapter)=>{const g=new Game();g.start(false,true,false,false,true);g.director.disabled=true;g.changeHualingChapter(ch);g.summonHualingBoss();return g;};
const boss=(g:Game)=>g.enemies.find(e=>e.chapterBoss)!;
const step=(g:Game,n=1/60)=>{for(let t=0;t<n-1e-8;t+=1/60)g.advance(Math.min(1/60,n-t));};
function stroke(g:Game,path:Point[],cancel=false){g.beginHualingStroke();for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/7);for(let k=0;k<n;k++)g.strokeHualing({x:a.x+(b.x-a.x)*k/n,y:a.y+(b.y-a.y)*k/n},{x:a.x+(b.x-a.x)*(k+1)/n,y:a.y+(b.y-a.y)*(k+1)/n});}g.endHualingStroke(cancel);}
function solve(g:Game){
 for(let frame=0;frame<1200;frame++){
  const e=boss(g);if(!e&&g.hualing.bosses.defeated)return;const s=e.chapterBoss!;if(s.phase==='stagger')return;assert.equal(g.hualing.bosses.failed,false);
  for(const a of [...s.field.attacks]){if(a.resolved||a.age<0||!boss(g)||boss(g).chapterBoss!.phase==='stagger')continue;const u=assaultProgress(a),p=assaultPosition(a),dx=a.to.x-a.from.x,dy=a.to.y-a.from.y,n=Math.hypot(dx,dy)||1,cut=(q:Point)=>stroke(g,[{x:q.x+dy/n*72,y:q.y-dx/n*72},{x:q.x-dy/n*72,y:q.y+dx/n*72}]);
   if((a.kind==='sun'||a.kind==='lash'||a.kind==='hoof')&&u>.44&&u<.73)cut(a.kind==='sun'?p:{x:a.from.x+dx*.72,y:a.from.y+dy*.72});
   else if(a.kind==='tide'&&u>.42&&u<.75)stroke(g,[{x:p.x-78,y:a.to.y},{x:p.x+78,y:a.to.y}]);
   else if(a.kind==='pearl'&&a.age>a.charge+.15&&eyeOpen(s.field)){const pose=bossPose(s),eye=partWorld('sea',3,e,(u,v)=>deformBossVertex('sea',u,v,pose));stroke(g,[{x:p.x-6,y:p.y},p,eye]);}
   else if(a.kind==='thread'&&u>.3&&u<.7){const q=a.to;stroke(g,a.part%2===0?[{x:q.x-70,y:q.y},{x:q.x+70,y:q.y}]:[{x:q.x,y:q.y-70},{x:q.x,y:q.y+70}]);}
   else if(a.kind==='beam'&&a.age>a.charge*.76&&u<.75)stroke(g,a.nodes);
   else if(a.kind==='frost'&&a.charge+a.duration-a.age<1.0&&s.field.shelterUntil<s.field.clock+.2){const q=emberSource(s.arena);stroke(g,Array.from({length:41},(_,i)=>({x:q.x+65*Math.cos(i/40*Math.PI*2),y:q.y+65*Math.sin(i/40*Math.PI*2)})));}
  }step(g);
 }assert.fail('combo not solved '+boss(g).chapterBoss!.chapter);
}
for(const ch of ['valley','sea','palace','snow'] as const){
 const g=game(ch),e=boss(g);const hp=e.hp;for(let i=0;i<80;i++)g.damage(e,99999);assert.equal(e.hp,hp,'rubbing the body cannot bypass the moveset');
 solve(g);const s=e.chapterBoss!;assert.equal(comboSolved(ch,s.field),true);assert.ok(e.hp<hp);if(ch==='valley'){assert.equal(s.field.serial,9);assert.equal(new Set(COMBO_SCRIPT.valley.map(a=>a.part)).size,9);assert.ok(s.field.parts.length>=6);}
 if(ch==='snow')assert.ok(s.field.shelterHits>=2,'closed fire shelter must counter actual horn attacks');
 const snap=JSON.stringify(s);g.pause();step(g,.5);assert.equal(JSON.stringify(s),snap);g.pause();g.hualing.frozen=true;step(g,.5);assert.equal(JSON.stringify(s),snap);g.hualing.frozen=false;
 g.damage(e,99999);assert.ok(e.hp>=e.maxHp*.6399,'one opening cannot skip all rounds');for(let round=0;round<2;round++){solve(g);g.damage(e,99999);}assert.equal(g.hualing.bosses.defeated,ch);assert.equal(g.enemies.some(e=>e.chapterBoss),false);
 g.summonHualingBoss();for(let i=0;i<6000&&g.hualing.bosses.active;i++)step(g);assert.equal(g.hualing.bosses.failed,true,'ignored body attacks must lose the scroll');g.summonHualingBoss();assert.equal(g.hualing.bosses.integrity,100);g.menu();assert.equal(g.hualing.bosses.active,false);
 console.log('PASS '+ch+' anatomical combo, deliberate counter geometry, mandatory mixed mechanics, three short openings, pause/freeze, failure and retry');
}
