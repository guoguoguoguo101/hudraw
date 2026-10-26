import type {MusicScene} from '../audio/hualing-music';
import type {FrameSample} from './frame-sample';
import type {Point} from '../input/recognizer';
export type InputEvent=Point&{kind:'down'|'move'|'up'|'cancel';id:number};
export type Sound='inkSeal'|'inkSummon'|'inkSlam'|'inkBlock'|'bossFlame'|'bossWave'|'bossStar'|'bossFrost'|'bossParry'|'bossIntro'|'bossMark'|'bossBreak'|'bossDanger'|'wideCast'|'carpCast'|'carpImpact'|'spray'|'sprayHigh'|'line'|'circle'|'z'|'hit'|'hurt'|'win'|'lose'|'tap'|'paperHit'|'paperBreak'|'combo1'|'combo2'|'combo3'|'combo4'|'thunderOn'|'thunderStroke'|'thunderHit';
export type CanvasSurface={width:number;height:number};
export interface PlatformAdapter{diagnostics?():void;recordFrame?(frame:FrameSample):void;finishFrame?():void;recordAction?(action:string,state:string):void;mount(canvas:CanvasSurface):void;input(canvas:CanvasSurface,fn:(e:InputEvent)=>void):()=>void;loadAsset<T>(url:string):Promise<T>;keyboard(fn:(key:string)=>void):void;lifecycle(fn:()=>void):void;read(key:string):string|null;write(key:string,value:string):boolean;audio(sound:Sound):void;music?(enabled:boolean,scene?:MusicScene):void;unlockAudio():void;setMuted(muted:boolean):void;query(key:string):string|null;pixelRatio():number;}
