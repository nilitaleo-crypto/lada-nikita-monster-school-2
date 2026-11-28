/* Тиввиг — Египетская школа, редакция 2.
 * Три класса на одном игровом поле, свободный порядок, без таймеров.
 * Все управляющие нажатия — обычные кнопки, одинаковые на двух устройствах;
 * родительский Firebase bridge авторитетно воспроизводит их по порядку.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
if(!$('schoolStage')||window.TivvigSchoolDebug)return;
const REWARD='tivvig_reward_egypt_school_v1';
const math=[
 {q:'Уравновесь весы',art:'',type:'mathScale'},
 {q:'Сокровища Тутенштейна',art:'',type:'mathChest'},
 {q:'Построй мост для пёселя',art:'',type:'mathBridge'}
];
const writing=[
 {q:'Найди дорогу для ибиса',art:'●  ─  ∿  ∧∧  ─  ★',detail:'Лист 1 · прямые, волны и углы'},
 {q:'Укрощение песчаной змеи',art:'〰️   〰️   ∿   ⟳',detail:'Лист 2 · петли и извилины'},
 {q:'Уэнсдей проверяет буквы',art:'Л   М   А   О   У',detail:'Лист 3 · крупные печатные буквы'},
 {q:'Расшифруй послание',art:'МА-МА   ЛУ-НА   ЛА-ДА',detail:'Лист 4 · короткие слова по слогам'}
];
const reading=[
 {q:'Что получится из двух слогов?',art:'МА + МА',a:['ЛУНА','МАМА','МАША'],ok:1},
 {q:'Собери ЛУ-НА',art:'Нажимай слоги по порядку',type:'sequence',a:['НА','ЛУ','КО'],order:[1,0]},
 {q:'Прочитай и найди слово',art:'🐈',a:['ЛЕС','КОТ','ДОМ'],ok:1},
 {q:'Миссис Пухлис спрятала слог',art:'Найди НО',a:['НА','МО','НО','НУ'],ok:2},
 {q:'Сколько слогов?',art:'МА-ШИ-НА',a:['2','4','3'],ok:2},
 {q:'Собери КО-РО-ВА',art:'Выбирай слоги по порядку',type:'sequence',a:['ВА','КО','РО'],order:[1,2,0]},
 {q:'Прочитай имя и найди героя',art:'НА-ФИ-РИ',a:['Нафири','Пёсель','Уэнсдей'],ok:0},
 {q:'Как зовут пушистую подругу?',art:'КО-ШКА',type:'sequence',a:['ШКА','ЛИ','КО'],order:[2,0]},
 {q:'Прочитай фразу',art:'У ЛА-ДЫ КОТ.',a:['Кот','Пёсель','Нафири'],ok:0},
 {q:'Какое слово рифмуется с ДОМ?',art:'ДОМ',a:['КОТ','СОМ','ЛЕС'],ok:1},
 {q:'Прочитай и найди друга',art:'КОТ',a:['Кот','Тутенштейн','Нафири'],ok:0},
 {q:'Собери имя героини',art:'ЛА-ДА',type:'sequence',a:['ДА','МА','ЛА'],order:[2,0]}
];
const subjects={
 math:{name:'МатематиКатя',label:'СОКРОВИЩА И ЧИСЛА',sprites:{neutral:'images/egypt-school-math-neutral.webp',good:'images/egypt-school-math-good.webp',wrong:'images/egypt-school-math-wrong.webp'},background:'images/egypt-school-math-integrated-v2.webp',data:math,bad:'😕',good:'✨'},
 writing:{name:'Злая Уэнсдей',label:'ТАЙНЫЕ ПРОПИСИ',sprites:{neutral:'images/egypt-school-writing-neutral.webp',good:'images/egypt-school-writing-good.webp',wrong:'images/egypt-school-writing-wrong.webp'},background:'images/egypt-school-writing-integrated-v2.webp',data:writing,bad:'⚡',good:'☾'},
 reading:{name:'Миссис Пухлис',label:'ЧИТАЛЬНАЯ КОМНАТА',sprites:{neutral:'images/egypt-school-reading-neutral.webp',good:'images/egypt-school-reading-good.webp',wrong:'images/egypt-school-reading-wrong.webp'},background:'images/egypt-school-reading-integrated-v2.webp',data:reading,bad:'😿',good:'💗'}
};
const names=Object.keys(subjects);
// Preload three expressions for each movable teacher; keep it image-only, no extra network APIs.
const characterArt=[];

/* Friends are the actual existing story sprites, not emoji or cropped backgrounds.
 * Semantic button IDs remain unchanged for cross-device click relays. */
