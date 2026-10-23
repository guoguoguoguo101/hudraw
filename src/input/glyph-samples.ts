import {resample,type Rune,type Point} from './recognizer';
/** Shared practice/diagnostic samples. These always pass through real recognition. */
export function glyphSample(rune:Rune):Point[]{
 if(rune==='sancai')return sancaiSample('small');
 if(rune==='wave')return Array.from({length:192},(_,i)=>({x:-230+i/191*460,y:Math.sin(i/191*Math.PI*5)*65}));
 if(rune==='spiral')return Array.from({length:192},(_,i)=>{const a=i/191*Math.PI*4.4,r=65+i/191*50;return {x:Math.cos(a)*r,y:Math.sin(a)*r};});
 if(rune==='arc')return Array.from({length:100},(_,i)=>({x:140+Math.cos(-Math.PI/2+i/99*Math.PI)*65,y:Math.sin(-Math.PI/2+i/99*Math.PI)*65}));
 if(rune==='circle')return Array.from({length:100},(_,i)=>({x:Math.cos(i/99*Math.PI*2)*120,y:Math.sin(i/99*Math.PI*2)*120}));
 if(rune==='triangle')return resample([{x:-90,y:-100},{x:100,y:0},{x:-90,y:100}],100);
 if(rune==='z')return resample([{x:-210,y:-80},{x:-140,y:80},{x:-70,y:-80},{x:0,y:80},{x:70,y:-80},{x:140,y:80},{x:210,y:-80}],192);
 return resample([{x:-140,y:0},{x:140,y:0}],100);
}

/** Both examples are closed real contours, translated relative to the fox. */
export function sancaiSample(form:'small'|'large'):Point[]{const size=form==='small'?80:190;return resample([{x:150,y:-150-size},{x:150+size,y:-150+size*.65},{x:150-size,y:-150+size*.65},{x:150,y:-150-size}],128);}
