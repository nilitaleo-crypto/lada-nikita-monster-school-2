import {initializeApp} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInAnonymously,signOut} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {getDatabase,ref,get,set,onValue,onDisconnect,runTransaction,push,onChildAdded,query,orderByKey,limitToLast} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const config={
 apiKey:"AIzaSyDwuvmteSiDJj3oWGDOKtFdYjdwpb6NlOU",
 authDomain:"tivvig.firebaseapp.com",
 databaseURL:"https://tivvig-default-rtdb.europe-west1.firebasedatabase.app",
 projectId:"tivvig",
 appId:"1:10057036649:web:74e9bf37c05537b3f443f8"
};
const app=initializeApp(config),auth=getAuth(app),db=getDatabase(app);
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),incomingRoom=params.get("room"),isStudentInvite=params.get("role")==="student";
const allowedPages=new Set(["index.html","vulkan-labirint.html","vulkan-empedokla.html","vulkan-slogi.html","vulkan-kuznica.html","vulkan-hydra.html","collection.html","igry.html","michael-jackson-jungle.html","michael-jackson-merman.html","michael-jackson-vampire.html","wardrobe.html"]);
const titles={
 "index.html":"Карта Тиввига","vulkan-labirint.html":"Лабиринт Эмпедокла",
 "vulkan-empedokla.html":"Прыжки в вулкан","vulkan-slogi.html":"Кузница слогов",
 "vulkan-kuznica.html":"Поиск предметов","vulkan-hydra.html":"Гидра и буквы",
 "collection.html":"Коллекция наград","igry.html":"Другие игры",
"michael-jackson-jungle.html":"Джунгли: подруги","michael-jackson-merman.html":"Спасение русала","michael-jackson-vampire.html":"Побег от вампира","wardrobe.html":"Наряды Лады"
};
const validRoom=/^[A-Za-z0-9_-]{32,}$/;
let role=null,room=null,uid=null,owner=null,sessionStarted=false;
let currentPage=null,currentEpoch=null,frameReady=false,lastVersion=null,localCursorAt=0,lastProgressAt=0;
let latestHint=null,latestProgress=null,latestStudentCursor=null,latestTeacherCursor=null,latestScroll=null,studentPresence=null;
let eventBuffer=[],appliedEvents=new Set(),unsubs=[],offEvents=null,offConnect=null,connected=false;
const rewardKeys=[
 'tivvig_reward_maze_coins_v1','tivvig_reward_empedocles_v1','tivvig_reward_forge_v1',
 'tivvig_reward_sword_v1','tivvig_reward_hydra_v1','tivvig_reward_jungle_friends_v1',
 'tivvig_reward_merman_waterhouse_v1','tivvig_reward_vampire_nosferatu_v1',
 'tivvig_outfit_mermaid_unlocked_v1'
];
const rewardSet=new Set(rewardKeys),selectedKey='tivvig_outfit_selected_v1';
let remoteActionCount=0;
function pushReward(key){if(!room||!rewardSet.has(key))return;set(dbref('state/rewards/'+key),'unlocked').catch(e=>report(explain(e)))}
function pushSelected(value){if(!room||!['default','mermaid'].includes(value))return;set(dbref('state/selected'),value).catch(e=>report(explain(e)))}
window.addEventListener('storage',e=>{
 if(!sessionStarted||!room||!e.key)return;
 if(rewardSet.has(e.key)&&e.newValue==='unlocked')pushReward(e.key);
 else if(e.key===selectedKey&&['default','mermaid'].includes(e.newValue))pushSelected(e.newValue);
});
async function seedStudentState(){
 if(role!=='student')return;
 const promises=[];
 for(const key of rewardKeys){
  try{if(localStorage.getItem(key)==='unlocked')promises.push(set(dbref('state/rewards/'+key),'unlocked'))}catch(e){}
 }
 try{const outfit=localStorage.getItem(selectedKey);if(outfit==='mermaid'||outfit==='default')promises.push(set(dbref('state/selected'),outfit))}catch(e){}
 await Promise.allSettled(promises);
}
function applySharedRewards(values){
 if(!values)return;
 for(const key of rewardKeys){
  if(values[key]!=='unlocked')continue;
  try{if(localStorage.getItem(key)!=='unlocked')localStorage.setItem(key,'unlocked')}catch(e){}
 }
 sendToFrame('inventory',{kind:'rewards'});
}
function applySharedSelection(value){
 if(value!=='mermaid'&&value!=='default')return;
 try{if(localStorage.getItem(selectedKey)!==value)localStorage.setItem(selectedKey,value)}catch(e){}
 sendToFrame('inventory',{kind:'selection',value});
}

