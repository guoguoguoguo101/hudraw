import {ElitePaperPuppet} from './elite-puppet';
import {elitePose} from './elite-motion';
import {EliteFieldRenderer} from './elite-field';
import type {EliteKind} from '../gameplay/hualing-elites';
import {drawEliteArt} from './elite-art';
import {Container,Graphics,Text,type Texture} from 'pixi.js';
import type {Enemy} from '../core/types';
import {ELITE_NAMES,ELITE_CATALOG,eliteHint,eliteRelicPoints,type HualingElites} from '../gameplay/hualing-elites';
const RED=0xbb422f,LIGHT=0xdf6948,DARK=0x702c2c,INK=0x253730,BONE=0xead9ae,PAPER=0xffedc9,GOLD=0xcda564;
function flame(g:Graphics,x:number,y:number,size:number,alpha=1){
 g.moveTo(x,y-size).bezierCurveTo(x+size*.2,y-size*.2,x+size,y,x,y+size*.5).bezierCurveTo(x-size*.8,y,x-size*.35,y-size*.2,x,y-size).fill({color:GOLD,alpha});
 g.moveTo(x,y-size*.45).quadraticCurveTo(x+size*.5,y,x,y+size*.25).quadraticCurveTo(x-size*.3,y,x,y-size*.45).fill({color:PAPER,alpha});
}
function lantern(g:Graphics,x:number,y:number,size:number,open=false){
 g.poly([x,y-size,x+size*.7,y-size*.65,x+size,y,x+size*.65,y+size*.65,x,y+size,x-size*.65,y+size*.65,x-size,y,x-size*.7,y-size*.65]).fill(DARK).stroke({color:GOLD,width:1.1});
 g.poly([x,y-size,x+size*.65,y-size*.65,x+size*.8,y,x+size*.5,y+size*.7,x,y+size]).fill(RED);
 g.poly([x,y-size,x-size*.6,y-size*.6,x-size*.72,y,x-size*.45,y+size*.65,x,y+size]).fill(LIGHT);
 if(open){g.poly([x-5,y-size*.8,x-16,y-8,x-8,y+13,x,y+size*.8,x+10,y+9,x+16,y-12,x+5,y-size*.8]).fill(INK);flame(g,x,y,size*.65);}
 else{g.poly([x-size*.5,y,x,y-size*.25,x+size*.5,y,x,y+size*.25]).fill(BONE);g.ellipse(x,y,size*.09,size*.2).fill(INK);}
 g.moveTo(x-size*.55,y-size*.67).lineTo(x+size*.55,y-size*.67).moveTo(x-size*.5,y+size*.7).lineTo(x+size*.5,y+size*.7).stroke({color:BONE,width:2});
 for(let i=-1;i<=1;i++){g.moveTo(x+i*size*.25,y+size*.8).lineTo(x+i*size*.35,y+size*1.5).stroke({color:i?GOLD:BONE,width:i?1.2:2});}
}
type Rig={puppet?:ElitePaperPuppet;enemy?:Enemy;lastClock:number;deathAt?:number;root:Container;body:Container;kind?:EliteKind;art:Graphics;marks:Graphics;name:Text;hint:Text};
export class HualingEliteRenderer{
 root=new Container();loader?:(kind:EliteKind)=>Promise<Texture>;private assets=new Map<EliteKind,Texture>();private pending=new Set<EliteKind>();private retry=new Map<EliteKind,number>();private arena=new EliteFieldRenderer();private ground=new Graphics();private world=new Container();private fx=new Graphics();private rigs=new Map<number,Rig>();
 constructor(){this.root.addChild(this.ground,this.arena.ground,this.world,this.arena.root,this.fx);}
 private rig(id:number){
  let r=this.rigs.get(id);if(r)return r;const root=new Container(),body=new Container(),art=new Graphics(),marks=new Graphics();
  const name=new Text({text:'',style:{fontFamily:'KaiTi, serif',fontSize:22,fill:PAPER,stroke:{color:INK,width:3},letterSpacing:2}});name.anchor.set(.5);name.y=115;
  const hint=new Text({text:'',style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:15,fill:GOLD,stroke:{color:INK,width:3}}});hint.anchor.set(.5);hint.y=140;
  root.addChild(art,body,marks,name,hint);this.world.addChild(root);r={root,body,art,marks,name,hint,lastClock:0};this.rigs.set(id,r);return r;
 }
 private ensure(r:Rig,kind:EliteKind){
  const data=this.assets.get(kind);
  if(!data){if(this.loader&&!this.pending.has(kind)&&Date.now()>=(this.retry.get(kind)??0)){this.pending.add(kind);this.loader(kind).then(d=>{this.assets.set(kind,d);this.pending.delete(kind);}).catch(()=>{this.pending.delete(kind);this.retry.set(kind,Date.now()+3000);});}return false;}
  if(r.kind!==kind){r.puppet?.destroy();r.body.removeChildren().forEach(c=>c.destroy({children:true}));r.puppet=new ElitePaperPuppet(kind,data);r.body.addChild(r.puppet.root);r.kind=kind;}
  return true;
 }
 update(model:HualingElites,enemies:Enemy[],enabled:boolean,clock:number,low=false){
  this.root.visible=enabled;this.ground.clear();this.fx.clear();const live=enemies.filter(e=>e.elite&&e.hp>0),ids=new Set(live.map(e=>e.id));
  for(const [id,r] of this.rigs)if(!ids.has(id)){
   const died=enabled&&r.enemy&&r.enemy.hp<=0&&clock>=r.lastClock;
   if(died){r.deathAt??=clock;const age=clock-r.deathAt;if(age<.75){r.name.visible=r.hint.visible=false;r.marks.clear();r.art.clear();r.puppet?.defeat(age);r.root.alpha=1-age/.75;continue;}}
   r.puppet?.destroy();r.root.destroy({children:true});this.rigs.delete(id);
  }
  this.arena.update(model.field,enabled,low);if(!enabled)return;
  for(const e of live){const s=e.elite!,r=this.rig(e.id),g=r.art,m=r.marks;g.clear();m.clear();r.root.position.set(e.x,e.y);r.enemy=e;r.lastClock=clock;r.deathAt=undefined;r.name.visible=r.hint.visible=true;
   r.root.alpha=s.phase==='arrive'?Math.min(1,s.age/.5):1;
   this.ground.ellipse(e.x,e.y+83,s.kind==='umbrella'?62:55,12).fill({color:INK,alpha:.24});
   const pose=elitePose(s,e.hit),ready=this.ensure(r,s.kind);r.body.visible=ready;r.body.rotation=0;r.body.scale.set(1);r.puppet?.update(e);
   if(!ready){g.save().transform(1,0,0,1,-pose.recoil*5,pose.charge*5-pose.cast*9+pose.weak*7);drawEliteArt(g,e);g.restore();}
   if(s.phase==='stagger'){m.ellipse(0,0,15,24).fill({color:GOLD,alpha:.6});m.poly([0,-12,8,0,0,12,-8,0]).fill(PAPER);}
   if(e.hit>.16){m.ellipse(0,-4,24,37).stroke({color:PAPER,width:2,alpha:.65});}
   m.roundRect(-145,103,290,48,7).fill({color:INK,alpha:.9}).stroke({color:GOLD,width:.7,alpha:.38});
   m.roundRect(-47,96,94,5,2).fill({color:INK,alpha:.9});m.roundRect(-47,96,Math.max(1,94*e.hp/e.maxHp),5,2).fill(s.phase==='stagger'?GOLD:RED);
   r.name.text=ELITE_NAMES[s.kind];r.hint.text=eliteHint(e);r.hint.style.fontSize=14;r.name.alpha=s.phase==='dash'?.75:1;
   r.body.alpha=(s.kind==='rays'||s.kind==='deer')&&s.phase==='dash'?.24:1;
   if(s.phase==='stagger')m.poly([-20,-38,0,-29,20,-38,7,-9,0,-3,-7,-9]).stroke({color:GOLD,width:1.5,alpha:.5+Math.sin(clock*6)*.15});
  }
  for(const r of model.relics){const p=this.fx,ratio=r.marks.filter(Boolean).length/12,alpha=r.collected?Math.max(0,1-r.age/.8):1;
   if(r.kind==='umbrella')p.poly([r.x-37,r.y+3,r.x-22,r.y-15,r.x,r.y-27,r.x+22,r.y-15,r.x+37,r.y+3,r.x,r.y-4]).fill({color:RED,alpha:alpha*(.12+.75*ratio)}).stroke({color:GOLD,width:1,alpha:alpha*.6});
   else if(r.kind==='lantern'){p.save().transform(.7,0,0,.7,r.x,r.y);lantern(p,0,0,26,true);p.restore();}
   else{const ch=ELITE_CATALOG[r.kind].chapter,c=ch==='sea'?0x4b9690:ch==='palace'?0x6d627e:ch==='snow'?0x9cab9d:RED;p.roundRect(r.x-25,r.y-30,50,59,6).fill({color:c,alpha:alpha*(.25+.75*ratio)}).stroke({color:GOLD,width:1,alpha});p.poly([r.x,r.y-16,r.x+11,r.y,r.x,r.y+16,r.x-11,r.y]).fill({color:PAPER,alpha:alpha*.85});}
   const pts=eliteRelicPoints(r);for(let i=0;i<pts.length;i++)p.circle(pts[i].x,pts[i].y,2).fill({color:r.marks[i]?PAPER:GOLD,alpha:alpha*(r.marks[i]?1:.35)});
   if(r.collected){flame(p,r.x,r.y-r.age*55,12,alpha);}else this.ground.ellipse(r.x,r.y+15,44,10).fill({color:INK,alpha:.14});
  }
  for(const [i,p] of model.shards.entries()){if(low&&i%2)continue;const f=1-p.age/.45,x=p.x+Math.cos(p.angle)*p.age*85,y=p.y+Math.sin(p.angle)*p.age*85+30*p.age*p.age;this.fx.poly([x-3*f,y,x,y-5*f,x+3*f,y+2*f,x,y+4*f]).fill({color:p.color,alpha:f});}
 }
}
