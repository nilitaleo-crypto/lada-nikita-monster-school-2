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
 {id:'forest',name:'Тёмный лес',icon:'🌲',subtitle:'Скрытая тропа',
  pros:['Кот найдёт дорогу.','Деревья укроют от ветра.'],
  cons:['В лесу чудовища.','Легко заблудиться.'],
  afterPro:'Кроны укрывают от дождя.',afterCon:'На тропах скользко.'},
 {id:'bridge',name:'Старый мост',icon:'🌉',subtitle:'Быстрый путь',
  pros:['Самая короткая дорога.','Не нужна лодка.'],
  cons:['Гнилые доски.','Сильный ветер.'],
  afterPro:'Путь всё ещё самый быстрый.',afterCon:'Мост стал скользким.'},
 {id:'river',name:'Подземная река',icon:'🌊',subtitle:'Дорога по воде',
  pros:['В обход лесных чудовищ.','Умняшка знает знаки пристани.'],
  cons:['Нужна лодка.','Дорога длиннее.'],
  afterPro:'Лодка пройдёт над камнями.',afterCon:'Течение стало сильнее.'}
];
const HELPERS=[
 {id:'cat',name:'Кот',tag:'Разведка',src:'images/blue-cat.webp',
  route:{
   forest:{pro:'Проверит тропу.',con:'Не унесёт груз.'},
   bridge:{pro:'Проверит доски.',con:'Не укрепит мост.'},
   river:{pro:'Найдёт пристань.',con:'Не переправит всех.'}}},
 {id:'rabbit',name:'Заяц',tag:'Сила',src:'images/rabbit-cutout.webp',
  route:{
   forest:{pro:'Уберёт брёвна.',con:'Шум привлечёт зверей.'},
   bridge:{pro:'Натянет верёвку.',con:'Тяжёлый для досок.'},
   river:{pro:'Поможет с лодкой.',con:'Не остановит течение.'}}},
 {id:'monkey',name:'Умняшка',tag:'Знания',src:'images/monkey-cutout.webp',
  route:{
   forest:{pro:'Прочтёт знаки.',con:'Нужно время.'},
   bridge:{pro:'Найдёт план ремонта.',con:'Нужно время.'},
   river:{pro:'Прочтёт карту пристани.',con:'Не умеет грести за всех.'}}}
];
const ADVICE={
 lada:'Я выберу путь и объясню почему!',
 cat:'Я тихо разведаю путь, но тяжёлое не унесу.',
 rabbit:'Я сильный! Помогу с грузом и верёвками.',
 monkey:'Сначала сравним плюсы и минусы.'
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
 if(next==='intro')say('monkey','Все за столом. С чего начнём?');
 if(next==='compare')say('monkey','Нажми на лес, мост и реку. У каждого пути есть плюс и минус.');
 if(next==='news')say('messenger','Дождь! Дороги изменились!');
 if(next==='reconsider')say('lada','Может, выбрать другой путь?');
 if(next==='helpers')say('rabbit','Мы идём вместе. Кто пойдёт на разведку?');
 if(next==='plan')say('lada','Я расскажу свой план.');
 if(next==='finish')say('monkey','Ура! План готов!');
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
  const selected=state.selected===item.id;
  const card=make('button','route-token'+(selected?' selected':''));
  card.type='button';card.dataset.pickRoute=item.id;
  card.setAttribute('aria-pressed',String(selected));
  card.setAttribute('aria-label',item.name+'. Плюс: '+item.pros[0]+' Минус: '+item.cons[0]);
  card.append(make('span','route-emoji',item.icon),make('strong','route-name',item.name));
  const preview=make('div','route-preview');
  preview.append(make('span','pro-preview','＋ '+item.pros[0]),make('span','con-preview','－ '+item.cons[0]));
  card.append(preview);
  if(!revised&&state.visited.has(item.id))card.append(make('span','visited-stamp','✓'));
  card.addEventListener('click',()=>selectRoute(item.id));
  target.append(card);
 }
 const detail=$(revised?'revisedRouteDetails':'routeDetails');
 detail.replaceChildren();
 if(state.selected){
  const active=route(state.selected);
  const title=make('div','detail-title',active.icon+' '+active.name);
  detail.append(title);
  detail.append(makeArgument('＋ ПЛЮСЫ',active.pros,'positive'));
  detail.append(makeArgument('－ МИНУСЫ',active.cons,'negative'));
  if(revised){
   detail.append(makeArgument('＋ После дождя',active.afterPro,'positive',true));
   detail.append(makeArgument('－ После дождя',active.afterCon,'negative',true));
  }
 }else detail.append(make('div','detail-placeholder','👆 Нажми на дорогу на столе'));
 if(revised){
  text('reconsiderStatus',state.selected?(state.first===state.selected?'Можно оставить этот путь.':'Можно изменить решение.'):'Выбери дорогу.');
  $('confirmRoute').disabled=!state.selected;
 }else{
  text('compareStatus','Изучено '+state.visited.size+'/3'+(state.visited.size===3?' ✓':''));
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
 say('lada',target.name+': плюс — '+plus+' Минус — '+minus);
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
 text('helpersIntro','Путь: '+r.icon+' '+r.name+'. Выбери двоих на разведку.');
 const box=$('helperCards');box.replaceChildren();
 for(const helper of HELPERS){
  const item=helper.route[r.id],selected=state.helpers.has(helper.id);
  const card=make('button','helper-token'+(selected?' selected':''));
  card.type='button';card.dataset.pickHelper=helper.id;
  card.setAttribute('aria-pressed',String(selected));
  card.setAttribute('aria-label',helper.name+'. Плюс: '+item.pro+'. Минус: '+item.con);
  const head=make('div','helper-portrait');
  const img=make('img');img.src=helper.src;img.alt='';img.draggable=false;
  const name=make('div');name.append(make('strong',null,helper.name),make('small',null,helper.tag));
  head.append(img,name);card.append(head);
  const notes=make('div','helper-arguments');
  notes.append(make('span','helper-pro','＋ '+item.pro),make('span','helper-con','－ '+item.con));
  card.append(notes,make('span','helper-check',selected?'✓ Выбран':'Выбрать'));
  card.addEventListener('click',()=>toggleHelper(helper.id));
  box.append(card);
 }
 text('helpersStatus','Друзья: '+state.helpers.size+'/2');
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
 text('planRoad','🗺 '+r.icon+' '+r.name);
 text('planAdvantage','✓ ПЛЮС: '+r.pros[0]);
 text('planRisk','! РИСК: '+r.afterCon);
 text('planTeam','👣 РАЗВЕДКА: '+hs.map(h=>h.name).join(' и '));
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
 text('finalSummary',route(p.route).icon+' '+p.routeName+'. Впереди: '+names+'.');
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