/* Тайная инструкция Вулкана.
 * Optional syllable highlighting, four deterministic object finds.
 * Buttons are compatible with the existing Firebase click replay bridge. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const TASKS=[
 {words:[['ВО','ДА']],object:'water',result:'Чан зашипел! Вода охладила раскалённую броню.'},
 {words:[['РУ','НА']],object:'rune',result:'Камень вспыхнул! Первая руна засияла на металле.'},
 {words:[['КРЫ','ЛО']],object:'wing',result:'Кузнецы нашли запасное крыло и укрепили крылья доспехов.'},
 {words:[['ЛА','ДА,'],['БЕ','РИ'],['МЕЧ!']],object:'sword',result:'Лада взяла меч! Теперь броню можно зачаровать.'}
];
const reduce=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let active=false,round=0,helped=new Set(),done=new Set(),busy=false,version=0,finishCallback=null;
const status=(message,kind='')=>{
 const node=$('reading-status');node.textContent=message;node.classList.toggle('good',kind==='good');node.classList.toggle('bad',kind==='bad');
};
function reset(){
 version++;active=false;round=0;helped.clear();done.clear();busy=false;
 const scroll=$('reading-word');if(scroll)scroll.replaceChildren();
 for(const object of ['water','rune','wing','sword']){
  const button=$('reading-'+object);
  if(button){button.classList.remove('used','wrong');button.disabled=false}
 }
}
function enter(){
 version++;active=true;round=0;helped.clear();done.clear();busy=false;render();
}
function makeEl(tag,className,value){
 const node=document.createElement(tag);node.className=className;
 if(value!==undefined)node.textContent=value;
 return node;
}
function render(){
 if(!active||round>=TASKS.length)return;
 const task=TASKS[round],board=$('reading-word');
 $('reading-count').textContent='Пергамент '+(round+1)+' из '+TASKS.length;
 board.replaceChildren();
 let index=0;
 for(const [wordNo,word] of task.words.entries()){
  if(wordNo){const space=makeEl('span','scroll-space');space.setAttribute('aria-hidden','true');board.appendChild(space)}
  for(const [partNo,part] of word.entries()){
   if(partNo){const dash=makeEl('span','scroll-dash','-');dash.setAttribute('aria-hidden','true');board.appendChild(dash)}
   const n=index++,syllable=makeEl('button','scroll-syllable',part);
   syllable.type='button';syllable.id='reading-syllable-'+n;
   syllable.setAttribute('aria-label','Подсветить слог '+part.replace(/[!,]/g,''));
   syllable.setAttribute('aria-pressed',String(helped.has(n)));
   syllable.classList.toggle('read',helped.has(n));
   syllable.addEventListener('click',()=>help(n));board.appendChild(syllable);
  }
 }
 for(const [i,stamp] of [...$('reading-stamps').children].entries()){
  const completed=i<round;
  stamp.textContent=completed?'✦':'✧';
  stamp.classList.toggle('done',completed);
 }
 for(const object of ['water','rune','wing','sword']){
  const button=$('reading-'+object),used=done.has(object);
  button.disabled=used||busy;button.classList.toggle('used',used);button.classList.remove('wrong');
 }
 $('reading-message').textContent=round===3
  ?'Последний пергамент — короткое предложение. Прочитай его и выполни поручение!'
  :'Прочитай слово вслух, затем найди подходящий предмет.';
 status('Прочитай слово и нажми на предмет в кузнице.');
}
function help(index){
 if(!active||busy)return;
 const node=$('reading-syllable-'+index);if(!node)return;
 helped.add(index);node.classList.add('read');node.setAttribute('aria-pressed','true');
 const total=$('reading-word').querySelectorAll('.scroll-syllable').length;
 status(helped.size>=total?'Теперь прочитай надпись целиком и найди предмет.':'Этот слог подсвечен. Прочитай следующий.',helped.size>=total?'good':'');
}
function choose(object){
 if(!active||busy)return;
 const task=TASKS[round],button=$('reading-'+object);
 if(object!==task.object){
  button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');
  status('Это не тот предмет. Прочитай слово на пергаменте ещё раз.','bad');
  return;
 }
 busy=true;done.add(object);button.classList.remove('wrong');button.classList.add('used');
 $('reading-message').textContent=task.result;status('Правильно! '+task.result,'good');
 document.querySelectorAll('[data-object]').forEach(btn=>btn.disabled=true);
 const token=++version;
 window.setTimeout(()=>{
  if(!active||token!==version)return;
  round++;helped.clear();busy=false;
  if(round===TASKS.length){
   active=false;
   if(typeof finishCallback==='function')finishCallback();
   return;
  }
  render();
 },reduce?90:950);
}
document.querySelectorAll('[data-object]').forEach(button=>{
 button.addEventListener('click',()=>choose(button.dataset.object));
});
window.TivvigForgeReading={enter,reset,onFinish:callback=>{finishCallback=callback},getState:()=>({active,round,done:[...done],busy})};
window.__vulcanForgeReadingTest={
 tasks:TASKS.map(t=>({words:t.words.map(w=>[...w]),object:t.object})),
 readObject:id=>$('reading-'+id)?.click(),
 readSyllable:i=>$('reading-syllable-'+i)?.click(),
 state:()=>window.TivvigForgeReading.getState()
};
})();