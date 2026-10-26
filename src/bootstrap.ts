import {MountainUI} from './ui/mountain-run';
import {HualingPlayUI} from './ui/hualing-play';
import {BrushUpgradeUI} from './ui/brush-upgrades';
import {HualingComboUI} from './ui/hualing-combo';
import {HualingUI} from './ui/hualing';
import {FunctionalRelicUI} from './ui/functional-relics';
import {InkDebugPanel} from './ui/ink-debug';
import {BrushPanel} from './ui/brush-panel';
import {StaticArtAtlas} from './rendering/static-art-atlas';
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
const [atlas,dragonHead,inkGuardian,...environmentTextures]=await Promise.all([platform.loadAsset<Spritesheet>('/art/atlas.json'),platform.loadAsset<Texture>('/art/ink-dragon-head-v2.png'),platform.loadAsset<Texture>('/art/ink-guardian-v1.png'),...environmentNames.map(name=>platform.loadAsset<Texture>('/art/environment/'+name+'.png'))]);
dragonHead.source.autoGenerateMipmaps=true;dragonHead.source.scaleMode='linear';dragonHead.source.style.mipmapFilter='linear';
const environment=Object.fromEntries(environmentNames.map((name,i)=>[name,environmentTextures[i]])) as Record<string,Texture>;
onStartup?.('创建角色、特效与主菜单');
platform.mount(app.canvas);const game=new Game();const tracker=new ProgressTracker(platform.read.bind(platform),platform.write.bind(platform));const previewMode=import.meta.env.DEV&&(platform.query('qa')==='1'||platform.query('lab')==='1');if(!previewMode)game.onProgress=(type,payload,critical)=>tracker.emit(type,payload,critical);let spirit=Number(platform.read('linghu-spirit')||0);game.cultivation=Math.min(10,Number(platform.read('linghu-cultivation')||0));let muted=platform.read('linghu-muted')==='true',low=platform.read('linghu-quality')==='low';
let mountainUI:MountainUI;let input:InputController;let playUI:HualingPlayUI;
let inkDebug:InkDebugPanel|undefined;
let resetResourceClock=false;
let archive:ArchiveUI;
let practiceUI:PracticeUI;let hualingUI:HualingUI;let brushUpgradeUI:BrushUpgradeUI;
let relicUI:FunctionalRelicUI|undefined;
let brushPanel:BrushPanel;
let lab:{beforeFrame:(dt?:number)=>void;ownsSimulation?:()=>boolean;afterCast:(r:import('./input/recognizer').Recognition)=>void}|undefined;
const view=new GameView(atlas.textures,environment,action);view.hualing.dragons.texture=dragonHead;view.inkTrail.rituals.texture=inkGuardian;view.scrollLandscape.setChapterLoader(chapter=>platform.loadAsset('/art/chapters/'+chapter+'-landscape.json'));view.chapterBosses.renderer=app.renderer;view.chapterBosses.loader=chapter=>platform.loadAsset('/art/bosses/'+chapter+'-boss.json');view.elites.loader=kind=>platform.loadAsset('/art/elites/'+kind+'.png');view.ui.tracker=tracker;view.ui.canDiagnostics=!!platform.diagnostics;game.pen.select(platform.read('linghu-brush-skin')??'cinnabar');game.pen.onSelect=id=>{platform.write('linghu-brush-skin',id);};brushPanel=new BrushPanel(game.pen,()=>input?.cancel());archive=new ArchiveUI(tracker,()=>brushPanel.open('collection'));view.root.addChild(archive.root);view.ui.spirit=spirit;view.ui.cultivation=game.cultivation;view.ui.best=Number(platform.read('linghu-best')||0);view.ui.muted=muted;view.ui.low=low;view.ui.show('menu',game);platform.setMuted(muted);app.stage.addChild(view.root);
function quality(){view.particles.quality=low?'low':'high';app.renderer.resolution=low?1:platform.pixelRatio();if(resize)resize(app,view);else app.renderer.resize(720,1280);view.ui.low=low;}
function action(a:Action){if(lab&&['cultivate','start','restart','teach','menu','practice','interactionPractice','hualingPractice','endless'].includes(a)){view.ui.hint('测试场请使用右侧控制栏');return;}if(a==='diagnostics'){platform.diagnostics?.();return;}platform.recordAction?.(a+':before',game.state);app.ticker.start();platform.unlockAudio();platform.audio('tap');if(a==='start'){mountainUI.open();return;}if(a==='restart'&&game.campaign.levelId!==null){beginMountain(game.campaign.levelId);return;}if(a==='settings'||a==='profile'||a==='closePanel'){view.ui.menuNotice='';view.ui.menuPanel=a==='closePanel'?null:a;view.ui.show(game.state,game);}if(a==='archive')archive.open('home');if(a==='achievements')archive.open('achievements');if(a==='cultivationArchive')archive.open('cultivation');if(a==='journal')archive.open('journal');if(a.startsWith('choose')){game.choose(Number(a.slice(-1)));input?.cancel();view.ui.show(game.state,game);}if(a==='cultivate'){if(spirit>=100&&game.cultivation<10){view.ui.menuNotice='';spirit-=100;game.cultivation++;platform.write('linghu-spirit',String(spirit));platform.write('linghu-cultivation',String(game.cultivation));view.ui.spirit=spirit;view.ui.cultivation=game.cultivation;view.ui.show('menu',game);}else {view.ui.menuNotice=game.cultivation>=10?'修行已至圆满':`灵玉 ${spirit} / 100 · 完成试炼积累`;view.ui.show('menu',game);}}if(a==='restart'||a==='teach'||a==='practice'||a==='interactionPractice'||a==='hualingPractice'||a==='endless'){view.ui.menuPanel=null;const endless=a==='endless'||(a==='restart'&&game.endless);const interaction=a==='interactionPractice'||(a==='restart'&&game.interactionPractice);const hualing=a==='hualingPractice'||(a==='restart'&&game.hualingPractice);const practice=a==='practice'||interaction||hualing||(a==='restart'&&game.practice);game.start(a==='teach',practice,endless,interaction,hualing);input?.cancel();brushPanel.close();archive.close();practiceUI?.reset();relicUI?.reset();view.begin();view.ui.show(game.state,game);hualingUI?.reset();if(hualing)game.seedHualingEnemies();else if(practice)for(let i=0;i<8;i++)game.spawn(i%3===0?'crow':'ink');}if(a==='pause'||a==='resume'){resetResourceClock=true;game.pause();input?.cancel();}if(a==='menu'){view.ui.menuPanel=null;brushPanel.close();game.menu();practiceUI?.reset();relicUI?.reset();input?.cancel();view.animator.clear();view.particles.clear();}if(a==='sound'){muted=!muted;platform.setMuted(muted);platform.write('linghu-muted',String(muted));view.ui.muted=muted;view.ui.show(game.state,game);}if(a==='quality'){low=!low;platform.write('linghu-quality',low?'low':'high');quality();view.ui.show(game.state,game);}if(a==='debug'){input.debug=!input.debug;view.ui.debug=input.debug;view.ui.show(game.state,game);}platform.music?.(game.hualingPractice&&game.active,game.hualing.journey.automatic?'journey':game.hualing.journey.stage);platform.recordAction?.(a,game.state);}
input=new InputController(platform,app.canvas,()=>game.active&&!mountainUI?.opened&&!game.campaign.supportPanel&&!(game.hualingPractice&&game.hualing.upgrades.blocked),r=>{platform.unlockAudio();const ok=game.cast(r);if(ok&&!r.fallback&&r.rune!=='ink')lab?.afterCast(r);if(ok)view.ui.hint(r.rune==='line'?'出刀 · 沿划痕斩击':r.reason);else if(game.interactionPractice)view.ui.hint(game.interactions.lastReason);return ok;},e=>mountainUI?.handle(e)||playUI?.handle(e)||brushUpgradeUI?.handle(e)||hualingUI?.handle(e)||relicUI?.handle(e)||inkDebug?.handle(e)||brushPanel.handle(e)||practiceUI?.handle(e)||archive.handle(e)||(e.kind==='down'&&!(game.hualingPractice&&playUI?.formal&&game.active)&&view.ui.hit(e)),r=>view.ui.hint('未成符 · 已用灵墨保留'),game.pen,game.ink,()=>game.interactionPractice||game.hualingPractice);
input.simpleBrush=()=>game.hualingPractice;
input.onStrokeSegment=(a,b)=>{
 game.strokeHualing(a,b);
 if(game.hualingPractice&&game.active&&!game.hualing.selected&&!game.hualing.upgrades.blocked)view.pen.liveFX.trace(a,b,input.gestureId,input.drawAge,game.hualing.upgrades.width);
};
input.onSimpleStroke=phase=>{if(phase==='begin')game.beginHualingStroke();else game.endHualingStroke(phase==='cancel');};
input.liveInput={handle:e=>(game.hualingPractice&&game.active&&game.hualing.handle(e))||game.handleFunctionalInput(e)||game.handleBarrageInput(e)||(game.active&&game.practice&&game.burningSea.handle(e,game.interactions.bounds)),cancel:()=>{game.hualing.cancelInput();game.burningSea.cancelStroke();game.talismanBarrage.cancelInput();game.functionalRelics.cancelInput();}};
if(import.meta.env.DEV){inkDebug=new InkDebugPanel(game,input);view.root.addChild(inkDebug.root);}

