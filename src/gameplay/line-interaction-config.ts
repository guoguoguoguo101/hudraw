/** Prototype values; legacy slash configuration is deliberately untouched. World units. */
export const LINE_INTERACTION = {
 lifetime:3,fade:.5,capacity:6,minAngle:20*Math.PI/180,endpointTolerance:8,
 traceOpacity:.16,tracePulseOpacity:.10,traceWidth:1.2,
 minArea:3000,minSide:40,maxCrosses:3,
 crossDamage:.4,crossRadius:60,crossDuration:.48,crossHitAt:.05,crossReach:185,
 triangleDamage:1.2,triangleDuration:2.2,triangleHoldUntil:2.2,triangleHitAt:1.6,
 triangleCutAt:.7,triangleCutShare:.4,triangleRotation:Math.PI/8,
 triangleParticleMin:18,triangleParticleMax:60,triangleParticleFullArea:70000,
 fragmentBudget:192,
 refractionDuration:.55,refractionHitAt:.10,refractionDamage:.5,refractionWidthScale:.65,
 maxEffects:24,
} as const;
/** Cosmetic fragments only: area affects visual abundance, never damage or hit radius. */
export function triangleParticleCount(area:number,low=false){
 const c=LINE_INTERACTION,u=Math.max(0,Math.min(1,(area-c.minArea)/(c.triangleParticleFullArea-c.minArea)));
 const count=Math.round(c.triangleParticleMin+(c.triangleParticleMax-c.triangleParticleMin)*u);
 return low?Math.ceil(count*.5):count;
}
