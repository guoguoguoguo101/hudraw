import type {Enemy} from '../core/types';

export const FOX_SCALE=.32;
export const FOX_MENU_SCALE=.39;
export function enemyScale(kind:Enemy['kind']){
 return kind==='boss'?.88:kind==='crow'?.41:.48;
}
