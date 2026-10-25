import {unzip} from 'fflate';
const sources=new Map();
let db;
// Repository PNGs take precedence over older images imported in this browser.
export const imageUrl=c=>c.image||sources.get(c.id)||`/images/${c.id}.webp`;
export function setCharacterImage(element,character,{onLoad=()=>{},onMissing=()=>{element.hidden=true;}}={}){
 const candidates=[character.image,sources.get(character.id),`/images/${character.id}.webp`].filter(Boolean);
 let index=0;
 element.decoding='async';
 const loaded=()=>{element.hidden=false;element.dataset.imageLoaded='true';onLoad();};
 const failed=()=>{index++;if(index<candidates.length)element.src=candidates[index];else{delete element.dataset.imageLoaded;onMissing();}};
 element.addEventListener('load',loaded);element.addEventListener('error',failed);
 element.src=candidates[0];
 return ()=>{element.removeEventListener('load',loaded);element.removeEventListener('error',failed);};
}
export function bindCharacterImages(root,characters){
 root.querySelectorAll('img[data-character-image]').forEach(element=>{
  const character=characters.find(c=>c.id===element.dataset.characterImage);
  if(character)setCharacterImage(element,character);
 });
}
async function database(){if(db)return db;db=await new Promise((resolve,reject)=>{const request=indexedDB.open('vtuber-art',1);request.onupgradeneeded=()=>request.result.createObjectStore('portraits');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return db;}
export async function restoreImages(){try{const databaseHandle=await database();const rows=await new Promise((resolve,reject)=>{const tx=databaseHandle.transaction('portraits'),store=tx.objectStore('portraits'),request=store.getAll(),keys=store.getAllKeys();tx.oncomplete=()=>resolve(keys.result.map((key,i)=>[key,request.result[i]]));tx.onerror=()=>reject(tx.error);});for(const [id,blob] of rows)sources.set(id,URL.createObjectURL(blob));}catch{/* File-based portraits remain available without browser storage. */}}
export async function saveImages(entries){const databaseHandle=await database();await new Promise((resolve,reject)=>{const tx=databaseHandle.transaction('portraits','readwrite');for(const [id,blob] of entries)tx.objectStore('portraits').put(blob,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});for(const [id,blob] of entries){if(sources.has(id))URL.revokeObjectURL(sources.get(id));sources.set(id,URL.createObjectURL(blob));}}
const supported=/\.(png|jpe?g|webp)$/i;
export async function readImageFiles(files){const result=[];let total=0;for(const file of files){if(/\.zip$/i.test(file.name)){if(file.size>250*1024**2)throw Error('El ZIP debe pesar menos de 250 MiB.');const bytes=new Uint8Array(await file.arrayBuffer());let selected=0;const extracted=await new Promise((resolve,reject)=>unzip(bytes,{filter(entry){if(!supported.test(entry.name)||entry.name.startsWith('__MACOSX/')||entry.originalSize>25*1024**2)return false;total+=entry.originalSize;selected++;return total<=150*1024**2&&selected<=30;}},(error,output)=>error?reject(error):resolve(output)));for(const [name,data] of Object.entries(extracted)){const type=/\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':'image/jpeg';result.push({name:name.split('/').pop(),blob:new Blob([data],{type})});}}else if(supported.test(file.name)&&file.size<=25*1024**2){total+=file.size;if(total<=150*1024**2)result.push({name:file.name,blob:file});}}
 if(!result.length)throw Error('No se encontraron imágenes PNG, JPG o WebP (máximo 25 MiB por imagen).');
 const valid=[];for(const item of result.slice(0,30)){try{const bitmap=await createImageBitmap(item.blob);if(bitmap.width>8192||bitmap.height>8192){bitmap.close();continue;}bitmap.close();valid.push(item);}catch{/* Reject non-images instead of trusting an archive extension. */}}if(!valid.length)throw Error('No se pudieron abrir las imágenes. Usa PNG, JPG o WebP de hasta 8192 px.');return valid;}
