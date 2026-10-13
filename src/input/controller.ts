import type {PlatformAdapter,InputEvent,CanvasSurface} from '../platform/adapter';
import {distance,recognize,type Point,type Recognition} from './recognizer';
import {COMBAT} from '../gameplay/config';
import {BrushSettings,GESTURE_INPUT as C,type PenSnapshot} from './brush-settings';
import type {InkResourceManager} from '../gameplay/ink-resource';
export class InputController{
 minY=175;
 points:Point[]=[];dryPoints:Point[]=[];drawing=false;last:Recognition|null=null;preview:Recognition|null=null;traceAge=0;success=false;debug=false;drawAge=0;previewAge=0;pointer:number|null=null;
 pointTimes:number[]=[];pointLengths:number[]=[];gestureId=0;timedOut=false;totalPathLength=0;penSnapshot:PenSnapshot;private waitingPointer:number|null=null;private lastSample:Point|null=null;private overflow=false;private startedAt=0;
 get exhausted(){return !!this.ink?.pending?.exhausted;}
 constructor(platform:PlatformAdapter,canvas:CanvasSurface,private canDraw:()=>boolean,private onRecognized:(r:Recognition)=>boolean,private onButton:(e:InputEvent)=>boolean,private onFailed?:(r:Recognition)=>void,public pen=new BrushSettings(),public ink?:InkResourceManager){this.penSnapshot=pen.snapshot();platform.input(canvas,e=>this.event(e));}
 event(e:InputEvent){
  if(this.waitingPointer===e.id){if(e.kind==='up'||e.kind==='cancel'){this.waitingPointer=null;this.ink?.release();}return;}
  if(this.onButton(e))return;if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return;
  if(e.kind==='down'){
   if(this.pointer!==null||this.waitingPointer!==null||!this.canDraw()||e.y<this.minY||e.y>1180)return;
   const id=this.gestureId+1;if(this.ink&&!this.ink.begin(id))return;
   this.pointer=e.id;this.gestureId=id;this.points=[{x:e.x,y:e.y}];this.dryPoints=[];this.pointTimes=[0];this.pointLengths=[0];this.lastSample=this.points[0];this.drawing=true;this.last=this.preview=null;this.success=false;this.timedOut=false;this.totalPathLength=0;this.penSnapshot=this.pen.snapshot();this.overflow=false;this.traceAge=this.drawAge=this.previewAge=0;this.startedAt=performance.now()/1000;return;
  }
  if(e.id!==this.pointer||!this.drawing)return;
  if(!this.canDraw()){this.cancel();return;}
  if(e.kind==='cancel'){this.cancel();return;}
  this.drawAge=Math.max(this.drawAge,performance.now()/1000-this.startedAt);
  if(this.drawAge>=COMBAT.drawLimit){this.finish(true);if(e.kind==='up'){this.waitingPointer=null;this.ink?.release();}return;}
  if(e.kind==='move'||e.kind==='up')this.sample(e);
  if(e.kind==='up')this.finish();
 }
 private sample(e:Point){
  const p={x:Math.max(0,Math.min(720,e.x)),y:Math.max(this.minY,Math.min(1180,e.y))};
  if(this.exhausted){if(!this.dryPoints.length)this.dryPoints.push({...this.points.at(-1)!});if(distance(this.dryPoints.at(-1)!,p)>=C.sampleDistance){if(this.dryPoints.length>=C.maxSamples)this.dryPoints=this.dryPoints.filter((_,i)=>i%2===0);this.dryPoints.push(p);}return;}
  const a=this.lastSample??this.points.at(-1)!,len=distance(a,p);if(len<C.sampleDistance)return;
  const take=this.ink?this.ink.extend(len):len;if(take<=0)return;
  const end={x:a.x+(p.x-a.x)*take/len,y:a.y+(p.y-a.y)*take/len};this.lastSample=end;this.totalPathLength+=take;
  if(this.points.length>=C.maxSamples){this.overflow=true;const keep=(i:number)=>i===this.points.length-1||i%2===0;this.pointTimes=this.pointTimes.filter((_,i)=>keep(i));this.pointLengths=this.pointLengths.filter((_,i)=>keep(i));this.points=this.points.filter((_,i)=>keep(i));}
  this.points.push(end);this.pointTimes.push(this.drawAge);this.pointLengths.push(this.totalPathLength);
  if(take<len){this.dryPoints=[end,p];}
 }
 finish(timeout=false){
  if(!this.drawing)return;const pointer=this.pointer;this.drawing=false;this.pointer=null;this.timedOut=timeout;if(timeout)this.waitingPointer=pointer;
  this.last=recognize(this.points);this.last.gestureId=this.gestureId;
  if(this.ink&&!this.ink.pending?.effective){this.last.valid=false;this.last.rune=null;}
  let retainedLength=0;for(let i=1;i<this.points.length;i++)retainedLength+=distance(this.points[i-1],this.points[i]);
  if(this.overflow&&this.last.valid&&this.totalPathLength>retainedLength*1.3){this.last.rune='ink';this.last.quality=.25;this.last.confidence=.25;}
  if(this.last.rune==='ink'||!this.last.valid)this.last.reason=this.totalPathLength>=C.minDistance?'未成符 · 断符消散':'短触取消 · 不消耗灵墨';
  try{
   const accepted=this.last.valid&&!!this.last.rune?this.onRecognized(this.last):false;
   this.success=accepted&&this.last.rune!=='ink';
   if(this.last.valid&&!accepted){this.ink?.cancel('rejected');if(timeout&&this.ink)this.ink.isWaitingRelease=true;}
   else this.ink?.settle(this.gestureId,this.success,this.last.rune??'',timeout?'timeout':this.last.valid?'release':'invalid',timeout);
  }catch(error){this.success=false;this.ink?.cancel('rejected');if(timeout&&this.ink)this.ink.isWaitingRelease=true;console.error('施法取消，灵墨已退回',error);}
  if(!this.last.valid&&this.totalPathLength>=C.minDistance)this.onFailed?.(this.last);
  if(!this.last.valid&&this.totalPathLength<C.minDistance){this.points=[];this.dryPoints=[];this.pointTimes=[];this.pointLengths=[];}
  this.traceAge=0;this.preview=this.last;
 }
 update(dt:number){
  if(!this.canDraw()){if(this.drawing||this.waitingPointer!==null)this.cancel();return;}
  if(this.drawing){this.drawAge=Math.max(this.drawAge+dt,performance.now()/1000-this.startedAt);this.previewAge+=dt;if(this.previewAge>.15){this.preview=recognize(this.points);this.previewAge=0;}if(this.drawAge+1e-8>=COMBAT.drawLimit)this.finish(true);}
  else{this.traceAge+=dt;if(this.traceAge>.15){this.points=[];this.dryPoints=[];this.pointTimes=[];this.pointLengths=[];}}
 }
 cancel(){this.ink?.cancel();this.drawing=false;this.pointer=null;this.waitingPointer=null;this.points=[];this.dryPoints=[];this.pointTimes=[];this.pointLengths=[];this.preview=this.last=null;this.success=false;this.lastSample=null;this.drawAge=0;}
}
