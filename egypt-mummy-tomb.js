/* Egyptian mummy tomb: deterministic co-op clicks and touch-first puzzles. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),scene=$('mummyScene');
if(!scene||window.TivvigMummyDebug)return;
const REWARD='tivvig_egypt_mummy_scarab_v1';
const sprite=new Image();sprite.onerror=()=>document.documentElement.classList.add('no-cycle-art');sprite.src='images/egypt-mummy-cycles-hq.avif';
const fresco=[
 {key:'frog',question:'Как головастик превращается в лягушку?',order:[0,1,2,3],options:[3,0,2,1],names:['Икра в воде','Появился головастик','Выросли лапки','Взрослая лягушка'],story:['Сначала лягушка откладывает икру.','Из икринки выходит головастик.','У головастика вырастают лапки.','Он становится лягушкой и снова может отложить икру.'],fallback:['🥚','🐟','🐸','🐸'],row:0},
 {key:'apple',question:'Как из семечка вырастает яблоня?',order:[0,1,2,3],options:[2,0,3,1],names:['Семечко','Молодой росток','Яблоня цветёт','Яблоки с семечками'],story:['Семечко падает в землю.','Появляется маленький росток.','Вырастает яблоня с цветами.','Созревает яблоко, внутри новые семечки.'],fallback:['🌰','🌱','🌸','🍎'],row:1},
 {key:'moon',question:'Как меняется Луна?',order:[0,1,2,3],options:[2,3,0,1],names:['Новолуние','Растущий серп','Полнолуние','Убывающий серп'],story:['В новолуние Луну почти не видно.','Освещённая часть Луны растёт.','Теперь видна полная Луна.','Освещённая часть уменьшается, затем вновь наступает новолуние.'],fallback:['🌑','🌒','🌕','🌘'],row:2}
];
const cycleFrame=(row,col)=>({x:(col*100/3).toFixed(4)+'%',y:(row*50)+'%'});
function paintCycle(el,row,col){
 const place=cycleFrame(row,col);el.style.backgroundPosition=place.x+' '+place.y;el.style.backgroundImage="url('images/egypt-mummy-cycles-hq.avif')";
 el.dataset.cycleRow=String(row);el.dataset.cycleCol=String(col);
}
/* Four historically grounded canopic guardians. The heart stays with the mummy. */
const jars=[
 {organ:'lungs',guardian:'Павиан',god:'Хапи',index:2,riddle:'Нас двое. Мы в груди и наполняемся воздухом при вдохе. Что мы?',hint:'Вспомни, чем мы дышим.'},
 {organ:'stomach',guardian:'Шакал',god:'Дуамутеф',index:1,riddle:'Я похож на мешочек. Внутри меня начинает перевариваться еда. Кто я?',hint:'Подумай, куда еда попадает после того, как ты её проглотишь.'},
 {organ:'liver',guardian:'Человек',god:'Имсети',index:3,riddle:'Я большой орган под правыми рёбрами. Помогаю очищать кровь. Кто я?',hint:'Это не желудок. Посмотри на большой красно-коричневый орган.'},
 {organ:'intestines',guardian:'Сокол',god:'Кебехсенуф',index:0,riddle:'Я длинный, извиваюсь как змейка. После желудка пища идёт по мне. Кто я?',hint:'На рисунке он похож на множество петель.'}
];
const jarByIndex=Object.fromEntries(jars.map(j=>[j.index,j]));
const organs=['lungs','stomach','liver','intestines','heart'];
const organNames={lungs:'Лёгкие',stomach:'Желудок',liver:'Печень',intestines:'Кишечник',heart:'Сердце'};
const organArt={
 lungs:'<path d="M27 9v19M21 24q-4-6-8-4C3 28 4 50 14 53q10 2 11-11V24m8 0q4-6 8-4 10 8 9 26-1 10-10 7-10-2-11-11V24" fill="#c9747f" stroke="#804853" stroke-width="3"/><path d="M27 10v17" stroke="#f7dfc4" stroke-width="5"/>',
 stomach:'<path d="M25 9q-2 19 6 19 7 2 13 11 8 11 0 18-12 9-26 0-7-6-4-18 2-9 11-10Z" fill="#dca468" stroke="#8b603f" stroke-width="3"/><path d="M20 43q14 13 24 1" fill="none" stroke="#fff0cc" stroke-width="4"/>',
 liver:'<path d="M6 22q16-18 38-10 11 5 12 22-2 13-17 18-26 7-34-8Z" fill="#ab6667" stroke="#75423f" stroke-width="3"/><path d="M12 30q18-9 34 0" fill="none" stroke="#d9a2a0" stroke-width="3"/>',
 intestines:'<rect x="9" y="12" width="45" height="46" rx="17" fill="#e0a19a" stroke="#95625c" stroke-width="3"/><path d="M19 22h16q8 0 8 8t-8 8H22q-7 0-7 6t9 6h20M25 17v36" stroke="#965b60" stroke-width="4" fill="none"/>',
 heart:'<path d="M31 56 9 32Q-2 13 15 11q11 0 16 10 6-14 19-10 17 8 4 25Z" fill="#c75b64" stroke="#953c48" stroke-width="4"/>'
};
const art=k=>'<span class="organ-art" aria-hidden="true"></span><span class="organ-name">'+organNames[k]+'</span>';
const targets=[5,7,8,9];
const nameGame={
 name:{order:['МЕ','РИ'],options:['РИ','МИ','МЕ','РА']},
 sentence:{order:['МЕ','РИ','ВИ','ДИТ','РА'],options:['РА','ВИ','МЕ','ДИТ','РИ']}
};
const groups=['mummyFresco','mummyFrescoSlots','mummyJars','mummyJarLabel','mummyOrgans','mummyHeartSpot','mummyScaleNumbers','mummyWeights','mummyPlaced','mummyNameBoard','mummyNameLabel','mummyScarab'];
let stage='intro',round=0,pos=0,chosen=[],pieces=[],namePhase='name',errors=0,correct=0,unlocked=false;
let jarPhase='selectJar',selectedJar=null,lastFilled=null,jarSolved=new Set(),heartFound=false,jarHint=false;
/* Pose is a visual projection of co-op game state; no unsynced random movements. */
const tutor=$('mummyTutor');
let poseTimeout=null;
function basePose(){
 if(stage==='intro')return 'talk';
 if(stage==='fresco')return pos===fresco[round].order.length?'talk':'point-jars';
 if(stage==='jars'){
  if(jarPhase==='selectJar')return 'point-jars';
  if(jarPhase==='riddle')return 'point-organs';
  if(jarPhase==='heart'||jarPhase==='locateHeart')return 'heart';
  return 'happy';
 }
 if(stage==='scales')return 'scales';
 if(stage==='name')return 'talk';
 if(stage==='done')return 'celebrate';
 return 'idle';
}
function applyPose(p){if(tutor)tutor.dataset.pose=p}
function syncPose(){
 if(poseTimeout!==null){clearTimeout(poseTimeout);poseTimeout=null}
 applyPose(basePose());
}
function reactPose(p,duration){
 if(poseTimeout!==null)clearTimeout(poseTimeout);
 applyPose(p);
 poseTimeout=setTimeout(()=>{poseTimeout=null;applyPose(basePose())},duration);
}
const posePreload=new Image();
posePreload.onload=()=>{if(tutor)tutor.classList.add('poses-ready')};
posePreload.onerror=()=>{if(tutor)tutor.classList.remove('poses-ready')};
posePreload.src='images/egypt-tutenstein-poses.webp';
function play(kind){
 try{void window.TivvigHadesSounds?.play(kind)}catch(e){}
 if(kind==='wrong')reactPose('wrong',850);
 else if(kind==='success')reactPose('happy',1040);
 else if(kind==='finish')reactPose('celebrate',1400);
}

