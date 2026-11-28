(()=>{
  const $ = s => document.querySelector(s);
  const scene = $('#scene');
  const task = $('#task');
  const fact = $('#fact');
  const progress = $('#progress');
  const controls = $('#controls');
  const restartBtn = $('#restart');
  const mapBtn = $('#mapBtn');
  const animal = document.body.dataset.animal;
  const state = {round:0, score:0, done:false, busy:false, picks:[], mode:'day'};
  const facts = {
    ibis:'Ибис ищет пищу длинным клювом в мелкой воде и иле.',
    camel:'У верблюда широкие ступни для песка, длинные ресницы и горб с жиром.',
    fennec:'Фенек активен ночью, а огромные уши помогают ему слышать добычу под песком.',
    baboon:'Павианы живут семьями и часто чистят шерсть друг другу — так они дружат.',
    cobra:'Кобра может расправлять капюшон как предупреждение. Змее нужны тёплые и прохладные места.',
    hippo:'Днём бегемот часто сидит в воде, а ночью выходит на сушу щипать траву.',
    crocodile:'У крокодила глаза и ноздри сверху головы, поэтому он может прятаться почти целиком в воде.'
  };
  const titles = {
    ibis:'Священный ибис', camel:'Одногорбый верблюд', fennec:'Фенек', baboon:'Павиан', cobra:'Египетская кобра', hippo:'Бегемот', crocodile:'Нильский крокодил'
  };
  function clearScene(){ scene.innerHTML=''; }
  function setTask(t){ task.textContent=t; }
  function drawProgress(total){ progress.innerHTML=''; for(let i=0;i<total;i++){ const d=document.createElement('span'); d.className='dot'+(i<state.score?' on':''); progress.append(d);} }
  function complete(){
    state.done=true; fact.textContent=facts[animal]; fact.classList.remove('hidden'); controls.classList.remove('hidden'); setTask('Отлично! Задание выполнено.');
  }
  function addBase(bg='default'){
    const sky=document.createElement('div'); sky.className='sky';
    const dunes=document.createElement('div'); dunes.className='dunes';
    scene.append(sky,dunes);
    if(bg==='river'){ const r=document.createElement('div'); r.className='river'; scene.append(r); }
    const inner=document.createElement('div'); inner.className='scene-inner'; scene.append(inner); return inner;
  }
  function makeAnimal(x,y,emoji,size,extra=''){
    const d=document.createElement('div'); d.className='animal '+extra; d.style.left=x; d.style.top=y; d.style.fontSize=size; d.textContent=emoji; return d;
  }
  function good(btn){ if(state.busy||state.done)return false; state.score++; state.busy=true; btn?.classList.add('ok'); return true; }
  function bad(btn){ btn?.classList.add('bad'); setTimeout(()=>btn?.classList.remove('bad'),340); }
  function next(total, rerender){ if(state.score>=total){ setTimeout(()=>{state.busy=false;complete();},250); } else { setTimeout(()=>{state.busy=false;rerender();},360); } }

  function initIbis(){
    const total=3; drawProgress(total); clearScene(); const inner=addBase('river');
    // Do not cover the original painted river with a synthetic pond.
    const ibis = makeAnimal('10%','42%','🕊️','96px'); inner.append(ibis);
    const found = new Set(state.picks);
    const spots=[{l:34,t:47,w:14,h:32},{l:49,t:45,w:14,h:31},{l:65,t:46,w:14,h:32},{l:79,t:45,w:13,h:32}];
    const prey = [1,2,3];
    spots.forEach((p,i)=>{ const reed=document.createElement('button'); reed.id='zoo-ibis-'+i; reed.className='tap reed'; reed.style.left=p.l+'%'; reed.style.top=p.t+'%'; reed.style.width=p.w+'%'; reed.style.height=p.h+'%'; reed.ariaLabel='Камыш'; reed.onclick=()=>{
      if(state.busy||state.done||found.has(i))return;
      if(prey.includes(i)){ state.picks.push(i); good(reed); const star=document.createElement('div'); star.textContent='🦐'; star.style.cssText=`position:absolute;left:${p.l+4}%;top:${p.t+20}%;font-size:32px`; inner.append(star); }
      else bad(reed);
      drawProgress(total); next(total, initIbis);
    }; inner.append(reed); });
    setTask(state.score? 'Найди ещё еду под водой.' : 'Помоги ибису найти 3 кусочка еды под камышами.');
  }

  function initCamel(){
    const needed = ['💧','🧺','🧣'];
    if(state.round===0) state.picks=[];
    clearScene(); drawProgress(3); const inner=addBase();
    inner.append(makeAnimal('58%','32%','🐪','124px'));
    const tent=document.createElement('div'); tent.className='rock'; tent.style.cssText='left:70%;top:28%;width:18%;height:15%;border-radius:0;clip-path:polygon(0 100%,50% 0,100% 100%)'; inner.append(tent);
    const items=['💧','🍉','🧺','🪨','🧣','🧸'];
    items.forEach((it,i)=>{ const b=document.createElement('button'); b.id='zoo-camel-'+i; b.className='crate'; b.setAttribute('aria-label','Вещь '+it); b.style.cssText=`left:${10 + (i%3)*22}%;top:${52 + Math.floor(i/3)*18}%;width:16%;height:14%;position:absolute;font-size:44px`; b.textContent=it; b.onclick=()=>{
      if(state.done||state.picks.includes(it)) return;
      if(needed.includes(it) && state.picks.length<3){ state.picks.push(it); b.style.opacity='.35'; state.score=state.picks.length; b.classList.add('ok'); }
      else bad(b);
      drawProgress(3); if(state.picks.length===3) { state.done=true; complete(); }
      else setTask('Выбери ещё вещи для пустыни.');
    }; inner.append(b); });
    const note=document.createElement('div'); note.className='panel-card'; note.style.cssText='left:8%;top:9%;width:32%;position:absolute'; note.innerHTML='<h2>Собираем караван</h2><p>Нужны вода, корзина с финиками и платок от песка.</p>'; inner.append(note);
    setTask('Помоги верблюду собрать 3 нужные вещи.');
  }

  function initFennec(){
    const total=4; drawProgress(total); clearScene(); const inner=addBase();
    const moon=document.createElement('div'); moon.className='sun'; moon.style.cssText='right:8%;top:8%;transform:scale(.75);background:radial-gradient(circle at 35% 35%,#fffbe7,#fff4a8 60%,#dcbf67)'; inner.append(moon);
    inner.append(makeAnimal('46%','22%','🦊','96px'));
    const target=[1,0,2,1][state.score%4]; state.round = target; // Deterministic across both Firebase clients.
    [20,46,72].forEach((left, idx)=>{
      const hole=document.createElement('button'); hole.id='zoo-fennec-'+idx; hole.className='tap burrow sand'; hole.setAttribute('aria-label','Норка '+(idx+1)); hole.style.cssText=`left:${left}%;top:55%;width:18%;height:20%`; hole.onclick=()=>{ if(state.busy||state.done)return; if(idx===target){ good(hole); drawProgress(total); next(total, initFennec); } else { bad(hole); } }; inner.append(hole);
      if(idx===target){ const pulse=document.createElement('div'); pulse.className='ripple'; pulse.style.cssText=`left:${left+4}%;top:58%;width:72px;height:72px`; inner.append(pulse); const bug=document.createElement('div'); bug.textContent='🦗'; bug.style.cssText=`position:absolute;left:${left+6}%;top:68%;font-size:16px;opacity:.55`; inner.append(bug); }
    });
    setTask('Где шуршит добыча? Найди 4 раза.');
  }

  function initBaboon(){
    const total=4; clearScene(); drawProgress(total); const inner=addBase();
    inner.append(makeAnimal('16%','38%','🐒','96px'));
    inner.append(makeAnimal('68%','26%','🐒','88px'));
    const bigRock=document.createElement('div'); bigRock.className='rock'; bigRock.style.cssText='left:33%;top:26%;width:22%;height:22%'; inner.append(bigRock);
    const smallRock=document.createElement('div'); smallRock.className='rock'; smallRock.style.cssText='left:62%;top:51%;width:17%;height:14%'; inner.append(smallRock);
    const palm=document.createElement('div'); palm.className='reed'; palm.style.cssText='left:12%;top:42%;width:18%;height:30%;transform:rotate(-10deg)'; inner.append(palm);
    const cave=document.createElement('div'); cave.className='burrow'; cave.style.cssText='left:74%;top:38%;width:16%;height:18%'; inner.append(cave);
    const spots=[
      {key:'behind rock',label:'за большой скалой',x:40,y:34},
      {key:'under palm',label:'под пальмой',x:17,y:58},
      {key:'in cave',label:'в пещере',x:77,y:42},
      {key:'near small rock',label:'рядом с маленькой скалой',x:64,y:57}
    ];
    const pick=spots[state.score%spots.length];
    const baby=document.createElement('button'); baby.id='zoo-baboon-'+(state.score%spots.length); baby.className='tap zoo-trace'; baby.setAttribute('aria-label','Место малыша: '+pick.label); baby.style.cssText=`left:${pick.x}%;top:${pick.y}%;width:14%;height:16%`; baby.onclick=()=>{ if(state.busy||state.done)return; good(baby); const icon=makeAnimal(pick.x+'%',pick.y+'%','🐒','54px'); inner.append(icon); drawProgress(total); next(total, initBaboon); }; inner.append(baby);
    // decoy taps
    spots.filter(s=>s!==pick).forEach(s=>{ const d=document.createElement('button'); d.id='zoo-baboon-'+spots.indexOf(s); d.className='tap zoo-trace'; d.setAttribute('aria-label','Поиск: '+s.label); d.style.cssText=`left:${s.x}%;top:${s.y}%;width:14%;height:16%`; d.onclick=()=>bad(d); inner.append(d); });
    setTask('Где малыш павиан? Он '+pick.label+'.');
  }

  function initCobra(){
    const total=4; clearScene(); drawProgress(total); const inner=addBase();
    const sun=document.createElement('div'); sun.className='sun'; sun.style.left=(state.score%2? '72%':'12%'); sun.style.top='10%'; inner.append(sun);
    inner.append(makeAnimal('48%','42%','🐍','116px'));
    const rocks=[{x:20,label:'слева'},{x:47,label:'в центре'},{x:74,label:'справа'}];
    const safeIndex = state.score%3;
    rocks.forEach((r,i)=>{ const rock=document.createElement('button'); rock.id='zoo-cobra-'+i; rock.className='tap rock'; rock.setAttribute('aria-label','Камень '+(i+1)); rock.style.cssText=`left:${r.x}%;top:53%;width:18%;height:16%`; rock.onclick=()=>{ if(state.busy||state.done)return; if(i===safeIndex){ good(rock); drawProgress(total); next(total, initCobra); } else bad(rock);}; inner.append(rock);
      const shade=document.createElement('div'); shade.style.cssText=`position:absolute;left:${r.x+4}%;top:61%;width:11%;height:7%;border-radius:50%;background:${i===safeIndex?'#4a678a99':'#0000'}`; inner.append(shade);
    });
    setTask('Найди для кобры прохладную тень.');
  }

  function initHippo(){
    const total=4; clearScene(); drawProgress(total); const inner=addBase('river');
    state.mode = state.score%2===0 ? 'day' : 'night';
    if(state.mode==='night'){ scene.querySelector('.sky').style.background='linear-gradient(#102544 0 37%, #27486d 37% 100%)'; }
    const pool=document.createElement('div'); pool.className='pool'; pool.style.cssText='left:12%;top:48%;width:36%;height:23%'; inner.append(pool);
    const meadow=document.createElement('div'); meadow.className='rock'; meadow.style.cssText='left:60%;top:50%;width:24%;height:15%;background:linear-gradient(180deg,#96b25c,#6f8d45);border-radius:34px'; inner.append(meadow);
    const left=document.createElement('button'); left.id='zoo-hippo-water'; left.className='tap zoo-target zoo-target--water'; left.setAttribute('aria-label','Вода'); left.style.cssText='left:12%;top:42%;width:36%;height:32%';
    const right=document.createElement('button'); right.id='zoo-hippo-grass'; right.className='tap zoo-target zoo-target--grass'; right.setAttribute('aria-label','Трава'); right.style.cssText='left:58%;top:42%;width:28%;height:28%';
    left.onclick=()=> choose(true); right.onclick=()=> choose(false); inner.append(left,right);
    inner.append(makeAnimal('43%','31%','🦛','104px'));
    function choose(poolChoice){ if(state.busy||state.done)return; const ok = (state.mode==='day' && poolChoice) || (state.mode==='night' && !poolChoice); if(ok){good(poolChoice?left:right); drawProgress(total); next(total, initHippo);} else bad(poolChoice?left:right);}    
    setTask(state.mode==='day'?'День. Где бегемот любит отдыхать?':'Ночь. Куда бегемот идёт есть траву?');
  }

  function initCroc(){
    const total=4; clearScene(); drawProgress(total); const inner=addBase('river');
    const pond=document.createElement('div'); pond.className='pool'; pond.style.cssText='left:8%;top:38%;width:84%;height:42%;border-radius:34px'; inner.append(pond);
    const positions=[{x:18,y:52},{x:43,y:60},{x:72,y:48}]; const target=positions[state.score%3];
    positions.forEach((p,i)=>{ const btn=document.createElement('button'); btn.id='zoo-crocodile-'+i; btn.className='tap'; btn.setAttribute('aria-label','Найти крокодила у ряби '+(i+1)); btn.style.cssText=`left:${p.x}%;top:${p.y}%;width:18%;height:18%`; btn.onclick=()=>{ if(state.busy||state.done)return; if(i===state.score%3){ good(btn); const body=makeAnimal((p.x-2)+'%',(p.y+3)+'%','🐊','90px'); inner.append(body); drawProgress(total); next(total, initCroc);} else bad(btn); }; inner.append(btn);
      const ripple=document.createElement('div'); ripple.className='ripple'; ripple.style.cssText=`left:${p.x+2}%;top:${p.y+2}%;width:80px;height:54px;opacity:${i===state.score%3?1:.35}`; inner.append(ripple);
      if(i===state.score%3){ const eyes=document.createElement('div'); eyes.className='eyes'; eyes.style.left=(p.x+5)+'%'; eyes.style.top=(p.y+5)+'%'; eyes.innerHTML='<span></span><em></em>'; inner.append(eyes); }
    });
    setTask('Где прячется крокодил? Смотри на глаза и рябь на воде.');
  }

  const inits={ibis:initIbis,camel:initCamel,fennec:initFennec,baboon:initBaboon,cobra:initCobra,hippo:initHippo,crocodile:initCroc};
  restartBtn?.addEventListener('click', ()=>{ state.round=0; state.score=0; state.done=false; state.busy=false; state.picks=[]; fact.classList.add('hidden'); controls.classList.add('hidden'); inits[animal]?.();});
  window.TivvigZooDebug=Object.freeze({state:()=>({...state,picks:[...state.picks]}),animal});
  inits[animal]?.();
})();