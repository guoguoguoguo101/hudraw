import {foxArt} from './fox-art.mjs';
// Original vector artwork. The reference images are never loaded or cropped.
// All coordinates are local pivots; seeded ornament placement makes rebuilds repeatable.
export function upgradedCharacters(P){
 const path=(d,c=P.white,s='',w=1)=>`<path d="${d}" fill="${c}" stroke="${s||'none'}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
 const ink=(d,c=P.gold,w=1.4)=>path(d,'none',c,w);
 const dot=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
 const shade='#D9BC94',cream='#F8EDD6',dark='#30272B';
 const a={};
 let drops='';for(let j=0;j<15;j++){const q=j*2.4,r=65+j%3*9,x=Math.cos(q)*r,y=Math.sin(q)*r;drops+=dot(x,y,2+j%4,P.ink);}
 a.ink_body=drops+path('M -59 22 Q -82 12 -70 -12 L -60 -18 Q -68 -47 -39 -51 Q -41 -72 -16 -67 Q 7 -87 25 -61 Q 58 -69 60 -40 Q 81 -28 66 -6 Q 80 22 52 35 Q 45 63 12 53 Q -17 77 -34 53 Q -67 59 -59 22 Z',P.ink,'#786249',1.2)+path('M -55 -20 Q -49 -50 -19 -49 Q -33 -32 -27 -16 L -43 -8 Z',dark)+path('M 33 -50 Q 52 -40 41 -17 L 52 -25 Q 58 -41 45 -51 Z',P.wine)+path('M -15 -5 Q -34 -28 -41 -13 Q -40 6 -27 12 Z M 13 -5 Q 33 -28 40 -13 Q 40 6 26 12 Z',P.white)+dot(-31,-8,3,P.gold)+dot(30,-8,3,P.gold)+path('M -8 29 Q 0 35 9 28 L 5 40 L -2 38 Z',P.dark)+`<g transform="translate(-34 -49) rotate(-19)">${path('M -9 -16 L 12 -16 L 8 23 L -13 19 Z',P.paper)}${ink('M -4 -10 L 6 -10 L -5 0 L 6 1 L -5 12 M 0 -13 L 0 16',P.red,1.4)}</g>`+ink('M 34 25 Q 52 30 42 42 M -48 20 Q -58 33 -43 39','#786249');
 a.crow_body=path('M -48 29 L -81 56 L -70 37 L -82 40 L -63 12 Q -61 -10 -37 -19 Q -30 -45 -2 -52 Q 27 -54 37 -27 L 66 -17 L 37 -8 Q 25 23 -6 26 L -15 42 L -24 38 L -19 27 Z',P.ink,'#786249',.8)+path('M 37 -25 L 65 -17 L 36 -12 Z',P.gold)+path('M -44 -1 Q -15 -20 13 -17 Q -1 10 -25 16 Z',dark)+dot(18,-30,5,P.red)+dot(19,-31,1.5,P.gold)+ink('M -13 27 L -17 45 L -27 50 M -5 27 L -2 44 L 10 48',P.ink,3)+`<g transform="translate(49 24) rotate(-17)">${path('M -10 -29 L 11 -29 L 15 37 L -14 34 Z',P.paper,P.gold,1)}${ink('M -5 -21 L 6 -21 M 1 -24 L 1 23 M -6 -8 L 6 -8 L -6 5 L 7 6 M -6 17 L 7 18',P.red,2)}</g>`;
 a.crow_wing=path('M 0 0 Q -27 -10 -48 -44 Q -74 -73 -120 -123 L -109 -77 L -123 -91 L -99 -54 L -117 -65 L -93 -34 L -103 -38 L -77 -14 L -89 -17 L -63 4 L -52 -1 L -43 13 L -32 6 Q -17 19 0 0 Z',P.ink,'#786249',.8)+path('M -15 -5 Q -36 -12 -70 -57 L -61 -39 L -69 -43 L -51 -23 L -59 -27 L -37 -10 L -45 -8 L -26 6 Z',P.gold)+ink('M -21 -3 Q -31 -8 -39 -20 Q -36 -8 -28 -5 M -39 -23 L -49 -38 M -53 -42 L -69 -64',P.wine,2)+ink('M -84 -61 L -107 -91 M -69 -43 L -86 -67','#786249');
 a.oni_body=path('M 0 -117 Q 15 -97 4 -81 Q 36 -101 45 -123 Q 57 -89 36 -65 Q 78 -87 89 -65 Q 107 -50 92 -23 Q 104 -4 126 -16 Q 122 20 95 22 Q 115 51 88 63 L 70 55 Q 79 84 45 87 Q 39 104 15 90 Q -11 114 -36 87 Q -64 99 -70 70 Q -107 83 -97 47 Q -128 34 -104 10 Q -127 -18 -91 -29 Q -102 -67 -66 -62 Q -76 -93 -42 -85 Q -35 -117 -17 -96 Z',P.dark)+path('M -74 -31 Q -108 -28 -101 1 Q -75 -21 -72 11 Q -107 30 -84 51 Q -74 26 -53 42 L -45 67 Q -42 89 -24 77 L -32 56 Z M 75 -51 Q 85 -25 66 -14 Q 100 -31 103 -5 Q 92 13 75 6 L 71 37 Q 90 58 65 74 Q 67 50 53 52 L 49 35 Z',P.red)+path('M -40 -55 Q 0 -77 40 -55 L 59 -18 Q 71 14 48 43 Q 43 65 0 84 Q -43 65 -48 43 Q -71 14 -59 -18 Z',P.red,P.gold,1.5)+path('M -40 -45 Q -77 -62 -68 -113 Q -52 -84 -31 -75 Z M 40 -45 Q 77 -62 68 -113 Q 52 -84 31 -75 Z',P.paper)+ink('M -62 -87 Q -56 -63 -42 -60 M 62 -87 Q 56 -63 42 -60',shade,2)+path('M 0 -59 L 17 -34 L 0 -11 L -17 -34 Z M -50 -30 Q -28 -26 -12 -8 L -21 1 L -44 -6 Z M 50 -30 Q 28 -26 12 -8 L 21 1 L 44 -6 Z M -51 3 L -32 12 L -19 7 L -23 24 Q -45 21 -51 3 Z M 51 3 L 32 12 L 19 7 L 23 24 Q 45 21 51 3 Z',P.paper)+path('M 0 -46 L 7 -34 L 0 -23 L -7 -34 Z',P.ink)+path('M -44 -13 Q -29 -7 -18 2 Q -35 11 -45 -3 Z M 44 -13 Q 29 -7 18 2 Q 35 11 45 -3 Z',P.ink)+ink('M -38 -1 L -25 2 M 38 -1 L 25 2',P.gold,2)+path('M -8 4 Q 0 -7 8 4 L 14 21 L 7 26 L 0 22 L -7 26 L -14 21 Z',P.paper)+path('M -30 38 Q 0 19 30 38 L 36 54 Q 0 70 -36 54 Z',P.ink)+path('M -29 37 L -20 50 L -14 32 L -7 45 L 0 32 L 7 45 L 14 32 L 20 50 L 29 37 L 31 53 Q 0 43 -31 53 Z',P.paper)+ink('M -30 64 Q 0 82 30 64',P.gold,2);
 a.env_leaf=path('M 0 25 L -3 7 L -22 14 L -17 1 L -28 -9 L -11 -11 L -11 -29 L 1 -17 L 11 -35 L 15 -14 L 31 -17 L 23 -3 L 33 6 L 12 8 L 6 21 Z',P.red)+ink('M 0 24 L 3 -15',P.dark,1);
 a.env_talisman=path('M -15 -34 L 14 -34 L 17 32 L -12 38 L -19 26 Z',P.paper,P.gold,1)+ink('M -8 -24 L 8 -24 M 0 -27 L 0 25 M -9 -13 L 8 -12 L -7 -1 L 9 0 L -6 12 L 8 12 M -8 24 L 9 24',P.red,2);
 a.env_lantern=path('M -19 -36 L 19 -36 L 24 -29 L 19 -24 L 27 -10 L 22 20 L 12 30 L -12 30 L -22 20 L -27 -10 L -19 -24 L -24 -29 Z',P.dark)+path('M -15 -20 L 15 -20 L 20 -9 L 17 18 L 10 23 L -10 23 L -17 18 L -20 -9 Z',P.red)+path('M -8 -19 L 8 -19 L 10 19 L -10 19 Z',P.gold)+ink('M -15 -3 L 15 -3 M -12 12 L 12 12 M 0 -33 L 0 -50 M 0 30 L 0 44',P.gold,2)+dot(0,43,3,P.red);
 a.env_mist=path('M -156 19 Q -129 0 -85 5 Q -40 -19 -5 3 Q 52 -12 76 5 Q 120 -1 154 22 Q 67 39 0 25 Q -77 35 -156 19 Z',P.paper);
 a.env_feather=path('M -4 55 Q -42 -16 17 -76 Q 45 -12 -4 55 Z',P.ink)+ink('M -4 55 L 13 -55 M 1 12 L -18 -9 M 6 -10 L 24 -26',P.gold,1);
 a.env_inkdrop=path('M -21 18 Q -45 -5 -18 -29 L 2 -50 Q -6 -25 14 -14 Q 38 -1 21 21 Q 5 39 -21 18 Z',P.ink)+dot(36,25,6,P.ink)+dot(-32,-33,4,P.ink);
 return Object.assign(a,foxArt(P));
}

export function environmentLayers(P){
 let seed=9471;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const p=(d,c,s='',w=1)=>`<path d="${d}" fill="${c}" stroke="${s||'none'}" stroke-width="${w}" stroke-linejoin="round"/>`;
 const l=(d,c,w=1)=>p(d,'none',c,w);
 const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
 const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
 const g=(x,y,s,body)=>`<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
 const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">${body}</svg>`;
 const layers={};
 let paper=rect(0,0,720,1280,P.paper);for(let i=0;i<2400;i++){const x=rand()*720,y=rand()*1280;paper+=`<path d="M ${x.toFixed(1)} ${y.toFixed(1)} l ${(rand()*8+1).toFixed(1)} ${(rand()*2-1).toFixed(1)}" stroke="#997749" stroke-width=".5" opacity="${(.025+rand()*.06).toFixed(3)}"/>`;}
 layers.sky=paper;
 let sun=circle(365,268,174,P.red)+circle(365,268,179,'none');for(let i=0;i<330;i++){const x=200+rand()*330,y=97+rand()*342;if((x-365)**2+(y-268)**2<174**2)sun+=l(`M ${x} ${y} l ${4+rand()*12} -1`,'#B9312D',.7);}layers.sun=sun;
 const mount=(pts,c)=>p(`M -40 550 ${pts} L 760 850 L -40 850 Z`,c);
 let far=mount('L -10 254 L 30 239 L 72 276 L 110 263 L 156 327 L 193 306 L 224 344 L 294 381 L 360 385 L 431 376 L 482 333 L 523 340 L 574 271 L 619 249 L 662 299 L 713 255 L 760 278','#A7473D');
 far+=mount('L -20 324 L 54 280 L 117 361 L 155 348 L 196 388 L 243 361 L 311 434 L 362 405 L 416 441 L 497 382 L 546 332 L 593 359 L 648 313 L 760 380','#793A36');
 // Faceted ridges and broken strata follow the authored peaks, rather than generic noise.
 const ridges=[[30,239,150,437],[110,263,218,467],[193,306,280,467],[243,361,332,474],[574,271,488,476],[619,249,688,431],[648,313,586,478]];
 for(const [x,y,bx,by] of ridges){far+=p(`M ${x} ${y} Q ${x+12} ${y+49} ${bx} ${by} L ${bx-25} ${by-6} Q ${x-3} ${y+71} ${x} ${y}`,'#853C36');far+=l(`M ${x} ${y+7} l 9 28 l -1 12 l 13 18 l 5 26 l 16 22`,'#BF6550',.9);for(let j=0;j<19;j++){const f=j/19,px=x+(bx-x)*f,py=y+(by-y)*f;far+=l(`M ${px-3} ${py+15} l ${8+rand()*9} ${-2+rand()*7} l ${-4+rand()*6} ${7+rand()*10}`,'#C26A50',.55);}}
 layers.far_mountains=far;
 let valley=p('M 0 423 L 65 384 L 111 409 L 153 465 L 203 458 L 276 518 L 347 474 L 379 489 L 469 444 L 541 384 L 581 401 L 643 365 L 720 397 L 720 754 L 0 754 Z','#4E3032');
 valley+=p('M 356 450 Q 398 463 357 483 Q 299 495 339 506 Q 452 528 413 551 Q 351 566 434 595 L 562 725 L 152 725 Q 262 640 335 606 Q 388 577 315 560 Q 231 538 296 516 Q 338 503 309 493 Q 300 478 348 470 Z','#BE4B37');
 for(let i=0;i<90;i++){const y=477+rand()*177,x=280+rand()*160,w=7+rand()*60;valley+=l(`M ${x} ${y} h ${w}`,'#EF9A64',rand()*.8+.5);}
 valley+=p('M 0 484 L 62 444 L 140 485 L 167 535 L 231 559 L 285 618 L 0 730 Z','#302A2C')+p('M 720 462 L 668 439 L 613 472 L 589 523 L 512 551 L 475 608 L 720 713 Z','#302A2C');
 valley+=p('M 648 380 Q 641 452 619 479 Q 626 515 600 547 L 609 550 Q 638 519 631 485 Q 650 449 655 383 Z','#A27D63')+l('M 650 387 Q 642 461 625 486 Q 631 512 606 545',P.paper,2);
 for(const [x,y] of [[65,384],[153,465],[541,384],[643,365]]){valley+=p(`M ${x} ${y} l 23 48 l -7 26 l 19 35 l 3 38 l -31 -56 l 2 -21 l -17 -31 Z`,'#604039')+l(`M ${x+4} ${y+12} l 13 37 l -5 14 l 10 18`,'#8E5344',1);}
 layers.valley=valley;
 const torii=()=>p('M -56 -66 Q 0 -43 56 -66 L 49 -49 Q 0 -31 -49 -49 Z',P.ink)+rect(-44,-47,9,83,P.dark)+rect(35,-47,9,83,P.dark)+rect(-43,-31,86,8,P.red)+rect(-3,-47,6,17,P.ink)+l('M -42 -44 L -38 35 M 38 -44 L 40 35',P.red,2)+p('M -49 -68 Q 0 -49 49 -68',P.ink,P.gold,1);
 const pagoda=()=>{let b='';for(let i=0;i<3;i++){const y=-i*31,w=42-i*9;b+=rect(-w*.62,y-24,w*1.24,24,'#39252A')+p(`M ${-w} ${y-21} Q -12 ${y-19} 0 ${y-39} Q 12 ${y-19} ${w} ${y-21} L ${w-5} ${y-14} Q 0 ${y-9} ${-w+5} ${y-14} Z`,P.ink)+l(`M ${-w+3} ${y-20} Q 0 ${y-17} ${w-3} ${y-20}`,P.red,1.5);for(let x=-w*.4;x<=w*.4;x+=8)b+=rect(x,y-9,3,6,P.gold);}return b+l('M 0 -104 L 0 -126',P.ink,3);};
 let shrine=g(602,371,.78,pagoda())+g(563,449,.34,pagoda())+g(478,466,.36,torii())+g(173,445,.38,torii())+g(263,486,.26,torii())+g(92,444,.72,torii());
 shrine+=p('M 52 546 L 62 511 L 113 491 L 105 545 Z',P.ink)+l('M 61 535 L 105 516 M 65 525 L 109 506 M 69 515 L 112 496','#796047',2);
 shrine+=g(94,451,.72,p('M -26 -37 L -12 -35 L -13 10 L -20 4 L -28 6 Z M 18 -34 L 29 -37 L 29 6 L 21 3 L 15 10 Z',P.gold)+l('M -21 -28 L -21 -3 M 22 -27 L 22 -3',P.red,2));
 layers.shrines=shrine;
 let arena=p('M 0 575 Q 165 559 360 571 Q 578 562 720 576 L 720 1280 L 0 1280 Z','#393737');
 arena+=p('M 0 575 Q 360 552 720 575 L 720 592 Q 360 570 0 592 Z','#393333')+l('M 0 577 Q 360 559 720 577',P.gold,1);
 // Stone seams converge toward the valley. Low contrast under actors and gestures.
 for(let j=0;j<11;j++){const y=605+j*j*5.1;arena+=l(`M 0 ${y} Q 360 ${y-18-j*1.5} 720 ${y}`,'#45403B',.55);}
 for(let j=-5;j<=5;j++)arena+=l(`M ${360+j*33} 580 Q ${360+j*60} 775 ${360+j*130} 1280`,'#45403B',.45);
 for(let i=0;i<320;i++){const x=rand()*720,y=595+rand()*685;arena+=l(`M ${x} ${y} l ${2+rand()*15} ${rand()*3}`,'#50463C',.3);}
 // Delicate engraved cloud spirals, not a bright combat effect.
 for(let i=0;i<12;i++){const x=i%2?575+rand()*130:rand()*145,y=620+rand()*630,s=.22+rand()*.5;arena+=g(x,y,s,l('M -55 14 C -20 11 -43 -26 -9 -28 C 25 -31 26 10 3 10 C -12 10 -11 -8 0 -8 M -61 22 Q -8 16 53 23 M -21 32 Q 6 22 78 30','#4E453D',1.3));}
 arena+=`<g opacity=".08" transform="translate(360 719) scale(1 .36)"><circle r="175" fill="none" stroke="${P.gold}" stroke-width="3"/><circle r="155" fill="none" stroke="${P.gold}" stroke-width="1"/>${Array.from({length:8},(_,i)=>`<g transform="rotate(${i*45})">${p('M 0 -132 L 10 -112 L 0 -90 L -10 -112 Z','none',P.gold,2)}</g>`).join('')}</g>`;
 layers.arena=arena;
 const maple=(x,y,s,c)=>g(x,y,s,p('M 0 24 L -3 7 L -22 14 L -17 1 L -28 -9 L -11 -11 L -11 -29 L 1 -17 L 11 -35 L 15 -14 L 31 -17 L 23 -3 L 33 6 L 12 8 L 6 21 Z',c));
 const blossom=(x,y,s,c)=>g(x,y,s,Array.from({length:5},(_,i)=>`<g transform="rotate(${i*72})">${p('M 0 0 C -17 -8 -17 -23 -6 -23 L 0 -19 L 6 -23 C 17 -23 17 -8 0 0 Z',c)}</g>`).join('')+circle(0,0,3,'#9F4838'));
 const cliff=(side)=>{let b=p('M 0 536 L 42 586 L 21 622 L 78 678 L 62 721 L 119 760 L 84 815 L 147 912 L 116 959 L 166 1080 L 183 1280 L 0 1280 Z',P.ink);for(let i=0;i<24;i++){const y=570+i*29,x=rand()*Math.min(150,(y-500)*.17);b+=p(`M ${x} ${y} l 14 -19 l 30 8 l -10 35 l -23 16 Z`,i%3?'#302D2D':'#4A3934')+l(`M ${x+5} ${y+1} l 11 -13 l 13 5`,'#605046',.8);}for(let i=0;i<75;i++){const y=540+rand()*740,x=rand()*Math.min(176,(y-450)*.19);b+=maple(x,y,.14+rand()*.24,i%3?P.red:P.dark);}return side?`<g transform="translate(720 0) scale(-1 1)">${b}</g>`:b;};
 let foreground=cliff(0)+cliff(1)+g(82,1178,.88,torii())+g(656,1140,.68,torii());
 const pavilion=()=>p('M -45 -5 L -39 -52 L 37 -52 L 45 -5 Z','#31262A')+rect(-31,-48,62,39,P.dark)+rect(-24,-42,48,31,P.gold)+rect(-18,-38,36,24,P.red)+rect(-5,-38,10,24,'#FFC789')+l('M -22 -28 L 22 -28 M -12 -41 L -12 -13 M 12 -41 L 12 -13',P.ink,3)+p('M -58 -47 Q -26 -48 -9 -63 L 0 -80 L 9 -63 Q 26 -48 58 -47 L 47 -39 Q 0 -31 -47 -39 Z',P.ink)+l('M -53 -46 Q 0 -37 53 -46 M -9 -60 Q 0 -58 9 -60',P.red,2)+rect(-38,-9,76,8,P.ink)+rect(-24,-1,8,17,'#46322B')+rect(16,-1,8,17,'#46322B');
 foreground+=g(52,1136,.87,pavilion())+g(671,1031,.56,pavilion())+g(78,918,.5,pavilion())+g(663,731,.32,pavilion());
 foreground+=g(52,688,.9,torii())+g(688,633,.73,torii());
 // Shimenawa rope, folded paper wards and hanging banner seals on edge gates.
 foreground+=l('M 8 650 Q 46 671 96 650','#A88658',3);
 for(let j=0;j<5;j++)foreground+=p(`M ${18+j*16} 656 l -4 10 l 7 4 l -3 10 l 8 1 l 1 -12 l -6 -4 l 4 -8 Z`,P.paper);
 // Edge banners are now drawn as deforming cloth in Environment.

 let branches=p('M 0 56 Q 75 70 124 126 Q 159 132 197 123 M 720 165 Q 651 166 615 209 Q 581 206 556 180','none','#46272A',7)+l('M 55 79 Q 73 44 110 38 M 104 115 Q 128 74 166 69 M 657 170 Q 632 128 609 122','#46272A',4);
 for(let i=0;i<95;i++){const side=i%2,x=side?620+rand()*110:rand()*165,y=side?135+rand()*73:40+rand()*94;branches+=blossom(x,y,.20+rand()*.32,i%3?P.dark:'#6E2E2D');}
 for(let i=0;i<130;i++){const y=530+rand()*750,x=i%2?697-rand()*Math.min(90,(y-450)*.13):rand()*Math.min(110,(y-450)*.15);foreground+=blossom(x,y,.1+rand()*.21,i%4?P.red:P.dark);}
 layers.foreground=foreground;layers.branches=branches;
 return Object.fromEntries(Object.entries(layers).map(([name,body])=>[name,svg(body)]));
}
