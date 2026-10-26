import {InkCompanionRenderer} from './ink-companions';
import {Container,Graphics} from 'pixi.js';
import {InkTrail,type TrailStyle,type TrailSegment} from '../gameplay/ink-trail';
import type {Arena} from '../input/line-interaction-geometry';
import {mapleLeaf} from './petal-brush';

/** Grounded translucent ink with cut-paper leaves or restrained silver channels. */
export class InkTrailRenderer{
 companions=new InkCompanionRenderer();root=new Container();front=new Container();private frontClip=new Graphics();private stains=new Graphics();private veins=new Graphics();private ornaments=new Graphics();private clip=new Graphics();
 private model?:InkTrail;private revision=-1;private frame=-1;private low=false;private boundsKey='';private count=-1;
 constructor(){this.root.eventMode='none';this.root.addChild(this.stains,this.veins,this.ornaments,this.clip);this.root.mask=this.clip;this.front.addChild(this.companions.root,this.frontClip);this.front.mask=this.frontClip;}
 update(model:InkTrail,enabled:boolean,bounds:Arena,low=false){
  this.root.visible=this.front.visible=enabled;
  if(!enabled){this.frame=-1;return;}
  const boundsKey=`${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}`,frame=Math.floor(model.time*20);
  const changedBounds=boundsKey!==this.boundsKey;
  if(changedBounds){for(const clip of [this.clip,this.frontClip])clip.clear().rect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top).fill(0xffffff);this.boundsKey=boundsKey;}
  // Static ink needs a slow fade, not a new tessellation on every display frame.
  // New/retouched input, expiry, reset, layout and quality still invalidate immediately.
  if(this.model!==model||this.revision!==model.revision||this.frame!==frame||this.low!==low||this.count!==model.segments.length||changedBounds){
   this.model=model;this.revision=model.revision;this.frame=frame;this.low=low;this.count=model.segments.length;
   this.drawGround(model,low);
  }
  this.companions.update(model.companions,low);
 }

 private drawGround(model:InkTrail,low:boolean){
  this.stains.clear();this.veins.clear();this.ornaments.clear();
  const groups=new Map<string,{segments:TrailSegment[];fade:number}>();
  let branches=0,leaves=0,specks=0,motes=0;
  for(const s of model.segments){
   const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,n=Math.hypot(dx,dy)||1,nx=-dy/n,ny=dx/n;
   const age=model.time-s.born,remaining=s.expires-model.time,fade=Math.min(1,age/.12,remaining/.75),level=s.level;
   if(fade<=0)continue;
   const bucket=Math.ceil(fade*8),key=`${s.style}/${s.width}/${level}/${bucket}`;
   let group=groups.get(key);if(!group){group={segments:[],fade:bucket/8};groups.set(key,group);}group.segments.push(s);
   const electric=s.style==='thunder'||s.style==='maple-thunder',maple=s.style==='maple'||s.style==='maple-thunder';
   const body=electric?0x576363:maple?0x73513e:0x263c40;
   const width=s.width,breathe=.5+.5*Math.sin(model.time*2.6+s.id*.23);
   const g=this.stains;
   // Sparse feathered sides leave room for the scenery to show through the ink.
   if(!low&&s.id%9===0&&specks++<12){
    const side=s.id%2?1:-1,x=(s.a.x+s.b.x)/2+nx*width*.45*side,y=(s.a.y+s.b.y)/2+ny*width*.45*side;
    g.ellipse(x,y,1.5+level*.3,1).fill({color:body,alpha:fade*.5});
   }
   if(electric){
    const mx=(s.a.x+s.b.x)/2,my=(s.a.y+s.b.y)/2;
    if(s.id%13===0&&branches<(low?2:6)){
     branches++;const side=s.id%2?1:-1;
     this.ornaments.moveTo(mx,my).lineTo(mx+nx*side*7-dx/n*3,my+ny*side*7-dy/n*3).lineTo(mx+nx*side*12+dx/n*2,my+ny*side*12+dy/n*2).stroke({color:0xd2c6a4,width:.7,alpha:fade*.5});
    }
   }
   if(maple&&s.id%(low?12:6)===0&&leaves++<(low?6:12)){
    const side=s.id%2?1:-1,u=.3+(s.id%4)*.13,x=s.a.x+dx*u+nx*width*.3*side,y=s.a.y+dy*u+ny*width*.3*side;
    const angle=Math.atan2(dy,dx)+side*.6,scale=.35+level*.075,flutter=1+Math.sin(model.time*2+s.id)*.055;
    this.ornaments.save().transform(Math.cos(angle)*scale,Math.sin(angle)*scale,-Math.sin(angle)*scale*flutter,Math.cos(angle)*scale*flutter,x,y);
    mapleLeaf(this.ornaments,s.id%2?0xe37342:0xe6b663,fade*.9);this.ornaments.restore();
   }
   if(level>=3&&s.id%(low?18:10)===0&&motes++<(low?4:8)){
    const t=(model.time*.5+s.id*.19)%1,x=s.a.x+dx*t,y=s.a.y+dy*t;
    this.veins.ellipse(x,y,1.4,.7).fill({color:electric?0xf0e5c3:0xe4b173,alpha:fade*(.3+.3*breathe)});
   }
  }
  // One path per matching style/fade replaces hundreds of separately stroked paths.
  for(const {segments,fade} of groups.values()){
   const s=segments[0],electric=s.style==='thunder'||s.style==='maple-thunder',maple=s.style==='maple'||s.style==='maple-thunder';
   const ink=0x111e24,body=electric?0x576363:maple?0x73513e:0x263c40;
   for(const p of segments)this.stains.moveTo(p.a.x,p.a.y).lineTo(p.b.x,p.b.y);
   this.stains.stroke({color:ink,width:s.width,alpha:fade*(.36+s.level*.035),cap:'round'});
   for(const p of segments)this.stains.moveTo(p.a.x,p.a.y).lineTo(p.b.x,p.b.y);
   this.stains.stroke({color:body,width:s.width*.52,alpha:fade*.32,cap:'round'});
   for(const p of segments){
    const dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,n=Math.hypot(dx,dy)||1;
    const wiggle=electric?Math.sin(p.id*2.4+Math.floor(model.time*8))*(1+s.level*.35):Math.sin(p.id*1.7)*Math.min(2,s.width*.1);
    this.veins.moveTo(p.a.x,p.a.y).lineTo((p.a.x+p.b.x)/2-dy/n*wiggle,(p.a.y+p.b.y)/2+dx/n*wiggle).lineTo(p.b.x,p.b.y);
   }
   this.veins.stroke({color:electric?0xe3e3d3:0xdb9d60,width:.7+s.level*.15,alpha:fade*(electric?.52:.42)});
  }
 }
}
