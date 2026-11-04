import {initializeApp} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,signInAnonymously,signOut} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {getDatabase,ref,set,onValue,onDisconnect,runTransaction} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const config={
 apiKey:"AIzaSyDwuvmteSiDJj3oWGDOKtFdYjdwpb6NlOU",
 authDomain:"tivvig.firebaseapp.com",
 databaseURL:"https://tivvig-default-rtdb.europe-west1.firebasedatabase.app",
 projectId:"tivvig",
 appId:"1:10057036649:web:74e9bf37c05537b3f443f8"
};
const app=initializeApp(config), auth=getAuth(app), db=getDatabase(app);
const $=id=>document.getElementById(id);
const query=new URLSearchParams(location.search), roomFromLink=query.get("room"), inviteMode=query.get("role")==="student";
const roomPattern=/^[A-Za-z0-9_-]{32,}$/;
let role=null,room=null,owner=null,sessionUnsub=null,connectedUnsub=null,lastProgress=0,lastCursor=0,frameReady=false,lastVersion=null,localUid=null,latestState=null;
const button=$("teacherStart"),joinButton=$("studentStart"),msg=$("message");
if(inviteMode && roomPattern.test(roomFromLink)){
 $("welcome").textContent="Лада, тебе прислали приглашение в экспедицию! Нажми кнопку, чтобы начать игру вместе с Никитой.";
 button.hidden=true;joinButton.hidden=false;
}else if(roomFromLink){
 msg.textContent="Ссылка-приглашение некорректна. Попроси преподавателя прислать новую.";
 msg.className="error";
}
function say(t,error=false){msg.textContent=t;msg.className=error?"error":"";}
function report(t){$("lessonMessage").textContent=t;}
function fail(e){
 console.error("Tivvig Firebase:",e);
 const code=e?.code||"";
 const help=code.includes("permission-denied")?" Доступ запрещён правилами Firebase. Установи правила из файла firebase.database.rules.json.":code.includes("unauthorized-domain")?" Проверь домен в Firebase Authentication → Authorized domains.":code.includes("popup-blocked")?" Разреши всплывающие окна для этого сайта.":"";
 return (e?.message||"Ошибка соединения")+"."+help;
}
function makeRoomId(){
 const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function sendToFrame(type,value){if(frameReady)$("mazeFrame").contentWindow.postMessage({from:"tivvig-parent",type,value},location.origin);}
function showLesson(){
 $("entry").hidden=true;$("lesson").hidden=false;
 $("shareBox").hidden=role!=="teacher";$("teacherControls").hidden=role!=="teacher";$("studentNote").hidden=role!=="student";
 if(role==="teacher"){
   const invite=new URL("coop.html",location.href);invite.search="";invite.searchParams.set("room",room);invite.searchParams.set("role","student");
   $("inviteLink").value=invite.href;
 }
 const frame=$("mazeFrame");
 frame.addEventListener("load",()=>{frameReady=true;sendToFrame("role",role);if(latestState)applyState(latestState);});
 frame.src="vulkan-labirint.html?coop=1&role="+role;
}
function applyState(v){
 latestState=v;
 $("connectionStatus").textContent="● Подключено к комнате · "+(v.studentPresence?"Лада в игре":"ожидаем Ладу");
 if(frameReady){
   if(lastVersion!==null && lastVersion!==v.resetVersion)sendToFrame("reset",true);
   lastVersion=v.resetVersion??0;
   if(v.progress && role==="teacher")sendToFrame("progress",v.progress);
   if(v.hint)sendToFrame("hint",v.hint);
   else sendToFrame("hint",{points:[]});
   if(v.studentCursor && role==="teacher")sendToFrame("studentCursor",v.studentCursor);
   if(v.teacherCursor && role==="student")sendToFrame("teacherCursor",v.teacherCursor);
 }
}
function subscribeRoom(){
 if(sessionUnsub)sessionUnsub();
 sessionUnsub=onValue(ref(db,"rooms/"+room),s=>{
   if(!s.exists()){report("Комната недоступна или была удалена.");return;}
   const v=s.val();owner=v.owner;
   if(role==="teacher" && owner!==localUid){report("У этого занятия другой преподаватель.");return;}
   applyState(v);
 },e=>{report(fail(e));$("connectionStatus").textContent="● Нет доступа к комнате";});
 if(role==="student"){
   connectedUnsub=onValue(ref(db,".info/connected"),async s=>{
     if(s.val()!==true)return;
     try{
       const path=ref(db,"rooms/"+room+"/studentPresence");
       await onDisconnect(path).remove();
       await set(path,{uid:localUid,at:Date.now()});
     }catch(e){report(fail(e));}
   });
 }
}
async function enterTeacher(){
 button.disabled=true;say("Входим через Google…");
 try{
   const provider=new GoogleAuthProvider();
   const {user}=await signInWithPopup(auth,provider);
   if(user.isAnonymous || !user.providerData.some(p=>p.providerId==="google.com"))throw new Error("Требуется вход через Google.");
   localUid=user.uid;role="teacher";room=makeRoomId();
   await set(ref(db,"rooms/"+room),{owner:user.uid,createdAt:Date.now(),resetVersion:0});
   showLesson();subscribeRoom();
 }catch(e){say(fail(e),true);}
 finally{button.disabled=false;}
}
async function enterStudent(){
 joinButton.disabled=true;say("Подключаемся к экспедиции…");
 try{
   if(!inviteMode || !roomPattern.test(roomFromLink))throw new Error("Неверная ссылка");
   if(auth.currentUser && !auth.currentUser.isAnonymous) await signOut(auth);
   const {user}=auth.currentUser?.isAnonymous?{user:auth.currentUser}:await signInAnonymously(auth);
   localUid=user.uid;role="student";room=roomFromLink;
   showLesson();subscribeRoom();
 }catch(e){say(fail(e),true);}
 finally{joinButton.disabled=false;}
}
button.addEventListener("click",enterTeacher);joinButton.addEventListener("click",enterStudent);
$("copyInvite").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText($("inviteLink").value);$("copyInvite").textContent="Скопировано ✓";}
 catch(e){$("inviteLink").select();report("Выделенная ссылка готова для копирования.");}
});
$("clearHint").addEventListener("click",()=>role==="teacher"&&set(ref(db,"rooms/"+room+"/hint"),{points:[]}).catch(e=>report(fail(e))));
$("resetGame").addEventListener("click",async()=>{
 if(role!=="teacher")return;
 try{await runTransaction(ref(db,"rooms/"+room+"/resetVersion"),n=>(Number.isInteger(n)?n:0)+1);}
 catch(e){report(fail(e));}
});
function validPoint(p){return p && typeof p.x==="number" && typeof p.y==="number" && p.x>=0 && p.x<=1 && p.y>=0 && p.y<=1;}
window.addEventListener("message",e=>{
 if(e.origin!==location.origin||e.source!==$("mazeFrame").contentWindow)return;
 const d=e.data;
 if(!d||d.from!=="tivvig-maze"||!room)return;
 if(d.type==="ready"){frameReady=true;sendToFrame("role",role);if(latestState)applyState(latestState);return;}
 if(d.type==="progress"&&role==="student"){
   const v=d.value||{},now=Date.now();
   if(now-lastProgress<110&&!v.won)return;
   if(!Number.isInteger(v.index)||!Number.isInteger(v.total)||v.index<0||v.total<1||v.total>5000||v.index>=v.total)return;
   lastProgress=now;
   set(ref(db,"rooms/"+room+"/progress"),{index:v.index,total:v.total,coinMask:Number(v.coinMask)||0,won:v.won===true}).catch(e=>report(fail(e)));
 }
 if(d.type==="cursor"&&validPoint(d.value)){
   const now=Date.now();if(now-lastCursor<90&&d.value.active)return;lastCursor=now;
   const target=role==="teacher"?"teacherCursor":"studentCursor";
   if(!["teacher","student"].includes(role))return;
   set(ref(db,"rooms/"+room+"/"+target),{x:d.value.x,y:d.value.y,active:d.value.active===true,at:now}).catch(e=>report(fail(e)));
 }
 if(d.type==="hint"&&role==="teacher"&&Array.isArray(d.value?.points)){
   const points=d.value.points.filter(validPoint).slice(0,150).map(p=>({x:p.x,y:p.y}));
   set(ref(db,"rooms/"+room+"/hint"),{points}).catch(e=>report(fail(e)));
 }
});
