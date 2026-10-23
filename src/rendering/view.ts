import {HualingRenderer} from './hualing';
import {TalismanBarrageRenderer} from './talisman-barrage';
import {FunctionalRelicRenderer} from './functional-relics';
import {BurningSeaRenderer} from './burning-sea';
import {FallbackSlashRenderer} from './fallback-slash';
import {LineInteractionRenderer} from './line-interactions';
import {SancaiRenderer} from './sancai';
import {capTriangle} from '../input/triangle-geometry';
import {AdvancedSpellRenderer} from './advanced-spells';
import {MoonTailRenderer} from './moon-tail';
import {SpiritPenRenderer} from './spirit-pen';
import {BrushRenderer} from './relics/cinnabar-brush';
import {ThunderRenderer} from './thunder';
import {ArrowRenderer} from './arrows';
import {guardianConfig,guardianCamera,guardianTimeline} from '../gameplay/fox-guardian';
import {FOX_SCALE,FOX_MENU_SCALE,enemyScale} from './appearance';
import {CircleRenderer} from './circle';
import {SEAL_NAMES} from '../gameplay/circle';
import {SlashRenderer} from './slash';
import {ProceduralTalismanRenderer} from './talisman';
import {COMBAT,BOSS,ENEMIES} from '../gameplay/config';
import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
import {sprite,FoxRig,EnemyRig,type Art} from './rigs';
import {Environment} from './environment';
import {ScrollLandscapeRenderer} from './scroll-landscape';
import {ParticlePool} from './particles';
import {Interface,type Action} from '../ui/interface';
import {Animator,Timeline,easing} from '../animation/timeline';
import {WORLD,type Event,type State,type Skill} from '../core/types';
import type {Game} from '../gameplay/game';
import type {InputController} from '../input/controller';
import type {Point} from '../input/recognizer';
import type {GameViewport} from '../platform/viewport';
type Effect={root:Container;ring:Sprite;center:Sprite;slash:Sprite;z:Sprite;id:number};
const GOLD=0xe7ba68;
export class GameView{
 scrollLandscape=new ScrollLandscapeRenderer();
 hualing=new HualingRenderer();functionalRelics=new FunctionalRelicRenderer();private viewportTop=0;private viewportBottom=1280;
 experimentalOptimizations=true;
 talismanBarrage=new TalismanBarrageRenderer();burningSea=new BurningSeaRenderer();freeSlashes=new FallbackSlashRenderer();interactions=new LineInteractionRenderer();interactionSlashes=new SlashRenderer();private border=new Graphics();
 sancai=new SancaiRenderer();advancedSpells=new AdvancedSpellRenderer();moonTails=new MoonTailRenderer();pen=new SpiritPenRenderer();brush=new BrushRenderer();thunder=new ThunderRenderer();arrows=new ArrowRenderer();circles=new CircleRenderer();slashes=new SlashRenderer();talismans=new ProceduralTalismanRenderer();realm=new Graphics();telegraph=new Graphics();root=new Container();world=new Container();actors=new Container();skillLayer=new Container();topLayer=new Container();fx=new Graphics();shadow=new Graphics();trace=new Graphics();debug=new Graphics();environment:Environment;fox:FoxRig;ui:Interface;particles:ParticlePool;animator=new Animator();enemyRigs=new Map<number,EnemyRig>();spare:Record<string,EnemyRig[]>={ink:[],crow:[],oni:[],boss:[]};effects:Effect[]=[];clouds:Sprite[]=[];clock=0;shake=0;seenState:State='menu';endAge=0;chains:{points:Point[];age:number}[]=[];foxFires:{from:Point;to:Point;age:number}[]=[];spiritOrbs:{x:number;y:number;age:number}[]=[];entrance={y:720,scale:FOX_MENU_SCALE};
 constructor(public art:Art,background:Record<string,Texture>,onAction:(a:Action)=>void){this.slashes.art=art;this.interactionSlashes.art=art;this.root.addChild(this.world,this.functionalRelics.wash);this.environment=new Environment(art,background);this.world.addChild(this.environment.back,this.talismanBarrage.back);
 this.world.addChildAt(this.scrollLandscape.back,1);
 this.world.addChild(this.shadow,this.telegraph,this.skillLayer,this.burningSea.root,this.actors,this.functionalRelics.world);this.skillLayer.addChild(this.talismans.root,this.circles.back,this.arrows.back,this.thunder.root);this.particles=new ParticlePool(art);this.fox=new FoxRig(art);this.actors.addChild(this.fox.root);this.world.addChild(this.fx,this.sancai.root,this.advancedSpells.root,this.moonTails.root,this.circles.front,this.slashes.root,this.interactionSlashes.root,this.interactions.root,this.freeSlashes.root,this.arrows.root,this.particles.root,this.talismanBarrage.root,this.environment.front,this.scrollLandscape.front,this.brush.root,this.hualing.root,this.topLayer);
 for(let i=0;i<12;i++){const root=new Container(),ring=sprite(art,'sigil_ring',root),center=sprite(art,'sigil_center',root),slash=sprite(art,'slash',root),z=sprite(art,'rune_z',root);root.visible=false;this.skillLayer.addChild(root);this.effects.push({root,ring,center,slash,z,id:-1});}
 const border=this.border;for(const [x,y,sx,sy] of [[22,22,1,1],[698,22,-1,1],[22,1258,1,-1],[698,1258,-1,-1]]){border.moveTo(x,y+75*sy).lineTo(x,y).lineTo(x+75*sx,y).moveTo(x+9*sx,y+46*sy).lineTo(x+9*sx,y+9*sy).lineTo(x+46*sx,y+9*sy).lineTo(x+46*sx,y+27*sy).lineTo(x+28*sx,y+27*sy).lineTo(x+28*sx,y+19*sy);}border.stroke({color:GOLD,width:1.3,alpha:.55});this.root.addChild(border);
 this.root.addChild(this.realm,this.trace,this.pen.root,this.debug);this.ui=new Interface(art,onAction);this.root.addChild(this.ui.root);
 }
 resize(rect:GameViewport){this.viewportTop=rect.top;this.viewportBottom=rect.bottom;
  const height=rect.bottom-rect.top;
  for(const layer of [this.environment.back,this.environment.front,this.border]){layer.y=rect.top;layer.scale.y=height/1280;}
  this.ui.resize(rect);
  this.scrollLandscape.resize(rect);
 }
 begin(){this.talismanBarrage.clear();this.freeSlashes.clear();this.interactionSlashes.clear();this.interactions.clear();this.sancai.clear();this.advancedSpells.clear();this.moonTails.clear();this.pen.clear();this.brush.clear();this.thunder.clear();this.arrows.clear();this.circles.clear();this.slashes.clear();this.talismans.clear();this.animator.clear();this.particles.clear();this.chains=[];this.foxFires=[];this.spiritOrbs=[];this.fox.act('idle');this.fox.root.alpha=1;this.animator.play(new Timeline().parallel([{target:this.entrance,to:{y:WORLD.foxY,scale:FOX_SCALE},duration:.55,ease:easing.out}]));}
 event(e:Event){if(e.type==='talismanBarrage'){this.fox.act('cast',Math.atan2(e.direction.y,e.direction.x));this.shake=Math.max(this.shake,e.kind==='start'?4:1.7);if(e.kind==='start')this.ui.hint('万符洪流 · 锁向连射');}if(e.type==='functionalRelic'){this.ui.hint(e.kind==='stop'?'停时 · 绘符继续':e.kind==='reviveStart'?'描完两笔 · 引魂归来':'回魂成功 · 灵火重燃');if(e.kind==='reviveSuccess'){this.fox.act('cast');this.particles.burst(360,665,16,0xbbe4d6,100,'leaf');}} if(e.type==='burningSeaExplosion'){this.shake=Math.max(this.shake,6);this.ui.hint('焚山煮海 · 万焰齐爆');}if(e.type==='freeStroke'){this.fox.act('cast',Math.atan2(e.direction.y,e.direction.x));this.ui.hint('随笔划斩 · 沿笔迹切割');}if(e.type==='lineInteraction'){this.shake=Math.max(this.shake,e.kind==='triangle'?3:1.5);this.particles.burst(e.x,e.y,e.kind==='triangle'?8:4,GOLD,110,'paper_shard');this.ui.hint(e.kind==='triangle'?'三线围合 · 收缩绞杀':'交点爆发');}if(e.type==='cast'&&e.rune==='ink')return;if(e.type==='cast'){this.environment.cast(e.rune);this.fox.act('cast',Math.atan2(e.direction.y,e.direction.x));this.particles.burst(392,632,6,GOLD,80,'leaf');}
 if(e.type==='strike'){this.shake=Math.max(this.shake,e.dead?3:1.7);this.particles.burst(e.x,e.y,e.dead?14:6,e.kind==='ink'?0x192027:e.kind==='oni'?0xd84332:GOLD,e.dead?210:90,e.kind==='crow'?'env_feather':e.kind==='ink'?'env_inkdrop':'paper_shard');if(e.dead){this.particles.burst(e.x,e.y,4,GOLD,140,'env_talisman');for(let i=0;i<3;i++)this.spiritOrbs.push({x:e.x+(i-1)*10,y:e.y-i*6,age:0});if(this.spiritOrbs.length>24)this.spiritOrbs.splice(0,this.spiritOrbs.length-24);}}
 if(e.type==='hurt'){this.fox.act('hit');this.shake=6;this.particles.burst(WORLD.foxX,WORLD.foxY,14,0xd84332,180);}
 if(e.type==='win'){this.fox.act('victory');this.particles.burst(WORLD.foxX,WORLD.foxY-70,42,GOLD,250,'leaf');}
 if(e.type==='lose'){this.fox.act('death');this.particles.burst(WORLD.foxX,WORLD.foxY-30,28,0xfff7e8,190,'cloud');}
 if(e.type==='foxfire'){this.foxFires.push({from:e.from,to:e.to,age:0});if(this.foxFires.length>6)this.foxFires.shift();}
 if(e.type==='wave')this.ui.hint(e.label+' · 凝神落笔');
 if(e.type==='chain'){const points:Point[]=[];for(let j=1;j<e.points.length;j++){const a=e.points[j-1],b=e.points[j];points.push(a);for(let k=1;k<=5;k++){const f=k/6,offset=k%2?13:-13;points.push({x:a.x+(b.x-a.x)*f+offset,y:a.y+(b.y-a.y)*f-offset});}points.push(b);}if(points.length)this.chains.push({points,age:0});}
 }
 update(game:Game,input:InputController,dt:number,fps:number,realDt=dt){
 const optimize=game.interactionPractice&&this.experimentalOptimizations;
 if(this.circles.optimized!==optimize){this.circles.clear();this.circles.optimized=optimize;if(!optimize)this.circles.atlas?.clear();}
 if(this.pen.optimized!==optimize){this.pen.clear();this.pen.optimized=optimize;}
 const paused=['paused','upgrade','reviving'].includes(game.state);const delta=paused?0:dt;if(!paused)this.clock+=dt;this.animator.update(delta);this.particles.update(delta);this.shake*=Math.exp(-delta*12);this.world.position.set(Math.sin(this.clock*83)*this.shake,Math.cos(this.clock*65)*this.shake);this.fx.clear();
 const guardian=game.skills.find(s=>s.arrows?.level===4),guardianState=guardian?guardianTimeline(guardian.age,guardianConfig(guardian)):undefined;
 this.world.scale.set(1);this.world.rotation=0;this.world.pivot.set(0,0);
 if(guardian&&!game.interactionPractice){const lens=guardianCamera(guardian.age,guardianConfig(guardian));this.world.pivot.set(360,665);this.world.position.set(360+lens.x+Math.sin(this.clock*83)*this.shake,665+lens.y+Math.cos(this.clock*65)*this.shake);this.world.scale.set(lens.scale);this.world.rotation=lens.rotation;}
 if(game.state!==this.seenState){this.seenState=game.state;if(game.state==='win'||game.state==='lose')this.endAge=0;else this.ui.show(game.state,game);if(game.state==='menu'){this.entrance.y=720;this.entrance.scale=FOX_MENU_SCALE;this.fox.act('idle');}}
 if(game.state==='win'||game.state==='lose'){this.endAge+=delta;if(this.endAge>1.25&&this.ui.lastState!==game.state)this.ui.show(game.state,game);}
 this.fox.root.rotation=0;this.fox.body.scale.set(1);this.fox.restTails.forEach((tail,i)=>{tail.x=-43;tail.scale.set([.88,.88,.85][i]);});this.fox.scarf.scale.x=.86;this.fox.root.position.set(360,this.entrance.y);this.fox.root.scale.set(this.entrance.scale);this.fox.update(this.clock,delta,game.invulnerable);
 if(guardianState){this.fox.root.alpha=1;this.fox.head.rotation=-.06*guardianState.emerge;this.fox.left_arm.rotation=-.45-.3*guardianState.vestment;this.fox.right_arm.rotation=.35+.2*guardianState.vestment;}
 const ultimate=[...game.skills].reverse().find(s=>s.slash?.level===4&&s.age<.46);if(ultimate){const age=ultimate.age,angle=Math.atan2(ultimate.direction.y,ultimate.direction.x),left=ultimate.direction.x<0,power=age<.10?age/.10:Math.max(0,1-(age-.10)/.36);this.fox.root.rotation=left?angle-Math.PI:angle;this.fox.root.scale.x=(left?-1:1)*this.entrance.scale;this.fox.root.alpha=1;this.fox.body.scale.set(1+power*.12,1-power*.25);this.fox.body.rotation=-power*.14;this.fox.head.rotation=-power*.18;this.fox.restTails.forEach(tail=>{tail.x=-43-power*20;tail.scale.x*=1+power*.25;tail.rotation-=power*.15;});this.fox.scarf.scale.x=.86+power*.35;}

 const moonCast=[...game.skills].reverse().find(s=>s.moonTail&&s.age<.5);if(moonCast){const power=Math.sin(Math.PI*Math.min(1,moonCast.age/.5));this.fox.restTails.forEach((tail,i)=>{tail.rotation-=power*(.65-i*.12);tail.scale.x*=1+power*.25;});this.fox.head.rotation-=power*.08;}
 this.shadow.clear().ellipse(360,this.entrance.y+103*this.entrance.scale,67*this.entrance.scale,10*this.entrance.scale).fill({color:0x192027,alpha:.23});
 this.environment.back.visible=this.environment.front.visible=!game.hualingPractice;
 if(!game.hualingPractice)this.environment.update(this.clock,game.time,game.state);
 this.scrollLandscape.update(game.hualing,game.hualingPractice,this.ui.low);
 for(const e of game.enemies){let r=this.enemyRigs.get(e.id);if(!r){r=(this.spare[e.look??e.kind]??=[]).pop()??new EnemyRig(e.kind,this.art,e.look);this.actors.addChild(r.root);r.root.visible=true;this.enemyRigs.set(e.id,r);}r.update(e,game.time,game.renderAlpha,game.hualingPractice&&game.hualing.frozen);if(e.kind==='oni'||e.kind==='boss'){const barY=e.y+98*enemyScale(e.kind);this.fx.moveTo(e.x-25,barY).lineTo(e.x+25,barY).stroke({color:0x192027,width:4}).moveTo(e.x-25,barY).lineTo(e.x-25+50*e.hp/e.maxHp,barY).stroke({color:GOLD,width:2});}}
 const alive=new Set(game.enemies.map(e=>e.id));for(const [id,r] of this.enemyRigs)if(!alive.has(id)){r.root.visible=false;(this.spare[r.look??r.kind]??=[]).push(r);this.enemyRigs.delete(id);}
 this.actors.sortableChildren=true;this.fox.root.zIndex=720;for(const r of this.enemyRigs.values())r.root.zIndex=r.root.y;
 this.sancai.update(game.skills);this.advancedSpells.update(game.skills);this.moonTails.update(game.skills);this.brush.update(game.brush.strokes);this.circles.update(game.skills,game.enemies);this.talismans.update(game.skills.filter(s=>s.rune!=='sancai'&&s.rune!=='line'&&s.rune!=='circle'&&s.rune!=='triangle'&&s.rune!=='z'&&s.rune!=='ink'&&s.rune!=='arc'&&s.rune!=='wave'&&s.rune!=='spiral'));this.thunder.update(game.skills);this.arrows.update(game.skills);this.slashes.update(game.skills.filter(s=>!s.interactionLine));this.interactionSlashes.update(game.skills.filter(s=>s.interactionLine&&!s.interactionConsumed));this.interactions.update(game.interactions,game.interactionPractice,import.meta.env.DEV&&input.debug,this.ui.low);this.burningSea.update(game.burningSea,game.practice,this.ui.low,game.pen.id);this.talismanBarrage.update(game.talismanBarrage,game.interactionPractice,game.interactions.bounds,this.ui.low);this.freeSlashes.update(game.freeSlashes.items,game.interactionPractice||game.hualingPractice,game.interactions.bounds,import.meta.env.DEV&&input.debug);
 this.environment.front.alpha=(1-this.circles.cinematicStrength)*(1-(guardianState?.emerge??0)*(guardianState?.opacity??0)*.85);
 this.fox.root.visible=this.circles.cinematicStrength===0||this.circles.layerVisibility.get('Core')!==false;
 for(const rig of this.enemyRigs.values())rig.root.alpha=(1-this.circles.cinematicStrength*.7)*(1-(guardianState?.emerge??0)*(guardianState?.opacity??0)*.65);
 for(const chain of this.chains){chain.age+=delta;if(chain.age>.45)continue;const alpha=Math.max(0,1-chain.age/.45)*(.7+.3*Math.sin(chain.age*60));const g=this.fx;for(const width of [9,3]){g.moveTo(chain.points[0].x,chain.points[0].y);for(const p of chain.points)g.lineTo(p.x,p.y);g.stroke({color:width===9?GOLD:0xfff7e8,width,alpha:width===9?alpha*.22:alpha});}}this.chains=this.chains.filter(c=>c.age<.45);
 for(const o of this.spiritOrbs){o.age+=delta;const u=Math.max(0,Math.min(1,(o.age-.15)/.6)),v=1-(1-u)**2,x=o.x+(515-o.x)*v+Math.sin(u*Math.PI)*24,y=o.y+(116-o.y)*v-Math.sin(u*Math.PI)*35;this.fx.circle(x,y,3).fill({color:GOLD,alpha:1-u*.5});}this.spiritOrbs=this.spiritOrbs.filter(o=>o.age<.75);
 for(const f of this.foxFires){f.age+=delta;const u=Math.min(1,f.age/.32),x=f.from.x+(f.to.x-f.from.x)*u,y=f.from.y+(f.to.y-f.from.y)*u-Math.sin(u*Math.PI)*40;this.fx.moveTo(x,y-13).quadraticCurveTo(x+22,y+8,x,y+15).quadraticCurveTo(x-16,y+7,x,y-13).fill({color:GOLD,alpha:Math.max(0,1-(f.age-.3)*6)});}this.foxFires=this.foxFires.filter(f=>f.age<.48);
 this.telegraph.clear();for(const e of game.enemies){if(e.shock>0)this.telegraph.circle(e.x,e.y,35+Math.sin(this.clock*20)*2).stroke({color:GOLD,width:1.5,alpha:.5});if(e.ai!=='Telegraph')continue;const limit=e.kind==='boss'?BOSS.windups[e.phase-1]:ENEMIES[e.kind].windup,p=Math.min(1,e.stateAge/limit);this.telegraph.moveTo(e.x,e.y).lineTo(e.lureId&&game.functionalRelics.lantern?.id===e.lureId?game.functionalRelics.lantern.x:360,e.lureId&&game.functionalRelics.lantern?.id===e.lureId?game.functionalRelics.lantern.y:665).stroke({color:0xd84332,width:e.kind==='boss'?8:3,alpha:.18+p*.25});this.telegraph.circle(e.x,e.y,e.kind==='boss'?96:e.kind==='oni'?49:32).stroke({color:0xe7ba68,width:2.5,alpha:.25+p*.5});if(e.kind==='boss'&&e.phase===3)this.telegraph.circle(360,665,220*(1-p)+60).stroke({color:0xd84332,width:3,alpha:.5});}
 this.realm.clear();if(input.drawing){this.realm.rect(0,175,720,1005).fill({color:0x192027,alpha:.12});this.realm.circle(360,665,230).stroke({color:GOLD,width:1,alpha:.2});}
 this.trace.clear();
 if(input.drawing&&input.preview?.rune==='sancai'&&input.preview.geometry.triangle){const shape=capTriangle(input.preview.geometry.triangle),color=shape.form==='large'?0xc84130:GOLD;this.trace.poly(shape.vertices.flatMap(p=>[p.x,p.y])).stroke({color,width:2,alpha:.45});for(const p of shape.vertices)this.trace.circle(p.x,p.y,shape.form==='large'?8:4).stroke({color:GOLD,width:1.5,alpha:.6});this.trace.circle(shape.center.x,shape.center.y,5).stroke({color:GOLD,width:1,alpha:.5});}
 this.hualing.update(game.hualing,game.hualingPractice,this.ui.low);this.functionalRelics.update(game,game.interactions.bounds,this.viewportTop,this.viewportBottom);this.debug.clear();this.pen.update(input);this.ui.debug=input.debug;this.ui.counter.visible=input.debug;this.ui.update(game,paused?0:realDt,fps,input);
 this.ui.tip.style.fill=this.circles.cinematicStrength>.1?GOLD:0x562a34;
 const circleUltimate=game.skills.find(s=>s.rune==='circle'&&s.testLevel===5);
 if(circleUltimate&&this.circles.cinematicStrength>.1){const t=circleUltimate.age;this.ui.tip.text='天狐山海界 · '+(t<.45?'起符':t<.82?'成阵':t<1.12?'封印':t<2.13?'展卷':t<2.81?'天狐降临':'山海守护');}
 const latest=game.skills.at(-1);if(latest?.circle?.mode==='seal'&&(latest.age<1.8||latest.circle.broken))this.ui.tip.text=SEAL_NAMES[latest.circle.level-1]+' · '+(latest.circle.broken?'破阵震荡':'镇封圈内妖怪');
 }
}
