import {BufferImageSource,Container,Mesh,MeshGeometry,Texture} from 'pixi.js';
import art from './dragon-art/ink-blob-dragon.json';
import type {Point} from '../input/recognizer';
import {PAPER_DRAGON_MOTION} from '../gameplay/dual-brush';

/** The approved ink-blob artwork is traced to native triangles offline. No PNG is loaded.
 * The tiny palette is solid GPU color data, not a character image texture. */
function palette(gold:boolean){
 const pixels=new Uint8Array(art.colors.length*4);
 for(const [i,color] of art.colors.entries()){
  let r=color>>16&255,g=color>>8&255,b=color&255;
  if(gold&&r>100&&r>g*1.28&&r>b*1.4){const light=Math.min(1,Math.max(0,(r-90)/150));r=142+light*83;g=102+light*78;b=47+light*62;}
  else if(gold&&r>g*1.05&&g>b*1.2&&r>130){r=Math.min(255,r+13);g=Math.min(255,g+23);b=Math.min(255,b+28);}
  pixels.set([Math.round(r),Math.round(g),Math.round(b),255],i*4);
 }
 return new Texture({source:new BufferImageSource({resource:pixels,width:art.colors.length,height:1,format:'rgba8unorm',scaleMode:'nearest'})});
}
const palettes:Texture[]=[];
export class PaperDragonActor{
 root=new Container();readonly geometry:MeshGeometry;private mesh:Mesh;private shadow:Mesh;private frames:Float32Array;private facing=1;
 constructor(index:number){
  const count=art.vertices.length/3,uvs=new Float32Array(count*2);
  for(let i=0;i<count;i++){uvs[i*2]=(art.vertices[i*3+2]+.5)/art.colors.length;uvs[i*2+1]=.5;}
  this.geometry=new MeshGeometry({positions:new Float32Array(count*2),uvs,indices:new Uint32Array(art.indices)});this.geometry.batchMode='no-batch';
  const texture=palettes[index]??(palettes[index]=palette(index===0));
  this.shadow=new Mesh({geometry:this.geometry,texture});this.shadow.tint=0x23322c;this.shadow.position.set(-.3,1.2);this.shadow.alpha=.26;
  this.mesh=new Mesh({geometry:this.geometry,texture});this.root.addChild(this.shadow,this.mesh);this.root.eventMode='none';this.frames=new Float32Array(49*4);
 }
 update(path:Point[],alpha:number,clock:number,index:number){
  this.root.visible=path.length>=2&&alpha>.002;if(!this.root.visible)return;this.root.alpha=alpha;
  // Catmull-Rom material frame. Head/skull vertices share one tangent so the
  // eyes, jaw, horns and paper-cut mane never tear when the body banks sharply.
  const last=path.length-1;
  const point=(u:number)=>{
   const value=Math.max(0,Math.min(1,u))*last,i=Math.min(last-1,Math.floor(value)),t=value-i,a=path[Math.max(0,i-1)],b=path[i],c=path[i+1],d=path[Math.min(last,i+2)],t2=t*t,t3=t2*t;
   return{x:.5*((2*b.x)+(-a.x+c.x)*t+(2*a.x-5*b.x+4*c.x-d.x)*t2+(-a.x+3*b.x-3*c.x+d.x)*t3),y:.5*((2*b.y)+(-a.y+c.y)*t+(2*a.y-5*b.y+4*c.y-d.y)*t2+(-a.y+3*b.y-3*c.y+d.y)*t3)};
  };
  const headA=point(.94),headB=point(1),headN=Math.hypot(headB.x-headA.x,headB.y-headA.y)||1,hx=(headB.x-headA.x)/headN,hy=(headB.y-headA.y)/headN;
  if(Math.abs(hx)>.2)this.facing=hx<0?-1:1;
  for(let i=0;i<49;i++){const u=i/48,p=point(u),a=point(u-.012),b=point(u+.012),n=Math.hypot(b.x-a.x,b.y-a.y)||1;this.frames.set([p.x,p.y,(b.x-a.x)/n,(b.y-a.y)/n],i*4);}
  const head=point(1),positions=this.geometry.positions,length=PAPER_DRAGON_MOTION.length,scale=length/art.width;
  for(let i=0;i<art.vertices.length/3;i++){
   const x=art.vertices[i*3],y=art.vertices[i*3+1],u=x/art.width,offset=(y-art.height*.51)*scale*this.facing;
   let px:number,py:number,dx:number,dy:number;
   if(u>.70){px=head.x+hx*(u-1)*length;py=head.y+hy*(u-1)*length;dx=hx;dy=hy;}
   else{const f=u*48,j=Math.min(47,Math.floor(f)),t=f-j,k=j*4;px=this.frames[k]*(1-t)+this.frames[k+4]*t;py=this.frames[k+1]*(1-t)+this.frames[k+5]*t;dx=this.frames[k+2]*(1-t)+this.frames[k+6]*t;dy=this.frames[k+3]*(1-t)+this.frames[k+7]*t;const n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;}
   // Paddle all four paws, including those under the rigid head. Facial pixels
   // sit above this narrow underside mask and keep their original proportions.
   const paw=u>.30?Math.max(0,Math.min(1,(y/art.height-.76)/.08)):0,phase=clock*PAPER_DRAGON_MOTION.frequency+u*5+index*2.4;
   const toe=Math.sin(phase)*10*paw,reach=Math.cos(phase)*7*paw;
   positions[i*2]=px+dx*reach-dy*(offset+toe);positions[i*2+1]=py+dy*reach+dx*(offset+toe);
  }
  this.geometry.getAttribute('aPosition').buffer.update();
 }
}
