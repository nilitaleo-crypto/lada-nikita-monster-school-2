/* Tivvig zoo: subtle illustrated wildlife visitors + real wildlife photo rewards.
   Deterministic, pointer-events:none animated SVG, no modals, no timers touching gameplay.
   Reward sources/attributions: zoo-photo-manifest.json (Wikimedia Commons CC/PD).
*/
(()=>{
'use strict';
const P={
 ibis:['Ибис ищет еду','Bernard DUPONT','CC BY-SA 2.0','African Sacred Ibis (Threskiornis aethiopicus) foraging.jpg','Ибис ищет пищу длинным клювом в мягком иле.'],
 camel:['Мама и верблюжонок','Henryhbk','Public domain','Camelmomandbaby.jpg','Новорождённый верблюжонок вскоре может встать на ноги.'],
 fennec:['Два настоящих фенека','Umberto Salvagnin','CC BY 2.0','Fennec Foxes.jpg','Фенеки могут жить семейными группами.'],
 baboon:['Павианы ухаживают друг за другом','Diego Delso','CC BY-SA 4.0','Papiones de Anubis (Papio anubis), parque nacional del lago Nakuru, Kenia, 2024-05-18, DD 39.jpg','Павианы чистят друг другу шерсть, укрепляя дружбу.'],
 cobra:['Египетская кобра предупреждает','John Walker','Public domain','L14cobra.jpg','Кобра поднимает капюшон, когда защищается.'],
 hippo:['Малыш на спине мамы','Adam Jones','CC BY-SA 2.0','Hippopotamus Calf on Back of Mother - Mikumi National Park - Tanzania (8892763085).jpg','Детёныш бегемота может отдыхать на спине своей мамы.'],
 crocodile:['Крокодил с открытой пастью','Steve Slater','CC BY 2.0','Nile crocodile with jaws open.jpg','Крокодил может охлаждаться, раскрывая пасть.']
};
const LICENSE={
 'CC BY 2.0':'https://creativecommons.org/licenses/by/2.0/',
 'CC BY-SA 2.0':'https://creativecommons.org/licenses/by-sa/2.0/',
 'CC BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/',
 'Public domain':'https://commons.wikimedia.org/wiki/Commons:Public_domain'
};
const VISIT={
 ibis:[['fish',78,72,0],['frog',63,84,1],['dragonfly',54,40,0],['fish',86,76,1]],
 camel:[['lizard',85,77,0],['beetle',52,82,1],['bird',74,35,0],['butterfly',65,30,1]],
 fennec:[['beetle',78,76,0],['mouse',63,77,1],['lizard',76,70,0],['mouse',81,73,1],['beetle',65,82,0]],
 baboon:[['bird',77,19,0],['butterfly',62,49,1],['monkey',48,40,0],['bird',71,21,1]],
 cobra:[['lizard',54,73,0],['beetle',70,81,1],['bird',71,23,0]],
 hippo:[['fish',62,74,0],['frog',77,74,1],['bird',77,37,0],['dragonfly',61,32,1]],
 crocodile:[['fish',73,80,0],['bird',64,23,1],['fish',39,75,0],['dragonfly',69,50,1]]
};
const CAMEO={
 fish:'<path d="M19 67 3 45 5 88z" fill="url(#g)" stroke="#477a7b" stroke-width="3"/><path d="M29 57Q73 19 119 66Q73 107 29 72Z" fill="url(#g)" stroke="#6ca9a3" stroke-width="3"/><path d="M55 42 69 20 84 48M66 83 84 104 95 83" fill="#b8e4a4" stroke="#568f8a" stroke-width="3"/><path d="M45 58 58 70M60 53 73 69M77 54 89 67" stroke="#bfe9dc" stroke-width="2" opacity=".8"/><circle cx="103" cy="60" r="5.5" fill="#163943"/><circle cx="105" cy="58" r="1.5" fill="#fff"/>',
 frog:'<path d="M27 84Q10 88 10 104Q26 110 40 94M104 82Q124 85 130 103Q114 109 100 95" fill="#8bba62" stroke="#39694b" stroke-width="4"/><path d="M27 75Q30 39 70 40Q111 40 115 78Q109 103 69 106Q29 104 27 75Z" fill="url(#g)" stroke="#4d8158" stroke-width="3"/><circle cx="47" cy="46" r="18" fill="#9cc979"/><circle cx="95" cy="46" r="18" fill="#9cc979"/><circle cx="48" cy="46" r="9" fill="#fbf4d4"/><circle cx="94" cy="46" r="9" fill="#fbf4d4"/><circle cx="50" cy="46" r="5" fill="#213d3a"/><circle cx="96" cy="46" r="5" fill="#213d3a"/><path d="M53 78Q71 89 89 77" fill="none" stroke="#376c55" stroke-width="4" stroke-linecap="round"/>',
 bird:'<path d="M63 41Q31 24 25 45Q47 43 50 67L52 88Q43 97 36 108" fill="#eae2cb" stroke="#a4b5ad" stroke-width="3"/><path d="M55 83Q40 37 75 23Q103 16 113 38Q115 55 94 62Q77 67 81 93" fill="url(#g)" stroke="#a9b4aa" stroke-width="3"/><path d="M108 40 137 47 109 50Z" fill="#d8a35e"/><circle cx="100" cy="34" r="4" fill="#243d44"/><path d="M64 89 61 119M78 89 78 119M56 119 48 122M78 119 88 123" fill="none" stroke="#bf944a" stroke-width="3" stroke-linecap="round"/><path d="M57 63Q30 79 23 66Q45 59 57 61" fill="#f9f1d9" stroke="#a3b6b5" stroke-width="2"/>',
 lizard:'<path d="M27 85Q10 109 3 102Q5 116 23 111Q48 108 64 89" fill="none" stroke="#779b70" stroke-width="13" stroke-linecap="round"/><path d="M37 65 19 48M47 86 24 108M82 68 103 52M85 87 106 106" stroke="#4d8568" stroke-width="10" stroke-linecap="round"/><path d="M23 76Q53 44 93 67Q119 54 131 62Q143 79 118 83Q80 105 31 89Z" fill="url(#g)" stroke="#517d55" stroke-width="3"/><circle cx="122" cy="66" r="4" fill="#153b3d"/><path d="M59 66 72 80 86 64M46 80 60 90M86 88 97 79" fill="none" stroke="#b9d39c" stroke-width="3"/>',
 beetle:'<path d="M55 47 39 24M86 46 103 24M39 70 14 59M39 89 15 105M102 69 129 58M101 92 124 108" fill="none" stroke="#94794d" stroke-width="5" stroke-linecap="round"/><ellipse cx="70" cy="78" rx="42" ry="40" fill="url(#g)" stroke="#4d755b" stroke-width="4"/><path d="M70 46V111M41 61Q70 39 100 61" fill="none" stroke="#d6d49b" stroke-width="3"/><ellipse cx="70" cy="41" rx="23" ry="16" fill="#7b9567"/><circle cx="57" cy="35" r="3" fill="#1d4440"/><circle cx="83" cy="35" r="3" fill="#1d4440"/>',
 mouse:'<path d="M35 90Q0 100 8 119Q20 126 29 115" fill="none" stroke="#ad9679" stroke-width="5" stroke-linecap="round"/><ellipse cx="71" cy="85" rx="48" ry="29" fill="url(#g)" stroke="#b79b76" stroke-width="3"/><ellipse cx="106" cy="72" rx="24" ry="24" fill="#edc89d" stroke="#b79b76" stroke-width="3"/><circle cx="89" cy="49" r="14" fill="#e5af9c" stroke="#b98f83" stroke-width="3"/><circle cx="121" cy="45" r="13" fill="#e4ad99" stroke="#b98f83" stroke-width="3"/><circle cx="112" cy="69" r="4" fill="#292d31"/><circle cx="131" cy="79" r="4" fill="#8c6261"/><path d="M128 83 139 79M127 87 137 91" stroke="#c39e87" stroke-width="2"/><path d="M46 105 43 118M83 107 87 119" stroke="#a88a79" stroke-width="4"/>',
 monkey:'<path d="M20 86Q4 66 17 42Q30 24 43 42" fill="none" stroke="#a18b74" stroke-width="9" stroke-linecap="round"/><path d="M37 95 28 114M104 95 114 116M54 90 49 114M87 91 91 116" stroke="#8e7864" stroke-width="10" stroke-linecap="round"/><ellipse cx="70" cy="83" rx="41" ry="37" fill="url(#g)" stroke="#836d5d" stroke-width="3"/><circle cx="70" cy="45" r="34" fill="url(#g)" stroke="#836d5d" stroke-width="3"/><circle cx="36" cy="49" r="13" fill="#c8a18b"/><circle cx="105" cy="49" r="13" fill="#c8a18b"/><ellipse cx="70" cy="53" rx="25" ry="22" fill="#e0baa0"/><circle cx="59" cy="43" r="4" fill="#282f30"/><circle cx="80" cy="43" r="4" fill="#282f30"/><ellipse cx="70" cy="59" rx="5" ry="4" fill="#624a41"/><path d="M61 69Q70 75 79 69" stroke="#715445" stroke-width="3" fill="none"/>',
 butterfly:'<path d="M70 67Q43 9 14 43Q14 80 62 75Q34 72 26 104Q58 129 69 77" fill="url(#g)" stroke="#ac815e" stroke-width="3"/><path d="M70 67Q96 9 126 43Q129 81 78 75Q110 74 116 104Q84 126 70 77" fill="url(#g)" stroke="#ac815e" stroke-width="3"/><path d="M70 45V96" stroke="#5e533d" stroke-width="7" stroke-linecap="round"/><path d="M70 49Q57 28 50 26M70 49Q84 27 90 26" fill="none" stroke="#5e533d" stroke-width="3"/><circle cx="43" cy="52" r="9" fill="#fff0c7" opacity=".8"/><circle cx="97" cy="52" r="9" fill="#fff0c7" opacity=".8"/>',
 dragonfly:'<path d="M70 55Q40 4 18 36Q26 60 67 68M74 58Q107 3 128 40Q111 66 76 68M66 72Q20 63 22 91Q47 100 70 79M73 74Q112 56 124 91Q91 106 72 82" fill="url(#g)" opacity=".83" stroke="#87c9c8" stroke-width="3"/><path d="M72 35V115" stroke="#54817a" stroke-width="8" stroke-linecap="round"/><circle cx="72" cy="30" r="12" fill="#87cbb1"/><circle cx="69" cy="28" r="3" fill="#26494a"/><path d="M72 57 48 71M73 70 93 86M72 83 53 99" stroke="#619c93" stroke-width="3" fill="none"/>'
};
const COLORS={
 fish:['#cde9b3','#3798a5'],frog:['#cde78b','#4b9974'],bird:['#fff7dc','#c4d3d0'],
 lizard:['#c3df87','#649e8f'],beetle:['#c4c36b','#457f73'],mouse:['#f6e2bc','#ab8a6f'],
 monkey:['#d3bc93','#866b56'],butterfly:['#e9cc95','#b67977'],dragonfly:['#d3eee3','#8ebfd6']
};
let nextId=0;
function createSprite(type){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 const gid='zooG'+(++nextId),colors=COLORS[type]||COLORS.fish;
 svg.setAttribute('viewBox','0 0 140 140');svg.setAttribute('aria-hidden','true');
 svg.innerHTML='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="'+colors[0]+'"/><stop offset="1" stop-color="'+colors[1]+'"/></linearGradient></defs>'
  +(CAMEO[type]||CAMEO.fish).replaceAll('url(#g)','url(#'+gid+')');
 return svg;
}
function spawn(stage,type,x,y,order,enter){
 if(!stage||!stage.isConnected)return;
 const holder=document.createElement('span');
 holder.className='zoo-visitor zoo-visitor--'+type+' zoo-visitor--'+(order%2?'b':'a');
 holder.style.left=x+'%';holder.style.top=y+'%';
 holder.append(createSprite(type));stage.append(holder);
 if(enter){holder.classList.add('is-active');}else {
   // Changes only presentation. Co-op game state is driven by authoritative button clicks.
   requestAnimationFrame(()=>holder.classList.add('is-active'));
 }
}
function stage(area,animal,round){
 const candidates=VISIT[animal];
 if(!candidates||!area)return;
 const v=candidates[round%candidates.length];
 if(v){spawn(area,v[0],v[1],v[2],v[3],false);}
}
function react(area,animal,round){
 const candidates=VISIT[animal];if(!candidates||!area)return;
 const current=candidates[round%candidates.length];
 const other=candidates[(round+1)%candidates.length];
 if(other)spawn(area,other[0],other[1],other[2],other[3],true);
 const visitors=area.querySelectorAll('.zoo-visitor');
 visitors.forEach(v=>v.classList.add('is-excited'));
}
function reward({animal,scene,task,fact}){
 const spec=P[animal];if(!spec||!scene)return;
 scene.replaceChildren();
 const wrap=document.createElement('figure');wrap.className='zoo-photo-reward';wrap.id='zooPhotoReward';
 wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Награда — фотография настоящего животного');
 wrap.style.setProperty('--zoo-photo-backdrop','url("images/zoo-reward-'+animal+'.webp")');
 const image=document.createElement('img');image.className='zoo-photo-image';
 image.alt=spec[0]+'. Настоящая фотография из Wikimedia Commons.';
 image.src='images/zoo-reward-'+animal+'.webp';
 image.decoding='async';image.loading='eager';
 let fallback=0;
 image.addEventListener('error',()=>{
  if(fallback++) {image.style.display='none';wrap.classList.add('is-missing');return;}
  image.src='https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(spec[3])+'?width=1100';
 });
 wrap.append(image);
 const info=document.createElement('figcaption');info.className='zoo-photo-caption';
 const title=document.createElement('strong');title.className='zoo-photo-title';title.textContent=spec[0];info.append(title);
 const detail=document.createElement('span');detail.className='zoo-photo-fact';detail.textContent=spec[4];info.append(detail);
 const attr=document.createElement('span');attr.className='zoo-photo-credits';
 const source=document.createElement('a');source.href='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(spec[3]);
 source.target='_blank';source.rel='noopener noreferrer';source.textContent='Фото: '+spec[1];attr.append(source);
 attr.append(document.createTextNode(' · '));
 const license=document.createElement('a');license.href=LICENSE[spec[2]];
 license.target='_blank';license.rel='noopener noreferrer';license.textContent=spec[2];attr.append(license);
 info.append(attr);wrap.append(info);scene.append(wrap);
 if(task)task.textContent='Фото-награда: настоящее животное!';
 if(fact)fact.classList.add('hidden');
}
window.TivvigZooLife=Object.freeze({stage,react,reward,photos:P});
})();
