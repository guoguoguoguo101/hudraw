import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const dir='screenshots/fox-thunder-variants';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],shots=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto((process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5184')+'/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);
 await page.evaluate(async()=>{
  const a=window.__LINGHU__;a.app.ticker.stop();const {FoxThunderUltimate}=await import('/src/rendering/fox-thunder-ultimate.ts'),{visualSkill}=await import('/src/rendering/visual-skill.ts');
  const skill=visualSkill('z',991,{x:360,y:665});skill.thunder={level:4,targets:[{x:180,y:580,at:1.65},{x:530,y:510,at:1.8},{x:355,y:820,at:1.96}],selected:true,path:[],length:0,travel:0,lineHits:new Set(),nodeHits:new Set(),finalHits:new Set(),finalDone:false,notified:false,chains:[]};
  const full=new FoxThunderUltimate(),clouds=new FoxThunderUltimate('clouds');a.app.stage.removeChildren();const root=new a.view.root.constructor();root.addChild(full,clouds);a.app.stage.addChild(root);window.__FOX_VARIANTS__={full,clouds,skill};
 });
 // Reference: complete original composition with four layers hidden by the collected spell.
 for(const [name,t]of [['emerge',.55],['charge',1.25],['first-impact',1.75],['chains',2],['sustain',2.75],['fade',3.6],['end',4.3]]){
  const images=[],states=[];
  for(const variant of ['full','clouds']){
   const result=await page.evaluate(({variant,t})=>{
    const a=window.__LINGHU__,f=window.__FOX_VARIANTS__,node=f[variant];f.full.visible=variant==='full';f.clouds.visible=variant==='clouds';f.skill.age=t;node.update(f.skill);
    for(const g of [node.thunderLanceLayer,node.impactLayer,node.runeCircleLayer,node.windLayer])g.visible=false;
    a.app.render();return{phase:node.phase,gl:a.app.renderer.gl.getError(),tails:node.foxTailLayers.length};
   },{variant,t});
   assert.equal(result.gl,0,variant+'/'+name+': WebGL status');assert.equal(result.tails,9);states.push(result);
   const image=await page.locator('canvas').screenshot();images.push(image);await writeFile(dir+'/'+variant+'-'+name+'.png',image);
  }
  const raw=await Promise.all(images.map(b=>sharp(b).ensureAlpha().raw().toBuffer()));assert.equal(raw[0].length,raw[1].length);
  let changed=0;for(let i=0;i<raw[0].length;i++)if(Math.abs(raw[0][i]-raw[1][i])>8)changed++;
  assert.equal(changed,0,name+': removing invisible geometry must preserve visible artwork');shots.push({name,t,states,changed});
 }
 const work=await page.evaluate(()=>{
  const a=window.__LINGHU__,f=window.__FOX_VARIANTS__,out={};
  for(const variant of ['full','clouds']){
   const node=f[variant],layers=[node.thunderLanceLayer,node.impactLayer,node.runeCircleLayer,node.windLayer];if(variant==='full')for(const g of layers)g.visible=true;
   let clears=0,paths=0;for(const g of layers){const clear=g.clear;g.clear=function(...args){clears++;return clear.apply(this,args);};for(const key of ['circle','arc','poly','bezierCurveTo','lineTo']){const fn=g[key];g[key]=function(...args){paths++;return fn.apply(this,args);};}}
   for(let i=0;i<60;i++){f.skill.age=1.7+i/120;node.update(f.skill);}
   f.full.visible=variant==='full';f.clouds.visible=variant==='clouds';a.app.render();out[variant]={frames:60,clears,paths,visible:layers.map(g=>g.visible),instructions:layers.map(g=>g.context.instructions.length),gl:a.app.renderer.gl.getError()};
  }
  return out;
 });
 assert.equal(work.clouds.clears,0);assert.equal(work.clouds.paths,0);assert.ok(work.clouds.instructions.every(n=>n===0));assert.ok(work.clouds.visible.every(v=>!v));assert.ok(work.full.visible.every(Boolean));assert.ok(work.full.instructions.every(n=>n>0));assert.ok(work.full.paths>0);assert.equal(work.full.gl,0);assert.equal(work.clouds.gl,0);
 assert.deepEqual(errors,[]);await writeFile(dir+'/verification.json',JSON.stringify({shots,work,errors},null,2));
 console.log('PASS fox thunder: seven collected phases match full-with-hidden-layers; complete default skill; no hidden path work; nine tails and GL0');
}finally{await browser.close();}
