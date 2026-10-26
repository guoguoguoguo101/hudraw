import {Container,MeshPlane,Rectangle,type Renderer,type Texture} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import type {ChapterBossState} from '../gameplay/hualing-bosses';
import {paperArt,type PaperVector} from './chapter-art/vector-art';
import {bossPose,BOSS_BONES,boneInfluence,bonePose,type BossPose} from './boss-motion';

/** Source is still the native vector art. One local render texture is skinned by moving joints. */
export class BossPaperPuppet{
 root=new Container();readonly mesh:MeshPlane;private texture:Texture;private rest:Float32Array;private weights:Float32Array;private totals:Float32Array;private pose:BossPose={time:0,charge:0,strike:0,recoil:0,weak:0,arrive:1,recover:0,rage:0,death:0};
 constructor(readonly chapter:HualingChapter,readonly data:PaperVector,renderer:Renderer){
  const art=paperArt('chapter-boss-v03-'+chapter,data);
  this.texture=renderer.generateTexture({target:art,frame:new Rectangle(0,0,data.width,data.height),resolution:2,antialias:true});art.destroy();
  this.mesh=new MeshPlane({texture:this.texture,verticesX:37,verticesY:37});this.mesh.autoResize=false;
  this.rest=new Float32Array(this.mesh.geometry.positions);const bones=BOSS_BONES[chapter];this.weights=new Float32Array(this.rest.length/2*bones.length);this.totals=new Float32Array(this.rest.length/2);
  for(let i=0;i<this.rest.length;i+=2){let total=0;for(let j=0;j<bones.length;j++){const weight=boneInfluence(bones[j],this.rest[i]/data.width,this.rest[i+1]/data.height);this.weights[i/2*bones.length+j]=weight;total+=weight;}this.totals[i/2]=Math.max(1,total);}this.root.addChild(this.mesh);
  const scale=Math.min((chapter==='sea'?380:350)/data.width,(chapter==='palace'?315:295)/data.height);this.root.scale.set(scale);this.mesh.position.set(-data.width/2,-data.height/2);
 }
 update(state:ChapterBossState,hit:number){this.pose=bossPose(state,hit);this.skin(this.pose);}
 defeat(age:number,retreat=false){const u=Math.max(0,Math.min(1,age/1.2));this.skin({...this.pose,charge:0,strike:0,recoil:0,weak:1,death:u,time:this.pose.time+age});this.root.alpha=1-u*u;this.root.y=retreat?-u*85:u*u*45;this.root.rotation=(retreat?-.1:.17)*u;}
 private skin(p:BossPose){
  this.root.alpha=1;this.root.y=0;this.root.rotation=0;const vertices=this.mesh.geometry.positions,w=this.data.width,h=this.data.height;
  const bones=BOSS_BONES[this.chapter],poses=bones.map(b=>{const q=bonePose(this.chapter,b.name,p);return {...q,c:Math.cos(q.angle),s:Math.sin(q.angle)};});
  for(let i=0;i<vertices.length;i+=2){const u=this.rest[i]/w,v=this.rest[i+1]/h;let dx=0,dy=0;
   for(let j=0;j<bones.length;j++){const weight=this.weights[i/2*bones.length+j];if(weight<.0001)continue;const b=bones[j],q=poses[j],px=(u-b.pivot[0])*q.sx,py=(v-b.pivot[1])*q.sy;dx+=(b.pivot[0]+px*q.c-py*q.s+q.x-u)*weight;dy+=(b.pivot[1]+px*q.s+py*q.c+q.y-v)*weight;}
   vertices[i]=(u+dx/this.totals[i/2])*w;vertices[i+1]=(v+dy/this.totals[i/2])*h;
  }
  this.mesh.geometry.getAttribute('aPosition').buffer.update();
 }
 destroy(){const geometry=this.mesh.geometry;this.root.destroy({children:true});geometry.destroy();this.texture.destroy(true);}
}
