/* Ладабург: совет отряда. No external game assets or speech recognition.
 * Deliberative paths all remain valid; no hidden scoring and no 'wrong' decision.
 * Click-only controls are compatible with desktop, touch, and existing Firebase co-op bridge. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const KEY='tivvig_reward_council_plan_v1';
const PLAN_KEY='tivvig_council_plan_v1';
const STAGES=['intro','compare','news','reconsider','helpers','plan','finish'];
const ROUTES=[
 {id:'forest',name:'Тёмный лес',icon:'🌲',subtitle:'Тропа сквозь старые деревья',
  pros:['Кот умеет незаметно исследовать тропинки.','Деревья укрывают от ветра и чужих глаз.'],
  cons:['В чаще могут встретиться чудовища.','Тропинки запутаны: легко потерять время.'],
  afterPro:'Кроны деревьев закрывают часть дороги от дождя.',
  afterCon:'Под ногами грязь: продвигаться придётся осторожно.'},
 {id:'bridge',name:'Старый мост',icon:'🌉',subtitle:'Короткая дорога над ущельем',
  pros:['Самая короткая дорога к пограничным воротам.','По мосту можно перейти, не спускаясь в ущелье.'],
  cons:['Некоторые доски старые и могут не выдержать.','Высота и открытый ветер мешают переходу.'],
  afterPro:'Даже после дождя этот путь остаётся самым быстрым.',
  afterCon:'Доски теперь скользкие: понадобится страховочная верёвка.'},
 {id:'river',name:'Подземная река',icon:'🌊',subtitle:'Вода у старой пристани',
  pros:['Можно обойти чудовищ, которые сторожат сухопутные тропы.','Умняшка умеет читать древние знаки на пристани.'],
  cons:['Для переправы нужна лодка и помощь при посадке.','Этот путь длиннее остальных.'],
  afterPro:'Высокая вода позволяет лодке пройти над мелкими камнями.',
  afterCon:'Течение стало быстрее: без верёвки и осторожности нельзя.'}
];
const HELPERS=[
 {id:'cat',name:'Ловкий кот',tag:'Тихий разведчик',src:'images/blue-cat.webp',
  route:{
   forest:{pro:'Незаметно проверит лесную тропу.',con:'Не сможет один перенести тяжёлые припасы.'},
   bridge:{pro:'Осторожно проверит узкие доски.',con:'Не сможет укрепить большие балки.'},
   river:{pro:'Найдёт удобный спуск к воде.',con:'Не переправит весь отряд в одиночку.'}}},
 {id:'rabbit',name:'Сильный заяц',tag:'Сила и помощь',src:'images/rabbit-cutout.webp',
  route:{
   forest:{pro:'Расчистит дорогу от упавших деревьев.',con:'Шум может привлечь лесных чудовищ.'},
   bridge:{pro:'Натянет прочную страховочную верёвку.',con:'Ему придётся ступать особенно осторожно на старые доски.'},
   river:{pro:'Донесёт припасы и поможет с лодкой.',con:'Одной силы недостаточно против быстрого течения.'}}},
 {id:'monkey',name:'Умняшка',tag:'Знания и находчивость',src:'images/monkey-cutout.webp',
  route:{
   forest:{pro:'Прочитает старые знаки у развилок.',con:'Пока она читает, кто-то должен следить за безопасностью.'},
   bridge:{pro:'Разберёт древние пометки о ремонте моста.',con:'На изучение надписей потребуется время.'},
   river:{pro:'Расшифрует подсказки на старой пристани.',con:'Сама она не сумеет грести за весь отряд.'}}}
];
const ADVICE={
 lada:'Мне нужно выслушать всех. На любой дороге есть и хорошие стороны, и опасности.',
 cat:'Я могу незаметно разведать путь. Но тяжёлые вещи лучше доверить зайцу!',
 rabbit:'Силы у меня много. Я помогу с верёвками и грузом, только действовать надо осторожно.',
 monkey:'Я умею читать древние знаки. Давайте сначала узнаем, какие у дорог преимущества и риски.'
};
const state={stage:'intro',selected:null,first:null,visited:new Set(),helpers:new Set(),saved:false};
const scroll=()=>{if(window.matchMedia?.('(prefers-reduced-motion:reduce)').matches)return;const main=document.querySelector('.council-workspace');if(main)window.setTimeout(()=>main.scrollIntoView({block:'start',behavior:'smooth'}),100)};
function say(speaker,msg){
 const names={lada:'Лада',cat:'Ловкий кот',rabbit:'Сильный заяц',monkey:'Умняшка',messenger:'Гонец из Ладабурга'};
 text('speakerName',names[speaker]||speaker);
 text('speechText',msg||ADVICE[speaker]||'');
}
function text(id,v){$(id).textContent=v}
function route(id){return ROUTES.find(item=>item.id===id)||null}
function friend(id){return HELPERS.find(item=>item.id===id)||null}
function stageIndex(s){return ['compare','news','helpers','plan','finish'].indexOf(s)}
function setStage(next){
 if(!STAGES.includes(next))return;
 state.stage=next;
 for(const stage of STAGES)$('phase-'+stage).hidden=stage!==next;
 const checkpoints=[['compare',1],['news',2],['helpers',3],['finish',4]];
 const pos=next==='intro'?0:next==='compare'?1:next==='news'||next==='reconsider'?2:next==='helpers'?3:4;
 checkpoints.forEach(([id,index])=>{
  const el=$('step-'+id);
  el.classList.toggle('active',pos===index);
  el.classList.toggle('done',pos>index);
 });
 $('stormOverlay').hidden=!['reconsider','helpers','plan','finish'].includes(next);
 if(next==='compare')renderRouteCards(false);
 if(next==='reconsider')renderRouteCards(true);
 if(next==='helpers')renderHelpers();
 if(next==='plan')renderPlan();
 if(next==='finish')finishGame();
 highlightMap();
 if(next==='intro')say('monkey','Перед нами три дороги. У каждой есть свои плюсы и минусы. Давайте обсудим!');
 if(next==='compare')say('monkey','Нажми на каждую дорогу. Обсуди, что у неё хорошего и что опасного.');
 if(next==='news')say('messenger','Срочная весть! Ночью прошёл дождь — условия изменились сразу на всех трёх дорогах.');
 if(next==='reconsider')say('lada','Я могу сохранить первый выбор или передумать. Нужно взвесить новые плюсы и минусы!');
 if(next==='helpers')say('rabbit','Все четверо пойдут вместе, но двое могут подготовить дорогу впереди остальных.');
 if(next==='plan')say('lada','Сейчас я объясню друзьям свой план — и мы скрепим его печатью.');
 if(next==='finish')say('monkey','Маршрут готов! Мы остались в Ладабурге, но теперь знаем, что делать дальше.');
 if(next!=='intro')scroll();
}
function highlightMap(){
 document.querySelectorAll('[data-route]').forEach(b=>{
  const selected=b.dataset.route===state.selected;
  b.classList.toggle('selected',selected);
  b.setAttribute('aria-pressed',String(selected));
 });
 document.querySelectorAll('[data-speaker]').forEach(b=>{
  const on=state.stage==='helpers'||state.stage==='plan'||state.stage==='finish';
  b.classList.toggle('chosen',on && state.helpers.has(b.dataset.speaker));
 });
}
function make(tag,className,content){
 const e=document.createElement(tag);
 if(className)e.className=className;
 if(content!==undefined)e.textContent=content;
 return e;
}
function makeArgument(label,items,type,extra=false){
 const box=make('div','argument '+type+(extra?' new':''));
 box.appendChild(make('strong',null,label));
 const ul=make('ul');ul.style.margin='0';ul.style.paddingLeft='19px';
 for(const s of (Array.isArray(items)?items:[items])){const li=make('li',null,s);ul.appendChild(li)}
 box.appendChild(ul);return box;
}
function renderRouteCards(revised){
 const target=$(revised?'revisedRouteCards':'routeCards');target.replaceChildren();
 for(const item of ROUTES){
  const card=make('article','route-card'+(state.selected===item.id?' selected':''));card.dataset.card=item.id;
  const head=make('div','route-head');
  head.append(make('span','route-icon',item.icon));
  const name=make('div');name.append(make('h3',null,item.name),make('small',null,item.subtitle));
  head.append(name);card.append(head);
  const body=make('div','route-body');
  body.append(makeArgument('✓ ПЛЮСЫ · За этот путь',item.pros,'positive'));
  body.append(makeArgument('! МИНУСЫ · Против этого пути',item.cons,'negative'));
  if(revised){
   body.append(makeArgument('✓ ПОСЛЕ ДОЖДЯ · Новый плюс',item.afterPro,'positive',true));
   body.append(makeArgument('! ПОСЛЕ ДОЖДЯ · Новый минус',item.afterCon,'negative',true));
  }
  card.append(body);
  const button=make('button','route-select',state.selected===item.id?'✓ Выбрано':'Обсудить и выбрать');
  button.type='button';button.dataset.pickRoute=item.id;
  button.setAttribute('aria-pressed',String(state.selected===item.id));
  button.addEventListener('click',()=>selectRoute(item.id));
  card.append(button);
  if(!revised)card.append(make('span','route-reviewed',state.visited.has(item.id)?'✓ Аргументы рассмотрены':'Нажми, чтобы обсудить маршрут'));
  target.append(card);
 }
 if(revised){
  text('reconsiderStatus',state.selected?(state.first===state.selected?'Ты пока оставила прежнюю дорогу: '+route(state.selected).name+'. Это допустимый выбор.':'Ты решила изменить путь на «'+route(state.selected).name+'». Объясни почему.'):'Выбери дорогу после донесения.');
  $('confirmRoute').disabled=!state.selected;
 }else{
  text('compareStatus','Обсуждено '+state.visited.size+' из 3 дорог. '+(state.visited.size===3?'Теперь можно отправить гонца.':'Рассмотри плюсы и минусы каждой.'));
  $('chooseFirst').disabled=!(state.selected&&state.visited.size===ROUTES.length);
 }
 highlightMap();
}
function selectRoute(id){
 const target=route(id);if(!target)return;
 if(state.stage==='intro'){say('monkey','Прежде чем выбирать, начни военный совет.');return}
 if(state.stage!=='compare'&&state.stage!=='reconsider'){say('lada','Мы уже обсуждаем другую часть плана. Чтобы изменить маршрут, вернись к обсуждению.');return}
 state.selected=id;
 if(state.stage==='compare')state.visited.add(id);
 if(state.stage==='compare')renderRouteCards(false);else renderRouteCards(true);
 const plus=state.stage==='reconsider'?target.afterPro:target.pros[0];
 const minus=state.stage==='reconsider'?target.afterCon:target.cons[0];
 say('lada','Дорога: '+target.name+'. За: '+plus+' Против: '+minus+'');
}
function speakerTalk(id){
 if(id==='lada'){say(id,'Я — командир. Я должна учесть и плюсы, и минусы каждого пути.');return}
 const h=friend(id),r=route(state.selected);
 if(state.stage==='helpers'&&r&&h){
  const d=h.route[r.id];say(id,d.pro+' Но '+d.con.charAt(0).toLowerCase()+d.con.slice(1));return;
 }
 if(r&&h){const d=h.route[r.id];say(id,'Для дороги «'+r.name+'» я могу помочь: '+d.pro+' Но '+d.con.charAt(0).toLowerCase()+d.con.slice(1));return}
 say(id);
}
function chooseProvisional(){
 if(state.stage!=='compare'||!state.selected||state.visited.size!==3)return;
 state.first=state.selected;setStage('news');
}
function readMessenger(){if(state.stage==='news')setStage('reconsider')}
function confirmRoute(){
 if(state.stage!=='reconsider'||!state.selected)return;
 state.helpers.clear();setStage('helpers');
}
function renderHelpers(){
 if(state.stage!=='helpers')return;
 const r=route(state.selected);if(!r)return;
 text('helpersIntro','Дорога «'+r.name+'». Все четверо останутся вместе. Выбери двух друзей для передового отряда: прочитай, чем каждый поможет и что ему трудно.');
 const box=$('helperCards');box.replaceChildren();
 for(const helper of HELPERS){
  const item=helper.route[r.id],selected=state.helpers.has(helper.id);
  const card=make('article','helper-card'+(selected?' selected':''));
  const head=make('div','helper-head');const img=make('img');img.src=helper.src;img.alt='';img.draggable=false;
  const summary=make('div');summary.append(make('h3',null,helper.name),make('small',null,helper.tag));
  head.append(img,summary);card.append(head);
  card.append(makeArgument('✓ Что поможет',item.pro,'positive'));
  card.append(makeArgument('! Что учесть',item.con,'negative'));
  const btn=make('button','route-select',selected?'✓ В передовом отряде':'Поручить разведку');
  btn.type='button';btn.dataset.pickHelper=helper.id;btn.setAttribute('aria-pressed',String(selected));
  btn.addEventListener('click',()=>toggleHelper(helper.id));card.append(btn);
  box.append(card);
 }
 text('helpersStatus','Выбрано '+state.helpers.size+' из 2 помощников. '+(state.helpers.size===2?'Теперь готовим приказ!':'Можешь выбрать любого — у каждого есть преимущество и ограничение.'));
 $('confirmHelpers').disabled=state.helpers.size!==2;
 highlightMap();
}
function toggleHelper(id){
 if(state.stage!=='helpers'||!friend(id))return;
 if(state.helpers.has(id))state.helpers.delete(id);
 else if(state.helpers.size<2)state.helpers.add(id);
 else{say('lada','Выбери двух помощников для разведки. Чтобы поменять состав, сначала сними одно назначение.');return}
 renderHelpers();
 const helper=friend(id),routeData=route(state.selected);
 if(state.helpers.has(id))say(id,helper.route[routeData.id].pro+' Но '+helper.route[routeData.id].con.charAt(0).toLowerCase()+helper.route[routeData.id].con.slice(1));
}
function confirmHelpers(){if(state.stage==='helpers'&&state.helpers.size===2)setStage('plan')}
function renderPlan(){
 const r=route(state.selected),hs=[...state.helpers].map(friend);
 if(!r||hs.length!==2)return;
 text('planRoad','МАРШРУТ: '+r.icon+' '+r.name);
 text('planAdvantage','✓ ЗА: '+r.pros[0]+' Дополнительный плюс после дождя: '+r.afterPro);
 text('planRisk','! ПРОТИВ: '+r.cons[0]+' После дождя: '+r.afterCon);
 text('planTeam','ПЕРВЫМИ ГОТОВЯТ ПУТЬ: '+hs.map(h=>h.name).join(' и ')+'. Остальные остаются рядом с отрядом.');
}
function persist(){
 const r=route(state.selected),helpers=[...state.helpers];
 const p={version:1,route:r.id,routeName:r.name,helpers,createdAt:new Date().toISOString(),location:'Ладабург, ратуша'};
 try{localStorage.setItem(PLAN_KEY,JSON.stringify(p))}catch(e){}
 const registry=window.TivvigRegistry;let saved=false;
 try{saved=!!registry?.unlockReward?.(KEY)}catch(e){}
 if(!saved){
  try{localStorage.setItem(KEY,'unlocked')}catch(e){}
  window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:KEY}}));
  window.dispatchEvent(new Event('tivvig-inventory-changed'));
 }
 return p;
}
function finishGame(){
 if(state.saved)return;
 state.saved=true;
 const p=persist(),names=p.helpers.map(id=>friend(id).name).join(' и ');
 text('finalSummary','Лада выбрала путь «'+p.routeName+'» и поручила передовую подготовку: '+names+'. Сильные стороны и опасности маршрута учтены.');
}
function reopen(){if(state.stage==='plan')setStage('reconsider')}
function reset(){
 state.selected=null;state.first=null;state.visited.clear();state.helpers.clear();state.saved=false;
 setStage('intro');
}
$('begin').addEventListener('click',()=>setStage('compare'));
$('chooseFirst').addEventListener('click',chooseProvisional);
$('readNews').addEventListener('click',readMessenger);
$('confirmRoute').addEventListener('click',confirmRoute);
$('confirmHelpers').addEventListener('click',confirmHelpers);
$('rethink').addEventListener('click',reopen);
$('sealPlan').addEventListener('click',()=>{if(state.stage==='plan'&&state.helpers.size===2&&state.selected)setStage('finish')});
$('replay').addEventListener('click',reset);
document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>selectRoute(button.dataset.route)));
document.querySelectorAll('[data-speaker]').forEach(button=>button.addEventListener('click',()=>speakerTalk(button.dataset.speaker)));
window.__councilTest={
 state:()=>({stage:state.stage,selected:state.selected,first:state.first,visited:[...state.visited],helpers:[...state.helpers],saved:state.saved}),
 routes:ROUTES.map(r=>({id:r.id,pros:[...r.pros],cons:[...r.cons],afterPro:r.afterPro,afterCon:r.afterCon})),
 helpers:HELPERS.map(h=>({id:h.id,route:h.route})),
 start:()=>$('begin').click(),pick:id=>selectRoute(id),news:()=>$('chooseFirst').click(),
 read:()=>$('readNews').click(),confirm:()=>$('confirmRoute').click(),
 helper:id=>toggleHelper(id),next:()=>$('confirmHelpers').click(),rethink:()=>$('rethink').click(),
 seal:()=>$('sealPlan').click(),reset
};
reset();
})();