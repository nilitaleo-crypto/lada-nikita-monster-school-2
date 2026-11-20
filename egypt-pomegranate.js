/* Egypt II: Persephone's pomegranate road to the Nile.
 * Tap-to-select / tap-to-place controls are touch and keyboard compatible.
 * All state is deterministic so the Firebase room can replay authoritative clicks.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const scene=$('pomegranateScene');
 if(!scene||window.TivvigPomegranateDebug)return;
 const seeds=Array.from({length:6},(_,i)=>$('garden-seed-'+i));
 const beds=Array.from({length:3},(_,i)=>$('garden-bed-'+i));
 const sources=Array.from({length:3},(_,i)=>$('garden-source-'+i));
 const targets=Array.from({length:3},(_,i)=>$('garden-target-'+i));
 const pathEls=Array.from({length:3},(_,i)=>$('rootPath'+i));
 const planted=Array.from({length:3},(_,i)=>$('planted'+i));
 const demands=[1,2,3];
 const matches=[2,0,1]; // eye->eye, lotus->lotus, ankh->ankh
 const reward='tivvig_egypt_pomegranate_portal_v1';
 let phase='intro',chosenSeed=-1,selectedSource=-1,counts=[0,0,0],used=[false,false,false,false,false,false],done=[false,false,false];
 let phaseTimer=null,hintTimer=null,sequence=0;
 const isCoop=new URLSearchParams(location.search).get('coop')==='1';
 function message(s){$('message').textContent=s}
 function signal(t){try{void window.TivvigHadesSounds?.play(t)}catch(e){}}
 function phaseTo(p){phase=p;scene.dataset.phase=p}
 function cancelTimers(){clearTimeout(phaseTimer);clearTimeout(hintTimer);phaseTimer=null;hintTimer=null}
 function setShown(nodes,show){for(const el of nodes)el.hidden=!show}
 function save(){
  try{localStorage.setItem(reward,'unlocked')}catch(e){}
  try{if(window.TivvigRegistry?.byReward?.[reward])window.TivvigRegistry.unlockReward(reward);
      else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:reward}}))}catch(e){}
 }
 function sparkle(el){
  const e=el.getBoundingClientRect(),s=scene.getBoundingClientRect();
  const x=e.left-s.left+e.width/2,y=e.top-s.top+e.height/2;
  for(let i=0;i<6;i++){
   const star=document.createElement('i');star.className='crumb';
   star.style.left=x+'px';star.style.top=y+'px';
   const angle=i*Math.PI/3;
   star.style.setProperty('--dx',Math.round(Math.cos(angle)*29)+'px');
   star.style.setProperty('--dy',Math.round(Math.sin(angle)*29)+'px');
   scene.appendChild(star);setTimeout(()=>star.remove(),520);
  }
 }
 function showPlanting(){
  phaseTo('sow');$('gardenStart').hidden=true;$('seedTray').hidden=false;
  setShown(beds,true);
  message('Нажми на зерно, потом на клумбу с нужным числом листьев');
  refreshSow();
 }
 function refreshSow(){
  for(let i=0;i<seeds.length;i++){
   seeds[i].classList.toggle('used',used[i]);
   seeds[i].classList.toggle('selected',chosenSeed===i&&!used[i]);
   seeds[i].disabled=used[i];seeds[i].setAttribute('aria-pressed',String(chosenSeed===i&&!used[i]));
  }
  for(let i=0;i<3;i++){
   const n=counts[i],goal=demands[i];
   $('count'+i).textContent=n+'/'+goal;
   beds[i].classList.toggle('ready',chosenSeed!==-1&&n<goal);
   beds[i].classList.toggle('filled',n===goal);
   beds[i].disabled=n>=goal;
   planted[i].replaceChildren();
   for(let k=0;k<n;k++)planted[i].appendChild(document.createElement('i'));
  }
 }
 function chooseSeed(i){
  if(phase!=='sow'||used[i])return;
  chosenSeed=i;signal('tap');refreshSow();
  message('Теперь выбери клумбу для этого зерна');
 }
 function plant(bedIndex){
  if(phase!=='sow'||!Number.isInteger(bedIndex)||bedIndex<0||bedIndex>2)return;
  if(chosenSeed<0){message('Сначала коснись гранатового зерна');signal('wrong');return}
  if(counts[bedIndex]>=demands[bedIndex]){message('Здесь уже достаточно зёрен — выбери другую клумбу');signal('wrong');return}
  used[chosenSeed]=true;counts[bedIndex]++;
  chosenSeed=-1;sparkle(beds[bedIndex]);signal('success');refreshSow();
  const total=counts.reduce((a,b)=>a+b,0);
  if(total===6){
   message('Все зёрна посажены! Корни просыпаются…');
   const token=++sequence;
   phaseTimer=setTimeout(()=>{if(sequence===token&&phase==='sow')showRoots()},850);
  }else message('Посажено '+total+' из 6. Продолжай!');
 }
 function showRoots(){
  phaseTo('roots');$('seedTray').hidden=true;setShown(beds,false);
  $('rootNetwork').hidden=false;setShown(sources,true);setShown(targets,true);
  message('Соедини одинаковые знаки: росток наверху и корень внизу');
  signal('success');
 }
 function chooseRoot(i){
  if(phase!=='roots'||done[i])return;
  clearTimeout(hintTimer);
  selectedSource=i;
  sources.forEach((b,k)=>{b.classList.toggle('selected',i===k&&!done[k]);b.setAttribute('aria-pressed',String(i===k))});
  message('Найди такой же знак среди корней внизу');signal('tap');
  const token=sequence;
  hintTimer=setTimeout(()=>{
   if(token!==sequence||phase!=='roots'||selectedSource!==i)return;
   targets[matches[i]].style.boxShadow='0 0 19px 5px #fff7b3';
  },6500);
 }
 function chooseTarget(index){
  if(phase!=='roots')return;
  if(selectedSource===-1){message('Сначала выбери светящийся знак у ростка');signal('wrong');return}
  const src=selectedSource,correct=matches[src];
  if(index!==correct){
   message('Это другой знак — посмотри внимательнее!');signal('wrong');
   targets[index].classList.remove('shake');void targets[index].offsetWidth;targets[index].classList.add('shake');
   return;
  }
  clearTimeout(hintTimer);hintTimer=null;targets[index].style.boxShadow='';
  done[src]=true;selectedSource=-1;
  sources[src].classList.remove('selected');sources[src].classList.add('done');
  targets[index].classList.add('done');
  sources[src].setAttribute('aria-pressed','false');
  pathEls[src].classList.add('complete');
  sparkle(targets[index]);signal('success');
  const n=done.filter(Boolean).length;
  if(n<3){message('Корень нашёл дорогу! Осталось '+(3-n));return}
  message('Все корни соединились! Дерево открывает путь…');
  const token=++sequence;
  phaseTimer=setTimeout(()=>{if(sequence===token&&phase==='roots')finish()},1350);
 }
 function finish(){
  phaseTo('portal');$('gardenFinish').hidden=false;
  setShown([...sources,...targets],false);
  message('Персефона открыла проход к ночному Нилу!');
  save();signal('finish');
 }
 function reset(){
  sequence++;cancelTimers();phaseTo('intro');
  chosenSeed=-1;selectedSource=-1;counts=[0,0,0];
  used=[false,false,false,false,false,false];done=[false,false,false];
  $('gardenStart').hidden=false;$('seedTray').hidden=true;
  $('rootNetwork').hidden=true;$('gardenFinish').hidden=true;
  setShown(beds,false);setShown([...sources,...targets],false);
  for(const b of sources){b.classList.remove('selected','done');b.setAttribute('aria-pressed','false')}
  for(const b of targets){b.classList.remove('done','shake');b.style.boxShadow=''}
  for(const p of pathEls)p.classList.remove('complete');
  refreshSow();
  message('Посади гранатовые зёрна, чтобы открыть дорогу к Египту');
 }
 $('gardenStart').addEventListener('click',showPlanting);
 seeds.forEach((b,i)=>b.addEventListener('click',()=>chooseSeed(i)));
 beds.forEach((b,i)=>b.addEventListener('click',()=>plant(i)));
 sources.forEach((b,i)=>b.addEventListener('click',()=>chooseRoot(i)));
 targets.forEach((b,i)=>b.addEventListener('click',()=>chooseTarget(i)));
 $('gardenReplay').addEventListener('click',reset);
 window.addEventListener('pagehide',cancelTimers);
 window.TivvigPomegranateDebug=Object.freeze({
  state:()=>({phase,counts:[...counts],selectedSeed:chosenSeed,used:[...used],matched:[...done],selectedRoot:selectedSource,stored:(()=>{try{return localStorage.getItem(reward)==='unlocked'}catch(e){return false}})(),isCoop}),
  reset,start:showPlanting,seed:chooseSeed,plant,source:chooseRoot,target:chooseTarget,
  finishImmediately:()=>{if(phase==='intro')showPlanting();counts=[1,2,3];used=Array(6).fill(true);showRoots();done=[true,true,true];finish()}
 });
 reset();
})();