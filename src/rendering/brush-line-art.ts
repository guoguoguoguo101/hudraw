import {Graphics,GraphicsContext} from 'pixi.js';

export const LINE_PAPER={ink:0x172c30,shade:0x5e302b,red:0xb64a34,fold:0xd37549,gold:0xd8ad64,ivory:0xffefd0};
const contexts=new Map<string,GraphicsContext>();
function shared(key:string,draw:(g:Graphics)=>void){let c=contexts.get(key);if(!c){c=new GraphicsContext();c.batchMode='batch';const g=new Graphics(c);draw(g);g.destroy();contexts.set(key,c);}return new Graphics(c);}

/** Folded cinnabar blade, normalized to 100 × 100. Scaling changes the silhouette,
 * while the narrow paper cuts and the asymmetric fold travel with the same edge. */
export function paperBlade(){return shared('blade',g=>{
 const c=LINE_PAPER;
 g.poly([0,0,11,-8,25,-28,40,-22,60,-38,75,-14,100,0,72,12,49,28,26,18,11,7]).fill({color:c.ink,alpha:.76});
 g.poly([0,0,14,-5,28,-23,42,-18,61,-30,78,-10,100,0,69,9,48,21,25,13,10,5]).fill(c.shade);
 g.poly([5,0,29,-18,43,-13,61,-25,80,-8,100,0,67,5,45,12,26,8]).fill(c.red);
 g.poly([13,-2,30,-16,43,-12,61,-23,79,-7,96,-1,78,-5,61,-19,43,-9,31,-12]).fill({color:c.gold,alpha:.85});
 g.poly([3,0,29,-2.5,52,-2,76,-1.3,100,0,74,1,48,1.4,27,1.5]).fill(c.ivory);
 g.poly([22,5,44,8,64,2,49,12,27,9]).fill({color:c.fold,alpha:.66});
 g.poly([26,-7,43,-10,58,-6,44,-7]).fill({color:c.ivory,alpha:.32});
 });}

export function paperSpark(){return shared('spark',g=>{
 const c=LINE_PAPER;
 g.poly([0,-1,.07,-.13,1,0,.13,.07,0,1,-.07,.13,-1,0,-.13,-.07]).fill(c.ivory);
 g.poly([0,-.43,.12,0,0,.43,-.12,0]).fill(c.gold);
 });}

export function cornerSeal(){return shared('corner',g=>{
 const c=LINE_PAPER;
 g.poly([0,-10,7,-5,6,5,0,10,-6,5,-7,-5]).fill(c.shade);
 g.poly([0,-8,5,-4,4,4,0,7,-4,4,-5,-4]).fill(c.red);
 g.moveTo(-2,-4).lineTo(2,-4).lineTo(0,0).lineTo(2,3).moveTo(-3,1).lineTo(3,1).stroke({color:c.ivory,width:.85,alpha:.9});
 g.poly([0,-10,7,-5,6,5,0,10,-6,5,-7,-5]).stroke({color:c.gold,width:.7,alpha:.7});
 });}

export function paperChip(index:number){return shared('chip-'+index%3,g=>{
 const c=LINE_PAPER,shape=index%3===0?[-1,-3,1,-1,1,3,-1,1]:[-2,0,0,-2,2,0,0,1];
 g.poly(shape).fill(index%3===0?c.ivory:index%3===1?c.fold:c.gold);
 });}
