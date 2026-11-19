/* Тиввиг / Дворец Аида: six deterministic chapters, one environment.
 * All input is via accessible click buttons for iPad and Firebase room replay.
 * The 2-tone rhythm is adapted from the tested ladaburg-forge hammer sequence.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const scene=$('stage'),control=$('sceneControls'),party=$('party'),message=$('message');
const STAGES=[
 {name:'Печати Аида',bg:'images/hades-palace-blue.webp',msg:'Найди печать'},
 {name:'Забытые голоса',bg:'images/hades-spirits-cave.webp',msg:'Повтори ритм'},
 {name:'Мост из слов',bg:'images/hades-river-cave.webp',msg:'Построй мост'},
 {name:'Огненные часы',bg:'images/hades-palace-fire.webp',msg:'Запусти часы'},
 {name:'Гранатовый сад',bg:'images/hades-river-cave.webp',msg:'Верни времена года'},
 {name:'Последняя песня',bg:'images/hades-palace-fire.webp',msg:'Сыграй песню'}
];
const BEATS=[['B','S','B'],['B','B','S','B'],['S','B','B','S']];
const LAST_SONG=['S','B','B','S','B','S'];
const SEALS=[1,0,2];
const HINTS=['Не огонь. Не змеи.','Не луна. Не змеи.','Не огонь. Не луна.'];
const WORDS=[
 {sentence:['ЛАДА','НЕСЁТ','ЛИРУ'],choices:['ЛИРУ','ЛАДА','ЗМЕИ','НЕСЁТ']},
 {sentence:['ДРУЗЬЯ','СТРОЯТ','МОСТ'],choices:['МОСТ','СТРОЯТ','ДРУЗЬЯ','СОН']},
 {sentence:['ТЕНИ','УХОДЯТ','ПРОЧЬ'],choices:['УХОДЯТ','ПРОЧЬ','РЕКА','ТЕНИ']}
];
const CLOCK=[{a:2,b:3,op:'+',choices:[5,4,7],correct:5},
 {a:8,b:3,op:'−',choices:[6,5,3],correct:5},
 {a:4,b:4,op:'+',choices:[6,9,8],correct:8},
 {a:9,b:6,op:'−',choices:[3,6,4],correct:3},
 {a:6,b:4,op:'+',choices:[8,9,10],correct:10}];
const SEASONS=[{label:'Весна',emoji:'🌸'},{label:'Лето',emoji:'☀️'},{label:'Осень',emoji:'🍂'},{label:'Зима',emoji:'❄️'}];
const KEY='tivvig_hades_journey_stage_v1',FINAL='tivvig_hades_persephone_freed_v1';
const reduce=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,reduced?Math.min(ms,80):ms));
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
let stage=0,busy=false,transitioning=false,epoch=0;
let sealRound=0,rhythmRound=0,played=[],listened=false;
let wordRound=0,wordStep=0,bridgeCount=0,clockRound=0,seasonIndex=0,seedIndex=0;
let finalPlayed=[],songReady=false,finalDone=false;
let audio=null,clips=null,soundOn=true;
const countSaved=Number(read(KEY));
const freshStart=Number.isInteger(countSaved)&&countSaved>=0&&countSaved<=5?countSaved:0;
function wardrobe(){window.TivvigWardrobe?.equip($('hadesLada'))}
window.addEventListener('tivvig-outfit-changed',wardrobe);
window.addEventListener('tivvig-inventory-changed',wardrobe);
window.addEventListener('pageshow',wardrobe);
window.addEventListener('pointerdown',primeAudio,{passive:true});
window.addEventListener('touchend',primeAudio,{passive:true});
window.addEventListener('keydown',primeAudio);
function primeAudio(){try{const T=window.AudioContext||window.webkitAudioContext;if(!T)return;if(!audio)audio=new T();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function makeWav(kind){
 // Reuses the native WAV strategy of ladaburg-forge.js (iPad safe; no external audio).
 const rate=22050,n=Math.round(rate*(kind==='B'?.36:.30));
 const bytes=new Uint8Array(44+n*2),data=new DataView(bytes.buffer);
 const name=(at,str)=>{for(let i=0;i<str.length;i++)bytes[at+i]=str.charCodeAt(i)};
 name(0,'RIFF');data.setUint32(4,bytes.length-8,true);name(8,'WAVE');name(12,'fmt ');
 data.setUint32(16,16,true);data.setUint16(20,1,true);data.setUint16(22,1,true);
 data.setUint32(24,rate,true);data.setUint32(28,rate*2,true);data.setUint16(32,2,true);
 data.setUint16(34,16,true);name(36,'data');data.setUint32(40,n*2,true);
 let seed=kind==='B'?1234567:918273;
 for(let i=0;i<n;i++){
  const t=i/rate,attack=Math.min(1,t*240);
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;
  const metal=kind==='B'?.52*Math.sin(2*Math.PI*(166*t-70*t*t))+.23*Math.sin(2*Math.PI*286*t)+.14*Math.sin(2*Math.PI*606*t):.43*Math.sin(2*Math.PI*735*t)+.30*Math.sin(2*Math.PI*1168*t)+.22*Math.sin(2*Math.PI*1730*t);
  data.setInt16(44+i*2,Math.max(-32767,Math.min(32767,Math.round(attack*(metal*Math.exp(-(kind==='B'?11:12)*t)+noise*.23*Math.exp(-36*t))*30000))),true);
 }
 let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
 return 'data:audio/wav;base64,'+btoa(raw);
}
function getClips(){
 if(clips)return clips;clips={};
 try{if(typeof Audio!=='function'||typeof btoa!=='function')return clips;
  for(const kind of ['B','S']){const player=new Audio(makeWav(kind));player.preload='auto';player.volume=1;player.setAttribute?.('playsinline','');clips[kind]=player;}
 }catch{clips={}}return clips;
}
function tone(kind){
 try{const T=window.AudioContext||window.webkitAudioContext;if(!T)return;primeAudio();if(!audio)return;
  const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime;
  oscillator.type=kind==='B'?'triangle':'sine';oscillator.frequency.setValueAtTime(kind==='B'?145:620,start);
  oscillator.frequency.exponentialRampToValueAtTime(kind==='B'?80:350,start+.17);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(kind==='B'?.24:.18,start+.014);
  gain.gain.exponentialRampToValueAtTime(.0001,start+.3);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(start);oscillator.stop(start+.31);
 }catch{}
}
function sound(kind){
 if(!soundOn)return;const player=getClips()[kind];
 if(!player){tone(kind);return}
 try{player.pause();player.currentTime=0;const p=player.play();p?.catch?.(()=>tone(kind));}catch{tone(kind)}
}
function flash(id){const b=$(id);if(!b)return;b.classList.add('pulse');setTimeout(()=>b.classList.remove('pulse'),reduce?60:280)}
function setMessage(s){message.textContent=s}
function makeButton(cls,id,text,onClick,aria){const b=document.createElement('button');b.type='button';b.className=cls;b.id=id;b.textContent=text;if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',onClick);return b}
function el(tag,cls,text){const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n}
function prompt(text){return el('div','prompt',text)}
function status(){return el('div','feedback','')}
function wrap(cls){return el('div','control-area '+cls)}
function put(nodes){control.replaceChildren(...nodes)}
function chapter(){
 $('chapterNo').textContent='ИСПЫТАНИЕ '+['I','II','III','IV','V','VI'][stage];
 $('chapterName').textContent=STAGES[stage].name;
 const root=$('progress');root.replaceChildren();
 for(let i=0;i<STAGES.length;i++){const dot=el('i',(i<stage?'done':i===stage?'now':''));root.appendChild(dot)}
}
function savedStage(newStage){write(KEY,String(newStage));const key=`tivvig_hades_stage_${newStage}_v1`;
 if(window.TivvigRegistry?.byReward?.[key])window.TivvigRegistry.unlockReward(key);
}
async function forward(){
 if(transitioning)return;transitioning=true;busy=true;const id=++epoch;
 savedStage(stage+1);setMessage('✦');party.classList.add('is-travelling');
 await delay(780);if(id!==epoch)return;party.classList.remove('is-travelling');
 stage++;if(stage>5){finish();return}renderScene();
}
function renderScene(){
 epoch++;busy=false;transitioning=false;sealRound=0;rhythmRound=0;played=[];listened=false;
 wordRound=0;wordStep=0;bridgeCount=0;clockRound=0;seasonIndex=0;seedIndex=0;finalPlayed=[];songReady=false;
 scene.dataset.stage=String(stage);scene.dataset.bloom='0';scene.classList.remove('is-free');
 $('backdrop').src=STAGES[stage].bg;$('backdrop').alt=STAGES[stage].name;
 $('bridgeTrack').hidden=stage!==2;$('gardenTree').hidden=stage!==4;
 $('soundHint').hidden=!(stage===1||stage===5);$('finale').hidden=true;
 chapter();wardrobe();setMessage(STAGES[stage].msg);
 if(stage===0)renderSeals();if(stage===1)renderRhythm();if(stage===2)renderWords();
 if(stage===3)renderClock();if(stage===4)renderGarden();if(stage===5)renderFinalSong();
}
function markRunes(count,max){const group=el('div','runes');for(let i=0;i<max;i++)group.appendChild(el('span',i<count?'active':'','✦'));return group}
function renderSeals(){
 const box=wrap('seal-area'),hint=prompt(HINTS[sealRound]),seals=el('div','seals'),marks=markRunes(sealRound,3),feedback=status();
 for(let i=0;i<3;i++){const btn=makeButton('seal','hades-seal-'+i,'',()=>chooseSeal(i));const img=document.createElement('img');img.src='images/hades-seal-'+(i+1)+'.webp';img.alt=['Печать пламени','Печать луны и весов','Печать двух змей'][i];img.draggable=false;btn.appendChild(img);btn.setAttribute('aria-label',img.alt);seals.appendChild(btn)}
 box.append(hint,seals,marks,feedback);put([box]);
}
async function chooseSeal(i){if(stage!==0||busy)return;
 const btn=$('hades-seal-'+i);
 if(i!==SEALS[sealRound]){btn.classList.add('incorrect');setMessage('Посмотри ещё');setTimeout(()=>btn.classList.remove('incorrect'),400);return}
 busy=true;btn.classList.add('correct');setMessage('Верно');const token=epoch;
 await delay(600);if(token!==epoch)return;sealRound++;
 if(sealRound===3){await forward();return}busy=false;renderSeals();
}
function musicIcon(){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 110 110');svg.setAttribute('aria-hidden','true');svg.innerHTML='<path d="M31 23Q14 60 28 87M79 23Q96 60 82 87" fill="none" stroke="#b6d5d9" stroke-width="8" stroke-linecap="round"/><path d="M31 23Q55 14 79 23M28 87Q55 103 82 87" fill="none" stroke="#e9d1a2" stroke-width="6"/><path d="M33 26V87M44 24V92M55 23V94M66 24V92M77 26V87" stroke="#9feaf2" stroke-width="3"/><circle cx="55" cy="14" r="7" fill="#a7c8ff"/>';return svg}
function drawBeats(row,pattern,playedLength=0){row.replaceChildren();for(let i=0;i<pattern.length;i++){row.appendChild(el('i',i<playedLength?'done':'',i<playedLength?'✦':'·'))}}
function rhythmPanel(final=false){
 const box=wrap('sound-area'),slab=el('div','music-slab'),beaten=el('div','beats');beaten.id='hadesBeats';
 const show=el('div','beats');show.id='hadesDemo';
 slab.appendChild(musicIcon());slab.append(show,beaten);
 const controls=el('div','music-controls');
 controls.append(makeButton('tone','hades-big','БАМ',()=>hit('B',final),'Низкий звук'),makeButton('listen','hades-listen','▶',()=>listen(final),'Послушать мелодию'),makeButton('tone','hades-small','ДЗИНЬ',()=>hit('S',final),'Высокий звук'));
 const label=prompt(final?'Последняя песня':'Повтори ритм'),note=status();note.id='hadesFeedback';box.append(label,slab,controls,note);
 put([box]);
 const seq=final?LAST_SONG:BEATS[rhythmRound];drawBeats(show,seq);drawBeats(beaten,seq,final?finalPlayed.length:played.length);
 $('hades-big').disabled=$('hades-small').disabled=!((final?songReady:listened)&&!busy);
 $('hades-listen').disabled=busy;
}
function renderRhythm(){rhythmPanel(false)}
function renderFinalSong(){rhythmPanel(true)}
async function listen(final){
 if(stage!==(final?5:1)||busy)return;busy=true;
 if(final){songReady=false;finalPlayed=[]}else{listened=false;played=[]}
 const id=++epoch;const seq=final?LAST_SONG:BEATS[rhythmRound];rhythmPanel(final);
 setMessage('Слушай и смотри');await delay(250);
 for(let i=0;i<seq.length;i++){
   if(id!==epoch||stage!==(final?5:1))return;
   const demo=$('hadesDemo').children[i];demo.classList.add('lit');demo.textContent=seq[i]==='B'?'●':'✧';
   flash(seq[i]==='B'?'hades-big':'hades-small');sound(seq[i]);
   await delay(490);if(id!==epoch)return;demo.classList.remove('lit');
   await delay(150);
 }
 busy=false;if(final)songReady=true;else listened=true;rhythmPanel(final);setMessage('Твоя очередь');
}
async function hit(which,final){
 if(stage!==(final?5:1)||busy||!(final?songReady:listened))return;
 primeAudio();sound(which);flash(which==='B'?'hades-big':'hades-small');
 const arr=final?finalPlayed:played,seq=final?LAST_SONG:BEATS[rhythmRound];
 if(seq[arr.length]!==which){setMessage('Попробуй ещё');if(final){songReady=false;finalPlayed=[]}else{listened=false;played=[]}rhythmPanel(final);return}
 arr.push(which);rhythmPanel(final);
 if(arr.length!==seq.length){setMessage('✦');return}
 busy=true;setMessage('Мелодия верна');const id=++epoch;
 await delay(520);if(id!==epoch)return;
 if(final){finish();return}
 rhythmRound++;played=[];listened=false;busy=false;
 if(rhythmRound===BEATS.length){await forward();return}
 rhythmPanel(false);setMessage('Новый ритм');
}
function renderWords(){
 const data=WORDS[wordRound],box=wrap('word-area');
 const hint=prompt('Собери: '+data.sentence.join(' '));
 const bridge=el('div','word-bridge');for(let i=0;i<3;i++)bridge.appendChild(el('div','word-step'+(i<wordStep?' filled':''),i<wordStep?data.sentence[i]:'·'));
 const opts=el('div','word-options');data.choices.forEach((word,i)=>{
 const btn=makeButton('word','hades-word-'+i,word,()=>pickWord(i),word);
 btn.disabled=data.sentence.slice(0,wordStep).includes(word);opts.appendChild(btn)});
 box.append(hint,bridge,opts,status());put([box]);
 const track=$('bridgeTrack');track.replaceChildren();for(let i=0;i<9;i++){const s=el('i',i<bridgeCount?'complete':'');track.appendChild(s)}
}
async function pickWord(i){if(stage!==2||busy)return;
 const w=WORDS[wordRound].choices[i],correct=WORDS[wordRound].sentence[wordStep];
 if(w!==correct){$('hades-word-'+i).classList.add('wrong');setMessage('Другой камень');setTimeout(()=>$('hades-word-'+i)?.classList.remove('wrong'),350);return}
 wordStep++;bridgeCount++;setMessage('Камень на месте');
 if(wordStep<3){renderWords();return}
 busy=true;renderWords();const id=++epoch;await delay(450);if(id!==epoch)return;
 wordRound++;wordStep=0;busy=false;
 if(wordRound===WORDS.length){await forward();return}
 renderWords();
}
function renderClock(){
 const box=wrap('clock-area'),clock=el('div','clock'),target=el('span','clock-question');target.id='hadesClockQuestion';
 target.textContent=CLOCK[clockRound].a+' '+CLOCK[clockRound].op+' '+CLOCK[clockRound].b+' = ?';
 clock.style.setProperty('--gear',(clockRound*72)+'deg');clock.appendChild(target);
 const choices=el('div','clock-answer');CLOCK[clockRound].choices.forEach((n,i)=>choices.appendChild(makeButton('answer','hades-answer-'+i,String(n),()=>pickAnswer(i),'Ответ '+n)));
 box.append(clock,choices,markRunes(clockRound,5),status());put([box]);
}
async function pickAnswer(i){if(stage!==3||busy)return;
 if(CLOCK[clockRound].choices[i]!==CLOCK[clockRound].correct){setMessage('Проверь счёт');$('hades-answer-'+i).classList.add('incorrect');setTimeout(()=>$('hades-answer-'+i)?.classList.remove('incorrect'),320);return}
 busy=true;setMessage('Часы идут');clockRound++;const id=++epoch;
 await delay(500);if(id!==epoch)return;
 if(clockRound===CLOCK.length){await forward();return}
 busy=false;renderClock();
}
function renderGarden(){
 const box=wrap('garden-area');
 if(seasonIndex<4){
   box.append(prompt('Время года: '+SEASONS[seasonIndex].label));
   const row=el('div','garden-controls');SEASONS.forEach((v,i)=>row.appendChild(makeButton('season'+(i<seasonIndex?' chosen':''),'hades-season-'+i,v.emoji,()=>pickSeason(i),v.label)));
   box.append(row,markRunes(seasonIndex,4),status());
 }else{
   box.append(prompt('Найди три зёрнышка'));
   const row=el('div','seeds');for(let i=0;i<3;i++){const b=makeButton('seed','hades-seed-'+i,'♦',()=>pickSeed(i),'Гранатовое зёрнышко '+(i+1));b.disabled=i<seedIndex;row.appendChild(b)}
   box.append(row,markRunes(seedIndex,3),status());
 }
 put([box]);scene.dataset.bloom=String(seasonIndex);
}
async function pickSeason(i){if(stage!==4||busy||seasonIndex>=4)return;
 if(i!==seasonIndex){setMessage('Другое время года');return}
 seasonIndex++;setMessage('Сад оживает');renderGarden();
}
async function pickSeed(i){if(stage!==4||busy||seasonIndex<4||i!==seedIndex)return;
 seedIndex++;setMessage('Зёрнышко найдено');renderGarden();
 if(seedIndex===3){busy=true;await delay(560);await forward()}
}
function finish(){
 if(finalDone)return;finalDone=true;busy=true;songReady=false;
 write(FINAL,'unlocked');write(KEY,'5');
 if(window.TivvigRegistry?.byReward?.[FINAL])window.TivvigRegistry.unlockReward(FINAL);
 scene.classList.add('is-free');$('finale').hidden=false;setMessage('Персефона свободна');
}
function startOver(){epoch++;stage=0;finalDone=false;write(KEY,'0');$('finale').hidden=true;renderScene()}
function setup(){for(let i=0;i<19;i++){const dot=el('i','');dot.style.left=((i*29+7)%95)+'%';dot.style.top=((i*43+11)%83)+'%';dot.style.animationDelay=(-i*.19)+'s';$('ambience').appendChild(dot)}
 $('soundToggle').addEventListener('click',()=>{soundOn=true;primeAudio();sound('S');setMessage('Звук включён')});
 $('replayAll').addEventListener('click',startOver);
 stage=freshStart;renderScene();
 if(read(FINAL)==='unlocked'&&stage===5){finalDone=true;scene.classList.add('is-free');$('finale').hidden=false}
}
window.TivvigHadesDebug=Object.freeze({
 state:()=>({stage,busy,sealRound,rhythmRound,played:[...played],listened,wordRound,wordStep,bridgeCount,clockRound,seasonIndex,seedIndex,finalPlayed:[...finalPlayed],songReady,finalDone}),
 seal:i=>$('hades-seal-'+i)?.click(),listen:()=>$('hades-listen')?.click(),hit:x=>$(x==='B'?'hades-big':'hades-small')?.click(),
 word:i=>$('hades-word-'+i)?.click(),answer:i=>$('hades-answer-'+i)?.click(),season:i=>$('hades-season-'+i)?.click(),seed:i=>$('hades-seed-'+i)?.click(),
 reset:startOver,stage:n=>{epoch++;stage=Math.max(0,Math.min(5,n));renderScene()},
 data:()=>({seals:[...SEALS],beats:BEATS.map(a=>[...a]),words:WORDS.map(x=>({sentence:[...x.sentence],choices:[...x.choices]})),clock:CLOCK.map(x=>({...x})),song:[...LAST_SONG]})
});
setup();
})();