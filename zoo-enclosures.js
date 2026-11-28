/* Тиввиг · seven illustrated zoo habitats.
 * The source art is generated at 1672×941; invisible, accessible native
 * buttons sit inside the SAME 16:9 coordinate plane as each painting.
 * No randomization: identical buttons / steps on both Firebase clients. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const id=document.body.dataset.animal;
 const stageRoot=$('scene'),task=$('task'),fact=$('fact'),progress=$('progress'),controls=$('controls');
 const staticData={
  ibis:{name:'Священный ибис',fact:'Ибис находит пищу длинным клювом в мелкой воде и иле.',rounds:[
   {question:'Найди личинку в иле',target:0},
   {question:'Теперь найди улитку',target:1},
   {question:'Где спряталась рыбка?',target:2},
   {question:'Найди рачка',target:3}],
   spots:[[35,71,18,20],[64,53,14,16],[79,68,18,17],[68,84,20,15]]},
  camel:{name:'Верблюд',fact:'Горб верблюда хранит жир, а не воду. Широкие ступни помогают ходить по песку.',rounds:[
   {question:'Собери воду в дорогу',target:1},
   {question:'Найди финики',target:2},
   {question:'Возьми тёплый плед',target:0}],
   spots:[[34,77,23,24],[53,77,14,25],[69,78,15,22],[84,79,19,22]]},
  fennec:{name:'Фенек',fact:'Огромные уши помогают фенеку слышать добычу под песком и отдавать лишнее тепло.',rounds:[
   {question:'Где шуршит песок?',target:2},
   {question:'Слушай дальше: где шорох?',target:1},
   {question:'Найди норку фенека',target:0},
   {question:'Где снова шуршит?',target:2}],
   spots:[[38,54,28,30],[71,38,19,18],[84,63,23,25]]},
  baboon:{name:'Павиан',fact:'Павианы живут группами и заботятся друг о друге. Они часто чистят друг другу шерсть.',rounds:[
   {question:'Найди большого павиана',target:0},
   {question:'Кто сидит выше всех?',target:1},
   {question:'Где пещера для малыша?',target:3},
   {question:'Найди павиана на скале',target:2}],
   spots:[[19,50,33,59],[30,15,17,23],[43,31,21,23],[87,38,22,24]]},
  cobra:{name:'Египетская кобра',fact:'Кобра раскрывает капюшон для защиты. К змее нельзя приближаться, но за ней интересно наблюдать.',rounds:[
   {question:'Найди кобру',target:0},
   {question:'Где прохладная тень?',target:1},
   {question:'Где песок согрет солнцем?',target:2}],
   spots:[[66,51,24,42],[86,34,28,41],[55,80,25,22]]},
  hippo:{name:'Бегемот',fact:'Днём бегемот много времени проводит в воде, а ночью выходит на сушу есть траву.',rounds:[
   {question:'День: где отдыхает бегемот?',target:0},
   {question:'Ночь: куда он идёт поесть?',target:1},
   {question:'Где ему прохладнее днём?',target:0},
   {question:'Где ночью растёт трава?',target:1}],
   spots:[[45,62,49,39],[81,48,30,39]]},
  crocodile:{name:'Нильский крокодил',fact:'Глаза и ноздри крокодила расположены высоко: он видит и дышит, почти целиком скрываясь в воде.',rounds:[
   {question:'Где появились глаза?',target:1},
   {question:'Смотри на рябь: где он?',target:2},
   {question:'Крокодил снова спрятался',target:0},
   {question:'Где он теперь?',target:1}],
   spots:[[33,66,17,18],[55,59,17,18],[76,67,17,18]]}
 };
 const config=staticData[id];
 if(!config){if(task)task.textContent='Не найден вольер';return;}
 let round=0,finished=false,busy=false;
 const choices=new Set();
 function pic(url,klass){const img=document.createElement('img');img.src=url;img.className=klass;img.alt='';img.draggable=false;img.decoding='async';return img;}
 function drawProgress(){progress.replaceChildren();for(let i=0;i<config.rounds.length;i++){let marker=document.createElement('span');marker.className='dot'+(i<round?' on':'');progress.append(marker);}}
 function finish(){finished=true;controls.classList.remove('hidden');fact.classList.remove('hidden');fact.textContent=config.fact;task.textContent='Готово! Ты узнала тайну '+config.name.toLowerCase()+'.';}
 function render(){
   if(finished)return;
   const r=config.rounds[round];drawProgress();task.textContent=r.question;
   stageRoot.replaceChildren();
   const area=document.createElement('div');area.className='zoo-stage';area.setAttribute('role','group');area.setAttribute('aria-label',config.name+' — '+r.question);
   const bgUrl=`url("images/egypt-zoo-${id}-scene.webp")`;
   area.style.backgroundImage=bgUrl;
   stageRoot.style.setProperty('--zoo-scene',bgUrl);
   if(id==='hippo' && round%2===1)area.classList.add('zoo-stage--night');
   if(id==='crocodile'){
     const croc=pic('images/egypt-zoo-crocodile-cutout.webp','zoo-crocodile-model');
     const target=config.spots[r.target];croc.style.left=(target[0]-12)+'%';croc.style.top=(target[1]-9)+'%';
     croc.id='zooCrocModel';area.append(croc);
   }
   config.spots.forEach((p,i)=>{
     const b=document.createElement('button');b.type='button';b.className='zoo-spot';
     b.id='zoo-'+id+'-'+i;
     b.style.left=(p[0]-p[2]/2)+'%';b.style.top=(p[1]-p[3]/2)+'%';b.style.width=p[2]+'%';b.style.height=p[3]+'%';
     b.setAttribute('aria-label',id==='camel'?['Одеяло','Фляга с водой','Финики','Верёвка'][i]:id==='fennec'?'Норка '+(i+1):id==='baboon'?['Большой павиан','Павиан наверху','Павиан на скале','Пещера'][i]:'Место '+(i+1));
     if(id==='fennec' && i===r.target)b.classList.add('zoo-spot--hint');
     if(id==='crocodile' && i===r.target)b.classList.add('zoo-spot--ripple');
     if(choices.has(i) && id==='camel'){b.classList.add('zoo-spot--collected');b.disabled=true;}
     b.addEventListener('click',()=>select(i,b,area));area.append(b);
   });
   stageRoot.append(area);
 }
 function select(i,b,area){
   if(busy||finished)return;
   const r=config.rounds[round];
   if(i!==r.target){b.classList.remove('is-wrong');void b.offsetWidth;b.classList.add('is-wrong');return;}
   busy=true;
   if(id==='camel')choices.add(i);
   b.classList.add('is-success');
   if(id==='crocodile')area.querySelector('.zoo-crocodile-model')?.classList.add('is-visible');
   if(id==='hippo' && round%2===1)area.classList.add('zoo-stage--night');
   const badge=document.createElement('span');badge.className='zoo-reward-flash';badge.textContent='✓';badge.style.left=r.target===i?config.spots[i][0]+'%':'50%';badge.style.top=config.spots[i][1]+'%';area.append(badge);
   setTimeout(()=>{round++;busy=false;if(round===config.rounds.length){drawProgress();finish();}else render();},510);
 }
 function restart(){round=0;finished=false;busy=false;choices.clear();controls.classList.add('hidden');fact.classList.add('hidden');render();}
 $('restart')?.addEventListener('click',restart);
 // A synchronous inspectable interface for regression tests; not game UI.
 window.TivvigZooDebug=Object.freeze({state:()=>({round,finished,busy,animal:id}),rounds:config.rounds.map(r=>r.target),restart});
 render();
})();