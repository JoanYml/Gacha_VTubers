export const characters = [
 {id:'gabu',name:'Gabu Yml',file:'Modelo_01.vrm',image:'/images/characters/Modelo_01.png',color:'#8bdcff',icon:'✧',title:'El eco del cielo',pose:0},
 {id:'antilia',name:'AntiliaVT',file:'Modelo_02.vrm',image:'/images/characters/Modelo_02.png',color:'#bf96ff',icon:'☽',title:'La guardiana lunar',pose:1},
 {id:'durazno',name:'DuraznoKyun',file:'Modelo_03.vrm',image:'/images/characters/Modelo_03.png',color:'#ffb28d',icon:'❀',title:'Un dulce amanecer',pose:2},
 {id:'nada',name:'NadaLaPiñata',file:'Modelo_04.vrm',image:'/images/characters/Modelo_04.png',color:'#ff91ca',icon:'❖',title:'Una fiesta de estrellas',pose:3},
 {id:'yuzu',name:'Yuzu',file:'Modelo_05.vrm',image:'/images/characters/Modelo_05.png',color:'#d6ef97',icon:'✦',title:'La chispa del bosque',pose:4}
];
export const materials=[{id:'stick',name:'Palito de aventura',icon:'╱',stars:3},{id:'stone',name:'Piedra sospechosa',icon:'⬟',stars:3},{id:'ore',name:'Mineral lunar',icon:'◈',stars:4},{id:'leaf',name:'Hoja del destino',icon:'❧',stars:3},{id:'crystal',name:'Cristal violeta',icon:'♦',stars:4}];
export const freshState=()=>({gems:16000,pity:0,total:0,inventory:{},history:[]});
export function pull(state,count,rng=Math.random){
 if(![1,10].includes(count)||state.gems<count*160) throw Error('No hay suficientes cristales.');
 const next=structuredClone(state),results=[]; next.gems-=count*160;
 for(let i=0;i<count;i++){
  next.pity++;
  const five=next.pity>=80||rng()<0.05;
  const reward=five?{...characters[Math.floor(rng()*characters.length)],stars:5,type:'character'}:{...materials[Math.min(materials.length-1,Math.floor(rng()*materials.length))],type:'material'};
  if(five)next.pity=0;
  reward.isNew=!next.inventory[reward.id]; next.inventory[reward.id]=(next.inventory[reward.id]||0)+1;
  next.total++; results.push(reward);
 }
 next.history=[...results.map(r=>({id:r.id,name:r.name,stars:r.stars})),...next.history].slice(0,100);
 return {state:next,results};
}
export function restoreState(raw){try{const s=JSON.parse(raw);if(!s||!Number.isSafeInteger(s.gems)||s.gems<0||!Number.isInteger(s.pity)||s.pity<0||s.pity>=80||!Number.isSafeInteger(s.total)||s.total<0||!s.inventory||typeof s.inventory!=='object'||!Array.isArray(s.history))return freshState();const ids=new Set([...characters,...materials].map(c=>c.id));s.inventory=Object.fromEntries(Object.entries(s.inventory).filter(([id,n])=>ids.has(id)&&Number.isSafeInteger(n)&&n>0));s.history=s.history.filter(r=>ids.has(r.id)).slice(0,100);return s;}catch{return freshState();}}
