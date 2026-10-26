import {readFileSync} from 'node:fs';
const layout=JSON.parse(readFileSync(new URL('../src/rendering/fox-layout.json',import.meta.url),'utf8'));
/** The exported preview and the articulated game rig share exactly the same base pose. */
export function foxPreview(parts){
 const place=(name,key,pose=layout[key])=>{const [x,y,scale,angle]=pose;return `<g transform="translate(${x} ${y}) rotate(${angle*180/Math.PI}) scale(${scale})">${parts[name]}</g>`;};
 return `<g transform="translate(9 13) scale(.87)">${layout.tails.map((p,i)=>place(['fox_tail_high','fox_tail_mid','fox_tail_low'][i],'tails',p)).join('')}${place('fox_leg','right_leg')}${place('fox_leg','left_leg')}${place('fox_torso','torso')}${place('fox_arm','right_arm')}${place('fox_arm','left_arm')}${place('fox_scarf','scarf')}${place('fox_collar','collar')}<g transform="translate(${layout.head[0]} ${layout.head[1]})">${place('fox_ear','left_ear')}${place('fox_ear_right','right_ear')}${parts.fox_head}<g>${parts.fox_eyes}${parts.fox_pupils}</g></g>${place('fox_bell','bell')}</g>`;
}
