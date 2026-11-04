(()=>{
"use strict";
const q=new URLSearchParams(location.search);
if(q.get("coop")!=="1"||window.parent===window)return;
const allowed=new Set(["index.html","vulkan-labirint.html","vulkan-empedokla.html","vulkan-slogi.html","vulkan-kuznica.html","vulkan-hydra.html","collection.html","igry.html"]);
const current=location.pathname.split("/").pop()||"index.html";
if(!allowed.has(current))return;
const isMaze=current==="vulkan-labirint.html";
let role=q.get("role")==="teacher"?"teacher":"student",replaying=false,lastCursor=0,lastScroll=0;
const tag="[data-tivvig-online]";
const send=(type,value)=>window.parent.postMessage({from:"tivvig-world",type,value,page:current},location.origin);
function pathOf(el){
 if(el.id && /^[a-zA-Z][\w:-]*$/.test(el.id))return "#"+el.id;
 const parts=[];
 for(let cursor=el;cursor&&cursor!==document.body;cursor=cursor.parentElement){
  const parent=cursor.parentElement;if(!parent)return "";
  let count=0,index=0;
  for(const child of parent.children)if(child.tagName===cursor.tagName){count++;if(child===cursor)index=count;}
  parts.unshift(cursor.tagName.toLowerCase()+":nth-of-type("+index+")");
  if(parent.id&&/^[a-zA-Z][\w:-]*$/.test(parent.id)){parts.unshift("#"+parent.id);break;}
 }
 return parts.join(" > ");
}
function elementFor(path){
 if(typeof path!=="string"||path.length>450)return null;
 try{return document.querySelector(path);}catch{return null;}
}
function routeFor(link){
 try{
  const url=new URL(link.getAttribute("href"),location.href);
  if(url.origin!==location.origin)return null;
  const file=url.pathname.split("/").pop()||"index.html";
  if(!allowed.has(file))return null;
  if(url.pathname.substring(0,url.pathname.lastIndexOf("/"))!==location.pathname.substring(0,location.pathname.lastIndexOf("/")))return null;
  return file;
 }catch{return null;}
}
document.addEventListener("click",e=>{
 if(replaying||!e.isTrusted)return;
 const anchor=e.target.closest("a[href]");
 if(anchor){
  const page=routeFor(anchor);
  if(page){e.preventDefault();send("navigate",page);}
  return;
 }
 if(isMaze)return;
 const target=e.target.closest("button,[role=button],[data-open-reward],#rewardImg,#scene,#reward,#win,#viewer,#lightbox,#rewardReveal");
 if(!target || target.matches("button[disabled]"))return;
 const selector=pathOf(target);
 if(selector && selector.length<=450)send("click",{selector});
},true);
document.addEventListener("pointermove",e=>{
 if(isMaze||!e.isTrusted)return;
 const now=Date.now();if(now-lastCursor<125)return;lastCursor=now;
 send("cursor",{x:Math.max(0,Math.min(1,e.clientX/window.innerWidth)),y:Math.max(0,Math.min(1,e.clientY/window.innerHeight)),active:true});
},{passive:true});
document.addEventListener("pointerup",e=>{
 if(isMaze||!e.isTrusted)return;
 send("cursor",{x:Math.max(0,Math.min(1,e.clientX/window.innerWidth)),y:Math.max(0,Math.min(1,e.clientY/window.innerHeight)),active:false});
},{passive:true});
window.addEventListener("scroll",()=>{
 if(isMaze||role!=="student"||replaying)return;
 const now=Date.now();if(now-lastScroll<300)return;lastScroll=now;
 const max=document.documentElement.scrollHeight-innerHeight;
 send("scroll",{y:max>0?Math.max(0,Math.min(1,scrollY/max)):0});
},{passive:true});
const pointer=document.createElement("div");
pointer.setAttribute("data-tivvig-online","pointer");
pointer.style.cssText="position:fixed;display:none;width:19px;height:19px;border:2px solid white;border-radius:50%;z-index:2147483645;background:#b72e50;box-shadow:0 0 0 3px #4d2c37aa;pointer-events:none;transform:translate(-50%,-50%)";
if(!isMaze)document.body.append(pointer);
let cursorTimeout=null;
function showRemoteCursor(value){
 if(isMaze||!value||!Number.isFinite(value.x)||!Number.isFinite(value.y))return;
 if(!value.active){pointer.style.display="none";return;}
 pointer.style.display="block";
 pointer.style.background=role==="teacher"?"#388bbb":"#b72e50";
 pointer.style.left=(value.x*100)+"vw";pointer.style.top=(value.y*100)+"vh";
 clearTimeout(cursorTimeout);
 cursorTimeout=setTimeout(()=>{pointer.style.display="none"},2500);
}
window.addEventListener("message",e=>{
 if(e.source!==window.parent||e.origin!==location.origin||e.data?.from!=="tivvig-parent")return;
 const {type,value}=e.data;
 if(type==="role"){role=value==="teacher"?"teacher":"student";return;}
 if(type==="teacherCursor"||type==="studentCursor"){showRemoteCursor(value);return;}
 if(type==="scroll"&&role==="teacher"&&Number.isFinite(value?.y)){
  replaying=true;scrollTo(0,Math.max(0,Math.min(1,value.y))*(document.documentElement.scrollHeight-innerHeight));replaying=false;return;
 }
 if(type==="click"&&!isMaze){
  const el=elementFor(value?.selector);if(!el)return;
  replaying=true;
  try{el.click();}finally{replaying=false;}
 }
});
send("ready",{page:current});
})();