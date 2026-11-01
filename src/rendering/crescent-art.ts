import type {Graphics} from 'pixi.js';

/** A small stamped version of the plump fox moon, shared by cards and dropped charms. */
export function drawCrescentSpirit(g:Graphics){
 g.moveTo(22,-43).bezierCurveTo(-17,-51,-48,-24,-45,9).bezierCurveTo(-42,43,7,58,44,22).bezierCurveTo(4,41,-21,12,-21,-8).bezierCurveTo(-19,-27,5,-39,22,-43).closePath().fill(0x202b29);
 g.moveTo(22,-43).bezierCurveTo(-9,-48,-38,-21,-35,7).bezierCurveTo(-31,36,12,48,44,22).bezierCurveTo(7,31,-8,0,-4,-15).bezierCurveTo(0,-29,9,-37,22,-43).closePath().fill(0xffeac0);
 g.moveTo(-34,2).bezierCurveTo(-31,24,-10,40,15,37).bezierCurveTo(-1,36,-9,26,-13,17).bezierCurveTo(-28,14,-22,-4,-25,-14).bezierCurveTo(-37,-2,-31,10,-34,2).closePath().fill(0xd95a3c);
 g.moveTo(-13,-13).quadraticCurveTo(-4,-25,10,-24).quadraticCurveTo(12,-13,7,-6).closePath().fill(0xc84732);
 g.poly([-6,-15,5,-21,4,-9]).fill(0xf4aa73);
 g.moveTo(-24,-22).bezierCurveTo(-11,-39,1,-41,11,-41).stroke({color:0xfff7db,width:3,alpha:.85,cap:'round'});
 g.moveTo(-3,11).quadraticCurveTo(0,18,5,13).moveTo(13,20).quadraticCurveTo(16,26,20,21).stroke({color:0x302b27,width:2.8,cap:'round'});
 g.ellipse(-2,22,4,2.8).ellipse(23,28,4,2.8).fill({color:0xee9a72,alpha:.8});
 g.moveTo(7,23).quadraticCurveTo(8,28,11,26).quadraticCurveTo(14,30,15,26).stroke({color:0x5d392c,width:1.7,cap:'round'});
}
export function crescentEmblem(g:Graphics){g.save().transform(.54,0,0,.54,0,0);drawCrescentSpirit(g);g.restore();}
