/** Reproducible scenes use the actual model, recognizer, input and renderer. DEV only. */
import type {Game} from '../gameplay/game';
import type {GameView} from '../rendering/view';
import type {InputController} from '../input/controller';
import {resample,type Point,type Rune} from '../input/recognizer';
export function rehearse(scene:string,game:Game,view:GameView,input:InputController){
 const advance=(seconds:number)=>{for(let i=0;i<Math.ceil(seconds*60);i++){game.update(1/60);for(const e of game.drain())view.event(e);input.update(1/60);view.update(game,input,1/60,60);}};
 game.start();game.director.disabled=true;view.begin();advance(1);
 if(scene==='menu'){game.menu();advance(.1);return;}
 game.spawn('ink',{x:547,y:659});game.spawn('ink',{x:507,y:844});game.spawn('crow',{x:180,y:468});game.spawn('oni',{x:198,y:815});
 if(scene==='boss'){const boss=game.spawn('boss',{x:360,y:365})!;boss.hp=540;boss.phase=3;boss.armorPool=0;boss.ai='Telegraph';boss.stateAge=3.8;game.time=148;advance(.02);return;}
 if(scene==='upgrade'){game.pendingLevels=1;game.level=3;game.offer();advance(.02);return;}
 if(scene==='slow'){input.event({x:254,y:511,id:9,kind:'down'});for(const p of resample([{x:254,y:511},{x:476,y:513},{x:280,y:687}]))input.event({...p,id:9,kind:'move'});input.update(1.1);view.update(game,input,0,60,0);return;}
 const polygon=(n:number,step=1)=>resample(Array.from({length:n+1},(_,i)=>({x:360+Math.cos(-Math.PI/2+i*step*Math.PI*2/n)*125,y:637+Math.sin(-Math.PI/2+i*step*Math.PI*2/n)*125})),120);
 const shapes:Record<string,Point[]>={line:resample([{x:218,y:596},{x:518,y:604}]),circle:Array.from({length:88},(_,i)=>({x:360+Math.cos(i/87*Math.PI*2)*137,y:635+Math.sin(i/87*Math.PI*2)*128})),triangle:resample([{x:280,y:735},{x:420,y:590},{x:275,y:500}],120),star:polygon(5,2),z:resample([{x:235,y:494},{x:484,y:501},{x:237,y:710},{x:486,y:718}]),spiral:Array.from({length:160},(_,i)=>{const a=i/159*Math.PI*5,r=8+i/159*117;return {x:360+Math.cos(a)*r,y:635+Math.sin(a)*r};})};
 shapes['star-tilted']=shapes.star.map(p=>({x:360+(p.x-360)*Math.cos(.45)-(p.y-637)*Math.sin(.45),y:637+((p.x-360)*Math.sin(.45)+(p.y-637)*Math.cos(.45))*.9}));
 shapes['circle-tall']=shapes.circle.map(p=>({x:360+(p.x-360)*.67,y:p.y}));
 const combos:Record<string,[import('../gameplay/modifiers').RelicId,string]>={'combo-brush':['brush','star'],'combo-seal':['seal','star'],'combo-mirror':['mirror','line'],'combo-gourd':['gourd','spiral'],'combo-bell':['bell','z']};
 const combo=combos[scene];if(combo)game.modifiers.add(combo[0]);const points=shapes[combo?.[1]??scene];
 if(points){input.event({...points[0],id:9,kind:'down'});for(const p of points)input.event({...p,id:9,kind:'move'});input.event({...points.at(-1)!,id:9,kind:'up'});advance(.22);}
 if(scene==='pause'){game.pause();view.update(game,input,0,60);}
 if(scene==='win'||scene==='victory'){game.bossDead=true;game.time=179.99;game.enemies=[];advance(scene==='victory'?.48:1.7);}
 if(scene==='lose'){game.hurt(999);advance(1.7);}
}
