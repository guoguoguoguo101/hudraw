import {readFileSync} from 'node:fs';
const referenceFace=JSON.parse(readFileSync(new URL('../assets/characters/fox-reference/face-parts.json',import.meta.url),'utf8'));
/** Reference-led layered vector fox: broad cheeks, tall ears, seated haunch and full tails. */
export function foxArt(P){
 const W='#FFF5DF',C='#EDDFC4',S='#DAC6A4',R='#C6533D',D='#9E4132',G=P.gold,I='#3B352B';
 const p=(d,c=W,o=false)=>`<path d="${d}" fill="${c}"${o?` stroke="${I}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
 const l=(d,c=S,w=1.4)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const e=(x,y,rx,ry,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`;
 const a={};
 a.fox_tail_high=p('M9 43C-35 53-84 29-96-15C-109-61-86-89-105-119Q-118-139-137-147C-77-159-23-134-3-94C17-55 40 7 9 43Z','url(#fur)',true)+p('M-137-147C-95-157-60-146-36-121L-54-126L-44-111L-62-118L-53-99L-76-115L-69-96C-92-114-108-136-137-147Z','url(#red)')+p('M-99-103C-82-71-94-54-77-18C-61 19-25 34 8 40C-37 44-75 19-85-13C-95-46-88-73-99-103Z',W)+p('M-63-92Q-34-64-30-32L-40-44L-36-24L-49-35L-46-12C-64-37-66-58-63-92Z',C);
 a.fox_tail_mid=p('M9 39C-46 62-110 24-117-27C-123-68-130-94-156-109C-101-130-61-99-40-63C-18-25 34 5 9 39Z','url(#fur)',true)+p('M-156-109Q-119-127-83-103L-100-104L-89-91L-108-95L-98-77L-119-86L-113-68Q-132-95-156-109Z','url(#red)')+p('M-107-76C-88-57-86-26-65-5C-46 16-23 25 11 36C-39 48-86 14-97-18Q-107-44-107-76Z',W);
 a.fox_tail_low=p('M9 12C-13 54-64 66-104 45C-131 30-143 2-132-22C-113 4-89 7-67-4C-34-19-4-10 9 12Z','url(#fur)',true)+p('M-132-22Q-112 7-88 4L-101 15L-87 17L-102 26L-86 31Q-126 29-132-22Z','url(#red)')+p('M-91 17C-57 4-25 1 8 12C-17 38-60 45-91 17Z',W);
 a.fox_tail=a.fox_tail_high;
 // A seated pear-shaped chest rather than the old long horizontal torso.
 a.fox_torso=p('M-10-32C-34-20-42 5-47 26C-66 35-73 56-60 69C-42 83-12 75 4 74C24 83 49 69 52 48C57 18 45-13 31-31Z','url(#fur)',true)+p('M8-31C-2-9-8 14-1 37L8 29L12 46L24 35L29 46C46 26 45-6 31-29Z',W)+p('M-42 25C-22 26-14 47-23 66Q-42 77-58 66C-70 49-61 32-42 25Z',C)+l('M-44 30C-25 30-20 50-28 62',S,1.5)+p('M21 46Q20 65 10 76Q37 79 47 60Z',S);
 // Broad, softly tapered 3/4 head. Tiny mouth is a smile, not an omega muzzle.
 a.fox_head=p('M-56-30C-45-49-23-58 0-54C26-57 48-42 55-24C60-12 61-1 61 7L70 17L59 23L66 30L53 34L58 40L43 42C25 57-4 59-28 49L-43 44L-60 43L-55 35L-71 31L-61 23L-76 17L-63 8C-66-5-63-18-56-30Z',W,true)+p('M-57 35Q-30 49-8 49Q19 55 44 41C26 58-3 60-28 49L-43 44L-59 43Z',C)+p('M3-39C-2-34-3-27 2-24C10-26 9-32 3-39Z',R)+e(-42,22,9,2.8,'#EBCBAB')+e(44,26,8,2.6,'#EBCBAB')+p('M9 30Q17 26 23 31Q21 37 16 37Q11 35 9 30Z',I)+l('M10 43Q15 47 21 43','#C5AF8C',1.2);
 a.fox_ear=p('M-22 19C-33-9-35-48-24-85C-3-73 16-42 22-8L17 24Z',W,true)+p('M-24-85C-8-76 4-57 12-36L-1-44L5-26L-10-37L-6-19C-18-39-26-59-24-85Z','url(#red)')+p('M-18-62C-8-48 1-26 5-5L-10 4C-21-14-23-40-18-62Z',D)+p('M-20-4L-15-17L-10-5L-5-19L1-7L8-17L8-4L16-8L11 6L-6 11Z',W);
 a.fox_eyes=e(-23,9,6.7,10.5,I)+e(32,16,6,9.8,I);
 a.fox_pupils=e(-21,5.5,1.8,2.7,'#FFFDF7')+e(33.5,12.8,1.6,2.4,'#FFFDF7');
 // The bent hind leg gives the idle silhouette a visible seated haunch.
 a.fox_leg=p('M-15-9C-31-7-34 10-27 23Q-22 33-12 35L-17 45C-17 54-4 58 9 55Q24 53 20 43L12 35C20 12 9-10-15-9Z','url(#fur)',true)+p('M-15 40L-7 44L-1 38L6 45L12 40L20 46Q21 56 8 56L-9 55Q-20 53-15 40Z','url(#red)')+l('M0 49L1 55M8 49L9 55',D,1.1);
 a.fox_arm=p('M-11-6C-18 8-14 28-13 40L-19 48C-25 59-11 64 3 63C18 63 25 55 18 47L12 40C13 20 13 1 7-7Z','url(#fur)',true)+p('M-9-2C-12 13-6 28-5 39L-12 46Q-18 24-15 8Z',W)+p('M-16 41L-9 47L-3 40L3 47L10 41L18 49Q25 62 3 63Q-23 64-19 49Z','url(#red)')+l('M-7 55L-6 61M2 55L3 62M10 54L11 60',D,1.2);
 a.fox_collar=p('M-36-12C-16 0 8 7 35-5L38 8C13 27-15 18-35 4Z','url(#red)',true)+p('M-32-7Q-4 11 30 0L28 7Q-2 20-31 1Z',R)+l('M-19 0Q0 10 21 5','#E5845B',1.3)+p('M28 0Q40-1 43 10L35 18L23 14Z',D);
 a.fox_scarf=p('M17-3C-20 1-45-27-76-26C-102-27-120-14-145-17L-133-6L-145 0C-113 14-89-9-65-8C-33-5-10 17 17 10Z','url(#red)')+p('M15 9C-19 15-41 6-65 17C-88 29-111 34-131 26L-122 39L-135 41C-108 58-78 38-54 33C-25 30-6 35 18 23Z',R)+p('M-76-26Q-46-25-23-10Q-51-17-79-10Z','#DF7755')+p('M-132 42Q-102 45-73 29Q-91 44-111 48Z',D);
 a.fox_bell=p('M-3-14L4-14L5-8C18-6 24 5 20 16C17 29-14 31-20 17C-25 4-17-6-5-8Z','url(#gold)',true)+p('M-18 11Q1 6 21 12L19 17Q1 12-18 18Z','#BE8D43')+l('M-11 3Q-7-5 1-3','#FFF4C6',3.5)+e(1,17,3.3,3.1,'#715439')+l('M1 20L0 27','#715439',2);
 const defs=id=>`<defs><linearGradient id="fur_${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#FFF8E9"/><stop offset=".65" stop-color="#F5E8CC"/><stop offset="1" stop-color="#DDC9A3"/></linearGradient><linearGradient id="red_${id}" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#D46A4C"/><stop offset="1" stop-color="#AF4233"/></linearGradient><radialGradient id="gold_${id}" cx=".3" cy=".25" r=".8"><stop stop-color="#F5D58B"/><stop offset="1" stop-color="#BD873A"/></radialGradient></defs>`;
 for(const name of Object.keys(a))a[name]=defs(name)+a[name].replaceAll('url(#fur)',`url(#fur_${name})`).replaceAll('url(#red)',`url(#red_${name})`).replaceAll('url(#gold)',`url(#gold_${name})`);
 return Object.assign(a,referenceFace);
}
