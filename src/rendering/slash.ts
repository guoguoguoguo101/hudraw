import {createWaveLayers,type WaveLayers} from './shanhai-wave';
import {enemyScale} from './appearance';
import {drawUltimate} from './ultimate';
import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
import type {Skill} from '../core/types';
import {SLASH_STAGES} from '../gameplay/slash';
const WHITE=0xfffdf3,GOLD=0xe7ba68,RED=0xb73f37;
type Item={wave?:WaveLayers;waveMirror?:WaveLayers;ink?:Graphics;inkMask?:Graphics;ghosts?:Map<number,Container>;root:Container;mirror?:Container;layers:Graphics[];particles:{x:number;y:number;vx:number;vy:number;spin:number;paper:boolean}[]};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
/** All layers follow combat age. No SVG parsing or texture scaling in the effect. */
export class SlashRenderer{
 art:Record<string,Texture>={};root=new Container();shade=new Graphics();items=new Map<number,Item>();spare:Item[]=[];
 constructor(){const mask=new Graphics().rect(0,175,720,1005).fill(0xffffff);this.root.addChild(mask,this.shade);this.root.mask=mask;}
 make(s:Skill){
  const item:Item=this.spare.pop()??{root:new Container(),layers:Array.from({length:5},()=>new Graphics()),particles:[]};
  if(item.ghosts)for(const ghost of item.ghosts.values())ghost.destroy({children:true});item.ghosts=new Map();item.root.removeChildren();if(!item.wave)item.wave=createWaveLayers();item.wave.root.visible=s.slash!.level===4;item.root.addChild(item.wave.root,...item.layers);if(!item.ink){item.ink=new Graphics();item.inkMask=new Graphics();item.ink.mask=item.inkMask;}item.root.addChild(item.ink,item.inkMask!);item.root.visible=true;this.root.addChild(item.root);
  if(!item.mirror){item.mirror=new Container();for(const i of [1,2,3,0])item.mirror.addChild(new Graphics({context:item.layers[i].context}));this.root.addChild(item.mirror);}if(!item.waveMirror){item.waveMirror=createWaveLayers(item.wave);item.mirror.addChildAt(item.waveMirror.root,0);}item.waveMirror.root.visible=s.slash!.level===4;item.mirror.visible=false;
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
   if(level===4){drawUltimate(s,item.layers,item.ink,item.inkMask,item.wave);for(const hit of s.slash.contacts){if(!hit.dead||!hit.kind)continue;let ghost=item.ghosts!.get(hit.id);if(!ghost){const texture=this.art[(hit.kind==='boss'?'oni':hit.kind)+'_body'];if(!texture)continue;ghost=new Container();for(const sign of [-1,1]){const part=new Container(),sprite=new Sprite(texture);sprite.anchor.set(.5);const mask=new Graphics().rect(-texture.width/2,sign<0?-texture.height/2:0,texture.width,texture.height/2).fill(0xffffff);part.addChild(sprite,mask);part.mask=mask;ghost.addChild(part);}item.root.addChild(ghost);item.ghosts!.set(hit.id,ghost);}const age=t-hit.at,dx=hit.x-s.x,dy=hit.y-s.y;ghost.position.set(dx*s.direction.x+dy*s.direction.y+age*s.slash.ultimate!.knockbackForce*.4,-dx*s.direction.y+dy*s.direction.x-age*90);ghost.rotation=-item.root.rotation+age*3;ghost.scale.set(enemyScale(hit.kind));ghost.alpha=Math.max(0,1-age/.16);ghost.children.forEach((part,i)=>{part.x=age*35*(i?-1:1);part.y=age*95*(i?1:-1);part.rotation=age*(i?2:-2);});}item.root.setChildIndex(item.wave!.root,0);item.root.setChildIndex(trail,1);item.root.setChildIndex(rip,2);item.root.setChildIndex(core,3);item.root.setChildIndex(particles,4);item.root.setChildIndex(flash,item.root.children.length-1);continue;}
   const elapsed=Math.max(0,t-stage.primary_hit_at),fade=clamp((stage.visual_duration-t)/(level===4?.22:.12));
   if(level===4&&t<.2){this.shade.rect(0,175,720,1005).fill({color:0x242326,alpha:.16*Math.sin(clamp(t/.2)*Math.PI)});}
   if(t<stage.primary_hit_at){
    core.moveTo(18,0).lineTo(s.range*clamp(t/stage.primary_hit_at),0).stroke({color:GOLD,width:1,alpha:.45});
    if(level===4){const r=42*(1-clamp(t/.08));core.circle(0,0,r).stroke({color:GOLD,width:2,alpha:.8});core.rect(-14,-14,28,28).stroke({color:RED,width:2,alpha:.7});}
   }else{
    const length=s.range*(.3+.7*clamp(elapsed/.055)),width=[4,8,11,14.5][level-1]*(.5+.5*Math.sin(clamp(elapsed/.14)*Math.PI));
    core.moveTo(15,0).lineTo(length*.68,-width).lineTo(length,0).lineTo(length*.68,width).closePath().fill({color:GOLD,alpha:fade});
    core.moveTo(15,0).lineTo(length*.82,-width*.35).lineTo(length,0).lineTo(length*.82,width*.35).closePath().fill({color:0xf5d595,alpha:fade});
    core.moveTo(13,0).lineTo(length-6,0).stroke({color:WHITE,width:[2,2.7,3.4,4.1][level-1],alpha:fade});
    if(s.copies>1)core.moveTo(20,6).lineTo(length*.94,6).stroke({color:RED,width:2,alpha:fade*.6});
    if(level>=2){const spread=(level===4?55:level*12)*Math.sin(clamp(elapsed/.25)*Math.PI);
     for(const sign of [-1,1]){trail.moveTo(12,0).quadraticCurveTo(length*.42,sign*spread*1.8,length,0).quadraticCurveTo(length*.46,sign*spread*.8,12,0).fill({color:GOLD,alpha:.18*fade});trail.moveTo(18,sign*4).quadraticCurveTo(length*.45,sign*spread*1.8,length*.92,sign*3).stroke({color:0xf5d595,width:level===4?3:1.7,alpha:.75*fade});}
    }
    if(level>=3){for(const sign of [-1,1]){rip.moveTo(40,sign*5);for(let i=1;i<=12;i++){const x=40+(length-40)*i/12,y=sign*(8+(i%3===0?24:12))*(1+elapsed*2);rip.lineTo(x,y);}rip.lineTo(length,0).closePath().fill({color:RED,alpha:.65*fade});
     rip.moveTo(60,sign*6);for(let i=1;i<=10;i++)rip.lineTo(60+(length-75)*i/10,sign*(i%3===0?16:9));rip.lineTo(length-15,0).closePath().fill({color:0xf5d595,alpha:.7*fade});
    } // White core is a separate front layer.
    }
    if(level===4&&t>=stage.fan_start&&t<stage.fan_end){
     const u=clamp((t-stage.fan_start)/.18),r=90+260*u,a=-.85+u*.28,b=.85+u*.28,alpha=clamp((stage.fan_end-t)/.12);
     trail.moveTo(30,0).lineTo(Math.cos(a)*r,Math.sin(a)*r).arc(0,0,r,a,b).lineTo(30,0).closePath().fill({color:GOLD,alpha:.12*alpha});
     trail.moveTo(Math.cos(a)*r,Math.sin(a)*r).arc(0,0,r,a,b).lineTo(Math.cos(b)*(r-23),Math.sin(b)*(r-23)).arc(0,0,r-23,b,a,true).closePath().fill({color:0xf5d595,alpha:.55*alpha});
     for(const offset of [0,-16]){trail.moveTo(Math.cos(a)*(r+offset),Math.sin(a)*(r+offset)).arc(0,0,r+offset,a,b).stroke({color:offset?WHITE:GOLD,width:offset?3:9,alpha:.85*alpha});}
     rip.moveTo(Math.cos(a+.15)*(r-30),Math.sin(a+.15)*(r-30)).arc(0,0,r-30,a+.15,b-.08).stroke({color:RED,width:5,alpha:.7*alpha});
    }
    for(const [i,p] of item.particles.entries()){
     const born=stage.primary_hit_at+(p.paper?i*.006:0);if(t<born)continue;const age=t-born,alpha=clamp(1-age/(stage.visual_duration-born));
     const x=p.x+p.vx*age,y=p.y+p.vy*age+50*age*age;
     if(p.paper){const a=p.spin*age,c=Math.cos(a),n=Math.sin(a),verts=[[-6,-13],[6,-13],[5,11],[-4,14]].map(([dx,dy])=>({x:x+dx*c-dy*n,y:y+dx*n+dy*c}));particles.moveTo(verts[0].x,verts[0].y);for(const v of verts.slice(1))particles.lineTo(v.x,v.y);particles.closePath().fill({color:WHITE,alpha});particles.moveTo(x-2*c-7*n,y-2*n+7*c).lineTo(x+3*c,y+3*n).lineTo(x-2*c+7*n,y-2*n-7*c).stroke({color:RED,width:1.7,alpha});}
     else{const size=2+i%4;particles.moveTo(x,y).lineTo(x-size*3,y+size).lineTo(x-size,y-size).closePath().fill({color:i%3===0&&level>=3?RED:GOLD,alpha});}
    }
   }
   // Actual contacts survive enemy death and retain their world hit positions.
   for(const hit of s.slash.contacts){const age=t-hit.at;if(age<0||age>.16)continue;const dx=hit.x-s.x,dy=hit.y-s.y,c=s.direction.x,n=s.direction.y,x=dx*c+dy*n,y=-dx*n+dy*c,size=(hit.secondary?32:14+level*5)*(1+age*4),alpha=1-age/.16;
    flash.moveTo(x-size,y).lineTo(x-3,y-3).lineTo(x,y-size*.8).lineTo(x+3,y-3).lineTo(x+size,y).lineTo(x+3,y+3).lineTo(x,y+size*.8).lineTo(x-3,y+3).closePath().fill({color:WHITE,alpha});flash.circle(x,y,size*.4).stroke({color:GOLD,width:2,alpha:alpha*.7});
   }
   // Rip and tails behind the sharp blade, flashes in front.
   item.root.setChildIndex(core,3);item.root.setChildIndex(flash,4);
  }
 }
 clear(){for(const item of this.items.values()){item.root.visible=false;if(item.mirror)item.mirror.visible=false;if(this.spare.length<12)this.spare.push(item);else{item.root.destroy({children:true});item.mirror?.destroy({children:true});}}this.items.clear();this.shade.clear();}
}
