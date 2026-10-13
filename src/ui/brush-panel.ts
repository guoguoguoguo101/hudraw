import {Container,Graphics,Text} from 'pixi.js';
import {text} from './interface';
import {BRUSH_SKINS,type BrushSettings,type PenParams} from '../input/brush-settings';
import {drawBrushPortrait,drawNib} from '../rendering/spirit-pen';
import type {InputEvent} from '../platform/adapter';
import type {InputController} from '../input/controller';
type Zone={x:number;y:number;w:number;h:number;run:()=>void};
type Param=[keyof PenParams,string,number,number,number];
const GROUPS:{name:string;fields:Param[]}[]=[
 {name:'笔迹',fields:[['cursorSize','笔锋大小',10,32,2],['offsetY','笔锋上移',-32,0,2],['strokeWidth','笔迹宽度',2,14,1],['brightness','笔迹亮度',.2,1,.1],['trailTime','亮拖尾秒',.06,.4,.02],['oldAlpha','旧迹浓度',.05,.5,.05],['particles','流光数量',0,10,1]]},
 {name:'起收',fields:[['startSize','起笔涟漪',8,40,2],['startDuration','起笔秒',.08,.3,.02],['endGlow','成符凝亮',0,1,.1],['fadeTime','成符原迹退场秒',.08,.15,.01]]},
 {name:'配色',fields:[]}
];
const PAPER=0xfff3dc,GOLD=0xe7ba68,INK=0x192027;
export class BrushPanel{
 root=new Container();private zones:Zone[]=[];private mode:'collection'|'tuning'='collection';private tab=0;private status:Text|null=null;private shade=new Graphics();private top=0;private height=1280;private summary='调整后收起面板，在画境中试画';
 constructor(public pen:BrushSettings,private cancel:()=>void){this.root.visible=false;}
 get visible(){return this.root.visible;}
 open(mode:'collection'|'tuning'){this.cancel();this.mode=mode;this.root.visible=true;this.render();}
 close(){this.root.visible=false;}
 resize(top:number,height:number){if(this.top===top&&this.height===height)return;this.top=top;this.height=height;this.shade.clear().rect(0,top,720,height).fill({color:INK,alpha:.88});}
 handle(e:InputEvent){if(!this.visible)return false;if(e.kind==='down'){const zone=[...this.zones].reverse().find(z=>e.x>=z.x&&e.x<=z.x+z.w&&e.y>=z.y&&e.y<=z.y+z.h);zone?.run();}return true;}
 update(input:InputController){if(input.last)this.summary=`上次：${input.last.reason}${input.timedOut?' · 3秒自动收笔':''}`;if(this.status&&this.visible)this.status.text=this.summary;}
 private button(label:string,x:number,y:number,w:number,h:number,run:()=>void,active=false){this.root.addChild(new Graphics().roundRect(x,y,w,h,10).fill({color:active?0x71372e:0x29343b}).stroke({color:GOLD,width:1,alpha:active?.9:.4}));text(this.root,label,x+w/2,y+h/2,18,PAPER,{letterSpacing:0});this.zones.push({x,y,w,h,run});}
 private render(){this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.zones=[];this.status=null;
  this.shade=new Graphics().rect(0,this.top,720,this.height).fill({color:INK,alpha:.88});this.root.addChild(this.shade,new Graphics().roundRect(24,185,672,978,22).fill({color:0x14232a,alpha:.98}).stroke({color:GOLD,width:1.5}));
  text(this.root,this.mode==='collection'?'灵笔收藏':'灵笔 · 特效调节',360,223,32,PAPER);
  text(this.root,'四笔共用符术 · 外观不改变战斗能力',360,264,17,GOLD,{letterSpacing:0});
  this.button('收起',586,200,86,42,()=>this.close());
  if(this.mode==='collection'){
   BRUSH_SKINS.forEach((s,i)=>{const x=48+i%2*316,y=300+Math.floor(i/2)*407;const selected=this.pen.id===s.id;
    this.root.addChild(new Graphics().roundRect(x,y,308,395,14).fill({color:0xf3e7cb}).stroke({color:selected?0xb84034:GOLD,width:selected?3:1}));
    text(this.root,s.name,x+154,y+28,27,INK);const pen={...this.pen.snapshot(),id:s.id,body:s.body,core:s.core,gold:s.gold};drawBrushPortrait(this.root,pen,x+147,y+178,.65);
    text(this.root,s.detail,x+154,y+318,16,0x562a34,{letterSpacing:0});this.button(selected?'正在使用':'选用此笔',x+48,y+345,212,36,()=>{this.pen.select(s.id);this.render();},selected);
   });
   text(this.root,'完整灵笔用于收藏 · 战斗中显示小型笔锋',360,1140,16,GOLD,{letterSpacing:0});return;
  }
  BRUSH_SKINS.forEach((s,i)=>this.button(s.name,48+i*158,300,148,40,()=>{this.pen.select(s.id);this.render();},this.pen.id===s.id));
  GROUPS.forEach((group,i)=>this.button(group.name,48+i*210,357,202,36,()=>{this.tab=i;this.render();},this.tab===i));
  const pen=this.pen.snapshot(),nib=new Graphics();drawNib(nib,pen);nib.position.set(644,446);nib.scale.set(1.1);this.root.addChild(nib);
  text(this.root,GROUPS[this.tab].name+'参数 · 下一笔生效',320,430,23,PAPER,{letterSpacing:0});
  GROUPS[this.tab].fields.forEach(([key,label,min,max,step],i)=>{const y=475+i*64;
   text(this.root,label,75,y+20,19,PAPER,{align:'left',letterSpacing:0}).anchor.set(0,.5);
   const change=(d:number)=>{this.pen.params[key]=Math.round(Math.max(min,Math.min(max,this.pen.params[key]+d))*1000)/1000;this.render();};
   this.button('−',438,y,50,42,()=>change(-step));text(this.root,String(this.pen.params[key]),544,y+21,22,GOLD,{letterSpacing:0});this.button('+',598,y,50,42,()=>change(step));
  });
  if(this.tab===2){const colors=[0xd84332,0xea5536,0xe7ba68,0xfff3dc,0x29343b,0xc79a59,0xffd887,0xf2e7ce];
   (['body','gold','core'] as const).forEach((key,i)=>{const y=487+i*110;text(this.root,['主体颜色','细线颜色','亮芯颜色'][i],180,y,21,PAPER);colors.forEach((color,j)=>{const x=74+j*73,yy=y+27;this.root.addChild(new Graphics().roundRect(x,yy,56,42,6).fill({color}).stroke({color:pen[key]===color?0xffffff:GOLD,width:pen[key]===color?3:1}));this.zones.push({x,y:yy,w:56,h:42,run:()=>{this.pen.colors={body:pen.body,gold:pen.gold,core:pen.core,[key]:color};this.render();}});});});
  }
  this.button('恢复默认参数',354,976,290,42,()=>{this.pen.reset();this.render();});
  this.status=text(this.root,'',360,1053,17,GOLD,{letterSpacing:0,lineHeight:25,wordWrap:true,wordWrapWidth:594});
  text(this.root,'未成符只消散 · 不产生狐火或攻击',360,1126,16,PAPER,{letterSpacing:0});
 }
}
