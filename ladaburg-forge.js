/* Кузница Вулкана. Deterministic stages for local play and Firebase co-op replay.
 * All child actions use regular buttons; no drag, hover, timing thresholds or network assets. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const STEPS=['intro','rhythm','assembly','runes','victory'];
const BEATS=[['B','S','B'],['B','B','S','B'],['S','B','B','S']];
const PATTERNS=[
 {known:['☾','✦','☾','✦'],answer:'☾'},
 {known:['◆','◆','✦','◆','◆','✦'],answer:'◆'},
 {known:['✦','☾','◆','✦','☾'],answer:'◆'}
];
const PARTS=['wings','chest','arms','legs'];
const PART_NAMES={wings:'Крылья',chest:'Нагрудник',arms:'Наручи',legs:'Поножи'};
const KEY='tivvig_outfit_monankaka_unlocked_v1';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const reduce=!!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
let stage='intro',round=0,played=[],hasListened=false,busy=false,serial=0;
let selectedPart=null,doneParts=new Set(),runeRound=0,transitioning=false;
let audio=null;
const text=(id,value)=>{const el=$(id);if(el)el.textContent=value};
function status(id,message,kind=''){
 const el=$(id);if(!el)return;el.textContent=message;el.classList.toggle('good',kind==='good');el.classList.toggle('bad',kind==='bad');
}
function tone(which){
 try{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  if(!audio)audio=new Context();
  if(audio.state==='suspended')audio.resume().catch(()=>{});
  const osc=audio.createOscillator(),volume=audio.createGain(),start=audio.currentTime;
  osc.type=which==='B'?'triangle':'sine';
  osc.frequency.setValueAtTime(which==='B'?145:620,start);
  osc.frequency.exponentialRampToValueAtTime(which==='B'?80:350,start+.17);
  volume.gain.setValueAtTime(.0001,start);
  volume.gain.exponentialRampToValueAtTime(which==='B'?.16:.09,start+.014);
  volume.gain.exponentialRampToValueAtTime(.0001,start+.24);
  osc.connect(volume);volume.connect(audio.destination);osc.start(start);osc.stop(start+.26);
 }catch(e){ /* Visual feedback is sufficient when audio playback is unavailable. */ }
}
function hitEffect(which){
 const anvil=$('anvil');
 anvil.classList.remove('strike');void anvil.offsetWidth;anvil.classList.add('strike');
 text('forgeSound',which==='B'?'⚒ БАМ! Искры летят!':'✦ ДЗИНЬ! Звонкий удар!');
 tone(which);window.setTimeout(()=>anvil.classList.remove('strike'),reduce?45:220);
}
function setStage(next){
 stage=next;transitioning=false;serial++;busy=false;
 for(const name of STEPS)$(name).hidden=name!==next;
 for(const [idx,name] of ['rhythm','assembly','runes'].entries()){
  const el=$('progress-'+name),current=['intro','rhythm','assembly','runes','victory'].indexOf(next);
  el.classList.toggle('active',current===idx+1);
  el.classList.toggle('done',current>idx+1);
 }
 if(next==='rhythm')renderRhythm();
 if(next==='assembly')renderAssembly();
 if(next==='runes')renderRunes();
 if(next==='victory')award();
 if(next!=='intro')window.setTimeout(()=>{
  if(stage===next)$('rhythm').parentElement.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
 },70);
}
function drawBeats(){
 const demo=$('beatDemo'),input=$('beatInput'),arr=BEATS[round];
 demo.replaceChildren();input.replaceChildren();
 for(let i=0;i<arr.length;i++){
  const a=document.createElement('span');a.className='beat guess';a.textContent='?';demo.appendChild(a);
  const b=document.createElement('span');b.className='beat';b.textContent=i<played.length?(played[i]==='B'?'🔨':'✧'):'·';input.appendChild(b);
 }
}
function renderRhythm(){
 if(stage!=='rhythm')return;
 text('rhythm-counter','Ритм '+(round+1)+' из '+BEATS.length);
 drawBeats();$('listen').disabled=busy;
 document.querySelectorAll('[data-hit]').forEach(btn=>btn.disabled=busy||!hasListened);
 status('rhythmStatus',hasListened?'Повтори ритм — большой и маленький молоты.':'Нажми «Послушать ритм».');
}
async function listen(){
 if(stage!=='rhythm'||busy)return;
 const token=++serial;busy=true;hasListened=false;played=[];renderRhythm();$('listen').disabled=true;
 status('rhythmStatus','Вулкан показывает удары — смотри и слушай!');
 await sleep(reduce?70:380);if(token!==serial||stage!=='rhythm')return;
 const beats=BEATS[round];
 for(let i=0;i<beats.length;i++){
  if(token!==serial||stage!=='rhythm')return;
  const nodes=$('beatDemo').children;
  nodes[i].textContent=beats[i]==='B'?'🔨':'✧';nodes[i].classList.remove('guess');nodes[i].classList.add('now');
  hitEffect(beats[i]);
  await sleep(reduce?100:660);
  if(token!==serial||stage!=='rhythm')return;
  nodes[i].classList.remove('now');
  await sleep(reduce?25:210);
 }
 hasListened=true;busy=false;drawBeats();renderRhythm();
 status('rhythmStatus','Теперь твоя очередь! Повтори услышанные удары.');
}
function strike(which){
 if(stage!=='rhythm'||!hasListened||busy)return;
 hitEffect(which);const expected=BEATS[round][played.length];
 if(which!==expected){
  hasListened=false;played=[];renderRhythm();
  status('rhythmStatus','Немного иначе! Ничего страшного, послушай ритм ещё раз.','bad');
  return;
 }
 played.push(which);renderRhythm();
 const finished=played.length===BEATS[round].length;
 status('rhythmStatus',finished?'Отличная ковка! Ритм повторён!':'Правильно! Продолжай.', 'good');
 if(!finished)return;
 hasListened=false;busy=true;document.querySelectorAll('[data-hit]').forEach(btn=>btn.disabled=true);$('listen').disabled=true;
 const t=++serial;
 window.setTimeout(()=>{
  if(t!==serial||stage!=='rhythm')return;
  round++;played=[];busy=false;
  if(round===BEATS.length){setStage('assembly');return}
  renderRhythm();status('rhythmStatus','Новый ритм! Послушай его перед ковкой.');
 },reduce?80:660);
}
function renderAssembly(){
 if(stage!=='assembly')return;
 text('assembly-count',doneParts.size+'/4');
 for(const part of PARTS){
  const option=$('part-'+part),slot=$('slot-'+part),solved=doneParts.has(part);
  option.disabled=solved;option.classList.toggle('done',solved);
  option.classList.toggle('selected',!solved&&selectedPart===part);
  option.setAttribute('aria-pressed',String(!solved&&selectedPart===part));
  slot.disabled=solved;slot.classList.toggle('done',solved);
  slot.textContent=solved?'✓ '+PART_NAMES[part]:(part==='chest'?'✦ Грудь':part==='wings'?'✧ Крылья':part==='arms'?'✦ Руки':'✦ Ноги');
 }
}
function selectPart(part){
 if(stage!=='assembly'||transitioning||doneParts.has(part))return;
 selectedPart=part;renderAssembly();status('assemblyStatus','В руках '+PART_NAMES[part].toLowerCase()+'. Теперь найди правильное место на стойке.');
}
function placePart(slot){
 if(stage!=='assembly'||transitioning||doneParts.has(slot))return;
 if(!selectedPart){status('assemblyStatus','Сначала возьми деталь с верстака.','bad');return}
 if(selectedPart!==slot){status('assemblyStatus','Эта деталь сюда не подходит. Попробуй другую часть стойки.','bad');return}
 doneParts.add(slot);selectedPart=null;renderAssembly();
 status('assemblyStatus','Деталь прикреплена! Теперь на броне '+doneParts.size+' из 4 частей.','good');
 if(doneParts.size===PARTS.length){
  transitioning=true;status('assemblyStatus','Все детали собраны! Отправляемся зачаровывать доспех.','good');
  window.setTimeout(()=>{if(stage==='assembly'&&transitioning)setStage('runes')},reduce?80:850);
 }
}
function renderRunes(){
 if(stage!=='runes')return;
 const pattern=PATTERNS[runeRound];text('rune-counter','Волшебный узор '+(runeRound+1)+' из '+PATTERNS.length);
 const board=$('rune-pattern');board.replaceChildren();
 for(const symbol of [...pattern.known,'?']){
  const node=document.createElement('span');node.textContent=symbol;
  if(symbol==='?')node.classList.add('blank');
  board.appendChild(node);
 }
 document.querySelectorAll('[data-rune]').forEach(x=>x.disabled=false);
 status('runeStatus','Выбери камень с подходящим знаком.');
}
function chooseRune(symbol){
 if(stage!=='runes'||transitioning)return;
 const current=PATTERNS[runeRound];
 if(symbol!==current.answer){status('runeStatus','Знак не продолжает узор. Присмотрись, что повторяется!','bad');return}
 transitioning=true;
 const last=$('rune-pattern').lastElementChild;
 last.classList.remove('blank');last.textContent=symbol;last.style.background='#23837b';last.style.boxShadow='0 0 21px #55fff0';
 document.querySelectorAll('[data-rune]').forEach(x=>x.disabled=true);
 status('runeStatus','Руна засияла! Магия запечаталась в металле.','good');
 window.setTimeout(()=>{
  if(stage!=='runes'||!transitioning)return;
  runeRound++;
  if(runeRound===PATTERNS.length){setStage('victory');return}
  transitioning=false;renderRunes();
 },reduce?80:830);
}
function award(){
 const registry=window.TivvigRegistry;
 let saved=false;
 try{saved=!!registry?.unlockReward?.(KEY)}catch(e){}
 if(!saved){
  try{localStorage.setItem(KEY,'unlocked')}catch(e){}
  window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:KEY}}));
  window.dispatchEvent(new Event('tivvig-inventory-changed'));
 }
 status('rewardStatus','✦ Крылатая броня открыта. Теперь она хранится в гардеробе Лады.','good');
}
function equip(){
 const api=window.TivvigWardrobe;
 if(api?.select?.('monankaka')){status('rewardStatus','✦ Доспехи надеты! Они появятся на Ладе и в других локациях.','good');$('equipArmor').textContent='✓ Доспехи надеты';return}
 status('rewardStatus','Броня открыта, но переодевание сейчас недоступно. Попробуй открыть гардероб.','bad');
}
function reset(){
 serial++;round=0;played=[];hasListened=false;busy=false;selectedPart=null;doneParts.clear();runeRound=0;transitioning=false;
 $('equipArmor').textContent='♛ Надеть доспехи';setStage('intro');
}
$('begin').addEventListener('click',()=>setStage('rhythm'));
$('listen').addEventListener('click',listen);
document.querySelectorAll('[data-hit]').forEach(button=>button.addEventListener('click',()=>strike(button.dataset.hit)));
document.querySelectorAll('[data-piece]').forEach(button=>button.addEventListener('click',()=>selectPart(button.dataset.piece)));
document.querySelectorAll('[data-slot]').forEach(button=>button.addEventListener('click',()=>placePart(button.dataset.slot)));
document.querySelectorAll('[data-rune]').forEach(button=>button.addEventListener('click',()=>chooseRune(button.dataset.rune)));
$('equipArmor').addEventListener('click',equip);$('replay').addEventListener('click',reset);
window.__vulcanForgeTest={
 state:()=>({stage,round,played:[...played],hasListened,busy,selectedPart,doneParts:[...doneParts],runeRound,unlocked:(()=>{try{return localStorage.getItem(KEY)==='unlocked'}catch{return false}})()}),
 beats:BEATS.map(x=>[...x]),parts:[...PARTS],runes:PATTERNS.map(p=>({known:[...p.known],answer:p.answer})),
 start:()=>$('begin').click(),listen:()=>$('listen').click(),
 hit:which=>document.querySelector('[data-hit="'+which+'"]')?.click(),
 part:key=>$('part-'+key)?.click(),slot:key=>$('slot-'+key)?.click(),
 rune:symbol=>document.querySelectorAll('[data-rune]').forEach(b=>{if(b.dataset.rune===symbol)b.click()}),
 equip:()=>$('equipArmor').click(),reset
};
reset();
})();