function title(t){$('mummySpeech').innerHTML='<strong>Мумия:</strong> '+t}
function feedback(t){$('mummyStatus').textContent=t}
function button(t){const a=$('mummyAction');a.hidden=false;a.textContent=t}
function hideExtras(){groups.forEach(id=>$(id).hidden=true);$('mummyAction').hidden=true;feedback('')}
function dots(){const n=stage==='fresco'?1:stage==='jars'?2:stage==='scales'?3:stage==='name'||stage==='done'?4:0;
 for(let i=0;i<$('mummyDots').children.length;i++)$('mummyDots').children[i].classList.toggle('on',i<n);
 $('mummyDots').setAttribute('aria-label','Этап '+Math.max(1,n)+' из 4');
 scene.dataset.stage=stage}
function render(){
 hideExtras();dots();syncPose();
 if(stage==='intro'){
  title('Кто посмел меня разбудить? Ой... я забыла своё имя! Поможешь?');
  button('Помочь мумии');return;
 }
 if(stage==='fresco'){
  const q=fresco[round],complete=pos===q.order.length;
  $('mummyFresco').hidden=false;$('mummyFrescoSlots').hidden=false;
  title(complete?'Весь круг восстановлен! Расскажи, что происходит, и как всё начинается снова.':pos? q.story[pos-1]+' Что будет дальше?':q.question+' Нажимай картинки по порядку.');
  $('mummyFresco').replaceChildren();
  q.options.forEach((step,i)=>{
   const b=document.createElement('button');
   b.type='button';b.className='tile cycle-tile';b.id='mummy-fresco-'+i;
   b.setAttribute('aria-label',q.names[step]);
   b.title=q.names[step];b.textContent=q.fallback[step];paintCycle(b,q.row,step);
   if(chosen.includes(i)){b.classList.add('done');b.disabled=true}
   b.addEventListener('click',()=>chooseFresco(i));$('mummyFresco').append(b);
  });
  $('mummyFrescoSlots').replaceChildren();
  q.order.forEach((step,i)=>{
   const slot=document.createElement('span');slot.className='cycle-slot';
   slot.setAttribute('aria-label',i<pos?q.names[step]:'Шаг '+(i+1)+' не найден');
   if(i<pos){slot.classList.add('done');slot.textContent=q.fallback[step];paintCycle(slot,q.row,step)}
   else{slot.textContent=String(i+1)}
   $('mummyFrescoSlots').append(slot);
  });
  feedback(complete?'↻ История повторяется':(round+1)+' / '+fresco.length+'  ·  '+pos+' из 4');
  if(complete)button(round===fresco.length-1?'К сосудам →':'Следующая история →');
  return;
 }
 if(stage==='jars'){
  $('mummyJars').hidden=false;$('mummyJarLabel').hidden=false;$('mummyOrgans').hidden=false;
  $('mummyHeartSpot').hidden=jarPhase!=='locateHeart';
  for(let i=0;i<4;i++){
   const b=$('mummy-jar-'+i),done=jarSolved.has(i);
   b.classList.toggle('sealed',done);
   b.classList.toggle('speaking',jarPhase==='riddle'&&selectedJar===i);
   b.classList.toggle('selected',jarPhase==='riddle'&&selectedJar===i);
   b.innerHTML='<span class="jar-art" aria-hidden="true"></span>'+(done?'<span class="jar-mark" aria-hidden="true">✓</span>':'');
   b.disabled=done||!['selectJar','riddle'].includes(jarPhase);
  }
  for(const kind of organs){
   const b=$('mummy-organ-'+kind);
   const done=jars.some(q=>jarSolved.has(q.index)&&q.organ===kind);
   b.classList.toggle('selected',false);
   b.classList.toggle('used',done);
   b.classList.toggle('heart-ready',kind==='heart'&&jarPhase==='heart');
   b.disabled=done||!(jarPhase==='riddle'&&kind!=='heart'||jarPhase==='heart'&&kind==='heart');
  }
  $('mummyJarLabel').textContent=jarPhase==='complete'?'Все канопы защищены':jarSolved.size+' / 4 · Канопы';
  if(jarPhase==='selectJar'){
   title(lastFilled===null?'Египтяне хранили органы в особых сосудах — канопах. Нажми на любой сосуд и отгадай его загадку.':'Верно! Ты нашла орган: '+organNames[jarByIndex[lastFilled].organ].toLowerCase()+'. Его охраняет '+jarByIndex[lastFilled].god+'. Выбирай следующий сосуд!');
   feedback('Нажми на сосуд с головой животного или человека.');
  }else if(jarPhase==='riddle'){
   const q=jarByIndex[selectedJar];
   $('mummySpeech').innerHTML='<strong>Канопа — '+q.guardian+':</strong> '+q.riddle;
   feedback(jarHint?'Подсказка: '+q.hint:'Выбери картинку органа внизу.');
  }else if(jarPhase==='heart'){
   title('Все четыре канопы заполнены. Но какой орган египтяне оставляли внутри мумии?');
   feedback('Найди оставшийся орган.');
  }else if(jarPhase==='locateHeart'){
   title('Верно, сердце! Оно оставалось у мумии для суда Анубиса. Покажи, где моё сердце.');
   feedback('Нажми на светящееся сердце Тутенштейна.');
  }else if(jarPhase==='complete'){
   title('Молодец! Четыре канопы восстановлены, а сердце осталось со мной. Идём к весам Анубиса!');
   feedback('');
   button('К весам →');
  }
  return;
 }
 if(stage==='scales'){
  $('mummyScaleNumbers').hidden=false;$('mummyWeights').hidden=false;$('mummyPlaced').hidden=false;
  const target=targets[round],sum=pieces.reduce((a,b)=>a+b,0);
  title('Весы Анубиса! Положи гири так, чтобы получилось '+target+'.');
  $('mummyTarget').textContent=target;
  $('mummyCurrent').textContent=sum;
  $('mummyPlaced').replaceChildren();
  pieces.forEach(n=>{const s=document.createElement('span');s.textContent=n;$('mummyPlaced').append(s)});
  for(let i=1;i<=4;i++)$('mummy-weight-'+i).disabled=sum===target;
  $('mummy-undo').disabled=!pieces.length||sum===target;
  feedback(sum===target?'Весы уравновешены!':round+1+' / '+targets.length+' — выбери гири 1, 2, 3 или 4.');
  if(sum===target)button(round===targets.length-1?'К камню имени →':'Следующие весы →');
  return;
 }
 if(stage==='name'){
  const s=nameGame[namePhase];const complete=pos===s.order.length;
  $('mummyNameBoard').hidden=false;$('mummyNameLabel').hidden=false;
  $('mummyNameLabel').textContent=namePhase==='name'?'Имя мумии':'Прочитай надпись';
  title(namePhase==='name'?'На камне стёрлось моё имя. Собери его из слогов.':'Ты вспомнила моё имя! Теперь прочти: «Ме-ри ви-дит Ра».');
  $('mummySlots').replaceChildren();
  s.order.forEach((text,i)=>{
   const cell=document.createElement('span');cell.textContent=i<pos?text:'·';
   if(namePhase==='sentence')cell.style.fontSize='clamp(13px,1.35vw,22px)';
   $('mummySlots').append(cell);
  });
  $('mummyOptions').replaceChildren();
  s.options.forEach((text,i)=>{
   const b=document.createElement('button');b.id='mummy-syllable-'+i;b.type='button';b.textContent=text;
   b.setAttribute('aria-label','Слог '+text);
   if(chosen.includes(i)){b.classList.add('used');b.disabled=true}
   else if(complete)b.disabled=true;
   b.addEventListener('click',()=>chooseSyllable(i));$('mummyOptions').append(b);
  });
  feedback(complete?(namePhase==='name'?'МЕ-РИ! Ты вернула мне имя!':'Ме-ри ви-дит Ра. Прочитай вслух!'):'Выбирай слоги слева направо.');
  if(complete)button(namePhase==='name'?'Прочитать фразу →':'Открыть сокровище →');
  return;
 }
 if(stage==='done'){
  $('mummyScarab').hidden=false;
  title('Меня зовут Мери! Спасибо, Лада. Возьми золотого скарабея!');
  feedback('Гробница ожила. Впереди — солнечная ладья Ра.');
  button('Сыграть ещё раз');
 }
}
function next(){
 if(stage==='intro'){stage='fresco';round=0;pos=0;chosen=[];render();play('tap');return}
 if(stage==='fresco'){
  if(pos!==fresco[round].order.length)return;round++;pos=0;chosen=[];
  if(round>=fresco.length){stage='jars';round=0}
  render();play('tap');return
 }
 if(stage==='jars'){
  if(jarPhase!=='complete')return;
  stage='scales';round=0;pieces=[];render();play('tap');return
 }
 if(stage==='scales'){
  if(pieces.reduce((a,b)=>a+b,0)!==targets[round])return;
  round++;pieces=[];
  if(round>=targets.length){stage='name';namePhase='name';round=0;pos=0;chosen=[]}
  render();play('tap');return
 }
 if(stage==='name'){
  if(pos!==nameGame[namePhase].order.length)return;
  if(namePhase==='name'){namePhase='sentence';pos=0;chosen=[];render();play('tap')}
  else finish();
  return
 }
 if(stage==='done')reset();
}
function chooseFresco(i){
 if(stage!=='fresco'||pos>=fresco[round].order.length||chosen.includes(i))return;
 if(fresco[round].options[i]!==fresco[round].order[pos]){errors++;feedback('Подумай, что было раньше.');play('wrong');return}
 chosen.push(i);pos++;correct++;render();play(pos===fresco[round].order.length?'success':'tap');
}
function chooseJar(i){
 if(stage!=='jars'||jarSolved.has(i)||!jarByIndex[i])return;
 if(jarPhase!=='selectJar'&&jarPhase!=='riddle')return;
 selectedJar=i;jarHint=false;jarPhase='riddle';
 render();play('tap');
}
function chooseOrgan(kind){
 if(stage!=='jars'||!organs.includes(kind))return;
 if(jarPhase==='riddle'){
  const q=jarByIndex[selectedJar];
  if(!q)return;
  if(kind!==q.organ){
   errors++;jarHint=true;render();play('wrong');return;
  }
  jarSolved.add(selectedJar);lastFilled=selectedJar;selectedJar=null;jarHint=false;correct++;
  jarPhase=jarSolved.size===4?'heart':'selectJar';
  render();play('success');return;
 }
 if(jarPhase==='heart'&&kind==='heart'){
  jarPhase='locateHeart';correct++;render();play('success');
 }
}
function findHeart(){
 if(stage!=='jars'||jarPhase!=='locateHeart')return;
 heartFound=true;jarPhase='complete';correct++;render();play('success');
}
function chooseWeight(n){
 if(stage!=='scales')return;
 const sum=pieces.reduce((a,b)=>a+b,0),target=targets[round];
 if(sum===target)return;
 if(sum+n>target){errors++;feedback('Слишком тяжело. Попробуй меньшую гирю.');play('wrong');return}
 pieces.push(n);correct++;render();play(sum+n===target?'success':'tap');
}
function undoWeight(){
 if(stage!=='scales'||!pieces.length||pieces.reduce((a,b)=>a+b,0)===targets[round])return;
 pieces.pop();render();play('tap');
}
function chooseSyllable(i){
 if(stage!=='name'||pos>=nameGame[namePhase].order.length||chosen.includes(i))return;
 const s=nameGame[namePhase];
 if(s.options[i]!==s.order[pos]){errors++;feedback('Найди следующий слог.');play('wrong');return}
 chosen.push(i);pos++;correct++;render();play(pos===s.order.length?'success':'tap');
}
function save(){
 if(unlocked)return;unlocked=true;
 try{localStorage.setItem(REWARD,'unlocked')}catch(e){}
 try{
  if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);
  else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}));
 }catch(e){}
}
function finish(){stage='done';save();render();play('finish')}
function reset(){
 stage='intro';round=0;pos=0;chosen=[];pieces=[];namePhase='name';errors=0;correct=0;
 jarPhase='selectJar';selectedJar=null;lastFilled=null;jarHint=false;jarSolved.clear();heartFound=false;
 render()
}
function outfit(){try{window.TivvigWardrobe?.equip($('mummyLada'))}catch(e){}}
$('mummyAction').addEventListener('click',next);
for(let i=0;i<4;i++)$('mummy-jar-'+i).addEventListener('click',()=>chooseJar(i));
for(const kind of organs){$('mummy-organ-'+kind).innerHTML=art(kind);$('mummy-organ-'+kind).addEventListener('click',()=>chooseOrgan(kind))}
$('mummyHeartSpot').addEventListener('click',findHeart);
for(let i=1;i<=4;i++)$('mummy-weight-'+i).addEventListener('click',()=>chooseWeight(i));
$('mummy-undo').addEventListener('click',undoWeight);
window.addEventListener('tivvig-outfit-changed',outfit);
window.addEventListener('tivvig-inventory-changed',outfit);
window.addEventListener('pageshow',outfit);
window.TivvigMummyDebug=Object.freeze({
 state:()=>({stage,round,pos,namePhase,jarPhase,selectedJar,lastFilled,jarHint,tutenPose:tutor?.dataset.pose||'idle',jarSolved:[...jarSolved],heartFound,pieces:[...pieces],chosen:[...chosen],correct,errors,reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
 reset,finish,advance:()=>{
  if(stage==='intro'||stage==='done')return $('mummyAction').click();
  if(stage==='fresco')return pos===fresco[round].order.length?$('mummyAction').click():$('mummy-fresco-'+fresco[round].options.indexOf(fresco[round].order[pos]))?.click();
  if(stage==='jars'){
   if(jarPhase==='selectJar')return $('mummy-jar-'+jars.find(q=>!jarSolved.has(q.index)).index)?.click();
   if(jarPhase==='riddle')return $('mummy-organ-'+jarByIndex[selectedJar].organ)?.click();
   if(jarPhase==='heart')return $('mummy-organ-heart')?.click();
   if(jarPhase==='locateHeart')return $('mummyHeartSpot')?.click();
   if(jarPhase==='complete')return $('mummyAction').click();
  }
  if(stage==='scales'){
   const rem=targets[round]-pieces.reduce((a,b)=>a+b,0);
   if(!rem)return $('mummyAction').click();
   return $('mummy-weight-'+Math.min(4,rem))?.click();
  }
  if(stage==='name'){
   const s=nameGame[namePhase];return pos===s.order.length?$('mummyAction').click():$('mummy-syllable-'+s.options.indexOf(s.order[pos]))?.click();
  }
 }
});
reset();outfit();
})();