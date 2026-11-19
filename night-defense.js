(()=>{'use strict';
const root=document.getElementById('nightDefense');if(!root)return;
const $=id=>document.getElementById(id);
const isCoop=new URLSearchParams(location.search).get('coop')==='1';
const key='tivvig_night_defense_progress_v3';
const REWARD='tivvig_reward_gnome_night_thor_v1';
const labels=['Снежный человек','Голем','Леший','Демогоргон','Победа'];
const words=[['ТИГР','Р'],['КОМАР','Р'],['СЫР','Р'],['ПИЛА','Л'],['СКАЛА','Л'],['ЮЛА','Л']];
const sums=[{a:8,b:5,options:[2,3,4,5]},{a:10,b:6,options:[2,3,4,5]},{a:7,b:5,options:[1,2,3,4]}];
// Rune patterns and symbols are taken unchanged from the existing Vulcan Forge.
const PATTERNS=[
 {known:['☾','✦','☾','✦'],answer:'☾'},
 {known:['◆','◆','✦','◆','◆','✦'],answer:'◆'},
 {known:['✦','☾','◆','✦','☾'],answer:'◆'}
];
const groomTools=[['comb','🪮','Расчёска'],['soap','🧼','Мыло'],['sponge','🧽','Губка'],['brush','🪥','Щётка'],['towel','🧺','Полотенце']];
const initial=()=>({stage:0,selected:-1,sorted:[],snowChoice:'',math:0,shield:false,groomed:[],rune:0,flames:3,complete:false,rewardOpen:false});
let game=initial();
function validate(o){
 if(!o||!Number.isInteger(o.stage)||o.stage<0||o.stage>4)return initial();
 return {...initial(),...o,sorted:Array.isArray(o.sorted)?o.sorted.filter(Number.isInteger).slice(0,6):[],groomed:Array.isArray(o.groomed)?o.groomed.filter(Boolean).slice(0,5):[]};
}
function save(){if(isCoop)return;try{localStorage.setItem(key,JSON.stringify(game));}catch{}}
function notice(s='',warn=false){const el=$('nd-feedback');if(!el)return;el.textContent=s;el.classList.toggle('warn',warn);}
function act(id,html,label='',cls=''){return `<button type="button" id="${id}" data-act="1" class="${cls}" aria-label="${label||id}">${html}</button>`;}
function next(message='Дальше →'){return `<div class="nd-row">${act('nd-next',message,'Следующая часть','nd-next')}</div>`;}
function phaseDone(index){return [game.sorted.length===6&&!!game.snowChoice,game.math===3&&game.shield,game.groomed.length===groomTools.length,game.rune===PATTERNS.length][index];}
function refreshLada(){
 const doll=$('nd-lada-doll'),api=window.TivvigWardrobe;
 if(doll&&api?.equip)api.equip(doll);
}
function grantReward(){
 try{
   if(window.TivvigRegistry?.byReward?.[REWARD])return window.TivvigRegistry.unlockReward(REWARD);
   localStorage.setItem(REWARD,'unlocked');
 }catch(e){console.warn('Night defense reward',e)}
 window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}));
 window.dispatchEvent(new Event('tivvig-inventory-changed'));
 return true;
}
function paintReward(){
 const panel=$('nd-reward-view');if(!panel)return;
 panel.hidden=!(game.stage===4&&game.rewardOpen);
}

