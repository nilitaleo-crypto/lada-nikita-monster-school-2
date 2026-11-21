/* Тиввиг: Тот. Four deterministic, sequential board games, co-op safe buttons. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),scene=$('thothScene');
 if(!scene||window.TivvigThothDebug)return;
 const REWARD='tivvig_egypt_thoth_feather_v1';
 const SIGNS={
  sun:{name:'солнца',answer:'солнце',art:'<circle cx="50" cy="50" r="25" fill="#d9a126" stroke="#905c1b" stroke-width="5"/><circle cx="50" cy="50" r="13" fill="#ffe39a"/>'},
  water:{name:'воды',answer:'вода',art:'<path d="M6 30 Q18 16 30 30 T54 30 T78 30 T101 30 M6 51 Q18 37 30 51 T54 51 T78 51 T101 51 M6 72 Q18 58 30 72 T54 72 T78 72 T101 72" stroke="#267ca9" stroke-width="8" stroke-linecap="round" fill="none"/>'},
  eye:{name:'глаза',answer:'глаз',art:'<path d="M6 51 Q48 11 94 51 Q48 86 6 51Z" fill="none" stroke="#24568d" stroke-width="7"/><circle cx="50" cy="51" r="15" fill="#4c8bc0" stroke="#24568d" stroke-width="5"/><path d="M54 67q4 17 16 19M24 62l-9 11" stroke="#24568d" stroke-width="5" fill="none"/>'},
  bird:{name:'птицы',answer:'птица',art:'<path d="M77 22Q53 7 36 26Q20 44 29 65L14 81L43 74Q59 89 73 70Q89 50 74 37L97 34Z" fill="#d4ae69" stroke="#815427" stroke-width="5"/><path d="M34 45Q49 40 60 59Q51 70 41 63M49 74v14m11-14v14" stroke="#815427" stroke-width="4" fill="none"/><circle cx="67" cy="32" r="4" fill="#2b343d"/>'}
 };
 const signOrder=['sun','water','bird','eye'];
 const words=[
  {hint:'💧',word:'ВОДА',parts:['ВО','ДА'],options:['ДА','МА','ВО']},
  {hint:'🦉',word:'СОВА',parts:['СО','ВА'],options:['ВА','РА','СО']},
  {hint:'👧',word:'ЛАДА',parts:['ЛА','ДА'],options:['ДА','КА','ЛА']},
  {hint:'⛵',word:'ЛОДКА',parts:['ЛОД','КА'],options:['КА','ЛОД','РА']}
 ];
 const sequences=[['sun','water'],['bird','eye','sun'],['eye','water','bird']];
 const sentences=[
  {hint:'✍️ 📜',parts:['Тот','пи','шет'],options:['пи','Тот','шет'],full:'Тот пи-шет.'},
  {hint:'👧 📖',parts:['Ла','да','чи','та','ет'],options:['та','Ла','ет','чи','да'],full:'Ла-да чи-та-ет.'},
  {hint:'☀️ ✨',parts:['Ра','да','ёт','свет'],options:['свет','ёт','Ра','да'],full:'Ра да-ёт свет.'},
  {hint:'👧 ⛵',parts:['Ла','да','ви','дит','лод','ку'],options:['лод','ви','ку','Ла','дит','да'],full:'Ла-да ви-дит лод-ку.'}
 ];
 let stage='intro',index=0,pos=0,errors=0,phase='intro',locked=false,timer=null,answerHits=0;
 const byId=(id,text)=>{const node=$(id);if(node)node.textContent=text};
 const play=kind=>{try{void window.TivvigHadesSounds?.play(kind)}catch(e){}};
 const clear=()=>{if(timer){clearTimeout(timer);timer=null}};
 const svg=id=>'<svg viewBox="0 0 105 105" aria-label="'+SIGNS[id].answer+'" role="img" xmlns="http://www.w3.org/2000/svg">'+SIGNS[id].art+'</svg>';
 function say(t){$('thothSpeech').innerHTML='<strong>Тот:</strong> '+t}
 function setStage(s){stage=s;scene.dataset.stage=s;const list=$('thothSteps').children;const n=s==='signs'?1:s==='words'?2:s==='memory'?3:s==='sentences'||s==='done'?4:1;for(let i=0;i<list.length;i++)list[i].classList.toggle('on',i<n);$('thothSteps').setAttribute('aria-label','Этап '+n+' из 4')}
 function heading(t,p){byId('boardTitle',t);byId('boardPrompt',p);byId('boardFeedback','');$('boardReadout').className='readout';$('boardReadout').replaceChildren();$('boardDisplay').className='display';$('boardDisplay').replaceChildren();$('boardChoices').replaceChildren();$('boardChoices').className='choice-grid';$('boardAction').hidden=true;locked=false;errors=0}
 function viewHtml(node,html){const s=document.createElement('span');s.innerHTML=html;node.appendChild(s)}
 function big(t){const s=document.createElement('span');s.className='big';s.textContent=t;$('boardDisplay').append(s)}
 function buttons(options,handler,format='text',classes=''){
  const grid=$('boardChoices');grid.className='choice-grid '+classes;
  options.forEach((opt,i)=>{
   const btn=document.createElement('button');btn.type='button';btn.id='thoth-choice-'+i;btn.className='choice';btn.dataset.tivvigSound='manual';
   btn.setAttribute('aria-label',format==='sign'?SIGNS[opt].answer:String(opt));
   if(format==='sign')btn.innerHTML=svg(opt);else btn.textContent=opt;
   btn.addEventListener('click',()=>handler(opt,i,btn));grid.append(btn);
  });
 }
 function completeRound(next,feedback){locked=true;byId('boardFeedback',feedback||'Верно!');play('success');clear();timer=setTimeout(()=>{timer=null;next()},650)}
 function bad(btn){errors++;btn.classList.add('bad');byId('boardFeedback',errors>1?'Попробуй другой знак или слог.':'Ещё раз!');play('wrong');clear();timer=setTimeout(()=>{btn.classList.remove('bad');timer=null},330)}
 function start(){if(stage!=='intro')return;index=0;pos=0;answerHits=0;setStage('signs');renderSigns();play('tap')}
 function renderSigns(){
  phase='choose';const id=signOrder[index];heading('Тайные знаки','Найди знак '+SIGNS[id].name);say('Каждый знак хранит значение. Отыщи правильный!');
  big(index===0?'☀️':index===1?'💧':index===2?'🕊️':'👁️');
  const layouts=[['water','sun','bird','eye'],['eye','bird','water','sun'],['sun','bird','eye','water'],['water','eye','sun','bird']];
  buttons(layouts[index],(value,_,btn)=>{
   if(locked)return;if(value!==id)return bad(btn);
   btn.classList.add('good');answerHits++;
   completeRound(()=>{index++;if(index===signOrder.length){index=0;setStage('words');renderWords()}else renderSigns()},'Знак найден!');
  },'sign','symbol-grid');
 }
 function renderSlots(parts){const el=$('boardReadout');el.replaceChildren();for(let n=0;n<parts.length;n++){const slot=document.createElement('span');slot.className='slot'+(n<pos?' done':'');slot.textContent=n<pos?parts[n]:'· ·';el.append(slot)}}
 function renderWords(){
  phase='build';pos=0;const w=words[index];heading('Сложи слово',w.word.length>3?'Собери слово по слогам':'Собери слово');big(w.hint);renderSlots(w.parts);
  say('Теперь соедини слоги и прочитай слово вслух.');
  buttons(w.options,(value,_,btn)=>{
   if(locked||btn.disabled)return;
   if(value!==w.parts[pos])return bad(btn);
   pos++;answerHits++;btn.disabled=true;btn.classList.add('good');renderSlots(w.parts);play('tap');
   if(pos===w.parts.length){byId('boardFeedback',w.word+' — отлично!');completeRound(()=>{index++;if(index===words.length){index=0;setStage('memory');renderMemory()}else renderWords()},w.word+' — отлично!')}
  });
 }
 function renderMemory(){
  phase='show';pos=0;const sequence=sequences[index];heading('Память Тота','Запомни знаки по порядку');say('Посмотри на свиток. Когда знаки исчезнут, повтори их порядок.');
  $('boardDisplay').classList.add('memory-look');sequence.forEach(id=>viewHtml($('boardDisplay'),svg(id)));
  byId('boardFeedback','Смотри внимательно');locked=true;
  clear();timer=setTimeout(()=>{timer=null;showMemoryChoices()},3000);
 }
 function showMemoryChoices(){
  if(stage!=='memory'||phase!=='show')return;
  phase='choose';locked=false;$('boardDisplay').replaceChildren();byId('boardPrompt','Повтори порядок');byId('boardFeedback','');
  const choices=[['sun','bird','water','eye'],['eye','water','bird','sun'],['bird','eye','sun','water']][index];
  buttons(choices,(value,_,btn)=>{
   if(locked)return;
   if(value!==sequences[index][pos])return bad(btn);
   pos++;answerHits++;viewHtml($('boardReadout'),svg(value));$('boardReadout').lastElementChild.className='mini-sign';play('tap');
   if(pos===sequences[index].length){btn.classList.add('good');completeRound(()=>{index++;if(index===sequences.length){index=0;setStage('sentences');renderSentence()}else renderMemory()},'Порядок восстановлен!')}
  },'sign','symbol-grid');
 }
 function renderSentence(){
  phase='reading';pos=0;const s=sentences[index];heading('Читаем по слогам','Прочитай и собери предложение');
  say(index===0?'Последние папирусы! Собери слоги в предложение, затем прочитай вслух.':'Попробуй следующее предложение.');
  big(s.hint);renderSlots(s.parts);
  buttons(s.options,(value,_,btn)=>{
   if(locked||btn.disabled)return;
   if(value!==s.parts[pos])return bad(btn);
   pos++;answerHits++;btn.disabled=true;btn.classList.add('good');renderSlots(s.parts);play('tap');
   if(pos===s.parts.length){
    locked=true;phase='read-aloud';$('boardChoices').replaceChildren();$('boardReadout').replaceChildren();$('boardReadout').className='readout complete';$('boardReadout').textContent=s.full;
    byId('boardPrompt','Прочитай вслух!');byId('boardFeedback','');
    $('boardAction').textContent=index===sentences.length-1?'Получить перо':'Следующая фраза →';$('boardAction').hidden=false;play('success');
   }
  });
 }
 function saveReward(){
  try{localStorage.setItem(REWARD,'unlocked')}catch(e){}
  try{if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}))}catch(e){}
 }
 function finish(){
  clear();setStage('done');phase='done';locked=true;
  heading('Перо Тота','Все истории спасены!');say('Ты прочитала мои папирусы. Возьми перо мудрости! Впереди солнечная ладья Ра.');
  $('boardDisplay').innerHTML='<img class="feather" src="images/egypt-thoth-feather.svg" alt="Волшебное перо Тота">';
  $('boardReadout').className='readout complete';$('boardReadout').textContent='Ла-да — хра-ни-тель-ни-ца зна-ний!';
  $('boardAction').textContent='Сыграть снова';$('boardAction').hidden=false;locked=true;$('thothToMummy').hidden=false;saveReward();play('finish');
 }
 function reset(){
  clear();setStage('intro');index=0;pos=0;locked=false;phase='intro';errors=0;answerHits=0;
  $('thothToMummy').hidden=true;
  heading('Тайна папирусов','Четыре испытания Тота');say('Сфинкс вас пропустил! Кто-то перепутал знаки в моих свитках. Помоги их восстановить.');big('📜');$('boardAction').textContent='Начать урок';$('boardAction').hidden=false;
 }
 $('boardAction').addEventListener('click',()=>{
  if(stage==='intro')return start();
  if(stage==='done')return reset();
  if(stage==='sentences'&&phase==='read-aloud'){
   index++;if(index>=sentences.length)finish();else renderSentence();return;
  }
 });
 function updateOutfit(){try{window.TivvigWardrobe?.equip($('thothLada'))}catch(e){}}
 window.addEventListener('tivvig-outfit-changed',updateOutfit);window.addEventListener('tivvig-inventory-changed',updateOutfit);window.addEventListener('pageshow',updateOutfit);
 window.addEventListener('pagehide',clear);
 window.TivvigThothDebug=Object.freeze({
  state:()=>({stage,index,pos,phase,locked,errors,answerHits,reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch{return false}})()}),
  start,reset,finish,advance:()=>{
   if(stage==='intro')return start();
   if(stage==='signs')return document.getElementById('thoth-choice-'+[['water','sun','bird','eye'],['eye','bird','water','sun'],['sun','bird','eye','water'],['water','eye','sun','bird']][index].indexOf(signOrder[index]))?.click();
   if(stage==='words')return document.getElementById('thoth-choice-'+words[index].options.indexOf(words[index].parts[pos]))?.click();
   if(stage==='memory'&&phase==='show')return showMemoryChoices();
   if(stage==='memory'&&phase==='choose')return document.getElementById('thoth-choice-'+[['sun','bird','water','eye'],['eye','water','bird','sun'],['bird','eye','sun','water']][index].indexOf(sequences[index][pos]))?.click();
   if(stage==='sentences'){if(phase==='read-aloud')return $('boardAction').click();return document.getElementById('thoth-choice-'+sentences[index].options.indexOf(sentences[index].parts[pos]))?.click()}
  }
 });
 reset();updateOutfit();
})();