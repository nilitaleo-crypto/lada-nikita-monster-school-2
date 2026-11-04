(()=>{
"use strict";
const query=new URLSearchParams(location.search);
if(query.get("coop")!=="1"||window.parent===window)return;
const role=query.get("role")==="teacher"?"teacher":"student";
const wrap=document.getElementById("mazeWrap"),img=document.getElementById("mazeImg"),input=document.getElementById("trailCanvas");
if(!wrap||!img||!input)return;
const overlay=document.createElement("canvas");
overlay.id="coopOverlay";
overlay.setAttribute("aria-label",role==="teacher"?"Рисовать подсказки":"Подсказки преподавателя");
overlay.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:8;touch-action:none;pointer-events:"+(role==="teacher"?"auto":"none");
wrap.append(overlay);
const ctx=overlay.getContext("2d");
let hints=[],pointers={studentCursor:null,teacherCursor:null},drawing=false,lastSent=0,lastCursor=0;
function send(type,value){window.parent.postMessage({from:"tivvig-maze",type,value},location.origin);}
function normalized(e){
 const r=overlay.getBoundingClientRect();
 return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
}
function paint(){
 const r=overlay.getBoundingClientRect(),w=r.width,h=r.height;
 ctx.clearRect(0,0,w,h);
 if(hints.length){
   ctx.beginPath();hints.forEach((p,i)=>{if(i)ctx.lineTo(p.x*w,p.y*h);else ctx.moveTo(p.x*w,p.y*h)});
   ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=Math.max(4,w*.006);ctx.strokeStyle="#b72e50";ctx.shadowColor="#ffe6b0";ctx.shadowBlur=5;ctx.stroke();ctx.shadowBlur=0;
 }
 for(const [name,p] of Object.entries(pointers)){
   if(!p||!p.active||Date.now()-(p.at||0)>30000)continue;
   ctx.beginPath();ctx.arc(p.x*w,p.y*h,9,0,2*Math.PI);
   ctx.fillStyle=name==="teacherCursor"?"#b72e50":"#3c95c9";ctx.fill();
   ctx.lineWidth=2;ctx.strokeStyle="#fff";ctx.stroke();
 }
}
function resize(){
 const r=img.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 overlay.width=Math.max(1,Math.round(r.width*dpr));
 overlay.height=Math.max(1,Math.round(r.height*dpr));
 overlay.style.width=r.width+"px";overlay.style.height=r.height+"px";
 ctx.setTransform(dpr,0,0,dpr,0,0);paint();
}
window.addEventListener("resize",resize);
if("ResizeObserver" in window)new ResizeObserver(resize).observe(img);
img.addEventListener("load",resize);resize();
function cursor(e,active){
 const now=Date.now();if(active&&now-lastCursor<85)return;lastCursor=now;
 const p=normalized(e);send("cursor",{...p,active});
}
if(role==="teacher"){
 input.style.pointerEvents="none";
 const reset=document.getElementById("resetBtn");
 if(reset)reset.style.display="none";
 overlay.addEventListener("pointerdown",e=>{
   e.preventDefault();drawing=true;hints=[normalized(e)];paint();cursor(e,true);
   if(overlay.setPointerCapture)overlay.setPointerCapture(e.pointerId);
   send("hint",{points:hints});
 });
 overlay.addEventListener("pointermove",e=>{
   cursor(e,true);
   if(!drawing)return;
   e.preventDefault();
   const p=normalized(e),last=hints[hints.length-1];
   if(Math.hypot(p.x-last.x,p.y-last.y)<.004)return;
   if(hints.length<150)hints.push(p);
   paint();
   const now=Date.now();if(now-lastSent>110){lastSent=now;send("hint",{points:hints});}
 });
 function finish(e){if(!drawing)return;drawing=false;send("hint",{points:hints});cursor(e,false);}
 overlay.addEventListener("pointerup",finish);overlay.addEventListener("pointercancel",finish);
}else{
 const reset=document.getElementById("resetBtn");
 if(reset)reset.style.display="none";
 input.addEventListener("pointermove",e=>cursor(e,true));
 input.addEventListener("pointerdown",e=>cursor(e,true));
 input.addEventListener("pointerup",e=>cursor(e,false));
 input.addEventListener("pointercancel",e=>cursor(e,false));
 window.addEventListener("tivvig:maze-progress",e=>{
   if(e.detail)send("progress",e.detail);
 });
}
window.addEventListener("message",e=>{
 if(e.source!==window.parent||e.origin!==location.origin||e.data?.from!=="tivvig-parent")return;
 const {type,value}=e.data;
 if(type==="hint"){
   const points=Array.isArray(value?.points)?value.points:Object.values(value?.points||{});
   hints=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,150);paint();
 }
 if(type==="progress"&&role==="teacher")window.dispatchEvent(new CustomEvent("tivvig:remote-progress",{detail:value}));
 if(type==="reset")window.dispatchEvent(new CustomEvent("tivvig:remote-reset"));
 if(type==="studentCursor"||type==="teacherCursor"){pointers[type]=value;paint();}
});
send("ready",{role});
})();