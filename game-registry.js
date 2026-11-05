/* Единый реестр Тиввига. Новую игру регистрируем ЗДЕСЬ. */
(()=>{
"use strict";
const pages=[{"path":"index.html","title":"Карта Тиввига","menuLabel":"🗺️ Карта"},{"path":"vulkan-labirint.html","title":"Лабиринт Эмпедокла","menuLabel":"🪙 Лабиринт"},{"path":"vulkan-empedokla.html","title":"Прыжки в вулкан","menuLabel":"🌋 Вулкан"},{"path":"vulkan-slogi.html","title":"Кузница слогов","menuLabel":"🔤 Слоги"},{"path":"vulkan-kuznica.html","title":"Поиск предметов","menuLabel":"🛠️ Кузница"},{"path":"vulkan-hydra.html","title":"Гидра и буквы","menuLabel":"🐉 Гидра"},{"path":"michael-jackson-jungle.html","title":"Джунгли: подруги","menuLabel":"🌺 Подруги"},{"path":"michael-jackson-merman.html","title":"Спасение русала","menuLabel":"🌊 Русал"},{"path":"michael-jackson-vampire.html","title":"Побег от вампира","menuLabel":"🦇 Вампир"},{"path":"ladaburg-baby.html","title":"Ладабург: десять чудес","menuLabel":"🏰 Ладабург","entry":true,"region":"ladaburg"},{"path":"wardrobe.html","title":"Наряды Лады","menuLabel":"♛ Наряды"},{"path":"collection.html","title":"Коллекция наград","menuLabel":"🏅 Коллекция"},{"path":"igry.html","title":"Другие игры","menuLabel":"🧩 Другие игры"}];
const rewards=[{"key":"tivvig_reward_maze_coins_v1","gallery":true},{"key":"tivvig_reward_empedocles_v1","gallery":true},{"key":"tivvig_reward_forge_v1","gallery":true},{"key":"tivvig_reward_sword_v1","gallery":true},{"key":"tivvig_reward_hydra_v1","gallery":true},{"key":"tivvig_reward_jungle_friends_v1","gallery":true},{"key":"tivvig_reward_merman_waterhouse_v1","gallery":true},{"key":"tivvig_reward_vampire_nosferatu_v1","gallery":true},{"key":"tivvig_outfit_mermaid_unlocked_v1","gallery":false},{"key":"tivvig_reward_ladaburg_baby_v1","gallery":true,"autoGallery":true,"id":"ladaburg-baby","title":"Малыш Ладабурга","image":"images/ladaburg-after.webp","alt":"Лада с малышом","game":"ladaburg-baby.html"}];
const byPath=Object.fromEntries(pages.map(p=>[p.path,p]));
const byReward=Object.fromEntries(rewards.map(r=>[r.key,r]));
function unlockReward(key){
 if(!Object.prototype.hasOwnProperty.call(byReward,key))return false;
 try{localStorage.setItem(key,"unlocked");}catch{}
 window.dispatchEvent(new CustomEvent("tivvig:reward-unlocked",{detail:{key}}));
 window.dispatchEvent(new Event("tivvig-inventory-changed"));
 return true;
}
window.TivvigRegistry={
 pages,rewards,byPath,byReward,allowedPages:new Set(pages.map(p=>p.path)),
 titles:Object.fromEntries(pages.map(p=>[p.path,p.title])),unlockReward
};
})();
