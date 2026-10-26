import type {Enemy,EnemyLook} from '../core/types';

// Body footprints in world units, excluding wings, tassels, shadows and effects.
// A swept brush hits when its half-width overlaps the target body's radius.
const BODY_RADIUS:Partial<Record<EnemyLook,number>>={
 'paper-moth':24,'paper-lantern':25,'paper-umbrella':25,'paper-frog':26,'paper-spines':25,'paper-rabbit':23,
 'sea-fish':24,'sea-jelly':24,'sea-crab':27,'star-ray':26,'star-bell':24,'star-kite':24,
 'snow-marten':25,'snow-owl':24,'snow-shell':28,
};
export function brushBodyRadius(e:Pick<Enemy,'kind'|'look'|'elite'|'chapterBoss'>){
 if(e.chapterBoss)return e.chapterBoss.chapter==='sea'?98:e.chapterBoss.chapter==='palace'?60:75;
 if(e.elite){const k=e.elite.kind;return k==='guardian'?76:['reefCrab','moth','clam'].includes(k)?60:['rays','deer'].includes(k)?80:k==='umbrella'?42:43;}
 return (e.look&&BODY_RADIUS[e.look])||({ink:24,crow:20,oni:36,boss:54} as const)[e.kind];
}
