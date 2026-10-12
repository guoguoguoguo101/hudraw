import presets from '../../assets/vfx/slash_upgrade/ultimate_config.json';
export type UltimateVariant='A'|'B';
export type UltimateParams={visualWaveWidth?:number;wavePatternOpacity?:number;waveCloudStrength?:number;visualScrollLength?:number;visualScrollWidth?:number;visualOpenDuration?:number;visualHoldDuration?:number;visualFadeDuration?:number;scrollLength:number;scrollWidth:number;scrollOpenAt:number;scrollOpenDuration:number;scrollHoldUntil:number;fadeOutDuration:number;slashStartWidth:number;slashMidWidth:number;slashEndWidth:number;scrollPatternOpacity:number;scrollPatternDensity:number;crescentArcScale:number;smokeAmount:number;slashWidth:number;slashLength:number;coreBrightness:number;outerGlow:number;paperCount:number;paperScatter:number;burstCount:number;hitStop:number;knockbackForce:number;trailDuration:number;secondaryRadius:number;secondaryDamage:number};
export const ULTIMATE_PRESETS:Record<UltimateVariant,UltimateParams>=presets;
export let ultimateVariant:UltimateVariant='B';
export let ultimateParams:UltimateParams={...ULTIMATE_PRESETS.B};
export function selectUltimate(variant:UltimateVariant){ultimateVariant=variant;ultimateParams={...ULTIMATE_PRESETS[variant]};}
/** Full parchment width; expansion is smooth and its tip closes only at the end. */
export function scrollWidth(p:UltimateParams,f:number){
 const smooth=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 const width=f<.48?p.slashStartWidth+(p.slashMidWidth-p.slashStartWidth)*smooth(f/.48):p.slashMidWidth+(p.slashEndWidth-p.slashMidWidth)*smooth((f-.48)/.34);
 return width*(f>.86?1-smooth((f-.86)/.14):1)*p.slashWidth/200;
}

export function visualEnd(p:UltimateParams){return p.scrollOpenAt+(p.visualOpenDuration??p.scrollOpenDuration)+(p.visualHoldDuration??.2)+(p.visualFadeDuration??p.fadeOutDuration);}
export function ultimateTiming(p:UltimateParams,t:number){const open=p.visualOpenDuration??p.scrollOpenDuration,fade=p.visualFadeDuration??p.fadeOutDuration;return {waveProgress:Math.max(0,Math.min(1,(t-.08)/.10)),scrollProgress:Math.max(0,Math.min(1,(t-p.scrollOpenAt)/open)),waveAlpha:Math.max(0,Math.min(1,(visualEnd(p)-t)/fade)),scrollAlpha:Math.max(0,Math.min(1,(visualEnd(p)-t)/fade))};}
