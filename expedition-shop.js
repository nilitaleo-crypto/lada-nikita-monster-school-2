/* Магазин припасов Анубиса — отдельный модуль внутри уже разрешённой Firebase-страницы Дубового квартала.
   Не создаёт новый путь в Firebase Rules; действия — обычные стабильные button click. */
(()=>{
"use strict";
const root=document.getElementById("expeditionShop");
const gate=document.getElementById("expeditionGate");
if(!root||!gate)return;
const required=["compass","map","coat","canteen","lantern","boots"];
const goods=[
 {id:"compass",name:"Компас",icon:"🧭",x:11,y:62,q:"Куда показывает стрелка компаса? Что делать, если мы заблудимся?"},
 {id:"map",name:"Карта",icon:"🗺️",x:25,y:62,q:"Если знаешь дорогу, зачем может понадобиться карта? Что на ней отмечено?"},
 {id:"coat",name:"Тёплая одежда",icon:"🧥",x:42,y:62,q:"Что произойдёт, если в горах будет холодно или пойдёт дождь?"},
 {id:"canteen",name:"Фляга с водой",icon:"💧",x:56,y:62,q:"Почему в походе обязательно нужна питьевая вода?"},
 {id:"lantern",name:"Фонарь",icon:"🏮",x:69,y:62,q:"Что поможет, если мы задержимся до темноты или войдём в пещеру?"},
 {id:"boots",name:"Прочные ботинки",icon:"🥾",x:85,y:62,q:"Почему в лесу удобнее крепкие ботинки, чем домашние тапочки?"},
 {id:"elephant",name:"Фото слона",icon:"🐘",x:20,y:82,q:"Фотография слона красивая. Но поможет ли она найти дорогу? А может, у неё есть другое назначение?"},
 {id:"crown",name:"Золотая корона",icon:"👑",x:36,y:82,q:"Корона сверкает! А что будет, если нести её по камням и склонам?"},
 {id:"teacup",name:"Чашка с блюдцем",icon:"☕",x:52,y:82,q:"Из неё приятно пить чай. А если мы уроним хрупкую чашку в походе?"},
 {id:"shell",name:"Морская ракушка",icon:"🐚",x:66,y:82,q:"Ракушка красивая. Она пригодится в горах или её лучше оставить на полке?"},
 {id:"pinwheel",name:"Игрушечная вертушка",icon:"🎏",x:81,y:82,q:"Вертушка показывает ветер и радует глаз! Но стоит ли занять ею место в рюкзаке?"}
];
let selected=[],focusId=null,finished=false;
const svgMerchant=String.raw`<svg viewBox="0 0 260 365" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><linearGradient id="tunic" x2=".3" y2="1"><stop stop-color="#a84835"/><stop offset="1" stop-color="#7c302c"/></linearGradient></defs>
<path d="M105 128Q46 129 42 188L19 302L48 315L83 223L92 360H190L194 226L220 313L250 300L228 177Q211 123 151 123Z" fill="url(#tunic)" stroke="#482d2c" stroke-width="5"/>
<path d="M84 137Q125 166 178 137L164 180H104Z" fill="#d59c39" stroke="#38417d" stroke-width="6"/>
<path d="M92 144H181M100 155H176M106 166H169" stroke="#244993" stroke-width="6"/>
<path d="M119 200L191 182L204 360H102Z" fill="#f2bf58" stroke="#b27c30" stroke-width="5"/>
<path d="M108 227L185 206M107 245L192 222M105 263L194 244M106 284L196 264M104 308L199 285" stroke="#b58035" stroke-width="2" opacity=".4"/>
<path d="M92 137L96 60L120 18L143 69L165 18L189 76L180 137" fill="#11151d" stroke="#e1b455" stroke-width="4"/>
<path d="M117 31L122 7L137 46M161 35L166 9L177 54" fill="#e6dfd6" stroke="#1b1c1e" stroke-width="4"/>
<path d="M93 95Q54 89 42 106Q74 122 111 124L161 115Q183 104 174 76Q145 61 117 81Z" fill="#11151d" stroke="#b48a45" stroke-width="3"/>
<path d="M97 102L126 100L137 95" fill="none" stroke="#e6bb53" stroke-width="4"/>
<path d="M129 95L139 89" stroke="#e8b85a" stroke-width="3"/>
<path d="M96 122L90 177L114 176L122 140L139 180L162 181L173 121" fill="#172d67" stroke="#d5a34b" stroke-width="5"/>
<path d="M46 299L7 321L17 332L44 316M214 299L243 329L256 314L245 296" fill="#a94a37" stroke="#492f30" stroke-width="4"/>
<path d="M202 308L231 313M48 293L24 290" stroke="#e5b955" stroke-width="7"/>
<path d="M232 119V350" stroke="#19366d" stroke-width="8" stroke-linecap="round"/>
<path d="M231 122Q225 100 240 95Q257 99 247 113" fill="none" stroke="#19366d" stroke-width="8" stroke-linecap="round"/>
</svg>`;
const style=document.createElement("style");
style.textContent=String.raw`
body.expedition-open{padding:0}body.expedition-open > header{display:none}
#expeditionGate{position:absolute;left:43%;top:5%;z-index:8;min-width:clamp(110px,19%,260px);min-height:clamp(55px,7vw,90px);border:4px ridge #b89053;border-radius:16px;cursor:pointer;touch-action:manipulation;background:linear-gradient(145deg,#45354de8,#22494fef);color:#fff1c8;line-height:1.2;font:bold clamp(13px,1.75vw,24px) Georgia,serif;box-shadow:0 7px 20px #201929aa;padding:9px}
#expeditionGate:hover,#expeditionGate:focus-visible{outline:3px solid #ffe8a3;outline-offset:2px;background:#355f67}
#expeditionShop[hidden],#expeditionShop [hidden]{display:none!important}
#expeditionShop{display:block;position:relative;z-index:10;min-height:100dvh;padding:clamp(8px,1.5vw,24px);background:radial-gradient(ellipse at top,#8d6848,#26253d 80%);color:#4a3226;line-height:1.4}
#expeditionShop button{cursor:pointer;touch-action:manipulation;font:inherit}
#expeditionShop button:focus-visible{outline:3px solid #37addd;outline-offset:3px}
#expeditionShop .shop-nav{max-width:1250px;margin:0 auto 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;color:#fff4d1;font-size:clamp(15px,2vw,24px)}
#expeditionShop .shop-nav button,#expeditionShop .shop-buttons button{border:2px solid #c5a26e;border-radius:12px;background:#fff0cd;color:#48322a;padding:10px 15px;min-height:46px;font-weight:bold}
#expeditionShop .shop-frame{max-width:1250px;margin:auto;border:6px ridge #b69260;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px #1e1110a6}
#expeditionShop .shop-stage{position:relative;aspect-ratio:1672/941;min-width:665px;isolation:isolate;overflow:hidden;background:linear-gradient(180deg,#564c68 0%,#b88e61 50%,#714a35 66%,#50311f 100%);background-image:url('images/anubis-expedition-shop.webp?v=1'),url('images/bookshop-background.webp');background-position:center;background-size:100% 100%}
#expeditionShop .shop-stage:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(0deg,#24110d55,transparent 28%)}
#expeditionShop .shop-fallback-counter{position:absolute;inset:auto 0 0;height:53%;background:linear-gradient(180deg,#81503a 0%,#aa7045 27%,#50311f 100%);border-top:18px solid #bb8752;box-shadow:0 -8px 20px #30221b;opacity:.92;pointer-events:none}
#expeditionShop .shop-fallback-merchant{position:absolute;left:41%;top:4%;height:62%;width:23%;filter:drop-shadow(0 8px 5px #29171255);pointer-events:none}
#expeditionShop .has-illustration .shop-fallback-counter,#expeditionShop .has-illustration .shop-fallback-merchant,#expeditionShop .has-illustration .shop-emoji{display:none}
#expeditionShop .shop-item{position:absolute;z-index:3;left:var(--x);top:var(--y);transform:translate(-50%,-50%);width:12.8%;height:20%;border:3px solid transparent;border-radius:16px;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:1px 1px 4px;color:#34251f;transition:background .15s,box-shadow .15s,opacity .2s}
#expeditionShop .shop-emoji{font-size:clamp(35px,4.4vw,75px);line-height:1.18;filter:drop-shadow(0 4px 3px #24121d8a);margin:auto 0 3px}
#expeditionShop .shop-name{font:bold clamp(10px,1.1vw,17px)/1.15 Georgia,serif;background:#fae7c7ec;border:2px solid #a77c47;border-radius:7px;padding:3px 5px;box-shadow:0 3px 4px #23130c7a}
#expeditionShop .shop-item:hover,#expeditionShop .shop-item:focus-visible{border-color:#ffe5a0;background:#ffe1a63b;box-shadow:0 0 18px #ffdb8f9c}
#expeditionShop .shop-item.packed{opacity:.38;filter:grayscale(.6)}
#expeditionShop .shop-item.packed .shop-name:after{content:" ✓";color:#276344}
#expeditionShop .shop-bottom{max-width:1250px;margin:0 auto;padding:12px clamp(10px,2vw,23px);background:#f7e6c6;border:4px ridge #b4925e;border-top:0;border-radius:0 0 16px 16px}
#expeditionShop .shop-progress{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between;font-size:clamp(16px,1.6vw,21px)}
#expeditionShop .shop-progress strong{color:#6c4337}
#expeditionShop .shop-speech{margin:10px 0;padding:12px 16px;border-radius:14px;background:#fff9e9;border:2px solid #cea46d;min-height:75px;font-size:clamp(16px,1.7vw,21px)}
#expeditionShop .shop-buttons{display:flex;gap:9px;flex-wrap:wrap;margin-top:9px}
#expeditionShop .shop-buttons button:first-child{background:#426c65;color:#fff1ce}
#expeditionShop .shop-bag{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-height:59px;padding-top:10px;border-top:1px dashed #b99b74}
#expeditionShop .shop-bag button{border:2px solid #b99a68;border-radius:10px;background:#fff8e9;padding:7px 9px;min-height:42px;font-size:16px}
#expeditionShop .shop-bag button:hover{background:#f4dfc4}
#expeditionShop .shop-result{margin:10px 0 0;padding:12px;border:3px solid #a78759;border-radius:14px;background:#fff8df;font-size:clamp(17px,1.8vw,23px)}
#expeditionShop .shop-result button{display:block;margin-top:10px;padding:10px 14px;border:2px solid #b9965f;border-radius:10px;background:#315e5d;color:#fff4d5;font-weight:bold}
@media(max-width:760px){#expeditionShop .shop-scroll{overflow-x:auto;border-radius:12px;scrollbar-color:#b89762 #4c3342}#expeditionGate{left:43%;top:3%;min-width:22%;max-width:25%;border-width:2px;font-size:11px;padding:5px}#expeditionShop .shop-emoji{font-size:40px}#expeditionShop .shop-item{width:13.5%;height:21%}#expeditionShop .shop-name{font-size:11px}#expeditionShop .shop-nav button{min-height:44px}}
@media(prefers-reduced-motion:reduce){#expeditionShop *{transition:none!important}}
`;
document.head.append(style);
root.innerHTML=String.raw`<div class="shop-nav"><button type="button" id="shopExit">← Дубовый квартал</button><strong>🏺 Зал экспедиций · Анубис</strong></div>
<div class="shop-frame shop-scroll"><div class="shop-stage" id="shopStage" aria-label="Лавка экспедиционных припасов Анубиса">
<div class="shop-fallback-merchant">${svgMerchant}</div><div class="shop-fallback-counter"></div>
<div id="shopItems"></div></div></div>
<div class="shop-bottom"><div class="shop-progress"><strong>Рюкзак для экспедиции</strong><span id="shopCount" aria-live="polite">0 из 6</span></div>
<div class="shop-speech" aria-live="polite"><strong id="shopSpeaker">Анубис:</strong> <span id="shopSpeech">Лада, впереди большой путь. Рюкзак не должен быть слишком тяжёлым. Выбирай только самое необходимое — и объясняй почему!</span></div>
<div class="shop-buttons" id="shopDecision" hidden><button type="button" id="shopTake">🎒 В рюкзак</button><button type="button" id="shopLeave">Оставить на прилавке</button></div>
<div class="shop-bag" id="shopBag" aria-label="Предметы в рюкзаке"></div>
<div class="shop-result" id="shopResult" hidden><strong>🎉 Рюкзак готов!</strong><div>Компас, карта, тёплая одежда, вода, фонарь и крепкие ботинки уже внутри. Можно отправляться в экспедицию!</div><button type="button" id="shopBackFinished">Вернуться на карту квартала</button></div>
<div class="shop-buttons"><button type="button" id="shopRestart">↻ Собрать рюкзак заново</button></div></div>`;
const $=id=>document.getElementById(id);
const items=$("shopItems"),speaker=$("shopSpeaker"),speech=$("shopSpeech"),decision=$("shopDecision"),bag=$("shopBag"),result=$("shopResult");
for(const g of goods){
 const b=document.createElement("button");
 b.type="button";b.id="shop-good-"+g.id;b.className="shop-item";
 b.style.setProperty("--x",g.x+"%");b.style.setProperty("--y",g.y+"%");
 b.setAttribute("aria-label","Рассмотреть: "+g.name);
 const emoji=document.createElement("span");emoji.className="shop-emoji";emoji.textContent=g.icon;
 const label=document.createElement("span");label.className="shop-name";label.textContent=g.name;
 b.append(emoji,label);items.append(b);
 b.addEventListener("click",()=>inspect(g.id));
}
const picture=new Image();
picture.onload=()=>{$("shopStage").classList.add("has-illustration")};
picture.src="images/anubis-expedition-shop.webp?v=1";
function say(title,msg){speaker.textContent=title;speech.textContent=msg;}
function paint(){
 $("shopCount").textContent=selected.length+" из 6 · нажми на вещь в рюкзаке, чтобы вернуть";
 for(const g of goods){
  const b=$("shop-good-"+g.id);const picked=selected.includes(g.id);
  b.classList.toggle("packed",picked);b.setAttribute("aria-pressed",String(picked));
 }
 bag.replaceChildren();
 const label=document.createElement("strong");label.textContent="🎒 Взяли: ";bag.append(label);
 if(!selected.length){const none=document.createElement("span");none.textContent="пока пусто";bag.append(none)}
 for(const id of selected){
  const g=goods.find(x=>x.id===id),b=document.createElement("button");
  b.type="button";b.id="shop-bag-"+id;
  b.textContent=g.icon+" "+g.name+" ×";b.setAttribute("aria-label","Вернуть на прилавок: "+g.name);
  b.addEventListener("click",()=>remove(id));bag.append(b);
 }
 finished=selected.length===6&&required.every(id=>selected.includes(id));
 result.hidden=!finished;
 if(finished){window.TivvigRegistry?.unlockReward("tivvig_reward_expedition_supplies_v1");decision.hidden=true;focusId=null;say("Анубис:","Отлично! Ты выбрала всё необходимое. Почему мы не взяли фотографию слона?");}
 else if(selected.length===6){say("Анубис:","Рюкзак заполнен, но всё ли в нём пригодится? Может быть, стоит заменить что-то?");}
}
function inspect(id){
 if(finished)return;
 const g=goods.find(g=>g.id===id);if(!g)return;
 if(selected.includes(id)){say("Анубис:",g.name+" уже в рюкзаке. Нажми на неё в списке ниже, если хочешь вернуть.");decision.hidden=true;focusId=null;return;}
 focusId=id;decision.hidden=false;
 say("Анубис спрашивает:",g.q);
}
function take(){
 if(!focusId||finished)return;
 const g=goods.find(x=>x.id===focusId);if(!g)return;
 if(!selected.includes(g.id)){
  if(selected.length>=6){decision.hidden=true;focusId=null;say("Анубис:","Мест больше нет! Сначала верни что-нибудь на прилавок.");return;}
  selected.push(g.id);
 }
 focusId=null;decision.hidden=true;paint();
 if(!finished&&selected.length<6)say("Анубис:","Хорошо! А что ещё понадобится в дороге?");
}
function leave(){if(!focusId)return;focusId=null;decision.hidden=true;say("Анубис:","Оставим здесь! А чем этот предмет был бы полезен в другой ситуации?");}
function remove(id){
 if(!selected.includes(id))return;
 selected=selected.filter(x=>x!==id);focusId=null;decision.hidden=true;paint();
 say("Анубис:","Вернули предмет на прилавок. В рюкзаке снова есть место!");
}
function enter(){document.body.classList.add("expedition-open");document.getElementById("oakMapMain").hidden=true;root.hidden=false;document.body.scrollTop=0;window.scrollTo(0,0);}
function exit(){document.body.classList.remove("expedition-open");root.hidden=true;document.getElementById("oakMapMain").hidden=false;window.scrollTo(0,0);}
gate.addEventListener("click",enter);
$("shopExit").addEventListener("click",exit);
$("shopBackFinished").addEventListener("click",exit);
$("shopTake").addEventListener("click",take);
$("shopLeave").addEventListener("click",leave);
$("shopRestart").addEventListener("click",()=>{
 selected=[];focusId=null;finished=false;decision.hidden=true;paint();
 say("Анубис:","Начинаем заново! Какие вещи ты считаешь необходимыми для экспедиции?");
});
paint();
window.TivvigExpeditionShopDebug=Object.freeze({selection:()=>[...selected],completed:()=>finished,required:[...required]});
})();