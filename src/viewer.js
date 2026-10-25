import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
import {setCharacterImage} from './images.js';
import {SHOWCASE_DURATION,fitModelDistance,showcaseFrame} from './showcase.js';

export function mountViewer(container,character,{cinematic=false}={}){
 let renderer,scene,vrm,frame,controls,observer,disposed=false,hasPhoto=false,loadFailure;
 let demo=cinematic,hasPlayed=false,started=0,distance=3,targetY=1;
 const motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const abort=new AbortController();
 container.dataset.viewer='loading';
 container.style.setProperty('--character',character.color);
 const fallback=document.createElement('div');
 fallback.className='model-placeholder';
 fallback.innerHTML=`<div class="avatar-halo"></div><div class="avatar-head"></div><div class="avatar-body"></div><span>${character.icon}</span><small>VISTA PREVIA · PLACEHOLDER</small>`;
 const photo=document.createElement('img');
 photo.className='character-splash';photo.alt=character.name;photo.hidden=true;
 const status=document.createElement('p');status.className='model-status';status.setAttribute('role','status');
 status.textContent=`Preparando la demostración de ${character.name}…`;
 const toolbar=document.createElement('div');toolbar.className='viewer-toolbar';toolbar.hidden=true;
 const progress=document.createElement('div');progress.className='demo-progress';progress.setAttribute('aria-hidden','true');
 const demoButton=document.createElement('button');demoButton.type='button';demoButton.className='demo-toggle';
 toolbar.append(progress,demoButton);container.append(fallback,photo,status,toolbar);

 function fallbackStatus(){
  container.dataset.viewer=hasPhoto?'portrait':'placeholder';
  if(loadFailure==='missing')status.textContent=hasPhoto?'Ilustración del personaje · añade su VRM para ver la demostración':`Añade public/models/${character.file} para ver la demostración`;
  else status.textContent='No se pudo abrir la demostración 3D. Comprueba el VRM y WebGL.';
 }
 const cancelPhoto=setCharacterImage(photo,character,{
  onLoad(){if(disposed)return;hasPhoto=true;fallback.hidden=true;if(loadFailure)fallbackStatus();},
  onMissing(){photo.hidden=true;}
 });
 const pointer=event=>{
  if(!motion||container.dataset.viewer==='demo'||container.dataset.viewer==='interactive')return;
  const rect=container.getBoundingClientRect();
  container.style.setProperty('--tilt-x',`${-((event.clientY-rect.top)/rect.height-.5)*8}deg`);
  container.style.setProperty('--tilt-y',`${((event.clientX-rect.left)/rect.width-.5)*12}deg`);
 };
 container.addEventListener('pointermove',pointer);
 function release3D(){
  cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();
  if(scene){VRMUtils.deepDispose(scene);scene=null;}
  renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();renderer=null;
 }
 function updateDemoUI(phase){
  const labels={entrance:'Entrada',greeting:'Saludo',turn:'Giro de presentación',finish:'Pose final'};
  container.dataset.viewer=demo?'demo':'interactive';
  demoButton.textContent=demo?'Omitir demostración':hasPlayed?'↻ Repetir demostración':'▶ Ver demostración';
  demoButton.disabled=!motion;
  progress.hidden=!demo;
  const text=demo?`Demostración · ${labels[phase]||'Entrada'}`:motion?'Arrastra para girar · rueda para acercar':'Movimiento reducido · arrastra para girar';
  if(status.textContent!==text)status.textContent=text;
 }
 function endDemo(){demo=false;if(controls)controls.enabled=true;updateDemoUI();}

 async function load(){
  try{
   const response=await fetch(`/models/${character.file}`,{method:'HEAD',signal:abort.signal});
   if(disposed)return;
   if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw Error('missing');
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.domElement.setAttribute('aria-label',`Modelo 3D de ${character.name}`);
   container.append(renderer.domElement);
   scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(30,1,.01,100);
   controls=new OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;controls.enablePan=false;
   scene.add(new THREE.HemisphereLight(0xffffff,0x554477,3));
   const light=new THREE.DirectionalLight(0xfff2dc,3);light.position.set(1,2,3);scene.add(light);
   const rim=new THREE.DirectionalLight(character.color,3);rim.position.set(-2,1,-2);scene.add(rim);
   const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
   const gltf=await loader.loadAsync(`/models/${character.file}`);
   if(disposed){VRMUtils.deepDispose(gltf.scene);return;}
   vrm=gltf.userData.vrm;
   if(!vrm){VRMUtils.deepDispose(gltf.scene);throw Error('invalid');}
   VRMUtils.rotateVRM0(vrm);
   function applyPose(pose){
    for(const [name,rotation] of Object.entries(pose.bones)){
     const bone=vrm.humanoid?.getNormalizedBoneNode(name);
     if(bone)bone.rotation.set(rotation.x,rotation.y,rotation.z);
    }
    vrm.expressionManager?.setValue('happy',pose.happy);
    vrm.expressionManager?.setValue('blink',pose.blink);
   }
   applyPose(showcaseFrame(0,character.pose,{motion:false}));vrm.update(0);
   const box=new THREE.Box3().setFromObject(vrm.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   const fullBox=box.clone();
   applyPose(showcaseFrame(2,character.pose,{demo:true}));vrm.update(0);
   fullBox.union(new THREE.Box3().setFromObject(vrm.scene));
   applyPose(showcaseFrame(0,character.pose,{motion:false}));vrm.update(0);
   const fullSize=fullBox.getSize(new THREE.Vector3());
   const fitSize={x:Math.max(fullSize.x,fullSize.z)*1.08,y:Math.max(size.y,.2),z:fullSize.z};
   const pivot=new THREE.Group(),offset=new THREE.Group();
   offset.position.set(-center.x,-box.min.y,-center.z);offset.add(vrm.scene);pivot.add(offset);scene.add(pivot);
   targetY=size.y*.52;
   // A small luminous stage grounds the model while the camera moves around it.
   const platform=new THREE.Group();scene.add(platform);
   for(let i=0;i<2;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(size.y*(.29+i*.055),size.y*.002,6,96),new THREE.MeshBasicMaterial({color:character.color,transparent:true,opacity:.5-i*.15}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.002;platform.add(ring);
   }
   function resize(){
    if(!renderer)return;
    const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
    distance=fitModelDistance(fitSize,camera.fov,camera.aspect);
    controls.minDistance=distance*.35;controls.maxDistance=distance*3;
    controls.target.set(0,targetY,0);camera.position.set(0,targetY,distance);controls.update();
   }
   observer=new ResizeObserver(resize);observer.observe(container);resize();
   cancelPhoto();fallback.remove();photo.remove();toolbar.hidden=false;
   const clock=new THREE.Clock();
   demo=cinematic&&motion;hasPlayed=demo;controls.enabled=!demo;updateDemoUI('entrance');
   demoButton.onclick=()=>{
    if(demo){endDemo();return;}
    if(!motion)return;
    demo=true;hasPlayed=true;started=clock.elapsedTime;controls.enabled=false;
    controls.target.set(0,targetY,0);camera.position.set(0,targetY,distance);controls.update();updateDemoUI('entrance');
   };
   // Dragging takes over immediately; continuing the gacha never waits for the demo.
   renderer.domElement.addEventListener('pointerdown',()=>{if(demo)endDemo();},{capture:true});
   function tick(){
    if(disposed||!renderer)return;
    frame=requestAnimationFrame(tick);
    const delta=Math.min(clock.getDelta(),.05),elapsed=clock.elapsedTime,demoTime=elapsed-started;
    if(demo&&demoTime>=SHOWCASE_DURATION)endDemo();
    const pose=showcaseFrame(demo?demoTime:elapsed,character.pose,{demo,motion});
    applyPose(pose);pivot.rotation.y=demo?pose.yaw:0;pivot.position.y=pose.lift*size.y;
    if(demo){
     camera.position.set(Math.sin(pose.cameraAngle)*distance,targetY,Math.cos(pose.cameraAngle)*distance);
     camera.lookAt(0,targetY,0);progress.style.setProperty('--progress',`${Math.min(demoTime/SHOWCASE_DURATION,1)*100}%`);updateDemoUI(pose.phase);
    }
    vrm.update(delta);controls.update();renderer.render(scene,camera);
   }
   tick();
  }catch(error){
   if(disposed)return;
   release3D();toolbar.hidden=true;loadFailure=error.message;fallbackStatus();
  }
 }
 load();
 return ()=>{
  disposed=true;abort.abort();cancelPhoto();container.removeEventListener('pointermove',pointer);
  release3D();container.replaceChildren();
 };
}
