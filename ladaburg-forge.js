/* Кузница Вулкана. Deterministic stages for local play and Firebase co-op replay.
 * All child actions use regular buttons; no drag, hover, timing thresholds or network assets. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const STEPS=['intro','rhythm','assembly','reading','runes','victory'];
const BEATS=[['B','S','B'],['B','B','S','B'],['S','B','B','S']];
const PATTERNS=[
 {known:['☾','✦','☾','✦'],answer:'☾'},
 {known:['◆','◆','✦','◆','◆','✦'],answer:'◆'},
 {known:['✦','☾','◆','✦','☾'],answer:'◆'}
];
const READING=[
 {chunks:['ВО','ДА'],target:'water',success:'Вода зашипела — раскалённая броня закаляется!'},
 {chunks:['РУ','НА'],target:'rune',success:'Камень засветился. Кузнецы перенесли знак на броню!'},
 {chunks:['КРЫ','ЛО'],target:'wing',success:'Крыло расправилось и теперь готово к полёту!'},
 {chunks:['ЛА','ДА,','БЕ','РИ','МЕЧ!'],target:'sword',success:'Лада берёт меч! Теперь доспехи готовы к последнему заклинанию.'}
];
const PARTS=['wings','chest','arms','legs'];
const PART_NAMES={wings:'Крылья',chest:'Нагрудник',arms:'Наручи',legs:'Поножи'};
const KEY='tivvig_outfit_monankaka_unlocked_v1';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const reduce=!!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
let stage='intro',round=0,played=[],hasListened=false,busy=false,serial=0;
let selectedPart=null,doneParts=new Set(),readingRound=0,readingPressed=new Set(),runeRound=0,transitioning=false;
/* Two engines: local WAV samples for iOS/Android; WebAudio as fallback.
   A real tap on this device plays an audible hammer sample. Firebase still
   replicates all gameplay clicks, but not the local audio-test button. */
