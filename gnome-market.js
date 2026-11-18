/* Gnome village — four independent click-only mini-games. No timers, random choices,
   pointer-only controls or per-device stage skips: Firebase click replay remains deterministic. */
(()=>{
'use strict';
const body=document.body;
const game=body.dataset.game;
const stageDefs={
 orders:{name:'Перепутанные заказы',count:6,speaker:'Бантик',portrait:'bantik',reward:'tivvig_reward_gnome_orders_v1',next:'gnome-market-scales.html',nextText:'Дальше — честные весы'},
 scales:{name:'Честные весы',count:6,speaker:'Кубик',portrait:'kubik',reward:'tivvig_reward_gnome_scales_v1',next:'gnome-market-trinkets.html',nextText:'Дальше — барахолка'},
 trinkets:{name:'Барахолка гномов',count:0,speaker:'Долька',portrait:'dolka',reward:'tivvig_reward_gnome_trinkets_v1',next:'gnome-market-clues.html',nextText:'Дальше — расследование'},
 clues:{name:'Кто раскидал припасы?',count:5,speaker:'Лучик',portrait:'luchik',reward:'tivvig_reward_gnome_clues_v1',next:'gnome-elder.html',nextText:'К старейшине гномов'}
};
const current=stageDefs[game];if(!current)return;
const $=id=>document.getElementById(id);
const scene=$('gmOverlay'),speaker=$('gmSpeaker'),speakerName=$('gmSpeakerName'),speech=$('gmSpeech'),feedback=$('gmFeedback'),count=$('gmCounter'),next=$('gmNext'),restart=$('gmRestart'),commit=$('gmCommit'),bag=$('gmBag');
let completed=false;let completedOnce=false;
next.href=current.next;next.textContent='✦ '+current.nextText;
speaker.src='images/gnome-'+current.portrait+'.webp';speaker.alt='Гном '+current.speaker;
speakerName.textContent=current.speaker+':';
function el(tag,classes,txt){const x=document.createElement(tag);if(classes)x.className=classes;if(txt!==undefined)x.textContent=txt;return x}
function say(name,text){speakerName.textContent=name+':';speech.textContent=text}
function hint(text,warning=false){feedback.textContent=text;feedback.classList.toggle('warn',warning)}
function setCount(text){count.textContent=text}
function showPrimary(text){commit.hidden=false;commit.disabled=false;commit.textContent=text}
function hidePrimary(){commit.hidden=true}
function redrawBag(items){bag.replaceChildren();for(const item of items){const x=el('span','bag-pill',item);bag.append(x)}if(!items.length){bag.append(el('span','bag-pill empty','Рюкзак пока пуст'))}}
function markFinished(detail){
 if(completed)return;
 completed=true;completedOnce=true;next.hidden=false;hidePrimary();
 try{localStorage.setItem(current.reward,'unlocked')}catch{}
 function grant(){try{window.TivvigRegistry?.unlockReward(current.reward)}catch(e){console.warn('Gnome market reward',e)}}
 if(window.TivvigRegistry?.byReward?.[current.reward])grant();
 else window.addEventListener('tivvig:registry-ready',grant,{once:true});
 hint(detail);
}
// Product data is static, and all interactive controls keep permanent IDs; co-op can address them by #id.
const products={
 apple:{name:'Яблоко',icon:'🍎'},carrot:{name:'Морковь',icon:'🥕'},cabbage:{name:'Капуста',icon:'🥬'},grapes:{name:'Виноград',icon:'🍇'},pear:{name:'Груша',icon:'🍐'},orange:{name:'Апельсин',icon:'🍊'},bread:{name:'Хлеб',icon:'🥖'}
};
function checkMultiset(a,b){if(a.length!==b.length)return false;return [...a].sort().join('|')===[...b].sort().join('|')}
function avatar(name){return 'images/gnome-'+name+'.webp'}
function sceneBadge(label){const d=el('div','gm-nameplate',label);scene.append(d)}
function addPortraits(names){const box=el('div','gm-portrait-row');for(const name of names){const img=el('img','gm-portrait'+(names.length>2?' gm-portrait-small':''));img.src=avatar(name);img.alt='';img.setAttribute('aria-hidden','true');box.append(img)}scene.append(box)}
function resetChrome(){completed=false;next.hidden=true;bag.replaceChildren();hint('');commit.disabled=false}
// ---------- Scene 1: decode descriptive food orders rather than hearing the names ----------
function playOrders(){
 const orders=[
  {buyer:'Бантик',portrait:'bantik',ask:'Я забыл название! Нужны ДВА одинаковых красных круглых плода. Они сочные и хрустят, когда их кусаешь.',want:['apple','apple']},
  {buyer:'Пончик',portrait:'ponchik',ask:'Найди длинный оранжевый хрустящий овощ, который растёт под землёй, и гроздь маленьких сладких ягод.',want:['carrot','grapes']},
  {buyer:'Юла',portrait:'yula',ask:'Хочу большой зелёный овощ из множества листьев и жёлтый сладкий плод: сверху узкий, снизу широкий.',want:['cabbage','pear']},
  {buyer:'Долька',portrait:'dolka',ask:'Положи ДВА одинаковых круглых оранжевых плода: под толстой кожурой прячутся сочные кисло-сладкие дольки.',want:['orange','orange']},
  {buyer:'Лучик',portrait:'luchik',ask:'Мне нужны ТРИ вещи: румяная буханка с хрустящей корочкой, красный сладкий хрустящий плод и оранжевый плод с дольками внутри.',want:['bread','apple','orange']},
  {buyer:'Кубик',portrait:'kubik',ask:'Найди ТРИ продукта: длинный овощ, который грызут зайцы; зелёный овощ из листьев; гроздь маленьких сладких ягод.',want:['carrot','cabbage','grapes']}
 ];
 sceneBadge('🍎 Лавка забытых названий');
 const visualHome=el('a','gm-scene-touch home');visualHome.id='gmSceneHome';visualHome.href='gnome-village.html';visualHome.setAttribute('aria-label','Вернуться в деревню гномов');scene.append(visualHome);
 const visualHelp=el('button','gm-scene-touch help');visualHelp.type='button';visualHelp.id='gmSceneHelp';visualHelp.setAttribute('aria-label','Подсказка к заказу');visualHelp.addEventListener('click',()=>hint('Слушай признаки: вкус, форма, цвет и количество. Какой товар подходит под описание?'));scene.append(visualHelp);
 const visualRestart=el('button','gm-scene-touch reload');visualRestart.type='button';visualRestart.id='gmSceneRestart';visualRestart.setAttribute('aria-label','Начать заново');visualRestart.addEventListener('click',()=>restart.click());scene.append(visualRestart);
 const counter=el('div','gm-goods');counter.id='gmProducts';
 for(const id of Object.keys(products)){
  const p=products[id],btn=el('button','gm-good');btn.type='button';btn.id='gm-item-'+id;
  btn.setAttribute('aria-label','Положить в заказ: '+p.name);
  btn.append(el('span','emoji',p.icon),el('span','label',p.name));
  btn.addEventListener('click',()=>addItem(id));counter.append(btn);
 }
 scene.append(counter);
 let round=0,selected=[],ready=false;
 function paint(){
  const o=orders[round],max=o.want.length;
  setCount('Заказ '+(round+1)+' / '+orders.length);
  speaker.src=avatar(o.portrait);speaker.alt='Гном '+o.buyer;
  say(o.buyer,o.ask+' Посмотри на товары и выбери '+(max===2?'два':'три')+'.');
  redrawBag(selected.map(id=>products[id].icon+' '+products[id].name));
  bag.prepend(el('span','bag-pill','🧺 '+selected.length+' / '+max));
  $('gmClear').hidden=!selected.length||ready;
  commit.textContent=ready?(round===orders.length-1?'Завершить торговлю':'Следующий покупатель'):'Отдать заказ';
  commit.disabled=!ready&&selected.length!==max;
  counter.querySelectorAll('.gm-good').forEach(b=>b.classList.toggle('is-picked',selected.includes(b.id.replace('gm-item-',''))));
 }
 function addItem(id){
  if(completed||ready)return;
  if(selected.length>=orders[round].want.length){hint('В корзине уже достаточно товаров. Убери один, если хочешь заменить.',true);return;}
  selected.push(id);hint('');paint();
 }
 function check(){
  if(completed)return;
  const o=orders[round];
  if(!ready){
   if(selected.length!==o.want.length)return;
   if(!checkMultiset(selected,o.want)){hint('Что-то не совпадает. Проверь вкус, форму, цвет и количество в просьбе гнома.',true);return;}
   ready=true;hint('✓ Верно! Это '+o.want.map(id=>products[id].name.toLowerCase()).join(', ')+'. Гном благодарит Ладу!');paint();return;
  }
  if(round===orders.length-1){markFinished('Ты разгадала все шесть заказов по описаниям! Теперь гномы зовут тебя к весам.');setCount('6 / 6 ✓');return;}
  round++;selected=[];ready=false;hint('Пришёл следующий покупатель. Он тоже забыл названия.');paint();
 }
 $('gmClear').addEventListener('click',()=>{if(!ready&&selected.length){selected.pop();hint('Вернули последний продукт на прилавок.');paint()}});
 restart.addEventListener('click',()=>{resetChrome();round=0;selected=[];ready=false;showPrimary('Отдать заказ');paint()});
 commit.addEventListener('click',check);
 showPrimary('Отдать заказ');paint();
}
// ---------- Scene 2: balance the DIFFERENCE between two visible weights ----------
function playScales(){
 const tasks=[
  {left:7,right:4,opts:[2,3,5]},
  {left:3,right:6,opts:[4,2,3]},
  {left:9,right:5,opts:[3,4,5]},
  {left:6,right:8,opts:[2,3,1]},
  {left:4,right:9,opts:[4,6,5]},
  {left:10,right:6,opts:[5,3,4]}
 ];
 sceneBadge('⚖️ Весовая палатка Кубика');addPortraits(['kubik','yula']);
 const box=el('div','gm-scales');box.id='gmScale';
 box.innerHTML='<div class="gm-scale-top"></div><div class="gm-pan left"><span class="big" id="gmLeftIcon">⚙️</span><strong id="gmLeftWeight">7 ⚙</strong></div><div class="gm-pan right"><span class="big" id="gmRightIcon">⚙️</span><strong id="gmRightWeight">4 ⚙</strong></div>';
 scene.append(box);
 const choices=el('div','gm-scale-challenge');choices.innerHTML='<b>Сколько добавить на более лёгкую чашу?</b><div class="gm-weights" id="gmWeights"></div>';scene.append(choices);
 for(let i=0;i<3;i++){
  const b=el('button','gm-weight');b.type='button';b.id='gm-weight-'+i;
  b.addEventListener('click',()=>choose(i));$('gmWeights').append(b);
 }
 let round=0,chosen=null,ready=false;
 function paint(){
  const task=tasks[round],side=task.left>task.right?'правую':'левую';
  const toLeft=side==='левую',addition=chosen===null?0:task.opts[chosen];
  const l=task.left+(toLeft?addition:0),r=task.right+(!toLeft?addition:0);
  setCount('Весы '+(round+1)+' / '+tasks.length);
  speaker.src=avatar('kubik');
  say('Кубик','Слева '+task.left+' гирек, справа '+task.right+'. Сколько гирек нужно ДОБАВИТЬ на '+side+' чашу, чтобы стало поровну?');
  $('gmLeftIcon').textContent='⚙️';$('gmRightIcon').textContent='⚙️';
  $('gmLeftWeight').textContent=task.left+(toLeft&&chosen!==null?' + '+addition:'')+' ⚙';
  $('gmRightWeight').textContent=task.right+(!toLeft&&chosen!==null?' + '+addition:'')+' ⚙';
  for(let i=0;i<3;i++){
   const b=$('gm-weight-'+i),n=task.opts[i];b.textContent='+'+n+' ⚙';
   b.setAttribute('aria-label','Добавить '+n+' гирек на '+side+' чашу');
   b.classList.toggle('chosen',chosen===i);b.setAttribute('aria-pressed',String(chosen===i));
  }
  box.style.setProperty('--tilt',l===r?'0deg':l>r?'-8deg':'8deg');
  commit.textContent=ready?(round===tasks.length-1?'Завершить взвешивание':'Следующее взвешивание'):'Проверить равновесие';
  commit.disabled=chosen===null&&!ready;
  redrawBag(['Слева: '+l+' ⚙','Справа: '+r+' ⚙',chosen===null?'Выбери, сколько добавить':'Добавили '+addition+' на '+side+' чашу']);
 }
 function choose(i){
  if(completed||ready)return;
  chosen=i;paint();hint('Посмотри: слева и справа теперь одинаковое число гирек?');
 }
 function check(){
  if(completed)return;
  const task=tasks[round],need=Math.abs(task.left-task.right);
  if(ready){
   if(round===tasks.length-1){markFinished('Шесть раз ты нашла разницу между грузами и уравновесила весы! Пора на барахолку.');setCount('6 / 6 ✓');return;}
   round++;chosen=null;ready=false;paint();hint('На весах новая пара грузов.');return;
  }
  if(chosen===null)return;
  if(task.opts[chosen]!==need){
   const side=task.left>task.right?'справа':'слева';
   hint('Весы ещё наклонены! На одной чаше '+Math.max(task.left,task.right)+', а '+side+' было '+Math.min(task.left,task.right)+'. Сколько шагов надо досчитать до большого числа?',true);
   return;
  }
  ready=true;paint();hint('✓ Правильно! '+Math.min(task.left,task.right)+' + '+need+' = '+Math.max(task.left,task.right)+'. Весы в равновесии.');
 }
 restart.addEventListener('click',()=>{resetChrome();round=0;chosen=null;ready=false;showPrimary('Проверить равновесие');paint()});
 commit.addEventListener('click',check);
 showPrimary('Проверить равновесие');paint();
}
// ---------- Scene 3: free choice with a budget and visible consequences ----------
function playTrinkets(){
 sceneBadge('🛍️ Барахолка Дольки');addPortraits(['dolka','luchik']);
 const stock=[
  {id:'bell',icon:'🔔',name:'Колокольчик',price:3,use:'Он может предупредить жителей об опасности.'},
  {id:'rope',icon:'🪢',name:'Верёвка',price:4,use:'Ей можно что-нибудь привязать или укрепить.'},
  {id:'lantern',icon:'🏮',name:'Фонарь',price:5,use:'Он поможет ночью, если станет темно.'},
  {id:'whistle',icon:'📯',name:'Свисток',price:2,use:'Его слышно издалека.'},
  {id:'mirror',icon:'🪞',name:'Зеркальце',price:3,use:'Оно может отражать свет, но легко разбивается.'},
  {id:'crown',icon:'👑',name:'Корона',price:7,use:'Красиво, но пригодится ли она в дороге?'},
  {id:'musicbox',icon:'🎵',name:'Шкатулка',price:4,use:'Музыка дарит радость, но пока важна подготовка.'}
 ];
 const shelf=el('div','gm-treasure-basket');shelf.id='gmTreasures';
 const title=el('div','gm-stall-title','Редкости и припасы');scene.append(title);
 const lamp=el('div','gm-stall-lantern','🏮');lamp.setAttribute('aria-hidden','true');scene.append(lamp);
 for(const item of stock){const b=el('button','gm-good');b.type='button';b.id='gm-shop-'+item.id;b.setAttribute('aria-label',item.name+', цена '+item.price+' монеты');b.append(el('span','emoji',item.icon),el('span','label',item.name),el('span','price',item.price+' 🪙'));b.addEventListener('click',()=>toggle(item.id));shelf.append(b)}scene.append(shelf);
 let picked=[];const BUDGET=10;
 function total(){return picked.reduce((n,id)=>n+stock.find(x=>x.id===id).price,0)}
 function paint(){const t=total();setCount('🪙 '+(BUDGET-t)+' из '+BUDGET);say('Долька','У тебя десять гномьих монет. Что возьмёшь для экспедиции и защиты деревни? Расскажи, почему.');
  redrawBag(picked.map(id=>{const x=stock.find(a=>a.id===id);return x.icon+' '+x.name}));
  shelf.querySelectorAll('button').forEach(b=>{const chosen=picked.includes(b.id.slice(8));b.classList.toggle('is-picked',chosen);b.setAttribute('aria-pressed',String(chosen))});
  commit.disabled=picked.length<2;commit.textContent='Закончить покупки';
 }
 function toggle(id){if(completed)return;const g=stock.find(x=>x.id===id);if(!g)return;
  if(picked.includes(id)){picked=picked.filter(x=>x!==id);hint('Вернули '+g.name.toLowerCase()+' на прилавок.');paint();return;}
  if(total()+g.price>BUDGET){hint('Для этого не хватает монет! Верни что-нибудь или выбери дешевле.',true);return;}
  picked.push(id);hint(g.use);paint();
 }
 function checkout(){if(completed)return;if(picked.length<2){hint('Выбери хотя бы два предмета, чтобы была настоящая покупка.',true);return;}
  const helpful=['bell','rope','lantern','whistle'];if(!picked.some(id=>helpful.includes(id))){hint('Красивые вещи! Но выбери ещё что-нибудь, что поможет в опасности.',true);return;}
  const choice={version:1,items:[...picked],spent:total()};try{localStorage.setItem('tivvig_gnome_market_purchases_v1',JSON.stringify(choice))}catch{}
  markFinished('Ты потратила '+total()+' монет и оставила '+(BUDGET-total())+'. Выбранные вещи пригодятся вечером!');setCount('Покупки готовы ✓');
 }
 restart.addEventListener('click',()=>{resetChrome();picked=[];showPrimary('Закончить покупки');paint()});
 commit.addEventListener('click',checkout);showPrimary('Закончить покупки');paint();
}
// ---------- Scene 4: compare distinctive tracks and evidence with three suspects ----------
function playClues(){
 sceneBadge('🔎 Расследование у гномов');addPortraits(['luchik','ponchik']);
 for(const pos of [{x:'7%',y:'16%'},{x:'89%',y:'17%'}]){
  const l=el('span','gm-night-lamp','🏮');l.style.left=pos.x;l.style.top=pos.y;l.setAttribute('aria-hidden','true');scene.append(l);
 }
 const clues=[
  {id:'bag',x:30,y:70,icon:'🧺',name:'Порванный мешок',text:'Кто-то утащил еду. Мешок разорван, будто его схватили большими руками.'},
  {id:'track',x:51,y:75,icon:'👣',name:'Следы ступней',text:'Огромные отпечатки ДВУХ ступней. На каждой видно ПЯТЬ пальцев. Это не волчьи лапы.'},
  {id:'fur',x:70,y:49,icon:'🧶',name:'Белая шерсть',text:'На ветке застрял клок густой БЕЛОЙ шерсти. У волка обычно серый или бурый мех.'},
  {id:'branch',x:88,y:32,icon:'🌳',name:'Высокая ветка',text:'Сломана ветка выше головы взрослого гнома. Незнакомец был очень высоким.'},
  {id:'mud',x:43,y:43,icon:'💧',name:'Сухая тропинка',text:'В грязи остались следы ног, но нет мокрой полосы от хвоста и нет рыбьей чешуи.'}
 ];
 const suspects=[
  {id:'wolf',icon:'🐺',label:'Волк',traits:'Четыре лапы, следы когтей, серый мех.'},
  {id:'mermaid',icon:'🧜‍♀️',label:'Злая русалка',traits:'Рыбий хвост, мокрый след, чешуя.'},
  {id:'yeti',icon:'❄️',label:'Снежный человек',traits:'Огромные ступни с пальцами, белая шерсть, высокий рост.'}
 ];
 const answerRow=el('div','gm-answers gm-suspects');answerRow.id='gmAnswers';answerRow.hidden=true;bag.after(answerRow);
 for(const a of suspects){
  const b=el('button','gm-answer gm-suspect');b.type='button';b.id='gm-answer-'+a.id;
  b.append(el('span','gm-suspect-icon',a.icon),el('strong','gm-suspect-name',a.label),el('small','gm-suspect-traits',a.traits));
  b.setAttribute('aria-label','Подозреваемый: '+a.label+'. '+a.traits);
  b.addEventListener('click',()=>answer(a.id));answerRow.append(b);
 }
 for(const c of clues){
  const b=el('button','gm-clue',c.icon);b.type='button';b.id='gm-clue-'+c.id;
  b.style.setProperty('--x',c.x+'%');b.style.setProperty('--y',c.y+'%');
  b.setAttribute('aria-label','Осмотреть: '+c.name);b.addEventListener('click',()=>look(c.id));scene.append(b);
 }
 let found=new Set();
 function paint(){
  setCount('Улики '+found.size+' / '+clues.length);
  for(const c of clues){
   const b=$('gm-clue-'+c.id);b.classList.toggle('found',found.has(c.id));
   b.setAttribute('aria-pressed',String(found.has(c.id)));b.textContent=found.has(c.id)?'✓':c.icon;
  }
  answerRow.hidden=found.size!==clues.length;
  if(found.size===clues.length){
   say('Ловкач','Все пять улик собраны. Сравни следы каждого подозреваемого с тем, что мы нашли. Кто взял припасы?');
   hint('Выбери одного из трёх подозреваемых по следам и приметам.');
  }else if(found.size===0){
   say('Лучик','Кто-то забрал еду с рынка! Найди пять улик на площади. Потом выберем подозреваемого.');
   hint('Найдено 0 из 5 улик.');
  }
  redrawBag(found.size?[...found].map(id=>clues.find(x=>x.id===id).icon+' '+clues.find(x=>x.id===id).name):[]);
 }
 function look(id){
  if(completed||found.has(id))return;
  const c=clues.find(x=>x.id===id);if(!c)return;
  found.add(id);paint();
  if(found.size<clues.length){say('Улика — '+c.name,c.text);hint('Найдено '+found.size+' из 5. Ищи остальные следы.');}
 }
 function answer(id){
  if(completed||found.size!==clues.length)return;
  if(id==='wolf'){hint('Волк оставил бы следы ЧЕТЫРЁХ лап с когтями. Но здесь две огромные ступни с пятью пальцами. Подумай ещё.',true);return;}
  if(id==='mermaid'){hint('Русалка оставила бы мокрый след хвоста и чешую. А здесь сухие следы ступней и БЕЛАЯ шерсть. Попробуй ещё.',true);return;}
  if(id!=='yeti')return;
  let note='';
  try{
   const p=JSON.parse(localStorage.getItem('tivvig_gnome_market_purchases_v1')||'null'),items=p?.items||[];
   note=items.includes('bell')?' Колокольчиком можно предупредить всех гномов!':
    items.includes('lantern')?' Купленный фонарь поможет осмотреть дорогу в темноте!':
    items.includes('whistle')?' Свистком можно позвать гномов!':
    items.includes('rope')?' Верёвка поможет укрепить ворота!':'';
  }catch{}
  say('Умняшка','Это снежный человек! У него две огромные ступни, белая шерсть и высокий рост. Он пришёл за едой. Но из тёмного леса доносятся и другие звуки — деревню ещё нужно защитить.'+note);
  answerRow.hidden=true;markFinished('Разгадано: припасы забрал снежный человек. Гномы благодарят Ладу и собираются готовить деревню к ночи.');setCount('5 / 5 ✓');
 }
 restart.addEventListener('click',()=>{resetChrome();found=new Set();answerRow.hidden=true;paint()});
 hidePrimary();paint();
}
// The chrome is identical on all four pages. The only navigation between them is an <a>,
// handled by the existing shared room navigator; do not fake redirects in JavaScript.
$('gmClear').hidden=true;
restart.textContent='↻ Начать заново';
switch(game){case'orders':playOrders();break;case'scales':playScales();break;case'trinkets':playTrinkets();break;case'clues':playClues();break;default:return}
window.TivvigGnomeMarketDebug=Object.freeze({game,complete:()=>completed,hasCompletedOnce:()=>completedOnce,reward:current.reward});
})();