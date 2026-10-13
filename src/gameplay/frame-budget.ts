/** Drop long stalled-frame debt instead of doing hundreds of combat steps at once. */
export function frameDelta(seconds:number){return Number.isFinite(seconds)?Math.max(0,Math.min(.1,seconds)):0;}
