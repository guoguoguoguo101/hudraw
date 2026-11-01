import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const stage=process.env.LINGHU_FLOWER_PHASE??'after',folder=`screenshots/flower-rhythm/${stage}`;await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],frames=[];
page.on('pageerror',e=>errors.push(e.message));await page.routeWebSocket('**',socket=>socket.close());
if(process.env.LINGHU_FLOWER_WEBGL1==='1')await page.addInitScript(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:getContext.call(this,type,...args);};});
if(process.env.LINGHU_FLOWER_BASELINE==='1')await page.route('**/src/rendering/petal-brush.ts*',async route=>route.fulfill({contentType:'text/javascript',body:await readFile('output/skill-restyle/flower/baseline.js','utf8')}));
const moments=[.12,.65,.9,1.02,1.13,1.17,1.27,1.48,1.8,2.02];let poolCheck;
async function setup(){await page.evaluate(()=>{
 const a=window.__LINGHU__,g=a.game;a.app.ticker.stop();a.beginMountain(0);a.mountainUI.opened=false;g.hualing.frozen=true;g.director.disabled=true;g.hualing.journey.autoEvents=false;g.enemies=[];g.hualing.sceneSeal.phase='spent';
 for(const [i,x]of [340,458,470].entries()){const e=g.spawn('ink',{x,y:620},'paper-lantern');e.hp=e.maxHp=1000;e.speed=0;e.ai='Approach';}
 a.view.update(g,a.input,0,60,0);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);for(const rig of a.view.enemyRigs.values())rig.root.visible=false;
 const m=g.hualing.petals;m.reset();m.activate();m.begin();m.trace({x:200,y:620},{x:340,y:620});window.__FLOWER_VISUAL_QA__={hits:[],step:0};a.app.render();
 });}
async function advance(to){return page.evaluate(to=>{
 const a=window.__LINGHU__,g=a.game,m=g.hualing.petals,q=window.__FLOWER_VISUAL_QA__,target=Math.round(to*120);
 while(q.step<target){q.step++;m.advance(1/120,g.enemies,(e,amount)=>{q.hits.push({id:e.id,amount,clock:m.clock});g.damage(e,amount,0,{id:-2,rune:'ink'});},g.hualing.bounds);}
 const before=JSON.stringify([m.remaining,m.clock,m.buds,m.blooms,m.leaves]);a.view.petals.update(m,true,false,g.enemies);const stable=before===JSON.stringify([m.remaining,m.clock,m.buds,m.blooms,m.leaves]);a.app.render();
 const glows=a.view.petals.glows?.root.children??[];
 return{time:to,clock:+m.clock.toFixed(6),buds:m.buds.length,blooms:m.blooms.map(b=>({age:+b.age.toFixed(6),fired:b.fired})),hp:g.enemies.map(e=>e.hp),hits:q.hits.map(h=>({amount:h.amount,clock:+h.clock.toFixed(6)})),stable,glowCount:glows.filter(s=>s.visible).length,glowAlpha:glows.filter(s=>s.visible).reduce((sum,s)=>sum+s.alpha,0),gl:a.app.renderer.gl.getError()};
 },to);}
