import {WORLD} from '../core/types';
import {recognize,resample} from '../input/recognizer';
import type {ActiveRune} from './skill-levels';
import type {Game} from './game';

/** Use a complete glyph so auto-cast has the same geometry as a hand-drawn skill. */
export function castPracticeRune(game:Game,rune:ActiveRune){
 if(!game.practice||!game.active)return false;
 const angle=game.random()*Math.PI*2;
 const base=rune==='circle'?Array.from({length:100},(_,i)=>({x:Math.cos(i/99*Math.PI*2)*120,y:Math.sin(i/99*Math.PI*2)*120})):
  rune==='triangle'?resample([{x:-90,y:-100},{x:100,y:0},{x:-90,y:100}],100):
  rune==='z'?resample([{x:-110,y:-100},{x:110,y:-100},{x:-110,y:100},{x:110,y:100}],100):
  resample([{x:-140,y:0},{x:140,y:0}],100);
 const rotation=rune==='z'?angle-Math.atan2(200,220):angle;
 const points=base.map(p=>({x:WORLD.foxX+p.x*Math.cos(rotation)-p.y*Math.sin(rotation),y:WORLD.foxY+p.x*Math.sin(rotation)+p.y*Math.cos(rotation)}));
 const recognition=recognize(points);
 recognition.direction={x:Math.cos(angle),y:Math.sin(angle)};
 return recognition.valid&&recognition.rune===rune&&game.cast(recognition);
}
