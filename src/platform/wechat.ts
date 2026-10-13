import {ImageSource,Spritesheet,Texture,type SpritesheetData} from 'pixi.js';
import {Synth} from '../audio/synth';
import {worldPoint} from '../input/coordinates';
import type {CanvasSurface,InputEvent,PlatformAdapter,Sound} from './adapter';
import {wechat as wx,type TouchHandler} from './wechat-api';
import {WechatDiagnostics} from './wechat-diagnostics';
import type {FrameSample} from './frame-sample';

export function readPackageText(filePath:string):Promise<string>{
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('文件加载超时：'+filePath)),10000);
  try{wx.getFileSystemManager().readFile({filePath,encoding:'utf8',success:r=>{clearTimeout(timeout);resolve(r.data);},fail:error=>{clearTimeout(timeout);reject(new Error('文件加载失败：'+filePath+' '+JSON.stringify(error)));}});}catch(error){clearTimeout(timeout);reject(error);}
 });
}
export function viewport(){
 const {windowWidth:w,windowHeight:h}=wx.getWindowInfo(),scale=Math.min(w/720,h/1280);
 return {x:(w-720*scale)/2,y:(h-1280*scale)/2,width:720*scale,height:1280*scale,scale,screenWidth:w,screenHeight:h};
}
export class WechatAdapter implements PlatformAdapter{
 diagnostic=new WechatDiagnostics();
 diagnostics(){this.diagnostic.copy();}
 recordFrame(frame:FrameSample){this.diagnostic.record(frame);}
 finishFrame(){this.diagnostic.checkpoint();}
 recordAction(action:string,state:string){this.diagnostic.action(action,state);}
 private assets=new Map<string,Promise<unknown>>();
 private synth: Synth|null=wx.createWebAudioContext?new Synth(()=>wx.createWebAudioContext!()):null;
 private audioFailed=false;
 mount(_canvas:CanvasSurface){}
 loadAsset<T>(url:string):Promise<T>{
  const path=url.replace(/^\//,'');
  if(!this.assets.has(path))this.assets.set(path,this.load(path).catch(error=>{this.assets.delete(path);throw error;}));
  return this.assets.get(path)! as Promise<T>;
 }
 private async load(path:string):Promise<unknown>{
  if(path.endsWith('.json')){
   const data=JSON.parse(await readPackageText(path));
   if(data.frames&&data.meta?.image){
    const dir=path.slice(0,path.lastIndexOf('/')+1);
    const texture=await this.loadAsset<Texture>(dir+data.meta.image);
    const sheet=new Spritesheet(texture,data as SpritesheetData);await sheet.parse();return sheet;
   }
   return data;
  }
  return new Promise<Texture>((resolve,reject)=>{
   const image=wx.createImage();
   const timeout=setTimeout(()=>reject(new Error('图片加载超时：'+path)),15000);
   image.onload=()=>{clearTimeout(timeout);try{resolve(new Texture({source:new ImageSource({resource:image})}));}catch(error){reject(error);}};
   image.onerror=()=>{clearTimeout(timeout);reject(new Error('图片加载失败：'+path));};
   try{image.src=path;}catch(error){clearTimeout(timeout);reject(error);}
  });
 }
 input(_canvas:CanvasSurface,fn:(e:InputEvent)=>void){
  let active:number|null=null;
  const handler=(kind:InputEvent['kind']):TouchHandler=>event=>{
   const touch=kind==='down'?(active===null?event.changedTouches[0]:undefined):event.changedTouches.find(t=>t.identifier===active);
   if(!touch)return;
   const rect=viewport(),point=worldPoint({x:touch.clientX,y:touch.clientY},rect);
   if(kind==='down'){
    if(point.x<0||point.y<0||point.x>720||point.y>1280)return;
    active=touch.identifier;
   }
   fn({...point,id:touch.identifier,kind});
   if(kind==='up'||kind==='cancel')active=null;
  };
  const down=handler('down'),move=handler('move'),up=handler('up'),cancel=handler('cancel');
  wx.onTouchStart(down);wx.onTouchMove(move);wx.onTouchEnd(up);wx.onTouchCancel(cancel);
  // A finger lifted while WeChat is hidden must not leave input locked on return.
  wx.onHide(()=>{active=null;});
  return ()=>{wx.offTouchStart(down);wx.offTouchMove(move);wx.offTouchEnd(up);wx.offTouchCancel(cancel);};
 }
 keyboard(_fn:(key:string)=>void){}
 lifecycle(fn:()=>void){wx.onHide(fn);}
 read(key:string){try{const value=wx.getStorageSync(key);return typeof value==='string'&&value!==''?value:null;}catch{return null;}}
 write(key:string,value:string){try{wx.setStorageSync(key,value);return true;}catch{return false;}}
 private sound(fn:(synth:Synth)=>void){if(!this.synth||this.audioFailed)return;try{fn(this.synth);}catch(error){this.audioFailed=true;console.warn('微信音频暂不可用，画面和玩法继续运行',error);}}
 audio(sound:Sound){this.sound(synth=>synth.play(sound));}
 unlockAudio(){this.sound(synth=>synth.unlock());}
 setMuted(muted:boolean){this.sound(synth=>synth.mute(muted));}
 query(_key:string){return null;}
 pixelRatio(){return Math.min(wx.getWindowInfo().pixelRatio||1,1.5);}
}
