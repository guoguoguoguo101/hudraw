import './style.css';
import {Application,type Spritesheet,type Texture} from 'pixi.js';
import {BrowserAdapter} from './platform/browser';
import {Game} from './gameplay/game';
import {COMBAT} from './gameplay/config';
import {GameView} from './rendering/view';
import {InputController} from './input/controller';
import type {Action} from './ui/interface';
const platform=new BrowserAdapter();
const app=new Application();await app.init({width:720,height:1280,resolution:platform.pixelRatio(),autoDensity:true,antialias:true,background:0x192027,preference:'webgl'});
const environmentNames=['sky','sun','far_mountains','valley','shrines','arena','foreground','branches'];
const [atlas,...environmentTextures]=await Promise.all([platform.loadAsset<Spritesheet>('/art/atlas.json'),...environmentNames.map(name=>platform.loadAsset<Texture>('/art/environment/'+name+'.png'))]);
const environment=Object.fromEntries(environmentNames.map((name,i)=>[name,environmentTextures[i]])) as Record<string,Texture>;
platform.mount(app.canvas);const game=new Game();let spirit=Number(platform.read('linghu-spirit')||0);game.cultivation=Math.min(10,Number(platform.read('linghu-cultivation')||0));let muted=platform.read('linghu-muted')==='true',low=platform.read('linghu-quality')==='low';
let input:InputController;
const view=new GameView(atlas.textures,environment,action);view.ui.spirit=spirit;view.ui.cultivation=game.cultivation;view.ui.best=Number(platform.read('linghu-best')||0);view.ui.muted=muted;view.ui.low=low;view.ui.show('menu',game);platform.setMuted(muted);app.stage.addChild(view.root);
function quality(){view.particles.quality=low?'low':'high';app.renderer.resolution=low?1:platform.pixelRatio();app.renderer.resize(720,1280);view.ui.low=low;}
function action(a:Action){app.ticker.start();platform.unlockAudio();platform.audio('tap');if(a.startsWith('choose')){game.choose(Number(a.slice(-1)));input?.cancel();view.ui.show(game.state,game);}if(a==='cultivate'){if(spirit>=100&&game.cultivation<10){spirit-=100;game.cultivation++;platform.write('linghu-spirit',String(spirit));platform.write('linghu-cultivation',String(game.cultivation));view.ui.spirit=spirit;view.ui.cultivation=game.cultivation;view.ui.show('menu',game);}else view.ui.hint(`灵玉 ${spirit} · 完成试炼或斩妖积累`);}if(a==='start'||a==='restart'||a==='teach'){game.start(a==='teach');input?.cancel();view.begin();}if(a==='pause'||a==='resume'){game.pause();input?.cancel();}if(a==='menu'){game.menu();input?.cancel();view.animator.clear();view.particles.clear();}if(a==='sound'){muted=!muted;platform.setMuted(muted);platform.write('linghu-muted',String(muted));view.ui.muted=muted;view.ui.show(game.state,game);}if(a==='quality'){low=!low;platform.write('linghu-quality',low?'low':'high');quality();view.ui.show(game.state,game);}if(a==='debug'){input.debug=!input.debug;view.ui.debug=input.debug;view.ui.show(game.state,game);}}
input=new InputController(platform,app.canvas,()=>{if(game.active&&!game.charges.papers)view.ui.hint('符纸不足 · 等待充能');return game.active&&game.charges.papers>0;},r=>{platform.unlockAudio();const ok=game.cast(r);view.ui.hint(ok?r.reason:'符纸不足');return ok;},p=>view.ui.hit(p),r=>view.ui.hint(r.reason));
platform.keyboard(key=>{if(key==='Escape')action('pause');if(key.toLowerCase()==='d')input.debug=!input.debug;if(key.toLowerCase()==='m')action('sound');});platform.lifecycle(()=>{if(game.state==='playing'||game.state==='tutorial'){game.pause();input.cancel();}});quality();
let fps=60;
app.ticker.add(ticker=>{const delta=Math.max(0,ticker.elapsedMS/1000);fps=fps*.96+(1/Math.max(delta,.001))*.04;
 const before=game.clock.world;const paused=['paused','upgrade'].includes(game.state);
 if(!paused){const first=input.drawing?Math.min(delta,Math.max(0,COMBAT.drawLimit-input.drawAge)):delta;game.advance(first,input.drawing);input.update(first);if(first<delta){game.advance(delta-first,input.drawing);input.update(delta-first);}}
 if(!game.active&&input.drawing)input.cancel();
 for(const e of game.drain()){view.event(e);if(e.type==='cast')platform.audio(e.rune==='z'?'z':e.rune==='line'||e.rune==='triangle'||e.rune==='ink'?'line':'circle');if(e.type==='strike')platform.audio('hit');if(['hurt','win','lose'].includes(e.type))platform.audio(e.type as 'hurt'|'win'|'lose');if(e.type==='win'||e.type==='lose'){view.ui.best=Math.max(view.ui.best,game.score);platform.write('linghu-best',String(view.ui.best));spirit+=Math.floor(game.score/10)+(e.type==='win'?100:0);platform.write('linghu-spirit',String(spirit));view.ui.spirit=spirit;}}
 const worldDt=game.active||paused?game.clock.world-before:delta;view.update(game,input,worldDt,fps,delta);
});
// Deliberately gated QA hooks. No test controls appear in normal play or production.
if(import.meta.env.DEV&&platform.query('qa')==='1'){
 Object.assign(window,{__LINGHU__:{game,view,input,app,action,advance:(seconds:number)=>{for(let i=0;i<seconds*60;i++)game.update(1/60);},spawn:(kind:'ink'|'crow'|'oni',x:number,y:number)=>game.spawn(kind,{x,y})}});
 const scene=platform.query('scene');if(scene){const {rehearse}=await import('./core/qa');rehearse(scene,game,view,input);app.ticker.stop();app.render();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));app.canvas.dataset.qaReady=scene;}
}
