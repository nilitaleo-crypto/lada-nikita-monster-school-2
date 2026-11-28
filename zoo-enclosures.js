/* Тиввиг · Egyptian zoo v4.
 * Native hotspot buttons, fixed story sequence, no random states.
 * Keeping the same stable button IDs makes co-op mirrored taps reliable.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const animal=document.body.dataset.animal;
const scene=$('scene'),task=$('task'),fact=$('fact'),progress=$('progress'),controls=$('controls');
const DATA={
 ibis:{name:'Священный ибис',spots:[[35,71,18,20],[64,53,14,16],[79,68,18,17],[68,84,20,15]],steps:[
  {prompt:'Ибис ищет корм не глазами, а длинным клювом. Ощупай мягкий ил.',target:0,note:'Длинный клюв помогает находить спрятанную в иле пищу.'},
  {prompt:'В иле встретилась улитка. Найди её раковину.',target:1,note:'Ибисы едят моллюсков и других мелких животных.'},
  {prompt:'Рыбка ускользает. Попробуй поймать её у кромки воды.',target:2,note:'В мелкой воде ибис может ловить небольшую рыбу.'},
  {prompt:'Последняя добыча спряталась глубже. Исследуй дальний участок.',target:3,note:'Ибис добывает корм в разных местах влажного берега.'}
 ]},
 camel:{name:'Верблюд',spots:[[34,77,23,24],[53,77,14,25],[69,78,15,22],[84,79,19,22]],steps:[
  {prompt:'Горб хранит жир, а не воду. Что возьмём для питья в пустыне?',target:1,note:'В горбе запасается жир. Воду для дороги нужно взять отдельно.'},
  {prompt:'Ночью в пустыне бывает холодно. Что возьмём для ночёвки?',target:0,note:'В пустыне температура сильно меняется между днём и ночью.'},
  {prompt:'После перехода нужен запас пищи. Что можно съесть в пути?',target:2,note:'Финики — питательные плоды финиковой пальмы.'}
 ]},
 fennec:{name:'Фенек',spots:[[36,55,25,26],[71,37,18,20],[84,62,20,22],[42,75,19,18],[59,65,20,19]],steps:[
  {prompt:'Послушай! Жулик шуршит В ЛЕВОЙ НОРЕ. Покажи, где он.',target:0,speech:'Жулик в левой норе',pan:-.85,note:'В норе — значит внутри. Фенек прячется под землёй от жары.'},
  {prompt:'Он выбрался и сидит НА ПЕСЧАНОМ ХОЛМЕ. Найди его новое место.',target:1,speech:'Жулик на холме',pan:.8,note:'НА камне — сверху. Большие уши фенека улавливают тихие звуки.'},
  {prompt:'Теперь жулик ЗА КАМЕННОЙ АРКОЙ. Откуда шорох?',target:2,speech:'Жулик за аркой',pan:.9,note:'ЗА аркой — с дальней стороны от входа, его почти не видно.'},
  {prompt:'Он появился ПЕРЕД ЛЕВОЙ НОРОЙ. Найди его.',target:3,speech:'Жулик перед левой норой',pan:-.35,note:'ПЕРЕД норой — с ближней стороны входа.'},
  {prompt:'Последний шорох МЕЖДУ ДВУМЯ НОРАМИ. Где он?',target:4,speech:'Жулик между двумя норами',pan:.2,note:'МЕЖДУ — посередине двух нор. Ты нашла жулика!'}
 ]},
 baboon:{name:'Павиан',spots:[[19,50,33,59],[30,15,17,23],[43,31,21,23],[87,38,22,24]],steps:[
  {prompt:'В стае нужен дозорный. С какого места виднее дальнюю тропу?',target:1,note:'С высоких мест легче замечать опасность.'},
  {prompt:'Павианы живут стаями. Где малыш скорее найдёт взрослых?',target:0,note:'Детёныши держатся рядом с родными.'},
  {prompt:'Они чистят друг другу шерсть. Найди место, где можно сидеть рядом.',target:2,note:'Чистка шерсти укрепляет связи в стае.'},
  {prompt:'Приближается дождь. Найди укрытие для детёныша.',target:3,note:'Укрытие защищает от непогоды и помогает чувствовать себя в безопасности.'}
 ]},
 cobra:{name:'Египетская кобра',spots:[[66,51,24,42],[86,34,28,41],[55,80,25,22]],steps:[
  {prompt:'Кобре жарко. Где она укроется от палящего солнца?',target:1,note:'Змеи меняют место, чтобы регулировать температуру тела.'},
  {prompt:'Утром песок прогрелся. Где холоднокровной змее согреться?',target:2,note:'Солнце помогает змеям согреваться.'},
  {prompt:'Кобра подняла капюшон — это предупреждение. Найди её, но не подходи.',target:0,note:'Капюшон — защитная демонстрация. Увидев змею в природе, держись подальше.'}
 ]},
 hippo:{name:'Бегемот',spots:[[38,65,20,15],[50,69,20,15],[62,64,20,15],[47,57,42,32],[49,40,30,15],[84,49,26,30]],steps:[
  {kind:'walk',prompt:'Бегемот не плывёт как рыба: он шагает по дну. Пройди три следа.',note:'Бегемоты слишком тяжёлые, чтобы плавать как рыбы: они ходят и отталкиваются от дна.'},
  {prompt:'На солнце бегемот выделяет красноватую защитную жидкость. Коснись его кожи.',target:3,kind:'skin',note:'Это не кровь! Красноватый секрет работает как природный солнцезащитный крем.'},
  {prompt:'Под водой бегемот задерживает дыхание. Помоги ему поднять нос к поверхности.',target:4,kind:'breathe',note:'Под водой бегемот может задержать дыхание примерно на пять минут.'},
  {prompt:'Вечером бегемот отправляется есть. Найди траву на берегу.',target:5,note:'Большую часть травы бегемоты поедают ночью, выходя из воды.'}
 ]},
 crocodile:{name:'Нильский крокодил',spots:[],steps:[
  {kind:'eyes',prompt:'У крокодила над водой остаются глаза. Коснись ГЛАЗ на его голове.',note:'Глаза расположены высоко: крокодил видит, даже когда тело скрыто.'},
  {kind:'nose',prompt:'А теперь найди НОЗДРИ на конце морды.',note:'Ноздри сверху морды позволяют дышать, пока тело под водой.'},
  {kind:'both',prompt:'Помоги скрыться в воде: оставь над водой ГЛАЗА и НОЗДРИ.',note:'Вот секрет маскировки: видно только глаза и ноздри.'},
  {kind:'nose',prompt:'Крокодил ныряет целиком. Коснись ноздрей, чтобы закрыть их.',note:'При полном погружении крокодил может закрывать ноздри.'}
 ]}
};
const config=DATA[animal];
if(!config){if(task)task.textContent='Вольер не найден';return;}
let round=0,busy=false,finished=false,sub=0,wrong=0,unlocked=false;
const found=new Set();
let audioCtx=null,feedbackTimer=0;
const spotNames={
 ibis:['Ил у воды','Улитка','Рыба','Дальний участок берега'],
 camel:['Плед','Фляга воды','Финики','Верёвка'],
 fennec:['В левой норе','На холме','За аркой','Перед норой','Между норами'],
 baboon:['Группа павианов','Верхняя скала','Павиан на скале','Укрытие'],
 cobra:['Кобра','Прохладная тень','Тёплый песок'],
 hippo:['Первый след','Второй след','Третий след','Кожа бегемота','Поверхность воды','Трава на берегу']
};
const name=spotNames[animal]||[];
const pic=(src,cls,alt='')=>{const img=document.createElement('img');img.src=src;img.className=cls;img.alt=alt;img.draggable=false;img.decoding='async';return img;};
function pos(el,p){el.style.left=(p[0]-p[2]/2)+'%';el.style.top=(p[1]-p[3]/2)+'%';el.style.width=p[2]+'%';el.style.height=p[3]+'%';}
function drawProgress(){progress.replaceChildren();for(let i=0;i<config.steps.length;i++){const dot=document.createElement('span');dot.className='dot'+(i<round?' on':'');progress.append(dot);}}
function showFact(line,area,target){
 fact.textContent=line;fact.classList.remove('hidden');
 const note=document.createElement('div');note.className='zoo-in-scene-fact';
 note.textContent=line;note.setAttribute('role','status');
 const point=target||[50,48,0,0];
 note.style.left=Math.min(78,Math.max(22,point[0]))+'%';
 note.style.top=(point[1]>60? '26%' :'71%');
 area.append(note);
}
function complete(area,target){
 if(busy||finished)return;
 busy=true;
 const step=config.steps[round];
 showFact(step.note,area,target);
 drawProgress();
 clearTimeout(feedbackTimer);
 feedbackTimer=setTimeout(()=>{
  round++;sub=0;wrong=0;found.clear();busy=false;
  if(round>=config.steps.length){finish();}else render();
 },1650);
}
function finish(){
 finished=true;drawProgress();controls.classList.remove('hidden');
 task.textContent='Все тайны раскрыты! Куда отправимся дальше?';
 fact.textContent=config.steps.at(-1).note;
 fact.classList.remove('hidden');
 const note=scene.querySelector('.zoo-in-scene-fact');if(note)note.remove();
}
function spot(area,index,p,enabled,mode){
 const b=document.createElement('button');b.type='button';b.id='zoo-'+animal+'-'+index;
 b.className='zoo-spot'+(mode?' zoo-spot--'+mode:'');
 pos(b,p);b.setAttribute('aria-label',name[index]||('Место '+(index+1)));
 if(!enabled)b.disabled=true;
 b.addEventListener('click',()=>choose(index,b,area));
 area.append(b);return b;
}
function hitBad(b){
 wrong++;b.classList.remove('is-wrong');void b.offsetWidth;b.classList.add('is-wrong');
 if(wrong>=2){task.textContent=config.steps[round].prompt+' Присмотрись к окружению.';}
}
function visualFeedback(b){b.classList.add('is-success');const check=document.createElement('span');check.textContent='✓';check.className='zoo-reward-flash';check.style.left=(parseFloat(b.style.left)+parseFloat(b.style.width)/2)+'%';check.style.top=(parseFloat(b.style.top)+parseFloat(b.style.height)/2)+'%';b.parentElement.append(check);}
function choose(i,b,area){
 if(busy||finished)return;
 const step=config.steps[round];
 if(step.kind==='walk'){
  if(i!==sub){hitBad(b);return;}
  b.classList.add('is-success');sub++;
  area.querySelectorAll('.zoo-hippo-step').forEach((x,n)=>x.classList.toggle('is-done',n<sub));
  if(sub===3)complete(area,config.spots[i]);
  else task.textContent='Шаг '+sub+' из 3. Найди следующий след на дне.';
  return;
 }
 if(i!==step.target){hitBad(b);return;}
 visualFeedback(b);
 if(animal==='fennec'){
   const thief=$('zoo-thief');
   if(thief){thief.style.left=config.spots[i][0]+'%';thief.style.top=(config.spots[i][1]-3)+'%';thief.classList.add('is-visible');}
 }
 if(step.kind==='skin')area.classList.add('zoo-hippo-skin');
 if(step.kind==='breathe')area.classList.add('zoo-hippo-breathe');
 if(animal==='camel')b.classList.add('zoo-spot--collected');
 complete(area,config.spots[i]);
}
function createCrocodile(area,step){
 // Real illustrated crocodile, not a blinking ring or abstract stones.
 const focus=document.createElement('div');focus.className='zoo-croc-portrait';
 const portrait=pic('images/egypt-zoo-crocodile-anatomy.avif','zoo-croc-portrait-img','Нильский крокодил. Глаза высоко на голове, ноздри на конце морды.');
 portrait.addEventListener('error',()=>{portrait.classList.add('is-fallback');portrait.src='images/egypt-zoo-crocodile-cutout.webp';},{once:true});
 focus.append(portrait);
 const water=document.createElement('div');water.className='zoo-croc-water';focus.append(water);
 const organs=[
  {key:'eyes',text:'ГЛАЗА',caption:'ВИЖУ',x:74,y:43},
  {key:'nose',text:'НОЗДРИ',caption:'ДЫШУ',x:95,y:47}
 ];
 organs.forEach(({key,text,caption,x,y})=>{
  const b=document.createElement('button');b.type='button';b.id='zoo-croc-'+key;
  b.className='zoo-croc-feature';b.style.left=x+'%';b.style.top=y+'%';
  b.textContent=text;b.setAttribute('aria-label',text+' крокодила');
  if(found.has(key))b.classList.add('is-found');
  b.addEventListener('click',()=>{
    if(busy||finished)return;
    if(step.kind!=='both'&&step.kind!==key){hitBad(b);return;}
    if(found.has(key))return;
    found.add(key);b.classList.add('is-found');
    const callout=document.createElement('span');callout.className='zoo-croc-caption';
    callout.style.left=x+'%';callout.style.top=Math.min(90,y+14)+'%';callout.textContent=caption;focus.append(callout);
    if(step.kind==='both'&&found.size<2){task.textContent='Отлично! Теперь найди вторую часть.';return;}
    if(step.kind==='both')focus.classList.add('is-submerged');
    else if(step.kind==='nose'&&round===3)focus.classList.add('is-diving');
    complete(area,[50,50,0,0]);
  });
  focus.append(b);
 });
 area.append(focus);
}
function makeHippo(area,step){
 if(step.kind==='walk'){
   for(let i=0;i<3;i++){
     const p=config.spots[i];
     const mark=document.createElement('div');mark.className='zoo-hippo-step';
     pos(mark,p);mark.textContent=String(i+1);area.append(mark);
     spot(area,i,p,true,'hippo-path');
   }
 }else{
  const i=step.target,p=config.spots[i];
  const b=spot(area,i,p,true,'hippo-'+step.kind);
  if(step.kind==='breathe'){
    const level=document.createElement('div');level.className='zoo-breath-surface';level.textContent='ПОВЕРХНОСТЬ ВОДЫ';area.append(level);
  }
  if(step.kind==='skin'){const sun=document.createElement('div');sun.className='zoo-hippo-sun';sun.textContent='☀';sun.setAttribute('aria-hidden','true');area.append(sun);}
 }
}
function fennecScene(area){
 const thief=pic('images/egypt-fox-friend.webp','zoo-fennec-thief','Жулик-лисёнок');thief.id='zoo-thief';
 thief.style.left=config.spots[config.steps[round].target][0]+'%';
 thief.style.top=(config.spots[config.steps[round].target][1]-3)+'%';
 area.append(thief);
}
function render(){
 if(finished)return;
 clearTimeout(feedbackTimer); // Keep the last discovery in the small footer until the next one.
 const step=config.steps[round];
 drawProgress();task.textContent=step.prompt;scene.replaceChildren();
 const area=document.createElement('div');area.className='zoo-stage';area.setAttribute('role','group');
 area.setAttribute('aria-label',config.name+' — '+step.prompt);
 const url='url("images/egypt-zoo-'+animal+'-scene.webp")';
 area.style.backgroundImage=url;scene.style.setProperty('--zoo-scene',url);
 if(animal==='hippo'&&round===3)area.classList.add('zoo-stage--night');
 if(animal==='crocodile')createCrocodile(area,step);
 else if(animal==='hippo')makeHippo(area,step);
 else{
  if(animal==='fennec')fennecScene(area);
  config.spots.forEach((p,i)=>{
   const btn=spot(area,i,p,true,animal==='fennec'?'fennec-search':'search');
   // No target-specific blinking cue: find it by observation or the sound clue.
   if(animal==='camel'&&i===3)btn.setAttribute('aria-label','Верёвка (запасной предмет)');
  });
 }
 scene.append(area);
 if(animal==='fennec')showHear();
}
function getAudio(){
 const C=window.AudioContext||window.webkitAudioContext;
 if(!C)return null;
 try{if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return audioCtx;}
 catch{return null;}
}
function rustle(pan){
 const ctx=getAudio();if(!ctx||ctx.state!=='running')return;
 const t=ctx.currentTime;
 const output=ctx.createGain();output.gain.setValueAtTime(.0001,t);
 output.gain.exponentialRampToValueAtTime(.18,t+.04);output.gain.exponentialRampToValueAtTime(.0001,t+.65);
 const stereo=typeof ctx.createStereoPanner==='function'?ctx.createStereoPanner():null;
 if(stereo){stereo.pan.value=pan;output.connect(stereo);stereo.connect(ctx.destination);}else output.connect(ctx.destination);
 // Three soft rustles, made locally. No downloaded sound file, no network latency.
 for(let i=0;i<3;i++){
  const o=ctx.createOscillator(),g=ctx.createGain(),start=t+i*.18;
  o.type='triangle';o.frequency.setValueAtTime(170+i*22,start);
  o.frequency.exponentialRampToValueAtTime(95+i*15,start+.11);
  g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.16,start+.025);g.gain.exponentialRampToValueAtTime(.0001,start+.13);
  o.connect(g);g.connect(output);o.start(start);o.stop(start+.14);
 }
}
function speak(clue){
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
 try{
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(clue);u.lang='ru-RU';u.rate=.88;u.volume=.95;
  window.speechSynthesis.speak(u);
 }catch{}
}
let hearingButton=null;
function showHear(){
 if(!hearingButton){
  hearingButton=document.createElement('button');hearingButton.type='button';hearingButton.id='zooHear';
  hearingButton.className='zoo-hear';hearingButton.textContent='♪ Слушать';
  hearingButton.setAttribute('aria-label','Услышать, где прячется жулик');
  hearingButton.addEventListener('click',()=>{
   if(finished||busy)return;
   const s=config.steps[round];rustle(s.pan);if(unlocked)speak(s.speech);
   const area=scene.querySelector('.zoo-stage');
   if(area){area.classList.remove('zoo-listening');void area.offsetWidth;area.classList.add('zoo-listening');}
  });
  const enable=document.createElement('button');enable.type='button';enable.id='zooAudioEnable';
  enable.className='zoo-audio-enable';enable.textContent='🔊';enable.dataset.tivvigLocalAudio='1';
  enable.setAttribute('aria-label','Разрешить звук на этом устройстве');
  enable.title='Включить звук на этом устройстве';
  enable.addEventListener('click',()=>{getAudio();unlocked=true;enable.classList.add('is-on');enable.textContent='🔉';});
  task.parentElement.append(hearingButton,enable);
 }
}
function restart(){
 clearTimeout(feedbackTimer);round=0;sub=0;wrong=0;busy=false;finished=false;
 found.clear();controls.classList.add('hidden');fact.classList.add('hidden');
 hearingButton?.remove();$('zooAudioEnable')?.remove();hearingButton=null;
 render();
}
$('restart')?.addEventListener('click',restart);
window.addEventListener('pagehide',()=>{clearTimeout(feedbackTimer);if('speechSynthesis' in window)window.speechSynthesis.cancel();});
window.TivvigZooDebug=Object.freeze({
 state:()=>({round,sub,finished,busy,animal,unlocked}),
 rounds:config.steps.map(s=>s.kind==='walk'?[0,1,2]:s.kind==='both'?['eyes','nose']:s.kind==='eyes'||s.kind==='nose'?s.kind:s.target),
 restart
});
render();
})();