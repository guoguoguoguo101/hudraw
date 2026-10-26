import type {HualingChapter} from './hualing-chapters';
import type {EnemyKind,EnemyLook} from '../core/types';

/** Appearance trials reuse existing contact/rush combat; no new special mechanics. */
export const PAPER_MONSTERS:readonly {id:EnemyLook;name:string;kind:EnemyKind;scale:number}[]=[
 {id:'snow-marten',name:'抱雪团貂',kind:'ink',scale:.72},
 {id:'snow-owl',name:'霜羽纸鸮',kind:'crow',scale:.70},
 {id:'snow-shell',name:'霜纹岩甲',kind:'ink',scale:.74},
 {id:'sea-fish',name:'折鳍游鲤',kind:'crow',scale:.70},
 {id:'sea-jelly',name:'潮灯水母',kind:'ink',scale:.72},
 {id:'sea-crab',name:'朱纹纸蟹',kind:'ink',scale:.73},
 {id:'star-ray',name:'折翼星鳐',kind:'crow',scale:.70},
 {id:'star-bell',name:'云纹悬铃',kind:'ink',scale:.72},
 {id:'star-kite',name:'逐星纸燕',kind:'crow',scale:.70},
 {id:'paper-moth',name:'封纹纸蛾',kind:'crow',scale:.68},
 {id:'paper-lantern',name:'赤灯小妖',kind:'ink',scale:.72},
 {id:'paper-umbrella',name:'独眼纸伞',kind:'ink',scale:.72},
 {id:'paper-frog',name:'青纸山蛙',kind:'ink',scale:.76},
 {id:'paper-spines',name:'纸刺团',kind:'ink',scale:.75},
 {id:'paper-rabbit',name:'断耳纸兔',kind:'ink',scale:.70},
];
export function chapterMonsters(chapter:HualingChapter){return PAPER_MONSTERS.filter(m=>chapter==='sea'?m.id.startsWith('sea-'):chapter==='palace'?m.id.startsWith('star-'):chapter==='snow'?m.id.startsWith('snow-'):m.id.startsWith('paper-'));}
export function paperMonsterLook(kind:EnemyKind,index:number,chapter:HualingChapter='valley'):EnemyLook|undefined{
 const pool=chapterMonsters(chapter).filter(m=>m.kind===kind);return pool.length?pool[Math.abs(index)%pool.length].id:undefined;
}
