import {InkDebugPanel} from './ui/ink-debug';
import {BrushPanel} from './ui/brush-panel';
import {frameDelta} from './gameplay/frame-budget';
import {Application,type Spritesheet,type Texture} from 'pixi.js';
import type {PlatformAdapter} from './platform/adapter';
import {Game} from './gameplay/game';
import {COMBAT} from './gameplay/config';
import {GameView} from './rendering/view';
import {InputController} from './input/controller';
import type {Action} from './ui/interface';
import {ArchiveUI} from './ui/archive';
import {PracticeUI} from './ui/practice';
import {castPracticeRune} from './gameplay/practice-cast';
import {ProgressTracker} from './progress/tracker';
export async function startGame(platform:PlatformAdapter,options:Partial<Parameters<Application['init']>[0]>={},resize?:(app:Application,view:GameView)=>void,onStartup?:(stage:string)=>void){
onStartup?.('初始化画布与 WebGL');
const app=new Application();await app.init({width:720,height:1280,resolution:platform.pixelRatio(),autoDensity:true,antialias:true,background:0x192027,preference:'webgl',...options});
const environmentNames=['sky','sun','far_mountains','valley','shrines','arena','foreground','branches'];
onStartup?.('加载角色图集与山海背景');
const [atlas,...environmentTextures]=await Promise.all([platform.loadAsset<Spritesheet>('/art/atlas.json'),...environmentNames.map(name=>platform.loadAsset<Texture>('/art/environment/'+name+'.png'))]);
const environment=Object.fromEntries(environmentNames.map((name,i)=>[name,environmentTextures[i]])) as Record<string,Texture>;
onStartup?.('创建角色、特效与主菜单');
platform.mount(app.canvas);const game=new Game();const tracker=new ProgressTracker(platform.read.bind(platform),platform.write.bind(platform));const previewMode=import.meta.env.DEV&&(platform.query('qa')==='1'||platform.query('lab')==='1');if(!previewMode)game.onProgress=(type,payload,critical)=>tracker.emit(type,payload,critical);let spirit=Number(platform.read('linghu-spirit')||0);game.cultivation=Math.min(10,Number(platform.read('linghu-cultivation')||0));let muted=platform.read('linghu-muted')==='true',low=platform.read('linghu-quality')==='low';
let input:InputController;
let inkDebug:InkDebugPanel|undefined;
let resetResourceClock=false;
let archive:ArchiveUI;
let practiceUI:PracticeUI;
let brushPanel:BrushPanel;
let lab:{beforeFrame:(dt?:number)=>void;ownsSimulation?:()=>boolean;afterCast:(r:import('./input/recognizer').Recognition)=>void}|undefined;
const view=new GameView(atlas.textures,environment,action);view.ui.tracker=tracker;view.ui.canDiagnostics=!!platform.diagnostics;game.pen.select(platform.read('linghu-brush-skin')??'cinnabar');game.pen.onSelect=id=>{platform.write('linghu-brush-skin',id);};brushPanel=new BrushPanel(game.pen,()=>input?.cancel());archive=new ArchiveUI(tracker,()=>brushPanel.open('collection'));view.root.addChild(archive.root);view.ui.spirit=spirit;view.ui.cultivation=game.cultivation;view.ui.best=Number(platform.read('linghu-best')||0);view.ui.muted=muted;view.ui.low=low;view.ui.show('menu',game);platform.setMuted(muted);app.stage.addChild(view.root);
function quality(){view.particles.quality=low?'low':'high';app.renderer.resolution=low?1:platform.pixelRatio();if(resize)resize(app,view);else app.renderer.resize(720,1280);view.ui.low=low;}
function action(a:Action){if(lab&&['cultivate','start','restart','teach','menu','practice','endless'].includes(a)){view.ui.hint('测试场请使用右侧控制栏');return;}if(a==='diagnostics'){platform.diagnostics?.();return;}platform.recordAction?.(a+':before',game.state);app.ticker.start();platform.unlockAudio();platform.audio('tap');if(a==='settings'||a==='profile'||a==='closePanel'){view.ui.menuNotice='';view.ui.menuPanel=a==='closePanel'?null:a;view.ui.show(game.state,game);}if(a==='archive')archive.open('home');if(a==='achievements')archive.open('achievements');if(a==='cultivationArchive')archive.open('cultivation');if(a==='journal')archive.open('journal');if(a.startsWith('choose')){game.choose(Number(a.slice(-1)));input?.cancel();view.ui.show(game.state,game);}if(a==='cultivate'){if(spirit>=100&&game.cultivation<10){view.ui.menuNotice='';spirit-=100;game.cultivation++;platform.write('linghu-spirit',String(spirit));platform.write('linghu-cultivation',String(game.cultivation));view.ui.spirit=spirit;view.ui.cultivation=game.cultivation;view.ui.show('menu',game);}else {view.ui.menuNotice=game.cultivation>=10?'修行已至圆满':`灵玉 ${spirit} / 100 · 完成试炼积累`;view.ui.show('menu',game);}}if(a==='start'||a==='restart'||a==='teach'||a==='practice'||a==='endless'){view.ui.menuPanel=null;const endless=a==='endless'||(a==='restart'&&game.endless);const practice=a==='practice'||(a==='restart'&&game.practice);game.start(a==='teach',practice,endless);input?.cancel();brushPanel.close();archive.close();practiceUI?.reset();view.begin();view.ui.show(game.state,game);if(practice)for(let i=0;i<8;i++)game.spawn(i%3===0?'crow':'ink');}if(a==='pause'||a==='resume'){resetResourceClock=true;game.pause();input?.cancel();}if(a==='menu'){view.ui.menuPanel=null;brushPanel.close();game.menu();practiceUI?.reset();input?.cancel();view.animator.clear();view.particles.clear();}if(a==='sound'){muted=!muted;platform.setMuted(muted);platform.write('linghu-muted',String(muted));view.ui.muted=muted;view.ui.show(game.state,game);}if(a==='quality'){low=!low;platform.write('linghu-quality',low?'low':'high');quality();view.ui.show(game.state,game);}if(a==='debug'){input.debug=!input.debug;view.ui.debug=input.debug;view.ui.show(game.state,game);}platform.recordAction?.(a,game.state);}
input=new InputController(platform,app.canvas,()=>game.active,r=>{platform.unlockAudio();const ok=game.cast(r);if(ok&&r.rune!=='ink')lab?.afterCast(r);if(ok)view.ui.hint(r.rune==='line'?'出刀 · 沿划痕斩击':r.reason);return ok;},e=>inkDebug?.handle(e)||brushPanel.handle(e)||practiceUI?.handle(e)||archive.handle(e)||(e.kind==='down'&&view.ui.hit(e)),r=>view.ui.hint('未成符 · 已用灵墨保留'),game.pen,game.ink);
if(import.meta.env.DEV){inkDebug=new InkDebugPanel(game,input);view.root.addChild(inkDebug.root);}

practiceUI=new PracticeUI(game,()=>input.cancel(),rune=>{platform.unlockAudio();if(castPracticeRune(game,rune))view.ui.hint('随机方向 · 自由试符');},()=>brushPanel.open('tuning'),()=>input);view.root.addChild(practiceUI.root,brushPanel.root);
platform.keyboard(key=>{if(key==='Escape'){if(brushPanel.visible)brushPanel.close();else if(archive.visible)archive.close();else if(view.ui.menuPanel)action('closePanel');else if(game.active||game.state==='paused')action('pause');}if(key.toLowerCase()==='d')input.debug=!input.debug;if(key.toLowerCase()==='m')action('sound');});platform.lifecycle(()=>{resetResourceClock=true;input.cancel();if(game.state==='playing'||game.state==='tutorial')game.pause();tracker.save();});quality();
let fps=60;
app.ticker.add(ticker=>{const updateStart=performance.now();const rawDelta=Math.max(0,ticker.elapsedMS/1000),delta=frameDelta(rawDelta);const frame={intervalMs:rawDelta*1000,updateMs:0,state:game.state,enemies:game.enemies.length,skills:game.skills.map(s=>s.rune+':'+(s.testLevel??1)),low,completed:false};platform.recordFrame?.(frame);fps=fps*.96+(1/Math.max(rawDelta,.001))*.04;
 input.minY=Math.max(175,view.ui.hud.y+220);lab?.beforeFrame(delta);
 const before=game.clock.world;const paused=['paused','upgrade'].includes(game.state);
 const resourceDt=resetResourceClock?0:rawDelta;resetResourceClock=false;
 if(!paused&&!lab?.ownsSimulation?.()){
  const first=input.drawing?Math.min(resourceDt,Math.max(0,COMBAT.drawLimit-input.drawAge)):resourceDt;
  game.advance(Math.min(delta,first),input.drawing);game.ink.update(first,game.active);input.update(first);
  if(first<resourceDt){game.advance(Math.max(0,delta-Math.min(delta,first)),input.drawing);game.ink.update(resourceDt-first,game.active);input.update(resourceDt-first);}
 }
 if(paused)input.cancel();
 if(!game.active&&input.drawing)input.cancel();
 for(const e of game.drain()){view.event(e);if(e.type==='cast'&&e.rune!=='ink')platform.audio(e.rune==='z'?'z':e.rune==='line'||e.rune==='triangle'?'line':'circle');if(e.type==='strike')platform.audio('hit');if(['hurt','win','lose'].includes(e.type))platform.audio(e.type as 'hurt'|'win'|'lose');if(e.type==='win'||e.type==='lose'){view.ui.best=Math.max(view.ui.best,game.score);platform.write('linghu-best',String(view.ui.best));spirit+=Math.floor(game.score/10)+(e.type==='win'?100:0);platform.write('linghu-spirit',String(spirit));view.ui.spirit=spirit;}}
 for(const notice of tracker.drainNotifications())if(!archive.visible)view.ui.hint(notice);if(tracker.saveFailed&&!archive.visible)view.ui.hint('游历记录暂未保存 · 请检查设备存储');
 if(game.active&&!game.practice)tracker.snapshot(game.time,game.score);
 const worldDt=game.active||paused?game.clock.world-before:delta;view.update(game,input,worldDt,fps,delta);archive.update(delta);practiceUI.root.y=view.ui.footer.y;practiceUI.update();view.ui.footer.visible=view.ui.hud.visible&&!game.practice;const penViewport=view.ui.brushViewport;brushPanel.resize(penViewport.top,penViewport.height);brushPanel.update(input);inkDebug?.update(input.debug&&game.active&&!brushPanel.visible&&!archive.visible);if(lab)view.ui.timer.text='∞';
frame.updateMs=performance.now()-updateStart;frame.completed=true;platform.finishFrame?.();
});
if(import.meta.env.DEV&&platform.query('lab')==='1'){game.ink.setUnlimited(true);const {setupLab}=await import('./core/lab');lab=setupLab(game,view,input);}
// Deliberately gated QA hooks. No test controls appear in normal play or production.
if(import.meta.env.DEV&&platform.query('qa')==='1'){
 Object.assign(window,{__LINGHU__:{game,view,input,app,action,brushPanel,practiceUI,archive,advance:(seconds:number)=>{for(let i=0;i<seconds*60;i++)game.update(1/60);},spawn:(kind:'ink'|'crow'|'oni',x:number,y:number)=>game.spawn(kind,{x,y})}});
 const scene=platform.query('scene');if(scene){const {rehearse}=await import('./core/qa');rehearse(scene,game,view,input);app.ticker.stop();app.render();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));app.canvas.dataset.qaReady=scene;}
}

return {app,game,view,input,action};
}
