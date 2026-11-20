/* Tivvig · Egypt I: the sun is swallowed by Apophis.
 * Six moving light anchors scatter the child's attention around the sun.
 * The scene is still a brave scripted loss: the child always advances the story.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const stage=$('egyptScene'),start=$('startRescue'),intro=$('introPrompt'),ending=$('endingActions');
 const message=$('message'),night=$('nightVeil'),sunShadow=$('sunShadow');
 const heroCount=6;
 const anchors=[...Array(heroCount)].map((_,i)=>$('rayButton'+i));
 const rays=[...Array(heroCount)].map((_,i)=>$('ray'+i));
 const stored='tivvig_egypt_apophis_prologue_v1';
 const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const isCoop=new URLSearchParams(location.search).get('coop')==='1';
 const svgW=1000,svgH=563;
 const sun={x:500,y:245};
 const basePoints=[
  {x:265,y:215,ampX:28,ampY:18,omega:.95,phase:.2},
  {x:405,y:135,ampX:26,ampY:16,omega:1.12,phase:1.4},
  {x:595,y:135,ampX:26,ampY:16,omega:1.05,phase:2.1},
  {x:735,y:215,ampX:28,ampY:18,omega:.98,phase:3.3},
  {x:360,y:358,ampX:38,ampY:20,omega:1.08,phase:4.0},
  {x:640,y:358,ampX:38,ampY:20,omega:1.02,phase:5.1}
 ];
 let phase='intro',strength=Array(heroCount).fill(1),presses=Array(heroCount).fill(0),elapsed=0,tickTimer=0,lastTime=0,darkness=0,cinematic=null,serial=0;
 let activeSet=new Set([0,2]),nextWave=2.3,waveIndex=0,currentPoints=basePoints.map(p=>({x:p.x,y:p.y}));
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 // Fixed orders keep the visual challenge consistent on both co-op screens.
 const waveOrders=[
  [1,4,0,3,2,5], [0,3,5,2,4,1], [2,5,1,4,3,0],
  [3,1,4,0,5,2], [0,2,5,1,3,4], [4,1,3,5,0,2]
 ];
 function save(){
  try{localStorage.setItem(stored,'unlocked')}catch(e){}
  if(window.TivvigRegistry?.byReward?.[stored])window.TivvigRegistry.unlockReward(stored);
  else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:stored}}));
 }
 function setMessage(text){message.textContent=text}
 function phaseClass(to){stage.dataset.phase=phase=to}
 function computePoint(i){
  const p=basePoints[i],t=elapsed*p.omega+p.phase;
  return {x:p.x+Math.sin(t)*p.ampX,y:p.y+Math.cos(t*1.13)*p.ampY};
 }
 function setAnchorPosition(i,pt){
  anchors[i].style.left=(pt.x/svgW*100)+'%';
  anchors[i].style.top=(pt.y/svgH*100)+'%';
 }
 function setRayPath(i,pt){
  const midX=(sun.x+pt.x)/2;
  const midY=(sun.y+pt.y)/2 + (pt.y>sun.y?16:-16);
  const d=`M ${sun.x} ${sun.y} Q ${midX} ${midY} ${pt.x} ${pt.y}`;
  const [glow,light]=rays[i].querySelectorAll('path');
  glow.setAttribute('d',d); light.setAttribute('d',d);
 }
 function chooseWave(){
  const count=elapsed<8?2:elapsed<18?3:4;
  const pattern=waveOrders[waveIndex % waveOrders.length];
  waveIndex++;
  activeSet=new Set(pattern.slice(0,count));
  setMessage(count>=4?'Сразу несколько лучей гаснут!':'Лучи дрожат!');
 }
 function updateVisual(){
  let lowCount=0;
  let sum=0;
  for(let i=0;i<heroCount;i++){
   const s=clamp(strength[i],.035,1);
   sum+=s;
   if(strength[i]<.45)lowCount++;
   currentPoints[i]=computePoint(i);
   setAnchorPosition(i,currentPoints[i]);
   setRayPath(i,currentPoints[i]);
   rays[i].style.opacity=String(s);
   anchors[i].style.setProperty('--energy',String(s));
   anchors[i].classList.toggle('weak',strength[i]<.42);
  }
  const low=sum/heroCount;
  if(phase==='playing')darkness=clamp((1-low)*.52 + elapsed*.013 + lowCount*.015,0,.63);
  stage.style.setProperty('--night',String(darkness));
  night.style.opacity=String(darkness);
  sunShadow.style.opacity=String(clamp((1-low)*.48,0,.48));
 }
 function sound(kind){try{void window.TivvigHadesSounds?.play(kind)}catch(e){}}
 function stopLoop(){ if(tickTimer){clearInterval(tickTimer); tickTimer=0;} }
 function loop(){
  if(phase!=='playing')return;
  const now=performance.now();
  const dt=lastTime?clamp((now-lastTime)/1000,0,.12):0;
  lastTime=now;
  if(!document.hidden){
   elapsed+=dt;
   if(elapsed>=nextWave){ chooseWave(); nextWave=elapsed+1.65+(waveIndex%3)*.28; }
   for(let i=0;i<heroCount;i++){
    const baseDecay=.026 + i*.0035;
    const surge=activeSet.has(i)?(.12 + Math.abs(Math.sin(elapsed*2.4+i))*0.05):0;
    strength[i]=clamp(strength[i]-dt*(baseDecay+surge),0,1);
   }
   updateVisual();
   const pressed=presses.reduce((a,b)=>a+b,0);
   const lowRays=strength.filter(v=>v<.18).length;
   if((pressed>=18 && elapsed>=14)||lowRays>=4||elapsed>=42){ beginCollapse(); return; }
  }
 }
 function burst(button){
  const origin=button.getBoundingClientRect(),frame=stage.getBoundingClientRect();
  const left=origin.left-frame.left+origin.width/2,top=origin.top-frame.top+origin.height/2;
  const sparks=prefersReduced?4:10;
  for(let i=0;i<sparks;i++){
   const spark=document.createElement('i');spark.className='light-spark';
   spark.style.left=left+'px';spark.style.top=top+'px';
   const theta=(Math.PI*2*i/sparks);
   spark.style.setProperty('--dx',(Math.cos(theta)*34)+'px');
   spark.style.setProperty('--dy',(Math.sin(theta)*34-12)+'px');
   stage.appendChild(spark);
   setTimeout(()=>spark.remove(),prefersReduced?120:700);
  }
 }
 function tapRay(i){
  if(phase!=='playing'||!Number.isInteger(i)||i<0||i>=heroCount)return;
  const btn=anchors[i];
  presses[i]++;
  strength[i]=clamp(strength[i]+(strength[i]<.35?.85:.58),0,1);
  btn.classList.remove('reinforced'); void btn.offsetWidth; btn.classList.add('reinforced');
  setTimeout(()=>btn.classList.remove('reinforced'),360);
  burst(btn); updateVisual(); sound('success');
  const count=presses.reduce((a,b)=>a+b,0);
  if(count===1)setMessage('Лучи начали рушиться!');
  else if(count===6)setMessage('Хорошо! Переводи взгляд дальше!');
  else if(count===12)setMessage('Апоп давит со всех сторон!');
  else if(count===18)setMessage('Ты удержала их сколько могла…');
 }
 function begin(){
  if(phase!=='intro')return;
  clearTimeout(cinematic); serial++;
  phaseClass('playing'); start.hidden=true; intro.hidden=true; ending.hidden=true;
  strength=Array(heroCount).fill(1); presses=Array(heroCount).fill(0); elapsed=0; darkness=0; nextWave=1.8; waveIndex=0; activeSet=new Set([1,4]);
  anchors.forEach(b=>b.hidden=false); $('sunRays').hidden=false;
  setMessage('Поддержи шесть лучей!');
  try{window.TivvigHadesSounds?.prime()}catch(e){}
  updateVisual(); lastTime=performance.now(); stopLoop(); tickTimer=setInterval(loop,75); sound('tap');
 }
 function beginCollapse(){
  if(phase!=='playing')return;
  stopLoop(); const token=++serial; phaseClass('collapse');
  setMessage('Апоп вырывает солнце!'); sound('wrong');
  anchors.forEach(b=>b.disabled=true);
  strength=Array(heroCount).fill(0); rays.forEach(r=>r.style.opacity='0');
  stage.style.setProperty('--night','0.92'); night.style.opacity='0.92'; sunShadow.style.opacity='1';
  cinematic=setTimeout(()=>{
   if(serial!==token)return;
   phaseClass('lost'); setMessage('Апоп проглотил солнце!'); ending.hidden=false;
   anchors.forEach(b=>b.hidden=true);
   save(); sound('finish'); $('replayEgypt').focus({preventScroll:true});
  },prefersReduced?250:2400);
 }
 function reset(){
  ++serial; clearTimeout(cinematic); stopLoop(); lastTime=0; phaseClass('intro');
  darkness=0; strength=Array(heroCount).fill(1); presses=Array(heroCount).fill(0); elapsed=0; activeSet=new Set([0,2]); nextWave=2.3; waveIndex=0;
  night.style.opacity='0'; sunShadow.style.opacity='0'; stage.style.setProperty('--night','0');
  anchors.forEach(b=>{ b.hidden=true; b.disabled=false; b.classList.remove('weak','reinforced'); b.style.left='50%'; b.style.top='50%'; });
  $('sunRays').hidden=true; updateVisual();
  ending.hidden=true; intro.hidden=false; start.hidden=false;
  setMessage('Персефона спасена — но небо темнеет…');
 }
 function dress(){
  const el=$('egyptLada'); if(!el)return; el.dataset.outfit='hecate';
 }
 start.addEventListener('click',begin);
 anchors.forEach((b,i)=>b.addEventListener('click',()=>tapRay(i)));
 $('replayEgypt').addEventListener('click',reset);
 window.addEventListener('pageshow',()=>{ dress(); if(phase==='playing'&&!tickTimer){ lastTime=performance.now(); tickTimer=setInterval(loop,75); } });
 window.addEventListener('tivvig-inventory-changed',dress);
 document.addEventListener('visibilitychange',()=>{ lastTime=performance.now(); });
 window.addEventListener('pagehide',stopLoop);
 window.TivvigEgyptDebug=Object.freeze({
  state:()=>({phase,energy:[...strength],presses:[...presses],elapsed,darkness,active:[...activeSet],waveIndex,stored:!!localStorage.getItem(stored),isCoop,points:currentPoints.map(p=>({...p}))}),
  begin,tap:tapRay,collapse:beginCollapse,reset,
  finishImmediately:()=>{ if(phase==='intro')begin(); elapsed=42; beginCollapse(); }
 });
 reset(); dress();
})();