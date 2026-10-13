import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/ink';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5173/?qa=1&scene=none');await page.waitForFunction(()=>window.__LINGHU__&&document.querySelector('canvas').dataset.qaReady==='none');
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.director.disabled=true;a.game.enemies=[];a.game.ink.setAmount(60);});
 const map=async(x,y)=>page.evaluate(({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect();return {x:r.x+a.app.stage.x+x*a.app.stage.scale.x,y:r.y+a.app.stage.y+y*a.app.stage.scale.y};},{x,y});
 const mouse=async(x,y)=>{const p=await map(x,y);await page.mouse.move(p.x,p.y);};
 const render=async(dt=0)=>page.evaluate(dt=>{const a=window.__LINGHU__;a.view.update(a.game,a.input,0,60,dt);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();a.app.render();return {ink:a.game.ink.currentInk,cost:a.game.ink.last.cost,refund:a.game.ink.last.refund,notice:a.view.ui.inkHUD.notice.text,rune:a.input.last?.rune,casts:a.game.casts,unlimited:a.game.ink.unlimited};},dt);
 await mouse(100,500);await page.mouse.down();await mouse(140,500);assert.equal((await render()).ink,60);
 await mouse(340,500);const during=await render();assert.ok(Math.abs(during.ink-49)<1e-4);assert.equal(during.casts,0);await page.screenshot({path:`${folder}/drawing.png`});
 await page.mouse.up();const returned=await render(.10);assert.ok(Math.abs(returned.ink-50.1)<1e-4);assert.ok(Math.abs(returned.refund-1.1)<1e-4);assert.equal(returned.notice,'回墨 +1.1');await page.screenshot({path:`${folder}/refund.png`});
 // Starting another stroke during the refund animation must reflect its actual new balance.
 await mouse(100,580);await page.mouse.down();await mouse(340,580);const second=await render(.02);assert.ok(Math.abs(second.ink-39.1)<1e-4);await page.mouse.up();await render(.5);
 // Actual pointer cancellation reverts only the unfinished transaction.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.game.ink.setAmount(8);});
 await mouse(100,500);await page.mouse.down();await mouse(500,500);await mouse(660,900);const exhausted=await render(.05);assert.equal(exhausted.ink,0);assert.ok(Math.abs(await page.evaluate(()=>window.__LINGHU__.input.points.at(-1).x)-196)<1e-4);await page.screenshot({path:`${folder}/exhausted.png`});
 await page.mouse.up();const sealed=await render(.1);assert.equal(sealed.rune,'line');assert.ok(Math.abs(sealed.ink-.8)<1e-4);
 await page.evaluate(()=>window.__LINGHU__.game.ink.setAmount(0));await mouse(250,550);await page.mouse.down();await page.mouse.up();const empty=await render(.05);assert.equal(empty.notice,'灵墨不足');await page.screenshot({path:`${folder}/insufficient.png`});
 // Check the practice switch through the visible canvas controls.
 await page.evaluate(()=>{const a=window.__LINGHU__;a.action('practice');a.app.ticker.stop();a.game.enemies=[];a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();a.app.render();});
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.ink.unlimited),true);
 const toggle=await page.evaluate(()=>182);const footer=await page.evaluate(()=>window.__LINGHU__.practiceUI.root.y);await mouse(toggle,1101+footer);await page.mouse.down();await page.mouse.up();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.ink.unlimited),false);
 await render();await page.screenshot({path:`${folder}/finite-practice.png`});
 // All pre-existing glyphs remain usable in finite mode with their actual geometry costs.
 const glyphs=await page.evaluate(()=>{const a=window.__LINGHU__,results=[];for(const rune of ['line','circle','triangle','z']){a.game.ink.setAmount(100);let pts=rune==='circle'?Array.from({length:80},(_,i)=>({x:360+120*Math.cos(i/79*Math.PI*2),y:550+120*Math.sin(i/79*Math.PI*2)})):rune==='triangle'?[{x:260,y:650},{x:460,y:550},{x:260,y:450}]:rune==='z'?[{x:250,y:450},{x:470,y:450},{x:250,y:650},{x:470,y:650}]:[{x:240,y:550},{x:480,y:550}];if(rune!=='circle'){const dense=[pts[0]];for(let i=1;i<pts.length;i++)for(let j=1;j<=20;j++)dense.push({x:pts[i-1].x+(pts[i].x-pts[i-1].x)*j/20,y:pts[i-1].y+(pts[i].y-pts[i-1].y)*j/20});pts=dense;}a.input.event({...pts[0],id:88,kind:'down'});for(const p of pts.slice(1))a.input.event({...p,id:88,kind:'move'});a.input.event({...pts.at(-1),id:88,kind:'up'});results.push({expected:rune,actual:a.input.last?.rune,cost:a.game.ink.last.cost,refund:a.game.ink.last.refund});}return results;});
 for(const r of glyphs){assert.equal(r.actual,r.expected);assert.ok(r.cost>0&&r.refund>0);}
 for(const [width,height] of [[360,640],[430,932],[390,1000]]){await page.setViewportSize({width,height});await page.waitForTimeout(80);await render();const layout=await page.evaluate(()=>{const a=window.__LINGHU__,r=a.view.ui.inkHUD.root.getBounds(),c=a.app.canvas.getBoundingClientRect();return {left:r.x,right:r.x+r.width,top:r.y,bottom:r.y+r.height,width:c.width,height:c.height};});assert.ok(layout.left>=0&&layout.right<=width);assert.ok(layout.top>=0&&layout.bottom<height);await page.screenshot({path:`${folder}/layout-${width}x${height}.png`});}
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({during,returned,second,exhausted,sealed,empty,glyphs,errors},null,2));console.log('PASS: actual pointer debits, refund feedback, depletion cutoff and slash, empty hint, finite practice toggle, all glyphs and three portrait layouts');
}finally{await browser.close();}

