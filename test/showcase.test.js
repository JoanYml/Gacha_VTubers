import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SHOWCASE_DURATION,showcaseFrame,fitModelDistance} from '../src/showcase.js';

test('demo completes its turn, releases the greeting, and restarts without accumulated poses',()=>{
 const first=showcaseFrame(0,0,{demo:true});
 const greeting=showcaseFrame(2,0,{demo:true});
 const last=showcaseFrame(SHOWCASE_DURATION,0,{demo:true});
 assert.notEqual(greeting.bones.rightUpperArm.z,first.bones.rightUpperArm.z);
 assert.equal(last.bones.rightUpperArm.z,first.bones.rightUpperArm.z);
 assert.ok(Math.abs(last.yaw-Math.PI*2)<1e-6);
 assert.deepEqual(showcaseFrame(0,0,{demo:true}),first);
 assert.equal(showcaseFrame(SHOWCASE_DURATION,0).yaw,0);
});
test('all character greetings animate the rig and return valid rotations',()=>{
 for(let variant=0;variant<5;variant++){
  const start=showcaseFrame(0,variant,{demo:true});
  const frame=showcaseFrame(2,variant,{demo:true});
  assert.notDeepEqual(frame.bones,start.bones);
  for(const rotation of Object.values(frame.bones))assert.ok(Object.values(rotation).every(Number.isFinite));
 }
});
test('reduced motion preserves a still pose and camera regardless of time',()=>{
 const still=showcaseFrame(0,2,{demo:true,motion:false});
 for(const t of [1,2,4,6,10]){
  const frame=showcaseFrame(t,2,{demo:true,motion:false});
  for(const [bone,rotation] of Object.entries(frame.bones))for(const axis of ['x','y','z'])assert.ok(Math.abs(rotation[axis]-still.bones[bone][axis])<1e-9);
 }
 assert.equal(still.yaw,0);assert.equal(still.cameraAngle,0);assert.equal(still.lift,0);
});
test('model framing contains both dimensions even in narrow mobile viewports',()=>{
 const size={x:1.4,y:1.8,z:.4},fov=30;
 for(const aspect of [.35,.6,1,1.8]){
  const distance=fitModelDistance(size,fov,aspect),visibleHeight=2*(distance-size.z/2)*Math.tan(fov*Math.PI/360);
  assert.ok(visibleHeight>=size.y);assert.ok(visibleHeight*aspect>=size.x);
 }
 assert.ok(fitModelDistance(size,fov,.35)>fitModelDistance(size,fov,1.8));
});
