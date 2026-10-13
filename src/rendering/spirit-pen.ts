import {Container,Graphics,Text} from 'pixi.js';
import type {InputController} from '../input/controller';
import {FAILED_STROKE,type PenSnapshot} from '../input/brush-settings';
import {smooth,type Point} from '../input/recognizer';

function seal(g:Graphics,x:number,y:number,r:number,color:number,alpha=1){
 g.moveTo(x,y-r).lineTo(x+r,y).lineTo(x,y+r).lineTo(x-r,y).closePath().stroke({color,width:1.4,alpha});
 g.moveTo(x,y-r*.55).lineTo(x+r*.55,y).lineTo(x,y+r*.55).lineTo(x-r*.55,y).closePath().stroke({color,width:1.2,alpha});g.circle(x,y,r*.16).fill({color,alpha});
}
function spark(g:Graphics,x:number,y:number,r:number,color:number,alpha=1){g.moveTo(x,y-r).lineTo(x+r*.28,y-r*.22).lineTo(x+r,y).lineTo(x+r*.28,y+r*.22).lineTo(x,y+r).lineTo(x-r*.28,y+r*.22).lineTo(x-r,y).lineTo(x-r*.28,y-r*.22).closePath().fill({color,alpha});}
function flame(g:Graphics,x:number,y:number,r:number,angle:number,pen:PenSnapshot,alpha:number){
 const points=[{x:0,y:-r},{x:r*.55,y:-r*.25},{x:r*.35,y:r*.35},{x:0,y:r*.65},{x:-r*.42,y:r*.3},{x:-r*.28,y:-r*.15}];
 const rotate=(p:Point)=>({x:x+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:y+p.x*Math.sin(angle)+p.y*Math.cos(angle)});
 const p=points.map(rotate);g.moveTo(p[0].x,p[0].y);for(const q of p.slice(1))g.lineTo(q.x,q.y);g.closePath().fill({color:pen.body,alpha}).stroke({color:pen.gold,width:1,alpha:alpha*.65});
 const tip=rotate({x:0,y:-r*.55}),bottom=rotate({x:0,y:r*.45});g.moveTo(tip.x,tip.y).lineTo(bottom.x,bottom.y).stroke({color:pen.core,width:r*.3,alpha});
}
/** Small paper-cut nib. Its tip is independent of the actual recorded touch position. */
export function drawNib(g:Graphics,pen:PenSnapshot){
 const {body,core,gold,id}=pen;
 g.moveTo(0,12).quadraticCurveTo(-17,-6,-10,-25).lineTo(-7,-32).lineTo(9,-29).quadraticCurveTo(14,-8,0,12).fill({color:body}).stroke({color:gold,width:1,alpha:.7});
 g.moveTo(0,12).quadraticCurveTo(-8,-5,-6,-19).lineTo(5,-22).quadraticCurveTo(7,-7,0,12).fill({color:core});
 g.moveTo(-7,-27).lineTo(9,-24).stroke({color:gold,width:2});
 if(id==='fox'){
  g.moveTo(-11,-26).lineTo(-12,-43).lineTo(-2,-33).lineTo(8,-43).lineTo(11,-26).closePath().fill({color:core}).stroke({color:body,width:2});
  g.moveTo(-4,-28).lineTo(-1,-26).moveTo(5,-28).lineTo(2,-26).stroke({color:body,width:1.5});
 }else if(id==='gold'){seal(g,0,-20,6,gold);spark(g,13,-12,4,gold);}
 else if(id==='mountain'){g.moveTo(-10,-17).lineTo(-3,-26).lineTo(2,-19).lineTo(7,-27).lineTo(10,-16).stroke({color:gold,width:1.2});}
 else {seal(g,1,-18,4,body);}
}
/** Full collectible brush: layered cut paper, ribbons, ofuda, cloud and mountain inlays. */
export function drawBrushPortrait(parent:Container,pen:PenSnapshot,x:number,y:number,scale=.65){
 const root=new Container(),g=new Graphics();root.position.set(x,y);root.scale.set(scale);root.rotation=.12;root.addChild(g);parent.addChild(root);
 const {body,core,gold,id}=pen;
 g.ellipse(0,0,72,160).stroke({color:gold,width:1,alpha:.2});
 g.moveTo(-20,-158).quadraticCurveTo(55,-85,16,-5).quadraticCurveTo(-35,78,-12,118).lineTo(22,112).quadraticCurveTo(5,66,41,-8).quadraticCurveTo(67,-103,3,-173).closePath().fill({color:body}).stroke({color:gold,width:2});
 g.moveTo(-14,-152).quadraticCurveTo(42,-74,8,-8).quadraticCurveTo(-22,57,-7,105).lineTo(11,103).quadraticCurveTo(-2,58,28,-12).quadraticCurveTo(52,-92,-1,-157).closePath().fill({color:core});
 for(let i=0;i<7;i++){const yy=-128+i*32,xx=14+Math.sin(i*.8)*9;g.moveTo(xx-13,yy+13).lineTo(xx-4,yy-5).lineTo(xx+2,yy+4).lineTo(xx+10,yy-12).lineTo(xx+21,yy+13).closePath().fill({color:id==='mountain'?0x29343b:body,alpha:.75});g.moveTo(xx-13,yy+13).lineTo(xx+10,yy-12).stroke({color:gold,width:.8,alpha:.6});}
 g.moveTo(-7,107).quadraticCurveTo(-57,147,-19,191).quadraticCurveTo(3,177,16,165).quadraticCurveTo(48,146,20,111).closePath().fill({color:body}).stroke({color:gold,width:1.5});
 g.moveTo(-2,114).quadraticCurveTo(-34,156,-19,191).quadraticCurveTo(-2,169,14,155).quadraticCurveTo(23,140,12,115).closePath().fill({color:core});
 for(let i=0;i<3;i++){g.moveTo(2+i*4,121).quadraticCurveTo(-16+i*8,150,-17+i*6,175).stroke({color:gold,width:.8,alpha:.55});}
 g.moveTo(-20,-148).quadraticCurveTo(-67,-64,-27,-13).quadraticCurveTo(-66,69,-36,126).lineTo(-25,94).quadraticCurveTo(-45,32,-12,-11).quadraticCurveTo(-50,-74,-9,-143).fill({color:body,alpha:.8});
 g.moveTo(19,-118).quadraticCurveTo(80,-69,40,6).quadraticCurveTo(72,80,41,127).lineTo(35,95).quadraticCurveTo(54,47,26,9).quadraticCurveTo(67,-69,10,-121).fill({color:body,alpha:.75});
 for(let i=0;i<5;i++){const px=i%2?-43:49,py=-110+i*54;g.moveTo(px-9,py-14).lineTo(px+12,py-10).lineTo(px+8,py+15).lineTo(px-12,py+10).closePath().fill({color:core}).stroke({color:gold,width:.8});seal(g,px,py,6,body);spark(g,px+(i%2?-18:18),py+22,5,gold,.7);}
 for(const [cx,cy] of [[-35,-92],[28,58],[-26,88]]){g.circle(cx,cy,11).circle(cx+12,cy+3,8).circle(cx-10,cy+5,7).fill({color:core,alpha:.9});g.moveTo(cx-7,cy+4).quadraticCurveTo(cx+7,cy-4,cx+12,cy+6).stroke({color:gold,width:1});}
 const cap=new Graphics();cap.position.set(-2,-165);cap.scale.set(1.4);drawNib(cap,pen);cap.rotation=Math.PI;root.addChild(cap);
 if(id==='fox'){
  g.moveTo(-21,-143).lineTo(-26,-185).lineTo(-4,-163).lineTo(20,-188).lineTo(23,-143).quadraticCurveTo(13,-120,0,-122).quadraticCurveTo(-14,-121,-21,-143).fill({color:core}).stroke({color:body,width:3});
  g.moveTo(-20,-169).lineTo(-14,-149).lineTo(-5,-154).closePath().fill({color:body});g.moveTo(17,-173).lineTo(6,-153).lineTo(16,-151).closePath().fill({color:body});
  g.moveTo(-13,-143).lineTo(-5,-138).moveTo(13,-143).lineTo(5,-138).stroke({color:body,width:2.5});g.moveTo(-4,-130).lineTo(4,-130).lineTo(0,-126).closePath().fill({color:body});
  for(const [fx,fy] of [[-40,-43],[50,37],[-30,115]])flame(g,fx,fy,17,.35,pen,.85);
 }
 if(id==='gold'){g.moveTo(37,-99).lineTo(57,68).stroke({color:gold,width:2});for(let i=0;i<3;i++)seal(g,47+i*4,-42+i*37,11,gold);}
 return root;
}

