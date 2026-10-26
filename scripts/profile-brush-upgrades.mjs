import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/brush-performance';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5173'}/?mode=hualing&qa=1`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__LINGHU__?.playUI);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const report=await page.evaluate(async active=>{
  const a=window.__LINGHU__,{game:g,view:v,app,input}=a,u=g.hualing.upgrades;
  g.director.disabled=true;g.hualing.frozen=true;g.enemies=[];a.playUI.formal=true;
  const summary=values=>{values.sort((a,b)=>a-b);return{median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)]};};
  const reports=[];
  for(const style of ['cinnabar','maple-thunder']){
   u.reset();u.levels={spray:4,wide:4,splash:4,trail:4};
   for(let i=0;i<32;i++){const e=g.spawn('oni',{x:65+i%8*80,y:420+Math.floor(i/8)*95});if(e)e.hp=e.maxHp=1e8;}
   for(let i=0;i<300;i++){if(i%30===0)u.begin();const t=i*.15,p={x:360+Math.sin(t)*230,y:650+Math.sin(t*1.7)*180},q={x:360+Math.sin(t+.15)*230,y:650+Math.sin((t+.15)*1.7)*180};u.trace(p,q,style);u.advance(1/60,g.enemies,()=>{});if(i%30===29){u.charge=5;u.end(g.hualing.bounds);}}
   v.update(g,input,0,60,0);a.hualingUI.root.visible=false;a.playUI.update(v.ui.footer.y,v.ui.hud.y);
   const cpu=[],submit=[],logic=[],commands=[];let hits=0;
   for(let i=0;i<100;i++){
    if(active){const t=(300+i)*.15;u.trace({x:360+Math.sin(t)*230,y:650+Math.sin(t*1.7)*180},{x:360+Math.sin(t+.15)*230,y:650+Math.sin((t+.15)*1.7)*180},style);if(i%30===29){u.charge=5;u.end(g.hualing.bounds);u.begin();}}
    const t=performance.now();u.advance(1/60,g.enemies,()=>hits++);const l=performance.now();
    v.brushUpgrades.update(u,true,false,g.hualing.bounds);v.inkTrail.update(u.trail,true,g.hualing.bounds,false);
    const r=performance.now();app.render();const end=performance.now();
    if(i>=20){logic.push(l-t);cpu.push(r-l);submit.push(end-r);commands.push(v.inkTrail.stains.context.instructions.length+v.inkTrail.veins.context.instructions.length+v.inkTrail.ornaments.context.instructions.length);}
    if(i%10===0)await new Promise(requestAnimationFrame);
   }
   reports.push({style,active,segments:u.trail.segments.length,hits,logicMs:summary(logic),effectBuildMs:summary(cpu),renderSubmitMs:summary(submit),trailCommands:summary(commands)});g.enemies=[];
  }
  return reports;
 },process.env.PERF_ACTIVE==='1');
 await page.screenshot({path:`${folder}/${process.env.PERF_LABEL??'latest'}.png`});
 const result={note:'Desktop browser CPU timings, not phone FPS or GPU time.',report,errors};
 await writeFile(`${folder}/${process.env.PERF_LABEL??'latest'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
