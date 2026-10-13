import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';
import type {TouchEvent,TouchHandler} from '../src/platform/wechat-api';

const handlers=new Map<string,TouchHandler>();
const hides:(()=>void)[]=[];
const storage=new Map<string,string>();
const bind=(name:string)=>(fn:TouchHandler)=>handlers.set(name,fn);
const unbind=(name:string)=>(fn:TouchHandler)=>{if(handlers.get(name)===fn)handlers.delete(name);};
Object.assign(globalThis,{wx:{
 getWindowInfo:()=>({windowWidth:390,windowHeight:844,pixelRatio:3}),
 getDeviceInfo:()=>({platform:'ios',model:'test',system:'test'}),
 getStorageSync:(key:string)=>storage.get(key),setStorageSync:(key:string,value:string)=>storage.set(key,value),
 onTouchStart:bind('down'),offTouchStart:unbind('down'),onTouchMove:bind('move'),offTouchMove:unbind('move'),
 onTouchEnd:bind('up'),offTouchEnd:unbind('up'),onTouchCancel:bind('cancel'),offTouchCancel:unbind('cancel'),
 onHide:(fn:()=>void)=>hides.push(fn),
 getFileSystemManager:()=>({readFile:({filePath,success,fail}:{filePath:string;success:(r:{data:string})=>void;fail:(e:unknown)=>void})=>void fs.readFile(filePath,'utf8').then(data=>success({data}),fail)}),
}});
const {WechatAdapter,viewport,readPackageText}=await import('../src/platform/wechat');
const adapter=new WechatAdapter(),events:import('../src/platform/adapter').InputEvent[]=[];
const dispose=adapter.input({width:720,height:1280},event=>events.push(event));
function send(kind:string,id:number,x:number,y:number){const touches=[{identifier:id,clientX:x,clientY:y}];handlers.get(kind)!({changedTouches:touches,touches} as TouchEvent);}
const v=viewport();
send('down',1,195,10);assert.equal(events.length,0,'letterbox must not start drawing');
send('down',1,195,422);assert.equal(events[0].x,360);assert.equal(events[0].y,640);
send('down',2,100,200);send('move',2,100,200);assert.equal(events.length,1,'second finger ignored');
send('move',1,v.x+v.width,v.y+v.height);assert.equal(events[1].x,720);assert.equal(events[1].y,1280);
send('up',2,100,200);assert.equal(events.length,2);
send('up',1,195,422);assert.equal(events[2].kind,'up');
send('down',3,195,422);hides.forEach(fn=>fn());send('down',4,195,422);assert.equal(events.at(-1)?.id,4,'hide releases active finger');
dispose();assert.equal(handlers.size,0);
assert.equal(adapter.read('progress'),null);assert.equal(adapter.write('progress','saved'),true);assert.equal(adapter.read('progress'),'saved');
assert.equal(adapter.pixelRatio(),1.5);
adapter.recordFrame({intervalMs:17,updateMs:2,state:'playing',enemies:12,skills:[],low:true,completed:true});adapter.finishFrame();
const savedDiagnostic=storage.get('linghu-last-diagnostics');assert.ok(savedDiagnostic);
const restarted=new WechatAdapter();restarted.recordFrame({intervalMs:17,updateMs:1,state:'menu',enemies:0,skills:[],low:true,completed:true});restarted.finishFrame();assert.equal(storage.get('linghu-last-diagnostics'),savedDiagnostic,'menu on restart must preserve previous combat report');
assert.equal(JSON.parse(await readPackageText('wechat-game/game.json')).deviceOrientation,'portrait');
const project=JSON.parse(await readPackageText('wechat-game/project.config.json'));assert.equal(project.compileType,'game');
const entry=await readPackageText('wechat-game/game.js');assert.ok(entry.includes("require('./runtime.js')"),'early startup guard loads runtime');
const startupErrors:{content:string}[]=[];
const host:{navigator?:{userAgent:string;platform:string}}={};
vm.runInNewContext(entry,{GameGlobal:host,requestAnimationFrame:()=>0,wx:{getDeviceInfo:()=>({platform:'ios'}),showModal:(options:{content:string})=>startupErrors.push(options)},console:{info:()=>{},error:()=>{}},setTimeout:()=>0,require:()=>{assert.equal(host.navigator?.platform,'iPhone');assert.ok(host.navigator?.userAgent.includes('iPhone'));throw new Error('MODULE_LOAD_TEST_FAILURE');}});
assert.equal(startupErrors.length,1,'early module errors must be visible');assert.ok(startupErrors[0].content.includes('MODULE_LOAD_TEST_FAILURE'));
const js=await readPackageText('wechat-game/runtime.js');assert.ok(!js.includes('lab-panel'),'browser lab excluded');
// Inspect parsed JavaScript, not strings/comments that may legitimately contain these symbols.
const source=ts.createSourceFile('game.js',js,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const unsupported=new Set([ts.SyntaxKind.QuestionDotToken,ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.QuestionQuestionEqualsToken,ts.SyntaxKind.AmpersandAmpersandEqualsToken,ts.SyntaxKind.BarBarEqualsToken]);
function checkSyntax(node:ts.Node){assert.ok(!unsupported.has(node.kind),'WeChat bundle contains unsupported syntax: '+ts.SyntaxKind[node.kind]);ts.forEachChild(node,checkSyntax);}
checkSyntax(source);
console.log('PASS: WeChat bundle excludes optional chaining, nullish coalescing and logical assignment');
console.log('PASS: WeChat touch scaling / single finger / hide recovery / storage / package configuration');
