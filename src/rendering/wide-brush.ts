import {BufferImageSource,Container,Graphics,Sprite,Text,Texture} from 'pixi.js';
import {WIDE_FINISHER,type BrushUpgrades} from '../gameplay/brush-upgrades';
import type {WideWave,RiftPoint} from '../gameplay/brush-upgrades';
import type {Arena} from '../input/line-interaction-geometry';

let lightTexture:Texture|undefined;
function softLight(){
 if(lightTexture)return lightTexture;
 const size=64,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=((x+0.5-size/2)/(size/2))**2+((y+0.5-size/2)/(size/2))**2;
  const a=Math.round(255*Math.max(0,(Math.exp(-r*5)-Math.exp(-5))/(1-Math.exp(-5)))),i=(y*size+x)*4;
  pixels[i]=pixels[i+1]=pixels[i+2]=pixels[i+3]=a;
 }
 lightTexture=new Texture({source:new BufferImageSource({resource:pixels,width:size,height:size,format:'rgba8unorm',alphaMode:'premultiplied-alpha',scaleMode:'linear'})});return lightTexture;
}

/** Brush-following void seams; every vertex comes from the real input path. */
export class WideBrushRenderer{
 root=new Container();private lights=new Container();private halos:Sprite[]=[];private glow=new Graphics();private art=new Graphics();
 private titleArt=new Graphics();private title=new Text({text:'一笔破空',style:{fontFamily:'KaiTi, STKaiti, serif',fontSize:38,fontWeight:'bold',fill:0xffe2a2,stroke:{color:0x343b2b,width:3}}});
 private subtitle=new Text({text:'笔过之处 · 虚空裂开',style:{fontFamily:'KaiTi, STKaiti, serif',fontSize:17,fill:0xf1d5a2,stroke:{color:0x26382f,width:2}}});
 constructor(){this.root.eventMode='none';this.glow.blendMode='add';for(const t of [this.title,this.subtitle])t.anchor.set(.5);this.root.addChild(this.lights,this.glow,this.art,this.titleArt,this.title,this.subtitle);}
 update(m:BrushUpgrades,enabled:boolean,low=false,bounds?:Arena){
  this.root.visible=enabled&&m.levels.wide>0;this.title.visible=this.subtitle.visible=false;for(const s of this.halos)s.visible=false;this.glow.clear();this.art.clear();this.titleArt.clear();if(!this.root.visible)return;
  const g=this.art,p=m.tip??m.wideAnchor,level=m.levels.wide;
  const evolve=m.clock-m.wideEvolvedAt;
  if(evolve>=0&&evolve<.7){
   const alpha=Math.min(1,evolve/.08,(.7-evolve)/.18),x=((bounds?.left??26)+(bounds?.right??694))/2,y=(bounds?.top??300)+88;
   this.titleArt.moveTo(x-132,y-22).lineTo(x+125,y-30).lineTo(x+138,y+28).lineTo(x-128,y+35).closePath().fill({color:0x24372f,alpha:alpha*.9}).stroke({color:0xcda464,width:1,alpha:alpha*.7});
   this.title.visible=this.subtitle.visible=true;this.title.position.set(x,y-2);this.subtitle.position.set(x,y+48);this.title.alpha=this.subtitle.alpha=alpha;this.title.scale.set(1+Math.max(0,1-evolve/.16)*.1);
  }
  if(m.stroke&&m.tip){
   const angle=Math.atan2(m.direction.y,m.direction.x),c=Math.cos(angle),s=Math.sin(angle),r=m.bladeRadius;
   g.save().transform(c,s,-s,c,p.x,p.y);
   if(level===3){
    const ready=false,ink=0x6d2928,red=0xb9402b;
    g.moveTo(-r*.55,-r).bezierCurveTo(r*1.08,-r*.72,r*1.08,r*.72,-r*.55,r).bezierCurveTo(r*.3,r*.38,r*.3,-r*.38,-r*.55,-r).fill({color:ink,alpha:ready?.95:.8});
    g.moveTo(-r*.5,-r*.87).bezierCurveTo(r*.85,-r*.62,r*.85,r*.62,-r*.5,r*.87).bezierCurveTo(r*.37,r*.33,r*.37,-r*.33,-r*.5,-r*.87).fill({color:red,alpha:ready?.95:.72});
    g.moveTo(-r*.55,-r).bezierCurveTo(r*1.08,-r*.72,r*1.08,r*.72,-r*.55,r).stroke({color:0xffe3a8,width:ready?4:2,alpha:ready?.95:.8});
    g.moveTo(-r*.55,-r).bezierCurveTo(r*1.15,-r*.76,r*1.15,r*.76,-r*.55,r).stroke({color:0xcf9f58,width:1,alpha:.8});
    for(let i=0;i<3;i++){const yy=(i-1)*r*.4;g.moveTo(-r*.12,yy).quadraticCurveTo(r*.25,yy*.8,r*.37,yy*.5).stroke({color:0xf1bf77,width:1,alpha:.6});}
   }else if(level<4){
    g.moveTo(-r*.5,-r).quadraticCurveTo(r*.8,0,-r*.5,r).quadraticCurveTo(r*.14,0,-r*.5,-r).fill({color:0xffe4ae,alpha:level===2?.78:.4});
   }
   g.restore();
  }
  for(const [i,w] of m.wideWaves.entries()){this.rift(w,m.clock,i*4,low);}
  for(const cut of m.wideCuts){
   const fade=1-cut.age/.24,c=cut.dx,s=cut.dy,r=32+cut.age*40;
   if(cut.void){
    const r=8+cut.age*65;
    g.ellipse(cut.x,cut.y,r*.7,r).stroke({color:0xaccfff,width:2,alpha:fade*.9});
    g.moveTo(cut.x-r,cut.y).lineTo(cut.x+r,cut.y).moveTo(cut.x,cut.y-r).lineTo(cut.x,cut.y+r).stroke({color:0xe1eaff,width:1.3,alpha:fade});
    continue;
   }
   g.save().transform(c,s,-s,c,cut.x,cut.y);
   g.moveTo(-7,-r).lineTo(9,r).stroke({color:0x572b25,width:5,alpha:fade*.8});
   g.moveTo(-6,-r).lineTo(8,r).stroke({color:0xffe6b3,width:cut.age<.07?3:1.4,alpha:fade});
   for(const sign of [-1,1]){const x=sign*(8+cut.age*85),y=sign*16;g.poly([x,y-4,x+5,y,x,y+4,x-3,y]).fill({color:0xebc184,alpha:fade});}
   g.restore();
  }
 }
 private rift(w:WideWave,now:number,index:number,low:boolean){
  const runs:RiftPoint[][]=[];
  for(const p of w.path){if(!runs.length||p.break)runs.push([]);runs[runs.length-1].push(p);}
  const g=this.art,h=this.glow,electric=w.style.includes('thunder');
  const edge=electric?0xe7f8ff:0xfff1ce,accent=electric?0x71c9ed:0xe9b86b;
  const strength=(p:RiftPoint)=>Math.max(0,Math.min(1,(now-p.born)/.065,(w.life-now+p.born)/.38));
  const line=(target:Graphics,points:number[])=>{target.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)target.lineTo(points[i],points[i+1]);};
  for(const run of runs){
   if(run.length<2)continue;
   const upper:number[]=[],lower:number[]=[],center:number[]=[],rim:number[]=[],normals:{x:number;y:number;width:number}[]=[];
   let alpha=0;
   for(let i=0;i<run.length;i++){
    const p=run[i],before=run[Math.max(0,i-1)],after=run[Math.min(run.length-1,i+1)];
    let dx=after.x-before.x,dy=after.y-before.y,len=Math.hypot(dx,dy);
    if(len<.01){dx=p.x-before.x;dy=p.y-before.y;len=Math.hypot(dx,dy)||1;}
    const nx=-dy/len,ny=dx/len,f=strength(p),taper=Math.min(1,(i+0.15)/2,(run.length-i-.85)/2);
    const width=(WIDE_FINISHER.radius+3*Math.sin(p.distance*.045)+2*Math.sin(p.distance*.13+w.id))*f*Math.max(.06,taper);
    normals.push({x:nx,y:ny,width});
    upper.push(p.x+nx*width,p.y+ny*width);lower.push(p.x-nx*width,p.y-ny*width);center.push(p.x,p.y);alpha=Math.max(alpha,f);
   }
   if(alpha<=0)continue;
   // Every glow follows the same polyline; no stretched halo or chord across curves.
   for(const [width,a] of (low?[[110,.07],[80,.12]]:[[136,.04],[108,.07],[80,.12]])){
    line(h,center);h.stroke({color:accent,width,alpha:a*alpha,cap:'round',join:'round'});
   }
   rim.push(...upper);for(let i=lower.length-2;i>=0;i-=2)rim.push(lower[i],lower[i+1]);
   g.poly(rim).fill({color:0x020510,alpha:alpha*.97});
   line(g,center);g.stroke({color:0x06091b,width:4,alpha:alpha*.85,join:'round',cap:'round'});
   line(h,upper);h.stroke({color:accent,width:9,alpha:alpha*.28,join:'round'});
   line(h,lower);h.stroke({color:0x6b9fcc,width:7,alpha:alpha*.24,join:'round'});
   line(g,upper);g.stroke({color:accent,width:4,alpha:alpha*.8,join:'round'});
   line(g,upper);g.stroke({color:edge,width:1.6,alpha:alpha,join:'round'});
   line(g,lower);g.stroke({color:0x85badd,width:1.4,alpha:alpha*.9,join:'round'});
   // Layered nebula ribbons stay inside the actual opening, including curves and caps.
   for(let lane=0;lane<(low?2:3);lane++){
    const ribbon:number[]=[];
    for(let i=0;i<run.length;i++){
     const p=run[i],n=normals[i],offset=Math.sin(p.distance*.023-now*.9+lane*2.1)*n.width*.48;
     ribbon.push(p.x+n.x*offset,p.y+n.y*offset);
    }
    line(g,ribbon);g.stroke({color:lane%2?0x404675:0x17465e,width:lane===0?13:7,alpha:alpha*.4,join:'round',cap:'round'});
    line(g,ribbon);g.stroke({color:0x6e9fcb,width:.65,alpha:alpha*.38,join:'round'});
   }
   const stride=Math.max(3,Math.ceil(run.length/(low?5:10)));
   for(let i=1;i<run.length-1;i+=stride){
    const p=run[i],f=strength(p),n=normals[i],offset=Math.sin(p.distance*.14+w.id)*n.width*.65;
    const x=p.x+n.x*offset,y=p.y+n.y*offset,r=(1.3+.6*Math.sin(p.distance+now*2))*f;
    g.circle(x,y,r).fill({color:0xd5eaff,alpha:f*.85});
    if(i%2){g.moveTo(x-r*2,y).lineTo(x+r*2,y).moveTo(x,y-r*2).lineTo(x,y+r*2).stroke({color:0xa4c9ff,width:.65,alpha:f*.6});}
   }
   // A quick cross-seam collapse matches the delayed interior damage, without a screen flash.
   const pulseStride=Math.max(3,Math.ceil(run.length/(low?4:8)));
   for(let i=1;i<run.length-1;i+=pulseStride){
    const p=run[i],n=normals[i],age=now-p.born-WIDE_FINISHER.burstDelay;
    if(age<-.10||age>.19)continue;
    const flash=Math.max(0,1-Math.abs(age)/.19)*strength(p),r=n.width*(.25+.6*Math.min(1,Math.abs(age)/.12));
    g.moveTo(p.x-n.x*r,p.y-n.y*r).lineTo(p.x+n.x*r,p.y+n.y*r).stroke({color:0xb7dcff,width:1.2,alpha:flash*.85});
    g.circle(p.x,p.y,2.5*flash).fill({color:0xf2f5ff,alpha:flash});
   }

  }
  while(this.halos.length<index+4){const s=new Sprite(softLight());s.anchor.set(.5);s.blendMode='add';this.lights.addChild(s);this.halos.push(s);}
  for(let i=0;i<(low?2:4);i++){
   const p=w.path[Math.floor((w.path.length-1)*(i+.5)/4)];if(!p)continue;
   const s=this.halos[index+i],f=strength(p);s.visible=f>0;s.position.set(p.x,p.y);s.width=s.height=105;s.alpha=f*.19;s.tint=accent;
  }
 }
}
