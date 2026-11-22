// Hades release gate: browser load, assets, local audio unlock and real game-state checks.
// WebKit on Linux approximates Safari engine; physical iPad audio still needs a human listener.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium, webkit} from 'playwright';

const PAGES=['hades-gate.html','hades-cerberus.html','hades-charon.html',
 'hades-angler-chase.html','hades-hypnos.html','hades-hecate.html','hades-final.html'];
const VIEWS=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'ipad',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
const port=18871,url='http://127.0.0.1:'+port+'/';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let results=[],errors=[],failed=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){
 for(let i=0;i<80;i++){
  try{const r=await fetch(url);if(r.ok)return}catch{}
  await delay(100);
 }
 throw Error('Local http.server did not start');
}
async function until(fn,limit=5000){
 const start=Date.now();while(Date.now()-start<limit){if(await fn())return;await delay(50)}
 throw Error('Timed out waiting for game action');
}
async function smoke(browser,label,view,p){
 const context=await browser.newContext({...view,viewport:view.viewport,reducedMotion:'reduce',ignoreHTTPSErrors:true});
 const page=await context.newPage();const faults=[],missing=[];
 page.on('pageerror',e=>faults.push(e.message));
 page.on('response',res=>{if(res.url().startsWith(url)&&res.status()>=400)missing.push(res.status()+' '+res.url())});
 try{
  await page.goto(url+p,{waitUntil:'load',timeout:22000});
  await page.locator('#hadesLocalSound').waitFor({timeout:5000});
  assert.equal(await page.locator('#hadesLocalSound').count(),1,'Exactly one local check button');
  const engine=await page.evaluate(()=>typeof window.TivvigHadesSounds);
  assert.equal(engine,'object','Shared audio engine loaded');
  await page.locator('#hadesLocalSound').click({timeout:4000});
  await page.waitForTimeout(100);
  const state=await page.evaluate(()=>window.TivvigHadesSounds.state());
  assert.equal(state.sampleCount,4,'Four local WAV samples generated');
  assert.equal(state.unlocked,true,'Local gesture detected');
  const broken=await page.evaluate(()=>[...document.images].filter(im=>{
   if(!im.getAttribute('src')||!im.complete)return false;
   return im.naturalWidth===0;
  }).map(im=>im.getAttribute('src')));
  assert.deepEqual(broken,[],'No broken loaded image');
  assert.deepEqual(faults,[],'No uncaught JavaScript errors');
  assert.deepEqual(missing,[],'No local HTTP 404');
  results.push({browser:label,view:view.name,page:p,sound:state.ready?'WAV':'WebAudio fallback/needs local listener',images:'ok',runtime:'ok'});
  console.log('PASS',label,view.name,p,'audio',JSON.stringify(state));
 }finally{await context.close()}
}

