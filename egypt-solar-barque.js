/* Solar barque of Ra: sun path, shadow experiment, reading gates, gallery reward.
   All educational actions are deterministic clicks, compatible with Firebase room replay. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const scene=$('solarScene');if(!scene||window.TivvigSolarDebug)return;
const REWARD='tivvig_egypt_ra_solar_amulet_v1';
const sunPrompts=[
 {name:'восток',question:'Где Солнце ВОСХОДИТ утром?',explain:'Утром Солнце появляется на востоке.'},
 {name:'полдень',question:'Где Солнце стоит ВЫШЕ всего?',explain:'В полдень Солнце высоко над нами.'},
 {name:'запад',question:'Где Солнце ЗАХОДИТ вечером?',explain:'Вечером Солнце скрывается на западе.'}
];
const shadowPrompts=[
 'Поставь Солнце на восток и посмотри на тень.',
 'Поставь Солнце высоко, в полдень. Как изменится тень?',
 'Поставь Солнце на запад. Куда теперь упадёт тень?'
];
const gates=[
 {name:'Первые врата',text:'РА СВЕ-ТИТ',parts:['РА','СВЕ','ТИТ'],choices:['СВЕ','ЛА','ТИТ','РА','ДОМ','МИ']},
 {name:'Вторые врата',text:'НОЧЬ У-ХО-ДИТ',parts:['НОЧЬ','У','ХО','ДИТ'],choices:['ДИТ','ХО','ДОМ','НОЧЬ','У','РА']},
 {name:'Третьи врата',text:'ЛА-ДА ВИ-ДИТ РА',parts:['ЛА','ДА','ВИ','ДИТ','РА'],choices:['ДИТ','ЛА','ВИ','РА','ДА','МО']}
];
let stage='intro',sunRound=0,shadowRound=0,selectedSun=null,shadowDone=false,gateRound=0,gatePos=0,gateChosen=[],gateOpen=[false,false,false],errors=0,correct=0,unlocked=false;
function play(kind){try{void window.TivvigHadesSounds?.play(kind)}catch(e){}}
function talk(t){$('solarSpeech').innerHTML='<strong>Ра:</strong> '+t}
function hint(t){$('solarHint').textContent=t}
function action(t){const a=$('solarAction');a.hidden=false;a.textContent=t}
function hide(){for(const id of ['solarSuns','solarEast','solarWest','solarShadowOptions','solarGates','solarInscription','solarReward'])$(id).hidden=true;$('solarAction').hidden=true;$('solarShadow').classList.remove('show');$('solarShadow').removeAttribute('data-sun');hint('')}
function progress(){const n=stage==='sky'?1:stage==='shadows'?2:(stage==='gates'||stage==='done')?3:0;for(let i=0;i<3;i++)$('solarProgress').children[i].classList.toggle('on',i<n);$('solarProgress').setAttribute('aria-label','Этап '+Math.max(n,1)+' из 3');scene.dataset.stage=stage;scene.dataset.time=stage==='gates'?'night':stage==='done'?'sunrise':stage==='sky'&&sunRound===2?'sunset':stage==='shadows'&&selectedSun===2?'sunset':'day'}
function setSunButtons(mode){$('solarSuns').hidden=false;$('solarEast').hidden=false;$('solarWest').hidden=false;for(let i=0;i<3;i++){const b=$('solar-sun-'+i);b.classList.toggle('selected',selectedSun===i);b.classList.toggle('done',stage==='sky'&&i<sunRound);b.disabled=(stage==='sky'&&sunRound>=3)||(stage==='shadows'&&shadowDone)}}
function render(){hide();progress();
 if(stage==='intro'){
  talk('Солнце исчезает за горизонтом каждый вечер, но утром возвращается! Помоги моей ладье пройти весь путь.');action('В путь!');return
 }
 if(stage==='sky'){
  setSunButtons();if(sunRound===3){talk('Отлично! Восход — восток, полдень — высоко, закат — запад.');hint('Теперь посмотрим, как Солнце меняет тени.');action('К обелиску →')}
  else{talk(sunPrompts[sunRound].question);hint((sunRound+1)+' / 3 · Нажми на светящееся Солнце.')}return
 }
 if(stage==='shadows'){
  setSunButtons();$('solarShadowOptions').hidden=false;
  if(selectedSun!==null){const r=$('solarShadow');r.classList.add('show');r.dataset.sun=String(selectedSun)}
  for(let i=0;i<3;i++){const b=$('solar-shadow-'+i);b.disabled=selectedSun===null||shadowDone;b.classList.toggle('chosen',shadowDone&&shadowRound===i)}
  if(shadowDone){talk('Верно! '+(['Утром тень длинная и падает на запад.','В полдень Солнце выше — тень короче.','Вечером тень длинная и падает на восток.'][shadowRound]));hint('Посмотри на тень у обелиска.');action(shadowRound===2?'К ночным вратам →':'Дальше →')}
  else{talk(shadowPrompts[shadowRound]);hint(selectedSun===null?'Сначала выбери Солнце, потом тень.':'Теперь выбери подходящую тень.')}return
 }
 if(stage==='gates'){
  $('solarGates').hidden=false;$('solarInscription').hidden=false;
  for(let i=0;i<3;i++){
   const b=$('solar-gate-'+i);b.classList.toggle('open',gateOpen[i]);b.classList.toggle('ready',i===gateRound&&gatePos===gates[gateRound]?.parts.length);b.disabled=i!==gateRound||gatePos!==gates[gateRound]?.parts.length
  }
  const g=gates[gateRound];
  $('solarSlots').replaceChildren();g.parts.forEach((x,i)=>{const s=document.createElement('span');s.className='slot'+(i<gatePos?' filled':'');s.textContent=i<gatePos?x:'·';$('solarSlots').append(s)});
  $('solarTiles').replaceChildren();g.choices.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='syllable';b.id='solar-syllable-'+i;b.textContent=t;b.disabled=gateChosen.includes(i)||gatePos===g.parts.length;b.setAttribute('aria-label','Слог '+t);b.addEventListener('click',()=>chooseSyllable(i));$('solarTiles').append(b)});
  $('solarInscriptionNote').textContent=gatePos===g.parts.length?'Прочитай вслух и нажми на светящиеся врата':'Собери надпись слева направо';
  talk(gatePos===g.parts.length?'Прочитай: «'+g.text+'». Теперь открой '+g.name.toLowerCase()+'!':'Наступила ночь. '+g.name+' откроются, если правильно собрать надпись.');
  hint((gateRound+1)+' / 3 · '+(gatePos===g.parts.length?'Нажми на врата.':'Выбирай слоги.'));return
 }
 if(stage==='done'){
  $('solarReward').hidden=false;talk('Ночь закончилась! Солнце снова взошло. Возьми мой солнечный амулет!');hint('Три испытания пройдены.');action('Сыграть ещё раз');return
 }
}
function chooseSun(i){if(!Number.isInteger(i)||i<0||i>2)return;
 if(stage==='sky'&&sunRound<3){if(i!==sunRound){errors++;hint('Попробуй другое положение Солнца.');play('wrong');return}sunRound++;correct++;selectedSun=i;render();play('success');return}
 if(stage==='shadows'&&!shadowDone){selectedSun=i;render();play('tap');return}
}
function chooseShadow(i){if(stage!=='shadows'||shadowDone||selectedSun===null)return;
 if(selectedSun!==shadowRound){errors++;hint('Посмотри, где просит поставить Солнце Ра.');play('wrong');return}
 if(i!==shadowRound){errors++;hint(shadowRound===1?'В полдень тень должна стать короткой.':'Тень падает в сторону, противоположную Солнцу.');play('wrong');return}
 shadowDone=true;correct++;render();play('success')
}
function chooseSyllable(i){if(stage!=='gates'||gateRound>=gates.length)return;const g=gates[gateRound];if(gatePos>=g.parts.length||gateChosen.includes(i))return;
 if(g.choices[i]!==g.parts[gatePos]){errors++;hint('Не тот слог. Посмотри, какой нужен дальше.');play('wrong');return}
 gateChosen.push(i);gatePos++;correct++;render();play(gatePos===g.parts.length?'success':'tap')
}
function openGate(i){if(stage!=='gates'||i!==gateRound||gatePos!==gates[i].parts.length)return;gateOpen[i]=true;gateRound++;play('success');
 if(gateRound===gates.length){finish();return}gatePos=0;gateChosen=[];render()
}
function save(){if(unlocked)return;unlocked=true;try{localStorage.setItem(REWARD,'unlocked')}catch(e){}try{if(window.TivvigRegistry?.byReward?.[REWARD])window.TivvigRegistry.unlockReward(REWARD);else window.dispatchEvent(new CustomEvent('tivvig:reward-unlocked',{detail:{key:REWARD}}))}catch(e){}}
function finish(){stage='done';save();render();play('finish')}
function next(){if(stage==='intro'){stage='sky';sunRound=0;selectedSun=null;render();play('tap');return}
 if(stage==='sky'&&sunRound===3){stage='shadows';shadowRound=0;selectedSun=null;shadowDone=false;render();play('tap');return}
 if(stage==='shadows'&&shadowDone){shadowRound++;if(shadowRound===3){stage='gates';gateRound=0;gatePos=0;gateChosen=[];selectedSun=null}else{selectedSun=null;shadowDone=false}render();play('tap');return}
 if(stage==='done')reset()}
function reset(){stage='intro';sunRound=0;shadowRound=0;selectedSun=null;shadowDone=false;gateRound=0;gatePos=0;gateChosen=[];gateOpen=[false,false,false];errors=0;correct=0;render()}
function outfit(){try{window.TivvigWardrobe?.equip($('solarLada'))}catch(e){}}
$('solarAction').addEventListener('click',next);
for(let i=0;i<3;i++){$('solar-sun-'+i).addEventListener('click',()=>chooseSun(i));$('solar-shadow-'+i).addEventListener('click',()=>chooseShadow(i));$('solar-gate-'+i).addEventListener('click',()=>openGate(i))}
window.addEventListener('tivvig-outfit-changed',outfit);window.addEventListener('tivvig-inventory-changed',outfit);window.addEventListener('pageshow',outfit);
window.TivvigSolarDebug=Object.freeze({
 state:()=>({stage,sunRound,shadowRound,selectedSun,shadowDone,gateRound,gatePos,gateChosen:[...gateChosen],gateOpen:[...gateOpen],errors,correct,reward:(()=>{try{return localStorage.getItem(REWARD)==='unlocked'}catch(e){return false}})()}),
 reset,advance:()=>{if(stage==='intro'||stage==='done')return $('solarAction').click();if(stage==='sky')return sunRound<3?$('solar-sun-'+sunRound).click():$('solarAction').click();if(stage==='shadows')return selectedSun===null?$('solar-sun-'+shadowRound).click():!shadowDone?$('solar-shadow-'+shadowRound).click():$('solarAction').click();if(stage==='gates'){const g=gates[gateRound];return gatePos===g.parts.length?$('solar-gate-'+gateRound).click():$('solar-syllable-'+g.choices.indexOf(g.parts[gatePos])).click()}}
});
reset();outfit();
})();