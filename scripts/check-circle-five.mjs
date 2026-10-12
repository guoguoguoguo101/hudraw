import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1180,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1');await page.waitForFunction(()=>window.__CIRCLE_PREVIEW__&&window.__LINGHU__);
async function frame(t){return page.evaluate(t=>{
 const {app,view}=window.__LINGHU__;app.ticker.stop();window.__CIRCLE_PREVIEW__.frame(5,t);app.render();const ward=[...view.circles.wards.values()][0]?.grand;
 return ward?{opened:ward.scrollRing.opened,cranes:ward.cranes.length,tail:ward.fox.tips[0].y,wing:ward.cranes[0].art.context.bounds.height,orbit:!!ward.orbit,layers:Object.fromEntries(Object.entries(ward.layers).map(([k,v])=>[k,v.alpha])),cover:view.circles.cinematicStrength,environment:view.environment.front.alpha,enemy:[...view.enemyRigs.values()][0].root.alpha}:null;
},t);}
const first=await frame(.2);assert.ok(first.layers.Core>0);assert.equal(first.layers['Scroll Ring'],0);assert.equal(first.layers['Fox Spirit'],0);
const circles=await frame(.78);assert.ok(circles.layers['Outer Circle']>0);assert.equal(circles.layers.Ofuda,0);
const papers=await frame(1.05);assert.ok(papers.layers.Ofuda>0);assert.equal(papers.layers['Scroll Ring'],0);
const mid=await frame(1.64);assert.ok(mid.opened[0]===1);assert.equal(mid.opened[6],0);assert.equal(mid.layers['Fox Spirit'],0);
const full=await frame(3.2);assert.ok(full.opened.every(n=>n===1));assert.equal(full.cranes,3);assert.equal(full.orbit,false);assert.equal(full.cover,1);assert.equal(full.environment,0);assert.ok(full.enemy>.25);
const seams=await page.evaluate(()=>{const w=[...window.__LINGHU__.view.circles.wards.values()][0].grand,ring=w.scrollRing;return ring.models.map((m,i)=>{const a=ring.project(i,m.length/2,0,3.2),b=ring.project((i+1)%7,-ring.models[(i+1)%7].length/2,0,3.2);return Math.hypot(a.x-b.x,a.y-b.y);});});assert.ok(seams.every(d=>d<1e-6));
await page.locator('#app').screenshot({path:'screenshots/circle-upgrade/lv5.png'});
const later=await frame(3.65);assert.notEqual(later.tail,full.tail);assert.notEqual(later.wing,full.wing);assert.ok(Math.abs(later.enemy-full.enemy)<1e-6);
await page.getByLabel('九尾狐灵',{exact:true}).uncheck();assert.equal(await page.evaluate(()=>[...window.__LINGHU__.view.circles.wards.values()][0].grand.spiritFace.visible),false);await page.getByLabel('九尾狐灵',{exact:true}).check();
await frame(7);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.circles.front.children.length),0);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.circles.cinematicStrength),0);assert.equal(await page.evaluate(()=>window.__LINGHU__.view.environment.front.alpha),1);assert.equal(await page.evaluate(()=>[...window.__LINGHU__.view.enemyRigs.values()][0].root.alpha),1);
assert.deepEqual(errors,[]);await browser.close();console.log('PASS six-stage ritual, continuous scroll seams, independent layers, guardian motion, full-screen cover and restoration');
