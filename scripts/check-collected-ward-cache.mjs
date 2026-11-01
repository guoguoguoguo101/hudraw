import {chromium} from '@playwright/test';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/ward-cache';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
if(process.env.LINGHU_WEBGL1==='1')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184')+'/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 if(process.env.LINGHU_WEBGL1==='1')await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();const gl=window.__LINGHU__.app.renderer.gl;while(gl.getError()){};});
 await page.evaluate(()=>{const a=window.__LINGHU__,g=a.game;a.app.ticker.stop();a.beginMountain(0);a.mountainUI.opened=false;g.hualing.frozen=true;g.enemies=[];g.collected.grant('ward');g.collected.use(g,'ward',{x:360,y:610});g.collected.casts[0].age=1.2;a.view.update(g,a.input,0,60,0);a.mountainUI.update(a.view.ui.hud.y,a.view.ui.footer.y);});
 const images=[];
 for(const cached of [false,true]){
  const state=await page.evaluate(cached=>{const a=window.__LINGHU__,r=a.view.collected,c=r.circles;c.clear();c.atlas?.clear();c.optimized=cached;r.update(a.game,false);if(cached)c.atlas.update(1000);r.update(a.game,false);a.app.render();return{wards:c.wards.size,pages:c.atlas.pageCount,gl:a.app.renderer.gl.getError()};},cached);
  assert.equal(state.wards,1);assert.equal(state.gl,0);if(cached)assert.ok(state.pages>0&&state.pages<=4);
  images.push(await page.screenshot({path:`${folder}/${cached?'cached':'original'}.png`}));
 }
 const raw=await Promise.all(images.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));let changed=0,sum=0;
 for(let i=0;i<raw[0].length;i+=4){const d=Math.max(...[0,1,2].map(j=>Math.abs(raw[0][i+j]-raw[1][i+j])));sum+=d;if(d>24)changed++;}
 const mean=sum/(raw[0].length/4),changedRatio=changed/(raw[0].length/4);assert.ok(mean<5&&changedRatio<.05,`cached ward appearance deviates: ${mean}, ${changedRatio}`);
 const cleanup=await page.evaluate(()=>{const a=window.__LINGHU__;a.game.menu();a.view.collected.update(a.game);return{wards:a.view.collected.circles.wards.size,pages:a.view.collected.circles.atlas.pageCount,gl:a.app.renderer.gl.getError()};});assert.deepEqual(cleanup,{wards:0,pages:0,gl:0});assert.deepEqual(errors,[]);
 await writeFile(`${folder}/verification.json`,JSON.stringify({mean,changedRatio,cleanup,errors},null,2));console.log('PASS collected ward atlas: same animated effect, near-identical appearance, bounded texture pages, full GPU-cache cleanup on menu and zero page/WebGL errors');
}finally{await browser.close();}
