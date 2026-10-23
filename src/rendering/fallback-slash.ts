import {Container,Graphics} from 'pixi.js';
import type {FallbackSlash} from '../gameplay/fallback-slash';
import {FALLBACK_SLASH as C} from '../gameplay/fallback-slash-config';
import type {Arena} from '../input/line-interaction-geometry';

/** A short moving ribbon follows the exact collision polyline, including clipped gaps. */
export class FallbackSlashRenderer{
 root=new Container();private mask=new Graphics();private ink=new Graphics();
 constructor(){this.root.addChild(this.mask,this.ink);this.ink.mask=this.mask;}
 clear(){this.ink.clear();}
 update(items:FallbackSlash[],enabled:boolean,bounds:Arena,debug=false){
  this.root.visible=enabled;this.ink.clear();if(!enabled)return;
  this.mask.clear().rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top).fill(0xffffff);
  const g=this.ink;
  for(const s of items){
   const progress=Math.min(1,s.age/C.sweepDuration),head=progress*s.length,fade=Math.max(0,1-Math.max(0,s.age-C.sweepDuration)/(C.duration-C.sweepDuration));
   for(const p of s.segments){
    if(p.start>=head)break;
    const u=Math.min(1,(head-p.start)/(p.end-p.start)),b={x:p.a.x+(p.b.x-p.a.x)*u,y:p.a.y+(p.b.y-p.a.y)*u};
    const center=(p.start+Math.min(p.end,head))/2/s.length,taper=.25+.75*Math.sin(Math.PI*Math.min(.98,Math.max(.02,center)))**.5;
    const hot=Math.max(.25,1-(head-(p.start+Math.min(p.end,head))/2)/Math.max(60,s.length*.3)),alpha=fade*(.35+hot*.65);
    for(const [width,color,a] of [[13*taper,s.pen.body,alpha*.45],[7*taper,s.pen.gold,alpha*.9],[2.8*taper,s.pen.core,alpha]] as const){g.moveTo(p.a.x,p.a.y).lineTo(b.x,b.y).stroke({width,color,alpha:a});}
    if(debug)g.moveTo(p.a.x,p.a.y).lineTo(p.b.x,p.b.y).stroke({width:C.width,color:0x7fe2ca,alpha:.12});
    if(p.end>=head&&progress<1){
     const dx=b.x-p.a.x,dy=b.y-p.a.y,n=Math.hypot(dx,dy)||1;
     g.poly([b.x+dx/n*8,b.y+dy/n*8,b.x-dy/n*4,b.y+dx/n*4,b.x-dx/n*11,b.y-dy/n*11,b.x+dy/n*4,b.y-dx/n*4]).fill({color:s.pen.core,alpha:fade});
    }
   }
   // Tiny lift-off flecks; no persistent floor mark or extra attack geometry.
   const last=s.segments.at(-1)!;
   if(progress===1)for(let i=0;i<3;i++){const age=s.age-C.sweepDuration,a=s.id+i*2.399,x=last.b.x+Math.cos(a)*age*60,y=last.b.y+Math.sin(a)*age*60;g.moveTo(x,y).lineTo(x+Math.cos(a)*4,y+Math.sin(a)*4).stroke({width:1.4,color:s.pen.gold,alpha:fade*.65});}
  }
 }
}
