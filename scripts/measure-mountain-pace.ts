import {Game} from '../src/gameplay/game';
import {MOUNTAIN_BALANCE as balance} from '../src/gameplay/mountain-run';
const newer={picks:balance.picks,xp:[...balance.xpCosts],goals:[...balance.roomGoals]};
for(const version of ['before','after']){
 balance.picks=version==='before'?5:newer.picks;balance.xpCosts=version==='before'?[8,18,28,40,54]:newer.xp;balance.roomGoals=version==='before'?[24,36,0,48]:newer.goals;
 for(const id of [0,6,7]){
  const g=new Game();g.startMountainLevel(id);g.invulnerable=1e6;let next=0,firstMax:number|null=null;const elites=new Map<number,number>();
  for(let i=0;i<36000&&g.state!=='win';i++){
   const c=g.campaign,u=g.hualing.upgrades;
   if(u.panel==='upgrade'){const k=u.choices.find(k=>u.levels[k]>0)??u.choices.find(k=>k==='trail')??u.choices[0];u.choose(k);if(firstMax===null&&Object.values(u.levels).includes(4))firstMax=c.age;continue;}
   if(c.supportPanel){c.chooseSupport(g,c.supportChoices.find(k=>k==='heal')??c.supportChoices[0]);continue;}
   g.advance(1/60);for(const e of g.enemies)if(e.elite&&!elites.has(e.id))elites.set(e.id,c.age);
   if(c.age>=next){const e=g.enemies.find(e=>!e.elite&&!e.chapterBoss);if(e){g.damage(e,1e6);next=c.age+.55;}}
   for(const e of [...g.enemies])if(e.elite&&c.age-(elites.get(e.id)??c.age)>=6)g.damage(e,1e6);
  }
  console.log(JSON.stringify({version,level:id+1,seconds:Math.round(g.campaign.age),kills:g.kills,picks:g.hualing.upgrades.picks,firstLv4:Math.round(firstMax??0),secondsAfterLv4:Math.round(g.campaign.age-(firstMax??g.campaign.age)),state:g.state}));
 }
}
