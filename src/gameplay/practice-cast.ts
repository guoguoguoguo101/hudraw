import {glyphSample,sancaiSample} from '../input/glyph-samples';
import {WORLD} from '../core/types';
import {recognize,resample} from '../input/recognizer';
import type {ActiveRune} from './skill-levels';
import type {Game} from './game';

/** Use a complete glyph so auto-cast has the same geometry as a hand-drawn skill. */
export function castPracticeRune(game:Game,rune:ActiveRune,form:'small'|'large'='small'){
 if(!game.practice||!game.active)return false;
 if(game.interactionPractice&&(rune==='triangle'||rune==='sancai'))game.interactionTriangle=rune;
 const angle=rune==='sancai'?0:game.random()*Math.PI*2;
 const base=rune==='sancai'?sancaiSample(form):glyphSample(rune);
 const rotation=angle;
 const points=base.map(p=>({x:WORLD.foxX+p.x*Math.cos(rotation)-p.y*Math.sin(rotation),y:WORLD.foxY+p.x*Math.sin(rotation)+p.y*Math.cos(rotation)}));
 const recognition=recognize(points);
 recognition.direction={x:Math.cos(angle),y:Math.sin(angle)};
 return recognition.valid&&recognition.rune===rune&&game.cast(recognition);
}
