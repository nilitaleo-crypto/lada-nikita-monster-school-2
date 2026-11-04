/* Тиввиг: единая система костюмов. Новые наряды добавляются в CATALOG. */
(function(){
  'use strict';
  const SELECTED='tivvig_outfit_selected_v1';
  const MERMAID='tivvig_outfit_mermaid_unlocked_v1';
  const CHAPTER=[
    'tivvig_reward_jungle_friends_v1',
    'tivvig_reward_merman_waterhouse_v1',
    'tivvig_reward_vampire_nosferatu_v1'
  ];
  const CATALOG=[
    {id:'default',name:'Обычный наряд',description:'Платье с цветами',src:null,available:'always'},
    {id:'mermaid',name:'Наряд русалки',description:'Лес Майкла Джексона',src:'images/mermaid-outfit.webp',available:'mermaid'}
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
  function unlocked(id){return id==='default'||(id==='mermaid'&&checkUnlock().unlocked)}
  function selected(){const id=get(SELECTED)||'default';return unlocked(id)?id:'default'}
  function select(id){if(!CATALOG.some(x=>x.id===id)||!unlocked(id))return false;set(SELECTED,id);window.dispatchEvent(new CustomEvent('tivvig-outfit-changed',{detail:{id}}));return true}
  function equip(container){
    if(!container)return;
    const img=container.querySelector('[data-outfit-layer]');
    if(!img)return;
    const current=CATALOG.find(o=>o.id===selected());
    if(current&&current.src){img.src=current.src;img.hidden=false}
    else{img.hidden=true;img.removeAttribute('src')}
    container.dataset.outfit=selected();
  }
  function rememberChapter(){const status=checkUnlock();return status}
  window.TivvigWardrobe={CATALOG,CHAPTER,checkUnlock,isChapterComplete,unlocked,selected,select,equip,rememberChapter};
  checkUnlock();
})();