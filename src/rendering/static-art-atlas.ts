import {Container,Graphics,GraphicsContext,Matrix,Rectangle,RenderTexture,Sprite,Texture,type Renderer} from 'pixi.js';
type Entry={texture:Texture;x:number;y:number};
type Page={texture:RenderTexture;x:number;y:number;row:number};
/** Original vector ornaments packed into shared pages; original transforms and layers remain live. */
export class StaticArtAtlas{
 private pages:Page[]=[];private entries=new Map<string,Entry>();
 private pending:{g:Graphics;key:string}[]=[];
 constructor(private renderer:Renderer){}
 bake(root:Container,key:string,dynamic:Set<Graphics>){
  const visit=(node:Container,path:string)=>{
   if(node instanceof Graphics&&!dynamic.has(node)&&node.children.length===0&&node.context.instructions.length){
    this.pending.push({g:node,key:key+path});return;
   }
   [...node.children].forEach((child,i)=>visit(child,`${path}/${i}`));
  };visit(root,'');
 }
 update(budgetMs=1.5){const start=performance.now();let count=0;while(this.pending.length&&count++<256){const job=this.pending.shift()!;if(job.g.destroyed)continue;const entry=this.get(job.g,job.key);if(entry){const original=job.g.context;job.g.context=new GraphicsContext();original.destroy();const s=new Sprite(entry.texture);s.position.set(entry.x,entry.y);job.g.addChild(s);}if(performance.now()-start>=budgetMs)break;}}
 private get(g:Graphics,key:string){
  const cached=this.entries.get(key);if(cached)return cached;
  const b=g.getLocalBounds(),pad=3,width=Math.ceil(b.width)+pad*2,height=Math.ceil(b.height)+pad*2;
  if(width<=6||height<=6||width>1024||height>1024)return;
  let page=this.pages.find(p=>this.fits(p,width,height));
  if(!page){if(this.pages.length>=4)return;page={texture:RenderTexture.create({width:1024,height:1024,resolution:Math.min(1.5,this.renderer.resolution),antialias:true}),x:0,y:0,row:0};this.pages.push(page);const empty=new Container();this.renderer.render({container:empty,target:page.texture,clear:true});empty.destroy();}
  if(page.x+width>1024){page.x=0;page.y+=page.row;page.row=0;}
  const x=page.x,y=page.y,clone=new Graphics({context:g.context});
  this.renderer.render({container:clone,target:page.texture,clear:false,transform:new Matrix(1,0,0,1,x+pad-b.x,y+pad-b.y)});clone.destroy({context:false});
  const entry={texture:new Texture({source:page.texture.source,frame:new Rectangle(x,y,width,height)}),x:b.x-pad,y:b.y-pad};
  page.x+=width;page.row=Math.max(page.row,height);this.entries.set(key,entry);return entry;
 }
 private fits(p:Page,w:number,h:number){return p.x+w<=1024?p.y+h<=1024:p.y+p.row+h<=1024;}
 cancel(){this.pending=[];}
 clear(){this.cancel();for(const e of this.entries.values())e.texture.destroy(false);this.entries.clear();for(const p of this.pages)p.texture.destroy(true);this.pages=[];}
 get pageCount(){return this.pages.length;}
}
