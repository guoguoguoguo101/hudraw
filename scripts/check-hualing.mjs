import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const folder='screenshots/hualing-brush';await mkdir(folder,{recursive:true});
const previewBase=new URL(process.env.LINGHU_PREVIEW_URL??'http://127.0.0.1:5175/').origin;
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],shots=[];
const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
async function point(x,y){return page.evaluate(async({x,y})=>{const a=window.__LINGHU__,r=a.app.canvas.getBoundingClientRect(),{gameViewport}=await import('/src/platform/viewport.ts'),v=gameViewport(r.width,r.height);return {x:r.left+v.x+x*v.scale,y:r.top+v.y+y*v.scale};},{x,y});}
async function move(x,y){const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function click(x,y){await move(x,y);await page.mouse.down();await page.mouse.up();}
async function step(seconds=0){return page.evaluate(seconds=>{
 const a=window.__LINGHU__,render=(dt=0)=>{a.input.minY=Math.max(175,a.view.ui.hud.y+220);a.input.maxY=990+a.view.ui.footer.y;a.game.hualing.bounds={left:26,right:694,top:Math.max(a.input.minY+30,280+a.view.ui.hud.y),bottom:a.input.maxY-28};for(const e of a.game.drain())a.view.event(e);a.view.update(a.game,a.input,dt,60,dt);a.practiceUI.update();a.hualingUI.update(a.view.ui.footer.y);a.app.render();};
 for(let t=0;t<seconds-1e-9;t+=1/60){const dt=Math.min(1/60,seconds-t);a.game.advance(dt);render(dt);}render();const m=a.game.hualing;return {selected:m.selected,effects:m.effects.map(f=>({kind:f.kind,age:f.age})),casts:a.game.casts,enemies:a.game.enemies.length,gl:a.app.renderer.gl.getError()};
 },seconds);}
async function shot(name){const state=await step();assert.equal(state.gl,0);shots.push({name,...state});await page.screenshot({path:`${folder}/${name}.png`});return state;}
async function select(i){const footer=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click(174+i*186,footer+1090);await step();}
async function draw(points,mid){await move(points[0].x,points[0].y);await page.mouse.down();for(let i=1;i<points.length;i++){await move(points[i].x,points[i].y);if(mid&&i===Math.floor(points.length*.6))await shot(mid);}await page.mouse.up();await step();}
async function reset(){await page.evaluate(()=>{const a=window.__LINGHU__;a.game.hualing.reset();a.game.skills=[];a.game.enemies=[];a.game.director.disabled=true;a.game.seedHualingEnemies();for(const e of a.game.enemies)e.speed=0;a.hualingUI.reset();});await step();}
try{
 await page.goto(`${previewBase}/?qa=1`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());
 const entry=await page.evaluate(()=>window.__LINGHU__.view.ui.zones.find(z=>z.action==='hualingPractice'));assert.ok(entry);await click(entry.x+entry.w/2,entry.y+entry.h/2);await page.evaluate(()=>{const a=window.__LINGHU__;a.app.ticker.stop();a.game.director.disabled=true;a.view.animator.clear();a.view.entrance.y=665;a.view.entrance.scale=.32;});await shot('dock-390');
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualingPractice),true);assert.equal(await page.evaluate(()=>window.__LINGHU__.practiceUI.root.visible),false);assert.equal(await page.evaluate(()=>window.__LINGHU__.relicUI.root.visible),false);
 await reset();await select(0);await shot('dragon-guide');const route=Array.from({length:70},(_,i)=>({x:360+Math.sin(i/69*Math.PI*2)*170,y:820-i/69*490}));await draw(route,'dragon-drawing');assert.equal((await step()).selected,null);await step(.85);await shot('dragon-release');
 // Live pointer damage is observable while the mouse is still held, with no release cast.
 await reset();await page.evaluate(()=>{const a=window.__LINGHU__;a.game.enemies=[];a.game.hualing.frozen=true;const e=a.game.spawn('oni',{x:300,y:600});e.speed=0;e.ai='Approach';});
 await move(180,600);await page.mouse.down();await move(420,600);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies[0].hp),210);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.input.drawing),true);
 await move(180,600);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.enemies[0].hp),210);
 await shot('brush-live-hit');await page.mouse.up();await step();assert.equal((await step()).casts,0);
 assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills.length+window.__LINGHU__.game.freeSlashes.items.length),0);
 // Keep a normal drawing gesture held beyond the former time limit, at full speed.
 await reset();await move(100,700);await page.mouse.down();
 const speed=await page.evaluate(()=>{const a=window.__LINGHU__,before=a.game.clock.world;for(let i=0;i<240;i++){a.game.advance(1/60,a.input.drawing);a.input.update(1/60);}return {elapsed:a.game.clock.world-before,drawing:a.input.drawing,preview:a.input.preview,realm:a.view.realm.context.instructions.length};});
 assert.ok(Math.abs(speed.elapsed-4)<.02);assert.equal(speed.drawing,true);assert.equal(speed.preview,null);await page.mouse.up();
 await draw(Array.from({length:65},(_,i)=>({x:360+110*Math.cos(i/64*Math.PI*2),y:600+110*Math.sin(i/64*Math.PI*2)})));
 assert.equal((await step()).casts,0);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.skills.length),0);
 // The three original cards remain alongside the new timed petal card, all are still available via actual pointer input.
 const verbs=await page.evaluate(()=>{const a=window.__LINGHU__;return a.hualingUI.root.children.filter(c=>typeof c.text==='string').map(c=>c.text);});assert.ok(!verbs.includes('补虎')&&!verbs.includes('补鹤'));await shot('plain-brush');
 // Dock, input bounds and contextual stencils on short and tall phones.
 for(const [width,height] of [[375,667],[430,932]]){await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await reset();await shot('dock-'+width);await select(0);await shot('dragon-guide-'+width);assert.ok(await page.evaluate(()=>window.__LINGHU__.game.hualing.bounds.bottom<990+window.__LINGHU__.view.ui.footer.y));}
 await page.evaluate(()=>window.__LINGHU__.action('pause'));await step();await shot('paused');await page.evaluate(()=>window.__LINGHU__.action('resume'));await step();await page.evaluate(()=>window.__LINGHU__.action('restart'));await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());await step();assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualingPractice),true);
 await page.evaluate(()=>window.__LINGHU__.action('interactionPractice'));await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualingPractice),false);assert.equal(await page.evaluate(()=>window.__LINGHU__.game.functionalRelics.enabled),true);
 await page.goto(`${previewBase}/?qa=1&mode=hualing`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__LINGHU__);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());assert.equal(await page.evaluate(()=>window.__LINGHU__.game.hualingPractice),true);await step();await select(0);const finalFooter=await page.evaluate(()=>window.__LINGHU__.view.ui.footer.y);await click(110,1228+finalFooter);assert.ok((await step()).effects.length);await click(436,1228+finalFooter);await page.evaluate(()=>window.__LINGHU__.app.ticker.stop());const clean=await step();assert.equal(clean.selected,null);assert.equal(clean.effects.length,0);assert.equal(clean.casts,0);assert.equal(clean.enemies,8);await shot('direct-entry-reset');
 assert.deepEqual(errors,[]);await writeFile(`${folder}/verification.json`,JSON.stringify({shots,errors},null,2));console.log('PASS hualing browser: menu, dragon actual drag interaction, immediate brush damage, full-speed unlimited strokes, no rune casts, 375/390/430 layout, restart, old scene isolation, no page/WebGL errors');
}finally{await browser.close();}
