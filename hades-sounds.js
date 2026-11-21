/* Tivvig / Underworld: local sound signals for every Hades scene.
 * WAV sample playback first (same iOS strategy as the tested Vulcan forge);
 * unlocked WebAudio oscillator as fallback. No remote autoplay or sound assets.
 */
(()=>{
 'use strict';
 if(window.TivvigHadesSounds)return;
 const file=location.pathname.split('/').pop()||'';
 if(!/^(?:hades-(gate|cerberus|charon|angler-chase|hypnos|hecate|final)|egypt-(?:apophis|pomegranate|nile-mystery))\.html$/.test(file))return;
 const coop=new URLSearchParams(location.search).get('coop')==='1';
 const reduce=!!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
 const T=window.AudioContext||window.webkitAudioContext;
 let context=null,seeded=false,clips=null,ready=false,unlocked=false;
 let last=0;
 const notes={
  tap:[510,660],success:[660,880],wrong:[290,220],finish:[620,830,1040]
 };
 function wav(kind){
  const rate=22050,tones=notes[kind]||notes.tap,n=Math.round(rate*(kind==='finish'?.41:.23));
  const bytes=new Uint8Array(44+2*n),view=new DataView(bytes.buffer);
  const put=(i,s)=>{for(let j=0;j<s.length;j++)bytes[i+j]=s.charCodeAt(j)};
  put(0,'RIFF');view.setUint32(4,bytes.length-8,true);put(8,'WAVE');put(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);
  view.setUint16(34,16,true);put(36,'data');view.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){
   const t=i/rate,step=Math.min(tones.length-1,Math.floor(t/(n/rate/tones.length)));
   const hz=tones[step],decay=Math.exp(-8*t),attack=Math.min(1,t*110),phase=2*Math.PI*hz*t;
   const sample=(Math.sin(phase)*.63+Math.sin(2*phase)*.09)*attack*decay;
   view.setInt16(44+i*2,Math.max(-32768,Math.min(32767,Math.round(sample*12000))),true);
  }
  let raw='';
  for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
  return 'data:audio/wav;base64,'+btoa(raw);
 }
 function getClips(){
  if(clips)return clips;
  clips={};
  try{
   if(typeof Audio!=='function'||typeof btoa!=='function')return clips;
   for(const kind of Object.keys(notes)){
    const clip=new Audio(wav(kind));clip.preload='auto';clip.volume=.62;
    clip.setAttribute?.('playsinline','');clips[kind]=clip;
   }
  }catch(err){console.warn('Hades sound samples unavailable',err);clips={}}
  return clips;
 }
 function prime(){
  if(!T)return;
  try{
   if(!context)context=new T();
   if(!seeded){
    const osc=context.createOscillator(),gain=context.createGain();
    gain.gain.value=0;osc.connect(gain);gain.connect(context.destination);
    osc.start();osc.stop(context.currentTime+.014);seeded=true;
   }
   if(context.state==='suspended')context.resume().catch(()=>{});
  }catch(e){}
 }
 function fallback(kind){
  try{
   prime();
   if(!context||context.state==='closed')return;
   const tones=notes[kind]||notes.tap;
   const duration=kind==='finish'?.43:.24;
   const at=context.currentTime+.01;
   tones.forEach((hz,i)=>{
    const osc=context.createOscillator(),gain=context.createGain();
    const start=at+(i*duration/tones.length),stop=start+duration/tones.length;
    osc.type='sine';osc.frequency.setValueAtTime(hz,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(.11,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,stop);
    osc.connect(gain);gain.connect(context.destination);
    osc.start(start);osc.stop(stop+.01);
   });
  }catch(e){}
 }
 function play(kind='tap',test=false){
  if(document.hidden&&!test)return;
  if(!Object.prototype.hasOwnProperty.call(notes,kind))kind='tap';
  const player=getClips()[kind];
  if(!player){fallback(kind);return Promise.resolve(false)}
  try{
   player.pause();player.currentTime=0;
   const response=player.play();
   if(response?.then){
    return response.then(()=>{ready=true;paint();return true}).catch(()=>{
     fallback(kind);paint();return false
    });
   }
   ready=true;paint();return Promise.resolve(true);
  }catch(e){fallback(kind);paint();return Promise.resolve(false)}
 }
 function paint(){
  const button=document.getElementById('hadesLocalSound');
  if(!button)return;
  button.textContent=ready?'🔊':'🔈';
  button.setAttribute('aria-pressed',String(ready));
  button.title=ready?'Проверить звук на этом устройстве':'Нажми здесь, чтобы проверить звук на этом устройстве';
 }
 function addTestButton(){
  const header=document.querySelector('header');
  if(!header||document.getElementById('hadesLocalSound'))return;
  const button=document.createElement('button');button.type='button';
  button.id='hadesLocalSound';button.dataset.tivvigLocalAudio='1';
  button.textContent='🔈';button.setAttribute('aria-label','Проверить звук на этом устройстве');
  button.setAttribute('aria-pressed','false');
  button.style.cssText='flex:0 0 42px;width:42px;height:42px;min-width:42px;min-height:42px;display:inline-grid;place-items:center;border:1px solid #b0c7d37d;border-radius:10px;background:#203348d9;color:#f5f3e8;font:19px system-ui;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;position:relative;z-index:20;padding:0';
  // A single, unobtrusive sound check on every scene, outside the game surface.
  header.insertBefore(button,header.lastElementChild);
  button.addEventListener('click',event=>{
   event.stopPropagation();
   prime();getClips();unlocked=true;
   void play('success',true).then(played=>{
    button.setAttribute('aria-label',played?
     'Звук воспроизводится; если не слышно, проверь громкость и беззвучный режим':
     'Проверь громкость; если не слышно, нажми ещё раз');
    button.title=played?'Услышал мелодию? Если нет — проверь громкость.':'Коснись ещё раз для проверки звука';
   });
  });
  paint();
 }
 function isGameClick(target){
  const button=target.closest?.('button,[role="button"]');
  if(!button||button.disabled||button.closest('[hidden]')||button.dataset.tivvigLocalAudio||button.dataset.tivvigSound==='manual')return null;
  if(button.closest('.finale'))return null;
  if(file==='hades-final.html'){
    const stage=document.getElementById('stage')?.dataset.stage;
    if(stage==='1'||stage==='4')return null; // Native hammer WAVs handle the music stages.
  }
  return button;
 }
 function onClick(event){
  if(!isGameClick(event.target))return;
  // In co-op Firebase replays the authoritative action on both devices.
  // Sound the replay once (untrusted), not the intercepted original click.
  if(coop && event.isTrusted && window.parent!==window)return;
  const now=performance.now();
  if(now-last<55)return;last=now;
  let kind='tap';const target=event.target.closest('button,[role="button"]');
  if(target.matches('[data-answer]')&&target.classList.contains('wrong'))kind='wrong';
  if(/(?:Next|Finish|Claim|Gift|done|win)/i.test(target.id))kind='success';
  void play(kind);
 }
 window.addEventListener('pointerdown',()=>{unlocked=true;prime()},{passive:true});
 window.addEventListener('touchend',()=>{unlocked=true;prime()},{passive:true});
 window.addEventListener('keydown',()=>{unlocked=true;prime()});
 document.addEventListener('click',onClick);
 window.addEventListener('pageshow',()=>{ready=false;paint()});
 window.addEventListener('pagehide',()=>{try{Object.values(clips||{}).forEach(a=>a.pause())}catch(e){}});
 window.TivvigHadesSounds=Object.freeze({prime,play,getClips,state:()=>({ready,unlocked,seeded,context:context?.state||'none',sampleCount:Object.keys(clips||{}).length,coop,reduce})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addTestButton,{once:true});
 else addTestButton();
})();
