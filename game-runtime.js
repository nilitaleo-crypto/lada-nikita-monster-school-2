/* Шаблон подключения НОВЫХ игр: всегда свежий реестр, затем общий Firebase-мост.
   Добавляй <script src="game-runtime.js?v=1" defer></script> в конец HTML новой игры. */
(()=>{
 "use strict";
 const registry=document.createElement("script");
 const url=new URL("game-registry.js",location.href);
 url.searchParams.set("fresh",String(Date.now()));
 registry.src=url.href;
 registry.onload=()=>{
  window.dispatchEvent(new Event("tivvig:registry-ready"));
  const bridge=document.createElement("script");
  bridge.src="world-coop-bridge.js?v=12";
  bridge.onerror=()=>showError("Не загрузилась синхронизация игры. Проверь интернет.");
  document.body.append(bridge);
 };
 registry.onerror=()=>showError("Не удалось загрузить список игр. Проверь подключение к интернету.");
 function showError(message){
   console.error("Тиввиг:",message);
   const node=document.getElementById("gameConnection");
   if(node)node.textContent="⚠ "+message;
 }
 document.body.append(registry);
})();
