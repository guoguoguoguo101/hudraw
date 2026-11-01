import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const webgl1=process.env.LINGHU_WEBGL1==='1',folder=`screenshots/enemy-atlas${webgl1?'-webgl1':''}`;await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
if(webgl1)await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184')+'/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 if(webgl1)await page.evaluate(async()=>{const {installWechatTextureStyle}=await import('/src/platform/wechat-texture-style.ts');installWechatTextureStyle();while(window.__LINGHU__.app.renderer.gl.getError()){};});
 await page.evaluate(async()=>{
  const a=window.__LINGHU__,{app,view}=a;app.ticker.stop();
  const {EnemyRig}=await import('/src/rendering/rigs.ts'),{PAPER_MONSTERS}=await import('/src/gameplay/paper-monsters.ts'),{StaticArtAtlas}=await import('/src/rendering/static-art-atlas.ts');
  const Container=view.root.constructor,stage=app.stage,original=stage.removeChildren(),atlas=new StaticArtAtlas(app.renderer,2,1.5);
  const build=(count,cached)=>{
   const root=new Container(),rigs=[],enemies=[];
   for(let i=0;i<count;i++){
    const m=PAPER_MONSTERS[i%PAPER_MONSTERS.length],x=count<35?90+i%4*180:45+i%20*33,y=count<35?150+Math.floor(i/4)*200:150+Math.floor(i/20)*18;
    const e={id:i+1,kind:m.kind,look:m.id,x,y,prevX:x,prevY:y,hp:100,maxHp:100,age:1,hit:0,ai:'Approach',stateAge:0};
    const rig=new EnemyRig(m.kind,view.art,m.id);root.addChild(rig.root);if(cached)atlas.bake(rig.root,'enemy/'+m.id,new Set());rigs.push(rig);enemies.push(e);
   }
   return{root,rigs,enemies};
  };
  const update=(gallery,time,state)=>gallery.rigs.forEach((r,i)=>{const e=gallery.enemies[i];e.age=1+time;e.ai=state;e.stateAge=.4;e.hit=state==='Hit'?.2:0;r.update(e,time,1,true);});
  const baseline=build(PAPER_MONSTERS.length,false),cached=build(PAPER_MONSTERS.length,true);
  while(atlas.pending.length)atlas.update(1000);
  window.__ENEMY_ATLAS_QA__={a,Container,original,atlas,build,update,baseline,cached};
 });
 const visual=[];
 for(const resolution of [1.5,1])for(const state of ['Approach','Telegraph','Hit']){
  const pictures=[];
  for(const mode of ['baseline','cached']){
   await page.evaluate(({mode,resolution,state})=>{const q=window.__ENEMY_ATLAS_QA__,{app}=q.a;app.renderer.resolution=resolution;app.renderer.resize(app.screen.width,app.screen.height);app.stage.removeChildren();const gallery=q[mode];q.update(gallery,.73,state);app.stage.addChild(gallery.root);app.render();},{mode,resolution,state});
   const shot=await page.locator('canvas').screenshot();pictures.push(shot);await writeFile(`${folder}/${resolution}-${state}-${mode}.png`,shot);
  }
  const raw=await Promise.all(pictures.map(p=>sharp(p).removeAlpha().raw().toBuffer()));let sum=0,changed=0;
  for(let i=0;i<raw[0].length;i++){const d=Math.abs(raw[0][i]-raw[1][i]);sum+=d;if(d>24)changed++;}
  const comparison={resolution,state,mean:sum/raw[0].length,changedRatio:changed/raw[0].length};visual.push(comparison);
  assert.ok(comparison.mean<2&&comparison.changedRatio<.015,`cached monster artwork changed: ${JSON.stringify(comparison)}`);
 }
 const scaling=await page.evaluate(async()=>{
  const q=window.__ENEMY_ATLAS_QA__,{app}=q.a,gl=app.renderer.gl;app.stage.removeChildren();q.baseline.root.destroy({children:true});q.cached.root.destroy({children:true});app.renderer.resolution=1.5;app.renderer.resize(app.screen.width,app.screen.height);
  let calls=0;const originals={};for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(gl[name]){originals[name]=gl[name];gl[name]=function(...args){calls++;return originals[name].apply(this,args);};}
  const summary=values=>{values.sort((a,b)=>a-b);return{median:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)]};},results=[];
  try{
   for(const count of [35,350,1000])for(const cached of [false,true]){
    const gallery=q.build(count,cached);while(q.atlas.pending.length)q.atlas.update(1000);app.stage.addChild(gallery.root);const update=[],render=[],draws=[];
    for(let i=0;i<40;i++){calls=0;const t=performance.now();q.update(gallery,i/60,'Approach');const mid=performance.now();app.render();const end=performance.now();if(i>=15){update.push(mid-t);render.push(end-mid);draws.push(calls);}if(i%4===0)await new Promise(requestAnimationFrame);}
    const contexts=[],collect=n=>{if(n.context&&!n.context.instructions.length&&n.children.length)contexts.push(n.context);for(const c of n.children??[])collect(c);};if(cached)collect(gallery.root);
    app.stage.removeChild(gallery.root);gallery.root.destroy({children:true});const unreleased=contexts.filter(c=>!c.destroyed).length;if(unreleased)throw Error('atlas replacement contexts must be released immediately: '+unreleased);
    results.push({count,cached,updateMs:summary(update),renderSubmitMs:summary(render),drawCalls:summary(draws),unreleasedContexts:unreleased,gl:gl.getError()});
   }
  }finally{for(const [name,original]of Object.entries(originals))gl[name]=original;}
  const pages=q.atlas.pageCount;q.atlas.clear();app.stage.addChild(...q.original);
  const a=q.a,g=a.game,v=a.view;a.beginMountain(0);a.mountainUI.opened=false;g.hualing.frozen=true;g.enemies=[];
  const {PAPER_MONSTERS}=await import('/src/gameplay/paper-monsters.ts');const seed=g.spawn('ink',{x:120,y:450});
  for(let round=0;round<3;round++){
   g.enemies=Array.from({length:180},(_,i)=>{const m=PAPER_MONSTERS[i%PAPER_MONSTERS.length];return{...seed,id:100000+round*1000+i,kind:m.kind,look:m.id,x:50+i%20*32,prevX:50+i%20*32,y:350+Math.floor(i/20)*45,prevY:350+Math.floor(i/20)*45};});
   v.update(g,a.input,0,60,0);g.enemies=[];v.update(g,a.input,0,60,0);
  }
  while(v.enemyAtlas.pending.length)v.enemyAtlas.update(1000);
  const lifecycle={active:v.enemyRigs.size,pooled:Object.values(v.spare).reduce((n,p)=>n+p.length,0),maxPerLook:Math.max(...Object.values(v.spare).map(p=>p.length)),pages:v.enemyAtlas.pageCount,actors:v.actors.children.length,gl:gl.getError()};
  return{results,pages,releasedPages:q.atlas.pageCount,lifecycle,note:'Isolated articulated monster renderer; diagnostic counts bypass normal gameplay cap. Same full artwork, animation and resolution. Does not include AI, skills or real-device GPU/FPS.'};
 });
 assert.ok(scaling.pages<=2);assert.equal(scaling.releasedPages,0);assert.ok(scaling.results.every(r=>r.gl===0));
 assert.equal(scaling.lifecycle.active,0);assert.ok(scaling.lifecycle.pooled<=128&&scaling.lifecycle.maxPerLook<=24&&scaling.lifecycle.pages<=2&&scaling.lifecycle.actors<=129);assert.equal(scaling.lifecycle.gl,0);
 for(const count of [35,350,1000]){const pair=scaling.results.filter(r=>r.count===count);assert.ok(pair[1].drawCalls.median<pair[0].drawCalls.median,`atlas should batch ${count} monsters`);}
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({visual,scaling,errors},null,2));console.log(JSON.stringify({visual,scaling,errors}));
}finally{await browser.close();}