const cast={
 dog:{src:'images/egypt-fox-friend.webp',name:'Пёсель'},
 nafiri:{src:'images/egypt-nafiri.webp',name:'Нафири'},
 tuten:{src:'images/egypt-tutenstein.webp',name:'Тутенштейн'},
 lada:{src:'images/lada-cutout.webp',name:'Лада'},
 cat:{src:'images/egypt-school-reading-neutral.webp',name:'Миссис Пухлис'},
 math:{src:'images/egypt-school-math-neutral.webp',name:'МатематиКатя'},
 writing:{src:'images/egypt-school-writing-neutral.webp',name:'Уэнсдей'}
};
const scenes={
 math:[
  {hero:'dog',script:'4 + ? = 9'},
  {hero:'nafiri',script:'3 + 2   ⚖   4 + 1'},
  {hero:'tuten',script:'▁  ▂  ▃  ▄'},
  {hero:'dog',script:'7 + ? = 10'},
  {hero:'lada',script:'✦ ✦ ✦ ✦ ✦',kind:'gems'},
  {kind:'pattern',pattern:['dog','nafiri','nafiri','dog','nafiri','nafiri','dog','?']},
  {hero:'dog',script:'8 − 3 = ?'},
  {hero:'dog',partner:'nafiri',script:'3 + 4    ⚖    6 + 2'},
  {hero:'tuten',script:'? − 3 = 4'},
  {hero:'nafiri',script:'1 → ? → ? → ?'},
  {hero:'cat',script:'9 − 6 = ?'},
  {hero:'math',script:'7 + 2 = ?'},
  {hero:'dog',partner:'nafiri',script:'5    ⚖    2 + 4'},
  {hero:'math',script:'5 + ? = 8'}
 ],
 writing:[
  {hero:'writing',script:'—  ∿  ∧∧  —'},
  {hero:'tuten',script:'∿  ∿  ⟳  ∿'},
  {hero:'writing',script:'Л   М   А   О   У'},
  {hero:'dog',script:'МА-МА   ЛУ-НА   ЛА-ДА'}
 ],
 reading:[
  {hero:'nafiri',script:'МА + МА'},
  {hero:'lada',script:'ЛУ + НА'},
  {hero:'cat',script:'КОТ'},
  {hero:'dog',script:'НО'},
  {hero:'tuten',script:'МА-ШИ-НА'},
  {hero:'tuten',script:'КО-РО-ВА'},
  {hero:'lada',script:'НА-ФИ-РИ'},
  {hero:'cat',script:'КО-ШКА'},
  {hero:'lada',script:'У ЛА-ДЫ КОТ.'},
  {hero:'dog',script:'ДОМ'},
  {hero:'lada',script:'КОТ'},
  {hero:'lada',script:'ЛА-ДА'}
 ]
};
const characterAnswers={
 math:{5:['tuten','nafiri','dog']},
 reading:{6:['nafiri','dog','writing'],8:['cat','dog','nafiri'],10:['cat','tuten','nafiri']}
};
function portrait(id,className){
 const person=cast[id];if(!person)return null;
 const img=document.createElement('img');
 img.className=className||'school-character';
 img.src=person.src;img.alt=person.name;img.draggable=false;img.decoding='async';
 return img;
}
function renderScene(room,n,task){
 const visual=$('schoolVisual'),scene=scenes[room]?.[n];
 if(!scene){visual.textContent=task.art;return}
 const el=document.createElement('div');
 el.className='school-scene school-scene--'+(scene.kind|| (scene.partner?'duo':'single'));
 el.dataset.mood=mood;
 el.setAttribute('role','img');
 el.setAttribute('aria-label',scene.kind==='pattern'?'Пёсель, Нафири, Нафири, Пёсель, Нафири, Нафири, Пёсель, кто следующий?':scene.script+'; '+(cast[scene.hero]?.name||''));
 if(scene.pattern){
  const ribbon=document.createElement('div');ribbon.className='school-friends-pattern';
  for(let i=0;i<scene.pattern.length;i++){
   const friend=scene.pattern[i],cell=document.createElement('div');
   cell.className='school-friends-pattern__slot'+(friend==='?'?' school-friends-pattern__slot--unknown':'');
   if(friend==='?')cell.textContent='?';else cell.appendChild(portrait(friend,'school-friends-pattern__image'));
   ribbon.appendChild(cell);
  }
  el.appendChild(ribbon);
 }else{
  const hero=portrait(scene.hero,'school-character school-character--hero');
  if(hero)el.appendChild(hero);
  const caption=document.createElement('div');
  caption.className='school-scene__script';
  caption.textContent=scene.script;
  el.appendChild(caption);
  if(scene.partner){
   const partner=portrait(scene.partner,'school-character school-character--partner');
   if(partner)el.appendChild(partner);
  }
 }
 visual.replaceChildren(el);
}
function renderAnswer(btn,room,n,i,value){
 const character=characterAnswers[room]?.[n]?.[i];
 if(!character){btn.removeAttribute('data-art-kind');btn.textContent=value;return}
 btn.dataset.artKind='portrait';
 const face=portrait(character,'school-answer-character');
 const name=document.createElement('span');name.className='school-answer-name';name.textContent=value;
 btn.replaceChildren(face,name);
}
for(const person of Object.values(cast)){
 const img=new Image();img.decoding='async';img.src=person.src;characterArt.push(img);
}

