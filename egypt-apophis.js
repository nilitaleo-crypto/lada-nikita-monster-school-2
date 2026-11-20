/* Tivvig · Egypt I: the sun is swallowed by Apophis.
 * Deterministic phase transitions, responsive pointer buttons, pause-aware animation.
 * A brave scripted loss, not a competence test: the child always advances the story.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const stage=$('egyptScene'),start=$('startRescue'),intro=$('introPrompt'),ending=$('endingActions');
 const message=$('message'),night=$('nightVeil'),sunShadow=$('sunShadow');
 const anchors=[0,1,2].map(i=>$('rayButton'+i));
 const rays=[0,1,2].map(i=>$('ray'+i));
 const heroCount=3;
 const stored='tivvig_egypt_apophis_prologue_v1';
 const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const isCoop=new URLSearchParams(location.search).get('coop')==='1';
 let phase='intro',strength=[1,1,1],presses=[0,0,0],elapsed=0,raf=0,lastTime=0;
 let darkness=0,cinematic=null,serial=0;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function save(){
  try{localStorage.setItem(stored,'unlocked')}catch(e){}
  if(window.TivvigRegistry?.byReward?.[stored])window.TivvigRegistry.unlockReward(stored);
  else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:stored}}));
 }
 function setMessage(text){message.textContent=text}
 function phaseClass(to){stage.dataset.phase=phase=to}
 function updateVisual(){
  const low=strength.reduce((a,x)=>a+x,0)/3;
  rays.forEach((g,i)=>{
   const strengthHere=clamp(strength[i],.035,1);
   g.style.opacity=String(strengthHere);
   anchors[i].style.setProperty('--energy',String(strengthHere));
   anchors[i].classList.toggle('weak',strength[i]<.40);
  });
  if(phase==='playing')darkness=clamp((1-low)*.45 + elapsed*.012,0,.52);
  stage.style.setProperty('--night',String(darkness));
  night.style.opacity=String(darkness);
  sunShadow.style.opacity=String(clamp((1-low)*.40,0,.40));
 }
 function sound(kind){try{void window.TivvigHadesSounds?.play(kind)}catch(e){}}
 function stopLoop(){if(raf){cancelAnimationFrame(raf);raf=0}}
 function loop(now){
  if(phase!=='playing')return;
  const dt=lastTime?clamp((now-lastTime)/1000,0,.080):0;
  lastTime=now;
  if(!document.hidden){
   elapsed+=dt;
   strength=strength.map((s,i)=>clamp(s-dt*(.13+i*.010),0,1));
   updateVisual();
   const pressed=presses.reduce((a,b)=>a+b,0);
   if((pressed>=10 && elapsed>=12)||elapsed>=36){beginCollapse();return}
  }
  raf=requestAnimationFrame(loop);
 }
 function burst(button){
  const origin=button.getBoundingClientRect(),frame=stage.getBoundingClientRect();
  const left=origin.left-frame.left+origin.width/2,top=origin.top-frame.top+origin.height/2;
  for(let i=0;i<(prefersReduced?3:9);i++){
   const spark=document.createElement('i');spark.className='light-spark';
   spark.style.left=left+'px';spark.style.top=top+'px';
   const theta=(Math.PI*2*i/9);
   spark.style.setProperty('--dx',(Math.cos(theta)*34)+'px');
   spark.style.setProperty('--dy',(Math.sin(theta)*34-12)+'px');
   stage.appendChild(spark);
   setTimeout(()=>spark.remove(),prefersReduced?120:700);
  }
 }
 function tapRay(i){
  if(phase!=='playing'||!Number.isInteger(i)||i<0||i>=heroCount)return;
  const btn=anchors[i];
  presses[i]++;strength[i]=clamp(strength[i]+.72,0,1);
  btn.classList.remove('reinforced');void btn.offsetWidth;btn.classList.add('reinforced');
  setTimeout(()=>btn.classList.remove('reinforced'),360);
  burst(btn);updateVisual();sound('success');
  const count=presses.reduce((a,b)=>a+b,0);
  if(count===1)setMessage('Луч снова горит!');
  else if(count===5)setMessage('Держим солнце!');
  else if(count===9)setMessage('Апоп становится сильнее…');
  else setMessage('✦');
  if(count>=10&&elapsed>=12)beginCollapse();
 }
 function begin(){
  if(phase!=='intro')return;
  clearTimeout(cinematic);serial++;
  phaseClass('playing');start.hidden=true;intro.hidden=true;ending.hidden=true;
  strength=[1,1,1];presses=[0,0,0];elapsed=0;darkness=0;
  anchors.forEach(b=>b.hidden=false);$('sunRays').hidden=false;
  setMessage('Поддержи три луча!');
  try{window.TivvigHadesSounds?.prime()}catch(e){}
  updateVisual();lastTime=performance.now();
  stopLoop();raf=requestAnimationFrame(loop);
  sound('tap');
 }
 function beginCollapse(){
  if(phase!=='playing')return;
  stopLoop();const token=++serial;phaseClass('collapse');
  setMessage('Апоп вырывает солнце!');sound('wrong');
  anchors.forEach(b=>b.disabled=true);
  strength=[0,0,0];rays.forEach(r=>r.style.opacity='0');
  stage.style.setProperty('--night','0.92');night.style.opacity='0.92';sunShadow.style.opacity='1';
  cinematic=setTimeout(()=>{
   if(serial!==token)return;
   phaseClass('lost');setMessage('Апоп проглотил солнце!');ending.hidden=false;
   anchors.forEach(b=>b.hidden=true);
   save();sound('finish');
   $('replayEgypt').focus({preventScroll:true});
  },prefersReduced?250:2400);
 }
 function reset(){
  ++serial;clearTimeout(cinematic);stopLoop();lastTime=0;phaseClass('intro');
  darkness=0;strength=[1,1,1];presses=[0,0,0];elapsed=0;
  night.style.opacity='0';sunShadow.style.opacity='0';stage.style.setProperty('--night','0');
  anchors.forEach(b=>{b.hidden=true;b.disabled=false;b.classList.remove('weak','reinforced')});
  rays.forEach(r=>r.style.opacity='1');$('sunRays').hidden=true;
  ending.hidden=true;intro.hidden=false;start.hidden=false;
  setMessage('Персефона спасена — но небо темнеет…');
 }
 function dress(){
  // Use the exact photographic Lada with a separate costume layer.
  // Never regenerate/replace her head or edit the shared selected wardrobe.
  const el=$('egyptLada');if(!el)return;
  el.dataset.outfit='hecate';
 }
 $('startRescue').addEventListener('click',begin);
 anchors.forEach((b,i)=>b.addEventListener('click',()=>tapRay(i)));
 $('replayEgypt').addEventListener('click',reset);
 window.addEventListener('pageshow',()=>{dress();if(phase==='playing'&&!raf){lastTime=performance.now();raf=requestAnimationFrame(loop)}});
 window.addEventListener('tivvig-inventory-changed',dress);
 document.addEventListener('visibilitychange',()=>{lastTime=performance.now()});
 window.addEventListener('pagehide',stopLoop);
 window.TivvigEgyptDebug=Object.freeze({
  state:()=>({phase,energy:[...strength],presses:[...presses],elapsed,darkness,stored:!!localStorage.getItem(stored),isCoop}),
  begin,tap:tapRay,collapse:beginCollapse,reset,
  finishImmediately:()=>{if(phase==='intro')begin();elapsed=36;beginCollapse()}
 });
 reset();dress();
})();