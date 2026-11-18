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
 clues:{name:'Кто раскидал припасы?',count:5,speaker:'Лучик',portrait:'luchik',reward:'tivvig_reward_gnome_clues_v1',next:'gnome-village.html',nextText:'Вернуться в деревню'}
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
// ---------- Scene 1: orders on the physical market counter ----------
function playOrders(){
 const orders=[
  {buyer:'Бантик',portrait:'bantik',ask:'Для праздника мне нужны ДВА красных яблока.',want:['apple','apple']},
  {buyer:'Пончик',portrait:'ponchik',ask:'Хочу морковь и гроздь винограда. Это два разных продукта!',want:['carrot','grapes']},
  {buyer:'Юла',portrait:'yula',ask:'Возьми для меня зелёную капусту и жёлтую грушу.',want:['cabbage','pear']},
  {buyer:'Долька',portrait:'dolka',ask:'Мне нужны ДВА оранжевых апельсина.',want:['orange','orange']},
  {buyer:'Лучик',portrait:'luchik',ask:'Положи хлеб и яблоко — мой завтрак!',want:['bread','apple']},
  {buyer:'Кубик',portrait:'kubik',ask:'Положи два разных овоща: морковь и капусту.',want:['carrot','cabbage']}
 ];
 sceneBadge('🍎 Лавка перепутанных заказов');
 // The illustrated cover already depicts home/help/restart buttons. Make them real,
 // touch-sized hit targets so no visible control is inert.
 const visualHome=el('a','gm-scene-touch home');visualHome.id='gmSceneHome';visualHome.href='gnome-village.html';visualHome.setAttribute('aria-label','Вернуться в деревню гномов');scene.append(visualHome);
 const visualHelp=el('button','gm-scene-touch help');visualHelp.type='button';visualHelp.id='gmSceneHelp';visualHelp.setAttribute('aria-label','Попросить подсказку к заказу');visualHelp.addEventListener('click',()=>hint('Сначала внимательно послушай просьбу гнома. Какие два товара ему нужны?'));scene.append(visualHelp);
 const visualRestart=el('button','gm-scene-touch reload');visualRestart.type='button';visualRestart.id='gmSceneRestart';visualRestart.setAttribute('aria-label','Заново начать игру');visualRestart.addEventListener('click',()=>restart.click());scene.append(visualRestart);

 const counter=el('div','gm-goods');counter.id='gmProducts';
 const ids=Object.keys(products);
 for(const id of ids){const p=products[id],btn=el('button','gm-good');btn.type='button';btn.id='gm-item-'+id;btn.setAttribute('aria-label','Положить в заказ: '+p.name);
 const img=el('span','emoji',p.icon),label=el('span','label',p.name);btn.append(img,label);btn.addEventListener('click',()=>addItem(id));counter.append(btn)}scene.append(counter);
 let round=0,selected=[],ready=false;
 function paint(){
  setCount('Заказ '+(round+1)+' / '+orders.length);
  const o=orders[round];speaker.src=avatar(o.portrait);speaker.alt='Гном '+o.buyer;say(o.buyer,o.ask+' Выбери два товара на прилавке.');
  redrawBag(selected.map(id=>products[id].icon+' '+products[id].name));
  const basket=el('span','bag-pill','🧺 '+selected.length+' / 2');bag.prepend(basket);
  $('gmClear').hidden=!selected.length||ready;
  commit.textContent=ready?(round===orders.length-1?'Завершить торговлю':'Следующий покупатель'):'Отдать заказ';
  commit.disabled=!ready&&selected.length!==2;
  scene.querySelectorAll('.gm-good').forEach(b=>b.classList.toggle('is-picked',selected.includes(b.id.replace('gm-item-',''))));
 }
 function addItem(id){if(completed||ready)return;if(selected.length>=2){hint('В корзине уже два товара. Можно убрать один.',true);return;}selected.push(id);hint('');paint()}
 function check(){if(completed)return;const o=orders[round];
  if(!ready){if(selected.length!==2)return;
   if(!checkMultiset(selected,o.want)){hint('Кажется, заказ перепутался! Сравни товары со словами покупателя, затем исправь корзинку.',true);return;}
   ready=true;hint('✓ '+o.buyer+' благодарит Ладу. Ты собрала заказ правильно!');paint();return;
  }
  if(round===orders.length-1){markFinished('Все шесть заказов выполнены! Гномы приглашают тебя к весам.');setCount('6 / 6 ✓');return;}
  round++;selected=[];ready=false;hint('Новый покупатель подошёл к прилавку.');paint();
 }
 $('gmClear').addEventListener('click',()=>{if(!ready&&selected.length){selected.pop();hint('Товар возвращён на прилавок.');paint()}});
 restart.addEventListener('click',()=>{resetChrome();round=0;selected=[];ready=false;paint();showPrimary('Отдать заказ')});
 commit.addEventListener('click',check);
 showPrimary('Отдать заказ');paint();
}
// ---------- Scene 2: weights and balance, no arbitrary shape-to-weight guessing ----------
function playScales(){
 const tasks=[
 {item:'🍎',name:'Яблоки',need:2,opts:[1,2,3]},
 {item:'🥕',name:'Морковь',need:3,opts:[4,3,2]},
 {item:'🥖',name:'Хлеб',need:4,opts:[3,5,4]},
 {item:'🍐',name:'Груши',need:5,opts:[4,5,6]},
 {item:'🍇',name:'Виноград',need:6,opts:[7,5,6]},
 {item:'🥬',name:'Капуста',need:7,opts:[7,8,6]}
 ];
 sceneBadge('⚖️ Весовая палатка Кубика');addPortraits(['kubik','yula']);
 const box=el('div','gm-scales');box.id='gmScale';box.innerHTML='<div class="gm-scale-top"></div><div class="gm-pan left"><span class="big" id="gmLeftIcon">🍎</span><strong id="gmLeftWeight">2</strong></div><div class="gm-pan right"><span class="big" id="gmRightIcon">⚖️</span><strong id="gmRightWeight">?</strong></div>';scene.append(box);
 const choices=el('div','gm-scale-challenge');choices.innerHTML='<b>Сколько гирек положить справа?</b><div class="gm-weights" id="gmWeights"></div>';
 scene.append(choices);
 for(let i=0;i<3;i++){const b=el('button','gm-weight');b.type='button';b.id='gm-weight-'+i;b.setAttribute('aria-label','Выбрать гирьки');b.addEventListener('click',()=>choose(i));$('gmWeights').append(b)}
 let round=0,chosen=null,ready=false;
 function paint(){const task=tasks[round];setCount('Весы '+(round+1)+' / 6');speaker.src=avatar('kubik');say('Кубик','На левой чаше '+task.name.toLowerCase()+': они весят '+task.need+' '+(task.need>=2&&task.need<=4?'гирьки':'гирек')+'. Подбери столько же гирек на правую чашу.');
  $('gmLeftIcon').textContent=task.item;$('gmLeftWeight').textContent=task.need+' ⚙';$('gmRightIcon').textContent=chosen===null?'⚖️':'🪙';$('gmRightWeight').textContent=chosen===null?'?':String(task.opts[chosen])+' ⚙';
  for(let i=0;i<3;i++){const b=$('gm-weight-'+i);b.textContent=task.opts[i]+' ⚙';b.setAttribute('aria-label',task.opts[i]+' гирек');b.classList.toggle('chosen',chosen===i)}
  box.style.setProperty('--tilt',chosen===null?'0deg':task.opts[chosen]===task.need?'0deg':task.opts[chosen]>task.need?'8deg':'-8deg');
  commit.textContent=ready?(round===tasks.length-1?'Завершить взвешивание':'Следующие весы'):'Проверить равновесие';commit.disabled=chosen===null&&!ready;
  redrawBag([task.item+' '+task.need+' гирьки','⚖️ '+(chosen===null?'Выбери груз':'Справа '+task.opts[chosen]+' гирьки')]);
 }
 function choose(index){if(completed||ready)return;chosen=index;hint('Посмотри, как наклонились весы. Уравновесились ли чаши?');paint()}
 function check(){if(completed)return;if(ready){if(round===tasks.length-1){markFinished('Все весы уравновешены! Теперь можно выбирать необычные припасы.');setCount('6 / 6 ✓');return;}round++;chosen=null;ready=false;hint('Новое взвешивание.');paint();return;}
 if(chosen===null)return;
 if(tasks[round].opts[chosen]!==tasks[round].need){hint('Чаши не на одном уровне. Сколько гирек должно быть справа?',true);return;}
 ready=true;hint('✓ Весы стоят ровно!');paint();
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
// ---------- Scene 4: evidence hunt at dusk, gentle deduction rather than scary jump-scares ----------
function playClues(){
 sceneBadge('🔎 Вечерняя загадка рынка');addPortraits(['luchik','ponchik']);
 for(const pos of [{x:'7%',y:'16%'},{x:'89%',y:'17%'}]){const l=el('span','gm-night-lamp', '🏮');l.style.left=pos.x;l.style.top=pos.y;l.setAttribute('aria-hidden','true');scene.append(l)}
 const clues=[
  {id:'bag',x:30,y:70,icon:'🧺',name:'Порванный мешок',text:'Мешок разорван снаружи. Кто-то пытался достать припасы.'},
  {id:'track',x:51,y:75,icon:'🐾',name:'Большой след',text:'На грязной дорожке три длинных отпечатка пальцев. У гномов ступни гораздо меньше.'},
  {id:'branch',x:70,y:49,icon:'🌿',name:'Сломанная ветка',text:'Ветки над тропой сломаны высоко. Существо, похоже, довольно большое.'},
  {id:'forest',x:88,y:32,icon:'🌲',name:'Лесная тропа',text:'Цепочка следов ведёт прямо в тёмный лес за деревней.'},
  {id:'flour',x:43,y:43,icon:'🌾',name:'Просыпанная мука',text:'Крошки и мука тянутся от разорванного мешка в сторону леса.'}
 ];
 const answers=[{id:'dwarf',label:'Гном украл мешок'},{id:'wind',label:'Это был ветер'},{id:'creature',label:'Пришло большое существо из леса'}];
 const answerRow=el('div','gm-answers');answerRow.id='gmAnswers';answerRow.hidden=true;bag.after(answerRow);
 for(const a of answers){const b=el('button','gm-answer',a.label);b.type='button';b.id='gm-answer-'+a.id;b.addEventListener('click',()=>answer(a.id));answerRow.append(b)}
 for(const c of clues){const b=el('button','gm-clue',c.icon);b.type='button';b.id='gm-clue-'+c.id;b.style.setProperty('--x',c.x+'%');b.style.setProperty('--y',c.y+'%');b.setAttribute('aria-label','Осмотреть: '+c.name);b.addEventListener('click',()=>look(c.id));scene.append(b)}
 let found=new Set();let solved=false;
 function paint(){setCount('Улики '+found.size+' / 5');for(const c of clues){const b=$('gm-clue-'+c.id);b.classList.toggle('found',found.has(c.id));b.setAttribute('aria-pressed',String(found.has(c.id)));b.textContent=found.has(c.id)?'✓':c.icon;}
  if(found.size===clues.length){answerRow.hidden=false;hint('Все улики найдены. Кто мог прийти на рынок?');say('Ловкач','Мы собрали улики. Посмотри на размер следов и куда они ведут. Кто мог здесь побывать?')}
  else if(!found.size){say('Лучик','По вечерам с прилавков исчезает еда! Лада, найди пять улик на рынке. Прикоснись к светящимся значкам.');hint('Найдено 0 из 5 улик.');}
  redrawBag(found.size?[...found].map(id=>clues.find(x=>x.id===id).icon+' '+clues.find(x=>x.id===id).name):[]);
 }
 function look(id){if(completed||found.has(id))return;const clue=clues.find(c=>c.id===id);if(!clue)return;found.add(id);paint();
  if(found.size!==clues.length){say('Улика: '+clue.name,clue.text);hint('Найдено '+found.size+' из 5 улик. Продолжай исследовать.');}
 }
 function answer(id){if(completed||found.size<clues.length)return;
  if(id!=='creature'){hint('Вспомни большой след и сломанную ветку. Мог ли это сделать ветер или маленький гном?',true);return;}
  solved=true;try{const p=JSON.parse(localStorage.getItem('tivvig_gnome_market_purchases_v1')||'null');const items=p?.items||[];
    const note=items.includes('bell')?' Пригодится купленный колокольчик: им можно поднять тревогу!':items.includes('lantern')?' Ночью поможет купленный фонарь!':items.includes('whistle')?' Свистком можно позвать гномов!':items.includes('rope')?' Верёвка поможет укрепить ворота!':'';
    say('Умняшка','Следы ведут в лес. Это было большое неизвестное существо. Нужно предупредить жителей деревни.'+note);
  }catch{say('Умняшка','Следы ведут в лес. Это было большое неизвестное существо. Нужно предупредить жителей деревни.');}
  answerRow.hidden=true;markFinished('Расследование завершено. Гномы собираются готовить оборону перед ночью.');setCount('5 / 5 ✓');
 }
 restart.addEventListener('click',()=>{resetChrome();found=new Set();solved=false;answerRow.hidden=true;paint()});
 hidePrimary();paint();
}
// The chrome is identical on all four pages. The only navigation between them is an <a>,
// handled by the existing shared room navigator; do not fake redirects in JavaScript.
$('gmClear').hidden=true;
restart.textContent='↻ Начать заново';
switch(game){case'orders':playOrders();break;case'scales':playScales();break;case'trinkets':playTrinkets();break;case'clues':playClues();break;default:return}
window.TivvigGnomeMarketDebug=Object.freeze({game,complete:()=>completed,hasCompletedOnce:()=>completedOnce,reward:current.reward});
})();