import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/mountain-stroke';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function stroke(a,b){const p=await point(a.x,a.y),q=await point(b.x,b.y);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(q.x,q.y,{steps:20});await page.mouse.up();await settle();}
async function setup(n,role='paper'){
 await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.beginMountain(0);a.mountainUI.opened=false;a.game.invulnerable=1e6;});await settle();
 return page.evaluate(({n,role})=>{const a=window.__LINGHU__,g=a.game;g.enemies=[];g.campaign.spawned=24;g.ink.setAmount(50);const y=g.hualing.bounds.top+240;
  for(let i=0;i<n;i++){const x=n===1?360:120+i*480/(n-1),e=g.spawn('ink',{x,y},i%2?'paper-rabbit':'paper-frog');g.campaign.brush.configure(e,role);e.ai='Hit';e.stateAge=-100;e.speed=0;}
  return{y,top:g.hualing.bounds.top};
 },{n,role});
}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5177/?mode=mountains&qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI?.mapReady);
 for(const [n,reward] of [[3,3],[5,6],[8,10]]){
  const {y}=await setup(n);await settle();if(n===8)await page.screenshot({path:`${folder}/smaller-eight-monsters.png`});
  await stroke({x:70,y},{x:650,y});const state=await page.evaluate(()=>{const a=window.__LINGHU__;return{...a.game.campaign.brush.result,ink:a.game.campaign.brush.result?.ink,visible:a.view.mountainStroke.root.visible,gl:a.app.renderer.gl.getError()};});
  assert.equal(state.kills,n);assert.equal(state.ink,reward);assert.equal(state.cancelled,false);assert.equal(state.visible,true);assert.equal(state.gl,0);results.push(state);await page.screenshot({path:`${folder}/sweep-${n}.png`});
 }
 const armor=await setup(1,'armor');await settle();await page.screenshot({path:`${folder}/armor-mark.png`});await stroke({x:270,y:armor.y},{x:450,y:armor.y});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies[0]?.hp),30);await page.screenshot({path:`${folder}/armor-broken.png`});await stroke({x:270,y:armor.y},{x:450,y:armor.y});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.brush.result?.kills),1);
 const guard=await setup(1,'shield');await stroke({x:360,y:guard.y-95},{x:360,y:guard.y+95});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies[0]?.hp),26);await page.screenshot({path:`${folder}/shield-block.png`});await stroke({x:270,y:guard.y},{x:450,y:guard.y});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.brush.result?.kills),1);await page.screenshot({path:`${folder}/shield-flank.png`});
 const eye=await setup(1,'eye');await page.evaluate(y=>{const g=window.__LINGHU__.game;for(const x of [470,600]){const e=g.spawn('ink',{x,y},'paper-rabbit');e.ai='Hit';e.stateAge=-100;e.speed=0;}},eye.y);await settle();await page.screenshot({path:`${folder}/array-eye.png`});await stroke({x:300,y:eye.y},{x:400,y:eye.y});assert.ok(await page.evaluate(()=>window.__LINGHU__.game.enemies.some(e=>e.mountain?.staggerUntil>window.__LINGHU__.game.campaign.age)));await page.screenshot({path:`${folder}/array-broken.png`});
 await setup(0);await page.evaluate(()=>{const g=window.__LINGHU__.game;g.campaign.dropInk(g,330,g.hualing.bounds.top+250);});const y=await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.top+250);await stroke({x:245,y},{x:410,y});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.inkSerial),1);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.campaign.brush.inkBoostUntil>window.__LINGHU__.game.campaign.age));await page.screenshot({path:`${folder}/ink-return-flow.png`});
 for(const [w,h] of [[375,667],[430,932]]){await page.setViewportSize({width:w,height:h});const {y}=await setup(5);await stroke({x:70,y},{x:650,y});await page.screenshot({path:`${folder}/sweep-five-${w}.png`});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.campaign.brush.result?.kills),5);}
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors,checks:'real pointer 3/5/8 sweep and highest-tier ink, smaller enemies, two-stroke armor, blocked frontal / successful side cut, array-eye stagger, ink flow, mobile layouts'},null,2));console.log('PASS real pointer sweep rewards, armor/shield/array interactions, ink flows, 375/390/430 layouts and zero page/WebGL errors');
}finally{await browser.close();}
