/* Tivvig: Six bright embossed guardian medallions in the Ibis Temple.
 * The teacher gives physical instructions by video. Room-authoritative clicks only.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const stage=$('motionScene'),button=$('motionAction');
 if(!stage||window.TivvigMotionDebug)return;
 const REWARD='tivvig_egypt_motion_temple_v1';
 const moves=[
  {name:'Ибис',src:'images/egypt-motion-ibis.webp'},
  {name:'Скарабей',src:'images/egypt-motion-scarab.webp'},
  {name:'Кошка',src:'images/egypt-motion-cat.webp'},
  {name:'Крокодил',src:'images/egypt-motion-crocodile.webp'},
  {name:'Анубис',src:'images/egypt-motion-anubis.webp'},
  {name:'Ра',src:'images/egypt-motion-ra.webp'}
 ];
 let phase='intro',finished=0;
 function sound(kind){try{void window.TivvigHadesSounds?.play(kind)}catch(e){}}
 function save(){
  try{localStorage.setItem(REWARD,'unlocked')}catch(e){}
  try{
   if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);
   else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}));
  }catch(e){}
 }
 function outfit(){try{window.TivvigWardrobe?.equip($('motionLada'))}catch(e){}}
 function render(){
  stage.dataset.state=phase;
  const row=$('motionGuardians');
  if(!row.children.length)for(const move of moves){
   const badge=document.createElement('span');badge.className='guardian';
   const pic=document.createElement('img');pic.src=move.src;pic.alt='';pic.draggable=false;
   badge.append(pic);row.append(badge);
  }
  [...row.children].forEach((badge,i)=>{
   badge.classList.toggle('awake',i<finished);
   badge.classList.toggle('current',phase==='playing'&&i===finished);
  });
  $('motionFigure').hidden=phase==='done';
  $('motionReward').hidden=phase!=='done';
  $('motionToMap').hidden=phase!=='done';
  if(phase==='intro'){
   $('motionProgress').textContent='ШЕСТЬ СТРАЖЕЙ';
   $('motionName').textContent='Разбудим храм!';
   $('motionMedallion').src=moves[0].src;
   $('motionMedallion').alt='Ибис';
   button.textContent='Начать';
  }else if(phase==='playing'){
   const move=moves[finished];
   $('motionProgress').textContent=(finished+1)+' / '+moves.length;
   $('motionName').textContent=move.name;
   $('motionMedallion').src=move.src;
   $('motionMedallion').alt=move.name;
   button.textContent='Готово ✓';
  }else{
   $('motionProgress').textContent='6 / 6';
   $('motionName').textContent='Храм ожил!';
   button.textContent='Ещё раз';
  }
 }
 function advance(){
  if(phase==='intro'){phase='playing';finished=0;render();sound('tap');return}
  if(phase==='playing'){
   finished++;
   if(finished>=moves.length){phase='done';save();render();sound('finish')}
   else{render();sound('success')}
   return;
  }
  if(phase==='done'){phase='intro';finished=0;render();sound('tap')}
 }
 button.addEventListener('click',advance);
 window.addEventListener('pageshow',outfit);
 window.addEventListener('tivvig-inventory-changed',outfit);
 window.addEventListener('tivvig-outfit-changed',outfit);
 window.TivvigMotionDebug=Object.freeze({
  state:()=>({phase,finished,count:moves.length,reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
  advance,reset:()=>{phase='intro';finished=0;render()}
 });
 render();outfit();
})();