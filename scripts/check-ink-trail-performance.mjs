import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const result=await page.evaluate(async()=>{
  const {InkTrail}=await import('/src/gameplay/ink-trail.ts'),{InkTrailRenderer}=await import('/src/rendering/ink-trail.ts');
  const r=new InkTrailRenderer(),m=new InkTrail(),b={left:26,right:694,top:300,bottom:1100};let builds=0;
  const clear=r.stains.clear.bind(r.stains);r.stains.clear=(...args)=>{builds++;return clear(...args);};
  m.trace({x:100,y:500},{x:400,y:500},33.6,4,'maple-thunder');m.time=.3;
  r.update(m,true,b);const first=builds;r.update(m,true,b);m.time+=.01;r.update(m,true,b);
  const reused=builds===first;
  m.trace({x:400,y:500},{x:460,y:520},33.6,4,'maple-thunder');r.update(m,true,b);const newInput=builds===first+1;
  r.update(m,true,b,true);const quality=builds===first+2;
  r.update(m,true,{...b,bottom:1000},true);const resized=builds===first+3;
  // Disable/re-enable and reset must not resurrect stale ground, even at the same time/count.
  r.update(m,false,b);r.update(m,true,b);const reenabled=r.root.visible&&builds>first+3;
  m.reset();r.update(m,true,b);const reset=r.stains.context.instructions.length===0&&r.ornaments.context.instructions.length===0;
  for(let i=0;i<300;i++){const t=i*.14;m.trace({x:360+Math.sin(t)*240,y:650+Math.cos(t*1.7)*190},{x:360+Math.sin(t+.14)*240,y:650+Math.cos((t+.14)*1.7)*190},33.6,4,'maple-thunder');}
  m.time=.5;r.update(m,true,b);const commands=r.stains.context.instructions.length+r.veins.context.instructions.length+r.ornaments.context.instructions.length;
  const bounds=r.stains.getLocalBounds();const complete=bounds.minX<150&&bounds.maxX>570&&bounds.minY<500&&bounds.maxY>800;
  m.time=5.1;r.update(m,true,b);const expired=r.stains.context.instructions.length===0;
  return{reused,newInput,quality,resized,reenabled,reset,commands,complete,expired,segments:m.segments.length};
 });
 for(const k of ['reused','newInput','quality','resized','reenabled','reset','complete','expired'])assert.equal(result[k],true,k);
 assert.ok(result.commands<160,`dense mixed ink exceeded render budget: ${result.commands}`);assert.deepEqual(errors,[]);
 console.log('PASS ink ground: dense mixed ink bounded, full route preserved, cache reuse and input/quality/layout/reset/expiry invalidation',result);
}finally{await browser.close();}
