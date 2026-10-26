import {Container,Graphics} from 'pixi.js';
import type {DualBrush} from '../gameplay/dual-brush';
import type {Arena} from '../input/line-interaction-geometry';
import type {Point} from '../input/recognizer';
import {PaperDragonActor} from './paper-dragon';
const GOLD=0xd5ac5d,RED=0xc74d38,PAPER=0xffefc9;

/** Geometry comes from combat; only the paper cutouts and head anatomy are decorative. */
export class DualBrushRenderer{
 root=new Container();private bodies=new Graphics();private details=new Graphics();
 readonly dragons=[new PaperDragonActor(0),new PaperDragonActor(1)];
 constructor(){this.root.eventMode='none';this.root.addChild(this.bodies,...this.dragons.map(d=>d.root),this.details);}
 update(m:DualBrush,enabled:boolean,low:boolean,bounds:Arena){
  this.root.visible=enabled;this.bodies.clear();this.details.clear();for(const d of this.dragons)d.root.visible=false;if(!enabled)return;
  for(const side of m.sides){
   const path=m.geometry(side,bounds),alpha=side.lunge?Math.max(.5,m.opacity):m.opacity;if(path.length<2||alpha<=0)continue;
   if(m.level===4){this.dragons[side.index].update(path,alpha,m.clock,side.index);continue;}
   const color=side.index===0?GOLD:RED,other=side.index===0?PAPER:0xf3ca7f;
   const left:number[]=[],right:number[]=[];
   for(let i=0;i<path.length;i++){
    const prev=path[Math.max(0,i-1)],next=path[Math.min(path.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,n=Math.hypot(dx,dy)||1,t=i/(path.length-1);
    const taper=Math.sin(Math.min(1,t*3)*Math.PI/2)*(m.level<3?Math.max(.08,Math.sin(t*Math.PI)**.45):.45+.55*t),cut=(i%7===0?.82:1),width=m.tier.width*.5*taper*cut;
    left.push(path[i].x-dy/n*width,path[i].y+dx/n*width);right.unshift(path[i].y-dx/n*width);right.unshift(path[i].x+dy/n*width);
   }
   this.bodies.poly([...left,...right]).fill({color,alpha:.94*alpha});
   this.line(this.details,path,other,m.level===4?1.25:.7,.65*alpha);
   if(m.level>=3){
    const head=path.at(-1)!,prev=path.at(-3)??path[0],angle=Math.atan2(head.y-prev.y,head.x-prev.x);
    this.details.save().transform(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),head.x,head.y);
    if(m.level===3){
     this.details.poly([-7,-5,4,-6,12,-1,8,4,-6,5,-10,1]).fill({color,alpha});
     this.details.poly([1,-3,6,-2,3,0]).fill({color:PAPER,alpha});
     this.details.moveTo(-3,-5).lineTo(-5,-9).lineTo(2,-6).stroke({color:other,width:1,alpha});
    }
    this.details.restore();
    for(let i=low?12:7;i<path.length-4;i+=low?13:9){const p=path[i],a=path[i-1],b=path[i+1],angle=Math.atan2(b.y-a.y,b.x-a.x);this.details.save().transform(Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),p.x,p.y).poly([-3,-1,1,-3,4,0,1,2]).fill({color:other,alpha:alpha*.65}).restore();}
   }
  }
  for(const hit of m.hits){const alpha=Math.max(0,1-hit.age/.16),g=this.details;g.moveTo(hit.x-hit.dx*11,hit.y-hit.dy*11).lineTo(hit.x+hit.dx*11,hit.y+hit.dy*11).stroke({color:PAPER,width:2.4*alpha,alpha});g.moveTo(hit.x+hit.dy*5,hit.y-hit.dx*5).lineTo(hit.x-hit.dy*5,hit.y+hit.dx*5).stroke({color:GOLD,width:1,alpha});}
 }
 private line(g:Graphics,path:Point[],color:number,width:number,alpha:number){g.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];g.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}g.lineTo(path.at(-1)!.x,path.at(-1)!.y).stroke({color,width,alpha});}
}
