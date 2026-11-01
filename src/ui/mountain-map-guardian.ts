import {Container,Graphics,GraphicsContext} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import {decodePaperPath} from '../rendering/chapter-art/vector-art';

type Part={name:string;parent:string|null;pivot:[number,number];paths:[number,string,string[],number?,number?][]};
export type GuardianVector={width:number;height:number;encoding:string;parts:Part[];eyes:Eye[]};
export type GuardianVectors=Record<HualingChapter,GuardianVector>;
const contexts=new WeakMap<Part,GraphicsContext>();
type Eye={x:number;y:number;rx:number;ry:number;angle:number;color:number};
const pulse=(t:number,period:number,offset=0)=>{const p=((t+offset)%period+period)%period;return p<.24?Math.sin(p/.24*Math.PI):0;};

/** True native vector layers, hinged at anatomical joints. No character texture or DOM. */
export class MountainMapGuardian{
 readonly root=new Container();
 readonly parts=new Map<string,Container>();
 private lids:{node:Container;cover:Graphics;line:Graphics;mask:Graphics;eye:Eye}[]=[];
 constructor(readonly chapter:HualingChapter,readonly data:GuardianVector){
  this.root.eventMode='none';
  for(const part of data.parts){
   const node=new Container();node.label=part.name;this.parts.set(part.name,node);
   const parent=part.parent?data.parts.find(p=>p.name===part.parent):undefined;
   node.position.set(part.pivot[0]-(parent?.pivot[0]??0),part.pivot[1]-(parent?.pivot[1]??0));
   (part.parent?this.parts.get(part.parent)!:this.root).addChild(node);
   let context=contexts.get(part);
   if(!context){
    context=new GraphicsContext();
    for(const [color,d,holes,width=0,alpha=1]of part.paths){
     context.beginPath().path(decodePaperPath(d,data.encoding));
     if(width)context.stroke({color,width,alpha,cap:'round',join:'round'});else context.fill({color,alpha});
     if(holes.length){
      // Group each shape's holes in one cut. Repeated cuts also affect the
      // preceding fill in Pixi, which can open unrelated silhouettes.
      context.beginPath();for(const hole of holes)context.path(decodePaperPath(hole,data.encoding));context.cut();
     }
    }
    contexts.set(part,context);
   }
   const art=new Graphics(context);art.position.set(-part.pivot[0],-part.pivot[1]);node.addChild(art);
  }
  const head=data.parts.find(p=>p.name==='head')!,headNode=this.parts.get('head')!;
  for(const eye of data.eyes){
   const node=new Container(),mask=new Graphics(),cover=new Graphics(),line=new Graphics(),art=new Graphics();
   node.position.set(eye.x-head.pivot[0],eye.y-head.pivot[1]);node.rotation=eye.angle;
   art.moveTo(-eye.rx,0).quadraticCurveTo(0,-eye.ry*1.5,eye.rx,0).quadraticCurveTo(0,eye.ry*1.5,-eye.rx,0).fill(chapter==='sea'?0xdfdbc0:0x283b43);
   if(chapter==='sea')art.ellipse(0,0,eye.rx*.37,eye.ry*.8).fill(0x203e40);
   else art.ellipse(-eye.rx*.04,0,eye.rx*.43,eye.ry*.68).fill(0xc6b78d).ellipse(0,0,eye.rx*.22,eye.ry*.6).fill(0x152e38);
   art.circle(-eye.rx*.15,-eye.ry*.2,eye.ry*.16).fill(0xfff9df);
   mask.moveTo(-eye.rx,0).quadraticCurveTo(0,-eye.ry*1.5,eye.rx,0).quadraticCurveTo(0,eye.ry*1.5,-eye.rx,0).fill(0xffffff);
   cover.rect(-eye.rx-2,-eye.ry*1.5,eye.rx*2+4,eye.ry*3).fill(eye.color);cover.pivot.y=-eye.ry*1.5;cover.y=-eye.ry*1.5;cover.mask=mask;
   line.moveTo(-eye.rx,0).quadraticCurveTo(0,eye.ry*.36,eye.rx,0).stroke({color:chapter==='sea'?0x234c4c:0x334149,width:1.7});
   node.addChild(art,mask,cover,line);headNode.addChild(node);this.lids.push({node,cover,line,mask,eye});
  }
  const face=new Graphics();face.position.set(-head.pivot[0],-head.pivot[1]);headNode.addChild(face);
  if(chapter==='snow')face.moveTo(512,242).quadraticCurveTo(521,239,527,244).quadraticCurveTo(522,254,517,251).closePath().fill(0x233b46);
  if(chapter==='valley')face.ellipse(538,291,8,5).fill(0x343a34);
  this.update(0,0,true);
 }
 update(time:number,response=0,reduced=false){
  const t=reduced?0:time,r=reduced?0:response,breath=Math.sin(t*.95);
  for(const part of this.data.parts){
   const node=this.parts.get(part.name)!,parent=part.parent?this.data.parts.find(p=>p.name===part.parent):undefined;
   node.position.set(part.pivot[0]-(parent?.pivot[0]??0),part.pivot[1]-(parent?.pivot[1]??0));node.rotation=0;node.scale.set(1);
  }
  const body=this.parts.get('body')!,head=this.parts.get('head')!;
  body.scale.set(1+breath*.006,1+breath*.012);
  if(this.chapter==='valley'){
   head.rotation=Math.sin(t*.85)*.052-r*.045;
   this.parts.get('antlers')!.rotation=Math.sin(t*.95+.6)*.018+r*.014;
   this.parts.get('ear')!.rotation=Math.sin(t*1.3)*.05+pulse(t,7,1.5)*.1;
   this.parts.get('mane')!.rotation=Math.sin(t*.95+1)*.05+r*.026;
  }else if(this.chapter==='sea'){
   body.y+=Math.sin(t*.9)*10;body.rotation=Math.sin(t*.7)*.012;
   head.rotation=Math.sin(t*.9+.4)*.038-r*.03;
   this.parts.get('tail')!.rotation=Math.sin(t*1.35)*.17+r*.065;
  }else if(this.chapter==='palace'){
   this.parts.get('wing-upper')!.rotation=Math.sin(t*.95)*.075-r*.035;
   this.parts.get('wing-lower')!.rotation=-Math.sin(t*.95+.9)*.07+r*.035;
   head.rotation=Math.sin(t*.8)*.052+r*.028;body.y+=Math.sin(t*.85)*5;
  }else{
   head.rotation=Math.sin(t*.85)*.05-r*.035;
   for(const [i,name]of ['tail-far','tail-middle','tail-near'].entries())this.parts.get(name)!.rotation=Math.sin(t*1.05-i*.9)*(.08+i*.015)+r*(.025+i*.015);
   this.parts.get('ear-left')!.rotation=Math.sin(t*1.1)*.035+pulse(t,6.7,.8)*.1;
   this.parts.get('ear-right')!.rotation=-Math.sin(t*1.1+.4)*.04-pulse(t,6.7,1)*.085;
  }
  const blink=reduced?0:pulse(t,5.8,['valley','sea','palace','snow'].indexOf(this.chapter)*.8+2.5);
  for(const lid of this.lids){lid.cover.scale.y=blink;lid.cover.visible=blink>.001;lid.line.visible=blink>.88;}
 }
 destroy(){this.root.destroy({children:true});}
}
