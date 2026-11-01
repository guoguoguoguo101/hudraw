import {RetainedRunePickups,RetainedSkyThunder} from './retained-rune-fx';
import {Container,Graphics,type Renderer} from 'pixi.js';
import {StaticArtAtlas} from './static-art-atlas';
import type {Game} from '../gameplay/game';
import type {Skill} from '../core/types';
import {COLLECTED,type RuneCast} from '../gameplay/collected-talismans';
import {CircleRenderer} from './circle';
import {FoxThunderUltimate} from './fox-thunder-ultimate';
import {visualSkill} from './visual-skill';
import {INK_PULSE} from '../gameplay/ink-pulse';
const GOLD=0xe6bb70,WHITE=0xfff3d6,RED=0xc14733;
export class CollectedTalismanRenderer{
 root=new Container();private mask=new Graphics();private circles=new CircleRenderer();private strikes=new Graphics();private supplies=new RetainedRunePickups();private clouds=new Map<number,FoxThunderUltimate>();
 private castStrikes=new Container();private castFX=new Map<number,{cast:RuneCast;effect:Graphics|RetainedSkyThunder}>();
 private boundsKey='';private wasVisible=false;
 setRenderer(renderer:Renderer){this.circles.optimized=true;this.circles.atlas=new StaticArtAtlas(renderer);}
 constructor(){this.root.eventMode='none';this.root.addChild(this.circles.back,this.circles.front,this.supplies.root,this.castStrikes,this.strikes,this.mask);this.root.mask=this.mask;}
 update(g:Game,low=false){
  this.root.visible=g.hualingPractice&&g.state!=='menu';const model=g.collected,b=g.hualing.bounds;
  if(!this.root.visible){if(this.wasVisible){this.circles.clear();this.circles.atlas?.clear();this.strikes.clear();this.supplies.clear();for(const {effect}of this.castFX.values())effect.destroy();this.castFX.clear();for(const node of this.clouds.values())node.destroy({children:true});this.clouds.clear();}this.wasVisible=false;return;}
  this.wasVisible=true;
  const boundsKey=[b.left,b.top,b.right,b.bottom].join(':');if(this.boundsKey!==boundsKey){this.boundsKey=boundsKey;this.mask.clear().rect(b.left,b.top,b.right-b.left,b.bottom-b.top).fill(0xffffff);}
  const wards:Skill[]=model.casts.filter(c=>c.kind==='ward').map(c=>{const s=visualSkill('circle',c.id,c);s.age=c.age;s.duration=6;s.radius=COLLECTED.wardRadius;s.testLevel=4;s.circle={level:4,mode:'ward',baseDamage:0,baseDuration:6,captured:new Set(),broken:false};return s;});
  this.circles.update(wards);const art=this.strikes;art.clear();this.supplies.update(model.pickups,model.clock);
  const activeCasts=new Set(model.casts.map(c=>c.id));for(const [id,fx]of this.castFX)if(!activeCasts.has(id)){fx.effect.destroy();this.castFX.delete(id);}
  const alive=new Set(model.casts.filter(c=>c.kind==='storm').map(c=>c.id));for(const [id,node]of this.clouds)if(!alive.has(id)){node.destroy({children:true});this.clouds.delete(id);}
  for(const [ci,c]of model.casts.entries()){
   let fx=this.castFX.get(c.id);if(fx&&fx.cast!==c){fx.effect.destroy();this.castFX.delete(c.id);fx=undefined;}
   if(!fx){const effect=c.kind==='ward'?new Graphics():new RetainedSkyThunder();fx={cast:c,effect};this.castFX.set(c.id,fx);this.castStrikes.addChild(effect instanceof Graphics?effect:effect.root);}
   const node=fx.effect instanceof Graphics?fx.effect:fx.effect.root;if(this.castStrikes.getChildIndex(node)!==ci)this.castStrikes.setChildIndex(node,ci);
   if(c.kind==='ward'){
    const ward=fx.effect as Graphics;ward.clear();const flash=Math.max(0,1-Math.abs(c.age-5.6)/.28);if(flash)ward.circle(c.x,c.y,COLLECTED.wardRadius*(.92+flash*.12)).stroke({color:WHITE,width:9*flash,alpha:flash*.8});continue;
   }
   let fox=this.clouds.get(c.id);if(!fox){fox=new FoxThunderUltimate('clouds');this.clouds.set(c.id,fox);this.root.addChildAt(fox,2);}
   const s=visualSkill('z',c.id,c);s.age=c.age*1.5;s.thunder={level:4,targets:[],selected:true,path:[],length:0,travel:0,lineHits:new Set(),nodeHits:new Set(),finalHits:new Set(),finalDone:false,notified:false,chains:[]};fox.update(s);
   // Keep the approved fox/clouds/scrolls, replace its spear and radial web with falling sky thunder.
   fox.thunderLanceLayer.visible=false;fox.impactLayer.visible=false;fox.runeCircleLayer.visible=false;fox.windLayer.visible=false;fox.scale.set((b.right-b.left)/670,(b.bottom-b.top)/830);fox.position.set(b.left-25*fox.scale.x,b.top-200*fox.scale.y);fox.alpha*=.85;
   (fx.effect as RetainedSkyThunder).update(c,b,low);
  }
  const pulse=g.pulse.effect;if(pulse){const t=pulse.age,u=Math.max(0,Math.min(1,t/.2)),fade=Math.max(0,1-(t-.12)/.58),r=INK_PULSE.radius*(.18+.82*(1-(1-u)**3)),x=pulse.x,y=pulse.y;
   art.circle(x,y,r*.94).fill({color:0x112f32,alpha:fade*.34}).circle(x,y,r).stroke({color:0x192d2b,width:16*fade,alpha:fade*.55}).circle(x,y,r*.98).stroke({color:GOLD,width:5*fade+1,alpha:fade}).circle(x,y,r*.91).stroke({color:WHITE,width:2,alpha:fade*.8});
   for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.5;art.arc(x,y,r*(.98+i%2*.04),a,a+.48).stroke({color:RED,width:8*fade,alpha:fade*.85});}
   for(let i=0;i<(low?10:20);i++){const a=i*2.399,d=r*(.5+(i%5)*.13),xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d,w=(3+i%3)*fade;art.poly([xx,yy-w*2,xx+w,yy,xx,yy+w*2,xx-w,yy]).fill({color:i%3?GOLD:RED,alpha:fade});}
   const flash=Math.max(0,1-Math.abs(t-INK_PULSE.impact)/.12),s=24+flash*25;art.poly([x,y-s,x+7,y-7,x+s,y,x+7,y+7,x,y+s,x-7,y+7,x-s,y,x-7,y-7]).fill({color:WHITE,alpha:flash*.9});
  }
 }
}
