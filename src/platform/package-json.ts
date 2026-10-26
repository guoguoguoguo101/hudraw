import {gunzipSync,strFromU8} from 'fflate';

/** Native packages support raw gzip as well as legacy UTF-8/base64 wrappers. */
export function parsePackageJson(text:string|ArrayBuffer|Uint8Array):any{
 if(typeof text!=='string'){
  const bytes=text instanceof Uint8Array?text:new Uint8Array(text);
  if(bytes[0]===0x1f&&bytes[1]===0x8b)return JSON.parse(strFromU8(gunzipSync(bytes)));
  return parsePackageJson(strFromU8(bytes));
 }
 const data=JSON.parse(text);
 if(data?.packageEncoding!=='gzip-base64-v1')return data;
 if(typeof data.data!=='string')throw new Error('Invalid compressed package asset');
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',source=data.data;
 const bytes=new Uint8Array(Math.floor(source.length*3/4)-(source.endsWith('==')?2:source.endsWith('=')?1:0));
 let value=0,bits=0,offset=0;
 for(const ch of source){if(ch==='=')break;const digit=alphabet.indexOf(ch);if(digit<0)throw new Error('Invalid package base64');value=(value<<6)|digit;bits+=6;if(bits>=8){bits-=8;bytes[offset++]=(value>>bits)&255;}}
 return JSON.parse(strFromU8(gunzipSync(bytes)));
}
