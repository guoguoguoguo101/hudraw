import {Container,MeshPlane,type Texture} from 'pixi.js';
import type {Enemy} from '../core/types';
import type {EliteKind} from '../gameplay/hualing-elites';
import {ELITE_BONES,eliteInfluence,eliteJoint,elitePose,type ElitePose} from './elite-motion';
/** The source texture stays cached; its anatomical regions are skinned around separate joints. */
export class ElitePaperPuppet{
 root=new Container();mesh:MeshPlane;private rest:Float32Array;private weights:Float32Array;private totals:Float32Array;private pose?:ElitePose;
 constructor(readonly kind:EliteKind,readonly texture:Texture){
  this.mesh=new MeshPlane({texture,verticesX:25,verticesY:25});this.mesh.autoResize=false;this.root.addChild(this.mesh);this.rest=new Float32Array(this.mesh.geometry.positions);
  const bones=ELITE_BONES[kind];this.weights=new Float32Array(this.rest.length/2*bones.length);this.totals=new Float32Array(this.rest.length/2);
  for(let i=0;i<this.rest.length;i+=2){let total=0;for(let j=0;j<bones.length;j++){const a=eliteInfluence(bones[j],this.rest[i]/texture.width,this.rest[i+1]/texture.height);this.weights[i/2*bones.length+j]=a;total+=a;}this.totals[i/2]=Math.max(1,total);}
  const scale=Math.min(235/texture.width,212/texture.height);this.mesh.scale.set(scale);this.mesh.position.set(-texture.width*scale/2,-texture.height*scale/2-9);
 }
 update(e:Enemy){const p=elitePose(e.elite!,e.hit);this.pose=p;this.skin(p);const airborne=['moth','jelly','rays','lantern','weaver'].includes(this.kind),breath=Math.sin(p.time*1.8);
  this.root.position.set(-p.recoil*5*p.side+p.cast*3*p.side,(airborne?Math.sin(p.time*2)*4:breath*1.5)+p.charge*5-p.cast*9+p.impact*9+p.weak*7-(1-p.arrival)*18);
  this.root.rotation=p.recoil*.035*p.side+p.weak*Math.sin(p.time*5)*.025;this.root.scale.set(1+(p.impact-p.charge)*.025,1+(p.charge-p.impact)*.025);this.root.alpha=.65+.35*p.arrival;
  this.mesh.tint=e.hit>.17?0xffe9bf:0xffffff;
 }
 defeat(age:number){if(!this.pose)return;const u=Math.max(0,Math.min(1,age/.75));this.skin({...this.pose,time:this.pose.time+age,charge:0,cast:0,impact:0,recoil:0,weak:0,death:u});this.root.y=12*u*u;this.root.rotation=.13*u;this.root.scale.set(1-u*.07,1-u*.16);this.root.alpha=1-u;}
 private skin(p:ElitePose){const bs=ELITE_BONES[this.kind],w=this.texture.width,h=this.texture.height,positions=this.mesh.geometry.positions,poses=bs.map(b=>{const q=eliteJoint(this.kind,b,p);return {...q,c:Math.cos(q.angle),s:Math.sin(q.angle)};});
  for(let i=0;i<positions.length;i+=2){const u=this.rest[i]/w,v=this.rest[i+1]/h;let dx=0,dy=0;for(let j=0;j<bs.length;j++){const a=this.weights[i/2*bs.length+j];if(a<.0001)continue;const b=bs[j],q=poses[j],x=(u-b.pivot[0])*q.sx,y=(v-b.pivot[1])*q.sy;dx+=(b.pivot[0]+x*q.c-y*q.s+q.x-u)*a;dy+=(b.pivot[1]+x*q.s+y*q.c+q.y-v)*a;}positions[i]=(u+dx/this.totals[i/2])*w;positions[i+1]=(v+dy/this.totals[i/2])*h;}
  this.mesh.geometry.getAttribute('aPosition').buffer.update();
 }
 destroy(){const geometry=this.mesh.geometry;this.root.destroy({children:true});geometry.destroy();}
}
