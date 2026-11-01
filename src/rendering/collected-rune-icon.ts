import type {Graphics} from 'pixi.js';
import type {CollectedRune} from '../gameplay/collected-talismans';
import {inkButterflyEmblem} from './ink-butterfly-art';
import {thunderBrushEmblem} from './thunder-brush';
import {crescentEmblem} from './crescent-art';
/** One silhouette for the ground pickup and its owned card. */
export function collectedRuneIcon(g:Graphics,kind:CollectedRune){
 const red=0x9d4233,gold=0xc69f5c;
 if(kind==='flower'){inkButterflyEmblem(g);return;}
 if(kind==='thunder'){thunderBrushEmblem(g,red,gold);return;}
 if(kind==='crescent'){crescentEmblem(g);return;}
 if(kind==='storm'){g.poly([5,-20,-10,1,1,1,-5,19,11,-5,0,-5]).fill(red);return;}
 if(kind==='heal'){g.moveTo(-15,-11).lineTo(15,-11).lineTo(15,11).lineTo(-15,11).closePath().stroke({color:red,width:2});g.moveTo(0,-19).lineTo(0,19).moveTo(-7,0).lineTo(7,0).stroke({color:red,width:5});return;}
 if(kind==='dragon'){g.poly([-22,-16,-6,-8,0,-23,6,-8,22,-16,13,6,0,21,-13,6]).fill(red).stroke({color:gold,width:1});g.circle(-6,-2,2).fill(0xffefd0).circle(6,-2,2).fill(0xffefd0);return;}
 if(kind==='beast'){g.poly([-19,-20,-7,-13,7,-13,19,-20,20,10,0,23,-20,10]).fill(red);g.moveTo(-11,-3).lineTo(-4,0).moveTo(4,0).lineTo(11,-3).moveTo(0,-12).lineTo(0,-3).stroke({color:0xffefd0,width:2});return;}
 if(kind==='crab'){g.ellipse(0,4,15,12).fill(red);for(const side of [-1,1]){g.moveTo(side*12,0).lineTo(side*24,-16).lineTo(side*13,-12).stroke({color:red,width:4});for(let j=0;j<3;j++)g.moveTo(side*10,2+j*5).lineTo(side*23,6+j*6).stroke({color:red,width:2});}return;}
 g.circle(0,0,18).stroke({color:red,width:2.5}).circle(0,0,12).stroke({color:gold,width:1.5});
 if(kind==='pulse')g.poly([0,-23,5,-5,23,0,5,5,0,23,-5,5,-23,0,-5,-5]).fill(red);
}
