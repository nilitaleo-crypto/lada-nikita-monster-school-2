/* Egypt School: three integrated math adventures.
   All input is via native, stable-ID buttons so Firebase replays exactly the same action. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const rounds={
 mathScale:[{left:2,total:5,values:[1,2,3,4],ok:2},{left:3,total:7,values:[2,3,4,5],ok:2}],
 mathChest:[{total:5,available:8},{total:7,available:9}],
 mathBridge:[{values:[3,7,1,5],order:[2,0,3,1]},{values:[6,2,8,4],order:[1,3,0,2]}]
};
let round=0,picked=new Set(),wrong=-1,finished=false;
const state=()=>({round,picked:[...picked],wrong,finished});
function reset(){round=0;picked=new Set();wrong=-1;finished=false}
function hit(type,i){
 if(finished||!rounds[type]||!Number.isInteger(i)||i<0)return {changed:false};
 const task=rounds[type][round];wrong=-1;let correct=false;
 if(type==='mathScale'){
  if(i>=task.values.length)return {changed:false};
  correct=i===task.ok;if(!correct)wrong=i;
 }else if(type==='mathChest'){
  if(i>=task.available||picked.has(i))return {changed:false};
  picked.add(i);correct=picked.size>=task.total;
 }else{
  if(i>=task.values.length||picked.has(i))return {changed:false};
  if(i===task.order[picked.size]){picked.add(i);correct=picked.size===task.order.length}
  else wrong=i;
 }
 if(correct){
  if(round+1===rounds[type].length)finished=true;
  else{round++;picked=new Set();wrong=-1}
 }
 return {changed:true,complete:finished,correct,wrong:wrong>=0,progress:!correct&&wrong<0};
}
function draw(type){
 const root=$('schoolMathGame');
 if(!root||!rounds[type])return;
 const task=rounds[type][round],icon='images/egypt-fox-friend.webp';
 const button=(i,contents,extra='',aria='')=>
  '<button type="button" id="schoolMathChoice'+i+'" data-math-choice="'+i+'" class="math-game__choice '+extra+(wrong===i?' is-wrong':'')+(picked.has(i)?' is-set':'')+'"'+(picked.has(i)?' disabled':'')+' aria-label="'+aria+'">'+contents+'</button>';
 const title=(label)=>{$('schoolQuestion').textContent=label};
 let html='<span class="math-game__round">'+(round+1)+' / '+rounds[type].length+'</span>';
 if(type==='mathScale'){
  title('Уравновесь весы');
  html+='<div class="math-game__art"><span class="math-sprite math-sprite--scale" role="img" aria-label="Золотые весы"></span>'+
   '<div class="math-game__sum">'+task.left+' + ? = '+task.total+'</div></div>'+
   '<div class="math-game__choices">'+task.values.map((v,i)=>button(i,'<span class="math-sprite math-sprite--weight" aria-hidden="true"></span><span>'+v+'</span>','math-game__choice--weight','Гиря '+v)).join('')+'</div>';
 }else if(type==='mathChest'){
  title('Положи '+task.total+' монет');
  html+='<div class="math-game__art"><span class="math-sprite math-sprite--chest" role="img" aria-label="Сундук с сокровищами"></span>'+
   '<img class="math-game__friend" src="images/egypt-tutenstein.webp" draggable="false" alt="Тутенштейн">'+
   '<span class="math-game__counter" aria-live="polite">'+picked.size+' / '+task.total+'</span></div>'+
   '<div class="math-game__choices">'+Array.from({length:task.available},(_,i)=>button(i,'<span class="math-sprite math-sprite--coin" aria-hidden="true"></span>','math-game__choice--coin','Монета '+(i+1))).join('')+'</div>';
 }else{
  title(round===0?'Построй мост: 1, 3, 5, 7':'Построй мост: 2, 4, 6, 8');
  html+='<div class="math-game__bridge" style="--steps:'+picked.size+'">'+
   '<img class="math-game__friend" src="'+icon+'" draggable="false" alt="Пёсель шагает по мосту">'+
   '<div class="math-game__bridge-track"></div><div class="math-game__stones">'+
   task.values.map((v,i)=>button(i,'<span class="math-sprite math-sprite--stone" aria-hidden="true"></span><strong>'+v+'</strong>','math-game__choice--stone','Каменная плита '+v)).join('')+'</div></div>';
 }
 root.innerHTML=html;
 $('schoolFeedback').textContent=finished?'Отлично! ✨':wrong>=0?'Попробуй ещё':type==='mathScale'?'Выбери гирю':type==='mathChest'?'Касайся монет':'Нажимай по порядку';
}
window.TivvigMathAdventure=Object.freeze({state,reset,hit,draw,rounds});
})();