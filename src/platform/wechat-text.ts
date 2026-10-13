import {CanvasTextMetrics,TextStyle} from 'pixi.js';

let installed=false;
/** Native canvas metrics can omit descenders or measure only the Latin fallback font. */
export function installWechatTextMetrics(){
 if(installed)return;
 installed=true;
 const measureFont=CanvasTextMetrics.measureFont;
 CanvasTextMetrics.measureFont=function(font:string){
  const measured=measureFont.call(this,font);
  const size=Number(/([\d.]+)px\b/.exec(font)?.[1]);
  if(!Number.isFinite(size)||size<=0)return measured;
  // Reserve space for Chinese glyphs as well as Latin descenders on real devices.
  const ascent=Math.max(measured.ascent,size),descent=Math.max(measured.descent,size*.25);
  return {...measured,ascent,descent,fontSize:ascent+descent};
 };
 TextStyle.defaultTextStyle.padding=Math.max(TextStyle.defaultTextStyle.padding??0,4);
 CanvasTextMetrics.clearMetrics();
}
