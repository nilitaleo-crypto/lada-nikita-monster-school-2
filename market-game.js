/* Лавка Ладабурга — детерминированные действия от общего Firebase-реплея.
   Вся игровая логика исполняется и у учителя, и у Лады в одном порядке кликов.
   При обычном нажатии без кооператива игра тоже работает. */
(()=>{
 'use strict';
 const fruits=[
  {id:'apple',name:'Яблоко',emoji:'🍎',short:'хрустящее',question:'Яблоко бывает сладким и кислым. А какое любишь ты?'},
  {id:'pear',name:'Груша',emoji:'🍐',short:'сочное',question:'Какая необычная форма у груши! С чем её можно сравнить?'},
  {id:'grapes',name:'Виноград',emoji:'🍇',short:'гроздья',question:'Виноградины растут гроздьями. Как думаешь, какие они на вкус?'},
  {id:'carrot',name:'Морковь',emoji:'🥕',short:'из земли',question:'Морковь растёт под землёй. Как она хрустит, когда её ешь?'},
  {id:'pumpkin',name:'Тыква',emoji:'🎃',short:'круглая',question:'Тыква бывает огромной! Что из неё можно приготовить?'},
  {id:'pitahaya',name:'Питахайя',emoji:'🥭',short:'драконий фрукт',question:'Питахайю ещё зовут драконьим фруктом. Какой вкус ты ей придумаешь?'},
  {id:'carambola',name:'Карамбола',emoji:'⭐',short:'звезда',question:'Карамбола в разрезе похожа на звезду! Как думаешь, она сладкая или кислая?'},
  {id:'romanesco',name:'Романеско',emoji:'🥦',short:'овощ-башня',question:'Романеско похож на лес маленьких башенок. На что ещё похож этот овощ?'},
  {id:'physalis',name:'Физалис',emoji:'🍊',short:'в фонарике',question:'У физалиса есть оболочка, похожая на фонарик. Какой вкус скрывается внутри?'},
  {id:'purple-carrot',name:'Фиолетовая морковь',emoji:'🥕',short:'фиолетовая!',question:'Бывает и фиолетовая морковь! Как думаешь, вкус у неё такой же, как у оранжевой?'}
 ];
 const $=id=>document.getElementById(id);
 const grid=$('products'),progress=$('progress'),speech=$('speechText'),speechTitle=$('speechTitle');
 const basket=$('basketContents'),basketNote=$('basketNote'),reward=$('reward'),flip=$('flipArtwork'),art=$('arcimboldoArtwork'),rewardText=$('rewardText');
 let chosen=[],revealed=false;
 for(const fruit of fruits){
  const b=document.createElement('button');b.type='button';b.className='product';b.id='fruit-'+fruit.id;b.dataset.fruitId=fruit.id;
  b.setAttribute('aria-label','Положить в корзинку: '+fruit.name);
  const icon=document.createElement('span');icon.className='icon-fruit';icon.textContent=fruit.emoji;
  if(fruit.id==='purple-carrot')icon.style.filter='hue-rotate(145deg) saturate(1.5)';
  if(fruit.id==='pitahaya')icon.style.filter='hue-rotate(290deg) saturate(1.55)';
  const label=document.createElement('span');label.className='name';label.textContent=fruit.name;
  const sub=document.createElement('span');sub.className='subtitle';sub.textContent=fruit.short;
  b.append(icon,label,sub);
  b.addEventListener('click',()=>choose(fruit.id));
  grid.append(b);
 }
 function paint(){
  progress.textContent='В корзинке '+chosen.length+' из 5';
  basket.textContent=chosen.map(id=>fruits.find(f=>f.id===id).emoji).join(' ');
  basketNote.textContent=chosen.length===0?'Корзинка пока пуста':chosen.length===5?'Корзинка полная!':('Выбрано '+chosen.length+' из 5');
  for(const fruit of fruits){
   const el=$('fruit-'+fruit.id),isSelected=chosen.includes(fruit.id);
   el.classList.toggle('selected',isSelected);
   el.setAttribute('aria-pressed',String(isSelected));
  }
 }
 function choose(id){
  const fruit=fruits.find(f=>f.id===id);
  if(!fruit||chosen.length>=5)return;
  if(chosen.includes(id)){
   speechTitle.textContent='Наш зелёный друг:';
   speech.textContent='Этот продукт уже в корзинке! Выбери другой.';
   return;
  }
  chosen.push(id);
  speechTitle.textContent=fruit.name+':';
  speech.textContent=fruit.question;
  paint();
  if(chosen.length===5){
   speechTitle.textContent='Наш зелёный друг:';
   speech.textContent='Ты собрала все пять! Смотри, какую корзинку мы нашли!';
   reward.hidden=false;
   flip.focus({preventScroll:true});
  }
 }
 flip.addEventListener('click',()=>{
  if(chosen.length!==5||revealed)return;
  revealed=true;art.classList.add('turned');
  art.alt='Перевёрнутая картина Арчимбольдо: плоды складываются в человеческое лицо';
  flip.setAttribute('aria-label','Ты нашла лицо из фруктов');
  rewardText.textContent='Невероятно! Корзинка превратилась в голову из фруктов. Какие плоды ты узнаёшь?';
  // Сигнал через общий игровой реестр: он передаёт награду в текущую Firebase-комнату.
  window.TivvigRegistry?.unlockReward('tivvig_reward_ladaburg_arcimboldo_v1');
 });
 $('playAgain').addEventListener('click',()=>{
  chosen=[];revealed=false;art.classList.remove('turned');
  art.alt='Джузеппе Арчимбольдо: обычная корзина с фруктами';
  flip.setAttribute('aria-label','Перевернуть корзинку с фруктами');
  rewardText.textContent='Нажми на корзинку с фруктами ещё раз. Кажется, в ней кто-то прячется…';
  reward.hidden=true;
  speechTitle.textContent='Наш зелёный друг:';
  speech.textContent='Соберём новую корзинку! Какие продукты попробуем теперь?';
  paint();
 });
 paint();
 // Hook for static tests; does not change gameplay.
 window.TivvigMarketDebug=Object.freeze({selection:()=>[...chosen],revealed:()=>revealed});
})();