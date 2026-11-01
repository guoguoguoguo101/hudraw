import {Container,Graphics,Text} from 'pixi.js';
import type {Game} from '../gameplay/game';
import type {InputEvent} from '../platform/adapter';
import {text} from './interface';
import {MOUNTAIN_THEMES} from './mountain-theme';
const RED=0xa34435;
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
/** Playable presentation switch. It changes layout, never resets the run. */
export class HualingPlayUI{
 root=new Container();formal=false;private zones:Zone[]=[];private key='';private info?:Text;private timer?:Text;private health=new Graphics();private healthKey='';
 constructor(private game:Game,private cancel:()=>void,private pause:()=>void,private changed:(formal:boolean)=>void){}
 handle(e:InputEvent){
  if(!this.root.visible||!this.game.active)return false;
  if(this.game.hualing.drawing||this.game.hualing.scenes.some(s=>s.dragPointer!==null))return false;
  if(e.kind!=='down')return false;
  const zone=this.zones.find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);
  if(zone){this.cancel();zone.run();this.key='';return true;}
  return false;
 }
 private button(label:string,x:number,y:number,w:number,h:number,run:()=>void){
  const t=MOUNTAIN_THEMES[this.game.hualing.journey.chapter];
  this.root.addChild(new Graphics().poly([x+5,y,x+w-7,y,x+w,y+7,x+w-2,y+h,x+2,y+h,x,y+h-7]).fill({color:t.paper,alpha:.95}).stroke({color:t.line,width:.8,alpha:.7}));
  text(this.root,label,x+w/2,y+h/2,18,t.ink,{letterSpacing:1});this.zones.push({x,y,w,h,run});
 }
 update(footer:number,header:number){
  const g=this.game,m=g.hualing;this.root.visible=g.hualingPractice&&g.active;if(!this.root.visible)return;
  const key=JSON.stringify([this.formal,footer,header,m.selected,m.journey.chapter,m.upgrades.levels.trail,m.upgrades.levels.line]);
  if(this.key!==key){
   this.key=key;this.zones=[];this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.info=this.timer=undefined;
   this.health=new Graphics();
   // Cached health belongs to the old Graphics; a new sheet needs its first draw.
   this.healthKey='';
   this.button(this.formal?'切回测试':'正式界面',508,header+10,174,36,()=>{this.formal=!this.formal;if(m.upgrades.panel==='custom')m.upgrades.panel=null;this.changed(this.formal);});
   if(this.formal){
    const t=MOUNTAIN_THEMES[m.journey.chapter];
    this.button('成长试演',30,header+10,174,36,()=>{m.upgrades.panel='custom';});
    const sheet=new Graphics();this.root.addChild(sheet);
    sheet.poly([32,header+56,685,header+56,696,header+67,692,header+136,27,header+136,24,header+125,27,header+64]).fill({color:t.paper,alpha:.95}).stroke({color:t.line,width:1,alpha:.75});
    sheet.moveTo(42,header+64).lineTo(676,header+64).moveTo(42,header+129).lineTo(676,header+129).stroke({color:t.line,width:.7,alpha:.35});
    sheet.moveTo(49,header+72).lineTo(49,header+113).stroke({color:t.accent,width:1.4,alpha:.65});
    const title=text(this.root,'画 灵',81,header+84,27,t.ink,{letterSpacing:4});title.anchor.x=0;
    this.info=text(this.root,'',302,header+86,17,t.muted,{letterSpacing:0});
    this.timer=text(this.root,'',512,header+86,27,t.ink,{fontFamily:'Georgia',letterSpacing:1});
    this.button('Ⅱ',614,header+68,58,44,()=>this.pause());
    this.root.addChild(this.health);

   }
  }
  if(this.formal){
   this.info!.text=`${m.journey.info.name} · 斩妖 ${g.kills}`;
   const seconds=Math.floor(m.clock);this.timer!.text=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
   const healthKey=[header,m.journey.chapter,g.life,g.maxHp].join(':');
   if(this.healthKey!==healthKey){const t=MOUNTAIN_THEMES[m.journey.chapter];this.healthKey=healthKey;this.health.clear().rect(48,header+119,624,3).fill({color:t.ink,alpha:.13}).rect(48,header+119,Math.max(1,624*g.life/g.maxHp),3).fill({color:RED,alpha:.9});}

  }
 }
}
