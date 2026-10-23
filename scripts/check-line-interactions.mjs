import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const folder='screenshots/line-interactions';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:430,height:932}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
async function coordinates(points){return page.evaluate(async points=>{const {gameViewport}=await import('/src/platform/viewport.ts'),r=window.__LINGHU__.app.canvas.getBoundingClientRect(),v=gameViewport(r.width,r.height);return points.map(p=>({x:r.left+v.x+p.x*v.width/720,y:r.top+v.y+p.y*v.height/1280}));},points);}
async function click(x,y){const [p]=await coordinates([{x,y}]);await page.mouse.click(p.x,p.y);}
async function draw(points){const mapped=await coordinates(points);await page.mouse.move(mapped[0].x,mapped[0].y);await page.mouse.down();for(const p of mapped.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();}
async function line(a,b){const points=Array.from({length:24},(_,i)=>({x:a.x+(b.x-a.x)*i/23,y:a.y+(b.y-a.y)*i/23}));await draw(points);const state=await page.evaluate(()=>{const {game,input}=window.__LINGHU__;return {rune:game.skills.at(-1)?.rune,last:input.last?.reason,bounds:[input.minY,input.maxY],drawing:input.drawing};});assert.equal(state.rune,'line',JSON.stringify({a,b,...state}));}
async function step(seconds){return page.evaluate(seconds=>{
 const a=window.__LINGHU__;for(let t=0;t<seconds-1e-8;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt);a.input.update(dt);for(const event of a.game.drain())a.view.event(event);a.view.update(a.game,a.input,dt,60,dt);}
 a.view.update(a.game,a.input,0,60,0);a.practiceUI.root.y=a.view.ui.footer.y;a.practiceUI.update();a.app.render();
 return {traces:a.game.interactions.traces.length,crosses:a.game.interactions.crossCount,triangles:a.game.interactions.triangleCount,glError:a.app.renderer.gl?.getError()??0};
 },seconds);}