let audio=null, audioSeeded=false, mediaUnlocked=false, clips=null;
function soundIndicator(message){
 const button=$('enableForgeSound'),hint=$('forgeSoundHint');if(!button||!hint)return;
 button.textContent=mediaUnlocked?'🔊 Проверить звук':'🔈 Включить звук';
 button.setAttribute('aria-pressed',String(mediaUnlocked));
 hint.textContent=message||(mediaUnlocked?'Нажми ещё раз, чтобы услышать молот.':'Нажми здесь на своём телефоне.');
}
function sampleWav(which){
 const rate=22050,count=Math.round(rate*(which==='B'?.36:.30));
 const bytes=new Uint8Array(44+count*2),data=new DataView(bytes.buffer);
 function name(at,value){for(let i=0;i<value.length;i++)bytes[at+i]=value.charCodeAt(i)}
 name(0,'RIFF');data.setUint32(4,bytes.length-8,true);name(8,'WAVE');
 name(12,'fmt ');data.setUint32(16,16,true);data.setUint16(20,1,true);
 data.setUint16(22,1,true);data.setUint32(24,rate,true);data.setUint32(28,rate*2,true);
 data.setUint16(32,2,true);data.setUint16(34,16,true);
 name(36,'data');data.setUint32(40,count*2,true);
 let seed=which==='B'?1234567:918273;
 for(let i=0;i<count;i++){
  const t=i/rate,attack=Math.min(1,t*240);
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=(seed/2147483648)-1;
  const metal=which==='B'
   ? .52*Math.sin(2*Math.PI*(166*t-70*t*t))+.23*Math.sin(2*Math.PI*286*t)+.14*Math.sin(2*Math.PI*606*t)
   : .43*Math.sin(2*Math.PI*735*t)+.30*Math.sin(2*Math.PI*1168*t)+.22*Math.sin(2*Math.PI*1730*t);
  const value=attack*(metal*Math.exp(-(which==='B'?11:12)*t)+noise*.23*Math.exp(-36*t));
  data.setInt16(44+i*2,Math.max(-32767,Math.min(32767,Math.round(value*30000))),true);
 }
 let raw='';
 for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
 return 'data:audio/wav;base64,'+btoa(raw);
}
function getClips(){
 if(clips)return clips;
 clips={};
 try{
  if(typeof Audio!=='function'||typeof btoa!=='function')return clips;
  for(const kind of ['B','S']){
   const player=new Audio(sampleWav(kind));
   player.preload='auto';player.volume=1;player.setAttribute?.('playsinline','');
   clips[kind]=player;
  }
 }catch(e){clips={}}
 return clips;
}
function primeAudioOnGesture(){
 try{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  if(!audio)audio=new Context();
  if(!audioSeeded){
   const osc=audio.createOscillator(),gain=audio.createGain();
   gain.gain.value=0;osc.connect(gain);gain.connect(audio.destination);
   osc.start();osc.stop(audio.currentTime+.012);audioSeeded=true;
  }
  if(audio.state==='suspended')audio.resume().catch(()=>{});
 }catch(e){}
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
  volume.gain.exponentialRampToValueAtTime(which==='B'?.24:.18,start+.014);
  volume.gain.exponentialRampToValueAtTime(.0001,start+.3);
  osc.connect(volume);volume.connect(audio.destination);osc.start(start);osc.stop(start+.31);
 }catch(e){}
}
function playHammer(which,test=false){
 const player=getClips()[which];
 if(!player){tone(which);if(test)soundIndicator('Нет поддержки аудиосэмплов. Проверь громкость.');return}
 try{
  player.pause();player.currentTime=0;
  const result=player.play();
  if(result?.then){
   result.then(()=>{
    if(test){mediaUnlocked=true;soundIndicator('Звук запущен. Услышал удар? Если нет — проверь громкость и беззвучный режим.')}
   }).catch(()=>{
    tone(which);
    if(test)soundIndicator('Браузер заблокировал звук. Коснись кнопки ещё раз.');
   });
  }else if(test){mediaUnlocked=true;soundIndicator('Услышал удар? Если нет — проверь громкость.')}
 }catch(e){tone(which);if(test)soundIndicator('Не получилось воспроизвести. Коснись кнопки ещё раз.')}
}
function activateLocalSound(){
 primeAudioOnGesture();
 // Called synchronously by the phone's trusted click, never by Firebase.
 playHammer('B',true);
}
window.addEventListener('pointerdown',primeAudioOnGesture,{passive:true});
window.addEventListener('touchend',primeAudioOnGesture,{passive:true});
window.addEventListener('keydown',primeAudioOnGesture);
const text=(id,value)=>{const el=$(id);if(el)el.textContent=value};
function status(id,message,kind=''){
 const el=$(id);if(!el)return;el.textContent=message;
 el.classList.toggle('good',kind==='good');el.classList.toggle('bad',kind==='bad');
}
function hitEffect(which){
 const anvil=$('anvil');
 anvil.classList.remove('strike');void anvil.offsetWidth;anvil.classList.add('strike');
 text('forgeSound',which==='B'?'⚒ БАМ! Искры летят!':'✦ ДЗИНЬ! Звонкий удар!');
 playHammer(which);window.setTimeout(()=>anvil.classList.remove('strike'),reduce?45:220);
}
function setStage(next){
 stage=next;transitioning=false;serial++;busy=false;
 for(const name of STEPS)$(name).hidden=name!==next;
 for(const [idx,name] of ['rhythm','assembly','reading','runes'].entries()){
  const el=$('progress-'+name),current=STEPS.indexOf(next);
  el.classList.toggle('active',current===idx+1);
  el.classList.toggle('done',current>idx+1);
 }
 if(next==='rhythm')renderRhythm();
 if(next==='assembly')renderAssembly();
 if(next==='reading')renderReading();
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
  const art=$('armor-art-'+part);if(art)art.hidden=!solved;
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
  transitioning=true;status('assemblyStatus','Все детали собраны! Теперь надо прочитать инструкцию Вулкана.','good');
  window.setTimeout(()=>{if(stage==='assembly'&&transitioning)setStage('reading')},reduce?80:850);
 }
}
/* Every reading round couples a real syllable-written parchment to a physical prop.
 * The prompt never includes the target image. Taps on syllables provide a visual reading aid,
 * but only the correct workshop object advances the ritual. */
