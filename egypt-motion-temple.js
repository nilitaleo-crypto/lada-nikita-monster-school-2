/* Тиввиг: Храм оживших статуй.
 * Движение происходит вне экрана под видеонаблюдением педагога.
 * Подтверждение — детерминированные кнопки, воспроизводимые Firebase-мостом.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const scene=$('motionScene'),button=$('motionAction');
if(!scene||window.TivvigMotionDebug)return;
const REWARD='tivvig_egypt_motion_temple_v1';
const moves=[
 {name:'Ибис',short:'КРЫЛЬЯ',hint:'Руки в стороны. Постой на одной ноге до трёх.',pose:'ibis',sign:'𓅃'},
 {name:'Скарабей',short:'СИЛА',hint:'Сделай три приседания.',pose:'scarab',sign:'𓆣'},
 {name:'Кошка',short:'ПОТЯНИСЬ',hint:'Подними руки высоко и потянись, как кошка.',pose:'cat',sign:'𓃠'},
 {name:'Крокодил',short:'ШАГИ',hint:'Сделай два шага влево и два вправо.',pose:'croc',sign:'𓆌'},
 {name:'Анубис',short:'ПОВОРОТЫ',hint:'Плавно повернись налево и направо.',pose:'jackal',sign:'𓃥'},
 {name:'Ра',short:'СОЛНЦЕ',hint:'Хлопни четыре раза. Сделай большой круг руками.',pose:'ra',sign:'☀'}
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
function dress(){try{window.TivvigWardrobe?.equip($('motionLada'))}catch(e){}}
function render(){
 scene.dataset.state=phase;
 const row=$('motionGuardians');
 if(!row.children.length)for(let i=0;i<moves.length;i++){
  const stone=document.createElement('span');
  stone.className='guardian';
  stone.textContent=moves[i].sign;
  stone.setAttribute('aria-hidden','true');
  row.append(stone);
 }
 [...row.children].forEach((stone,i)=>stone.classList.toggle('awake',i<finished));
 $('motionReward').hidden=phase!=='done';
 $('motionToMap').hidden=phase!=='done';
 $('motionFigure').hidden=phase==='done';
 if(phase==='intro'){
  $('motionProgress').textContent='НОВАЯ ЗАДАЧА · ДВИГАЙСЯ ВМЕСТЕ СО СТРАЖАМИ';
  $('motionName').textContent='Разбудим статуи!';
  $('motionInstruction').textContent='Встань перед камерой. Повторяй движения!';
  $('motionFigure').dataset.pose='intro';
  button.textContent='Начать!';
 }else if(phase==='playing'){
  const m=moves[finished];
  $('motionProgress').textContent='СТРАЖ '+(finished+1)+' ИЗ '+moves.length;
  $('motionName').textContent=m.name+' · '+m.short;
  $('motionInstruction').textContent=m.hint;
  $('motionFigure').dataset.pose=m.pose;
  button.textContent='Сделала! ✓';
 }else{
  $('motionProgress').textContent='ВСЕ СТРАЖИ ПРОСНУЛИСЬ';
  $('motionName').textContent='Храм ожил!';
  $('motionInstruction').textContent='Ты получила амулет движения!';
  button.textContent='Сыграть ещё';
 }
}
function advance(){
 if(phase==='intro'){phase='playing';finished=0;render();sound('tap');return}
 if(phase==='playing'){
  finished++;
  if(finished>=moves.length){phase='done';save();render();sound('finish');}
  else {render();sound('success')}
  return;
 }
 if(phase==='done'){phase='intro';finished=0;render();sound('tap')}
}
button.addEventListener('click',advance);
window.addEventListener('pageshow',dress);
window.addEventListener('tivvig-inventory-changed',dress);
window.addEventListener('tivvig-outfit-changed',dress);
window.TivvigMotionDebug=Object.freeze({
 state:()=>({phase,finished,count:moves.length,reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
 advance,reset:()=>{phase='intro';finished=0;render()}
});
render();dress();
})();