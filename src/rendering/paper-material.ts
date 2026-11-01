import {Container,Graphics,Mesh,MeshPlane,Sprite,Rectangle,type Renderer,type Texture} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';
export const PAPER_STYLE={ink:0x263b37,paper:0xf5e2b8,light:0xffefd0,shade:0xc8a16c,red:0xb84d38,vermilion:0xe18255,jade:0x6a8b77,teal:0x345b55,blue:0x617990,gold:0xdfb777};
export function paperPlate(g:Graphics,path:(g:Graphics)=>Graphics,color:number){g.save().translateTransform(1.5,3);path(g).fill(PAPER_STYLE.ink).stroke({color:PAPER_STYLE.ink,width:3,join:'round'});g.restore();path(g).fill(color).stroke({color:PAPER_STYLE.ink,width:1.7,join:'round'});}
export function paperStock(color:number,chapter:HualingChapter){const p=PAPER_STYLE,pool=[p.ink,0x192e2c,p.paper,p.light,p.shade,p.gold,p.red,p.vermilion,chapter==='sea'?p.jade:chapter==='palace'?p.blue:chapter==='snow'?0x9eafa9:p.teal,chapter==='snow'?0xdde2d2:p.teal];let best=pool[0],score=Infinity;for(const c of pool){const d=((color>>16&255)-(c>>16&255))**2*.3+((color>>8&255)-(c>>8&255))**2*.5+((color&255)-(c&255))**2*.2;if(d<score){best=c;score=d;}}return best;}
/** Shared skinned geometry keeps material edges registered to the animated anatomy. */
export class PaperMeshRelief{
 private shadow:Mesh;private rim:Mesh;private enabled=false;
 constructor(private source:MeshPlane){this.shadow=new Mesh({geometry:source.geometry,texture:source.texture});this.rim=new Mesh({geometry:source.geometry,texture:source.texture});const parent=source.parent!;parent.addChildAt(this.shadow,parent.getChildIndex(source));parent.addChildAt(this.rim,parent.getChildIndex(source));this.shadow.tint=PAPER_STYLE.ink;this.rim.tint=PAPER_STYLE.shade;this.shadow.visible=this.rim.visible=false;}
 update(enabled:boolean){this.enabled=enabled;const s=this.source;this.shadow.visible=this.rim.visible=enabled&&s.visible;if(!enabled)return;for(const [m,scale,dx,dy]of [[this.shadow,1.025,1.5,3.5],[this.rim,1.012,-.5,-.5]] as const){m.position.set(s.x+dx,s.y+dy);m.scale.set(s.scale.x*scale,s.scale.y*scale);m.rotation=s.rotation;m.skew.copyFrom(s.skew);m.alpha=s.alpha;}}
 destroy(){this.shadow.destroy();this.rim.destroy();}
}
/** Static contours are captured once; shadow sprites follow their original articulated parts. */
export class PaperVectorRelief{
 private bindings:{source:Graphics;root:Container;texture:Texture}[]=[];
 constructor(sources:Graphics[],renderer:Renderer){for(const source of sources){if(!source.parent)continue;const b=source.getLocalBounds();if(b.width<2||b.height<2)continue;const clone=new Graphics({context:source.context}),texture=renderer.generateTexture({target:clone,frame:new Rectangle(b.x-3,b.y-3,b.width+6,b.height+6),resolution:1.5,antialias:true});clone.destroy({context:false});const root=new Container();for(const [tint,x,y,scale]of [[PAPER_STYLE.ink,2,4,1.025],[PAPER_STYLE.shade,0,0,1.01]]){const s=new Sprite(texture);s.tint=tint;s.position.set(b.x-3+x,b.y-3+y);s.scale.set(scale);root.addChild(s);}source.parent.addChildAt(root,source.parent.getChildIndex(source));this.bindings.push({source,root,texture});}}
 update(enabled:boolean){for(const {source,root}of this.bindings){root.visible=enabled&&source.visible;root.position.copyFrom(source.position);root.scale.copyFrom(source.scale);root.skew.copyFrom(source.skew);root.rotation=source.rotation;root.alpha=source.alpha;}}
 destroy(){for(const b of this.bindings){b.root.destroy({children:true});b.texture.destroy(true);}this.bindings=[];}
}
