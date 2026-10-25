// Original synthesized effects: no downloaded audio or autoplay.
let context,master,enabled=localStorage.getItem('vtuber-sound')!=='off';
let volume=Number(localStorage.getItem('vtuber-volume')??0.4);
if(!Number.isFinite(volume))volume=.4;volume=Math.max(0,Math.min(1,volume));
const voices=new Set();
export function audioSettings(){return {enabled,volume};}
export function unlockAudio(){try{context??=new (window.AudioContext||window.webkitAudioContext)();if(!master){master=context.createGain();master.connect(context.destination);}master.gain.value=enabled?volume:0;return context.resume().catch(()=>{});}catch{/* Sound is optional when Web Audio is unavailable. */}}
export function setSound(value){enabled=value;localStorage.setItem('vtuber-sound',value?'on':'off');unlockAudio();return enabled;}
export function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));localStorage.setItem('vtuber-volume',String(volume));if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.04);}
function tone(frequency,time,duration,type='sine',gain=.13,endFrequency){const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);if(endFrequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,time+duration);envelope.gain.setValueAtTime(.0001,time);envelope.gain.exponentialRampToValueAtTime(gain,time+.015);envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);oscillator.connect(envelope);envelope.connect(master);oscillator.start(time);oscillator.stop(time+duration+.03);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};}
function sweep(time,duration,gain=.1){const size=Math.ceil(context.sampleRate*duration),buffer=context.createBuffer(1,size,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/size);const source=context.createBufferSource(),filter=context.createBiquadFilter(),envelope=context.createGain();source.buffer=buffer;filter.type='bandpass';filter.Q.value=.7;filter.frequency.setValueAtTime(200,time);filter.frequency.exponentialRampToValueAtTime(5000,time+duration);envelope.gain.value=gain;source.connect(filter);filter.connect(envelope);envelope.connect(master);source.start(time);source.stop(time+duration);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();envelope.disconnect();};}
export function stopSound(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
export function sound(cue,rarity=3){if(!enabled||!context||context.state!=='running')return;const t=context.currentTime;
 if(cue==='click'){tone(780,t,.09,'sine',.08);tone(1170,t+.03,.08,'sine',.04);}
 if(cue==='wish'){sweep(t,2.5,.2);tone(130.81,t,2.8,'triangle',.1,523.25);[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,t+.3+i*.28,1,'sine',.07));}
 if(cue==='reveal'){sweep(t,.5,.14);const notes=rarity===5?[261.63,329.63,392,523.25,659.25,783.99,1046.5]:rarity===4?[293.66,349.23,440,587.33]:[392,493.88,587.33];notes.forEach((f,i)=>tone(f,t+i*.085,rarity===5?1.9:.8,'sine',rarity===5?.1:.07));tone(65.4,t,1,'triangle',.16);}
 if(cue==='summary'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,t+i*.1,.8,'sine',.07));}
}
