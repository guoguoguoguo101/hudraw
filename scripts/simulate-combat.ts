// Headless complete-run audit. Uses only ordinary spells, ink and upgrade choices.
import {Game} from '../src/gameplay/game';
import {SkillTargetResolver as Target} from '../src/gameplay/target';
const g=new Game();g.start();let safety=0;
while(g.state!=='win'&&g.state!=='lose'&&safety++<60*360){
 if(g.state==='upgrade'){const desired=['brush','seal','mirror','bell','gourd','feather'];const best=[...g.choices].sort((a,b)=>desired.indexOf(a)-desired.indexOf(b))[0];g.choose(g.choices.indexOf(best));continue;}
 if(g.ink.canStart){const boss=g.enemies.find(e=>e.kind==='boss'),closest=[...g.enemies].sort((a,b)=>Target.distance(a)-Target.distance(b))[0],near=g.enemies.filter(e=>Target.distance(e)<205).length;
  if(boss&&(boss.phase===3||boss.ai==='Telegraph')){const d={x:boss.x-360,y:boss.y-665},n=Math.hypot(d.x,d.y);g.cast('triangle',{x:d.x/n,y:d.y/n});}
  else if(closest&&Target.distance(closest)<135&&near>=2){g.cast('circle');}
  else if(boss?.ai==='Telegraph'){const dx=boss.x-360,dy=boss.y-665,d=Math.hypot(dx,dy);g.cast('triangle',{x:dx/d,y:dy/d});}
  else if(closest&&Target.distance(closest)<120&&near>=2)g.cast('circle');
  else if(boss&&g.ink.currentInk>20&&Target.distance(boss)<520){const d={x:boss.x-360,y:boss.y-665},n=Math.hypot(d.x,d.y);g.cast('triangle',{x:d.x/n,y:d.y/n});}
  else if(closest&&closest.kind!=='boss'&&Target.distance(closest)<240){const d={x:closest.x-360,y:closest.y-665},n=Math.hypot(d.x,d.y);g.cast(g.modifiers.count('brush')&&near>2?'star':'line',{x:d.x/n,y:d.y/n});}
 }
 g.update(1/60);g.ink.update(1/60,g.active);g.drain();
}
console.log(JSON.stringify({state:g.state,time:+g.time.toFixed(2),hp:+g.life.toFixed(1),kills:g.kills,casts:g.casts,level:g.level,bossDead:g.bossDead,bossHp:g.enemies.find(e=>e.kind==='boss')?.hp,relics:[...g.modifiers.owned]},null,2));
if(g.state!=='win')process.exitCode=1;
