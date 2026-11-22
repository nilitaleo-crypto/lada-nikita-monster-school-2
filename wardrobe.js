/* Тиввиг: единая система костюмов. Новые наряды добавляются в CATALOG. */
(function(){
  'use strict';
  const SELECTED='tivvig_outfit_selected_v1';
  const MERMAID='tivvig_outfit_mermaid_unlocked_v1';
  const STARS='tivvig_outfit_stars_unlocked_v1';
  const MONANKAKA='tivvig_outfit_monankaka_unlocked_v1';
  const HECATE='tivvig_outfit_hecate_unlocked_v1';
  const EGYPT_MOON='tivvig_outfit_egypt_moon_unlocked_v1';
  const CHAPTER=[
    'tivvig_reward_jungle_friends_v1',
    'tivvig_reward_merman_waterhouse_v1',
    'tivvig_reward_vampire_nosferatu_v1'
  ];
  const CATALOG=[
    {id:'default',name:'Обычный наряд',description:'Платье с цветами',src:null,available:'always'},
    {id:'mermaid',name:'Наряд русалки',description:'Лес Майкла Джексона',src:'images/mermaid-outfit.webp',available:'mermaid'},
    {id:'stars',name:'Звёздный наряд',description:'Пять испытаний в обсерватории',src:'images/star-outfit.webp',available:'stars'},
    {id:'monankaka',name:'Доспехи ночных крыльев',description:'Кузница Вулкана в Дубовом квартале',src:'images/monankaka-armor.svg',available:'monankaka'},
    {id:'hecate',name:'Наряд Гекаты с лирой',description:'Книга Орфея и Эвридики',src:'images/hecate-lyre-costume-layer.webp',available:'hecate'},
    {id:'egyptMoon',name:'Лунная принцесса Нила',description:'Награда за «Ночную тайну Нила»',src:'images/lada-egypt-moon-outfit.webp',available:'egyptMoon'}
  ];
  function get(key){try{return window.localStorage.getItem(key)}catch(e){return null}}
  function set(key,value){try{window.localStorage.setItem(key,value);return true}catch(e){return false}}
  function isChapterComplete(){return CHAPTER.every(k=>get(k)==='unlocked')}
  function checkUnlock(){
    const already=get(MERMAID)==='unlocked';
    const complete=isChapterComplete();
    if(complete&&!already)set(MERMAID,'unlocked');
    return {unlocked:already||complete,newlyUnlocked:complete&&!already};
  }
  function unlocked(id){return id==='default'||(id==='mermaid'&&checkUnlock().unlocked)||(id==='stars'&&get(STARS)==='unlocked')||(id==='monankaka'&&get(MONANKAKA)==='unlocked')||(id==='hecate'&&get(HECATE)==='unlocked')||(id==='egyptMoon'&&get(EGYPT_MOON)==='unlocked')}
  function selected(){const id=get(SELECTED)||'default';return unlocked(id)?id:'default'}
  function select(id){if(!CATALOG.some(x=>x.id===id)||!unlocked(id))return false;set(SELECTED,id);window.dispatchEvent(new CustomEvent('tivvig-outfit-changed',{detail:{id}}));return true}
  function equip(container){
    if(!container)return;
    const img=container.querySelector('[data-outfit-layer]');
    if(!img)return;
    const current=CATALOG.find(o=>o.id===selected());
    if(current&&current.src){img.src=current.src;img.hidden=false}
    else{img.hidden=true;img.removeAttribute('src')}
    // Preserve the photograph's face and hair above the star cloak or winged armor.
    const isStar=current?.id==='stars'||current?.id==='monankaka';
    let face=container.querySelector('[data-outfit-face]');
    if(isStar && !face){
      face=document.createElement('img');face.setAttribute('data-outfit-face','');
      face.setAttribute('aria-hidden','true');face.alt='';face.src='images/lada-cutout.webp';
      face.draggable=false;container.appendChild(face);
    }
    if(face){
      face.hidden=!isStar;
      if(isStar)Object.assign(face.style,{
        position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',
        zIndex:'4',pointerEvents:'none',clipPath:'ellipse(19% 16.8% at 49.6% 14.5%)'
      });
    }
    if(img)img.style.zIndex='3';
    // Hecate's approved illustration has a transparent face aperture.
    // The existing real Lada cutout beneath it remains the face, not a replacement character.
    container.dataset.outfit=selected();
  }
  function rememberChapter(){const status=checkUnlock();return status}
  window.TivvigWardrobe={CATALOG,CHAPTER,checkUnlock,isChapterComplete,unlocked,selected,select,equip,rememberChapter};
  checkUnlock();
})();