const $frame=$("mazeFrame");
function message(text,err=false){$("message").textContent=text;$("message").className=err?"error":"";}
function report(text){$("lessonMessage").textContent=text;}
function explain(e){
 console.error("Tivvig: Firebase",e);
 const code=e?.code||"";
 if(code.includes("permission-denied"))return "Firebase запретил запись или чтение. Обнови правила по файлу firebase.database.rules.json.";
 if(code.includes("unauthorized-domain"))return "Тестовый домен не добавлен в Firebase Authentication → Authorized domains.";
 if(code.includes("popup-blocked"))return "Браузер заблокировал окно Google. Разреши всплывающие окна.";
 return e?.message||"Не удалось подключиться к Firebase.";
}
function randomId(bytesCount=24){
 const a=new Uint8Array(bytesCount);crypto.getRandomValues(a);
 return btoa(String.fromCharCode(...a)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
function dbref(path){return ref(db,"rooms/"+room+(path?"/"+path:""));}
function sendToFrame(type,value){
 if(!frameReady||!$frame.contentWindow)return;
 $frame.contentWindow.postMessage({from:"tivvig-parent",type,value},location.origin);
}
function updatePresence(){
 const visible=role==="student"?"Ты подключена к занятию":studentPresence?"Лада в игре":"ожидаем Ладу";
 $("connectionStatus").textContent=(connected?"● ":"◌ Нет соединения · ")+visible+" · "+(titles[currentPage]||"Мир Тиввиг");
}
function showLesson(){
 $("entry").hidden=true;$("lesson").hidden=false;
 $("teacherControls").hidden=role!=="teacher";
 $("shareBox").hidden=role!=="teacher";
 $("studentNote").hidden=role!=="student";
 if(role==="teacher"){
  const invitation=new URL("coop.html",location.href);invitation.search="";invitation.searchParams.set("room",room);invitation.searchParams.set("role","student");
  $("inviteLink").value=invitation.href;
 }
}
function syncExistingData(){
 if(!frameReady)return;
 sendToFrame("role",role);sendToFrame("inventory",{kind:"refresh"});
 if(currentPage==="vulkan-labirint.html"){
  if(latestHint)sendToFrame("hint",latestHint);else sendToFrame("hint",{points:[]});
  if(role==="teacher"&&latestProgress)sendToFrame("progress",latestProgress);
 }
 if(role==="teacher"&&latestStudentCursor)sendToFrame("studentCursor",latestStudentCursor);
 if(role==="student"&&latestTeacherCursor)sendToFrame("teacherCursor",latestTeacherCursor);
 if(role==="teacher"&&latestScroll?.epoch===currentEpoch)sendToFrame("scroll",latestScroll);
}
function applyEvent(e){
 if(!frameReady||!e||appliedEvents.has(e.key))return;
 appliedEvents.add(e.key);
 if(e.value?.kind==="click"&&e.value?.selector==='#tivvig-connection-check'){
  report(e.value.by===uid?'✓ Firebase подтвердил твою проверку связи.':'✓ Получен сигнал со второго устройства. Двусторонняя связь работает.');
  return;
 }
 if(e.value?.kind==="click"&&e.value?.selector&&currentPage!=="vulkan-labirint.html"){
  sendToFrame("click",{selector:e.value.selector});
 }
}
function frameIsReady(){
 if(!sessionStarted||!currentPage||frameReady)return;
 frameReady=true;syncExistingData();
 for(const item of eventBuffer)applyEvent(item);
}
function startPage(path,epoch){
 if(!allowedPages.has(path)||typeof epoch!=="string"||epoch.length<12)return;
 if(path===currentPage&&epoch===currentEpoch)return;
 currentPage=path;currentEpoch=epoch;frameReady=false;
 eventBuffer=[];appliedEvents.clear();
 if(offEvents){offEvents();offEvents=null;}
 $("sessionTitle").textContent=titles[path]||"Мир Тиввиг";
 $("pageSelect").value=path;
 $("clearHint").hidden=path!=="vulkan-labirint.html";
 $("resetGame").hidden=path!=="vulkan-labirint.html";
 updatePresence();
 const url=new URL(path,location.href);url.searchParams.set("coop","1");url.searchParams.set("role",role);url.searchParams.set("seed",epoch);
 $frame.src=url.href;
 offEvents=onChildAdded(query(dbref("actions/"+epoch),orderByKey(),limitToLast(160)),snapshot=>{
   const action={key:snapshot.key,value:snapshot.val()};
   eventBuffer.push(action);
   applyEvent(action);
 },e=>report(explain(e)));
}
async function navigate(path){
 if(!allowedPages.has(path)||!room)return;
 try{
  await set(dbref("page"),{path,epoch:randomId(12),by:uid,at:Date.now()});
 }catch(e){report(explain(e));}
}
function observe(path,fn){
 const unsub=onValue(dbref(path),s=>fn(s.val()),e=>report(explain(e)));
 unsubs.push(unsub);
}
function watchRoom(){
 offConnect=onValue(ref(db,'.info/connected'),s=>{connected=s.val()===true;updatePresence();});
 observe("state/rewards",applySharedRewards);
 observe("state/selected",applySharedSelection);
 observe("page",p=>{if(p&&allowedPages.has(p.path))startPage(p.path,p.epoch);else report("Не удалось открыть страницу занятия.");});
 observe("studentPresence",p=>{studentPresence=p;updatePresence();});
 observe("progress",p=>{latestProgress=p;if(role==="teacher"&&currentPage==="vulkan-labirint.html")sendToFrame("progress",p);});
 observe("hint",p=>{latestHint=p;if(currentPage==="vulkan-labirint.html")sendToFrame("hint",p||{points:[]});});
 observe("studentCursor",p=>{latestStudentCursor=p;if(role==="teacher")sendToFrame("studentCursor",p);});
 observe("teacherCursor",p=>{latestTeacherCursor=p;if(role==="student")sendToFrame("teacherCursor",p);});
 observe("viewport",p=>{latestScroll=p;if(role==="teacher"&&p?.epoch===currentEpoch)sendToFrame("scroll",p);});
 observe("resetVersion",v=>{
   if(lastVersion!==null&&v!==null&&v!==lastVersion&&currentPage==="vulkan-labirint.html")sendToFrame("reset",true);
   lastVersion=v;
 });
 if(role==="student"){
  onValue(ref(db,".info/connected"),async s=>{
   if(s.val()!==true)return;
   try{
    const presence=dbref("studentPresence");
    await onDisconnect(presence).remove();
    await set(presence,{uid,at:Date.now()});
   }catch(e){report(explain(e));}
  });
 }
}
function initClient(){
 showLesson();sessionStarted=true;
 $frame.addEventListener("load",frameIsReady);
 watchRoom();
}
const teacher=$("teacherStart"),student=$("studentStart");
if(isStudentInvite&&validRoom.test(incomingRoom)){
 $("welcome").textContent="Лада, Никита приглашает тебя в экспедицию. Нажми кнопку и вы вместе увидите карту Тиввига!";
 teacher.hidden=true;student.hidden=false;
}else if(incomingRoom){
 message("Ссылка-приглашение некорректна. Попроси преподавателя прислать новую.",true);
}
teacher.addEventListener("click",async()=>{
 teacher.disabled=true;message("Входим через Google…");
 try{
  const provider=new GoogleAuthProvider(),{user}=await signInWithPopup(auth,provider);
  if(user.isAnonymous||!user.providerData.some(p=>p.providerId==="google.com"))throw new Error("Требуется вход через Google.");
  role="teacher";uid=user.uid;owner=uid;room=randomId();
  await set(dbref(""),{owner:uid,createdAt:Date.now(),resetVersion:0,page:{path:"index.html",epoch:randomId(12),by:uid,at:Date.now()}});
  initClient();
 }catch(e){message(explain(e),true);}
 finally{teacher.disabled=false;}
});
student.addEventListener("click",async()=>{
 student.disabled=true;message("Подключаемся к экспедиции…");
 try{
  if(!isStudentInvite||!validRoom.test(incomingRoom))throw new Error("Неверная ссылка-приглашение.");
  if(auth.currentUser&&!auth.currentUser.isAnonymous)await signOut(auth);
  const {user}=auth.currentUser?.isAnonymous?{user:auth.currentUser}:await signInAnonymously(auth);
  role="student";uid=user.uid;room=incomingRoom;
  const initial=await get(dbref(""));
  if(!initial.exists())throw new Error("Комната не найдена. Попроси преподавателя создать новую.");
  owner=initial.child("owner").val();
  initClient();
  seedStudentState().catch(e=>report(explain(e)));
 }catch(e){message(explain(e),true);}
 finally{student.disabled=false;}
});
$("pageSelect").addEventListener("change",e=>{if(role==="teacher")navigate(e.target.value);});
$("copyInvite").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText($("inviteLink").value);$("copyInvite").textContent="Скопировано ✓";}
 catch{ $("inviteLink").select();report("Выделенную ссылку можно скопировать вручную."); }
});
$("clearHint").addEventListener("click",()=>{
 if(role==="teacher"&&currentPage==="vulkan-labirint.html")set(dbref("hint"),{points:[]}).catch(e=>report(explain(e)));
});
$("resetGame").addEventListener("click",()=>{
 if(role==="teacher"&&currentPage==="vulkan-labirint.html")
  runTransaction(dbref("resetVersion"),v=>(Number.isInteger(v)?v:0)+1).catch(e=>report(explain(e)));
});
const validPoint=p=>p&&typeof p.x==="number"&&typeof p.y==="number"&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
window.addEventListener("message",e=>{
 if(!sessionStarted||!role||!room||e.origin!==location.origin||e.source!==$frame.contentWindow)return;
 const data=e.data||{};
 if(data.from!=="tivvig-world"&&data.from!=="tivvig-maze")return;
 if(data.from==="tivvig-world"&&data.page!==currentPage)return;
 const type=data.type,value=data.value;
 if(type==="ready"){frameIsReady();return;}
 if(type==="actionApplied"){
  remoteActionCount++;
  report('✓ Применено действий: '+remoteActionCount+' · оба устройства получают их через Firebase');
  return;
 }
 if(type==="actionMissing"){
  report('⚠ Не удалось повторить действие на этой странице. Вернись на карту и снова открой игру.');
  return;
 }
 if(type==="navigate"&&allowedPages.has(value)){navigate(value);return;}
 if(type==="click"&&currentPage!=="vulkan-labirint.html"&&typeof value?.selector==="string"&&value.selector.length<450){
  const action=push(dbref("actions/"+currentEpoch));
  set(action,{by:uid,kind:"click",selector:value.selector,at:Date.now()}).catch(e=>{
   report('⚠ Firebase не передал нажатие. Оно сработает только здесь: '+explain(e));
   sendToFrame("click",{selector:value.selector});
  });
 }
 if(type==="scroll"&&role==="student"&&Number.isFinite(value?.y)){
  set(dbref("viewport"),{y:Math.max(0,Math.min(1,value.y)),epoch:currentEpoch,at:Date.now()}).catch(e=>report(explain(e)));
 }
 if(type==="progress"&&role==="student"&&currentPage==="vulkan-labirint.html"){
  const v=value||{},now=Date.now();
  if(now-lastProgressAt<110&&!v.won)return;
  if(!Number.isInteger(v.index)||!Number.isInteger(v.total)||v.total<1||v.total>5000||v.index<0||v.index>=v.total)return;
  lastProgressAt=now;
  set(dbref("progress"),{index:v.index,total:v.total,coinMask:Math.max(0,Math.min(127,Number(v.coinMask)||0)),won:v.won===true}).catch(e=>report(explain(e)));
 }
 if(type==="cursor"&&validPoint(value)){
  const now=Date.now();if(value.active&&now-localCursorAt<95)return;localCursorAt=now;
  set(dbref(role==="teacher"?"teacherCursor":"studentCursor"),{x:value.x,y:value.y,active:value.active===true,at:now}).catch(e=>report(explain(e)));
 }
 if(type==="hint"&&role==="teacher"&&currentPage==="vulkan-labirint.html"&&Array.isArray(value?.points)){
  const points=value.points.filter(validPoint).slice(0,150).map(p=>({x:p.x,y:p.y}));
  set(dbref("hint"),{points}).catch(e=>report(explain(e)));
 }
});

$("checkSync").addEventListener("click",()=>{
 if(!sessionStarted||!currentEpoch||!room){report("Сначала подключись к комнате.");return;}
 const action=push(dbref("actions/"+currentEpoch));
 report("Проверяем запись в Firebase…");
 set(action,{by:uid,kind:"click",selector:"#tivvig-connection-check",at:Date.now()})
 .catch(e=>report("Проверка не прошла: "+explain(e)));
});
