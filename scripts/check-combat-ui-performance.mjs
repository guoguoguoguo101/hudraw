import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/combat-ui-performance';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const url=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184';
try{
 await page.goto(`${url}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI);
 await page.evaluate(async()=>{const a=window.__LINGHU__;a.beginMountain(0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));a.app.ticker.stop();a.game.enemies=[];a.game.hualing.frozen=true;a.game.hualing.upgrades.panel=null;a.game.hualing.upgrades.pending=0;a.game.campaign.supportPanel=false;a.mountainUI.opened=false;a.game.life=a.game.maxHp=100;a.game.invulnerable=0;});
 const result=await page.evaluate(()=>{
  const a=window.__LINGHU__,g=a.game,m=a.mountainUI,header=a.view.ui.hud.y,footer=a.view.ui.footer.y;
  const frame=(dt=0)=>{g.campaign.age+=dt;m.update(header,footer);};frame();
  const nodes=()=>new Set([...m.surface.children,...m.combatHeader.root.children]);let last=nodes(),created=0,destroyed=0;
  const h=m.combatHUD.health,clears={health:0,xpBase:0,xpFill:0};
  for(const [key,graphics]of [['health',h.art],['xpBase',m.combatHUD.meterBase],['xpFill',m.combatHUD.meter]]){const clear=graphics.clear;graphics.clear=function(...args){clears[key]++;return clear.apply(this,args);};}
  const headerIdentity=[...m.combatHeader.root.children];
  for(let i=0;i<120;i++){g.ink.currentInk=100-i*.5;g.campaign.roomKills=i;frame(1/60);const now=nodes();for(const node of now)if(!last.has(node))created++;for(const node of last)if(!now.has(node))destroyed++;last=now;}
  const churn={frames:120,created,destroyed,clears:{...clears},ink:m.combatHeader.ink.text,fill:m.combatHeader.fill.scale.x,room:m.combatHeader.detail.text};
  g.hurt(24);frame(.1);const damage={value:h.value.text,status:h.status.text,nearby:h.nearby.context.instructions.length>0};
  g.invulnerable=0;g.hurt(51);frame(.1);frame(1.1);g.ink.currentInk=3;frame();const critical={value:h.value.text,status:h.status.text,notice:m.combatHUD.notice.text};
  g.life=80;g.ink.currentInk=70;frame(.1);const heal={value:h.value.text,status:h.status.text};
  frame(1.2);g.campaign.xp=2;g.campaign.lastXp=2;g.campaign.lastXpAt=g.campaign.age;const baseBefore=clears.xpBase;
  for(let i=0;i<120;i++)frame(1/60);const settled=clears.xpFill;for(let i=0;i<30;i++)frame(1/60);
  const xp={value:m.combatHUD.count.text,baseRebuilds:clears.xpBase-baseBefore,settledRebuilds:clears.xpFill-settled};
  g.hualing.upgrades.panel='upgrade';g.hualing.upgrades.pending=1;frame();const upgradeHidden=!m.combatHUD.root.visible;g.hualing.upgrades.panel=null;g.hualing.upgrades.pending=0;frame();
  g.campaign.supportPanel=true;g.campaign.supportChoices=['beast','heal','thunder'];frame();const support={hidden:!m.combatHUD.root.visible,choices:m.zones.length,headerStable:headerIdentity.every((n,i)=>n===m.combatHeader.root.children[i])};g.campaign.supportPanel=false;frame();
  m.handle({kind:'down',x:651,y:header+43,id:1});frame();const paused={state:g.state,visible:m.root.visible};a.action('resume');a.app.ticker.stop();frame();
  a.app.render();return{churn,damage,critical,heal,xp,upgradeHidden,support,paused,resumed:m.root.visible,headerStable:headerIdentity.every((n,i)=>n===m.combatHeader.root.children[i]),gl:a.app.renderer.gl.getError()};
 });
 assert.equal(result.churn.created,0);assert.equal(result.churn.destroyed,0);assert.deepEqual(result.churn.clears,{health:0,xpBase:0,xpFill:0});assert.equal(result.churn.ink,'灵墨 40 / 100');assert.equal(result.churn.fill,.405);
 assert.deepEqual(result.damage,{value:'76 / 100',status:'受伤 −24',nearby:true});assert.equal(result.critical.value,'25 / 100');assert.equal(result.critical.status,'生命危险');assert.match(result.critical.notice,/墨尽/);
 assert.deepEqual(result.heal,{value:'80 / 100',status:'恢复 +55'});assert.equal(result.xp.value,'2 / 8');assert.equal(result.xp.baseRebuilds,0);assert.equal(result.xp.settledRebuilds,0);assert.equal(result.upgradeHidden,true);
 assert.deepEqual(result.support,{hidden:true,choices:3,headerStable:true});assert.deepEqual(result.paused,{state:'paused',visible:false});assert.equal(result.resumed,true);assert.equal(result.headerStable,true);assert.equal(result.gl,0);
 await page.screenshot({path:`${folder}/persistent-hud.png`});
 await page.evaluate(()=>{const a=window.__LINGHU__;a.mountainUI.open();a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();});await page.waitForFunction(()=>window.__LINGHU__.mountainUI.mapReady);
 const map=await page.evaluate(()=>{const a=window.__LINGHU__,m=a.mountainUI;m.update(a.view.ui.hud.y,a.view.ui.footer.y);const before=m.mapLife.motionEnabled;m.zones[16].run();m.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();return{headerHidden:!m.combatHeader.root.visible,healthHidden:!m.combatHUD.root.visible,zones:m.zones.length,toggled:m.mapLife.motionEnabled!==before};});
 assert.deepEqual(map,{headerHidden:true,healthHidden:true,zones:17,toggled:true});assert.deepEqual(errors,[]);
 await writeFile(`${folder}/verification.json`,JSON.stringify({result,map,errors},null,2));
 console.log('PASS persistent combat UI: 120 ink-consuming frames create/destroy zero objects, stable health/XP geometry stays cached, damage/healing/critical alerts, XP, support choices, pause/resume and map motion toggle stay correct');
}finally{await browser.close();}
