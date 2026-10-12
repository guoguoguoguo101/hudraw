import type {Point} from './recognizer';
/** CSS pixels → fixed 720×1280 world. Independent of DOM and device pixel ratio. */
export function worldPoint(p:Point,rect:{x:number;y:number;width:number;height:number}):Point{return {x:(p.x-rect.x)*720/rect.width,y:(p.y-rect.y)*1280/rect.height};}
