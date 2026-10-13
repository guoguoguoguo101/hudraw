import type {PlatformAdapter,InputEvent,CanvasSurface} from '../platform/adapter';
import {distance,recognize,type Point,type Recognition} from './recognizer';
import {COMBAT} from '../gameplay/config';
export class InputController{
 points:Point[]=[];drawing=false;last:Recognition|null=null;preview:Recognition|null=null;traceAge=0;success=false;debug=false;drawAge=0;previewAge=0;pointer:number|null=null;
 constructor(platform:PlatformAdapter,canvas:CanvasSurface,private canDraw:()=>boolean,private onRecognized:(r:Recognition)=>boolean,private onButton:(e:InputEvent)=>boolean,private onFailed?:(r:Recognition)=>void){platform.input(canvas,e=>this.event(e));}
 event(e:InputEvent){if(this.onButton(e))return;if(e.kind==='down'){if(this.pointer!==null)return;if(!this.canDraw()||e.y<175||e.y>1180)return;this.pointer=e.id;this.points=[{x:e.x,y:e.y}];this.drawing=true;this.last=this.preview=null;this.traceAge=this.drawAge=this.previewAge=0;return;}
 if(e.id!==this.pointer||!this.drawing)return;if(e.kind==='move'){const last=this.points.at(-1)!;if(distance(last,e)>2.5&&this.points.length<400)this.points.push({x:e.x,y:e.y});}
 if(e.kind==='up'){this.points.push({x:e.x,y:e.y});this.finish();}if(e.kind==='cancel')this.cancel();}
 finish(){if(!this.drawing)return;this.drawing=false;this.pointer=null;this.last=recognize(this.points);this.success=this.last.valid&&this.last.rune?this.onRecognized(this.last):false;if(!this.last.valid)this.onFailed?.(this.last);this.traceAge=0;this.preview=this.last;}
 update(dt:number){if(this.drawing){this.drawAge+=dt;this.previewAge+=dt;if(this.previewAge>.09){this.preview=recognize(this.points);this.previewAge=0;}if(this.drawAge+1e-8>=COMBAT.drawLimit)this.finish();}else{this.traceAge+=dt;if(this.traceAge>.7&&!this.debug)this.points=[];}}
 cancel(){this.drawing=false;this.pointer=null;this.points=[];this.preview=null;this.drawAge=0;}
}
