import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:780,height:1040}});
try{
 await page.goto('http://127.0.0.1:5177/?qa=1&mode=hualing',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(async()=>{
  const a=window.__LINGHU__;a.app.ticker.stop();
  const Container=a.view.world.constructor,Graphics=a.view.fx.constructor,Text=a.view.ui.score.constructor;
  const {PaperChapterSpirit}=await import('/src/rendering/paper-chapter-spirit.ts');
  const gallery=new Container();a.view.root.addChild(gallery);gallery.addChild(new Graphics().rect(-100,-300,920,1900).fill(0xf1e4c7));
  const title=new Text({text:'山海纸妖 · 造型试样',style:{fontFamily:'KaiTi,serif',fontSize:35,fill:0x3f5456,letterSpacing:3}});title.anchor.set(.5);title.position.set(360,150);gallery.addChild(title);
  const models=[['sea-fish','折鳍游鲤'],['sea-jelly','潮灯水母'],['sea-crab','朱纹纸蟹'],['star-ray','折翼星鳐'],['star-bell','云纹悬铃'],['star-kite','逐星纸燕']];
  for(const [i,[id,name]] of models.entries()){
   const x=145+i%3*215,y=410+Math.floor(i/3)*365;
   const model=new PaperChapterSpirit(id);model.root.position.set(x,y);model.root.scale.set(1.48);model.update(1+i*.4,0,0);gallery.addChild(model.root);
   const t=new Text({text:name,style:{fontFamily:'KaiTi,serif',fontSize:25,fill:0x395556}});t.anchor.set(.5);t.position.set(x,y+125);gallery.addChild(t);
   gallery.addChild(new Graphics().moveTo(x-60,y+159).lineTo(x+60,y+159).stroke({color:0xc49a5b,width:1,alpha:.6}));
  }
  a.app.render();
 });
 await page.screenshot({path:'screenshots/hualing-chapters/paper-monsters-v04.png'});
}finally{await browser.close();}
