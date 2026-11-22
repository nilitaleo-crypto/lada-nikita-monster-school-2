/* Tivvig: Sphinx riddles. Original Lada + live/stone illustrations. 6 core riddles and 2 optional. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id), scene=$('sphinxScene');
 if(!scene || window.TivvigSphinxDebug)return;
 const REWARD='tivvig_egypt_sphinx_temple_v1';
 const dress=()=>window.TivvigWardrobe?.equip($('sphinxLada'));
 window.addEventListener('tivvig-outfit-changed',dress);
 window.addEventListener('tivvig-inventory-changed',dress);
 window.addEventListener('pageshow',dress);
 // Folk riddles previously selected for the project; the answers are pictorial.
 const riddles=[
  {q:'Зелёные глаза — всем мышам гроза.',opts:[['Кошка','🐈'],['Собака','🐕'],['Мышь','🐭']],correct:0,hint:'Этот зверь мурлычет.'},
  {q:'Не ездок, а со шпорами, не сторож, а всех будит.',opts:[['Сова','🦉'],['Петух','🐓'],['Орёл','🦅']],correct:1,hint:'У него есть гребешок, и он кричит «кукареку».'},
  {q:'Пятак есть, а ничего не купит.',opts:[['Свинья','🐖'],['Корова','🐄'],['Лошадь','🐎']],correct:0,hint:'У неё есть пятачок на носу.'},
  {q:'Красная девица сидит в темнице, а коса на улице.',opts:[['Морковь','🥕'],['Яблоко','🍎'],['Кукуруза','🌽']],correct:0,hint:'Это оранжевый корнеплод с зелёной ботвой.'},
  {q:'Два конца, два кольца, а в середке гвоздик.',opts:[['Ключ','🗝️'],['Ножницы','✂️'],['Веник','🧹']],correct:1,hint:'Этим предметом режут бумагу.'},
  {q:'День спит, ночь глядит, утром умирает, другой сменяет.',opts:[['Фонарик','🔦'],['Свеча','🕯️'],['Лампочка','💡']],correct:1,hint:'У неё горит маленький огонёк на фитиле.'},
  {q:'Не лает, не кусает, а в дом не пускает.',opts:[['Дверь','🚪'],['Замок','🔒'],['Собака','🐕']],correct:1,hint:'Его открывают ключом.'},
  {q:'Вверху зелено, внизу красно, в землю вросло.',opts:[['Лук','🧅'],['Свёкла','beet'],['Морковь','🥕']],correct:1,hint:'Это круглый бордовый овощ с зелёными листьями.'}
 ];
 const beetSvg='<svg viewBox="0 0 100 110" aria-hidden="true"><path d="M52 26C37 11 33 6 31 3 25 13 30 24 38 32M55 26c11-19 22-23 29-22-2 20-16 29-27 30M55 27C57 10 50 3 46 1c-9 13-3 24 6 31" fill="#518940" stroke="#2a6837" stroke-width="3"/><path d="M51 34c-33-2-41 18-39 38 2 23 26 37 39 35 13 2 37-12 39-35 2-20-6-40-39-38Z" fill="#aa3056" stroke="#64223d" stroke-width="4"/><path d="M24 61c6-11 12-16 24-17" stroke="#ff9aba" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/></svg>';
 let stage='intro',idx=0,correctCount=0,wrongCount=0,bonus=false,locked=false,transition=null,allAttempts=0;
 const sound=type=>{try{void window.TivvigHadesSounds?.play(type)}catch(e){}};
 const clear=()=>{if(transition){clearTimeout(transition);transition=null}};
 const hide=id=>$(id).hidden=true,show=id=>$(id).hidden=false;
 function setStage(s){stage=s;scene.dataset.stage=s}
 function setMessage(t){$('sphinxSpeech').textContent=t}
 function paintStone(){
  const pct=Math.round(100*Math.min(correctCount,6)/6);
  scene.style.setProperty('--stonePct',pct+'%');
  const prog=$('progress');prog.replaceChildren();
  for(let n=0;n<6;n++){const star=document.createElement('span');star.className='star'+(n<correctCount?' lit':'');star.textContent='✦';star.setAttribute('aria-hidden','true');prog.append(star)}
  prog.setAttribute('aria-label',Math.min(correctCount,6)+' из 6 загадок');
 }
 function displayChoice(b,i,choice){
  const [label,icon]=choice;
  b.setAttribute('aria-label',label);
  b.dataset.answer=label;
  b.disabled=false;
  b.classList.remove('correct','wrong');
  $('icon-'+i).innerHTML=icon==='beet'?beetSvg:'';
  if(icon!=='beet')$('icon-'+i).textContent=icon;
 }
 function render(){
  if(stage!=='quiz')return;
  const r=riddles[idx];
  setMessage(r.q);
  $('roundLabel').textContent='Загадка '+(idx+1)+' из '+(bonus?8:6);
  $('riddleNum').textContent=idx<6?'ЗАГАДКА СФИНКСА':'СЕКРЕТНАЯ ЗАГАДКА';
  show('roundLabel');show('riddleNum');show('choices');show('hintButton');
  hide('introActions');hide('checkpointActions');hide('finishActions');hide('finishTale');
  $('feedback').textContent='';
  r.opts.forEach((op,i)=>displayChoice($('choice-'+i),i,op));
  wrongCount=0;locked=false;
 }
 function begin(){
  if(stage!=='intro')return;
  idx=0;correctCount=0;wrongCount=0;bonus=false;locked=false;allAttempts=0;
  setStage('quiz');paintStone();render();sound('tap');
 }
 function choose(answer){
  if(stage!=='quiz'||locked||answer<0||answer>2)return;
  allAttempts++;const r=riddles[idx],selected=$('choice-'+answer);
  if(answer!==r.correct){
   wrongCount++;selected.classList.add('wrong');$('feedback').textContent=wrongCount>=2?r.hint:'Попробуй ещё!';sound('wrong');
   clear();transition=setTimeout(()=>selected.classList.remove('wrong'),360);
   return;
  }
  locked=true;
  selected.classList.add('correct');
  for(let i=0;i<3;i++)$('choice-'+i).disabled=true;
  correctCount++;paintStone();sound('success');
  $('feedback').textContent=idx<5?'Верно! Сфинкс понемногу превращается в камень!':'Правильно!';
  clear();transition=setTimeout(()=>{
   transition=null;idx++;
   if(idx===6 && !bonus){checkpoint();return}
   if(idx>=8){finish();return}
   render();
  },680);
 }
 function checkpoint(){
  locked=false;setStage('checkpoint');
  hide('choices');hide('hintButton');hide('riddleNum');hide('roundLabel');
  $('feedback').textContent='';
  setMessage('Сфинкс стал каменным! Хочешь ещё две загадки или войдём в храм?');
  show('checkpointActions');
 }
 function extra(){
  if(stage!=='checkpoint')return;
  bonus=true;idx=6;setStage('quiz');sound('tap');render();
 }
 function finish(){
  clear();setStage('done');locked=false;correctCount=Math.max(correctCount,6);paintStone();
  hide('choices');hide('hintButton');hide('roundLabel');hide('riddleNum');hide('checkpointActions');hide('introActions');
  show('finishActions');show('finishTale');$('feedback').textContent='';
  setMessage('Все загадки разгаданы!');
  try{localStorage.setItem(REWARD,'unlocked')}catch(e){}
  try{if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);
    else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}))}catch(e){}
  sound('finish');
 }
 function reset(){
  clear();stage='intro';idx=0;correctCount=0;wrongCount=0;bonus=false;locked=false;allAttempts=0;
  setStage('intro');paintStone();
  $('feedback').textContent='';setMessage('Сфинкс не пропускает к храму. Он задаст загадки: сначала отгадай вслух, потом выбери картинку!');
  hide('choices');hide('hintButton');hide('checkpointActions');hide('finishActions');hide('finishTale');hide('roundLabel');hide('riddleNum');show('introActions');
 }
 $('startSphinx').addEventListener('click',begin);
 for(let i=0;i<3;i++)$('choice-'+i).addEventListener('click',()=>choose(i));
 $('hintButton').addEventListener('click',()=>{
  if(stage!=='quiz')return;
  $('feedback').textContent=riddles[idx].hint;
  sound('tap');
 });
 $('finishSphinx').addEventListener('click',finish);
 $('bonusSphinx').addEventListener('click',extra);
 $('replaySphinx').addEventListener('click',reset);
 window.addEventListener('pagehide',clear);
 window.TivvigSphinxDebug=Object.freeze({
  state:()=>({stage,index:idx,correctCount,bonus,locked,wrongCount,allAttempts,stone:Math.min(100,Math.round(100*correctCount/6)),reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
  begin,choose,checkpoint,extra,finish,reset,
  correctNow:()=>{if(stage==='quiz')choose(riddles[idx].correct)}
 });
 reset();dress();
})();