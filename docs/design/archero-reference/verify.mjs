import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';

const dir=path.dirname(fileURLToPath(import.meta.url));
const report=JSON.parse(await fs.readFile(path.join(dir,'analysis.json'),'utf8'));
const errors=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(pathToFileURL(path.join(dir,'report.html')).href);
 assert.equal(await page.locator('.chapter').count(),report.sections.length+2);
 for(const [view,expected] of [['game',6],['ours',5],['plan',5],['all',15]]){
  await page.locator(`[data-view="${view}"]`).click();
  assert.equal(await page.locator('.chapter:not(.hidden)').count(),expected);
  assert.equal(await page.locator(`[data-view="${view}"]`).getAttribute('aria-pressed'),'true');
 }
 assert.equal(await page.locator('#sources .source a').count(),6);
 assert.ok((await page.locator('body').innerText()).includes('原作内部代码未公开'));
 await page.screenshot({path:path.join(dir,'desktop.png')});
 for(const width of [375,390,430]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.mobile-menu').selectOption('rewards');
  assert.ok(await page.locator('#rewards').isVisible());
  await page.locator('[data-view="ours"]').click();
  await page.locator('.mobile-menu').selectOption('sources');
  assert.ok(await page.locator('#sources').isVisible());
  assert.equal(await page.locator('[data-view="all"]').getAttribute('aria-pressed'),'true');
 }
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:path.join(dir,'mobile.png')});
 await page.emulateMedia({media:'print'});
 const pdfDir=path.resolve(dir,'../../../output/pdf');
 await fs.mkdir(pdfDir,{recursive:true});
 await page.pdf({path:path.join(pdfDir,'弓箭传说设计拆解与画灵借鉴方案.pdf'),format:'A4',printBackground:true,margin:{top:'15mm',right:'15mm',bottom:'18mm',left:'15mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;text-align:center;font-size:9px;color:#536861"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(dir,'verification.json'),JSON.stringify({sections:report.sections.length,sources:report.sources.length,views:['完整研究','原作设计','画灵方案','实施与验证'],widths:[375,390,430,1440],errors},null,2));
 console.log('PASS: 13 sections, 6 cited sources, all four reading filters, mobile jump from filtered view, responsive widths 375/390/430/1440, no page errors. PDF exported.');
}finally{await browser.close();}
