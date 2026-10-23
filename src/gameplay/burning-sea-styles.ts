import type {BrushId} from '../input/brush-settings';

export type FirePalette={ash:number;ink:number;body:number;flame:number;accent:number;core:number};
export type FireStyle={name:string;palette:FirePalette;spacing:number;width:number;coreWidth:number;speed:number};
/** Cosmetic only: damage, collision width and timing stay in BURNING_SEA. */
export const BURNING_SEA_STYLES:Record<BrushId,FireStyle>={
 cinnabar:{name:'朱砂金焰',palette:{ash:0x391c25,ink:0x681c29,body:0xaf292d,flame:0xdf4635,accent:0xdca95c,core:0xffdf9b},spacing:62,width:1,coreWidth:2.6,speed:1},
 fox:{name:'青碧狐焰',palette:{ash:0x153536,ink:0x174b49,body:0x287969,flame:0x75b59a,accent:0xd2b77a,core:0xe4efd0},spacing:74,width:.88,coreWidth:2.1,speed:1.25},
 gold:{name:'白金御焰',palette:{ash:0x443529,ink:0x72502b,body:0xb38a4b,flame:0xe5c67d,accent:0xffd78b,core:0xfff0ca},spacing:70,width:.76,coreWidth:3.7,speed:.8},
 mountain:{name:'山海墨焰',palette:{ash:0x263039,ink:0x1a242c,body:0x394b53,flame:0x6d7d7b,accent:0xc4a16c,core:0xddd6bc},spacing:80,width:1.15,coreWidth:1.2,speed:.65}
};
