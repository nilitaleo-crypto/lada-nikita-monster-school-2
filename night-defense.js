(()=>{'use strict';
const root=document.getElementById('nightDefense');if(!root)return;
const $=id=>document.getElementById(id);
const isCoop=new URLSearchParams(location.search).get('coop')==='1';
const key='tivvig_night_defense_progress_v2';
const labels=['Снежный человек','Голем','Леший','Демогоргон','Победа'];
const words=[['ТИГР','Р'],['КОМАР','Р'],['СЫР','Р'],['ПИЛА','Л'],['СКАЛА','Л'],['ЮЛА','Л']];
const sums=[{a:8,b:5,options:[2,3,4,5]},{a:10,b:6,options:[2,3,4,5]},{a:7,b:5,options:[1,2,3,4]}];
const sequence=['friends','mirror','voice'];
const groomTools=[['comb','🪮','Расчёска'],['soap','🧼','Мыло'],['sponge','🧽','Губка'],['brush','🪥','Щётка'],['towel','🧺','Полотенце']];
const initial=()=>({stage:0,selected:-1,sorted:[],snowChoice:'',math:0,shield:false,groomed:[],memoReady:false,sign:0,word:0,flames:3,complete:false});
let game=initial();
function validate(o){
 if(!o||!Number.isInteger(o.stage)||o.stage<0||o.stage>4)return initial();
 return {...initial(),...o,sorted:Array.isArray(o.sorted)?o.sorted.filter(Number.isInteger).slice(0,6):[],groomed:Array.isArray(o.groomed)?o.groomed.filter(Boolean).slice(0,5):[]};
}
function save(){if(isCoop)return;try{localStorage.setItem(key,JSON.stringify(game));}catch{}}
function notice(s='',warn=false){const el=$('nd-feedback');if(!el)return;el.textContent=s;el.classList.toggle('warn',warn);}
function act(id,html,label='',cls=''){return `<button type="button" id="${id}" data-act="1" class="${cls}" aria-label="${label||id}">${html}</button>`;}
function next(message='Дальше →'){return `<div class="nd-row">${act('nd-next',message,'Следующая часть','nd-next')}</div>`;}
function phaseDone(index){return [game.sorted.length===6&&!!game.snowChoice,game.math===3&&game.shield,game.groomed.length===groomTools.length,game.word===4][index];}
function start(reset=false){
 if(reset)game=initial();else if(!isCoop){try{game=validate(JSON.parse(localStorage.getItem(key)||'null'));}catch{game=initial();}}
 document.body.classList.add('night-mode');root.hidden=false;
 if(!isCoop && location.hash!=='#night-defense')try{history.replaceState(null,'',location.pathname+location.search+'#night-defense');}catch{}
 render();requestAnimationFrame(()=>{$('nd-scroll')&&($('nd-scroll').scrollLeft=0);});
}
function leave(){root.hidden=true;document.body.classList.remove('night-mode');if(!isCoop&&location.hash==='#night-defense')try{history.replaceState(null,'',location.pathname+location.search);}catch{}}
function fail(t='Попробуй ещё раз'){game.flames=Math.max(1,game.flames-1);notice(t,true);save();renderStatus();}
function renderStatus(){const flames=$('nd-flames');if(flames)flames.textContent='🔥'.repeat(game.flames)+'✧'.repeat(3-game.flames);}
function render(){
 const st=game.stage, scene=$('nd-scene'), board=$('nd-board');
 if(!scene||!board)return;
 scene.dataset.phase=String(st);scene.style.setProperty('--groom-level',String(game.groomed.length));
 $('nd-stage-name').textContent=(st===4?'☀️ ':`🌙 ${st+1}/4 · `)+labels[st];
 $('nd-progress').innerHTML=[0,1,2,3].map(i=>`<i class="${i<st?'done':i===st?'current':''}" aria-hidden="true"></i>`).join('');
 renderStatus();
 let title='',tip='',content='';
 if(st===0){
  title='Снежный человек!';
  if(game.sorted.length<6){
   tip='Прочитай слово и выбери Р или Л';
   content=`<div class="nd-baskets">${act('nd-basket-r','Р <small>рычит</small>','Буква Р')}${act('nd-basket-l','Л <small>звенит</small>','Буква Л')}</div><div class="nd-words">${words.map((w,i)=>game.sorted.includes(i)?act('nd-word-'+i,'✓','Уже собрано','used'):act('nd-word-'+i,w[0],w[0],game.selected===i?'picked':'')).join('')}</div><p class="nd-subline">${game.sorted.length} / 6 · Нажми слово, затем букву</p>`;
  }else if(!game.snowChoice){
   tip='Он голоден. Что сделаем?';
   content=`<div class="nd-row">${act('nd-feed','🥖 Накормить','Накормить снежного человека')}${act('nd-call','🔔 Позвать гномов','Позвать гномов')}</div>`;
  }else{tip=game.snowChoice==='feed'?'Снежный человек успокоился':'Гномы прогнали холод';content=next('К голему →');}
 }else if(st===1){
  title='Голем у ворот!';
  if(game.math<sums.length){const v=sums[game.math]; tip='Сколько камней осталось?';
   content=`<div class="nd-math">${v.a} − ${v.b} = ?</div><div class="nd-stones">${Array.from({length:v.a-v.b},()=>'<span class="nd-stone"></span>').join('')}</div><div class="nd-row">${v.options.map(n=>act('nd-num-'+n,String(n),'Ответ '+n,'nd-choice')).join('')}</div><p class="nd-subline">Стена ${game.math+1} / ${sums.length}</p>`;
  }else if(!game.shield){tip='Стены укреплены. Подними щит!';content=`<div class="nd-row">${act('nd-shield','🛡️ Защитить','Поднять защитный щит')}</div>`;}
  else{tip='Голем отступил!';content=next('К лешему →');}
 }else if(st===2){
  title='Леший';
  if(game.groomed.length<groomTools.length){
   tip='Умой и причеши его';
   content=`<div class="nd-row nd-groom">${groomTools.map(([id,icon,label])=>game.groomed.includes(id)?act('nd-groom-'+id,'✓',label,'used'):act('nd-groom-'+id,icon,label,'nd-tool')).join('')}</div><p class="nd-subline">${game.groomed.length} / ${groomTools.length} предметов</p>`;
  }else{tip='Теперь он красивый и довольный';content=next('К демогоргону →');}
 }else if(st===3){
  title='Демогоргон!';
  if(game.sign===0&&game.word===0&&!game.memoReady){tip='Запомни порядок действий';content=`<div class="nd-row nd-memory"><span class="nd-seq">👫 → 🪞 → 📯</span></div>${act('nd-memory-ready','Запомнила!','Запомнила последовательность','nd-next')}`;}
  else if(game.sign<=3&&game.word===0){
   if(game.sign<3){tip='Что было дальше?';content=`<div class="nd-row nd-memory">${act('nd-sign-friends','👫','Позвать друзей')}${act('nd-sign-mirror','🪞','Направить зеркало')}${act('nd-sign-voice','📯','Произнести заклинание')}</div><p class="nd-subline">${game.sign} / 3</p>`;}
   else{tip='Команда готова! Звуковое оружие!';content=`<div class="nd-row">${act('nd-start-spell','✨ Произнести слова','Начать речевое заклинание')}</div>`;}
  }else if(game.word>0&&game.word<=3){const magic=['РЫБА','ЛУНА','ГРОМ'];tip='Скажи вслух и нажми кнопку';content=`<div class="nd-spell"><strong>${magic[game.word-1]}</strong>${act('nd-say','Сказала ✓','Подтвердить произнесённое слово','nd-next')}<p class="nd-subline">${game.word} / 3</p></div>`;}
  else{tip='Демогоргон отступил!';content=next('К награде →');}
 }else{
  title='Победа!';
  tip='Гномы обнимают Ладу и вручают молот Тора';
  content=`<div class="nd-done">🏆 ПОБЕДА!</div><div class="nd-row">${act('nd-replay','↻ Ещё раз','Начать ночной квест заново')}${act('nd-leave-final','🏡 В деревню','Вернуться в деревню')}</div>`;
 }
 $('nd-alert').textContent=title;$('nd-info').textContent=tip;board.innerHTML=content;board.setAttribute('aria-label',title+'. '+tip);
}
function apply(id){
 if(id==='nd-leave'||id==='nd-leave-final'){leave();return;}
 if(id==='nd-reset'||id==='nd-replay'){game=initial();save();notice('Ночь начинается снова');render();return;}
 if(id==='nd-next'){if(game.stage<4&&phaseDone(game.stage)){game.stage++;game.complete=game.stage===4;notice('');save();render();}return;}
 if(game.stage===0){
  if(id.startsWith('nd-word-')){const i=Number(id.slice(8));if(!game.sorted.includes(i)&&i>=0&&i<6){game.selected=i;save();notice('Теперь выбери букву');render();}return;}
  if((id==='nd-basket-r'||id==='nd-basket-l')&&game.selected>=0){const letter=id.endsWith('-r')?'Р':'Л'; if(words[game.selected][1]===letter){game.sorted.push(game.selected);game.selected=-1;save();notice('Звук найден!');render();} else fail('Послушай звук в слове'); return;}
  if((id==='nd-feed'||id==='nd-call')&&game.sorted.length===6&&!game.snowChoice){game.snowChoice=id==='nd-feed'?'feed':'call';save();notice('Холод отступает');render();return;}
 }
 if(game.stage===1){
  if(id.startsWith('nd-num-')&&game.math<sums.length){const n=Number(id.slice(7)),v=sums[game.math];if(n===v.a-v.b){game.math++;save();notice('Верно! Камни на месте');render();}else fail('Посчитай оставшиеся камни');return;}
  if(id==='nd-shield'&&game.math===3){game.shield=true;save();notice('Щит сияет!');render();return;}
 }
 if(game.stage===2){
  if(id.startsWith('nd-groom-')){const tool=id.slice(9);if(groomTools.some(t=>t[0]===tool)&&!game.groomed.includes(tool)){game.groomed.push(tool);save();notice(game.groomed.length===groomTools.length?'Леший теперь красавчик!':'Отлично, продолжаем уход');render();}return;}
 }
 if(game.stage===3){
  if(id==='nd-memory-ready'&&!game.memoReady){game.memoReady=true;save();notice('Повтори последовательность');render();return;}
  if(id.startsWith('nd-sign-')&&game.memoReady&&game.sign<3){const picked=id.slice(8);if(picked===sequence[game.sign]){game.sign++;save();notice('Вспомнила!');render();}else fail('Вспомни порядок');return;}
  if(id==='nd-start-spell'&&game.sign===3&&game.word===0){game.word=1;save();notice('Говори громко!');render();return;}
  if(id==='nd-say'&&game.word>=1&&game.word<=3){game.word++;save();notice(game.word===4?'Все слова сказаны!':'Заклинание становится сильнее');render();return;}
 }
}
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.id;if(id==='nd-leave'||id==='nd-reset'||id==='nd-leave-final'||id==='nd-replay'||b.dataset.act==='1')apply(id);});
const launch=$('startNight'); if(launch) launch.addEventListener('click',()=>start());
window.addEventListener('hashchange',()=>{if(location.hash==='#night-defense'&&!isCoop){if(root.hidden)start();}else if(!isCoop&&!root.hidden)leave();});
if(!isCoop&&location.hash==='#night-defense')start();
window.TivvigNightDefenseDebug=Object.freeze({getState:()=>structuredClone(game),enter:()=>start(),reset:()=>{game=initial();save();render()},allPhases:labels.slice(),apply});
})();