import {Container,Graphics,Text} from 'pixi.js';
import type {InputController} from '../input/controller';
import {FAILED_STROKE,type PenSnapshot} from '../input/brush-settings';
import type {Point} from '../input/recognizer';
import {brushStroke,type BrushSample} from './brush-stroke';

/** A continuous ink silhouette, with subtle asymmetry from the brush hairs. */
function inkRibbon(g:Graphics,pts:BrushSample[],color:number,alpha:number,scale=1){
 if(pts.length<2)return;
 const edge=(p:BrushSample,side:number)=>{const grain=1+.035*Math.sin(p.length*.39)+.025*Math.sin(p.length*.83);const w=p.width*.5*scale*grain;return {x:p.x+p.nx*w*side,y:p.y+p.ny*w*side};};
 const first=edge(pts[0],1);g.moveTo(first.x,first.y);
 for(let i=1;i<pts.length;i++){const p=edge(pts[i],1);g.lineTo(p.x,p.y);}
 for(let i=pts.length-1;i>=0;i--){const p=edge(pts[i],-1);g.lineTo(p.x,p.y);}
 g.closePath().fill({color,alpha});
}

/** The contact stays under the pointer; the belly bends behind it. */
function writingNib(g:Graphics,pen:PenSnapshot,spread:number,bend:number){
 const w=5+spread*3;
 g.moveTo(0,0).bezierCurveTo(-w,-3,-w+bend,-11,-4+bend,-22)
  .lineTo(5+bend,-22).bezierCurveTo(w+bend,-10,w,-3,0,0).fill({color:pen.body});
 g.moveTo(0,0).bezierCurveTo(-2,-5,-3+bend,-13,-1+bend,-21)
  .lineTo(3+bend,-21).bezierCurveTo(3+bend,-12,3,-5,0,0).fill({color:pen.core,alpha:.68});
 for(const x of [-.55,.3,.7])g.moveTo(x*w*.3,-2).quadraticCurveTo(x*w+bend,-11,x*4+bend,-21).stroke({color:pen.gold,width:.55,alpha:.55});
 g.moveTo(-5+bend,-22).lineTo(6+bend,-22).lineTo(7+bend,-28).lineTo(-5+bend,-28).closePath().fill({color:pen.gold});
 g.moveTo(-3+bend,-28).lineTo(-2+bend,-37).lineTo(4+bend,-37).lineTo(5+bend,-28).closePath().fill({color:pen.body});
}

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
 optimized=false;private ribbonCache:{points:Point[];count:number;last:Point;time:number;width:number;released:boolean;ribbon:BrushSample[]}|undefined;private traceKey='';
 root=new Container();trace=new Graphics();cursor=new Graphics();start=new Graphics();finish=new Graphics();debug=new Graphics();private angle=0;private flex=0;private gesture=-1;private label=new Text({text:'',style:{fontFamily:['KaiTi','serif'],fontSize:16,fill:0xfff3dc,lineHeight:22}});
 constructor(){this.label.position.set(48,912);this.label.visible=false;this.root.addChild(this.trace,this.start,this.finish,this.cursor,this.debug,this.label);}
 clear(){for(const g of [this.trace,this.cursor,this.start,this.finish,this.debug])g.clear();this.label.visible=false;this.ribbonCache=undefined;this.traceKey='';}
 update(input:InputController){
  for(const g of [this.cursor,this.start,this.finish,this.debug])g.clear();this.label.visible=false;const pts=input.points;if(!pts.length){if(this.traceKey||this.ribbonCache||!this.optimized)this.trace.clear();this.ribbonCache=undefined;this.traceKey='';return;}const pen=input.penSnapshot,p=pen.params,age=input.drawing?0:input.traceAge;
  const retire=input.success?Math.max(.08,Math.min(.15,p.fadeTime)):FAILED_STROKE.fadeDuration;
  const gather=input.success?Math.min(.045,retire*.45):0,fade=input.drawing?1:age<gather?1:Math.max(0,1-(age-gather)/(retire-gather));
  const released=!input.drawing&&!input.exhausted,lastPoint=pts.at(-1)!,lastTime=input.pointTimes.at(-1)??0,cached=this.ribbonCache;
  const same=this.optimized&&cached&&cached.points===pts&&cached.count===pts.length&&cached.last===lastPoint&&cached.time===lastTime&&cached.width===p.strokeWidth&&cached.released===released;
  const ribbon=same?cached.ribbon:brushStroke(pts,input.pointTimes,p.strokeWidth,released);
  if(!same)this.ribbonCache={points:pts,count:pts.length,last:lastPoint,time:lastTime,width:p.strokeWidth,released,ribbon};
  const movingTrace=input.drawing&&!input.exhausted&&input.drawAge-lastTime<p.trailTime;
  const traceKey=JSON.stringify([input.gestureId,pen,fade,input.success,age<.06?age:0,input.dryPoints.length,input.dryPoints.at(-1),p.particles?movingTrace:false]);
  const rebuild=!this.optimized||!same||traceKey!==this.traceKey;this.traceKey=traceKey;
  if(input.gestureId!==this.gesture){this.gesture=input.gestureId;this.angle=0;this.flex=0;}
  if(rebuild){this.trace.clear();
  if(ribbon.length&&fade>0){
   const opacity=p.brightness*fade;
   inkRibbon(this.trace,ribbon,pen.id==='mountain'?pen.gold:pen.body,opacity*(pen.id==='mountain'?.22:.13),1.19);
   inkRibbon(this.trace,ribbon,pen.body,opacity*(.72+p.oldAlpha*.3));
   // Dry hairs follow the stroke, never screen-space random noise or a white neon core.
   const hairs=new Map<string,{width:number;color:number;alpha:number;segments:number[][]}>();
   for(let i=2;i<ribbon.length;i++){
    const a=ribbon[i-1],b=ribbon[i];
    if(b.width<3)continue;
    for(let hair=0;hair<2;hair++){
     if(Math.sin(b.length*.075+hair*2.7)<(b.speed>520?-.05:.72))continue;
     const offset=hair===0?-.21:.27;
     const width=Math.min(.7,b.width*.065),color=hair===0?pen.core:pen.gold,alpha=opacity*(hair===0?.19:.12),segment=[a.x+a.nx*a.width*offset,a.y+a.ny*a.width*offset,b.x+b.nx*b.width*offset,b.y+b.ny*b.width*offset];
     if(this.optimized){const rounded=Math.round(width*100)/100,key=`${hair}/${rounded}`;let group=hairs.get(key);if(!group){group={width:rounded,color,alpha,segments:[]};hairs.set(key,group);}group.segments.push(segment);}
     else this.trace.moveTo(segment[0],segment[1]).lineTo(segment[2],segment[3]).stroke({color,width,alpha,cap:'round'});
    }
   }
   for(const group of hairs.values()){for(const [x,y,x2,y2] of group.segments)this.trace.moveTo(x,y).lineTo(x2,y2);this.trace.stroke({color:group.color,width:group.width,alpha:group.alpha,cap:'round'});}
   if(!input.drawing&&input.success&&age<.06)inkRibbon(this.trace,ribbon,pen.gold,opacity*p.endGlow*.16*(1-age/.06),.68);
  }
  for(let i=1;i<input.dryPoints.length&&fade>0;i++){const a=input.dryPoints[i-1],b=input.dryPoints[i];this.trace.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:pen.body,width:p.strokeWidth*.65,alpha:.16*fade});}
  if(input.drawing&&movingTrace)for(let i=1;i<=p.particles;i++){const q=pts[Math.max(0,pts.length-1-i*2)];spark(this.trace,q.x+Math.sin(i*8)*8,q.y+Math.cos(i*4)*8,1.5,pen.gold,.2);}
  }
  const first=pts[0],last=input.dryPoints.at(-1)??pts.at(-1)!;
  if(input.drawing){
   const u=Math.min(1,input.drawAge/p.startDuration);
   if(pts.length<2){const size=p.strokeWidth*(.2+.13*u)*Math.max(.65,p.startSize/16);this.start.ellipse(first.x,first.y,size*.8,size).fill({color:pen.body,alpha:p.brightness*.9});}
   this.flex*=.78;
   const before=pts[Math.max(0,pts.length-3)],dx=last.x-before.x,dy=last.y-before.y;if(Math.hypot(dx,dy)>4){const desired=Math.atan2(dy,dx)-Math.PI/2,turn=Math.atan2(Math.sin(desired-this.angle),Math.cos(desired-this.angle));this.angle+=turn*.45;this.flex+=Math.max(-4,Math.min(4,turn*5))*.35;}
   const tip=ribbon.at(-1),spread=Math.min(1,(tip?.width??p.strokeWidth)/p.strokeWidth),bend=this.flex;
   this.cursor.position.set(last.x,last.y+(p.offsetY+14));this.cursor.rotation=this.angle;this.cursor.scale.set(p.cursorSize/18);writingNib(this.cursor,pen,spread,bend);
  }else if(input.success&&age<.09){const u=age/.09;this.cursor.position.set(last.x,last.y+(p.offsetY+14)-u*8);this.cursor.rotation=this.angle-.15*u;this.cursor.scale.set(p.cursorSize/18*(1-u*.12));writingNib(this.cursor,pen,1-u,Math.sin(this.angle)*2);this.cursor.alpha=(1-u)*.65;
  }
  if(input.drawing)this.cursor.alpha=input.exhausted?.25:1;
  if(input.debug){if(input.drawing||fade>0){for(const pt of pts)this.debug.circle(pt.x,pt.y,1.5).fill({color:0x72b5a4,alpha:.5*fade});for(const pt of input.last?.geometry.points??[])this.debug.circle(pt.x,pt.y,2).fill({color:pen.gold,alpha:.6*fade});}
   this.debug.roundRect(34,900,440,155,12).fill({color:0x192027,alpha:.9});const result=input.drawing?input.preview:input.last;const advanced=result?.geometry.advanced;if(advanced){for(const c of advanced.corners)this.debug.circle(c.point.x,c.point.y,7).stroke({color:0xc84130,width:2});for(const curve of advanced.curves)this.debug.circle(curve.points[0].x,curve.points[0].y,5).stroke({color:pen.gold,width:2});if(advanced.kind==='spiral')this.debug.circle(advanced.spiralCenter.x,advanced.spiralCenter.y,9).stroke({color:pen.gold,width:2});}
   this.label.visible=true;this.label.text=`第${input.gestureId}笔 · ${input.drawing?'行笔':input.timedOut?'超时封笔':'收笔'} · ${input.pen.skin.name}\n${result?.reason??'采集中'} · 置信度 ${(result?.confidence??0).toFixed(2)}\n累计 ${Math.round(input.totalPathLength)} · 本笔用墨 ${(input.ink?.last.cost??0).toFixed(1)}\n${input.success?'正式成符':input.drawing?'绘制中':'断符消散 · 无攻击'}\n${advanced?`折角 ${advanced.corners.length} · 弧段 ${advanced.curves.length} · 绕转 ${advanced.turns.toFixed(2)}圈`:'青点：原始轨迹 · 金点：分析轨迹'}`;
  }
 }
}