async function syllableBridgeTest(browser,label){
 const context=await browser.newContext({viewport:{width:1024,height:768},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage(),faults=[];
 page.on('pageerror',e=>faults.push(e.message));
 try{
  await page.goto(url+'hades-final.html',{waitUntil:'load'});
  await page.evaluate(()=>TivvigHadesDebug.stage(2));
  const rounds=await page.evaluate(()=>TivvigHadesDebug.data().words);
  assert.equal(rounds.length,3,'Three short sentences remain');
  for(const sentence of rounds){
   assert.equal(sentence.syllables.length,3,'Three words per sentence');
   assert.ok(sentence.syllables.every(parts=>parts.length===2),'All words split into two syllables');
   assert.deepEqual(sentence.syllables.map(parts=>parts.join('')),sentence.sentence,'Syllables reconstruct original display words');
  }
  assert.equal(await page.locator('.word-options button').count(),2,'Only two syllables on screen');
  await page.getByRole('button',{name:'Слог ЛА',exact:true}).click();
  assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().wordStep),1);
  assert.equal(await page.locator('.word-step.partial').count(),1,'First syllable is shown on an unfinished stone');
  await page.getByRole('button',{name:'Слог ДА',exact:true}).click();
  assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().bridgeCount),1,'One whole word makes one bridge stone');
  for(let round=0;round<3;round++){
   const start=round===0?2:0;
   for(let step=start;step<6;step++){
    const syllable=rounds[round].syllables[Math.floor(step/2)][step%2];
    assert.equal(await page.locator('.word-options button').count(),2,'Always only two choices');
    const buttons=page.locator('.word-options button');
    const labels=await buttons.allTextContents();
    assert.ok(labels.includes(syllable),'Current syllable is a visible choice');
    const active=page.getByRole('button',{name:'Слог '+syllable,exact:true});
    const bounds=await active.boundingBox();
    assert.ok(bounds?.width>=75&&bounds?.height>=60,'Readable touch target');
    await active.click();
    if(step===5){
     await until(()=>page.evaluate(expected=>{
      const x=TivvigHadesDebug.state();
      return x.stage===3||x.wordRound===expected;
     },round+1),7000);
    }else{
     const expectedStep=step+1;
     await until(()=>page.evaluate(expected=>TivvigHadesDebug.state().wordStep===expected,expectedStep),2000);
    }
   }
   assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().bridgeCount),3*(round+1),'Exactly three stones built per sentence');
  }
  assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().stage),3,'Syllable bridge leads to fire clocks');
  assert.deepEqual(faults,[],'No JS errors in syllable puzzle');
  console.log('PASS',label,'18 syllables, nine bridge stones and next stage on iPad');
 }finally{await context.close()}
}

async function finalTest(browser,label){
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 const faults=[];page.on('pageerror',e=>faults.push(e.message));
 try{
  await page.goto(url+'hades-final.html',{waitUntil:'load'});
  await page.locator('#hadesLocalSound').click();
  await page.evaluate(()=>window.TivvigHadesDebug.stage(1));
  await page.locator('#hades-listen').click();
  await until(()=>page.evaluate(()=>window.TivvigHadesDebug.state().listened),8000);
  const sequence=(await page.evaluate(()=>window.TivvigHadesDebug.data())).beats[0];
  for(const symbol of sequence)await page.evaluate(s=>window.TivvigHadesDebug.hit(s),symbol);
  await until(()=>page.evaluate(()=>window.TivvigHadesDebug.state().rhythmRound===1),4000);
  await page.evaluate(()=>window.TivvigHadesDebug.stage(4));
  await page.locator('#hades-listen').click();
  await until(()=>page.evaluate(()=>window.TivvigHadesDebug.state().songReady),8000);
  const melody=(await page.evaluate(()=>window.TivvigHadesDebug.data())).song;
  for(const symbol of melody)await page.evaluate(s=>window.TivvigHadesDebug.hit(s),symbol);
  await until(()=>page.evaluate(()=>window.TivvigHadesDebug.state().finalDone),4000);
  await until(async()=>await page.locator('#finale').evaluate(el=>!el.hidden),4000);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_hades_persephone_freed_v1')),'unlocked');
  for(const src of ['images/hades-persephone-freedom.webp','images/lada-cutout.webp','images/hecate-lyre-costume-layer.webp']){
    assert(await page.locator('#finale img[src="'+src+'"]').count()>0,'Reward source missing '+src);
  }
  assert.deepEqual(faults,[],'Final rhythm errors');
  await page.locator('#replayAll').click();
  assert.equal(await page.evaluate(()=>window.TivvigHadesDebug.state().stage),0);
  assert.equal(await page.locator('#finale').isHidden(),true);
  console.log('PASS',label,'final melody, reward, original Lada, replay');
 }finally{await context.close()}
}
async function coOpTest(browser,label){
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.goto(url+'hades-gate.html',{waitUntil:'load'});
  await page.setContent(`<!doctype html><title>Parent mirror harness</title><iframe id="game" style="width:1000px;height:700px" src="${url}hades-gate.html?coop=1&amp;role=student&amp;seed=release"></iframe><script>window.moves=[];window.addEventListener('message',e=>{if(e.data?.from==='tivvig-world'&&e.data?.type==='click')window.moves.push(e.data.value.selector)});</script>`);
  const frame=page.frameLocator('#game');
  await frame.locator('#hadesLocalSound').waitFor({timeout:6000});
  await frame.locator('#hadesLocalSound').click();
  await page.waitForTimeout(300);
  const moves=await page.evaluate(()=>window.moves);
  assert.deepEqual(moves,[],'Audio check must not replicate into Firebase room');
  console.log('PASS',label,'co-op local-only sound');
 }finally{await context.close()}
}

