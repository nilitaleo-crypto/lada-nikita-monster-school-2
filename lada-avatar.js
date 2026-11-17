/* Tivvig: display the selected wardrobe outfit only on Lada's STANDARD avatar.
   Do not alter scripted transformations, enemies, rewards, or narrative artwork. */
(()=>{
  'use strict';
  const file=location.pathname.split('/').pop()||'index.html';
  const targets={
    'ladaburg-fialka.html':'.lada-model [data-lada-avatar]',
    'ladaburg-cat-home.html':'#catHomeLada, #victoryLada',
    'ladaburg-rabbit-home.html':'#rabbitHomeLada',
    'ladaburg-fountain.html':'#lada',
    'ladaburg-garden.html':'#ladaImg',
    'ladaburg-bookshop.html':'#ladaPhoto',
    'ladaburg-market.html':'.kid[src$="lada-cutout.webp"]',
    'ladaburg-aphrodite.html':'img.lada[src$="lada-cutout.webp"]',
    'ladaburg-observatory.html':'#roomLada',
    'ladaburg-hermes-book.html':'img.lada[src$="lada-cutout.webp"]',
    'michael-jackson-vampire.html':'#ladaImg',
    'vulkan-labirint.html':'#ladaToken img',
    'vulkan-slogi.html':'#meduza'
  };
  const selector=targets[file];
  if(!selector)return;

  const baseSource='images/lada-cutout.webp';
  const output=new Map();
  const state=new WeakMap();
  let avatars=[];

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error('Cannot load avatar artwork: '+src));
      image.src=src;
    });
  }
  function isBase(src){
    if(!src||src.startsWith('data:')||src.startsWith('blob:'))return false;
    try{return new URL(src,document.baseURI).pathname.endsWith('/images/lada-cutout.webp')}
    catch{return src===baseSource}
  }
  function selectedOutfit(){
    const api=window.TivvigWardrobe;
    if(!api || typeof api.selected!=='function')return null;
    const id=api.selected();
    const item=api.CATALOG.find(x=>x.id===id);
    return item && item.src ? item : {id:'default',src:null};
  }
  function composite(item){
    const key=item.id+'|'+item.src;
    if(!output.has(key)){
      const task=Promise.all([loadImage(baseSource),loadImage(item.src)]).then(([base,coat])=>{
        const canvas=document.createElement('canvas');
        const w=base.naturalWidth||1056,h=base.naturalHeight||1448;
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d',{alpha:true});
        if(!ctx)throw new Error('Canvas is not supported');
        ctx.drawImage(base,0,0,w,h);
        ctx.drawImage(coat,0,0,w,h);
        // Match the star outfit's face opening in wardrobe.js.
        if(item.id==='stars'){
          ctx.save();ctx.beginPath();
          ctx.ellipse(w*.496,h*.145,w*.19,h*.168,0,0,Math.PI*2);
          ctx.clip();ctx.drawImage(base,0,0,w,h);ctx.restore();
        }
        return canvas.toDataURL('image/png');
      });
      output.set(key,task);
      task.catch(()=>output.delete(key));
    }
    return output.get(key);
  }
  function refresh(img){
    const s=state.get(img);
    if(!s)return;
    const current=img.getAttribute('src')||'';
    // A different source is a *scripted transformation*: leave it entirely alone.
    if(!isBase(current) && current!==s.rendered)return;
    const outfit=selectedOutfit();
    if(!outfit)return;
    const request=++s.version;
    if(!outfit.src){
      if(current===s.rendered){s.rendered=null;s.outfit='default';img.src=baseSource;}
      return;
    }
    if(current===s.rendered && s.outfit===outfit.id)return;
    composite(outfit).then(src=>{
      if(request!==s.version || selectedOutfit()?.id!==outfit.id)return;
      // Never overwrite a transformation that happened while images were loading.
      if((img.getAttribute('src')||'')!==current)return;
      s.rendered=src;s.outfit=outfit.id;
      if(current!==src)img.src=src;
    }).catch(error=>console.warn('Tivvig avatar: keeping the original Lada',error));
  }
  function start(){
    avatars=[...document.querySelectorAll(selector)].filter(x=>x.tagName==='IMG');
    for(const img of avatars){
      const s={version:0,rendered:null,outfit:null};
      state.set(img,s);
      new MutationObserver(()=>refresh(img)).observe(img,{attributes:true,attributeFilter:['src']});
      refresh(img);
    }
  }
  function refreshAll(){for(const image of avatars)refresh(image)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('pageshow',refreshAll);
  window.addEventListener('tivvig-outfit-changed',refreshAll);
  window.addEventListener('tivvig-inventory-changed',refreshAll);
  window.addEventListener('storage',e=>{
    if(!e.key||e.key==='tivvig_outfit_selected_v1'||e.key.startsWith('tivvig_outfit_'))refreshAll();
  });
})();