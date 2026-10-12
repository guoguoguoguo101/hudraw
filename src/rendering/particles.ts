import {Container,Sprite} from 'pixi.js';
import {sprite,type Art} from './rigs';
type Particle={sprite:Sprite;active:boolean;x:number;y:number;vx:number;vy:number;life:number;duration:number;spin:number;scale:number;gravity:number};
export class ParticlePool{
 root=new Container();items:Particle[]=[];cursor=0;quality='high';
 constructor(private art:Art,capacity=192){for(let i=0;i<capacity;i++){const s=sprite(art,'paper_shard',this.root);s.visible=false;this.items.push({sprite:s,active:false,x:0,y:0,vx:0,vy:0,life:0,duration:0,spin:0,scale:0,gravity:0});}}
 burst(x:number,y:number,count:number,col=0xe7ba68,power=160,texture='paper_shard'){if(this.quality==='low')count=Math.ceil(count*.5);for(let i=0;i<count;i++){const p=this.items[this.cursor++%this.items.length],angle=i/count*Math.PI*2+Math.random()*.4,speed=power*(.45+Math.random()*.7);Object.assign(p,{active:true,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-30,life:0,duration:.45+Math.random()*.6,spin:Math.random()*8-4,scale:.12+Math.random()*.18,gravity:110});p.sprite.texture=this.art[texture];p.sprite.tint=col;p.sprite.visible=true;p.sprite.rotation=Math.random()*Math.PI;p.sprite.position.set(x,y);}}
 update(dt:number){for(const p of this.items){if(!p.active)continue;p.life+=dt;if(p.life>=p.duration){p.active=false;p.sprite.visible=false;continue;}p.vx*=Math.exp(-dt*.5);p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.sprite.position.set(p.x,p.y);p.sprite.rotation+=p.spin*dt;p.sprite.scale.set(p.scale*(1-p.life/p.duration*.6));p.sprite.alpha=(1-p.life/p.duration)**.7;}}
 clear(){for(const p of this.items){p.active=false;p.sprite.visible=false;}}
}