const NEXT_PAGES=[
 ['hades-gate.html','hades-cerberus.html'],
 ['hades-cerberus.html','hades-charon.html'],
 ['hades-charon.html','hades-angler-chase.html'],
 ['hades-angler-chase.html','hades-hypnos.html'],
 ['hades-hypnos.html','hades-hecate.html'],
 ['hades-hecate.html','hades-final.html']
];
async function skipNavigationTest(browser,label){
 const context=await browser.newContext({viewport:{width:1024,height:768},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage(),faults=[];page.on('pageerror',e=>faults.push(e.message));
 try{
  for(const [start,next] of NEXT_PAGES){
   await page.goto(url+start,{waitUntil:'load'});
   const skip=page.locator('#hadesSkipPage');
   assert.equal(await skip.count(),1,start+' skip link exists');
   assert.ok((await skip.innerText()).includes('Пропустить'),'Skip text visible on '+start);
   const box=await skip.boundingBox();
   assert.ok(box&&box.width>=85&&box.height>=37,'Touch target for '+start);
   assert.ok((await skip.getAttribute('href')).endsWith(next),'No chapters omitted after '+start);
   if(start==='hades-hecate.html'){
    await page.evaluate(()=>{
     localStorage.setItem('tivvig_hades_journey_stage_v1','4');
     localStorage.setItem('tivvig_hades_persephone_freed_v1','unlocked');
    });
   }
   await skip.click({timeout:6500});
   await page.waitForURL(url+next,{timeout:9000});
  }
  // Regression: after a previously completed journey, Hecate must lead to Hades,
  // not reopen the Persephone ending stored in localStorage.
  await page.waitForFunction(()=>!!window.TivvigHadesDebug);
  assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().stage),0,'Hecate leads to the first Hades trial even when the ending was already saved');
  assert.equal(await page.locator('#finale').isVisible(),false,'Previously unlocked Persephone reward does not cover the palace');
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_hades_journey_stage_v1')),'0','Fresh palace entry resets only the resume pointer');
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_hades_persephone_freed_v1')),'unlocked','Existing prize stays unlocked');
  await page.evaluate(()=>localStorage.removeItem('tivvig_hades_persephone_freed_v1'));
  await page.goto(url+'hades-final.html',{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.TivvigHadesDebug);
  await page.evaluate(()=>window.TivvigHadesDebug.reset());
  for(let i=0;i<4;i++){
   assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().stage),i);
   assert.equal(await page.locator('#hadesSkipTrial').isVisible(),true,'Palace skip button visible');
   await page.locator('#hadesSkipTrial').click();
   assert.equal(await page.evaluate(()=>TivvigHadesDebug.state().stage),i+1,'Palace advances one mini-game');
   assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_hades_journey_stage_v1')),String(i+1),'Skipped chapter resume preserved');
   assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_hades_persephone_freed_v1')),null,'Skipping does not grant Persephone finale');
  }
  assert.equal(await page.locator('#hadesSkipTrial').isVisible(),false,'Last chapter uses direct next location');
  assert.equal(await page.locator('#hadesSkipPalace').isVisible(),true);
  await page.locator('#hadesSkipPalace').click();
  await page.waitForURL(url+'egypt-apophis.html',{timeout:9000});
  assert.deepEqual(faults,[],'No errors while skipping');
  console.log('PASS',label,'skip every Hades page and all four palace minigames');
 }finally{await context.close()}
}
async function skipCoopTest(browser,label){
 const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const page=await context.newPage();
 try{
  await page.goto(url+'index.html');
  await page.evaluate(base=>{
   window.hadesSkipRelay=[];
   window.addEventListener('message',e=>{
    if(e.data?.from!=='tivvig-world')return;
    window.hadesSkipRelay.push(e.data);
    if(e.data.type==='click')for(const f of document.querySelectorAll('iframe[data-hades-skip-test]')){
     f.contentWindow.postMessage({from:'tivvig-parent',type:'click',value:e.data.value},location.origin);
    }
   });
   for(const role of ['teacher','student']){
    const f=document.createElement('iframe');
    f.dataset.hadesSkipTest=role;f.id='hades-skip-'+role;
    f.src=base+'hades-final.html?coop=1&role='+role+'&seed=skip-test';
    f.style.cssText='width:1024px;height:720px;display:block';
    document.body.appendChild(f);
   }
  },url);
  const student=page.frameLocator('#hades-skip-student');
  await student.locator('#hadesSkipTrial').waitFor({timeout:10000});
  await page.waitForFunction(()=>window.hadesSkipRelay.filter(e=>e.type==='ready').length>=2,{timeout:15000});
  await student.locator('#hadesSkipTrial').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('iframe[data-hades-skip-test]')].every(f=>f.contentWindow?.TivvigHadesDebug?.state().stage===1),{timeout:9000});
  // Both devices should begin the palace at Hades when coming from Hecate,
  // even if their previous Persephone ending was unlocked.
  await page.evaluate(base=>{
   localStorage.setItem('tivvig_hades_journey_stage_v1','4');
   localStorage.setItem('tivvig_hades_persephone_freed_v1','unlocked');
   for(const f of document.querySelectorAll('iframe[data-hades-skip-test]')){
    const role=f.dataset.hadesSkipTest;
    f.src=base+'hades-hecate.html?coop=1&role='+role+'&seed=skip-test';
   }
  },url);
  await page.waitForFunction(()=>[...document.querySelectorAll('iframe[data-hades-skip-test]')].every(f=>!!f.contentWindow?.document.getElementById('hecateScene')),{timeout:10000});
  await page.evaluate(base=>{
   for(const f of document.querySelectorAll('iframe[data-hades-skip-test]')){
    f.src=base+'hades-final.html?coop=1&role='+f.dataset.hadesSkipTest+'&seed=skip-test';
   }
  },url);
  await page.waitForFunction(()=>[...document.querySelectorAll('iframe[data-hades-skip-test]')].every(f=>f.contentWindow?.TivvigHadesDebug?.state().stage===0),{timeout:10000});
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('iframe[data-hades-skip-test]')].map(f=>f.contentWindow?.document.getElementById('finale').hidden)),[true,true],'Neither device starts on the Persephone ending');
  console.log('PASS',label,'palace chapter skip and Hecate-to-Hades entry mirrored on both devices');
 }finally{await context.close()}
}

