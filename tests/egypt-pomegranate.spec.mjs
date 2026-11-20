/* Egypt: memory cards, golden snakes, portal. Chromium + WebKit on desktop/tablet/phone. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18873, URL=`http://127.0.0.1:${PORT}/`;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const failures=[];let passed=0;
async function serverReady(){for(let i=0;i<100;i++){try{if((await fetch(URL)).ok)return}catch{}await sleep(100)}throw Error('HTTP unavailable')}
async function checkGame(browser,engine,profile){
 const context=await browser.newContext({...profile,reducedMotion:'reduce'});
 const page=await context.newPage();const faults=[],missing=[];
 page.on('pageerror',e=>faults.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(URL)&&r.status()>=400)missing.push(r.url()+':'+r.status())});
 try{
  await page.goto(URL+'egypt-pomegranate.html',{waitUntil:'load',timeout:20000});
  await page.locator('#hadesLocalSound').waitFor({timeout:8000});
  assert.equal(await page.locator('.real-lada img[src="images/lada-cutout.webp"]').count(),2,'Original Lada head and body');
  assert.equal(await page.locator('.real-lada img[src="images/hecate-lyre-costume-layer.webp"]').count(),1);
  assert.equal(await page.locator('.zmeya .snake-shape').count(),3,'Three golden snakes');
  assert.equal(await page.locator('#memoryBoard').isHidden(),true,'Memory board initially hidden');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.portal-view')).opacity),'0','Portal initially closed');
  assert.equal(await page.evaluate(()=>window.TivvigPomegranateDebug.state().phase),'intro');
  await page.locator('#hadesLocalSound').click({timeout:5000});
  const audio=await page.evaluate(()=>window.TivvigHadesSounds.state());
  assert.equal(audio.unlocked,true);assert.equal(audio.sampleCount,4);
  await page.locator('#memoryStart').click({timeout:4000});
  assert.equal(await page.locator('.memory-card').count(),16,'8 pairs');
  assert.equal(await page.locator('.memory-card.revealed').count(),16,'All initially visible');
  assert.equal(await page.locator('.memory-card .memory-art').count(),16,'All have images');
  const initial=await page.evaluate(()=>window.TivvigPomegranateDebug.state());
  assert.equal(initial.phase,'memorize');
  const counts={};for(const c of initial.cards)counts[c.key]=(counts[c.key]||0)+1;
  assert.equal(Object.keys(counts).length,8);assert(Object.values(counts).every(x=>x===2));
  const imgs=await page.evaluate(()=>[...document.images].filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.getAttribute('src')));
  assert.deepEqual(imgs,[],'Original artwork loads');
  await page.evaluate(()=>window.TivvigPomegranateDebug.close());
  await page.waitForFunction(()=>window.TivvigPomegranateDebug.state().phase==='play',null,{timeout:4000});
  assert.equal(await page.locator('.memory-card.revealed').count(),0,'Golden snakes close every card');
  const data=(await page.evaluate(()=>window.TivvigPomegranateDebug.state())).cards;
  const groups=new Map();data.forEach((c,i)=>{if(!groups.has(c.key))groups.set(c.key,[]);groups.get(c.key).push(i)});
  const pairs=[...groups.values()];
  // An incorrect pair must close again after the brief memory pause.
  await page.locator('#memory-card-'+pairs[0][0]).click({force:true});
  await page.locator('#memory-card-'+pairs[1][0]).click({force:true});
  await page.waitForFunction(()=>window.TivvigPomegranateDebug.state().selected.length===0,null,{timeout:3000});
  assert.equal(await page.locator('.memory-card.revealed').count(),0,'Mismatch returns face down');
  // Every correct pair remains visible.
  for(const [a,b] of pairs){
   await page.locator('#memory-card-'+a).click({force:true,timeout:6000});
   await page.locator('#memory-card-'+b).click({force:true,timeout:6000});
  }
  await page.waitForFunction(()=>window.TivvigPomegranateDebug.state().phase==='done',null,{timeout:4000});
  assert.equal(await page.locator('.memory-card.matched').count(),16);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_pomegranate_portal_v1')),'unlocked','Reward saved');
  assert.equal(await page.locator('#memoryFinish').isVisible(),true);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.portal-view')).opacity),'1','Portal opens only after success');
  await page.locator('#memoryReplay').click();
  assert.equal(await page.evaluate(()=>window.TivvigPomegranateDebug.state().phase),'intro');
  assert.equal(await page.locator('#memoryBoard').isHidden(),true);
  assert.deepEqual(faults,[],'No JavaScript exceptions');assert.deepEqual(missing,[],'No missing assets');
  passed++;console.log('PASS',engine,profile.name,'16 true-art cards, 8 pairs, snakes, iOS sound, portal, reward, replay');
 }finally{await context.close()}
}
async function checkCoop(browser,name){
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.goto(URL+'index.html',{waitUntil:'domcontentloaded'});
  await page.setContent(`<iframe id="game" src="${URL}egypt-pomegranate.html?coop=1&amp;role=student&amp;seed=test" style="width:1024px;height:740px"></iframe><script>window.moves=[];addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.moves.push(e.data)})</script>`);
  const frame=page.frameLocator('#game');await frame.locator('#hadesLocalSound').waitFor({timeout:8000});
  await frame.locator('#hadesLocalSound').click();await page.waitForTimeout(160);
  assert.equal(await page.evaluate(()=>window.moves.filter(x=>x.type==='click').length),0,'Audio is local');
  await frame.locator('#memoryStart').click();
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='click'&&x.value?.selector==='#memoryStart'),null,{timeout:5000});
  assert.equal(await frame.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().phase),'intro','Room is authoritative');
  await page.evaluate(()=>document.getElementById('game').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#memoryStart'}},location.origin));
  await frame.locator('#memory-card-0').waitFor({state:'visible',timeout:5000});
  await frame.locator('body').evaluate(()=>window.TivvigPomegranateDebug.close());
  await frame.locator('body').evaluate(()=>new Promise(resolve=>{const check=()=>window.TivvigPomegranateDebug.state().phase==='play'?resolve():setTimeout(check,40);check()}));
  await frame.locator('#memory-card-0').click({force:true});
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='click'&&x.value?.selector==='#memory-card-0'),null,{timeout:5000});
  assert.equal((await frame.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().selected)).length,0,'No premature client action');
  await page.evaluate(()=>document.getElementById('game').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#memory-card-0'}},location.origin));
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='actionApplied'&&x.value?.selector==='#memory-card-0'),null,{timeout:5000});
  assert.deepEqual(await frame.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().selected),[0]);
  console.log('PASS',name,'Firebase authoritative card flip and local-only sound');
 }finally{await context.close()}
}
try{
 await serverReady();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const profile of profiles)try{await checkGame(browser,name,profile)}catch(e){failures.push(name+' '+profile.name+' '+e.stack);console.error('FAIL',failures.at(-1))}
   try{await checkCoop(browser,name)}catch(e){failures.push(name+' coop '+e.stack);console.error('FAIL',failures.at(-1))}
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('POMEGRANATE MEMORY TESTS:',passed,'FAILURES:',failures.length);
if(failures.length)process.exitCode=1;