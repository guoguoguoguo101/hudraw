import type {EnemyKind,EnemyLook} from '../core/types';

/** Appearance trials reuse existing contact/rush combat; no new special mechanics. */
export const PAPER_MONSTERS:readonly {id:EnemyLook;name:string;kind:EnemyKind;scale:number}[]=[
 {id:'paper-moth',name:'封纹纸蛾',kind:'crow',scale:.68},
 {id:'paper-lantern',name:'赤灯小妖',kind:'ink',scale:.72},
 {id:'paper-umbrella',name:'独眼纸伞',kind:'ink',scale:.72},
 {id:'paper-frog',name:'青纸山蛙',kind:'ink',scale:.76},
 {id:'paper-spines',name:'纸刺团',kind:'ink',scale:.75},
 {id:'paper-rabbit',name:'断耳纸兔',kind:'ink',scale:.70},
];
export function paperMonsterLook(kind:EnemyKind,index:number):EnemyLook|undefined{
 const pool=PAPER_MONSTERS.filter(m=>m.kind===kind);return pool.length?pool[Math.abs(index)%pool.length].id:undefined;
}
