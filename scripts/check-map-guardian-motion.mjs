import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const folder='screenshots/map-vector-motion';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],results=[];
await page.emulateMedia({reducedMotion:'no-preference'});
page.on('pageerror',e=>errors.push(e.message));
const url=process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184/?mode=mountains&qa=1';
async function chapter(i){
 await page.evaluate(i=>{const a=window.__LINGHU__;a.app.ticker.stop();a.mountainUI.chapter=i;a.mountainUI.selected=i*10;a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);a.app.render();},i);
 await page.waitForFunction(()=>window.__LINGHU__.mountainUI.mapReady);
}
async function pose(t,response=0,reduced=false){return page.evaluate(({t,response,reduced})=>{
 const a=window.__LINGHU__,m=a.mountainUI.mapLife,g=m.guardian;g.update(t,response,reduced);a.app.render();
 const snapshot=()=>Object.fromEntries([...g.parts].map(([name,n])=>[name,[n.x,n.y,n.rotation,n.scale.x,n.scale.y]]));
 const b=m.actors[0].node.children[0],sprites=[];function walk(n){if(n.constructor.name==='Sprite')sprites.push(n.label);for(const c of n.children??[])walk(c);}walk(g.root);
 return{parts:snapshot(),background:[b.x,b.y,b.rotation,b.width,b.height],blink:g.lids.map(l=>l.cover.scale.y),sprites,gl:a.app.renderer.gl.getError(),children:m.root.children.length};
 },{t,response,reduced});}
try{
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI?.mapReady);
 for(const [i,ch]of ['valley','sea','palace','snow'].entries()){
  await chapter(i);
  const liveBefore=await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.start();return [...a.mountainUI.mapLife.guardian.parts].map(([name,n])=>[name,n.rotation,n.y]);});
  await page.waitForTimeout(1100);
  const liveAfter=await page.evaluate(()=>{const a=window.__LINGHU__;const out={started:a.app.ticker.started,parts:[...a.mountainUI.mapLife.guardian.parts].map(([name,n])=>[name,n.rotation,n.y])};a.app.ticker.stop();return out;});
  assert.ok(liveAfter.started);assert.notDeepEqual(liveBefore,liveAfter.parts,`${ch}: the real page ticker must animate without manual pose calls`);
  const initial=await pose(1),next=await pose(3);
  assert.deepEqual(initial.background,next.background,'the landscape stays anchored');
  assert.notDeepEqual(initial.parts.head,next.parts.head,`${ch}: head has an independent joint`);
  const key=ch==='valley'?'antlers':ch==='sea'?'tail':ch==='palace'?'wing-upper':'tail-near';
  assert.notDeepEqual(initial.parts[key],next.parts[key],`${ch}: ${key} should move independently`);
  assert.deepEqual(initial.sprites,[],'animated creatures must be native vectors without sprite textures');
  assert.equal(next.gl,0);assert.equal(initial.children,next.children);
  const responding=await pose(3,1);assert.notDeepEqual(responding.parts,next.parts,'selection response affects the guardian');
  const frozen=await pose(2,0,true);assert.deepEqual((await pose(9,1,true)).parts,frozen.parts,'reduced motion freezes creature joints');
  const blinkTime=3.42-i*.8;const blink=await pose(blinkTime);assert.ok(blink.blink.every(n=>n>.99),'each guardian closes its eyes');
  const awake=await pose(2);assert.ok(awake.blink.every(n=>n===0));
  await page.screenshot({path:`${folder}/${ch}.png`});
  // Diagnose anatomical seams separately from weather and level-selection ripples.
  await page.evaluate(()=>{const m=window.__LINGHU__.mountainUI.mapLife;for(const a of m.actors.slice(1))a.node.visible=false;window.__LINGHU__.app.render();});
  await page.screenshot({path:`${folder}/${ch}-clear.png`});
  for(let frame=0;frame<32;frame++){
   await pose(frame*.15);await page.screenshot({path:`${folder}/${ch}-${String(frame).padStart(2,'0')}.png`});
  }
  results.push({chapter:ch,liveBefore,liveAfter,joints:Object.keys(initial.parts),initial,next,responding});
 }
 // The authoring deliverables remain editable SVG paths without bitmap embedding.
 for(const ch of ['valley','sea','palace','snow']){
  const svg=await readFile(`assets/maps/guardian-vectors-v1/${ch}.svg`,'utf8');assert.ok(svg.includes('<path'));assert.ok(!svg.includes('<image'));
  assert.ok((svg.match(/<path/g)??[]).length<30,`${ch}: keep the artwork clean instead of tracing grain into tiny shapes`);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS four native vector guardians: independent joints, anchored landscapes, selection responses, blinking, reduced motion, stable object counts and zero WebGL/page errors');
}finally{await browser.close();}
