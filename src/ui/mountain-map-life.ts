import {Container,Graphics,Rectangle,Sprite,Texture} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import {MountainMapGuardian,type GuardianVectors} from './mountain-map-guardian';

export type MountainMapAssets={background:Texture;guardians:GuardianVectors};

type Actor={node:Container;x:number;v:number;animate:(time:number)=>void};
/** Monumental guardians live in the scenery, behind all level controls. */
export class MountainMapLife{
 readonly root=new Container();loader?:()=>Promise<MountainMapAssets>;
 private atlas?:Texture;private requested=false;private failed=false;
 private vectors?:GuardianVectors;private guardian?:MountainMapGuardian;private clip?:Graphics;private clipHeight=-1;
 private chapter?:HualingChapter;private actors:Actor[]=[];private frames:Texture[]=[];
 private reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 private wakeAt=-100;
 get ready(){return !!this.atlas&&!!this.vectors||this.failed;}
 get motionEnabled(){return !this.reduced;}
 setMotion(enabled:boolean){this.reduced=!enabled;}
 constructor(){this.root.eventMode='none';}
 wake(){this.wakeAt=performance.now()/1000;}
 update(ch:HualingChapter,header:number,footer:number){
  if(!this.requested&&this.loader){this.requested=true;this.loader().then(t=>{this.atlas=t.background;this.vectors=t.guardians;this.chapter=undefined;}).catch(e=>{this.failed=true;console.warn('山海灵兽背景加载失败',e);});}
  if(ch!==this.chapter){this.chapter=ch;this.guardian=undefined;this.root.mask=null;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.actors=[];this.build(ch);}
  const top=header+148,h=footer+1030-top,t=this.reduced?0:performance.now()/1000;
  this.sceneHeight=h;
  this.root.position.y=top;
  if(this.clip&&this.clipHeight!==h){this.clipHeight=h;this.clip.clear().rect(0,0,720,h).fill(0xffffff);}
  for(const a of this.actors){a.node.position.set(a.x,h*a.v);a.animate(t);}
  const scene=this.actors[0]?.node.children[0] as Sprite|undefined;
  if(scene instanceof Sprite){scene.width=744;scene.height=h+32;}
  if(this.guardian){
   this.guardian.root.position.set(-12,-16);this.guardian.root.scale.set(744/this.guardian.data.width,(h+32)/this.guardian.data.height);
   const age=t-this.wakeAt,response=age>=0&&age<1.8?Math.sin(age/1.8*Math.PI)**2:0;
   this.guardian.update(t,response,this.reduced);
  }
 }
 private actor(x:number,v:number){const node=new Container();this.root.addChild(node);const a:Actor={node,x,v,animate:()=>{}};this.actors.push(a);return a;}
 private build(ch:HualingChapter){
  const index=['valley','sea','palace','snow'].indexOf(ch),paper=[0xf3e5c9,0xe0eeea,0x23324b,0xeaf0f1][index];
  const scene=this.actor(360,.5);
  if(this.atlas){
   if(!this.frames.length){const w=Math.floor(this.atlas.width/2),h=Math.floor(this.atlas.height/2);for(let i=0;i<4;i++)this.frames.push(new Texture({source:this.atlas.source,frame:new Rectangle(i%2*w+1,Math.floor(i/2)*h+1,w-2,h-2)}));}
   const sprite=new Sprite(this.frames[index]);sprite.anchor.set(.5);sprite.alpha=.92;scene.node.addChild(sprite);
  }
  if(this.vectors){this.guardian=new MountainMapGuardian(ch,this.vectors[ch]);this.root.addChild(this.guardian.root);}
  this.clip=new Graphics();this.clipHeight=-1;this.root.addChild(this.clip);this.root.mask=this.clip;
  // Keep the landscape anchored while the vector creature moves on its own joints.
  // Slowly crossing fog layers reveal and conceal parts of the giant animal.
  for(let i=0;i<3;i++){
   const a=this.actor(360,.18+i*.31),g=new Graphics();a.node.addChild(g);
   g.moveTo(-520,0).bezierCurveTo(-310,-36,-240,33,-70,-6).bezierCurveTo(80,-35,220,30,520,-8).lineTo(520,51).bezierCurveTo(230,19,70,55,-130,27).quadraticCurveTo(-360,61,-520,31).closePath().fill({color:paper,alpha:.16});
   a.animate=t=>{a.node.x+=Math.sin(t*.16+i*2)*58;a.node.y+=Math.sin(t*.22+i)*11;g.alpha=this.reduced?1:.72+Math.sin(t*.3+i)*.2;};
  }
  this.weather(ch);
  const ripple=this.actor(360,.57),g=new Graphics();ripple.node.addChild(g);
  g.ellipse(0,0,145,31).stroke({color:paper,width:2,alpha:.7});
  ripple.animate=t=>{const p=(t-this.wakeAt)/1.7;g.visible=!this.reduced&&p>=0&&p<1;g.scale.set(1+p*2);g.alpha=Math.max(0,1-p);};
 }
 private weather(ch:HualingChapter){
  // Side corridors stay clear of the fixed two-column level labels.
  const count=ch==='snow'?30:ch==='palace'?18:ch==='valley'?14:12;
  for(let i=0;i<count;i++){
   const side=i%2?1:-1,seed=i*2.39996,a=this.actor(side<0?34+(i%4)*18:632+(i%4)*18,(i*.137)%1),g=new Graphics();
   a.node.addChild(g);
   if(ch==='valley'){
    g.moveTo(-7,0).quadraticCurveTo(-1,-8,8,-2).quadraticCurveTo(4,7,-7,0).fill({color:i%3?0xb5663c:0xdba657,alpha:.8});
    g.moveTo(-5,0).lineTo(5,-1).stroke({color:0xf8d7a0,width:.8,alpha:.6});
   }else if(ch==='sea'){
    g.moveTo(-30,0).quadraticCurveTo(0,-9,30,0).stroke({color:0xe7f6ed,width:1.5,alpha:.65});
    g.moveTo(-18,6).quadraticCurveTo(0,2,18,6).stroke({color:0xc9e7db,width:1,alpha:.35});
   }else if(ch==='palace'){
    g.circle(0,0,5).fill({color:0xf2d89e,alpha:.08}).circle(0,0,1.8).fill({color:0xffe5a9,alpha:.85});
    if(i%3===0)g.moveTo(-5,0).lineTo(5,0).moveTo(0,-5).lineTo(0,5).stroke({color:0xf6e2b9,width:.8,alpha:.5});
   }else{
    g.circle(0,0,i%4===0?2.8:1.5).fill({color:0xffffff,alpha:.8});
    if(i%6===0)for(let k=0;k<3;k++){const r=k*Math.PI/3;g.moveTo(-Math.cos(r)*5,-Math.sin(r)*5).lineTo(Math.cos(r)*5,Math.sin(r)*5).stroke({color:0xffffff,width:1,alpha:.7});}
   }
   a.animate=t=>{
    const h=Math.max(1,this.sceneHeight),speed=ch==='snow'?24:ch==='valley'?19:ch==='sea'?11:-13;
    const travel=((a.v*h+t*speed)%h+h)%h;
    a.node.y=travel;
    a.node.x=a.x+Math.sin(t*(ch==='valley'?.8:.35)+seed)*(ch==='sea'?22:ch==='valley'?18:11);
    g.rotation=ch==='valley'?Math.sin(t*.9+seed)*.8+seed:ch==='snow'?t*.12+seed:0;
    const edge=Math.min(1,travel/55,(h-travel)/55);
    g.alpha=edge*(ch==='palace'?.5+.5*Math.sin(t*1.3+seed)**2:.85);
    if(ch==='sea')g.scale.x=.8+Math.sin(t*.6+seed)*.2;
   };
  }
  if(ch==='sea')for(let i=0;i<4;i++){
   const a=this.actor(360,.86+i*.035),g=new Graphics();a.node.addChild(g);
   g.moveTo(-390,0).bezierCurveTo(-230,-19,-90,18,40,-1).bezierCurveTo(170,-20,260,17,390,0).stroke({color:0xe1eee2,width:2,alpha:.35});
   a.animate=t=>{a.node.x+=Math.sin(t*.5+i)*28;a.node.y+=Math.sin(t*.7+i)*6;g.alpha=.4+Math.sin(t*.7+i)*.25;};
  }
 }
 private sceneHeight=900;
}
