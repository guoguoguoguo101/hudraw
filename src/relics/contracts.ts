import type {Point} from '../input/recognizer';

/** Immutable primary-action boundary. Skills publish actions, never reference relics. */
export type PrimaryAction={castId:number;origin:Point;direction:Point;damage:number} & (
 | {kind:'ray';range:number;width:number;pierce:number}
 | {kind:'area';radius:number}
 | {kind:'projectile';targetId:number|null;speed:number;range:number}
 | {kind:'chain';hits:{id:number;position:Point;damage:number}[]}
);
export type RelicTarget={id:number;x:number;y:number;hp:number;kind:string};
export interface RelicCombatPort {
 targets():readonly RelicTarget[];
 damage(id:number,amount:number):void;
}
