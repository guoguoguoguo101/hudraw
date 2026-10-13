import {AccessibilitySystem,CanvasSource,DOMAdapter,DOMPipe,EventSystem,ResizePlugin,extensions,type Adapter} from 'pixi.js';
import {wechat as wx} from './wechat-api';
import {installWechatTextureStyle} from './wechat-texture-style';
import {installWechatTextMetrics} from './wechat-text';

/** Adapt Pixi's canvas/text environment without emulating an HTML page. */
export function configureWechatPixi(){
 installWechatTextureStyle();
 // The first WeChat canvas is the visible screen. Create it before text/test canvases.
 const canvas=wx.createCanvas();
 const canvases=new WeakSet<object>();
 function prepare(surface:HTMLCanvasElement){
  canvases.add(surface);
  // Context event registration is optional on WeChat canvas; input uses wx directly.
  surface.addEventListener??=()=>{};
  surface.removeEventListener??=()=>{};
  return surface;
 }
 prepare(canvas);
 const createCanvas=(width=1,height=1)=>{const surface=prepare(wx.createCanvas());surface.width=width;surface.height=height;return surface;};
 const textContext=createCanvas().getContext('2d')!;
 if(!textContext)throw new Error('微信离屏文字画布初始化失败');
 class WebGL1Context{
  // This entry requests WebGL1 explicitly. VERSION text differs across native iOS implementations.
  static [Symbol.hasInstance](_context:WebGLRenderingContext){return true;}
 }
 const device=wx.getDeviceInfo();
 DOMAdapter.set({
  createCanvas,createImage:()=>wx.createImage(),
  getCanvasRenderingContext2D:()=>({prototype:textContext}),
  getWebGLRenderingContext:()=>WebGL1Context as unknown as typeof WebGLRenderingContext,
  getNavigator:()=>({userAgent:device.platform==='ios'?'iPhone':device.platform==='android'?'Android Mobile':'WeChat DevTools',gpu:null}),
  getBaseUrl:()=>'',getFontFaceSet:()=>null,
  fetch:async()=>{throw new Error('微信资源请通过 WechatAdapter.loadAsset 加载');},
  parseXML:()=>{throw new Error('微信测试包只加载预生成 PNG，不支持运行时 XML');},
 } satisfies Adapter);
 installWechatTextMetrics();
 // Textures created from wx canvases have no browser HTMLCanvasElement constructor.
 const originalTest=CanvasSource.test;
 CanvasSource.test=(resource):resource is ReturnType<Adapter['createCanvas']>=>!!resource&&typeof resource==='object'&&(canvases.has(resource)||originalTest(resource));
 // Game UI already performs hit testing through PlatformAdapter, with no Pixi DOM events.
 // ResizePlugin touches window events even when resizeTo was not provided.
 // WeChat already resizes through wx.onWindowResize in wechat-main.ts.
 extensions.remove(EventSystem,AccessibilitySystem,DOMPipe,ResizePlugin);
 return canvas;
}