practiceUI=new PracticeUI(game,()=>input.cancel(),rune=>{platform.unlockAudio();if(castPracticeRune(game,rune))view.ui.hint('随机方向 · 自由试符');},()=>brushPanel.open('tuning'),()=>input);view.root.addChild(practiceUI.root,brushPanel.root);
hualingUI=new HualingUI(game,()=>input.cancel(),()=>action('restart'),()=>action('pause'));view.root.addChild(hualingUI.root);
playUI=new HualingPlayUI(game,()=>input.cancel(),()=>action('pause'),formal=>{platform.write('hualing-ui',formal?'formal':'test');brushPanel.close();archive.close();},dragonHead);playUI.formal=platform.read('hualing-ui')==='formal';view.root.addChild(playUI.root);
function beginMountain(id:number){input.cancel();game.startMountainLevel(id);brushPanel.close();archive.close();practiceUI.reset();relicUI?.reset();hualingUI.reset();view.begin();view.ui.show(game.state,game);}
try{const saved=JSON.parse(platform.read('hualing-completed-levels')||'[]');if(Array.isArray(saved))game.campaign.completed=new Set(saved.filter((id:unknown)=>typeof id==='number'&&id>=0&&id<40));}catch{}
mountainUI=new MountainUI(game,()=>input.cancel(),beginMountain,()=>action('menu'),()=>action('pause'));
mountainUI.landscape.setChapterLoader(chapter=>platform.loadAsset('/art/chapters/'+chapter+'-landscape.json'));
const comboUI=new HualingComboUI(game);view.root.addChild(comboUI.root);
brushUpgradeUI=new BrushUpgradeUI(game,()=>input.cancel());view.root.addChild(brushUpgradeUI.root);
relicUI=new FunctionalRelicUI(game,()=>input.cancel(),()=>brushPanel.visible||archive.visible||practiceUI.isPicking,()=>action('pause'));view.root.addChild(relicUI.root);
view.root.addChild(mountainUI.root);
platform.keyboard(key=>{if(key==='Escape'){if(brushPanel.visible)brushPanel.close();else if(archive.visible)archive.close();else if(view.ui.menuPanel)action('closePanel');else if(game.active||game.state==='paused'||game.state==='reviving')action('pause');}if(key.toLowerCase()==='d')input.debug=!input.debug;if(key.toLowerCase()==='m')action('sound');});platform.lifecycle(()=>{platform.music?.(false);resetResourceClock=true;input.cancel();if(game.state==='playing'||game.state==='tutorial'||game.state==='reviving')game.pause();tracker.save();});quality();
if(platform.query('mode')==='hualing')action('hualingPractice');
if(platform.query('mode')==='mountains')action('start');
view.circles.atlas=new StaticArtAtlas(app.renderer);
let fps=60;let thunderSoundActive=false,thunderSoundGesture=-1,thunderSoundLength=0,lastThunderSound=-Infinity;
app.ticker.add(ticker=>{const updateStart=performance.now();const rawDelta=Math.max(0,ticker.elapsedMS/1000),delta=frameDelta(rawDelta);const frame={fallbacks:game.freeSlashes.totalCasts,intervalMs:rawDelta*1000,updateMs:0,state:game.state,enemies:game.enemies.length,skills:game.skills.map(s=>s.rune+':'+(s.testLevel??1)),low,completed:false};platform.recordFrame?.(frame);fps=fps*.96+(1/Math.max(rawDelta,.001))*.04;
 const formal=game.hualingPractice&&(playUI.formal||game.campaign.levelId!==null);input.minY=formal?view.ui.hud.y+150:Math.max(175,view.ui.hud.y+220);input.maxY=formal?1120+view.ui.footer.y:game.hualingPractice?990+view.ui.footer.y:game.functionalRelics.enabled?Math.min(1180,756+view.ui.footer.y):game.interactionPractice?Math.min(1180,1000+view.ui.footer.y):1180;game.interactions.bounds={left:0,right:720,top:input.minY,bottom:input.maxY};game.hualing.bounds={left:26,right:694,top:formal?input.minY+22:Math.max(input.minY+74,324+view.ui.hud.y),bottom:input.maxY-28};lab?.beforeFrame(delta);
 platform.music?.(game.hualingPractice&&game.active,game.hualing.journey.automatic?'journey':game.hualing.journey.stage);
 const before=game.clock.world;const paused=['paused','upgrade'].includes(game.state)||mountainUI.opened;
 const resourceDt=resetResourceClock?0:rawDelta;resetResourceClock=false;
 if(!paused&&!lab?.ownsSimulation?.()){
  const first=input.drawing&&!game.hualingPractice?Math.min(resourceDt,Math.max(0,COMBAT.drawLimit-input.drawAge)):resourceDt;
  game.advance(Math.min(delta,first),input.drawing,first);game.ink.update(Math.min(first,game.lastResourceDt),game.active);input.update(first);
  if(first<resourceDt){game.advance(Math.max(0,delta-Math.min(delta,first)),input.drawing,resourceDt-first);game.ink.update(Math.min(resourceDt-first,game.lastResourceDt),game.active);input.update(resourceDt-first);}
 }
 const eliteTone=game.hualing.elites.field.takeTone();if(game.hualingPractice&&game.active&&eliteTone)platform.audio(eliteTone==='break'?'bossBreak':eliteTone==='impact'?'paperBreak':'bossParry');
 const sprayAudio=game.hualing.upgrades;
 const carpTone=sprayAudio.carp.takeTone();if(game.hualingPractice&&game.active&&carpTone)platform.audio(carpTone==='cast'?(sprayAudio.levels.spray>=3?'carpCast':'sprayHigh'):'carpImpact');
 const inkTone=sprayAudio.trail.rituals.takeTone();if(game.hualingPractice&&game.active&&inkTone)platform.audio(inkTone==='summon'?'inkSummon':inkTone==='form'?'inkSeal':inkTone==='slam'?'inkSlam':'inkBlock');
 const wideTone=sprayAudio.takeWideTone();if(game.hualingPractice&&game.active&&wideTone)platform.audio(wideTone==='evolve'?'combo4':'wideCast');
 const thunderAudio=game.hualing.thunder,thunderPlaying=game.hualingPractice&&game.active&&thunderAudio.active;
 if(thunderPlaying&&!thunderSoundActive)platform.audio('thunderOn');
 if(thunderPlaying&&input.drawing){
  if(thunderSoundGesture!==input.gestureId){thunderSoundGesture=input.gestureId;thunderSoundLength=0;}
  if(input.totalPathLength-thunderSoundLength>=26&&thunderAudio.clock-lastThunderSound>=.15){platform.audio('thunderStroke');thunderSoundLength=input.totalPathLength;lastThunderSound=thunderAudio.clock;}
 }
 if(!thunderPlaying){thunderSoundGesture=-1;thunderSoundLength=0;lastThunderSound=-Infinity;}thunderSoundActive=thunderPlaying;
 if(paused||game.campaign.supportPanel||mountainUI.opened||game.hualingPractice&&game.hualing.upgrades.blocked)input.cancel();
 if(!game.active&&input.drawing)input.cancel();
 for(const e of game.drain()){view.event(e);if(e.type==='bossCue')platform.audio(e.kind==='parry'?(e.chain&&e.chain>=3&&e.chain%3===0?'combo4':'bossParry'):e.kind==='release'||e.kind==='attack'?({valley:'bossFlame',sea:'bossWave',palace:'bossStar',snow:'bossFrost'} as const)[e.chapter]:e.kind==='intro'?'bossIntro':e.kind==='step'||e.kind==='charge'?'bossMark':e.kind==='break'||e.kind==='victory'?'bossBreak':'bossDanger');if(e.type==='talismanBarrage')platform.audio(e.kind==='start'?'z':'line');if(e.type==='functionalRelic'){platform.audio(e.kind==='stop'?'z':'circle');if(e.kind==='reviveStart')input.cancel();}if(e.type==='cast'&&e.rune!=='ink')platform.audio(e.rune==='z'?'z':e.rune==='line'||e.rune==='triangle'?'line':'circle');if(e.type==='freeStroke')platform.audio('line');if(e.type==='strike'&&game.hualingPractice&&game.hualing.thunder.active)platform.audio('thunderHit');if(e.type==='strike')platform.audio(game.hualingPractice?(e.dead?'paperBreak':'paperHit'):'hit');if(e.type==='lineInteraction'||e.type==='burningSeaExplosion')platform.audio('hit');if(['hurt','win','lose'].includes(e.type))platform.audio(e.type as 'hurt'|'win'|'lose');if(e.type==='win'&&game.campaign.levelId!==null)platform.write('hualing-completed-levels',JSON.stringify([...game.campaign.completed]));if(e.type==='win'||e.type==='lose'){view.ui.best=Math.max(view.ui.best,game.score);platform.write('linghu-best',String(view.ui.best));spirit+=Math.floor(game.score/10)+(e.type==='win'?100:0);platform.write('linghu-spirit',String(spirit));view.ui.spirit=spirit;}}
 const comboTone=game.hualing.combo.takeTone();if(game.hualingPractice&&comboTone)platform.audio((['combo1','combo2','combo3','combo4'] as const)[comboTone-1]);
 for(const notice of tracker.drainNotifications())if(!archive.visible)view.ui.hint(notice);if(tracker.saveFailed&&!archive.visible)view.ui.hint('游历记录暂未保存 · 请检查设备存储');
 if(game.active&&!game.practice)tracker.snapshot(game.time,game.score);
 const worldDt=game.active||paused||game.state==='reviving'?game.clock.world-before:delta;view.update(game,input,worldDt,fps,delta);archive.update(delta);practiceUI.root.y=view.ui.footer.y;practiceUI.update();hualingUI.update(view.ui.footer.y,view.ui.hud.y);playUI.update(view.ui.footer.y,view.ui.hud.y);if(formal){hualingUI.root.visible=false;view.ui.hud.visible=false;view.ui.counter.visible=false;}view.hualing.compactUI=formal;brushUpgradeUI.compactUI=formal;comboUI.update();brushUpgradeUI.update(view.ui.hud.y);relicUI?.update(view.ui.footer.y,view.ui.brushViewport.top,view.ui.brushViewport.top+view.ui.brushViewport.height);view.ui.footer.visible=view.ui.hud.visible&&!game.practice;const penViewport=view.ui.brushViewport;brushPanel.resize(penViewport.top,penViewport.height);brushPanel.update(input);inkDebug?.update(!formal&&input.debug&&game.active&&!brushPanel.visible&&!archive.visible);if(lab)view.ui.timer.text='∞';
if(game.campaign.levelId!==null){playUI.root.visible=false;if(['win','lose'].includes(game.state))view.ui.overlay.visible=false;else view.ui.overlay.visible=true;}else view.ui.overlay.visible=true;mountainUI.update(view.ui.hud.y,view.ui.footer.y);
frame.updateMs=performance.now()-updateStart;frame.completed=true;platform.finishFrame?.();
});
if(import.meta.env.DEV&&platform.query('lab')==='1'){game.ink.setUnlimited(true);const {setupLab}=await import('./core/lab');lab=setupLab(game,view,input);}
// Deliberately gated QA hooks. No test controls appear in normal play or production.
if(import.meta.env.DEV&&platform.query('qa')==='1'){
 Object.assign(window,{__LINGHU__:{game,view,input,app,action,brushPanel,practiceUI,hualingUI,comboUI,playUI,brushUpgradeUI,relicUI,archive,mountainUI,beginMountain,advance:(seconds:number)=>{for(let i=0;i<seconds*60;i++)game.update(1/60);},spawn:(kind:'ink'|'crow'|'oni',x:number,y:number)=>game.spawn(kind,{x,y})}});
 const scene=platform.query('scene');if(scene){const {rehearse}=await import('./core/qa');rehearse(scene,game,view,input);app.ticker.stop();app.render();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));app.canvas.dataset.qaReady=scene;}
}

return {app,game,view,input,action};
}
