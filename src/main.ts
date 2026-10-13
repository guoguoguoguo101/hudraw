import './style.css';
import {BrowserAdapter} from './platform/browser';
import {startGame} from './bootstrap';
import {gameViewport} from './platform/viewport';
import type {Application} from 'pixi.js';
import type {GameView} from './rendering/view';
function resize(app:Application,view:GameView){
 const root=document.querySelector<HTMLElement>('#app')!,r=root.getBoundingClientRect(),css=getComputedStyle(root);
 const rect=gameViewport(r.width,r.height,parseFloat(css.getPropertyValue('--safe-top'))||0,parseFloat(css.getPropertyValue('--safe-bottom'))||0);
 app.renderer.resize(rect.screenWidth,rect.screenHeight);app.stage.scale.set(rect.scale);app.stage.position.set(rect.x,rect.y);view.resize(rect);
}
const {app,view,input}=await startGame(new BrowserAdapter(),{},resize);
new ResizeObserver(()=>{input.cancel();resize(app,view);}).observe(document.querySelector('#app')!);