try{
 await ready();
 for(const [label,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const v of VIEWS)for(const p of PAGES){
    try{await smoke(browser,label,v,p)}
    catch(e){failed=true;errors.push(label+' '+v.name+' '+p+': '+e.message);console.error('FAIL',errors.at(-1))}
   }
   try{await finalTest(browser,label)}catch(e){failed=true;errors.push(label+' final: '+e.stack);console.error('FAIL',errors.at(-1))}
   try{await syllableBridgeTest(browser,label)}catch(e){failed=true;errors.push(label+' syllables: '+e.stack);console.error('FAIL',errors.at(-1))}
   try{await coOpTest(browser,label)}catch(e){failed=true;errors.push(label+' coop: '+e.stack);console.error('FAIL',errors.at(-1))}
   try{await skipNavigationTest(browser,label)}catch(e){failed=true;errors.push(label+' skip: '+e.stack);console.error('FAIL',errors.at(-1))}
   try{await skipCoopTest(browser,label)}catch(e){failed=true;errors.push(label+' skip-coop: '+e.stack);console.error('FAIL',errors.at(-1))}
  }finally{await browser.close()}
 }
}finally{
 server.kill();fs.writeFileSync('hades-test-results.json',JSON.stringify({tested:results.length,results,errors},null,2));
}
console.log('BROWSER CASES',results.length,'ERRORS',errors.length);
if(failed)process.exitCode=1;
