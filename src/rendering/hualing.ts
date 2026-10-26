import {InkDragonRenderer,inkDragonHead} from './ink-dragon';
import {Container,Graphics} from 'pixi.js';
import type {Hualing,SpiritCard} from '../gameplay/hualing';
import {SceneSealRenderer} from './scene-seal';
const GOLD=0xe7ba68,PAPER=0xffedcb;
export function spiritIcon(g:Graphics,_kind:SpiritCard){g.clear();inkDragonHead(g);}
export class HualingRenderer{
 compactUI=false;
 dragons=new InkDragonRenderer();root=new Container();private guide=new Graphics();private scene=new SceneSealRenderer();
 constructor(){this.root.addChild(this.scene.root,this.dragons.root,this.scene.companions,this.guide);}
 update(m:Hualing,enabled:boolean,low=false,eliteEncounter=false){
  this.root.visible=enabled;if(!enabled)return;this.guide.clear();
  this.scene.compact=this.compactUI;this.scene.update(m.sceneSeal,m.bounds,m.clock,!m.selected,m.scenes,m.bosses.active||eliteEncounter);this.dragons.update(m,low);
  if(m.selected&&!m.drawing){
   const top=m.bounds.top,bottom=m.bounds.bottom,hint=Array.from({length:45},(_,i)=>({x:360+Math.sin(i/44*Math.PI*2)*140,y:bottom-85-i/44*(bottom-top-180)})),g=this.guide;
   for(let i=1;i<hint.length;i+=2)g.moveTo(hint[i-1].x,hint[i-1].y).lineTo(hint[i].x,hint[i].y).stroke({color:GOLD,width:2,alpha:.35});
   g.circle(hint[0].x,hint[0].y,11).stroke({color:GOLD,width:2,alpha:.7});g.circle(hint[0].x,hint[0].y,4).fill(PAPER);
  }
  const tip=m.path.at(-1);if(m.drawing&&tip){this.guide.circle(tip.x,tip.y,6).fill(GOLD);this.guide.circle(tip.x,tip.y,3).fill(PAPER);}
 }
}
