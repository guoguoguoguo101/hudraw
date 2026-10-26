import {Container,Graphics,Rectangle,Sprite,Texture} from 'pixi.js';
import type {HualingChapter} from '../gameplay/hualing-chapters';

type Actor={node:Container;x:number;v:number;animate:(time:number)=>void};
/** Monumental guardians live in the scenery, behind all level controls. */
export class MountainMapLife{
 readonly root=new Container();loader?:()=>Promise<Texture>;
 private atlas?:Texture;private requested=false;private failed=false;
 private chapter?:HualingChapter;private actors:Actor[]=[];private frames:Texture[]=[];
 private reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 private wakeAt=-100;
 get ready(){return !!this.atlas||this.failed;}
 constructor(){this.root.eventMode='none';}
 wake(){this.wakeAt=performance.now()/1000;}
 update(ch:HualingChapter,header:number,footer:number){
  if(!this.requested&&this.loader){this.requested=true;this.loader().then(t=>{this.atlas=t;this.chapter=undefined;}).catch(e=>{this.failed=true;console.warn('山海灵兽背景加载失败',e);});}
  if(ch!==this.chapter){this.chapter=ch;this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.actors=[];this.build(ch);}
  const top=header+148,h=footer+1030-top,t=this.reduced?0:performance.now()/1000;
  this.root.position.y=top;
  for(const a of this.actors){a.node.position.set(a.x,h*a.v);a.animate(t);}
  const scene=this.actors[0]?.node.children[0] as Sprite|undefined;
  if(scene instanceof Sprite){const breath=this.reduced?1:1+Math.sin(t*.42)*.008;scene.width=744*breath;scene.height=(h+32)*breath;}
 }
 private actor(x:number,v:number){const node=new Container();this.root.addChild(node);const a:Actor={node,x,v,animate:()=>{}};this.actors.push(a);return a;}
 private build(ch:HualingChapter){
  const index=['valley','sea','palace','snow'].indexOf(ch),paper=[0xf3e5c9,0xe0eeea,0x23324b,0xeaf0f1][index];
  const scene=this.actor(360,.5);
  if(this.atlas){
   if(!this.frames.length){const w=Math.floor(this.atlas.width/2),h=Math.floor(this.atlas.height/2);for(let i=0;i<4;i++)this.frames.push(new Texture({source:this.atlas.source,frame:new Rectangle(i%2*w+1,Math.floor(i/2)*h+1,w-2,h-2)}));}
   const sprite=new Sprite(this.frames[index]);sprite.anchor.set(.5);sprite.alpha=.92;scene.node.addChild(sprite);
  }
  scene.animate=t=>{scene.node.x+=Math.sin(t*.24)*5;scene.node.y+=Math.sin(t*.34)*4;scene.node.rotation=this.reduced?0:Math.sin(t*.2)*.0015;};
  // Slowly crossing fog layers reveal and conceal parts of the giant animal.
  for(let i=0;i<3;i++){
   const a=this.actor(360,.18+i*.31),g=new Graphics();a.node.addChild(g);
   g.moveTo(-520,0).bezierCurveTo(-310,-36,-240,33,-70,-6).bezierCurveTo(80,-35,220,30,520,-8).lineTo(520,51).bezierCurveTo(230,19,70,55,-130,27).quadraticCurveTo(-360,61,-520,31).closePath().fill({color:paper,alpha:.16});
   a.animate=t=>{a.node.x+=Math.sin(t*.16+i*2)*58;a.node.y+=Math.sin(t*.22+i)*11;g.alpha=this.reduced?1:.72+Math.sin(t*.3+i)*.2;};
  }
  for(let i=0;i<5;i++){
   const a=this.actor(i%2?679:42,.15+i*.15),g=new Graphics();a.node.addChild(g);
   g.ellipse(0,0,2+i%2,4+i%3).fill({color:ch==='palace'?0xd7c39a:ch==='valley'?0xa8583e:0x759fba,alpha:.45});
   a.animate=t=>{a.node.x+=Math.sin(t*.4+i)*8;a.node.y+=Math.sin(t*.3+i)*18;g.rotation=this.reduced?0:t*.08+i;};
  }
  const ripple=this.actor(360,.57),g=new Graphics();ripple.node.addChild(g);
  g.ellipse(0,0,145,31).stroke({color:paper,width:2,alpha:.7});
  ripple.animate=t=>{const p=(t-this.wakeAt)/1.7;g.visible=!this.reduced&&p>=0&&p<1;g.scale.set(1+p*2);g.alpha=Math.max(0,1-p);};
 }
}
