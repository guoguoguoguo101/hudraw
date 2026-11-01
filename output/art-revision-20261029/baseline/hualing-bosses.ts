import {BOSS_PARTS,partWorld} from '../gameplay/boss-anatomy';
import {bossPose,deformBossVertex} from './boss-motion';
import {BossPaperPuppet} from './boss-puppet';
import {emberSource,mirrorStars,comboProgress,COMBO_NAMES,eyeOpen} from '../gameplay/boss-battlefield';
import {drawBossBattlefield} from './boss-battlefield';
import {Container,Graphics,Text,type Renderer} from 'pixi.js';
import type {Enemy} from '../core/types';
import type {Hualing} from '../gameplay/hualing';
import type {HualingChapter} from '../gameplay/hualing-chapters';
import {bossMarks,bossTraps,bossReceiver,bossTimeLimit,threadDirection,threadOpen,dreamCenter,dreamFires,CHAPTER_BOSSES,type BossCue} from '../gameplay/hualing-bosses';
import {paperArt,type PaperVector} from './chapter-art/vector-art';
const ICE_COLOR=0xc6edf4;
const GOLD=0xe6c17b,PAPER=0xf3e9ce,INK=0x1e2b34;
const words=(size:number)=>{const t=new Text({text:'',style:{fontFamily:'KaiTi,STKaiti,serif',fontSize:size,fill:PAPER,stroke:{color:INK,width:3},align:'center'}});t.anchor.set(.5);return t;};
export class HualingBossRenderer{
 root=new Container();renderer?:Renderer;private puppet?:BossPaperPuppet;loader?:(chapter:HualingChapter)=>Promise<PaperVector>;
 private assets=new Map<HualingChapter,PaperVector>();private pending=new Set<HualingChapter>();private retry=new Map<HualingChapter,number>();
 private battlefieldBack=new Graphics();private battlefieldFront=new Graphics();private command=words(21);private veil=new Graphics();private shards=new Graphics();private cues:(BossCue&{at:number})[]=[];private lanes=new Graphics();private rig=new Container();private body=new Container();private ornament=new Graphics();private marks=new Graphics();private hud=new Graphics();private title=words(23);private hint=words(18);private result=words(26);private guard=words(17);private banner=words(30);
 private artChapter:HualingChapter|null=null;private labels:Text[]=[];
 constructor(){this.rig.addChild(this.body);this.root.addChild(this.veil,this.battlefieldBack,this.lanes,this.rig,this.battlefieldFront,this.ornament,this.marks,this.shards,this.command,this.hud,this.title,this.hint,this.guard,this.banner,this.result);for(let i=0;i<9;i++){const t=words(18);this.root.addChild(t);this.labels.push(t);}}
 get ready(){return this.artChapter!==null;}
 private ensure(chapter:HualingChapter){
  if(!this.assets.has(chapter)){
   if(this.loader&&!this.pending.has(chapter)&&Date.now()>=(this.retry.get(chapter)??0)){
    this.pending.add(chapter);this.loader(chapter).then(data=>{this.assets.set(chapter,data);this.pending.delete(chapter);}).catch(()=>{this.pending.delete(chapter);this.retry.set(chapter,Date.now()+3000);});
   }return false;
  }
  if(this.artChapter!==chapter){
   this.puppet?.destroy();this.puppet=undefined;this.body.removeChildren().forEach(c=>c.destroy({children:true}));const data=this.assets.get(chapter)!;
   if(this.renderer){this.puppet=new BossPaperPuppet(chapter,data,this.renderer);this.body.addChild(this.puppet.root);}
   else{const g=paperArt('chapter-boss-v03-'+chapter,data),scale=Math.min(350/data.width,295/data.height);g.scale.set(scale);g.position.set(-data.width*scale/2,-data.height*scale/2);this.body.addChild(g);}
   this.artChapter=chapter;
  }
  return true;
 }
 cue(cue:BossCue,clock:number){this.cues.push({...cue,at:clock});if(this.cues.length>20)this.cues.shift();}
 update(model:Hualing,enemies:Enemy[],enabled:boolean,low:boolean){
  this.root.visible=enabled;if(!enabled){this.cues=[];return;}
  for(const g of [this.veil,this.battlefieldBack,this.battlefieldFront,this.lanes,this.ornament,this.marks,this.hud,this.shards])g.clear();this.labels.forEach(t=>t.visible=false);
  const e=enemies.find(e=>e.chapterBoss&&e.hp>0),s=e?.chapterBoss,b=model.bounds,m=model.bosses,time=m.clock;
  this.cues=this.cues.filter(c=>time>=c.at&&time-c.at<1.3);
  this.command.visible=!!e;this.rig.visible=!!e;this.title.visible=this.hint.visible=this.guard.visible=!!e;this.banner.visible=false;
  this.result.visible=(!!m.defeated||m.failed)&&m.resultAge<8;
  if(this.result.visible){this.result.position.set(360,b.top+(b.bottom-b.top)*.5);this.result.text=m.notice+(m.failed?'\n重整笔锋 · 再战一次':'\n四方归宁');this.result.style.fill=m.failed?0xf0a086:GOLD;}
  if(!e||!s){const departing=(!!m.defeated||m.failed)&&m.resultAge<1.2&&!!this.puppet;this.rig.visible=departing;if(departing)this.puppet!.defeat(m.resultAge,m.failed);this.drawCues(time,low);return;}
  drawBossBattlefield(this.battlefieldBack,this.battlefieldFront,e,b,low,248+Math.min(1,model.journey.time/55)*92);
  const ready=this.ensure(s.chapter),def=CHAPTER_BOSSES[s.chapter],wind=s.phase==='windup',attack=s.phase==='attack',weak=s.phase==='stagger',arrival=s.phase==='arrive'?Math.min(1,s.age/.65):1;
  const tint={valley:0x654932,sea:0x32686c,palace:0x414b70,snow:0x54707c}[s.chapter],g=this.veil;
  g.rect(0,0,720,1280).fill({color:tint,alpha:(weak?.07:s.enraged?.18:.12)*arrival});
  // Theme-colored curtains and thin paper waves animate across the available scene.
  for(let i=0;i<(low?2:4);i++){
   const y=b.top+130+i*(b.bottom-b.top-150)/4+Math.sin(time*.7+i)*20;
   g.moveTo(0,y+40).bezierCurveTo(180,y-45,470,y+70,720,y-15).lineTo(720,y+25).bezierCurveTo(450,y+105,180,y-10,0,y+70).closePath().fill({color:def.color,alpha:weak?.025:.045});
  }
  g.rect(0,b.top+90,10,b.bottom-b.top-105).fill({color:def.color,alpha:.15}).rect(710,b.top+90,10,b.bottom-b.top-105).fill({color:def.color,alpha:.15});
  if(m.integrity<30)g.rect(0,0,720,1280).fill({color:0x9d2425,alpha:.02+.02*Math.sin(time*2)**2});
  this.puppet?.update(s,e.hit);this.body.visible=ready;this.rig.position.set(e.x,e.y);this.rig.alpha=arrival;
  this.rig.scale.set(weak?1:.9);this.rig.rotation=0;this.body.scale.set(1);
  this.battlefieldFront.roundRect(90,b.bottom-165,540,69,10).fill({color:INK,alpha:.72}).stroke({color:GOLD,width:1,alpha:.26});this.command.position.set(360,b.bottom-130);this.command.style.fontSize=20;const incoming=s.field.attacks.filter(a=>!a.resolved&&a.age>=0).sort((a,c)=>(a.charge+a.duration-a.age)-(c.charge+c.duration-c.age))[0];
  let instruction:string=CHAPTER_BOSSES[s.chapter].hint;
  if(incoming){const a=incoming,part=BOSS_PARTS[s.chapter][a.part].name;instruction=part+' · '+({sun:'金火亮环内，横截弹道！',lash:'尾鞭伸展，横断亮结！',tide:'对准亮色潮缝，横笔划穿！',pearl:eyeOpen(s.field)?'潮眼已开！按住海珠送回眼中':'抓住海珠别松手，等潮眼张开',beam:'连接同色双星，把星束折回！',thread:a.part%2===0?'竖丝亮起，横笔斩断！':'横丝亮起，竖笔斩断！',frost:'吐息将至，一笔围住下方暖火！',hoof:'裂结亮起，沿箭头横断蹄震！'} as const)[a.kind];}
  if(s.chapter==='sea'&&s.field.carry!==null)instruction=eyeOpen(s.field)?'潮眼张开！把笔下海珠送回眼中':'海珠已抓住 · 按住等潮眼张开';
  this.command.text=weak?'拆招成功 · '+Math.ceil(Math.max(0,3.1-s.age))+' 秒追心！':instruction+'\n'+comboProgress(s.chapter,s.field)+(s.field.combo>=3?' · '+s.field.combo+' 连破':'');this.command.style.fill=weak?GOLD:PAPER;
  this.hud.roundRect(90,b.top-17,540,111,13).fill({color:INK,alpha:.78}).stroke({color:def.color,width:1,alpha:.4});
  this.title.position.set(360,b.top+2);this.title.text=`${def.name} · ${s.enraged?'狂攻':'连招'}${weak?' · 妖心暴露':''}`;
  this.hud.roundRect(135,b.top+22,450,8,4).fill({color:0x111b25,alpha:.9}).roundRect(135,b.top+22,Math.max(1,450*e.hp/e.maxHp),8,4).fill(weak?GOLD:def.color);
  this.hud.roundRect(230,b.top+43,270,5,2).fill(0x17232d).roundRect(230,b.top+43,Math.max(1,270*m.integrity/100),5,2).fill(m.integrity<30?0xd86b55:0xb4d3bc);
  const progress=comboProgress(s.chapter,s.field);
  this.guard.position.set(360,b.top+61);this.guard.text=`护卷 ${Math.ceil(m.integrity)} · ${weak?`追心 ${Math.max(0,Math.ceil(3.1-s.age))}秒`:progress}`;
  this.hint.position.set(360,b.top+82);this.hint.text=!ready?'Boss 画卷加载中…':weak?'追击移动妖心 · 三秒收势后继续拆招':COMBO_NAMES[s.chapter]+` · ${Math.max(0,Math.ceil(bossTimeLimit(s)-s.age))}秒`;this.hint.style.fontSize=17;
  if(s.phase==='arrive'){this.banner.visible=true;this.banner.position.set(360,b.bottom-160);this.banner.text=def.name+'\n画卷将倾 · 护住卷心';this.banner.alpha=Math.sin(arrival*Math.PI);}
  if(s.field.combo>=3&&s.field.clock-s.field.lastCounter<.55&&!weak){this.banner.visible=true;this.banner.text=`${s.field.combo} 连破`;this.banner.position.set(360,b.top+280);this.banner.alpha=1-(s.field.clock-s.field.lastCounter)/.65;}
  if(s.chapter==='palace')for(let i=0;i<1;i++){
   const a=s.clock*(i?-.18:.14),r=105+i*17;this.ornament.save().transform(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),e.x,e.y-45).ellipse(0,0,r,r*.65).stroke({color:GOLD,width:1.3,alpha:weak?.15:.3}).restore();
  }
  if(!weak){this.ornament.ellipse(e.x,e.y,104+Math.sin(time)*4,83).stroke({color:def.color,width:2,alpha:.22});}
  if(wind||attack){const pose=bossPose(s);for(const [i,part] of BOSS_PARTS[s.chapter].entries()){const a=s.field.attacks.find(a=>a.part===i&&!a.resolved&&a.age>=0&&a.age<a.charge+.22);if(!a)continue;const p=partWorld(s.chapter,i,e,(u,v)=>deformBossVertex(s.chapter,u,v,pose)),label=this.labels[i];label.visible=true;label.text=s.chapter==='valley'?`${i+1}`:part.name;label.position.set(p.x,p.y-24);label.style.fill=a.age<a.charge?GOLD:PAPER;}}
  if(weak){
   const r=34+Math.sin(time*4)*4;this.ornament.circle(e.x,e.y+10,r+12).fill({color:GOLD,alpha:.1}).circle(e.x,e.y+10,r).stroke({color:GOLD,width:3}).poly([e.x,e.y-9,e.x+16,e.y+10,e.x,e.y+29,e.x-16,e.y+10]).fill({color:GOLD,alpha:.45});
   for(let i=0;i<9;i++){const a=time*.8+i*Math.PI*2/5;this.ornament.circle(e.x+Math.cos(a)*43,e.y+10+Math.sin(a)*43,2).fill(PAPER);}
  }
  this.drawCues(time,low);
 }
 private drawCues(time:number,low:boolean){
  const g=this.shards;for(const c of this.cues){const t=time-c.at,life=c.kind==='step'?.6:1.25,u=t/life;if(u>1)continue;const color=c.kind==='danger'||c.kind==='defeat'?0xdf7667:CHAPTER_BOSSES[c.chapter].color;
   if(c.kind==='parry'||c.kind==='break'||c.kind==='impact'){const power=1-u;for(let k=0;k<3;k++){const r=25+u*(120+k*45);if(c.chapter==='sea')g.ellipse(c.x,c.y,r,r*.35).stroke({color:k?PAPER:color,width:k?3:8,alpha:power*.75});else if(c.chapter==='palace')g.save().transform(Math.cos(u*2),Math.sin(u*2),-Math.sin(u*2),Math.cos(u*2),c.x,c.y).poly([0,-r,r,0,0,r,-r,0]).stroke({color:k?GOLD:PAPER,width:3,alpha:power*.8}).restore();else if(c.chapter==='snow')for(let j=0;j<6;j++){const a=j*Math.PI/3;g.moveTo(c.x+Math.cos(a)*20,c.y+Math.sin(a)*20).lineTo(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r).stroke({color:ICE_COLOR,width:3,alpha:power*.7});}else g.ellipse(c.x,c.y,r*.8,r).stroke({color:k?GOLD:color,width:k?3:8,alpha:power*.7});}}
   g.circle(c.x,c.y,18+u*(c.kind==='break'?170:75)).stroke({color,width:c.kind==='step'?2:4,alpha:(1-u)*.7});
   if(c.kind!=='step')for(let i=0;i<(low?8:16);i++){const a=i*2.399,r=25+u*(70+i%4*22),x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r+t*t*20;g.save().transform(Math.cos(a+t*3),Math.sin(a+t*3),-Math.sin(a+t*3),Math.cos(a+t*3),x,y).poly([-4,0,0,-2,5,1,0,3]).fill({color:i%2?PAPER:color,alpha:1-u}).restore();}
  }
 }
}
