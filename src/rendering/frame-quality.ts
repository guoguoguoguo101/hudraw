/** Quality follows the player's explicit choice; frame timings never change it. */
export function renderQuality(low:boolean,device:number){
 return{low,particles:low?'low':'high',resolution:low?1:Math.max(.5,Math.min(device,1.5))};
}
export const combatFrameRate=(combat:boolean)=>combat?60:30;