for(const room of Object.values(subjects))for(const source of Object.values(room.sprites)){
 const image=new Image();image.decoding='async';image.src=source;characterArt.push(image);
}
const progress={math:0,writing:0,reading:0},done=new Set();
let phase='hall',answered=false,wrong=null,sequencePos=0,selected=new Set(),mood='neutral';
function tone(which){try{void window.TivvigHadesSounds?.play(which)}catch{}}
function dress(){try{window.TivvigWardrobe?.equip($('schoolLada'));window.TivvigWardrobe?.equip($('schoolRoomLada'))}catch{}}
function reward(){
 try{
  if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);
  else{localStorage.setItem(REWARD,'unlocked');window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}));}
 }catch{}
}
function render(){
 const hall=phase==='hall',end=phase==='done';
 $('schoolStage').dataset.phase=phase;
 $('schoolHall').hidden=!hall;
 $('schoolRoom').hidden=hall||end;
 $('schoolEnding').hidden=!end;
 for(const name of names)$('schoolStamp'+name.charAt(0).toUpperCase()+name.slice(1)).hidden=!done.has(name);
 if(hall||end)return;
 const subject=subjects[phase];if(!subject)return;
 const n=progress[phase];const task=subject.data[n];if(!task)return;
 if($('schoolRoomBg').getAttribute('src')!==subject.background)$('schoolRoomBg').src=subject.background;
 const sprite=subject.sprites[mood]||subject.sprites.neutral;
 if($('schoolTeacherImg').getAttribute('src')!==sprite)$('schoolTeacherImg').src=sprite;
 $('schoolTeacherImg').alt=subject.name+(mood==='wrong'?' недовольна':mood==='good'?' радуется':'');
 $('schoolTeacher').textContent=subject.name;
 $('schoolSubject').textContent=subject.label;
 $('schoolCounter').textContent=(n+1)+' / '+subject.data.length;
 $('schoolQuestion').textContent=task.q;
 const mathGame=window.TivvigMathAdventure;
 $('schoolMathGame').hidden=phase!=='math';
 $('schoolVisual').hidden=phase==='math';
 $('schoolAnswers').hidden=phase==='math';
 if(phase==='math'&&mathGame)mathGame.draw(task.type);
 else renderScene(phase,n,task);
 $('schoolTeacherFigure').dataset.mood=mood;
 $('schoolReaction').textContent=mood==='good'?subject.good:mood==='wrong'?subject.bad:'';
 $('schoolFeedback').dataset.mood=mood;
 $('schoolFeedback').textContent=phase==='writing'?(mood==='wrong'?'Уэнсдей требует аккуратнее.':answered?'Отлично, лист готов!':task.detail):mood==='wrong'?'Попробуй ещё!':answered?'Правильно! ✨':task.type==='sequence'?'Нажимай по порядку':task.type==='collect'?'Собери пять':'Выбери ответ';
 $('schoolAnswers').dataset.mode=task.type||'choice';
 $('schoolPrint').hidden=phase!=='writing';
 $('schoolSkip').hidden=answered;
 $('schoolNext').hidden=!answered;
 $('schoolNext').textContent=n===subject.data.length-1?'В холл →':'Дальше →';
 let opts=phase==='writing'?['Переделать','Лист готов!']:phase==='math'?[]:task.a;
 for(let i=0;i<6;i++){
  const btn=$('schoolOpt'+i),has=i<opts.length;
  btn.hidden=!has;
  if(!has){btn.disabled=true;continue}
  renderAnswer(btn,phase,n,i,opts[i]);
  btn.disabled=answered||(task.type==='sequence'&&selected.has(i))||(task.type==='collect'&&selected.has(i));
  btn.className='answer'+(selected.has(i)||answered&&phase!=='writing'&&i===task.ok?' hit':wrong===i?' missed':'');
 }
}
function resetFeedback(){answered=false;wrong=null;sequencePos=0;selected=new Set();mood='neutral';window.TivvigMathAdventure?.reset()}
function enter(room){
 if(!subjects[room])return;
 // Completed subjects are replayable without losing their earlier school stamp.
 if(done.has(room))progress[room]=0;
 phase=room;resetFeedback();render();tone('tap');
}
function leave(){if(phase==='hall'||phase==='done')return;phase='hall';resetFeedback();render();tone('tap')}
function advance(){
 if(!(phase in subjects))return;
 if(!answered&&phase!=='writing')return;
 progress[phase]++;
 if(progress[phase]>=subjects[phase].data.length){
  done.add(phase);
  if(done.size===names.length){phase='done';reward();tone('finish')}
  else{phase='hall';tone('finish')}
 }else tone('tap');
 resetFeedback();render();
}
function skip(){if(!(phase in subjects))return;answered=true;advance()}
function choose(i){
 if(!(phase in subjects)||answered)return;
 const task=subjects[phase].data[progress[phase]];
 const count=phase==='writing'?2:task.a.length;
 if(i<0||i>=count)return;
 wrong=null;
 if(phase==='writing'){
  if(i===1){answered=true;mood='good';tone('success')}
  else{mood='wrong';wrong=0;tone('wrong')}
 }else if(task.type==='sequence'){
  if(i===task.order[sequencePos]){
   selected.add(i);sequencePos++;
   if(sequencePos===task.order.length){answered=true;mood='good';tone('success')}else{mood='neutral';tone('tap')}
  }else{wrong=i;mood='wrong';tone('wrong')}
 }else if(task.type==='collect'){
  if(selected.has(i))return;
  selected.add(i);
  if(selected.size===task.target){answered=true;mood='good';tone('success')}
  else{mood='neutral';tone('tap')}
 }else{
  if(i===task.ok){answered=true;mood='good';tone('success')}
  else {wrong=i;mood='wrong';tone('wrong')}
 }
 render();
}
$('schoolGoMath').addEventListener('click',()=>enter('math'));
$('schoolGoWriting').addEventListener('click',()=>enter('writing'));
$('schoolGoReading').addEventListener('click',()=>enter('reading'));
$('schoolBack').addEventListener('click',leave);
$('schoolSkip').addEventListener('click',skip);
$('schoolMathGame').addEventListener('click',e=>{
 const b=e.target.closest('button[data-math-choice]');if(!b||phase!=='math'||answered)return;
 const result=window.TivvigMathAdventure?.hit(math[progress.math].type,Number(b.dataset.mathChoice));
 if(!result?.changed)return;
 if(result.complete){answered=true;mood='good';tone('success')}
 else if(result.wrong){mood='wrong';tone('wrong')}
 else {mood='neutral';tone(result.correct?'success':'tap')}
 render();
});
$('schoolNext').addEventListener('click',advance);
for(let i=0;i<6;i++)$('schoolOpt'+i).addEventListener('click',()=>choose(i));
$('schoolAgain').addEventListener('click',()=>{for(const name of names)progress[name]=0;done.clear();phase='hall';resetFeedback();render();tone('tap')});
window.addEventListener('pageshow',dress);
window.addEventListener('tivvig-inventory-changed',dress);
window.addEventListener('tivvig-outfit-changed',dress);
window.TivvigSchoolDebug=Object.freeze({
 state:()=>({phase,step:progress[phase]??0,progress:{...progress},done:[...done],answered,wrong,sequencePos,selected:[...selected],mood,mathState:window.TivvigMathAdventure?.state(),lessonCount:subjects[phase]?.data.length??0}),
 getTask:(room,index)=>subjects[room]?.data[index]||null,
 answers:room=>subjects[room]?.data.map(x=>x.ok??null)||[],
 enter,choose,advance,leave,mathClick:i=>{const result=window.TivvigMathAdventure?.hit(math[progress.math].type,i);if(result?.changed){answered=!!result.complete;mood=result.complete?'good':result.wrong?'wrong':'neutral';render()}return result},
 reset:()=>{for(const n of names)progress[n]=0;done.clear();phase='hall';resetFeedback();render()}
});
render();dress();
})();