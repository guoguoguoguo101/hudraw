import type {Enemy} from '../core/types';

export const FOX_SCALE=.38;
export const FOX_MENU_SCALE=.46;
export function enemyScale(kind:Enemy['kind']){
 return kind==='boss'?.88:kind==='crow'?.48:.56;
}
