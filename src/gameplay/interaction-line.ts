import {attachSwipe,updateSlash} from './slash';
import type {Skill} from '../core/types';
import type {Game} from './game';
/** Separate experimental entry; the stable ordinary slash and its assets are reused. */
export function configureInteractionLine(g:Game,s:Skill){
 s.interactionLine=true;attachSwipe(s);
 if(g.interactions.tryRefract(s)){s.interactionConsumed=true;return;}
 g.interactions.add(s);
 const window=g.interactions.effects.find(e=>e.kind==='triangle'&&e.source.id===s.id);
 // End the long primary visual tails as they become the window; retain all attack logic.
 if(window)for(const line of [...g.skills,s])if(window.consumedCastIds?.includes(line.id))line.interactionConsumed=true;
}
export function updateInteractionLine(g:Game,s:Skill){updateSlash(g,s);}
