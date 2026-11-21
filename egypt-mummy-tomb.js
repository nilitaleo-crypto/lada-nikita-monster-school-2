/* Egyptian mummy tomb: deterministic co-op clicks and touch-first puzzles. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),scene=$('mummyScene');
if(!scene||window.TivvigMummyDebug)return;
const REWARD='tivvig_egypt_mummy_scarab_v1';
const sprite=new Image();sprite.onerror=()=>document.documentElement.classList.add('no-cycle-art');sprite.src='images/egypt-mummy-cycles.avif';
const fresco=[
 {key:'frog',question:'Как головастик превращается в лягушку?',order:[0,1,2,3],options:[3,0,2,1],names:['Икра в воде','Появился головастик','Выросли лапки','Взрослая лягушка'],story:['Сначала лягушка откладывает икру.','Из икринки выходит головастик.','У головастика вырастают лапки.','Он становится лягушкой и снова может отложить икру.'],fallback:['🥚','🐟','🐸','🐸'],row:0},
 {key:'apple',question:'Как из семечка вырастает яблоня?',order:[0,1,2,3],options:[2,0,3,1],names:['Семечко','Молодой росток','Яблоня цветёт','Яблоки с семечками'],story:['Семечко падает в землю.','Появляется маленький росток.','Вырастает яблоня с цветами.','Созревает яблоко, внутри новые семечки.'],fallback:['🌰','🌱','🌸','🍎'],row:1},
 {key:'moon',question:'Как меняется Луна?',order:[0,1,2,3],options:[2,3,0,1],names:['Новолуние','Растущий серп','Полнолуние','Убывающий серп'],story:['В новолуние Луну почти не видно.','Освещённая часть Луны растёт.','Теперь видна полная Луна.','Освещённая часть уменьшается, затем вновь наступает новолуние.'],fallback:['🌑','🌒','🌕','🌘'],row:2}
];
const cycleFrame=(row,col)=>({x:(col*100/3).toFixed(4)+'%',y:(row*50)+'%'});
function paintCycle(el,row,col){
 const place=cycleFrame(row,col);el.style.backgroundPosition=place.x+' '+place.y;el.style.backgroundImage="url('images/egypt-mummy-cycles.avif')";
 el.dataset.cycleRow=String(row);el.dataset.cycleCol=String(col);
}
const jars=[
 {name:'соколом',index:1,thing:'цветок лотоса'},
 {name:'шакалом',index:0,thing:'волшебный камень'},
 {name:'обезьяной',index:2,thing:'золотое зерно'},
 {name:'человеческой головой',index:3,thing:'финики'}
];
const targets=[5,7,8,9];
const nameGame={
 name:{order:['МЕ','РИ'],options:['РИ','МИ','МЕ','РА']},
 sentence:{order:['МЕ','РИ','ВИ','ДИТ','РА'],options:['РА','ВИ','МЕ','ДИТ','РИ']}
};
const groups=['mummyFresco','mummyFrescoSlots','mummyJars','mummyJarLabel','mummyScaleNumbers','mummyWeights','mummyPlaced','mummyNameBoard','mummyNameLabel','mummyScarab'];
let stage='intro',round=0,pos=0,chosen=[],pieces=[],namePhase='name',errors=0,correct=0,unlocked=false;
function play(kind){try{void window.TivvigHadesSounds?.play(kind)}catch(e){}}
function title(t){$('mummySpeech').innerHTML='<strong>Мумия:</strong> '+t}
function feedback(t){$('mummyStatus').textContent=t}
function button(t){const a=$('mummyAction');a.hidden=false;a.textContent=t}
function hideExtras(){groups.forEach(id=>$(id).hidden=true);$('mummyAction').hidden=true;feedback('')}
function dots(){const n=stage==='fresco'?1:stage==='jars'?2:stage==='scales'?3:stage==='name'||stage==='done'?4:0;
 for(let i=0;i<$('mummyDots').children.length;i++)$('mummyDots').children[i].classList.toggle('on',i<n);
 $('mummyDots').setAttribute('aria-label','Этап '+Math.max(1,n)+' из 4');
 scene.dataset.stage=stage}
function render(){
 hideExtras();dots();
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
  $('mummyJars').hidden=false;$('mummyJarLabel').hidden=false;
  const q=jars[round];
  title('Я спрятала '+q.thing+'. Найди сосуд с '+q.name+'.');
  $('mummyJarLabel').textContent='Найди сосуд: '+(round+1)+' / '+jars.length;
  for(let i=0;i<4;i++){
   const b=$('mummy-jar-'+i);b.classList.toggle('selected',pos===1&&i===q.index);
   b.disabled=pos===1;
  }
  feedback(pos?'Верно! Сосуд найден.':'Нажми на нужный сосуд.');
  if(pos)button(round===jars.length-1?'К весам →':'Следующий сосуд →');
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
  if(!pos)return;round++;pos=0;
  if(round>=jars.length){stage='scales';round=0;pieces=[]}
  render();play('tap');return
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
 if(stage!=='jars'||pos)return;
 if(i!==jars[round].index){errors++;feedback('Посмотри на головы сосудов.');play('wrong');return}
 pos=1;correct++;render();play('success');
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
 render()
}
function outfit(){try{window.TivvigWardrobe?.equip($('mummyLada'))}catch(e){}}
$('mummyAction').addEventListener('click',next);
for(let i=0;i<4;i++)$('mummy-jar-'+i).addEventListener('click',()=>chooseJar(i));
for(let i=1;i<=4;i++)$('mummy-weight-'+i).addEventListener('click',()=>chooseWeight(i));
$('mummy-undo').addEventListener('click',undoWeight);
window.addEventListener('tivvig-outfit-changed',outfit);
window.addEventListener('tivvig-inventory-changed',outfit);
window.addEventListener('pageshow',outfit);
window.TivvigMummyDebug=Object.freeze({
 state:()=>({stage,round,pos,namePhase,pieces:[...pieces],chosen:[...chosen],correct,errors,reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
 reset,finish,advance:()=>{
  if(stage==='intro'||stage==='done')return $('mummyAction').click();
  if(stage==='fresco')return pos===fresco[round].order.length?$('mummyAction').click():$('mummy-fresco-'+fresco[round].options.indexOf(fresco[round].order[pos]))?.click();
  if(stage==='jars')return pos?$('mummyAction').click():$('mummy-jar-'+jars[round].index)?.click();
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