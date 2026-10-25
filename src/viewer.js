import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
export function mountViewer(container,character,{image,cinematic=false}={}){
 let renderer,vrm,disposed=false,frame,controls,observer;
 const pointer=e=>{if(!motion)return;const rect=container.getBoundingClientRect();container.style.setProperty('--tilt-x',`${-((e.clientY-rect.top)/rect.height-.5)*8}deg`);container.style.setProperty('--tilt-y',`${((e.clientX-rect.left)/rect.width-.5)*12}deg`);};container.addEventListener('pointermove',pointer);
 const abort=new AbortController(),motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fallback=document.createElement('div');fallback.className='model-placeholder';fallback.style.setProperty('--character',character.color);fallback.innerHTML=`<div class="avatar-halo"></div><div class="avatar-head"></div><div class="avatar-body"></div><span>${character.icon}</span><small>VISTA PREVIA · PLACEHOLDER</small>`;container.append(fallback);
 const photo=document.createElement('img');photo.className='character-splash';photo.alt=character.name;photo.hidden=true;let hasPhoto=false;
 if(image){photo.onload=()=>{if(disposed)return;hasPhoto=true;photo.hidden=false;fallback.hidden=true;if(status.dataset.missing)status.textContent='Retrato del personaje · modelo VRM pendiente';};photo.onerror=()=>photo.remove();photo.src=image;container.append(photo);}
 const status=document.createElement('p');status.className='model-status';status.textContent=`Buscando ${character.file}…`;container.append(status);
 async function load(){try{
 const response=await fetch(`/models/${character.file}`,{method:'HEAD',signal:abort.signal});if(disposed)return;if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw Error('missing');
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.01,100);camera.position.set(0,1.2,3.5);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.9,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.7;controls.maxDistance=8;
 const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};observer=new ResizeObserver(resize);observer.observe(container);resize();
 scene.add(new THREE.HemisphereLight(0xffffff,0x554477,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,2,3);scene.add(light);const rim=new THREE.DirectionalLight(character.color,3);rim.position.set(-2,1,-2);scene.add(rim);
 const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));const gltf=await loader.loadAsync(`/models/${character.file}`);
 if(disposed){VRMUtils.deepDispose(gltf.scene);return;}vrm=gltf.userData.vrm;if(!vrm){VRMUtils.deepDispose(gltf.scene);throw Error('invalid');}VRMUtils.rotateVRM0(vrm);const root=new THREE.Group();scene.add(root);root.add(vrm.scene);
 const box=new THREE.Box3().setFromObject(vrm.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());controls.target.copy(center);camera.position.set(center.x,center.y,center.z+Math.max(size.y,1)*1.85);controls.update();
 fallback.remove();photo.remove();status.textContent='Arrastra para girar · rueda para acercar';const clock=new THREE.Clock();const baseY=root.position.y;
 function tick(){if(disposed)return;frame=requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;const intro=cinematic&&motion?1-Math.min(t/1.5,1):0;root.rotation.y=-intro*intro*Math.PI*.65;root.position.y=baseY-intro*.2+(motion?Math.sin(t*1.5)*.015:0);const phase=character.pose??0;const arm=vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');if(arm)arm.rotation.z=-.35+(motion?Math.sin(t*1.8+phase)*.12:0);const left=vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');if(left)left.rotation.z=.35;const head=vrm.humanoid?.getNormalizedBoneNode('head');if(head&&motion)head.rotation.z=Math.sin(t*.8+phase)*.04;vrm.expressionManager?.setValue('happy',.3);vrm.expressionManager?.setValue('blink',motion&&t%4.5>4.3?Math.sin((t%4.5-4.3)/.2*Math.PI):0);vrm.update(dt);controls.update();renderer.render(scene,camera);}tick();
 }catch(error){if(disposed)return;observer?.disconnect();controls?.dispose();renderer?.domElement.remove();renderer?.dispose();status.dataset.missing='true';status.textContent=error.message==='missing'?(hasPhoto?'Retrato del personaje · modelo VRM pendiente':`Sube public/models/${character.file}`):'No se pudo abrir el VRM. Comprueba el archivo y WebGL.';}}
 load();return ()=>{disposed=true;container.removeEventListener('pointermove',pointer);abort.abort();cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();if(vrm)VRMUtils.deepDispose(vrm.scene);renderer?.dispose();container.replaceChildren();};
}
