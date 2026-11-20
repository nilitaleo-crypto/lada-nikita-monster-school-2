/* Egypt II: Golden snakes hide the memories.
 * A single, readable memory game: all cards start open, then snakes close them.
 * When every pair is found, Persephone's portal opens.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const scene=$('pomegranateScene');
 if(!scene||window.TivvigPomegranateDebug)return;
 const board=$('memoryBoard');
 const reward='tivvig_egypt_pomegranate_portal_v1';
 const cardsData=[
  {key:'gnomes',label:'Гномы',src:'images/gnome-bantik.webp',fit:'contain'},
  {key:'snowman',label:'Снежный человек',src:'images/gnome-clues-snowman.webp',fit:'cover'},
  {key:'merfolk',label:'Русал',src:'images/merman-transformation.webp',fit:'cover'},
  {key:'cerberus',label:'Цербер',src:'images/cerberus-clever.webp',fit:'cover'},
  {key:'persephone',label:'Персефона',src:'images/hades-persephone-portrait.webp',fit:'cover'},
  {key:'hecate',label:'Геката и лира',src:'images/hecate-lyre-reward.webp',fit:'cover'},
  {key:'forge',label:'Огненные часы',src:'images/hades-fire-clock.webp',fit:'cover'},
  {key:'charon',label:'Монеты Харона',src:'images/coins-reward.webp',fit:'cover'}
 ];
 const deck=[];
 cardsData.forEach((item,idx)=>{deck.push({...item,uid:idx*2});deck.push({...item,uid:idx*2+1})});
 // Deterministic order for co-op consistency.
 const order=[0,9,4,13,2,11,6,15,1,8,5,12,3,10,7,14];
 const snakes=[$('snakeA'),$('snakeB'),$('snakeC')];
 let cards=[];
 let phase='intro',selected=[],matched=new Set(),moves=0,lock=false,timer=null,revealTimer=null,run=0;
 const isCoop=new URLSearchParams(location.search).get('coop')==='1';
 function msg(t){$('message').textContent=t}
 function signal(t){try{void window.TivvigHadesSounds?.play(t)}catch(e){}}
 function clearTimers(){clearTimeout(timer);clearTimeout(revealTimer);timer=revealTimer=null}
 function save(){
  try{localStorage.setItem(reward,'unlocked')}catch(e){}
  try{if(window.TivvigRegistry?.byReward?.[reward])window.TivvigRegistry.unlockReward(reward);
      else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:reward}}))}catch(e){}
 }
 function spawnSparkles(el){
  const r=el.getBoundingClientRect(),s=scene.getBoundingClientRect();
  const x=r.left-s.left+r.width/2,y=r.top-s.top+r.height/2;
  for(let i=0;i<6;i++){
   const star=document.createElement('i');star.style.cssText='position:absolute;left:'+x+'px;top:'+y+'px;z-index:23;width:6px;height:6px;border-radius:50%;background:#fff2be;box-shadow:0 0 10px #ffe083;pointer-events:none';
   const dx=Math.round(Math.cos(i*Math.PI/3)*28),dy=Math.round(Math.sin(i*Math.PI/3)*28);
   star.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.1)`,opacity:0}],{duration:500,easing:'ease-out'});
   scene.appendChild(star);setTimeout(()=>star.remove(),520);
  }
 }
 function renderBoard(){
  board.replaceChildren();
  cards=order.map((deckIndex,pos)=>{
    const item=deck[deckIndex];
    const btn=document.createElement('button');
    btn.type='button';btn.className='memory-card revealed';btn.id='memory-card-'+pos;
    btn.dataset.index=String(pos);btn.dataset.key=item.key;btn.dataset.tivvigSound='manual';
    btn.setAttribute('aria-label','Карточка '+(pos+1));
    btn.innerHTML=`<span class="card-hint"></span><span class="inner"><span class="face back"></span><span class="face front"><img class="memory-art" src="${item.src}" alt="" loading="eager" decoding="async" draggable="false" style="object-fit:${item.fit}"></span></span>`;
    btn.addEventListener('click',()=>pick(pos));
    board.appendChild(btn);
    return {btn,item,revealed:true,matched:false};
  });
 }
 function setPhase(p){phase=p;scene.dataset.phase=p}
 function flipAll(faceUp){cards.forEach(c=>{c.revealed=faceUp;c.btn.classList.toggle('revealed',faceUp||c.matched);c.btn.classList.toggle('matched',c.matched);c.btn.disabled=c.matched})}
 function begin(){
   clearTimers();run++;matched.clear();selected=[];moves=0;lock=false;
   setPhase('memorize');$('memoryStart').hidden=true;$('memoryFinish').hidden=true;board.hidden=false;
   renderBoard();flipAll(true);msg('Запоминай картинки! Сейчас золотые змейки их закроют.');signal('tap');
   const current=run;
   revealTimer=setTimeout(()=>{if(run===current)closeBySnakes()},3800);
 }
 function closeBySnakes(){
   if(phase!=='memorize')return;setPhase('closing');lock=true;msg('Золотые змейки всё переворачивают!');signal('wrong');
   snakes.forEach((s,i)=>{s.hidden=false;s.classList.remove('run');void s.offsetWidth;s.classList.add('run');setTimeout(()=>{s.hidden=true;s.classList.remove('run')},720+i*40)});
   timer=setTimeout(()=>{
     cards.forEach((c,i)=>{if(!c.matched){c.revealed=false;c.btn.classList.remove('revealed');c.btn.setAttribute('aria-label','Закрытая карточка '+(i+1))}});
     setPhase('play');lock=false;msg('Открывай по две карточки и ищи пары!');signal('tap');
   },760);
 }
 function pick(index){
   if(phase!=='play'||lock)return;
   const c=cards[index];
   if(!c||c.matched||c.revealed)return;
   c.revealed=true;c.btn.classList.add('revealed');c.btn.setAttribute('aria-label',c.item.label);selected.push(index);signal('tap');
   if(selected.length<2)return;
   lock=true;moves++;
   const [a,b]=selected.map(i=>cards[i]);
   if(a.item.key===b.item.key){
      a.matched=b.matched=true;matched.add(a.item.key);a.btn.classList.add('matched');b.btn.classList.add('matched');a.btn.disabled=true;b.btn.disabled=true;spawnSparkles(a.btn);spawnSparkles(b.btn);signal('success');
      selected=[];lock=false;
      msg(matched.size<cardsData.length?'Пара найдена! Осталось '+(cardsData.length-matched.size):'Все воспоминания вернулись!');
      if(matched.size===cardsData.length){lock=true;timer=setTimeout(finish,900)}
      return;
   }
   msg('Это не пара. Запомни и попробуй снова!');signal('wrong');
   timer=setTimeout(()=>{
      a.revealed=b.revealed=false;a.btn.classList.remove('revealed');b.btn.classList.remove('revealed');a.btn.setAttribute('aria-label','Закрытая карточка '+(cards.indexOf(a)+1));b.btn.setAttribute('aria-label','Закрытая карточка '+(cards.indexOf(b)+1));selected=[];lock=false;
   },850);
 }
 function finish(){
   setPhase('done');lock=true;msg('Ты вспомнила всё — портал в Египет открылся!');$('memoryFinish').hidden=false;save();signal('finish');
 }
 function reset(){
   clearTimers();run++;matched=new Set();selected=[];moves=0;lock=false;setPhase('intro');
   $('memoryStart').hidden=false;$('memoryFinish').hidden=true;board.hidden=true;board.replaceChildren();
   snakes.forEach(s=>{s.hidden=true;s.classList.remove('run')});
   msg('Запомни картинки. Потом змейки их закроют, и нужно будет найти пары.');
 }
 $('memoryStart').addEventListener('click',begin);
 $('memoryReplay').addEventListener('click',reset);
 window.addEventListener('pagehide',clearTimers);
 window.TivvigPomegranateDebug=Object.freeze({
   state:()=>({phase,matched:[...matched],selected:[...selected],moves,stored:(()=>{try{return localStorage.getItem(reward)==='unlocked'}catch(e){return false}})(),isCoop,cards:cards.map(c=>({key:c.item.key,revealed:c.revealed,matched:c.matched}))}),
   start:begin,close:closeBySnakes,pick,reset,
   finishImmediately:()=>{
     if(phase==='intro')begin();
     clearTimers();
     if(phase==='memorize')closeBySnakes();
     clearTimers();
     cards.forEach((c,i)=>{c.revealed=true;c.matched=true;c.btn.classList.add('revealed','matched');c.btn.disabled=true});
     matched=new Set(cardsData.map(x=>x.key));
     finish();
   }
 });
 reset();
})();