/** Only the WeChat APIs used by this project; browser builds never import this module. */
export type Touch={identifier:number;clientX:number;clientY:number};
export type TouchEvent={touches:Touch[];changedTouches:Touch[]};
export type TouchHandler=(event:TouchEvent)=>void;
export interface WechatAPI{
 createCanvas():HTMLCanvasElement;
 createImage():HTMLImageElement;
 getWindowInfo():{windowWidth:number;windowHeight:number;pixelRatio:number};
 getDeviceInfo():{platform:string;system:string;model:string};
 getFileSystemManager():{readFile(options:{filePath:string;encoding:'utf8';success:(result:{data:string})=>void;fail:(error:unknown)=>void}):void};
 getStorageSync(key:string):unknown;
 setStorageSync(key:string,value:string):void;
 onTouchStart(fn:TouchHandler):void;offTouchStart(fn:TouchHandler):void;
 onTouchMove(fn:TouchHandler):void;offTouchMove(fn:TouchHandler):void;
 onTouchEnd(fn:TouchHandler):void;offTouchEnd(fn:TouchHandler):void;
 onTouchCancel(fn:TouchHandler):void;offTouchCancel(fn:TouchHandler):void;
 onHide(fn:()=>void):void;
 onShow(fn:()=>void):void;
 onWindowResize(fn:()=>void):void;
 createWebAudioContext?():AudioContext;
 onError?(fn:(error:string)=>void):void;
 setClipboardData?(options:{data:string;success:()=>void;fail:()=>void}):void;
 showModal(options:{title:string;content:string;showCancel:boolean}):void;
}
declare const wx:WechatAPI;
export const wechat=wx;