export class SpiritPenRenderer{
 root=new Container();trace=new Graphics();cursor=new Graphics();start=new Graphics();finish=new Graphics();debug=new Graphics();private angle=0;private gesture=-1;private label=new Text({text:'',style:{fontFamily:['KaiTi','serif'],fontSize:16,fill:0xfff3dc,lineHeight:22}});
 constructor(){this.label.position.set(48,912);this.label.visible=false;this.root.addChild(this.trace,this.start,this.finish,this.cursor,this.debug,this.label);}
 clear(){for(const g of [this.trace,this.cursor,this.start,this.finish,this.debug])g.clear();this.label.visible=false;}
 update(input:InputController){
  this.clear();this.label.visible=false;const pts=input.points;if(!pts.length)return;const pen=input.penSnapshot,p=pen.params,age=input.drawing?0:input.traceAge;
  const retire=input.success?Math.max(.08,Math.min(.15,p.fadeTime)):FAILED_STROKE.fadeDuration;
  const gather=input.success?Math.min(.045,retire*.45):0,fade=input.drawing?1:age<gather?1:Math.max(0,1-(age-gather)/(retire-gather));
  const display=smooth(pts);
  if(input.gestureId!==this.gesture){this.gesture=input.gestureId;this.angle=0;}
  for(let i=1;i<pts.length&&fade>0;i++){const a=display[i-1],b=display[i];const recent=input.drawAge-(input.pointTimes[i]??input.drawAge);
   const brightness=(!input.drawing&&input.success?1:recent<p.trailTime?1:p.oldAlpha)*p.brightness*fade;
   // One clear stroke with a small bright core, shared by every gesture. On release
   // the entire stroke lights together rather than preserving only the last few points.
   for(const [color,width,alpha] of [[pen.body,p.strokeWidth,brightness*.85],[pen.core,p.strokeWidth*.3,brightness*(input.drawing||!input.success?1:1+p.endGlow*.3)]] as const)this.trace.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color,width,alpha:Math.min(1,alpha),cap:'round',join:'round'});
  }
  for(let i=1;i<input.dryPoints.length&&fade>0;i++){const a=input.dryPoints[i-1],b=input.dryPoints[i];this.trace.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:pen.body,width:p.strokeWidth*.65,alpha:.16*fade});}
  const first=pts[0],last=input.dryPoints.at(-1)??pts.at(-1)!;
  if(input.drawing){
   const u=Math.min(1,input.drawAge/p.startDuration);if(u<1){this.start.circle(first.x,first.y,3+p.startSize*u).stroke({color:pen.gold,width:1,alpha:(1-u)*.8});seal(this.start,first.x,first.y,6,pen.body,1-u);}
   const before=pts[Math.max(0,pts.length-3)],dx=last.x-before.x,dy=last.y-before.y;if(Math.hypot(dx,dy)>4){const desired=Math.atan2(dy,dx)-Math.PI/2;this.angle+=Math.atan2(Math.sin(desired-this.angle),Math.cos(desired-this.angle))*.45;}
   this.cursor.position.set(last.x,last.y+p.offsetY);this.cursor.rotation=this.angle;this.cursor.scale.set(p.cursorSize/18);drawNib(this.cursor,pen);
   const moving=!input.exhausted&&input.drawAge-(input.pointTimes.at(-1)??0)<p.trailTime;
   if(moving){for(let i=1;i<=p.particles;i++){const q=pts[Math.max(0,pts.length-1-i*2)],x=q.x+Math.sin(i*8)*8,y=q.y+Math.cos(i*4)*8;
    spark(this.trace,x,y,1.5,pen.gold,.2);
   }}
   this.trace.circle(last.x,last.y,2).fill({color:pen.core,alpha:input.exhausted?.2:p.brightness});
  }else if(input.success&&age<.09){const u=age/.09;this.cursor.position.set(last.x,last.y+p.offsetY-u*8);this.cursor.rotation=this.angle-.15*u;this.cursor.scale.set(p.cursorSize/18);drawNib(this.cursor,pen);this.cursor.alpha=(1-u)*.65;
  }
  if(input.drawing)this.cursor.alpha=input.exhausted?.25:1;
  if(input.debug){if(input.drawing||fade>0){for(const pt of pts)this.debug.circle(pt.x,pt.y,1.5).fill({color:0x72b5a4,alpha:.5*fade});for(const pt of input.last?.geometry.points??[])this.debug.circle(pt.x,pt.y,2).fill({color:pen.gold,alpha:.6*fade});}
   this.debug.roundRect(34,900,440,155,12).fill({color:0x192027,alpha:.9});const result=input.last??input.preview;
   this.label.visible=true;this.label.text=`第${input.gestureId}笔 · ${input.drawing?'行笔':input.timedOut?'超时封笔':'收笔'} · ${input.pen.skin.name}\n${result?.reason??'采集中'} · 置信度 ${(result?.confidence??0).toFixed(2)}\n累计 ${Math.round(input.totalPathLength)} · 本笔用墨 ${(input.ink?.last.cost??0).toFixed(1)}\n${input.success?'正式成符':input.drawing?'绘制中':'断符消散 · 无攻击'}\n青点：原始轨迹 · 金点：分析轨迹`;
  }
 }
}

