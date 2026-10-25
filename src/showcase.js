export const SHOWCASE_DURATION=7;
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

// Fit both axes, including narrow mobile viewers. size is measured in a relaxed pose.
export function fitModelDistance(size,verticalFov,aspect){
 const tangent=Math.tan(verticalFov*Math.PI/360);
 return Math.max(size.y/(2*tangent),size.x/(2*tangent*Math.max(aspect,.1)))*1.22+size.z/2;
}

// Absolute, deterministic poses avoid accumulating rotations across demo replays.
export function showcaseFrame(time,variant=0,{demo=false,motion=true}={}){
 const t=Math.max(0,time),phase=variant%5;
 const wave=demo&&motion?smooth((t-1.1)/.5)*(1-smooth((t-3.2)/.6)):0;
 const entrance=demo&&motion?1-smooth(t/1.2):0;
 const turn=demo&&motion?smooth((t-3.8)/2.5):0;
 const activeRight=phase!==1,activeLeft=phase===1||phase===2;
 const right=activeRight?wave:0,left=activeLeft?wave:0;
 const sway=motion?Math.sin(t*1.5+phase):0;
 return {
  phase:!demo?'idle':t<1.2?'entrance':t<3.8?'greeting':t<6.3?'turn':'finish',
  yaw:-entrance*.9+turn*Math.PI*2,
  cameraAngle:demo&&motion?Math.sin(clamp(t/SHOWCASE_DURATION)*Math.PI)*.16:0,
  lift:motion?Math.sin(t*1.5)*.008:0,
  bones:{
   rightUpperArm:{x:-right*.18,y:0,z:1.15-right*1.65},
   leftUpperArm:{x:-left*.18,y:0,z:-1.15+left*1.65},
   rightLowerArm:{x:0,y:right*.45,z:-right*.65},
   leftLowerArm:{x:0,y:-left*.45,z:left*.65},
   rightHand:{x:0,y:0,z:right*Math.sin(t*(phase===3?11:8))*.28},
   leftHand:{x:0,y:0,z:left*Math.sin(t*8)*.28},
   head:{x:phase===4?wave*.13:0,y:Math.sin(t*.8)*.03*(motion?1:0),z:sway*.025},
   chest:{x:phase===4?wave*.04:0,y:0,z:sway*.012}
  },
  happy:.25+wave*.3,
  blink:motion&&t%4.5>4.3?Math.sin((t%4.5-4.3)/.2*Math.PI):0
 };
}
