import {GlTextureSystem,GlGeometrySystem,GlBufferSystem,BufferUsage,type TextureSource} from 'pixi.js';
type CpuBuffer={_updateID:number;_updateOffset:number;_updateSize:number;data:Float32Array|Uint32Array|Uint16Array|Uint8Array|null;descriptor:{usage:number;size:number}};
type GpuBuffer={updateID:number;type:number;buffer:WebGLBuffer;byteLength:number};
type BufferSystem={_gl:WebGLRenderingContext;_renderer:{context:{webGLVersion:number}};getGlBuffer:(buffer:CpuBuffer)=>GpuBuffer;updateBuffer:(buffer:CpuBuffer)=>GpuBuffer};

type TextureSystem={
 _gl:WebGLRenderingContext;
 _renderer:{context:{webGLVersion:number;supports:{nonPowOf2wrapping:boolean};extensions:{anisotropicFiltering:{MAX_TEXTURE_MAX_ANISOTROPY_EXT:number;TEXTURE_MAX_ANISOTROPY_EXT:number}|null}}};
 _activeTextureLocation:number;
 _setBoundTexture:(location:number,source:TextureSource)=>void;
 getGlSource:(source:TextureSource)=>{target:number;texture:WebGLTexture};
 updateStyle:(source:TextureSource,firstCreation:boolean)=>void;
};
let installed=false;
/** Pixi 8.22 applies TEXTURE_COMPARE_MODE even to WebGL1, producing INVALID_ENUM. */
export function installWechatTextureStyle(){
 if(installed)return;installed=true;
 // Native WebGL1 bridges only have the three-argument bufferSubData overload.
 // Explicitly slice partial updates instead of relying on WebGL2 sourceOffset/length.
 const buffers=GlBufferSystem.prototype as unknown as BufferSystem,update=buffers.updateBuffer;
 buffers.updateBuffer=function(buffer){
  if(this._renderer.context.webGLVersion!==1)return update.call(this,buffer);
  const gl=this._gl,gpu=this.getGlBuffer(buffer);if(buffer._updateID===gpu.updateID)return gpu;
  gl.bindBuffer(gpu.type,gpu.buffer);const data=buffer.data;
  if(data){
   if(gpu.byteLength>=data.byteLength){
    const offset=buffer._updateOffset||0,size=buffer._updateSize||data.byteLength;
    const begin=offset/data.BYTES_PER_ELEMENT,end=begin+size/data.BYTES_PER_ELEMENT;
    gl.bufferSubData(gpu.type,offset,data.subarray(begin,end));
   }else{gpu.byteLength=data.byteLength;gl.bufferData(gpu.type,data,buffer.descriptor.usage&BufferUsage.STATIC?gl.STATIC_DRAW:gl.DYNAMIC_DRAW);}
  }else{gpu.byteLength=buffer.descriptor.size;gl.bufferData(gpu.type,gpu.byteLength,gl.DYNAMIC_DRAW);}
  gpu.updateID=buffer._updateID;return gpu;
 };
 // Empty Graphics batches can carry a nonzero index offset. Pixi's size||indexCount
 // fallback turns size=0 into a full-buffer draw past the end of that index buffer.
 const geometry=GlGeometrySystem.prototype;
 const draw=geometry.draw;
 geometry.draw=function(topology,size,start,instanceCount){if(size===0)return this;return draw.call(this,topology,size,start,instanceCount);};
 const prototype=GlTextureSystem.prototype as unknown as TextureSystem;
 const original=prototype.updateStyle;
 prototype.updateStyle=function(source,firstCreation){
  if(this._renderer.context.webGLVersion!==1){original.call(this,source,firstCreation);return;}
  const gl=this._gl,texture=this.getGlSource(source),style=source.style,context=this._renderer.context;
  gl.bindTexture(texture.target,texture.texture);this._setBoundTexture(this._activeTextureLocation,source);
  const clamp=!context.supports.nonPowOf2wrapping&&!source.isPowerOfTwo;
  const wrap=(mode:string|undefined)=>clamp||!mode||mode==='clamp-to-edge'?gl.CLAMP_TO_EDGE:mode==='mirror-repeat'?gl.MIRRORED_REPEAT:gl.REPEAT;
  gl.texParameteri(texture.target,gl.TEXTURE_WRAP_S,wrap(style.addressModeU));
  gl.texParameteri(texture.target,gl.TEXTURE_WRAP_T,wrap(style.addressModeV));
  gl.texParameteri(texture.target,gl.TEXTURE_MAG_FILTER,style.magFilter==='nearest'?gl.NEAREST:gl.LINEAR);
  const min=source.mipLevelCount>1?(style.minFilter==='nearest'?(style.mipmapFilter==='nearest'?gl.NEAREST_MIPMAP_NEAREST:gl.NEAREST_MIPMAP_LINEAR):(style.mipmapFilter==='nearest'?gl.LINEAR_MIPMAP_NEAREST:gl.LINEAR_MIPMAP_LINEAR)):(style.minFilter==='nearest'?gl.NEAREST:gl.LINEAR);
  gl.texParameteri(texture.target,gl.TEXTURE_MIN_FILTER,min);
  const anisotropy=context.extensions.anisotropicFiltering;
  if(anisotropy&&style.maxAnisotropy>1)gl.texParameterf(texture.target,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(style.maxAnisotropy,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 };
}