async function crop(){const rect=await page.evaluate(async()=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return{x:r.left+v.x+195*v.scale,y:r.top+v.y+490*v.scale,width:290*v.scale,height:285*v.scale};});return page.screenshot({clip:rect});}
try{
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184'}/?mode=mountains&qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__?.mountainUI?.mapReady);
 // Forced WebGL1 uses the same texture-style compatibility adapter as the device build.
 if(process.env.LINGHU_FLOWER_WEBGL1==='1')await page.evaluate(async()=>{const{installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();while(window.__LINGHU__.app.renderer.gl.getError()){};});
 await setup();
 const states=[];for(const t of moments){const state=await advance(t);assert.equal(state.gl,0);assert.equal(state.stable,true,'rendering cannot advance or mutate gameplay');assert.ok(state.glowCount<=12);states.push(state);await writeFile(`${folder}/${t.toFixed(2)}.png`,await crop());}
 assert.equal(states[0].buds,1);assert.equal(states[2].buds,1);assert.equal(states[3].buds,0);assert.equal(states[3].blooms.length,1);assert.deepEqual(states[4].hp,[1000,1000,1000]);assert.deepEqual(states[5].hp,[952,952,1000]);assert.deepEqual(states[8].hp,[952,952,1000]);assert.equal(states.at(-1).blooms.length,0);
 const gameplay=states.map(({glowCount,glowAlpha,...state})=>state);
 if(stage==='before')await writeFile('screenshots/flower-rhythm/gameplay-before.json',JSON.stringify(gameplay,null,2));else assert.deepEqual(gameplay,JSON.parse(await readFile('screenshots/flower-rhythm/gameplay-before.json','utf8')),'bud fuse, bloom windup, 48 damage, range, count and expiry must exactly match the original');
 await setup();for(let i=0;i<64;i++){const state=await advance(i/30);assert.equal(state.gl,0);const png=await crop();frames.push(await sharp(png).resize(360,354).ensureAlpha().raw().toBuffer());}
 await sharp(Buffer.concat(frames),{raw:{width:360,height:354*frames.length,channels:4,pageHeight:354}}).gif({delay:Array(frames.length).fill(33),loop:0,colours:128,effort:3}).toFile(`${folder}/flower-motion.gif`);
 const cells=await Promise.all(moments.slice(0,9).map(async(t,i)=>({input:await sharp(`${folder}/${t.toFixed(2)}.png`).resize(240,236).png().toBuffer(),left:i%3*240,top:Math.floor(i/3)*236})));
 await sharp({create:{width:720,height:708,channels:4,background:'#e8dfc9'}}).composite(cells).png().toFile(`${folder}/contact-sheet.png`);
 if(stage.startsWith('after')){
  for(const [width,height]of [[375,667],[430,932]]){await page.setViewportSize({width,height});await setup();const state=await advance(1.17);assert.equal(state.gl,0);await page.screenshot({path:`${folder}/bloom-${width}.png`});}
  await page.evaluate(()=>{const a=window.__LINGHU__,m=a.game.hualing.petals;m.buds=Array.from({length:6},(_,i)=>({id:100+i,x:120+i%3*180,y:430+Math.floor(i/3)*210,age:.95,angle:0,from:{x:0,y:0}}));m.blooms=[];a.view.petals.update(m,true);});
  poolCheck=await page.evaluate(()=>{const a=window.__LINGHU__,r=a.view.petals,m=a.game.hualing.petals,count=n=>1+(n.children??[]).reduce((sum,c)=>sum+count(c),0);r.update(m,true);const budsBefore=count(r.root);for(let n=0;n<80;n++)r.update(m,true);const budsAfter=count(r.root);m.blooms=m.buds.map(b=>({...b,age:.16,fired:true}));m.buds=[];r.update(m,true);const bloomsBefore=count(r.root),peakGlows=r.glows.root.children.filter(s=>s.visible).length;for(let n=0;n<80;n++)r.update(m,true);const bloomsAfter=count(r.root);a.app.render();const gl=a.app.renderer.gl.getError();r.update(m,false);return{budsBefore,budsAfter,bloomsBefore,bloomsAfter,peakGlows,visible:r.root.visible,active:r.glows.root.children.filter(s=>s.visible).length,gl};});assert.equal(poolCheck.budsBefore,poolCheck.budsAfter);assert.equal(poolCheck.bloomsBefore,poolCheck.bloomsAfter);assert.equal(poolCheck.peakGlows,12);assert.equal(poolCheck.visible,false);assert.equal(poolCheck.active,0);assert.equal(poolCheck.gl,0);
 }
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({stage,states,poolCheck,errors},null,2));console.log(`PASS flower visual rhythm ${stage}: unchanged 1s bud fuse/.16s windup/48 damage/range/count/.95s expiry, no model mutation, fixed pools and zero GL errors`);
}finally{await browser.close();}
