import {Graphics,GraphicsContext} from 'pixi.js';

type Entry={context:GraphicsContext;value:unknown;used:number;refs:number};
/** Scene-owned cache: identical animated paths share tessellation, never whole effect timelines. */
export class SharedGeometry{
 private entries=new Map<string,Entry>();private bindings=new Map<Graphics,Entry>();private clock=0;
 hits=0;misses=0;
 begin(){this.clock++;for(const [g,e] of this.bindings)if(g.destroyed){e.refs--;this.bindings.delete(g);}this.trim();}
 private trim(){if(this.entries.size<=1024)return;for(const [key,e] of this.entries){if(e.refs===0&&this.clock-e.used>1){e.context.destroy();this.entries.delete(key);if(this.entries.size<=768)break;}}}
 draw<T>(g:Graphics,key:string,build:()=>T):T{
  let e=this.entries.get(key);const previous=this.bindings.get(g);
  const original=!previous?g.context:undefined;
  if(!e){const context=new GraphicsContext();g.context=context;const value=build();e={context,value,used:this.clock,refs:0};this.entries.set(key,e);this.misses++;}else{g.context=e.context;e.used=this.clock;this.hits++;}
  original?.destroy();
  if(previous!==e){if(previous)previous.refs--;e.refs++;this.bindings.set(g,e);}return e.value as T;
 }
 clear(){for(const e of this.entries.values())e.context.destroy();this.entries.clear();this.bindings.clear();this.hits=this.misses=0;}
 get size(){return this.entries.size;}
}
let active:SharedGeometry|undefined;
export function withSharedGeometry<T>(cache:SharedGeometry|undefined,run:()=>T){const previous=active;active=cache;try{return run();}finally{active=previous;}}
export function geometry<T>(g:Graphics,key:string,build:()=>T):T{return active?active.draw(g,key,build):build();}
export const geometryTime=(t:number)=>t.toFixed(6);
