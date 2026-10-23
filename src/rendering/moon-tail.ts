import {Container,Graphics} from 'pixi.js';
import {WORLD,type Skill} from '../core/types';
import {MOON_TAIL_STAGES,moonFront} from '../gameplay/moon-tail';
const WHITE=0xfff4dc,GOLD=0xe7ba68,RED=0xd84332,INK=0x29343b;
type Item={root:Container;g:Graphics};
/** Bounded, pooled vector layers. All animation uses the skill's combat age. */
export class MoonTailRenderer{
 root=new Container();private active=new Map<number,Item>();private spare:Item[]=[];
 clear(){for(const item of this.active.values()){item.root.visible=false;this.spare.push(item);}this.active.clear();}
 update(skills:Skill[]){
  const tails=skills.filter(s=>s.moonTail),alive=new Set(tails.map(s=>s.id));
  for(const [id,item] of this.active)if(!alive.has(id)){item.root.visible=false;this.active.delete(id);if(this.spare.length<12)this.spare.push(item);else item.root.destroy({children:true});}
  for(const s of tails){let item=this.active.get(s.id);if(!item){item=this.spare.pop()??{root:new Container(),g:new Graphics()};if(!item.g.parent)item.root.addChild(item.g);this.root.addChild(item.root);this.active.set(s.id,item);}
   item.root.visible=true;item.root.position.set(s.x,s.y);item.root.rotation=Math.atan2(s.direction.y,s.direction.x);this.draw(item.g,s,tails.length);
  }
 }
 private draw(g:Graphics,s:Skill,count:number){
  g.clear();const m=s.moonTail!,c=MOON_TAIL_STAGES[m.level-1],t=s.age;
  if(t<c.release){const u=t/c.release;g.arc(-24,0,28+u*25,-1.7,1.7).stroke({color:GOLD,width:2+u*3,alpha:u*.65});}
  if(m.level===4&&t<.55){
   const opacity=Math.sin(Math.PI*Math.min(1,t/.55))*.3;
   g.save();g.context.translate(-24,0);
   for(let i=0;i<9;i++){g.save();g.context.rotate(-1.1+i*.275);this.tail(g,-32,0,150,35,opacity);g.restore();}
   g.moveTo(-15,-28).lineTo(4,-56).lineTo(17,-25).quadraticCurveTo(53,-22,68,0).quadraticCurveTo(53,22,17,25).lineTo(4,56).lineTo(-15,28).quadraticCurveTo(-38,0,-15,-28).fill({color:WHITE,alpha:opacity}).stroke({color:GOLD,width:2,alpha:opacity});
   g.moveTo(26,-11).lineTo(43,-6).moveTo(26,11).lineTo(43,6).stroke({color:RED,width:3,alpha:opacity*2});g.restore();
  }
  const alpha=t<c.release?Math.max(0,t/c.release)*.65:Math.max(0,Math.min(1,(m.end+.18-t)/.18));
  if(alpha>0){
   g.save();g.context.translate(m.travel,0);
   if(m.level>=2)this.tail(g,-65,0,91,m.width*.43,alpha*.65);
   if(m.level===4){
    const half=m.width/2;
    g.moveTo(-62,-half).quadraticCurveTo(7,0,-62,half).lineTo(-87,half).quadraticCurveTo(-15,0,-87,-half).closePath().fill({color:WHITE,alpha:alpha*.35}).stroke({color:GOLD,width:1.5,alpha:alpha*.55});
    for(let i=0;i<(count>2?3:6);i++){const y=-half+18+i*(m.width-36)/6,x=-55-22*(y/half)**2;
     g.moveTo(x-18,y+10).lineTo(x-9,y-13).lineTo(x,y+4).lineTo(x+10,y-6).lineTo(x+18,y+10).closePath().fill({color:INK,alpha:alpha*.5});
     g.moveTo(x-16,y+14).quadraticCurveTo(x,y+5,x+20,y+14).stroke({color:GOLD,width:1,alpha:alpha*.7});
    }
   }
   this.blade(g,m.width,c.thickness+12,RED,alpha*.28);this.blade(g,m.width,c.thickness,GOLD,alpha*.7);this.blade(g,m.width-8,Math.max(5,c.thickness*.38),WHITE,alpha);
   for(let i=0;i<(m.level===1?2:4);i++){const y=(i%2?1:-1)*m.width*(.22+i*.05),x=-20-i*12;
    g.moveTo(x,y).quadraticCurveTo(x-40,y+Math.sin(t*14+i)*8,x-80,y*.7).stroke({color:i%2?GOLD:RED,width:1.5,alpha:alpha*.5});
   }g.restore();
  }
  if(m.level>=3)for(const hit of m.contacts){const age=t-hit.at;if(age<.14||age>.75)continue;
   const dx=hit.position.x-s.x,dy=hit.position.y-s.y,x=dx*s.direction.x+dy*s.direction.y,y=-dx*s.direction.y+dy*s.direction.x;
   const a=Math.max(0,1-(age-.14)/.61),pull=Math.min(1,(age-.14)/.3);
   g.moveTo(x-45,y+55*(1-pull)).bezierCurveTo(x+72,y+58,x+56,y-72,x-14,y-4).stroke({color:RED,width:9*(1-pull)+2,alpha:a*.4});
   g.moveTo(x-45,y+55*(1-pull)).bezierCurveTo(x+72,y+58,x+56,y-72,x-14,y-4).stroke({color:WHITE,width:2,alpha:a*.8});
   if(m.level===4&&age>=.42){const stamp=Math.max(0,1-(age-.42)/.3);g.save();g.context.translate(x,y);g.context.rotate(-.12);
    g.roundRect(-18,-27,36,54,4).fill({color:RED,alpha:stamp*.7}).stroke({color:GOLD,width:2,alpha:stamp});
    g.moveTo(-11,-17).lineTo(-5,-4).lineTo(0,-12).lineTo(5,-4).lineTo(11,-17).lineTo(8,10).lineTo(0,19).lineTo(-8,10).closePath().stroke({color:WHITE,width:2,alpha:stamp});
    g.circle(0,0,30+(1-stamp)*38).stroke({color:GOLD,width:2,alpha:stamp*.5});g.restore();
   }
  }
 }
 private blade(g:Graphics,width:number,thickness:number,color:number,alpha:number){
  const half=width/2;g.moveTo(moonFront(-half,width),-half);
  for(let i=1;i<=24;i++){const y=-half+width*i/24;g.lineTo(moonFront(y,width),y);}
  for(let i=24;i>=0;i--){const y=-half+width*i/24,f=Math.sin(Math.PI*i/24);g.lineTo(moonFront(y,width)-thickness*f,y);}
  g.closePath().fill({color,alpha});
 }
 private tail(g:Graphics,x:number,y:number,length:number,width:number,alpha:number){
  g.moveTo(x,y).bezierCurveTo(x+length*.18,y-width,x+length*.74,y-width*1.2,x+length,y-width*.15).bezierCurveTo(x+length*.62,y-width*.7,x+length*.75,y+width*.4,x+length*.25,y+width*.24).quadraticCurveTo(x+length*.4,y+width*.06,x,y).fill({color:WHITE,alpha});
  g.moveTo(x+length*.35,y-width*.15).bezierCurveTo(x+length*.6,y-width*.6,x+length*.8,y-width*.45,x+length,y-width*.15).stroke({color:RED,width:Math.max(3,width*.13),alpha:alpha*.8});
 }
}
