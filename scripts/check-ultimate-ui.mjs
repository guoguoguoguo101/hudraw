import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/?lab=1&qa=1&ultimate=1');await page.waitForFunction(()=>window.__SLASH_PREVIEW__&&window.__LINGHU__);
for(const [variant,name] of [['A','A · 锋利月牙'],['B','B · 华丽纸符']]){
 await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills.at(-1)?.slash?.variant),variant);
}
await page.locator('.slash-preview summary').click();const width=page.getByText('主斩宽度',{exact:true}).locator('input');await width.fill('180');await width.press('Tab');
await page.getByRole('button',{name:'预览 Lv4',exact:true}).click();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills.at(-1)?.slash?.ultimate.slashWidth),180);
await page.evaluate(()=>{window.__LINGHU__.app.ticker.stop();window.__SLASH_PREVIEW__.frame(4,.24);});
const result=await page.evaluate(()=>{const s=window.__LINGHU__.game.skills[0],item=window.__LINGHU__.view.slashes.items.get(s.id);return {secondary:s.slash.secondaryDone,dead:s.slash.contacts.filter(c=>c.dead).length,ghosts:item.ghosts.size,root:{x:window.__LINGHU__.view.fox.root.x,y:window.__LINGHU__.view.fox.root.y}};});
assert.equal(result.secondary,true);assert.ok(result.dead>0);assert.ok(result.ghosts>0);assert.deepEqual(result.root,{x:360,y:665});assert.deepEqual(errors,[]);
console.log('PASS actual A/B controls, width parameter, cross-cut, split enemy ghosts, fox anchor unchanged; no script errors');await browser.close();
