import type {Point} from '../input/recognizer';
import type {Triangle} from '../input/line-interaction-geometry';
import {LINE_INTERACTION as C} from './line-interaction-config';
/** Shared by the visible turning frame and its experimental mirrors. Never mutates the damage area. */
export function triangleWindowFrame(vertices:Triangle,center:Point,age:number):Triangle{
 const angle=C.triangleRotation*Math.max(0,Math.min(1,age/C.triangleHoldUntil)),cos=Math.cos(angle),sin=Math.sin(angle);
 return vertices.map(q=>({x:center.x+(q.x-center.x)*cos-(q.y-center.y)*sin,y:center.y+(q.x-center.x)*sin+(q.y-center.y)*cos})) as Triangle;
}
