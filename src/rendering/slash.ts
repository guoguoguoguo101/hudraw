import {SlashEvolution} from './slash-evolution';
import {createWaveLayers,type WaveLayers} from './shanhai-wave';
import {enemyScale} from './appearance';
import {drawUltimate} from './ultimate';
import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
import type {Skill} from '../core/types';
import {SLASH_STAGES} from '../gameplay/slash';
const WHITE=0xfffdf3,GOLD=0xe7ba68,RED=0xb73f37;
type Item={evolution?:SlashEvolution;evolutionMirror?:SlashEvolution;wave?:WaveLayers;waveMirror?:WaveLayers;ink?:Graphics;inkMask?:Graphics;ghosts?:Map<number,Container>;root:Container;mirror?:Container;layers:Graphics[];particles:{x:number;y:number;vx:number;vy:number;spin:number;paper:boolean}[]};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** All layers follow combat age. No SVG parsing or texture scaling in the effect. */
export class SlashRenderer{
 art:Record<string,Texture>={};root=new Container();shade=new Graphics();items=new Map<number,Item>();spare:Item[]=[];
 constructor(){const mask=new Graphics().rect(0,175,720,1005).fill(0xffffff);this.root.addChild(mask,this.shade);this.root.mask=mask;}
 make(s:Skill){
  const item:Item=this.spare.pop()??{root:new Container(),layers:Array.from({length:5},()=>new Graphics()),particles:[]};
  if(item.ghosts)for(const ghost of item.ghosts.values())ghost.destroy({children:true});item.ghosts=new Map();item.root.removeChildren();if(!item.wave)item.wave=createWaveLayers();item.wave.root.visible=s.slash!.level===4;item.root.addChild(item.wave.root,...item.layers);if(!item.ink){item.ink=new Graphics();item.inkMask=new Graphics();item.ink.mask=item.inkMask;}item.root.addChild(item.ink,item.inkMask!);item.root.visible=true;this.root.addChild(item.root);if(!item.evolution)item.evolution=new SlashEvolution();item.root.addChild(item.evolution.root);
  if(!item.mirror){item.mirror=new Container();for(const i of [1,2,3,0])item.mirror.addChild(new Graphics({context:item.layers[i].context}));this.root.addChild(item.mirror);}if(!item.waveMirror){item.waveMirror=createWaveLayers(item.wave);item.mirror.addChildAt(item.waveMirror.root,0);}item.waveMirror.root.visible=s.slash!.level===4;item.mirror.visible=false;if(!item.evolutionMirror)item.evolutionMirror=new SlashEvolution();item.mirror.addChild(item.evolutionMirror.root);
  const level=s.slash!.level,budget=Math.floor(SLASH_STAGES[level-1].particle_budget/(s.mirror?2:1));
  item.particles=Array.from({length:budget},(_,i)=>{const seed=Math.sin(s.id*13+i*37)*43758.54,f=seed-Math.floor(seed);return {x:40+f*s.range*.85,y:(i%2?1:-1)*(10+f*28),vx:30+f*180,vy:(i%2?1:-1)*(35+f*100),spin:(f-.5)*10,paper:level>=3&&i< (level===3?7:8)};});
  this.items.set(s.id,item);return item;
 }
 update(skills:Skill[]){
  const live=new Set(skills.filter(s=>s.rune==='line').map(s=>s.id));for(const [id,item] of this.items)if(!live.has(id)){item.root.visible=false;if(item.mirror)item.mirror.visible=false;this.items.delete(id);if(this.spare.length<12)this.spare.push(item);else{item.root.destroy({children:true});item.mirror?.destroy({children:true});}}
  this.shade.clear();
  for(const s of skills){if(s.rune!=='line'||!s.slash)continue;
   const item=this.items.get(s.id)??this.make(s),level=s.slash.level,stage=SLASH_STAGES[level-1],t=s.age;
   item.root.position.set(s.x,s.y);item.root.rotation=Math.atan2(s.direction.y,s.direction.x);
   if(item.mirror){item.mirror.visible=s.mirror&&Math.abs(s.direction.x)>.025;item.mirror.position.set(s.x,s.y);item.mirror.rotation=Math.atan2(s.direction.y,-s.direction.x);}
   const [core,trail,rip,particles,flash]=item.layers;for(const g of item.layers)g.clear();
   item.evolution!.root.visible=level!==4;item.evolutionMirror!.root.visible=level!==4;if(level!==4){item.ink?.clear();item.inkMask?.clear();item.evolution!.update(s);if(item.mirror?.visible)item.evolutionMirror!.update({...s,direction:{x:-s.direction.x,y:s.direction.y}});continue;}
   if(level===4){drawUltimate(s,item.layers,item.ink,item.inkMask,item.wave);for(const hit of s.slash.contacts){if(!hit.dead||!hit.kind)continue;let ghost=item.ghosts!.get(hit.id);if(!ghost){const texture=this.art[(hit.kind==='boss'?'oni':hit.kind)+'_body'];if(!texture)continue;ghost=new Container();for(const sign of [-1,1]){const part=new Container(),sprite=new Sprite(texture);sprite.anchor.set(.5);const mask=new Graphics().rect(-texture.width/2,sign<0?-texture.height/2:0,texture.width,texture.height/2).fill(0xffffff);part.addChild(sprite,mask);part.mask=mask;ghost.addChild(part);}item.root.addChild(ghost);item.ghosts!.set(hit.id,ghost);}const age=t-hit.at,dx=hit.x-s.x,dy=hit.y-s.y;ghost.position.set(dx*s.direction.x+dy*s.direction.y+age*s.slash.ultimate!.knockbackForce*.4,-dx*s.direction.y+dy*s.direction.x-age*90);ghost.rotation=-item.root.rotation+age*3;ghost.scale.set(enemyScale(hit.kind));ghost.alpha=Math.max(0,1-age/.16);ghost.children.forEach((part,i)=>{part.x=age*35*(i?-1:1);part.y=age*95*(i?1:-1);part.rotation=age*(i?2:-2);});}item.root.setChildIndex(item.wave!.root,0);item.root.setChildIndex(trail,1);item.root.setChildIndex(rip,2);item.root.setChildIndex(core,3);item.root.setChildIndex(particles,4);item.root.setChildIndex(flash,item.root.children.length-1);continue;}

  }
 }
 clear(){for(const item of this.items.values()){item.root.visible=false;if(item.mirror)item.mirror.visible=false;if(this.spare.length<12)this.spare.push(item);else{item.root.destroy({children:true});item.mirror?.destroy({children:true});}}this.items.clear();this.shade.clear();}
}
