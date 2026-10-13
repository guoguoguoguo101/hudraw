import type {Point,Rune,TalismanGeometry} from '../input/recognizer';
export type State='menu'|'tutorial'|'playing'|'paused'|'upgrade'|'win'|'lose';
export type EnemyKind='ink'|'crow'|'oni'|'boss';
export type AIState='Spawn'|'Approach'|'Telegraph'|'Attack'|'Recovery'|'Hit'|'Death';
export type Enemy={id:number;kind:EnemyKind;x:number;y:number;prevX:number;prevY:number;hp:number;maxHp:number;speed:number;age:number;hit:number;vx:number;vy:number;ai:AIState;stateAge:number;aim:Point;armor:number;armorTime:number;shock:number;attackOrigin:Point;phase:number;armorPool:number};
export type Skill={circle?:import('../gameplay/circle').CircleState;thunder?:import('../gameplay/thunder').ThunderState;arrows?:import('../gameplay/arrows').ArrowState;slash?:import('../gameplay/slash').SlashState;testLevel?:number;id:number;rune:Rune;age:number;direction:Point;x:number;y:number;released:boolean;hit:Set<number>;hitCounts:Map<number,number>;geometry:TalismanGeometry;quality:number;damage:number;radius:number;range:number;duration:number;strength:number;copies:number;mirror:boolean;seal:boolean;sealPower:number;shock:boolean;shockDuration:number;nextTick:number;rotation:number;target:number|null;aimPoints:Point[]};
export type Event={type:'cast';rune:Rune;direction:Point}|{type:'strike';x:number;y:number;kind:EnemyKind;dead:boolean;amount:number}|{type:'hurt';amount:number}|{type:'win'}|{type:'lose'}|{type:'wave';label:string}|{type:'chain';points:Point[]}|{type:'upgrade'}|{type:'foxfire';from:Point;to:Point};
export const WORLD={width:720,height:1280,foxX:360,foxY:665,duration:180};
export const RULES={step:1/60,invulnerability:1.2,cooldown:0,attackRadius:58};
