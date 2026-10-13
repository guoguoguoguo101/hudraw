import type {FrameSample} from './frame-sample';
import {wechat as wx} from './wechat-api';
export class WechatDiagnostics{
 samples:FrameSample[]=[];errors:string[]=[];renderInfo:Record<string,unknown>={};
 gl:WebGLRenderingContext|null=null;
 renderSubmitMs=0;maxRenderSubmitMs=0;
 totalFrames=0;currentState='startup';actions:{action:string;state:string}[]=[];
 action(action:string,state:string){this.actions.push({action,state});if(this.actions.length>8)this.actions.shift();this.currentState=state;this.checkpoint(true);}
 recordRender(ms:number){this.renderSubmitMs=ms;this.maxRenderSubmitMs=Math.max(this.maxRenderSubmitMs,ms);}
 private lastSaved=0;private glErrors:number[]=[];
 record(frame:FrameSample){this.totalFrames++;this.currentState=frame.state;if(frame.state!=='playing'&&frame.state!=='tutorial')return;this.samples.push(frame);if(this.samples.length>180)this.samples.shift();}
 checkpoint(force=false){if(!this.samples.length&&this.currentState==='menu')return;if(force||Date.now()-this.lastSaved>1000){this.lastSaved=Date.now();try{wx.setStorageSync('linghu-last-diagnostics',this.report());}catch{}}}
 error(error:unknown){this.errors.push(String(error).slice(0,500));if(this.errors.length>8)this.errors.shift();this.checkpoint(true);}
 report(){
  const samples=this.samples,ms=samples.reduce((sum,f)=>sum+f.intervalMs,0),update=samples.reduce((sum,f)=>sum+f.updateMs,0),last=samples[samples.length-1];
  let glError:unknown='not available';try{glError=this.gl?.getError();if(typeof glError==='number'&&glError!==0){this.glErrors.push(glError);if(this.glErrors.length>8)this.glErrors.shift();}}catch(error){glError=String(error);}
  return JSON.stringify({build:'ios-diagnostics-4',clock:'monotonic-ms',currentState:this.currentState,totalFrames:this.totalFrames,actions:this.actions,device:wx.getDeviceInfo(),window:wx.getWindowInfo(),renderer:{...this.renderInfo,lastRenderSubmitMs:this.renderSubmitMs,maxRenderSubmitMs:this.maxRenderSubmitMs},
   gameplay:{frames:samples.length,fps:ms?+(samples.length*1000/ms).toFixed(1):0,averageUpdateMs:samples.length?+(update/samples.length).toFixed(1):0,maxFrameMs:Math.max(0,...samples.map(f=>f.intervalMs)),maxUpdateMs:Math.max(0,...samples.map(f=>f.updateMs)),stallsOver100ms:samples.filter(f=>f.intervalMs>100).length,unfinishedUpdates:samples.filter(f=>f.completed===false).length,last},glError,glErrors:this.glErrors,errors:this.errors},null,2);
 }
 copy(){
  let data=this.report();if(!this.samples.length){try{const saved=wx.getStorageSync('linghu-last-diagnostics');if(typeof saved==='string'&&saved)data=saved;}catch{}}console.info('[灵狐真机诊断]',data);
  const report=JSON.parse(data),g=report.gameplay;
  const summary=`版本：${report.build}\n状态：${report.currentState??g.last?.state??'未采到战斗'} · 总帧：${report.totalFrames??'未知'}\n战斗帧：${g.frames} · 帧率：${g.fps}\n平均更新：${g.averageUpdateMs}ms\n最长帧：${g.maxFrameMs}ms\n最长提交：${report.renderer.maxRenderSubmitMs??'未知'}ms\n未完成更新：${g.unfinishedUpdates??'未知'}\nGL错误：${report.glError} · 历史：${(report.glErrors??[]).join(',')||'无'}\n敌人：${g.last?.enemies??0}\n错误：${report.errors.join(';')||'无'}\n可截图发给开发者。`;
  const show=()=>wx.showModal({title:'诊断报告',content:summary.slice(0,1500),showCancel:false});
  if(wx.setClipboardData)wx.setClipboardData({data,success:()=>wx.showModal({title:'诊断已复制',content:'回到聊天粘贴报告即可。报告包含设备、帧率、运行耗时与错误，不含账号信息。',showCancel:false}),fail:show});
  else show();
 }
}
