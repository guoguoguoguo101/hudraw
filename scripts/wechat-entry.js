/* Run before Pixi imports, so early iOS failures are visible rather than a black screen. */
(function () {
 var root = typeof GameGlobal !== 'undefined' ? GameGlobal : globalThis;
 var stage = '准备运行环境', failed = false, finished = false;
 function report(error) {
  if (failed) return;
  failed = true;
  var message = '阶段：' + stage + '\n' + String(error && error.message || error);
  console.error('[灵狐启动]', message);
  if (wx.hideLoading) wx.hideLoading();
  if (wx.showModal) wx.showModal({title:'画卷启动异常',content:message.slice(0,500),showCancel:false});
 }
 root.__LINGHU_STARTUP__ = {
  stage:function (value) {stage = value;console.info('[灵狐启动]', value);},
  ready:function () {finished = true;if (wx.hideLoading) wx.hideLoading();},
  error:report
 };
 if (wx.onError) wx.onError(report);
 if (wx.onUnhandledRejection) wx.onUnhandledRejection(function (event) {report(event.reason);});
 if (wx.showLoading) wx.showLoading({title:'正在展开画卷',mask:true});
 setTimeout(function () {if (!finished && !failed) report('启动超过25秒，请将此提示发给开发者。');},25000);
 try {
  // Pixi's optional Intl.Segmenter fallback still requires the Intl global to exist.
  if (!root.Intl) root.Intl = {};
  if (!root.globalThis) root.globalThis = root;
  // Dependencies inspect device information during import, before DOMAdapter.set().
  if (!root.navigator) {
   var device = wx.getDeviceInfo ? wx.getDeviceInfo() : {};
   var platform = device.platform || '';
   root.navigator = {
    userAgent:platform==='ios'?'Mozilla/5.0 (iPhone) WeChat':platform==='android'?'Mozilla/5.0 (Android Mobile) WeChat':'WeChat MiniGame',
    platform:platform==='ios'?'iPhone':platform==='android'?'Android':platform,
    maxTouchPoints:1,hardwareConcurrency:1,gpu:null
   };
  }
  // Some hosts expose GameGlobal separately from the ECMAScript global object.
  if (typeof globalThis!=='undefined' && !globalThis.navigator) globalThis.navigator=root.navigator;
  if (!root.performance) {
   var start = Date.now();
   root.performance = wx.getPerformance ? wx.getPerformance() : {now:function () {return Date.now()-start;}};
  }
  // Browser Performance uses milliseconds, while native mini-game Performance can use
  // microseconds. Frame callbacks can also expose a different time origin/unit.
  // Use one monotonic millisecond clock for Pixi, callbacks and diagnostics.
  var clockOrigin=Date.now(),clockLast=0;
  root.__LINGHU_CLOCK__={now:function () {clockLast=Math.max(clockLast,Date.now()-clockOrigin);return clockLast;}};
  var requestFrame=root.requestAnimationFrame || (typeof requestAnimationFrame==='function' ? requestAnimationFrame : null);
  if (!requestFrame) throw new Error('微信帧调度接口不可用');
  root.__LINGHU_REQUEST_FRAME__=function (callback) {return requestFrame.call(root,function () {callback(root.__LINGHU_CLOCK__.now());});};
  if (typeof globalThis!=='undefined') {
   globalThis.__LINGHU_CLOCK__=root.__LINGHU_CLOCK__;
   globalThis.__LINGHU_REQUEST_FRAME__=root.__LINGHU_REQUEST_FRAME__;
  }
  if (!Array.prototype.at) Object.defineProperty(Array.prototype,'at',{value:function (index) {
   var length=this.length,indexValue=Number(index)||0;
   indexValue=indexValue<0?Math.ceil(indexValue):Math.floor(indexValue);
   if (indexValue<0) indexValue+=length;
   return indexValue<0||indexValue>=length?undefined:this[indexValue];
  },writable:true,configurable:true});
  stage = '加载游戏模块';
  require('./runtime.js');
 } catch (error) {report(error);}
})();
