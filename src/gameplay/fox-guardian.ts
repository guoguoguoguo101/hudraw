import type {Skill} from '../core/types';
import type {Game} from './game';
export const saturate=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const u=saturate(v);return u*u*(3-2*u);};
export type FoxGuardianConfig={foxScale:number;orbitRadius:number;scrollWidth:number;paperCount:number;patternOpacity:number;cameraStrength:number;phaseDurations:[number,number,number,number,number];fadeDuration:number;shield:number;shieldDuration:number;releaseRadius:number};
export const FOX_GUARDIAN_DEFAULTS:FoxGuardianConfig={foxScale:1.48,orbitRadius:145,scrollWidth:1,paperCount:10,patternOpacity:.72,cameraStrength:1,phaseDurations:[.3,.5,.6,.6,.4],fadeDuration:.6,shield:80,shieldDuration:4,releaseRadius:320};
export function guardianConfig(s:Skill){return s.arrows?.guardian??FOX_GUARDIAN_DEFAULTS;}
export function playFoxGuardianSkill(s:Skill,options:Partial<FoxGuardianConfig>={}){
 const config={...FOX_GUARDIAN_DEFAULTS,...options,phaseDurations:[...(options.phaseDurations??FOX_GUARDIAN_DEFAULTS.phaseDurations)] as FoxGuardianConfig['phaseDurations']};
 config.phaseDurations=config.phaseDurations.map(v=>Math.max(.05,v)) as FoxGuardianConfig['phaseDurations'];
 config.paperCount=Math.max(0,Math.min(18,Math.round(config.paperCount)));config.foxScale=Math.max(.8,Math.min(1.8,config.foxScale));config.orbitRadius=Math.max(60,Math.min(185,config.orbitRadius));config.scrollWidth=Math.max(.5,Math.min(1.5,config.scrollWidth));config.cameraStrength=saturate(config.cameraStrength);config.patternOpacity=saturate(config.patternOpacity);config.fadeDuration=Math.max(.1,config.fadeDuration);
 if(s.arrows)s.arrows.guardian=config;s.duration=config.phaseDurations.reduce((a,b)=>a+b,0)+config.fadeDuration;return config;
}
export function guardianTimeline(t:number,cfg=FOX_GUARDIAN_DEFAULTS){
 const boundaries=[0];for(const d of cfg.phaseDurations)boundaries.push(boundaries.at(-1)!+d);
 const next=boundaries.findIndex((end,i)=>i>0&&t<end),phase=next<0?5:next-1;
 const name=['ritual','emerge','orbit','vestment','heroHold','fade'][phase];
 return {phase,name,progress:saturate((t-boundaries[phase])/(phase===5?cfg.fadeDuration:cfg.phaseDurations[phase])),ritual:smooth(t/cfg.phaseDurations[0]),emerge:smooth((t-boundaries[1])/cfg.phaseDurations[1]),orbit:smooth((t-boundaries[2])/cfg.phaseDurations[2]),vestment:smooth((t-boundaries[3])/cfg.phaseDurations[3]),hold:saturate((t-boundaries[4])/cfg.phaseDurations[4]),opacity:1-smooth((t-boundaries[5])/cfg.fadeDuration),releaseAt:boundaries[5]};
}
export function guardianPose(t:number,cfg=FOX_GUARDIAN_DEFAULTS){
 const state=guardianTimeline(t,cfg),u=state.emerge,a=-Math.PI*.8+state.orbit*Math.PI*2;
 const emerging={x:-55+(Math.cos(-Math.PI*.8)*cfg.orbitRadius+55)*u,y:45+(-155+Math.sin(-Math.PI*.8)*cfg.orbitRadius*.72)*u};
 const orbiting={x:Math.cos(a)*cfg.orbitRadius,y:-110+Math.sin(a)*cfg.orbitRadius*.72};
 const orbitBlend=state.phase>=2?1:0;
 const x=(emerging.x*(1-orbitBlend)+orbiting.x*orbitBlend)*(1-state.vestment)+65*state.vestment;
 const y=(emerging.y*(1-orbitBlend)+orbiting.y*orbitBlend)*(1-state.vestment)-205*state.vestment;
 return {x,y,scale:cfg.foxScale*(.56+.44*u),rotation:(.22*Math.sin(a)+.12)*(1-state.vestment)+.18*state.vestment,state};
}
export function guardianCamera(t:number,cfg=FOX_GUARDIAN_DEFAULTS){
 const {phase,progress,opacity}=guardianTimeline(t,cfg),strength=cfg.cameraStrength*opacity;
 const scale=[1.07,1.07+.045*Math.sin(progress*Math.PI),1.07-.12*smooth(progress),.95-.015*Math.sin(progress*Math.PI),.97,.97+.03*smooth(progress)][phase];
 return {scale:1+(scale-1)*strength,x:phase===2?Math.sin(progress*Math.PI*2)*8*strength:0,y:phase===1?Math.sin(progress*Math.PI)*24*strength:phase===4?8*strength:0,rotation:phase===2?Math.sin(progress*Math.PI*2)*.018*strength:0};
}
/** A guardian completes its ritual; there is no Lv4 projectile or pursuit state. */
export function updateFoxGuardian(g:Game,s:Skill){
 const cfg=guardianConfig(s),state=guardianTimeline(s.age,cfg);if(s.released||s.age+1e-8<state.releaseAt)return;
 s.released=true;g.primaryAction({kind:'area',castId:s.id,origin:{x:s.x,y:s.y},direction:{...s.direction},damage:s.damage,radius:cfg.releaseRadius});g.shield=Math.max(g.shield,cfg.shield);g.shieldTime=Math.max(g.shieldTime,cfg.shieldDuration);
 for(const e of [...g.enemies])if(Math.hypot(e.x-s.x,e.y-s.y)<=cfg.releaseRadius&&!s.hit.has(e.id)){s.hit.add(e.id);g.breakArmor(e);g.damage(e,s.damage,180*s.strength);}
}
