/* Египетская школа: детерминированные сцены, без таймеров и случайностей.
 * Каждое нажатие воспроизводится через общую Firebase-комнату.
 * Учитель видит и подтверждает выполнение бумажных прописей по видеосвязи.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
if(!$('schoolStage')||window.TivvigSchoolDebug)return;
const KEY='tivvig_reward_egypt_school_v1';
const math=[
 {q:'Сколько солнц на небе?',art:'☀️ ☀️ ☀️ ☀️',a:['3','4','5','6'],ok:1},
 {q:'Где больше скарабеев?',art:'СЛЕВА  🪲 🪲      СПРАВА  🪲 🪲 🪲 🪲',a:['Слева','Справа','Поровну'],ok:1},
 {q:'Какое число спряталось?',art:'1   2   3   ?   5',a:['6','4','7'],ok:1},
 {q:'У Ра было 2 луча. Появились ещё 3.',art:'☀️   2 + 3 = ?',a:['4','6','5'],ok:2},
 {q:'Продолжи солнечный узор.',art:'☀️ 🌙 ☀️ 🌙 ☀️  ?',a:['⭐','☀️','🌙'],ok:2},
 {q:'В лодке 6 рыб. Две уплыли.',art:'🐟 🐟 🐟 🐟 🐟 🐟  −  🐟 🐟',a:['4','3','5'],ok:0},
 {q:'Что больше?',art:'6   ?   4',a:['<','>','='],ok:1},
 {q:'Собери ровно 7 камней.',art:'🪨 🪨 🪨 🪨   +   ?   =   7',a:['2','4','3'],ok:2},
 {q:'Сколько ступенек до храма?',art:'1    3    5    ?',a:['6','7','8'],ok:1},
 {q:'У Тутенштейна 8 бусин. 3 он подарил.',art:'8 − 3 = ?',a:['4','5','6'],ok:1},
 {q:'Какая корзина легче?',art:'🥭🥭🥭🥭     ⚖️     🥭🥭',a:['Левая','Правая','Одинаково'],ok:1},
 {q:'Последний код школы!',art:'3 + ? = 10',a:['5','6','7'],ok:2}
];
const writing=[
 {q:'Уэнсдей: «Проведи путь ибиса!»',art:'𓅃   〰️   ﹏   ∿',detail:'Лист 1: прямые, волны и зигзаги.'},
 {q:'«Теперь укроти песчаную змею!»',art:'〰️   ⟳   〰️',detail:'Лист 2: изгибы, петли и спирали.'},
 {q:'«Обведи строгие буквы!»',art:'Л   М   А   О   У',detail:'Лист 3: крупные печатные буквы.'},
 {q:'«Напиши секретные слова!»',art:'МА-МА   ЛУ-НА   ЛА-ДА',detail:'Лист 4: короткие слова по слогам.'}
];
const reading=[
 {q:'Найди слог МА.',art:'МА',a:['МО','МА','МУ','НА'],ok:1},
 {q:'Найди слог ЛУ.',art:'ЛУ',a:['ЛИ','ЛА','ЛУ','ЛО'],ok:2},
 {q:'Миссис Пухлис собирает слово.',art:'МА + ?',a:['КО','МА','ЛУ'],ok:1},
 {q:'Найди вторую половинку.',art:'ЛУ + ?',a:['НА','МА','ВА'],ok:0},
 {q:'Сложи слово КО-ЗА.',art:'КО + ?',a:['МА','ЗА','НА'],ok:1},
 {q:'Как заканчивается слово РЫ-БА?',art:'РЫ + ?',a:['МА','КО','БА'],ok:2},
 {q:'Прочти слово. Кто это?',art:'КОТ',a:['🐟','🐱','🐸'],ok:1},
 {q:'Прочти слово. Что это?',art:'ВА-ЗА',a:['🏺','🌙','🐈'],ok:0},
 {q:'Прочти короткую фразу.',art:'МА-МА ДО-МА.',a:['🏠','🚢','🌳'],ok:0},
 {q:'Последняя история!',art:'У ЛА-ДЫ КОТ.',a:['🐈','🐊','🐕'],ok:0}
];
const subjects={
 math:{name:'МатематиКатя',sub:'Математика · сокровища и числа',image:'images/egypt-school-katya.webp',data:math},
 writing:{name:'Злая Уэнсдей',sub:'Письмо · строгая учительница',image:'images/egypt-school-wednesday.webp',data:writing},
 reading:{name:'Миссис Пухлис',sub:'Чтение · слоги и слова',image:'images/egypt-school-puhlis.webp',data:reading}
};
const sequence=['math','writing','reading'];
let phase='intro',step=0,answered=false,wrong=null;
function tone(which){try{void window.TivvigHadesSounds?.play(which)}catch{}}
function dress(){try{window.TivvigWardrobe?.equip($('schoolLada'))}catch{}}
function finished(){
 try{
  if(window.TivvigRegistry?.byReward[KEY])window.TivvigRegistry.unlockReward(KEY);
  else{
   localStorage.setItem(KEY,'unlocked');
   window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:KEY}}));
  }
 }catch{}
}
function show(){
 const intro=phase==='intro',done=phase==='done';
 $('schoolStage').dataset.phase=phase;
 $('schoolIntro').hidden=!intro;
 $('schoolLearning').hidden=intro||done;
 $('schoolEnding').hidden=!done;
 if(intro||done)return;
 const subject=subjects[phase];if(!subject)return;
 const item=subject.data[step];
 if(!item)return;
 $('schoolTeacher').textContent=subject.name;
 $('schoolSubject').textContent=subject.sub;
 $('schoolTeacherImg').src=subject.image;
 $('schoolTeacherImg').alt=subject.name;
 $('schoolCounter').textContent=(step+1)+' / '+subject.data.length;
 $('schoolBar').style.width=String((step+(answered?1:0))/subject.data.length*100)+'%';
 $('schoolQuestion').textContent=item.q;
 $('schoolVisual').textContent=item.art;
 $('schoolPrint').hidden=phase!=='writing';
 $('schoolSkip').hidden=answered;
 $('schoolNext').hidden=!answered && phase!=='writing';
 $('schoolNext').textContent=step===subject.data.length-1?(phase==='reading'?'Получить диплом →':'Следующий урок →'):'Дальше →';
 const hasChoices=phase!=='writing';
 $('schoolAnswers').hidden=!hasChoices;
 $('schoolFeedback').textContent=phase==='writing'?(item.detail+' Покажи лист по камере.'):(answered?'Правильно! ✨':wrong===null?'Найди ответ и нажми.':'Попробуй ещё!');
 $('schoolFeedback').className='feedback'+(answered?' good':wrong!==null?' bad':'');
 if(phase==='writing'){$('schoolNext').hidden=false;return}
 for(let i=0;i<4;i++){
  const btn=$('schoolOpt'+i),exists=i<item.a.length;
  btn.hidden=!exists;
  if(!exists)continue;
  btn.textContent=item.a[i];btn.disabled=answered;
  btn.className='choice'+(answered&&i===item.ok?' correct':wrong===i?' wrong':'');
 }
}
function next(){
 if(phase==='intro'){phase='math';step=0;answered=false;wrong=null;show();tone('tap');return}
 if(phase==='done'){phase='intro';step=0;answered=false;wrong=null;show();tone('tap');return}
 if(phase!=='writing'&&!answered)return;
 advance();
}
function advance(){
 const current=subjects[phase];
 if(!current)return;
 step++;
 if(step>=current.data.length){
  const i=sequence.indexOf(phase);
  if(i===sequence.length-1){phase='done';finished();tone('finish')}
  else {phase=sequence[i+1];step=0;tone('success')}
 } else tone('tap');
 answered=false;wrong=null;show();
}
function choose(i){
 const subject=subjects[phase];
 if(!subject||phase==='writing'||answered)return;
 const task=subject.data[step];
 if(i<0||i>=task.a.length)return;
 if(i===task.ok){answered=true;wrong=null;tone('success')}
 else {wrong=i;tone('wrong')}
 show();
}
$('schoolStart').addEventListener('click',next);
$('schoolNext').addEventListener('click',next);
$('schoolAgain').addEventListener('click',()=>{phase='intro';step=0;answered=false;wrong=null;show();tone('tap')});
$('schoolSkip').addEventListener('click',advance);
for(let i=0;i<4;i++)$('schoolOpt'+i).addEventListener('click',()=>choose(i));
window.addEventListener('pageshow',dress);
window.addEventListener('tivvig-inventory-changed',dress);
window.addEventListener('tivvig-outfit-changed',dress);
window.TivvigSchoolDebug=Object.freeze({
 state:()=>({phase,step,answered,wrong,lessonCount:phase in subjects?subjects[phase].data.length:0}),
 answers:()=>phase in subjects?subjects[phase].data.map(x=>x.ok):[],
 getTask:(which,n)=>subjects[which]?.data[n]||null,
 start:next,
 reset:()=>{phase='intro';step=0;answered=false;wrong=null;show()}
});
show();dress();
})();