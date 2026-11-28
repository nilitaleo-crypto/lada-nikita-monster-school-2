/* Тиввиг · Бегемот. Настоящая мини-экспедиция, не "три раза нажми".
 * Три механики в том же нарисованном вольере: маршрут с запасом воздуха,
 * эксперимент с кожей и задача на составление пяти пучков травы.
 * Все ходы — native buttons с постоянными ID: безопасно для Firebase co-op.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const scene=$('scene'),task=$('task'),fact=$('fact'),progress=$('progress'),controls=$('controls');
const ART='images/egypt-zoo-hippo-scene.webp';
const X=[27,39,51,63,75],Y=[60,70,80],MAX_AIR=4;
const BLOCKED=new Set(['0:2','1:1','2:3']);
const GRASS=[{x:69,y:42,n:1},{x:81,y:34,n:2},{x:91,y:56,n:3}];
const spots=[];
let phase='river',round=0,row=2,col=0,air=MAX_AIR,breaths=0,bumps=0,
    skin={sun:false,water:false},grass=new Set(),finished=false,busy=false;
let area=null,actor=null,airMeter=null,riverPrompt=null,revealTimer=0;
const count=()=>[...grass].reduce((sum,i)=>sum+GRASS[i].n,0);
const rc=(r,c)=>r+':'+c;
function el(tag,cls,parent,text){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;
 if(parent)parent.append(node);
 return node;
}
function btn(parent,id,cls,label,callback){
 const b=el('button',cls,parent);
 b.type='button';b.id=id;b.setAttribute('aria-label',label);
 b.addEventListener('click',callback);return b;
}
function locate(node,x,y){node.style.left=x+'%';node.style.top=y+'%';}
function setTask(message){task.textContent=message;}
function discovery(message){
 fact.textContent=message;fact.classList.remove('hidden');
}
function dots(){
 progress.replaceChildren();
 for(let i=0;i<3;i++)el('span','dot'+(i<round?' on':''),progress);
}
function resetStage(stageClass){
 scene.replaceChildren();area=el('div','zoo-stage hippo-world '+stageClass,scene);
 area.style.backgroundImage='url("'+ART+'")';
 area.setAttribute('role','group');area.setAttribute('aria-label','Бегемот в египетском зоопарке');
 window.TivvigZooLife?.stage(area,'hippo',round);
 scene.style.setProperty('--zoo-scene','url("'+ART+'")');
 dots();
}
function burst(x,y,kind='ripple'){
 const b=el('div','hippo-effect hippo-effect--'+kind,area);
 locate(b,x,y);
 // Decorative only; never affects game state or Firebase.
 b.addEventListener('animationend',()=>b.remove(),{once:true});
}
function showFootprints(){
 const track=el('div','hippo-track',area);
 locate(track,27,80);
 track.id='hippoTrail';
}
function updateMeter(){
 if(!airMeter)return;
 airMeter.replaceChildren();
 for(let i=0;i<MAX_AIR;i++){
  el('span','hippo-air-bubble'+(i<air?'':' is-empty'),airMeter).setAttribute('aria-hidden','true');
 }
 airMeter.setAttribute('aria-label','Запас воздуха: '+air+' из '+MAX_AIR);
 const surface=$('hippoSurface');
 if(surface){
  surface.classList.toggle('is-urgent',air===0);
  surface.disabled=air===MAX_AIR;
 }
}
function updateActor(){
 if(!actor)return;
 locate(actor,X[col],Y[row]);
 actor.style.setProperty('--hippo-dir',String(col));
}
function routeHints(){
 // Environment landmarks, not a quiz overlay or buttons everywhere.
 const goal=el('div','hippo-goal',area);locate(goal,X[4],Y[0]);
 goal.setAttribute('aria-hidden','true');
 const label=el('span','hippo-goal-label',goal,'БЕРЕГ');
 label.setAttribute('aria-hidden','true');
 [[0,2],[1,1],[2,3]].forEach(([r,c],i)=>{
  const weed=el('div','hippo-reeds hippo-reeds--'+i,area);
  locate(weed,X[c],Y[r]);weed.setAttribute('aria-hidden','true');
 });
}
function blockedMove(note){
 bumps++;
 setTask(note);
 if(actor){
  actor.classList.remove('is-bumping');void actor.offsetWidth;actor.classList.add('is-bumping');
 }
}
function tryMove(dr,dc){
 if(phase!=='river'||busy)return;
 if(air===0){setTask('Воздух закончился! Всплыви за вдохом.');return;}
 const nr=row+dr,nc=col+dc;
 if(nr<0||nr>=Y.length||nc<0||nc>=X.length){blockedMove('Там край реки. Попробуй другое направление.');return;}
 if(BLOCKED.has(rc(nr,nc))){blockedMove('Впереди густые водоросли! Найди обход.');burst(X[nc],Y[nr],'splash');return;}
 const px=X[col],py=Y[row];
 row=nr;col=nc;air--;
 updateActor();updateMeter();burst(px,py,'bubbles');
 if((row+col)%2===0 && area.querySelectorAll('.zoo-visitor').length<3)
   window.TivvigZooLife?.react(area,'hippo',round);
 const trail=$('hippoTrail');
 if(trail){const dot=el('span','hippo-track-mark',trail);locate(dot,px,py);}
 if(row===0&&col===4){
  busy=true;setTask('Ты привела бегемота к берегу!');
  burst(X[col],Y[row],'celebrate');
  revealTimer=setTimeout(()=>{
   busy=false;round=1;phase='skin';render();
  },650);
  return;
 }
 if(air===0){
  setTask('Нужно вдохнуть! Нажми «ВДОХ» над водой.');
 }else{
  setTask('Иди по дну к берегу. Воздуха осталось: '+air+'.');
 }
}
function breathe(){
 if(phase!=='river'||busy||air===MAX_AIR)return;
 breaths++;air=MAX_AIR;updateMeter();
 burst(X[col],Y[row],'breath');
 actor?.classList.add('is-breathing');
 setTask('Бегемот поднял ноздри к поверхности и вдохнул. Путь продолжается!');
}
function river(){
 resetStage('hippo-world--river');
 el('div','hippo-river-tint',area).setAttribute('aria-hidden','true');
 showFootprints();routeHints();
 actor=el('div','hippo-actor',area);
 actor.id='hippoActor';actor.setAttribute('role','img');
 actor.setAttribute('aria-label','Бегемот движется по дну реки');
 updateActor();
 // Compact on-scene oxygen meter (no extra cards or windows).
 const breatheControl=el('div','hippo-breath-widget',area);
 el('span','hippo-lung-icon',breatheControl,'ВОЗДУХ');
 airMeter=el('div','hippo-air-meter',breatheControl);
 const surface=btn(breatheControl,'hippoSurface','hippo-surface','Всплыть и набрать воздух',breathe);
 surface.textContent='↑ ВДОХ';
 updateMeter();
 const pad=el('div','hippo-dpad',area);
 const directions=[
  ['Up','↑',-1,0,'Шаг вверх по дну'],
  ['Left','←',0,-1,'Шаг влево по дну'],
  ['Right','→',0,1,'Шаг вправо по дну'],
  ['Down','↓',1,0,'Шаг вниз по дну']
 ];
 for(const [id,label,dr,dc,aria] of directions){
  const b=btn(pad,'hippoMove'+id,'hippo-dir hippo-dir--'+id.toLowerCase(),aria,()=>tryMove(dr,dc));
  b.textContent=label;
 }
 discovery('Бегемот передвигается в воде, отталкиваясь от дна, и должен всплывать, чтобы дышать.');
 setTask('Проведи бегемота по дну к берегу. Обходи заросли и следи за воздухом.');
}
function skinEffect(){
 area.classList.toggle('hippo-world--skin-sun',skin.sun);
 area.classList.toggle('hippo-world--skin-water',skin.water);
 const s=$('hippoHeat'),w=$('hippoWater');
 s?.classList.toggle('is-done',skin.sun);w?.classList.toggle('is-done',skin.water);
 if(skin.sun&&skin.water){
  setTask('Эксперимент завершён! Теперь понятно, что это за красные капли.');
  discovery('Красные капли — не кровь! Особый секрет кожи помогает защищаться от солнца и микробов.');
  const next=$('hippoNext');if(next)next.hidden=false;
 }else if(skin.sun){
  setTask('На солнце видны красноватые капли. Теперь попробуй воду.');
  discovery('Бегемот выделяет красноватый защитный секрет кожи. Это не кровь.');
 }else if(skin.water){
  setTask('Вода охлаждает бегемота. А что будет с кожей под солнцем?');
  discovery('Днём бегемоты проводят много времени в воде, чтобы не перегреться.');
 }
}
function testSkin(which){
 if(phase!=='skin'||busy)return;
 skin[which]=true;
 if(area.querySelectorAll('.zoo-visitor').length<3)
   window.TivvigZooLife?.react(area,'hippo',round);
 burst(which==='sun'?37:51,which==='sun'?56:64,which==='sun'?'glow':'splash');
 skinEffect();
}
function skinGame(){
 resetStage('hippo-world--skin');
 el('div','hippo-sunbeams',area).setAttribute('aria-hidden','true');
 const droplets=el('div','hippo-red-skin',area);
 droplets.setAttribute('aria-label','Красные капли на спине бегемота');
 const heat=btn(area,'hippoHeat','hippo-natural-control hippo-natural-control--sun',
  'Показать, как солнце действует на кожу бегемота',()=>testSkin('sun'));
 locate(heat,32,18);heat.textContent='☀';
 const water=btn(area,'hippoWater','hippo-natural-control hippo-natural-control--water',
  'Показать, как вода действует на бегемота',()=>testSkin('water'));
 locate(water,72,67);water.textContent='≈';
 const next=btn(area,'hippoNext','hippo-scene-next','Перейти к ночному поиску травы',()=>{
  if(phase!=='skin'||!skin.sun||!skin.water||busy)return;
  phase='night';round=2;render();
 });
 next.hidden=true;next.textContent='К НОЧИ ›';
 skinEffect();
 setTask('На спине бегемота появились красные капли! Исследуй солнце и воду.');
 discovery('Это не кровь. Попробуй оба природных условия и посмотри на кожу.');
}
function grassButton(item,index){
 const b=btn(area,'hippoGrass'+index,'hippo-grass hippo-grass--'+index,
   'Лужайка с '+item.n+' пучками травы',()=>toggleGrass(index));
 locate(b,item.x,item.y);
 const blade=el('span','hippo-grass-stalks',b);
 for(let i=0;i<item.n;i++)el('span','hippo-grass-stalk',blade,'🌾');
 el('span','hippo-grass-count',b,String(item.n));
 return b;
}
function reflectGrass(){
 const sum=count();
 for(let i=0;i<GRASS.length;i++){
  const b=$('hippoGrass'+i);b?.classList.toggle('is-picked',grass.has(i));
  if(b)b.setAttribute('aria-pressed',grass.has(i)?'true':'false');
 }
 const target=$('hippoGrassTotal');
 if(target)target.textContent=sum+' / 5';
 if(sum===5){
  finished=true;phase='done';round=3;
  task.textContent='Ты нашла ровно пять пучков! Бегемот выходит пастись ночью.';
  discovery('Бегемоты в основном питаются травой и обычно выходят на пастбища ночью.');
  controls.classList.remove('hidden');dots();
  area.classList.add('hippo-world--victory');
  burst(78,45,'celebrate');
  window.TivvigZooLife?.reward({animal:'hippo',scene,task,fact});
 }else if(sum>5){
  task.textContent='Получилось '+sum+', а нужно 5. Убери лишнюю полянку.';
 }else if(sum===0){
  task.textContent='Ночью бегемот выходит есть траву. Найди ровно пять пучков.';
 }else{
  task.textContent='Собрано '+sum+' из 5. Какие полянки выберем ещё?';
 }
}
function toggleGrass(index){
 if(phase!=='night'||busy)return;
 if(grass.has(index))grass.delete(index);else grass.add(index);
 burst(GRASS[index].x,GRASS[index].y,'glow');
 if(area.querySelectorAll('.zoo-visitor').length<3)
   window.TivvigZooLife?.react(area,'hippo',round);
 reflectGrass();
}
function night(){
 resetStage('hippo-world--night zoo-stage--night');
 el('div','hippo-moonlight',area).setAttribute('aria-hidden','true');
 const total=el('div','hippo-grass-total',area);
 el('span','hippo-grass-total-caption',total,'ТРАВА');
 el('span','hippo-grass-total-count',total).id='hippoGrassTotal';
 GRASS.forEach(grassButton);
 discovery('Бегемоты чаще всего выходят из воды за травой в сумерках и ночью.');
 reflectGrass();
}
function render(){
 clearTimeout(revealTimer);
 if(phase==='river')river();
 else if(phase==='skin')skinGame();
 else if(phase==='night')night();
}
function restart(){
 clearTimeout(revealTimer);
 phase='river';round=0;row=2;col=0;air=MAX_AIR;
 breaths=0;bumps=0;skin={sun:false,water:false};grass.clear();busy=false;finished=false;
 controls.classList.add('hidden');fact.classList.add('hidden');render();
}
$('restart')?.addEventListener('click',restart);
window.addEventListener('pagehide',()=>clearTimeout(revealTimer));
if(new URLSearchParams(location.search).get('coop')!=='1'){
 // Optional desktop arrows when playing solo. Co-op only accepts room-authoritative button taps.
 document.addEventListener('keydown',e=>{
  if(phase!=='river'||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  if(e.target?.closest?.('input,textarea,select'))return;
  e.preventDefault();
  const dir=e.key.slice(5);
  $('hippoMove'+dir)?.click();
 });
}
window.TivvigZooDebug=Object.freeze({
 state:()=>({animal:'hippo',phase,round,row,col,air,breaths,bumps,
   skin:{...skin},grass:[...grass],grassTotal:count(),finished,busy}),
 restart,route:{start:[2,0],goal:[0,4],maxAir:MAX_AIR,
   obstacles:[...BLOCKED],recommended:['Right','Right','Up','Right','Right','Up']},
 rounds:[0,1,2]
});
render();
})();