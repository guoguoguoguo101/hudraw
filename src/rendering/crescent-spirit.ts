import {PaperMeshRelief} from './paper-material';
import {Container,Graphics,MeshPlane,type Texture} from 'pixi.js';
import {drawCrescentSpirit} from './crescent-art';
import {CRESCENT_GUARD} from '../gameplay/crescent-guard';

/** A soft paper spirit: the ear, moon tips and ink tail move around the sleepy face. */
export class CrescentSpirit extends Container{
 paperStyle=false;private relief?:PaperMeshRelief;private fallback=new Graphics();mesh?:MeshPlane;private rest?:Float32Array;
 constructor(){super();drawCrescentSpirit(this.fallback);this.addChild(this.fallback);}
 set texture(texture:Texture){
  this.relief?.destroy();this.relief=undefined;
  if(this.mesh){const geometry=this.mesh.geometry;this.mesh.destroy();geometry.destroy();}
  this.mesh=new MeshPlane({texture,verticesX:15,verticesY:15});this.mesh.autoResize=false;
  this.rest=new Float32Array(this.mesh.geometry.positions);
  const scale=108/Math.max(texture.width,texture.height);this.mesh.scale.set(scale);
  this.mesh.position.set(-texture.width*scale/2,-texture.height*scale/2);
  this.fallback.visible=false;this.addChild(this.mesh);this.relief=new PaperMeshRelief(this.mesh);
 }
 animate(age:number,index:number,depth:number){
  if(!this.mesh||!this.rest)return;
  const w=this.mesh.texture.width,h=this.mesh.texture.height,vertices=this.mesh.geometry.positions;
  const time=age*Math.PI*2/CRESCENT_GUARD.period+index*1.7,breath=Math.sin(time)*.012;
  for(let i=0;i<vertices.length;i+=2){
   const u=this.rest[i]/w,v=this.rest[i+1]/h,x=u-.5,y=v-.5;
   // Keep the face steady; soften the moon ends and let the ink rim lag behind.
   const upper=Math.max(0,(.46-v)/.46)*Math.max(0,(u-.3)/.7);
   const tail=Math.max(0,(v-.65)/.35),rim=Math.max(0,(.4-u)/.4);
   const curl=Math.sin(time-v*3.2)*.018*(upper+tail*.8+rim*.35);
   vertices[i]=(u+x*breath+curl)*w;
   vertices[i+1]=(v-y*breath+Math.sin(time-.8)*upper*.014+Math.sin(time-1.3)*tail*.008)*h;
  }
  this.mesh.geometry.getAttribute('aPosition').buffer.update();
  // A cool distant side and a warm lit foreground preserve the watercolor volume.
  const r=Math.round(236+19*depth),g=Math.round(242+13*depth),b=Math.round(239+16*depth);
  this.mesh.tint=this.paperStyle?0xffe4bd:(r<<16)|(g<<8)|b;this.relief?.update(this.paperStyle);
 }
}
