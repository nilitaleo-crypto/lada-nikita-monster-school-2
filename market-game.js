/* Лавка Ладабурга: реальные фотографии продуктов в корзинах на прилавке.
   Игра намеренно работает только от click; в общем занятии все click
   переигрываются по Firebase в одинаковом порядке у ребёнка и учителя. */
(()=>{
'use strict';
const TARGET=7;
const fruits=[
 {id:'apple',name:'Яблоко',short:'хрустящее',x:39,y:55,question:'Яблоки бывают сладкими и кислыми. Какое яблоко ты бы выбрала?',photo:'apple'},
 {id:'pear',name:'Груша',short:'сочная',x:49,y:55,question:'На что похожа форма груши? Какой у неё запах?',photo:'pear'},
 {id:'grapes',name:'Виноград',short:'ягоды',x:59,y:55,question:'Виноград бывает зелёным и фиолетовым. Какой ты любишь?',photo:'grapes'},
 {id:'carrot',name:'Морковь',short:'хрустит',x:69,y:55,question:'Морковь растёт под землёй! Она сладкая или солёная?',photo:'carrot'},
 {id:'pepper',name:'Перец',short:'сочный',x:79,y:55,question:'Этот перец оранжевый. Как ты думаешь, он сладкий или острый?',photo:'pepper'},
 {id:'pitahaya',name:'Питахайя',short:'драконий плод',x:39,y:72,question:'Драконий фрукт выглядит очень необычно. А каким ты представляешь его вкус?',photo:'pitahaya'},
 {id:'carambola',name:'Карамбола',short:'звёздочка',x:49,y:72,question:'Если карамболу разрезать поперёк, получится звезда. Она кислая или сладкая?',photo:'carambola'},
 {id:'physalis',name:'Физалис',short:'фонарик',x:59,y:72,question:'Физалис похож на маленький фонарик. На что похож вкус ягодки?',photo:'physalis'},
 {id:'opuntia',name:'Опунция',short:'плод кактуса',x:69,y:72,question:'А ты знала, что кактусы дают съедобные плоды? Как их можно есть, чтобы не уколоться?',photo:'opuntia'},
 {id:'cherimoya',name:'Черимойя',short:'чешуйчатая',x:79,y:72,question:'Черимойя кажется покрытой чешуйками. Как думаешь, что у неё внутри?',photo:'cherimoya'}
];
const $=id=>document.getElementById(id);
const grid=$('products'),progress=$('progress'),speech=$('speechText'),speechTitle=$('speechTitle');
const basket=$('basketContents'),basketNote=$('basketNote'),reward=$('reward'),flip=$('flipArtwork'),art=$('arcimboldoArtwork'),rewardText=$('rewardText');
let chosen=[],revealed=false;
const photos=new Map();
const photoPath=fruit=>'images/market-produce/'+fruit.photo+'.jpg';
// Real photographs from Fruits-360 are on white. Remove the studio background
// client-side and cache a transparent PNG; failure leaves the original photo visible.
function isolatePhoto(img,fruit){
 if(img.dataset.isolated)return;
 img.dataset.isolated='1';
 try{
  const w=img.naturalWidth,h=img.naturalHeight;
  if(!w||!h) return;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h);const d=pixels.data;
  let left=w,top=h,right=-1,bottom=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2];
   const lo=Math.min(r,g,b),chroma=Math.max(r,g,b)-lo;
   let alpha=255;
   if(lo>=244&&chroma<22)alpha=0;
   else if(lo>221&&chroma<25)alpha=Math.round(255*(244-lo)/23);
   d[i+3]=alpha;
   if(alpha>35){if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;}
  }
  ctx.putImageData(pixels,0,0);
  if(right<left||bottom<top)return;
  const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;
  cropped.getContext('2d').drawImage(canvas,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
  const dataUrl=cropped.toDataURL('image/png');
  photos.set(fruit.id,dataUrl);img.classList.add('is-cutout');img.src=dataUrl;
  if(chosen.includes(fruit.id))paintBasket();
 }catch(e){console.warn('Could not isolate produce photo',fruit.id,e);}
}
for(const fruit of fruits){
 const b=document.createElement('button');b.type='button';b.className='product';b.id='fruit-'+fruit.id;b.dataset.fruitId=fruit.id;
 b.style.setProperty('--x',fruit.x+'%');b.style.setProperty('--y',fruit.y+'%');
 b.setAttribute('aria-label','Положить в корзинку: '+fruit.name);
 const wrap=document.createElement('span');wrap.className='photo-wrap';
 const img=document.createElement('img');img.src=photoPath(fruit);img.alt='';img.decoding='async';img.loading='eager';
 img.addEventListener('load',()=>isolatePhoto(img,fruit));
 wrap.append(img);
 const label=document.createElement('span');label.className='name';label.textContent=fruit.name;
 b.append(wrap,label);
 b.addEventListener('click',()=>choose(fruit.id));grid.append(b);
}
function paintBasket(){
 basket.replaceChildren();
 for(const id of chosen){
  const fruit=fruits.find(f=>f.id===id);const image=document.createElement('img');
  image.src=photos.get(id)||photoPath(fruit);image.alt='';image.setAttribute('aria-hidden','true');
  basket.append(image);
 }
}
function paint(){
 progress.textContent='В корзинке '+chosen.length+' из '+TARGET;
 basketNote.textContent=chosen.length===0?'Корзинка пока пуста':chosen.length===TARGET?'Корзинка полная!':'Выбрано '+chosen.length+' из '+TARGET;
 for(const fruit of fruits){
  const el=$('fruit-'+fruit.id),selected=chosen.includes(fruit.id);
  el.classList.toggle('selected',selected);
  el.setAttribute('aria-pressed',String(selected));
 }
 paintBasket();
}
function choose(id){
 const fruit=fruits.find(f=>f.id===id);
 if(!fruit||chosen.length>=TARGET)return;
 if(chosen.includes(id)){
  speechTitle.textContent='Наш зелёный друг:';
  speech.textContent='Этот продукт уже в корзинке! Давай выберем другой.';
  return;
 }
 chosen.push(id);
 speechTitle.textContent=fruit.name+':';speech.textContent=fruit.question;
 paint();
 if(chosen.length===TARGET){
  speechTitle.textContent='Наш зелёный друг:';
  speech.textContent='Ты собрала семь разных продуктов! А теперь посмотри на эту необычную корзину…';
  reward.hidden=false;flip.focus({preventScroll:true});
 }
}
flip.addEventListener('click',()=>{
 if(chosen.length!==TARGET||revealed)return;
 revealed=true;art.classList.add('turned');
 art.alt='Перевёрнутая картина Арчимбольдо: из плодов сложилось человеческое лицо';
 flip.setAttribute('aria-label','Ты нашла лицо из фруктов');
 rewardText.textContent='Невероятно! Корзина превратилась в голову из фруктов. Какие плоды ты узнаёшь?';
 window.TivvigRegistry?.unlockReward('tivvig_reward_ladaburg_arcimboldo_v1');
});
$('playAgain').addEventListener('click',()=>{
 chosen=[];revealed=false;art.classList.remove('turned');
 art.alt='Джузеппе Арчимбольдо: картина выглядит как корзина с фруктами';
 flip.setAttribute('aria-label','Перевернуть корзинку с фруктами');
 rewardText.textContent='Нажми на корзинку с фруктами ещё раз. Кажется, в ней кто-то прячется…';
 reward.hidden=true;
 speechTitle.textContent='Наш зелёный друг:';speech.textContent='Соберём новую корзинку! Какие продукты возьмём теперь?';
 paint();
});
paint();
window.TivvigMarketDebug=Object.freeze({selection:()=>[...chosen],revealed:()=>revealed,goal:TARGET});
})();