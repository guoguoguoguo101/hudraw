/** Keep combat coordinates and character proportions stable; extend scenery on tall screens. */
export function gameViewport(w:number,h:number,safeTop=0,safeBottom=0){
 const scale=Math.min(w/720,h/1280),x=(w-720*scale)/2,y=(h-1280*scale)/2;
 const top=-y/scale,bottom=(h-y)/scale;
 return {x,y,width:720*scale,height:1280*scale,scale,screenWidth:w,screenHeight:h,top,bottom,
  headerOffset:top+safeTop/scale,footerOffset:bottom-1280-safeBottom/scale};
}
export type GameViewport=ReturnType<typeof gameViewport>;
