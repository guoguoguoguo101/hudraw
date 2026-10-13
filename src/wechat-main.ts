// Use Pixi's static shader/particle implementations in runtimes that disallow new Function.
import 'pixi.js/unsafe-eval';
import {configureWechatPixi} from './platform/wechat-pixi';
import {WechatAdapter,viewport} from './platform/wechat';
import {wechat as wx} from './platform/wechat-api';
import {startGame} from './bootstrap';
import type {Application} from 'pixi.js';
const startup=(globalThis as typeof globalThis&{__LINGHU_STARTUP__?:{stage:(value:string)=>void;ready:()=>void;error:(error:unknown)=>void}}).__LINGHU_STARTUP__;

async function main(){
 const canvas=configureWechatPixi(),platform=new WechatAdapter();
 wx.onError?.(error=>platform.diagnostic.error(error));
 const resize=(app:Application)=>{
  const rect=viewport();
  app.renderer.resize(rect.screenWidth,rect.screenHeight);
  app.stage.scale.set(rect.scale);app.stage.position.set(rect.x,rect.y);
 };
 const {app}=await startGame(platform,{canvas,autoDensity:false,preferWebGLVersion:1,skipExtensionImports:true,preference:['webgl']},resize,startup?.stage);
 startup?.stage('绘制第一帧');
 const render=app.renderer.render.bind(app.renderer);
 app.renderer.render=((...args:unknown[])=>{const start=performance.now();try{return Reflect.apply(render,undefined,args);}finally{platform.diagnostic.recordRender(performance.now()-start);}}) as typeof app.renderer.render;
 app.render();
 const renderer=app.renderer as typeof app.renderer&{gl?:WebGLRenderingContext;context?:{webGLVersion?:number}};
 if(renderer.gl){platform.diagnostic.gl=renderer.gl;platform.diagnostic.renderInfo={version:renderer.gl.getParameter(renderer.gl.VERSION),webGLVersion:renderer.context?.webGLVersion,resolution:renderer.resolution,canvas:[app.canvas.width,app.canvas.height],extensions:renderer.gl.getSupportedExtensions()};}
 startup?.ready();
 wx.onWindowResize(()=>resize(app));
 wx.onHide(()=>app.ticker.stop());
 wx.onShow(()=>{app.ticker.start();});
 console.info('灵狐绘符微信测试版启动完成；请检查触摸、字体、声音和复杂技能帧率。');
}
// Let bundled Pixi extension registration finish before removing DOM-only systems.
void Promise.resolve().then(main).catch(error=>{
 console.error('微信测试版启动失败',error);
 if(startup)startup.error(error);else wx.showModal({title:'启动失败',content:String(error).slice(0,500),showCancel:false});
});
