import {Graphics} from 'pixi.js';
const WHITE=0xfff4dc,GOLD=0xffcf75,RED=0xe93e29;
/** Angular shrine guardian, with a long muzzle and swept cheek fur. */
export function drawGuardianFox(g:Graphics){
 g.moveTo(-34,-47).bezierCurveTo(-70,-6,-49,35,-33,62).lineTo(-12,77).lineTo(-15,34).lineTo(0,55).lineTo(15,34).lineTo(12,77).lineTo(33,62).bezierCurveTo(49,35,70,-6,34,-47).closePath().fill({color:WHITE,alpha:.85}).stroke({color:GOLD,width:2});
 for(const sign of [-1,1]){
  g.moveTo(sign*31,-11).quadraticCurveTo(sign*65,18,sign*56,45).lineTo(sign*40,48).lineTo(sign*44,29).lineTo(sign*21,6).closePath().fill({color:WHITE,alpha:.92});
  g.moveTo(sign*28,-114).bezierCurveTo(sign*40,-140,sign*58,-154,sign*68,-196).bezierCurveTo(sign*29,-179,sign*13,-151,sign*14,-129).closePath().fill({color:WHITE}).stroke({color:GOLD,width:2});
  g.poly([sign*54,-174,sign*36,-132,sign*24,-135]).fill({color:RED,alpha:.82});
 }
 g.moveTo(0,-146).quadraticCurveTo(-32,-147,-42,-119).lineTo(-63,-105).lineTo(-45,-108).lineTo(-70,-88).lineTo(-44,-92).lineTo(-58,-72).lineTo(-34,-77).quadraticCurveTo(-22,-51,0,-33).quadraticCurveTo(22,-51,34,-77).lineTo(58,-72).lineTo(44,-92).lineTo(70,-88).lineTo(45,-108).lineTo(63,-105).quadraticCurveTo(34,-136,0,-146).closePath().fill({color:WHITE}).stroke({color:GOLD,width:2});
 for(const sign of [-1,1]){
  g.poly([sign*37,-112,sign*9,-93,sign*30,-99]).fill({color:RED});
  g.moveTo(sign*34,-108).lineTo(sign*18,-98).stroke({color:WHITE,width:1.5});
  g.poly([sign*37,-91,sign*20,-80,sign*33,-82,sign*27,-70,sign*44,-86]).fill({color:RED,alpha:.86});
  g.moveTo(sign*10,-81).lineTo(sign*6,-62).stroke({color:GOLD,width:1.2,alpha:.6});
 }
 g.poly([0,-139,9,-121,0,-104,-9,-121]).fill({color:RED});g.poly([0,-129,3,-121,0,-114,-3,-121]).fill({color:WHITE});
 g.poly([-6,-58,6,-58,0,-51]).fill({color:RED});g.moveTo(0,-51).lineTo(0,-46).stroke({color:RED,width:1.5});
 g.moveTo(-24,-20).lineTo(-13,0).lineTo(-8,-7).lineTo(0,20).lineTo(8,-7).lineTo(13,0).lineTo(24,-20).stroke({color:GOLD,width:1.2,alpha:.7});
 g.moveTo(-28,-29).quadraticCurveTo(0,-16,28,-29).lineTo(25,-19).quadraticCurveTo(0,-8,-25,-19).closePath().fill({color:RED});g.circle(0,-4,9).fill({color:GOLD}).stroke({color:WHITE,width:1.5});g.moveTo(0,-8).lineTo(0,-2).stroke({color:RED,width:1.5});
}
