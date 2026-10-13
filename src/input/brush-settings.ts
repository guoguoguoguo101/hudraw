export const BRUSH_SKINS=[
 {id:'cinnabar',name:'朱砂灵笔',body:0xd84332,core:0xfff3dc,gold:0xe7ba68,detail:'朱砂为墨 · 符纸随行'},
 {id:'fox',name:'狐火灵笔',body:0xea5536,core:0xfff5df,gold:0xf6cb78,detail:'狐火环绕 · 灵焰流转'},
 {id:'gold',name:'金纹御笔',body:0xc79445,core:0xfff6e1,gold:0xffd887,detail:'白金流光 · 御纹收束'},
 {id:'mountain',name:'山海墨笔',body:0x29343b,core:0xf2e7ce,gold:0xc79a59,detail:'山海入墨 · 云纹随笔'}
] as const;
export type BrushId=typeof BRUSH_SKINS[number]['id'];
export const PEN_DEFAULTS={cursorSize:18,offsetY:-14,strokeWidth:4,brightness:.85,trailTime:.16,oldAlpha:.5,particles:0,startSize:16,startDuration:.12,endGlow:.65,fadeTime:.1};
export const FAILED_STROKE={fadeDuration:.12};
export type PenParams=typeof PEN_DEFAULTS;
export type PenSnapshot={id:BrushId;body:number;core:number;gold:number;params:PenParams};
/** Cosmetic settings are separate from the combat relic named 朱砂灵笔. */
export class BrushSettings{
 id:BrushId='cinnabar';params={...PEN_DEFAULTS};colors:{body:number;core:number;gold:number}|null=null;
 onSelect?: (id:BrushId)=>void;
 get skin(){return BRUSH_SKINS.find(s=>s.id===this.id)??BRUSH_SKINS[0];}
 select(id:string){const skin=BRUSH_SKINS.find(s=>s.id===id);if(!skin)return;this.id=skin.id;this.colors=null;this.onSelect?.(this.id);}
 reset(){this.params={...PEN_DEFAULTS};this.colors=null;}
 snapshot():PenSnapshot{const s=this.skin;return {id:s.id,body:this.colors?.body??s.body,core:this.colors?.core??s.core,gold:this.colors?.gold??s.gold,params:{...this.params}};}
}
export const GESTURE_INPUT={minDistance:50,resamplePoints:64,maxSamples:400,sampleDistance:2.5,battleWidth:720};
