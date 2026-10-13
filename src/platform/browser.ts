import {worldPoint} from '../input/coordinates';
import type {PlatformAdapter,InputEvent,Sound} from './adapter';
import {Synth} from '../audio/synth';
import {Assets} from 'pixi.js';
export class BrowserAdapter implements PlatformAdapter{
 synth=new Synth();
 loadAsset<T>(url:string){return Assets.load<T>(url);}
 mount(canvas:HTMLCanvasElement){const root=document.querySelector('#app')!;root.replaceChildren(canvas);canvas.setAttribute('aria-label','灵狐画符游戏画布；在中央区域拖动画符；Escape 暂停，D 显示手势调试');}
 input(canvas:HTMLCanvasElement,fn:(e:InputEvent)=>void){let active:number|null=null;const convert=(event:PointerEvent,kind:InputEvent['kind'])=>{const r=canvas.getBoundingClientRect();return {...worldPoint({x:event.clientX,y:event.clientY},{x:r.left,y:r.top,width:r.width,height:r.height}),id:event.pointerId,kind};};const down=(e:PointerEvent)=>{if(active!==null)return;active=e.pointerId;canvas.setPointerCapture(e.pointerId);e.preventDefault();fn(convert(e,'down'));};const move=(e:PointerEvent)=>{if(e.pointerId===active)fn(convert(e,'move'));};const up=(e:PointerEvent)=>{if(e.pointerId!==active)return;fn(convert(e,'up'));active=null;};const cancel=(e:PointerEvent)=>{if(e.pointerId!==active)return;fn(convert(e,'cancel'));active=null;};canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);return ()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);};}
 keyboard(fn:(key:string)=>void){window.addEventListener('keydown',e=>{if(['Escape','d','D','m','M'].includes(e.key)){e.preventDefault();fn(e.key);}});}
 lifecycle(fn:()=>void){window.addEventListener('blur',fn);document.addEventListener('visibilitychange',()=>{if(document.hidden)fn();});}
 read(key:string){try{return localStorage.getItem(key);}catch{return null;}}
 write(key:string,value:string){try{localStorage.setItem(key,value);return true;}catch{return false;}}
 audio(sound:Sound){this.synth.play(sound);}
 unlockAudio(){this.synth.unlock();}
 setMuted(muted:boolean){this.synth.mute(muted);}
 query(key:string){return new URLSearchParams(location.search).get(key);}
 pixelRatio(){return Math.min(window.devicePixelRatio||1,1.5);}
}