function renderReading(){
 if(stage!=='reading')return;
 const task=READING[readingRound],scroll=$('reading-word');
 text('reading-count','Пергамент '+(readingRound+1)+' из '+READING.length);
 scroll.replaceChildren();
 task.chunks.forEach((part,index)=>{
  if(index){
   const newWord=readingRound===3&&(index===2||index===4);
   const separator=document.createElement('span');
   separator.className=newWord?'scroll-space':'scroll-dash';
   separator.textContent=newWord?' ':'-';
   separator.setAttribute('aria-hidden','true');
   scroll.appendChild(separator);
  }
  const b=document.createElement('button');
  b.type='button';b.className='scroll-syllable';b.id='read-syllable-'+index;
  b.textContent=part;b.setAttribute('aria-label','Прочитать часть '+part.replace(/[!,]/g,''));
  b.classList.toggle('read',readingPressed.has(index));
  b.addEventListener('click',()=>highlightSyllable(index));scroll.appendChild(b);
 });
 text('reading-message',readingRound===3?'Последняя записка — целое предложение. Прочитай его вслух.':'Прочитай слово вслух и найди то, что оно называет.');
 const stamps=$('reading-stamps').children;
 for(let i=0;i<stamps.length;i++){
  const won=i<readingRound;stamps[i].textContent=won?'✦':'✧';stamps[i].classList.toggle('done',won);
 }
 document.querySelectorAll('[data-object]').forEach(b=>{
  const used=READING.slice(0,readingRound).some(r=>r.target===b.dataset.object);
  b.disabled=used||transitioning;b.classList.toggle('used',used);b.classList.remove('wrong');
 });
 status('reading-status','Прочитай вслух и найди предмет. Слоги можно подсветить нажатием.');
}
function highlightSyllable(index){
 if(stage!=='reading'||transitioning||!Number.isInteger(index))return;
 const task=READING[readingRound];if(index<0||index>=task.chunks.length)return;
 if(readingPressed.has(index))readingPressed.delete(index);else readingPressed.add(index);
 const b=$('read-syllable-'+index);if(b)b.classList.toggle('read',readingPressed.has(index));
 status('reading-status','Прочитай выделенную часть, затем попробуй соединить слово целиком.');
}
function pickReadingObject(id,button){
 if(stage!=='reading'||transitioning||!button||button.disabled)return;
 const task=READING[readingRound];
 if(id!==task.target){
  button.classList.remove('wrong');void button.offsetWidth;button.classList.add('wrong');
  status('reading-status','Это другой предмет. Прочитай записку ещё раз.','bad');return;
 }
 transitioning=true;
 document.querySelectorAll('[data-object]').forEach(b=>b.disabled=true);
 button.classList.add('used');
 text('reading-message',task.success);
 status('reading-status',task.success,'good');
 const token=++serial;
 window.setTimeout(()=>{
  if(token!==serial||stage!=='reading')return;
  readingRound++;readingPressed.clear();transitioning=false;
  if(readingRound===READING.length){setStage('runes');return}
  renderReading();
 },reduce?120:900);
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
 serial++;round=0;played=[];hasListened=false;busy=false;selectedPart=null;doneParts.clear();readingRound=0;readingPressed.clear();runeRound=0;transitioning=false;
 $('equipArmor').textContent='♛ Надеть доспехи';setStage('intro');
}
$('enableForgeSound').addEventListener('click',activateLocalSound);
$('begin').addEventListener('click',()=>setStage('rhythm'));
$('listen').addEventListener('click',listen);
document.querySelectorAll('[data-hit]').forEach(button=>button.addEventListener('click',()=>strike(button.dataset.hit)));
document.querySelectorAll('[data-piece]').forEach(button=>button.addEventListener('click',()=>selectPart(button.dataset.piece)));
document.querySelectorAll('[data-slot]').forEach(button=>button.addEventListener('click',()=>placePart(button.dataset.slot)));
document.querySelectorAll('[data-rune]').forEach(button=>button.addEventListener('click',()=>chooseRune(button.dataset.rune)));
document.querySelectorAll('[data-object]').forEach(button=>button.addEventListener('click',()=>pickReadingObject(button.dataset.object,button)));
$('equipArmor').addEventListener('click',equip);$('replay').addEventListener('click',reset);
window.__vulcanForgeTest={
 state:()=>({stage,round,played:[...played],hasListened,busy,selectedPart,doneParts:[...doneParts],readingRound,readingPressed:[...readingPressed],runeRound,unlocked:(()=>{try{return localStorage.getItem(KEY)==='unlocked'}catch{return false}})()}),
 beats:BEATS.map(x=>[...x]),parts:[...PARTS],reading:READING.map(x=>({chunks:[...x.chunks],target:x.target})),runes:PATTERNS.map(p=>({known:[...p.known],answer:p.answer})),
 start:()=>$('begin').click(),listen:()=>$('listen').click(),
 hit:which=>document.querySelector('[data-hit="'+which+'"]')?.click(),
 part:key=>$('part-'+key)?.click(),slot:key=>$('slot-'+key)?.click(),
 syllable:index=>$('read-syllable-'+index)?.click(),readingObject:id=>document.querySelector('[data-object="'+id+'"]')?.click(),
 rune:symbol=>document.querySelectorAll('[data-rune]').forEach(b=>{if(b.dataset.rune===symbol)b.click()}),
 equip:()=>$('equipArmor').click(),reset
};
reset();soundIndicator();
})();