function start(reset=false){
 if(reset)game=initial();else if(!isCoop){try{game=validate(JSON.parse(localStorage.getItem(key)||'null'));}catch{game=initial();}}
 document.body.classList.add('night-mode');root.hidden=false;
 if(!isCoop && location.hash!=='#night-defense')try{history.replaceState(null,'',location.pathname+location.search+'#night-defense');}catch{}
 render();refreshLada();requestAnimationFrame(()=>{$('nd-scroll')&&($('nd-scroll').scrollLeft=0);});
}
function leave(){game.rewardOpen=false;paintReward();root.hidden=true;document.body.classList.remove('night-mode');if(!isCoop&&location.hash==='#night-defense')try{history.replaceState(null,'',location.pathname+location.search);}catch{}}
function fail(t='Попробуй ещё раз'){game.flames=Math.max(1,game.flames-1);notice(t,true);save();renderStatus();}
function renderStatus(){const flames=$('nd-flames');if(flames)flames.textContent='🔥'.repeat(game.flames)+'✧'.repeat(3-game.flames);}
function render(){
 const st=game.stage, scene=$('nd-scene'), board=$('nd-board');
 if(!scene||!board)return;
 scene.dataset.phase=String(st);scene.style.setProperty('--groom-level',String(game.groomed.length));scene.classList.toggle('nd-groomed',st===2&&game.groomed.length===groomTools.length);
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
  if(game.rune<PATTERNS.length){
   const pattern=PATTERNS[game.rune];
   tip='Продолжи узор, как в кузнице';
   content=`<div class="nd-rune-etch" aria-label="Узор из рун Вулкана">${[...pattern.known,'?'].map((symbol,i)=>`<span class="nd-rune-symbol ${i===pattern.known.length?'blank':''}">${symbol}</span>`).join('')}</div><div class="nd-row nd-rune-choices">${['✦','☾','◆'].map(symbol=>act('nd-rune-'+({ '✦':'star','☾':'moon','◆':'gem'}[symbol]),symbol,'Руна '+symbol,'nd-rune-choice')).join('')}</div><p class="nd-subline">Узор ${game.rune+1} / ${PATTERNS.length}</p>`;
  }else{tip='Все руны засияли. Демогоргон отступил!';content=next('Получить награду →');}
 }else{
  title='Победа!';
  tip='Деревня спасена! Посмотри свою награду';
  content=`<div class="nd-done">🏆 ПОБЕДА!</div><div class="nd-row">${act('nd-open-reward','🖼️ Картина-награда','Посмотреть полученную картину')}${act('nd-leave-final','🏡 В деревню','Вернуться в деревню')}</div>`;
 }
 $('nd-alert').textContent=title;$('nd-info').textContent=tip;board.innerHTML=content;board.setAttribute('aria-label',title+'. '+tip);paintReward();refreshLada();
}
function apply(id){
 if(id==='nd-reward-close'){game.rewardOpen=false;save();paintReward();return;}
 if(id==='nd-open-reward'&&game.stage===4){game.rewardOpen=true;save();paintReward();return;}
 if(id==='nd-leave'||id==='nd-leave-final'){leave();return;}
 if(id==='nd-reset'||id==='nd-replay'){game=initial();save();notice('Ночь начинается снова');render();return;}
 if(id==='nd-next'){
  if(game.stage<4&&phaseDone(game.stage)){
   game.stage++;game.complete=game.stage===4;
   if(game.complete){game.rewardOpen=true;grantReward();}
   notice('');save();render();
  }return;
 }
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
  if(id.startsWith('nd-rune-')&&game.rune<PATTERNS.length){
   const choice=id.slice(8),symbol={star:'✦',moon:'☾',gem:'◆'}[choice];
   if(symbol===PATTERNS[game.rune].answer){game.rune++;save();notice(game.rune===PATTERNS.length?'Три узора готовы!':'Руна засияла!');render();}
   else fail('Посмотри, какой знак повторяется');
   return;
  }
 }
}
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.id;if(id==='nd-leave'||id==='nd-reset'||id==='nd-leave-final'||id==='nd-replay'||id==='nd-reward-close'||b.dataset.act==='1')apply(id);});
window.addEventListener('tivvig-inventory-changed',refreshLada);
window.addEventListener('tivvig-outfit-changed',refreshLada);
window.addEventListener('pageshow',refreshLada);
window.addEventListener('tivvig:registry-ready',()=>{refreshLada();if(game.stage===4&&game.complete)grantReward();});
window.addEventListener('storage',e=>{if(e.key==='tivvig_outfit_selected_v1'||e.key?.startsWith('tivvig_outfit_'))refreshLada();});
const launch=$('startNight'); if(launch) launch.addEventListener('click',()=>start());
window.addEventListener('hashchange',()=>{if(location.hash==='#night-defense'&&!isCoop){if(root.hidden)start();}else if(!isCoop&&!root.hidden)leave();});
if(!isCoop&&location.hash==='#night-defense')start();
window.TivvigNightDefenseDebug=Object.freeze({getState:()=>structuredClone(game),enter:()=>start(),reset:()=>{game=initial();save();render()},allPhases:labels.slice(),apply});
})();