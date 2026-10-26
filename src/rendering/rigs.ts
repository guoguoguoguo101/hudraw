import {enemyScale} from './appearance';
import {PaperMonsterRig} from './paper-monsters';
import {PAPER_MONSTERS} from '../gameplay/paper-monsters';
import {Container,Sprite,Texture} from 'pixi.js';
import type {Enemy} from '../core/types';
export type Art=Record<string,Texture>;
export function sprite(art:Art,name:string,parent:Container,x=0,y=0,scale=1){const s=new Sprite(art[name]);s.anchor.set(.5);s.position.set(x,y);s.scale.set(scale);parent.addChild(s);return s;}
export {FoxRig} from './fox-rig';
export class EnemyRig{
 root=new Container();body:Sprite;wings:Sprite[]=[];private paper?:PaperMonsterRig;
 constructor(public kind:Enemy['kind'],art:Art,public look?:Enemy['look']){if(kind==='crow'&&!look){this.wings.push(sprite(art,'crow_wing',this.root,-20,-14,.8),sprite(art,'crow_wing',this.root,20,-14,.8));this.wings[1].scale.x=-.8;}this.body=sprite(art,(kind==='boss'?'oni':kind)+'_body',this.root);this.root.scale.set(enemyScale(kind));if(look){this.body.visible=false;this.paper=new PaperMonsterRig(look);this.root.addChild(this.paper.root);this.root.scale.set(PAPER_MONSTERS.find(m=>m.id===look)!.scale);}}
 update(e:Enemy,time:number,alpha=1,showLabel=false){this.root.position.set(e.prevX+(e.x-e.prevX)*alpha,e.prevY+(e.y-e.prevY)*alpha+Math.sin(e.age*(e.kind==='crow'?8:4)+e.id)*4);if(this.paper){this.paper.update(e,showLabel);this.root.rotation=0;return;}this.body.rotation=Math.sin(time*3+e.id)*.06;this.body.scale.set(1+Math.sin(time*3+e.id)*.025,1-Math.sin(time*3+e.id)*.025);this.body.tint=e.hit>0?0xffeed1:0xffffff;for(let i=0;i<this.wings.length;i++)this.wings[i].rotation=(i===0?1:-1)*(.1+Math.sin(time*15+e.id)*.52);this.root.rotation=e.hit>0?Math.sin(e.hit*50)*.10:0;}
}
