import {BufferImageSource,Container,Sprite,Texture} from 'pixi.js';

let light:Texture|undefined;
/** A shared, precomputed falloff. No live blur filters or per-frame pixels. */
export function skillLightTexture(){
 if(light)return light;
 const size=64,pixels=new Uint8Array(size*size*4),edge=Math.exp(-5);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const distance=((x+.5-size/2)/(size/2))**2+((y+.5-size/2)/(size/2))**2;
  const alpha=Math.round(255*Math.max(0,(Math.exp(-distance*5)-edge)/(1-edge))),i=(y*size+x)*4;
  pixels[i]=pixels[i+1]=pixels[i+2]=pixels[i+3]=alpha;
 }
 light=new Texture({source:new BufferImageSource({resource:pixels,width:size,height:size,format:'rgba8unorm',alphaMode:'premultiplied-alpha',scaleMode:'linear'})});return light;
}

/** Local accents reuse one texture; each renderer owns a small, fixed maximum. */
export class SkillGlowPool{
 readonly root=new Container();private sprites:Sprite[]=[];private used=0;
 constructor(readonly limit=12){this.root.eventMode='none';}
 reset(){this.used=0;for(const sprite of this.sprites)sprite.visible=false;}
 add(x:number,y:number,size:number,color:number,alpha:number,squash=1,rotation=0){
  if(this.used>=this.limit||!Number.isFinite(x+y+size+alpha+squash+rotation)||size<=0||squash<=0||alpha<=0)return;
  let sprite=this.sprites[this.used++];
  if(!sprite){sprite=new Sprite(skillLightTexture());sprite.anchor.set(.5);sprite.blendMode='add';this.sprites.push(sprite);this.root.addChild(sprite);}
  sprite.visible=true;sprite.position.set(x,y);sprite.rotation=rotation;sprite.width=size;sprite.height=size*squash;sprite.tint=color;sprite.alpha=Math.min(1,alpha);return sprite;
 }
 destroy(){this.root.destroy({children:true});this.sprites.length=0;}
}
