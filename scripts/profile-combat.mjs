import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// Diagnostic only: keeps gameplay files untouched. CPU submission timings are not GPU timings or FPS.
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1.5});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL||'http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 await page.evaluate(legacy=>{window.__LINGHU__.view.experimentalOptimizations=!legacy;},process.env.LINGHU_PERF_LEGACY==='1');
 const report=await page.evaluate(async()=>{
  const a=window.__LINGHU__,{game:g,view:v,input,app}=a;
  const {recognize}=await import('/src/input/recognizer.ts');
  const {EnemyAI}=await import('/src/gameplay/ai.ts');
  const {containCircleEnemy}=await import('/src/gameplay/circle.ts');
  const Graphics=v.pen.trace.constructor;
  const gl=app.renderer.gl,debug=gl.getExtension('WEBGL_debug_renderer_info');
  const environment={ua:navigator.userAgent,viewport:[innerWidth,innerHeight],resolution:app.renderer.resolution,canvas:[app.canvas.width,app.canvas.height],gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unavailable'};
  let drawCalls=0,clears=0;
  const originals={};for(const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(gl[k]){originals[k]=gl[k];gl[k]=function(...args){drawCalls++;return originals[k].apply(this,args);};}
  const oldClear=Graphics.prototype.clear;Graphics.prototype.clear=function(...args){clears++;return oldClear.apply(this,args);};
  const summary=values=>{const sorted=[...values].sort((a,b)=>a-b);return {median:+sorted[Math.floor(sorted.length*.5)].toFixed(3),p95:+sorted[Math.floor(sorted.length*.95)].toFixed(3),max:+sorted.at(-1).toFixed(3)};};
  const countNodes=root=>1+(root.children??[]).reduce((n,c)=>n+countNodes(c),0);
  const setup=(count=0,mode='ward',enemies=0)=>{
   input.cancel();g.start(false,true,false,true);g.director.disabled=true;g.practiceLevels.circle=4;v.begin();v.ui.show(g.state,g);a.practiceUI.reset();
   for(let i=0;i<enemies;i++){const e=g.spawn('ink',{x:70+i%10*60,y:300+Math.floor(i/10)*65});if(!e)break;e.hp=e.maxHp=1e8;e.ai='Approach';}
   for(let i=0;i<count;i++){
    const center={x:360,y:mode==='ward'?665:320};
    const r=recognize(Array.from({length:73},(_,j)=>({x:center.x+Math.cos(j/72*Math.PI*2)*60,y:center.y+Math.sin(j/72*Math.PI*2)*60})));
    if(!g.cast(r))throw Error('circle cast failed');const s=g.skills.at(-1);s.age=.9+(i%3)*.03;s.released=true;
    for(const e of g.enemies)s.circle.captured.add(e.id);
   }
   g.drain();
  };
  const results=[];
  try{
   for(const c of [{name:'empty',count:0},{name:'ward1',count:1},{name:'ward10',count:10},{name:'ward10-frozen-art-diagnostic',count:10,freeze:true},{name:'seal1',count:1,mode:'seal'},{name:'seal10',count:10,mode:'seal'},{name:'seal10-enemies35',count:10,mode:'seal',enemies:35},{name:'enemies35',count:0,enemies:35}]){
    setup(c.count,c.mode,c.enemies);const createAt=performance.now();v.update(g,input,0,60);app.render();const coldMs=performance.now()-createAt;
    const update=[],render=[],calls=[],clearCounts=[],circleUpdate=[];
    const updateCircle=v.circles.update;let circleMs=0;
    v.circles.update=function(...args){const t=performance.now();const r=c.freeze?undefined:updateCircle.apply(this,args);circleMs=performance.now()-t;return r;};
    for(let i=0;i<100;i++){
     for(const s of g.skills)s.age+=1/60;drawCalls=clears=0;
     const t=performance.now();v.update(g,input,1/60,60);const t2=performance.now();app.render();const end=performance.now();
     if(i>=55){update.push(t2-t);render.push(end-t2);calls.push(drawCalls);clearCounts.push(clears);circleUpdate.push(circleMs);}
     if(i%5===0)await new Promise(requestAnimationFrame);
    }
    v.circles.update=updateCircle;
    results.push({...c,actualEnemies:g.enemies.length,coldMs:+coldMs.toFixed(2),nodes:countNodes(v.world),updateMs:summary(update),circleUpdateMs:summary(circleUpdate),renderSubmitMs:summary(render),drawCalls:summary(calls),graphicsClears:summary(clearCounts)});
   }
   // Isolate avoid-neighbour work; do not include rendering or target damage.
   const ai=[];
   for(const n of [10,20,35]){
    setup(0,'ward',n);const samples=[];
    for(let i=0;i<90;i++){const t=performance.now();for(const e of g.enemies){e.ai='Approach';EnemyAI.update(g,e,1/60);containCircleEnemy(g,e);}samples.push(performance.now()-t);}
    ai.push({enemies:g.enemies.length,pairsPerStep:g.enemies.length*(g.enemies.length-1),cpuMs:summary(samples)});
   }
   const pen=[];
   for(const n of [30,150,400])for(const motion of ['held','changing']){
    setup();input.points=Array.from({length:n},(_,i)=>({x:100+i/(n-1)*500,y:600+Math.sin(i*.23)*100}));input.pointTimes=input.points.map((_,i)=>i*.003);input.drawing=true;input.drawAge=.9;
    const times=[],submit=[];
    for(let i=0;i<45;i++){if(motion==='changing')input.points=input.points.map((p,j)=>({...p,y:p.y+Math.sin(i*.1+j*.23)*.02}));const t=performance.now();v.pen.update(input);const t2=performance.now();app.render();if(i>=5){times.push(t2-t);submit.push(performance.now()-t2);}if(i%5===0)await new Promise(requestAnimationFrame);}
    pen.push({points:n,motion,penUpdateMs:summary(times),renderSubmitMs:summary(submit)});
   }
   input.cancel();return {environment,results,ai,pen,note:'Desktop headless dev build; median/p95 CPU timings in ms, submission excludes asynchronous GPU completion; no real-device FPS claim.'};
  }finally{Graphics.prototype.clear=oldClear;for(const k in originals)gl[k]=originals[k];}
 });
 await mkdir('docs/performance',{recursive:true});await writeFile(process.env.LINGHU_PROFILE_OUTPUT||'docs/performance/combat-latest.json',JSON.stringify({...report,errors},null,2));
 console.log(JSON.stringify({...report,errors},null,2));
}finally{await browser.close();}
