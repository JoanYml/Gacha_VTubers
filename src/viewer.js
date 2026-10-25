import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
export function mountViewer(container,character){
 let renderer,vrm,disposed=false,frame,controls;
 const fallback=document.createElement('div');fallback.className='model-placeholder';fallback.style.setProperty('--character',character.color);fallback.innerHTML=`<div class="avatar-halo"></div><div class="avatar-head"></div><div class="avatar-body"></div><span>${character.icon}</span><small>VISTA PREVIA · PLACEHOLDER</small>`;container.append(fallback);
 const status=document.createElement('p');status.className='model-status';status.textContent=`Buscando ${character.file}…`;container.append(status);
 async function load(){try{
 const response=await fetch(`/models/${character.file}`,{method:'HEAD'});if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw Error('missing');
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(container.clientWidth,container.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,container.clientWidth/container.clientHeight,0.01,100);camera.position.set(0,1.2,3.5);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0.9,0);controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x554477,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(1,2,3);scene.add(light);
 const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));const gltf=await loader.loadAsync(`/models/${character.file}`);
 if(disposed){VRMUtils.deepDispose(gltf.scene);return;}vrm=gltf.userData.vrm;if(!vrm)throw Error('invalid');VRMUtils.rotateVRM0(vrm);scene.add(vrm.scene);
 const box=new THREE.Box3().setFromObject(vrm.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());controls.target.copy(center);camera.position.set(center.x,center.y,center.z+Math.max(size.y,1)*1.85);
 fallback.remove();status.textContent='Arrastra para girar · rueda para acercar';const clock=new THREE.Clock();
 function tick(){if(disposed)return;frame=requestAnimationFrame(tick);const t=clock.getElapsedTime();const arm=vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');if(arm)arm.rotation.z=-0.35+Math.sin(t*1.8+character.pose)*0.12;const left=vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');if(left)left.rotation.z=0.35;vrm.scene.position.y=Math.sin(t*1.5)*0.015;vrm.expressionManager?.setValue('happy',0.3);vrm.update(clock.getDelta());controls.update();renderer.render(scene,camera);}tick();
 }catch(error){if(disposed)return;renderer?.domElement.remove();renderer?.dispose();status.textContent=error.message==='missing'?`Sube public/models/${character.file}`:'No se pudo abrir el VRM. Comprueba el archivo y WebGL.';}}
 load();return ()=>{disposed=true;cancelAnimationFrame(frame);controls?.dispose();if(vrm)VRMUtils.deepDispose(vrm.scene);renderer?.dispose();container.replaceChildren();};
}
