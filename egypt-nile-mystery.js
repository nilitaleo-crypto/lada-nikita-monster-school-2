/* Two scenes: meet Nafiri and Pёsel, investigate Sphinx evidence.
 * Local sound test remains local; co-op controls are mirrored by world-coop-bridge.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),scene=$('nileScene');
 if(!scene||window.TivvigNileDebug)return;
 const REWARD='tivvig_egypt_sphinx_investigation_v1';
 const clues={
  paw:{question:'Чей это огромный след?',opts:[['Лев','lion'],['Птица','bird'],['Крокодил','croc']],correct:'lion',feedback:'Львиная лапа!'},
  cloth:{question:'Какой узор был на уборе?',opts:[['Синий с золотом','bluegold'],['Красный','red'],['Зелёный','green']],correct:'bluegold',feedback:'Сине-золотой царский убор!'},
  claw:{question:'Сколько царапин на камне?',opts:[['2','2'],['4','4'],['3','3']],correct:'4',feedback:'Четыре глубокие царапины!'},
  voice:{question:'Чьё лицо нарисовано на папирусе?',opts:[['Человека','human'],['Шакала','jackal'],['Крокодила','croc']],correct:'human',feedback:'Человеческая голова!'}
 };
 let stage='meet',met=new Set(),evidence=new Set(),active=null,misses=0;
 const sound=t=>{try{void window.TivvigHadesSounds?.play(t)}catch(e){}};
 const say=t=>{$('storyLine').textContent=t};
 const label=(name,metYet)=>{$(name).classList.toggle('met',metYet);$(name).querySelector('.talk-mark').textContent=metYet?'✓':'?'};
 function hello(who){
  if(stage!=='meet')return;
  met.add(who);label(who,true);sound('tap');
  if(who==='fox')say('Пёсель: «Тяв! Я учуял странные следы у деревни!»');
  else say('Нафири: «На деревню напало чудовище. Помоги узнать, кто!»');
  if(met.size===2)$('toInvestigation').hidden=false;
 }
 function investigation(){
  if(stage!=='meet'||met.size!==2)return;
  stage='investigate';scene.dataset.scene=stage;
  $('portalBack').classList.add('gone');$('toInvestigation').hidden=true;
  $('clueField').hidden=false;$('evidenceStatus').hidden=false;
  $('fox').disabled=true;$('nafiri').disabled=true;
  say('Пёсель заметил следы. Исследуй четыре улики!');sound('success');
 }
 function selectClue(id){
  if(stage!=='investigate'||!clues[id]||evidence.has(id))return;
  active=id;
  const clue=clues[id];const options=$('inspectChoices');options.replaceChildren();
  for(const [text,value] of clue.opts){
   const b=document.createElement('button');b.type='button';b.textContent=text;b.id='answer-'+id+'-'+value;b.dataset.tivvigSound='manual';
   b.addEventListener('click',()=>answer(id,value));options.append(b);
  }
  $('inspectQuestion').textContent=clue.question;$('inspectPrompt').hidden=false;
  sound('tap');
 }
 function answer(id,value){
  if(stage!=='investigate'||active!==id||evidence.has(id))return;
  const clue=clues[id];
  if(value!==clue.correct){misses++;say('Посмотри внимательнее. Попробуй ещё раз!');sound('wrong');return}
  evidence.add(id);const target=$('clue-'+id);target.disabled=true;target.classList.add('solved');target.setAttribute('aria-label',clue.feedback);
  $('inspectPrompt').hidden=true;active=null;$('evidenceStatus').textContent='Улики '+evidence.size+'/4';
  say(clue.feedback);sound('success');
  if(evidence.size===4){
   setTimeout(()=>{
    if(stage!=='investigate'||evidence.size!==4)return;
    $('suspects').hidden=false;say('Все улики собраны. Кто напал на деревню?');sound('finish');
   },420);
  }
 }
 function suspect(name){
  if(stage!=='investigate'||evidence.size!==4)return;
  if(name!=='sphinx'){
   misses++;sound('wrong');
   $('suspectFeedback').textContent=name==='sekhmet'?'У Сехмет львиная голова, но тело человека. А нам нужно наоборот.':name==='anubis'?'У Анубиса голова шакала, а след — львиный.':'У Собека голова крокодила, а след — львиный.';
   return;
  }
  stage='done';scene.dataset.scene=stage;$('suspects').hidden=true;
  $('clueField').hidden=true;$('evidenceStatus').hidden=true;$('victory').hidden=false;
  say('Это Сфинкс! Но зачем он разрушил ворота?');sound('finish');
  try{localStorage.setItem(REWARD,'unlocked')}catch(e){}
  try{if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}))}catch(e){}
 }
 function reset(){
  stage='meet';met=new Set();evidence=new Set();active=null;misses=0;scene.dataset.scene=stage;
  ['fox','nafiri'].forEach(x=>{label(x,false);$(x).disabled=false});
  $('portalBack').classList.remove('gone');$('toInvestigation').hidden=true;
  $('clueField').hidden=true;$('inspectPrompt').hidden=true;$('evidenceStatus').hidden=true;$('evidenceStatus').textContent='Улики 0/4';
  $('suspects').hidden=true;$('victory').hidden=true;
  Object.keys(clues).forEach(x=>{const c=$('clue-'+x);c.disabled=false;c.classList.remove('solved')});
  $('suspectFeedback').textContent='Вспомни след, убор и рисунок на папирусе.';
  say('Лада вышла из портала… А где друзья?');
 }
 $('fox').addEventListener('click',()=>hello('fox'));
 $('nafiri').addEventListener('click',()=>hello('nafiri'));
 $('toInvestigation').addEventListener('click',investigation);
 Object.keys(clues).forEach(x=>$('clue-'+x).addEventListener('click',()=>selectClue(x)));
 document.querySelectorAll('[data-suspect]').forEach(b=>b.addEventListener('click',()=>suspect(b.dataset.suspect)));
 $('restartNile').addEventListener('click',reset);
 window.TivvigNileDebug=Object.freeze({
  state:()=>({stage,met:[...met],evidence:[...evidence],active,misses,stored:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
  hello,investigation,selectClue,answer,suspect,reset
 });
 reset();
})();