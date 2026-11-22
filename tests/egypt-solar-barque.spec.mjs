import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18930,BASE=`http://127.0.0.1:${PORT}/`;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true},
 {name:'landscape',viewport:{width:844,height:390},hasTouch:true,isMobile:true}
];
let passed=0;const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return}catch{}await sleep(100)}throw Error('Local server did not start')}
async function solo(browser,browserName,profile){
 const context=await browser.newContext({...profile,reducedMotion:'reduce'});
 const page=await context.newPage(),pageErrors=[],missing=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&/(\/images\/|egypt-solar-barque|wardrobe\.js)/.test(r.url()))missing.push(r.url())});
 await page.goto(BASE+'egypt-solar-barque.html');
 await page.waitForFunction(()=>!!window.TivvigSolarDebug&&!!window.TivvigWardrobe,{timeout:10000});
 const backdrop=await page.locator('.backdrop').evaluate(el=>({ok:el.complete,width:el.naturalWidth,height:el.naturalHeight}));
 assert.deepEqual(backdrop,{ok:true,width:1672,height:941},'AI backdrop loaded at original quality');
 assert.equal(await page.locator('#solarLada [data-outfit-layer]').count(),1,'Lada has working wardrobe layer');
 const sound=page.locator('[data-tivvig-local-audio]');await sound.first().waitFor({timeout:10000});
 assert.equal(await page.locator('.sun-point').count(),3);
 await page.locator('#solarAction').click();
 assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().stage),'sky');
 await page.locator('#solar-sun-2').click();
 assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().errors),1,'Wrong position does not advance');
 for(let i=0;i<3;i++)await page.locator('#solar-sun-'+i).click();
 assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().sunRound),3,'Sun travels east-noon-west');
 await page.locator('#solarAction').click();
 assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().stage),'shadows');
 for(let i=0;i<3;i++){
  await page.locator('#solar-sun-'+i).click();
  assert.equal(await page.locator('#solarShadow').getAttribute('data-sun'),String(i));
  assert.equal(await page.locator('#solarShadow').evaluate(el=>getComputedStyle(el).opacity),'0.95','Sun position changes shadow');
  if(i===0){await page.locator('#solar-shadow-1').click();assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().shadowDone),false,'Wrong shadow does not advance')}
  await page.locator('#solar-shadow-'+i).click();
  assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().shadowDone),true,'Correct shadow accepted');
  await page.locator('#solarAction').click();
 }
 assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().stage),'gates','Night follows the sunset');
 assert.equal(await page.locator('#solarScene').getAttribute('data-time'),'night');
 for(const [i,count] of [3,4,5].entries()){
  assert.equal(await page.locator('.syllable').count(),6,'six large syllable tiles');
  let previous=await page.evaluate(()=>TivvigSolarDebug.state().gatePos);
  await page.locator('#solar-syllable-'+[1,2,2][i]).click(); // Can be wrong or correct; if wrong no progression
  assert.ok((await page.evaluate(()=>TivvigSolarDebug.state().gatePos))>=previous);
  for(let n=0;n<9;n++){
   if((await page.evaluate(()=>TivvigSolarDebug.state().gatePos))===count)break;
   await page.evaluate(()=>TivvigSolarDebug.advance());
  }
  assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().gatePos),count,'Syllables are assembled');
  assert.equal(await page.locator('#solar-gate-'+i).isEnabled(),true,'Gate becomes clickable after reading');
  await page.locator('#solar-gate-'+i).click();
 }
 const state=await page.evaluate(()=>TivvigSolarDebug.state());
 assert.equal(state.stage,'done','All gates lead to the sunrise');
 assert.equal(state.correct,18,'Every educational step completed');
 assert.equal(state.reward,true,'Amulet stored');
 assert.deepEqual(state.gateOpen,[true,true,true],'Three gates opened');
 assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_ra_solar_amulet_v1')),'unlocked');
 assert.equal(await page.locator('#solarReward').isVisible(),true);
 assert.equal(await page.locator('#solarReward img').evaluate(el=>el.complete&&el.naturalWidth>200),true);
 assert.deepEqual(pageErrors,[],pageErrors.join('\n'));
 assert.deepEqual(missing,[],missing.join('\n'));
 await page.locator('#solarAction').click();
 assert.equal(await page.evaluate(()=>TivvigSolarDebug.state().stage),'intro','Replay resets the game');
 await context.close();passed++;console.log('PASS',browserName,profile.name,'solar barque');
}
async function coOp(browser,name){
 const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const page=await ctx.newPage(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto(BASE+'index.html');
 await page.evaluate(base=>{
  window.solarRelay=[];
  window.addEventListener('message',e=>{
   if(e.data?.from!=='tivvig-world')return;
   window.solarRelay.push(e.data);
   if(e.data.type==='click'){
    for(const frame of document.querySelectorAll('iframe[data-solar-test]')){
     frame.contentWindow.postMessage({from:'tivvig-parent',type:'click',value:e.data.value},location.origin);
    }
   }
  });
  for(const role of ['teacher','student']){
   const frame=document.createElement('iframe');frame.id='solar-coop-'+role;frame.dataset.solarTest=role;
   frame.src=base+'egypt-solar-barque.html?coop=1&role='+role+'&seed=test';
   frame.style.cssText='width:920px;height:580px;display:block';document.body.append(frame);
  }
 },BASE);
 const teacher=page.frameLocator('#solar-coop-teacher'),student=page.frameLocator('#solar-coop-student');
 await teacher.locator('#solarAction').waitFor();await student.locator('#solarAction').waitFor();
 await page.waitForFunction(()=>window.solarRelay?.filter(x=>x.type==='ready').length>=2,{timeout:15000});
 await teacher.locator('#solarAction').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-solar-test]')).every(f=>f.contentWindow?.TivvigSolarDebug?.state().stage==='sky'),{timeout:9000});
 await student.locator('#solar-sun-0').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-solar-test]')).every(f=>f.contentWindow?.TivvigSolarDebug?.state().sunRound===1),{timeout:9000});
 await teacher.locator('#solar-sun-1').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-solar-test]')).every(f=>f.contentWindow?.TivvigSolarDebug?.state().sunRound===2),{timeout:9000});
 await student.locator('#solar-sun-2').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-solar-test]')).every(f=>f.contentWindow?.TivvigSolarDebug?.state().sunRound===3),{timeout:9000});
 const states=await page.evaluate(()=>Array.from(document.querySelectorAll('iframe[data-solar-test]')).map(f=>f.contentWindow.TivvigSolarDebug.state()));
 assert.deepEqual(states.map(x=>x.correct),[3,3],'Both devices receive authoritative progress');
 assert.deepEqual(pageErrors,[]);
 await ctx.close();passed++;console.log('PASS',name,'solar barque 2-player synchronisation');
}
try{
 await waitForServer();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{for(const p of profiles)try{await solo(browser,name,p)}catch(e){errors.push(name+' '+p.name+': '+e.stack)}
      try{await coOp(browser,name)}catch(e){errors.push(name+' co-op: '+e.stack)}
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('SOLAR BARQUE:',passed,'passed,',errors.length,'failed');errors.forEach(e=>console.error('FAIL',e));if(errors.length)process.exitCode=1;