import type {Rune} from '../input/recognizer';

export type FoxAction='idle'|'attack'|'cast'|'summon'|'enchant'|'collect'|'hit'|'victory'|'death';
export type FoxSpell='slash'|'guard'|'thunder'|'dragon'|'petal'|'summon'|'seal'|'moon'|'wave';
export type FoxInteraction='idle'|'brush'|'ready';
export type FoxExpression='curious'|'focused'|'wonder'|'serene'|'delighted'|'hurt'|'happy'|'tired';
export const FOX_ACTION_DURATION:Record<FoxAction,number>={idle:0,attack:.38,cast:.76,summon:.86,enchant:.7,collect:.65,hit:.56,victory:2.4,death:1.1};
const priority:Record<FoxAction,number>={idle:0,collect:1,attack:2,enchant:3,summon:3,cast:3,hit:4,victory:5,death:6};
export function foxSpell(rune:Rune):FoxSpell{
 return rune==='z'?'thunder':rune==='circle'||rune==='sancai'?'guard':rune==='triangle'||rune==='star'?'summon':rune==='arc'?'moon':rune==='wave'?'wave':rune==='spiral'?'seal':'slash';
}
/** Rendering-only state: reactions cannot change damage, player position or input. */
export class FoxMotion{
 mode:FoxAction='idle';spell:FoxSpell='slash';age=0;angle=0;side=1;serial=0;
 interaction:FoxInteraction='idle';aim=0;energy=0;
 reset(){this.mode='idle';this.spell='slash';this.age=this.angle=this.aim=this.energy=0;this.side=1;this.serial=0;this.interaction='idle';}
 act(mode:FoxAction,angle=0,spell:FoxSpell='slash'){
  if(mode==='idle'){this.reset();return true;}
  if(!Number.isFinite(angle))return false;
  const locked=this.mode==='death'||this.mode==='victory'||this.age<FOX_ACTION_DURATION[this.mode];
  if(locked&&priority[mode]<priority[this.mode])return false;
  if(locked&&mode===this.mode&&((mode==='death'||mode==='victory')||this.age<(mode==='attack'?.17:.32)))return false;
  this.mode=mode;this.spell=spell;this.age=0;this.angle=angle;this.serial++;
  if(mode==='attack')this.side*=-1;
  return true;
 }
 advance(dt:number){
  if(!Number.isFinite(dt)||dt<=0)return;
  this.age+=Math.min(dt,.1);
  if(this.mode!=='death'&&this.mode!=='victory'&&this.age>=FOX_ACTION_DURATION[this.mode])this.mode='idle';
  this.energy+=((this.interaction==='idle'?0:1)-this.energy)*(1-Math.exp(-dt*12));
 }
 get expression():FoxExpression{
  if(this.mode==='hit')return 'hurt';if(this.mode==='death')return 'tired';if(this.mode==='victory')return 'happy';
  if(this.mode==='collect'||this.mode==='enchant'&&this.spell==='petal')return 'delighted';
  if(this.mode==='summon'||this.mode==='cast'&&this.spell==='dragon'||this.mode==='idle'&&this.interaction==='ready')return 'wonder';
  if(this.mode==='cast'&&this.spell==='guard')return 'serene';
  return this.mode!=='idle'||this.interaction!=='idle'?'focused':'curious';
 }
 get pose(){
  const a=this.age,mode=this.mode,attack=mode==='attack',skill=mode==='cast'||mode==='summon'||mode==='enchant';
  const release=attack?.075:.16,duration=FOX_ACTION_DURATION[mode];
  const prepare=(attack||skill)&&a<release?Math.sin(Math.PI*a/release):0;
  const power=(attack||skill)&&a>=release?Math.sin(Math.PI*Math.min(1,(a-release)/Math.max(.01,duration-release))):0;
  const hit=mode==='hit'?Math.sin(Math.PI*Math.min(1,a/.56))**.7:0;
  const celebrate=mode==='victory'?Math.max(0,Math.sin(Math.min(1,a/.85)*Math.PI)):mode==='collect'?Math.sin(Math.PI*Math.min(1,a/.65))*.4:0;
  const fall=mode==='death'?Math.min(1,a/.7):0;
  return {prepare,power,hit,celebrate,fall,attack,skill};
 }
}
