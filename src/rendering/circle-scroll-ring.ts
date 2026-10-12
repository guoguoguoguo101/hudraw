import {Container,Graphics} from 'pixi.js';
import {AscendantScroll} from './ascendant-scroll';
const PAPER=0xffedce,GOLD=0xe7b769,RED=0xcc3529;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Seven paintings share one polar baseline, forming one continuous unfolding scroll. */
export class CircleScrollRing extends Container{
 panels:Graphics[]=[];echoes:Graphics[]=[];models:AscendantScroll[]=[];opened:number[]=[];
 rollers=new Graphics();progress=0;phaseAngle=0;
 constructor(public radius:number,public bandWidth=60){
  super();
  for(let i=0;i<7;i++){
   const model=new AscendantScroll(i,Math.PI*2*radius/7,bandWidth);this.models.push(model);
   const panel=new Graphics(),echo=new Graphics();this.addChild(panel,echo);this.panels.push(panel);this.echoes.push(echo);
  }
  this.addChild(this.rollers);
 }
 project(i:number,x:number,y:number,t:number){
  const length=this.models[i].length,a=this.phaseAngle+i*Math.PI*2/7+(x+length/2)/this.radius;
  const rad=this.radius+y*(.96+.04*Math.cos(a*2-t*.4))+Math.sin(a*3-t*.4)*3;
  return {x:Math.cos(a)*rad,y:Math.sin(a)*rad};
 }
 update(t:number){
  this.progress=clamp((t-1.12)/1.16);this.phaseAngle=Math.PI*.65+Math.max(0,t-1.12)*.095;this.opened=[];
  this.panels.forEach((g,i)=>{
   g.clear();const echo=this.echoes[i];echo.clear();const model=this.models[i],u=clamp(this.progress*7-i),l=model.length/2,w=this.bandWidth/2,end=-l+model.length*u;this.opened.push(u);if(!u)return;
   const outline:number[]=[];for(let k=0;k<=36;k++){const p=this.project(i,-l+(end+l)*k/36,-w,t);outline.push(p.x,p.y);}for(let k=36;k>=0;k--){const p=this.project(i,-l+(end+l)*k/36,w,t);outline.push(p.x,p.y);}g.poly(outline).fill({color:PAPER});
   for(const sign of [-1,1]){const p=this.project(i,-l,sign*w,t);g.moveTo(p.x,p.y);for(let k=1;k<=36;k++){const q=this.project(i,-l+(end+l)*k/36,sign*w,t);g.lineTo(q.x,q.y);}g.stroke({color:RED,width:2.2,alpha:.95});}
   for(const motif of model.motifs){
    if(Math.max(...motif.points.filter((_,j)=>j%2===0))>end)continue;
    const points:number[]=[],trail:number[]=[];
    for(let k=0;k<motif.points.length;k+=2){const p=this.project(i,motif.points[k],motif.points[k+1],t);points.push(p.x,p.y);const a=Math.atan2(p.y,p.x)-.038,r=Math.hypot(p.x,p.y)+2;trail.push(Math.cos(a)*r,Math.sin(a)*r);}
    if(motif.stroke){for(const [art,pts,alpha] of [[g,points,motif.alpha],[echo,trail,motif.alpha*.11]] as const){art.moveTo(pts[0],pts[1]);for(let k=2;k<pts.length;k+=2)art.lineTo(pts[k],pts[k+1]);art.stroke({color:motif.color,width:motif.stroke,alpha});}}
    else {g.poly(points).fill({color:motif.color,alpha:motif.alpha});echo.poly(trail).fill({color:motif.color,alpha:motif.alpha*.11});}
   }
  });
  // One pair of spindle ends reads as a scroll, rather than seven unrelated cards.
  const g=this.rollers;g.clear();if(this.progress>0){for(const a of [this.phaseAngle,this.phaseAngle+Math.PI*2*this.progress]){
   const nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,r=this.radius,x=nx*r,y=ny*r,w=this.bandWidth/2+8;
   const poly=[x-nx*w-tx*6,y-ny*w-ty*6,x+nx*w-tx*6,y+ny*w-ty*6,x+nx*w+tx*6,y+ny*w+ty*6,x-nx*w+tx*6,y-ny*w+ty*6];g.poly(poly).fill({color:GOLD}).stroke({color:0x282b29,width:1.8});
   for(const sign of [-1,1])g.circle(x+nx*w*sign,y+ny*w*sign,6).fill({color:0x34312b}).stroke({color:GOLD,width:2});
   const px=x+nx*(w+7),py=y+ny*(w+7);g.moveTo(px,py).quadraticCurveTo(px+tx*12,py+ty*12,px+nx*24,py+ny*24).stroke({color:RED,width:2});g.circle(px+nx*24,py+ny*24,4).fill({color:RED});
  }}
 }
 override destroy(options?:Parameters<Container['destroy']>[0]){for(const model of this.models)model.destroy({children:true});super.destroy(options);}
}