async function reset(){await page.evaluate(()=>{const a=window.__LINGHU__;a.input.cancel();a.game.start(false,true,false,true);a.game.director.disabled=true;a.view.begin();a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;a.view.ui.show(a.game.state,a.game);a.practiceUI.reset();for(const p of [{x:280,y:610},{x:370,y:520},{x:460,y:630},{x:610,y:570}]){const e=a.game.spawn(p.x>600?'ink':'oni',p);e.hp=e.maxHp=1000;e.speed=0;e.ai='Recovery';e.stateAge=-100;}});await step(0);}
async function capture(name){const state=await step(0);assert.equal(state.glError,0);await page.locator('#app').screenshot({path:`${folder}/${name}.png`});results.push({name,...state});}
try{
 await page.goto(process.env.LINGHU_PREVIEW_URL||'http://127.0.0.1:5175/?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await capture('menu');
 const zone=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='interactionPractice'));assert.ok(zone);await click(zone.x+zone.w/2,zone.y+zone.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactionPractice),true);
 await reset();await capture('five-skills');
 await line({x:180,y:650},{x:540,y:650});await step(.55);await capture('trace');
 await line({x:360,y:450},{x:360,y:850});await step(.025);await capture('cross-gather');await step(.105);await capture('cross');await step(.21);await capture('cross-tail');
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.crossCount),1);
 await reset();await line({x:180,y:650},{x:540,y:650});await step(.1);await line({x:250,y:720},{x:360,y:390});await step(.1);await line({x:360,y:390},{x:470,y:720});
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.triangleCount),1);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.crossCount),1);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.traces.length),0,'triangle consumes all three participating traces immediately');
 for(const [name,delta] of [['triangle-window',.20],['triangle-area-cut',.52],['triangle-rotate',.28],['triangle-collapse',.35],['triangle-flash',.31],['triangle-fragments',.20],['triangle-tail',.20]]){await step(delta);await capture(name);if(name==='triangle-window'){await page.evaluate(()=>{const a=window.__LINGHU__;window.__interactionVisibility=a.view.world.children.map(c=>c.visible);for(const c of a.view.world.children)c.visible=c===a.view.interactions.root;a.app.render();});await page.locator('#app').screenshot({path:folder+'/triangle-geometry.png'});await page.evaluate(()=>{const a=window.__LINGHU__;a.view.world.children.forEach((c,i)=>c.visible=window.__interactionVisibility[i]);a.app.render();});}}
 // A real fourth stroke reflects through all three visible edges and leaves no residue.
 await reset();
 for(const [a,b] of [[{x:180,y:650},{x:540,y:650}],[{x:250,y:720},{x:360,y:390}],[{x:360,y:390},{x:470,y:720}]]){await line(a,b);await step(.05);}
 await step(1.93); // late in the 2.2-second visible window
 await capture('triangle-hold-2s');
 await line({x:300,y:520},{x:420,y:520});await step(.08);
 const reflection=await page.evaluate(()=>{const m=window.__LINGHU__.game.interactions;return {count:m.refractions.count,mirrors:m.refractions.items[0]?.mirrors.length,traces:m.traces.length};});
 assert.deepEqual(reflection,{count:1,mirrors:3,traces:0});await capture('triangle-refraction');
 await step(.6);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.refractions.items.length),0);
 // The temporary mechanic can be switched off through the actual scene button.
 const toggleFooter=await page.evaluate(()=>window.__LINGHU__.practiceUI.root.y);
 await click(585,1069+toggleFooter);await step(0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.refractionEnabled),false);
 await reset();
 for(const [a,b] of [[{x:180,y:650},{x:540,y:650}],[{x:250,y:720},{x:360,y:390}],[{x:360,y:390},{x:470,y:720}]]){await line(a,b);await step(.05);}
 await line({x:300,y:520},{x:420,y:520});await step(.08);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.refractions.count),0);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.traces.length),1);
 await capture('triangle-refraction-disabled');await click(585,1069+toggleFooter);await step(0);
 // The triangle selector and level picker are exercised through actual pointer clicks.
 const footer=await page.evaluate(()=>window.__LINGHU__.practiceUI.root.y);
 await click(132,1202+footer);await click(135,930+footer); // arrow Lv1
 await step(0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactionTriangle),'triangle');
 const trianglePoints=await page.evaluate(async()=>{const {sancaiSample}=await import('/src/input/glyph-samples.ts');return sancaiSample('small').map(p=>({x:360+p.x,y:665+p.y}));});
 await draw(trianglePoints);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills.at(-1).rune),'triangle');
 await click(356,1202+footer);await click(135,930+footer);await step(0);await draw(trianglePoints);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills.at(-1).rune),'sancai');
 // Unavailable runes produce a fallback rather than their disabled formal skill.
 const rejection=await page.evaluate(async()=>{const a=window.__LINGHU__,{glyphSample}=await import('/src/input/glyph-samples.ts'),{recognize}=await import('/src/input/recognizer.ts');const before=a.game.skills.length;return {accepted:a.game.cast(recognize(glyphSample('arc').map(p=>({x:360+p.x,y:665+p.y})))),before,after:a.game.skills.length,fallbacks:a.game.freeSlashes.totalCasts};});assert.equal(rejection.accepted,true);assert.equal(rejection.after,rejection.before);assert.equal(rejection.fallbacks,1);
 await page.evaluate(()=>window.__LINGHU__.game.pause());const before=await page.evaluate(()=>window.__LINGHU__.game.interactions.now);await step(1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.now),before);await page.evaluate(()=>window.__LINGHU__.game.pause());
 await step(3.1);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.traces.length),0);
 // Viewport changes must retain pointer-to-world alignment.
 for(const viewport of [{width:375,height:667},{width:390,height:844}]){await page.setViewportSize(viewport);await reset();await line({x:180,y:650},{x:540,y:650});await line({x:360,y:450},{x:360,y:850});assert.equal(await page.evaluate(()=>window.__LINGHU__.game.interactions.crossCount),1);await step(.08);await capture(`cross-${viewport.width}`);}
 // Compare small/large real handwritten windows and their cosmetic fragment budgets.
 const fragmentCounts=[];
 for(const scale of [.55,1.45]){
  await reset();const transform=p=>({x:360+(p.x-360)*scale,y:600+(p.y-600)*scale});
  for(const [a,b] of [[{x:180,y:650},{x:540,y:650}],[{x:250,y:720},{x:360,y:390}],[{x:360,y:390},{x:470,y:720}]]){await line(transform(a),transform(b));await step(.05);}
  const count=await page.evaluate(async()=>{const a=window.__LINGHU__,{triangleParticleCount}=await import('/src/gameplay/line-interaction-config.ts'),{triangleArea}=await import('/src/input/line-interaction-geometry.ts');const e=a.game.interactions.effects.find(e=>e.kind==='triangle');if(!e)throw Error('Expected scaled triangle');return triangleParticleCount(triangleArea(e.vertices));});
  fragmentCounts.push(count);await step(1.79);await capture(scale<1?'particles-small':'particles-large');
 }
 assert.ok(fragmentCounts[1]>fragmentCounts[0]);assert.ok(fragmentCounts[1]<=60);
 await page.evaluate(()=>window.__LINGHU__.view.ui.low=true);await capture('particles-low-quality');await page.evaluate(()=>window.__LINGHU__.view.ui.low=false);
 // Return to old practice via the real menu action and confirm its complete skill list.
 await page.evaluate(()=>window.__LINGHU__.action('menu'));await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await step(0);const old=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='practice'));await click(old.x+old.w/2,old.y+old.h/2);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await step(0);
 const oldState=await page.evaluate(()=>{const a=window.__LINGHU__;return {interaction:a.game.interactionPractice,text:a.practiceUI.root.children.filter(c=>c.text).map(c=>c.text)};});assert.equal(oldState.interaction,false);assert.ok(oldState.text.some(t=>t.includes('揽月狐尾')));await capture('old-practice');
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({results,fragmentCounts,rejection,oldState,errors},null,2));console.log(`PASS browser: new menu, five skills, real pointer cross/triangle, both handwritten triangle selectors, pause/expiry, 3 viewports, area particles ${fragmentCounts.join('/')}, old practice, ${results.length} captures, zero page/WebGL errors`);
}finally{await browser.close();}
