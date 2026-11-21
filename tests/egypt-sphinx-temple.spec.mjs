import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18913,BASE=`http://127.0.0.1:${PORT}/`;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
let passed=0;const failures=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return}catch{}await sleep(100)}throw Error('HTTP server unavailable')}
async function test(browser,engine,profile){
 const context=await browser.newContext({...profile,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',res=>{if(res.url().includes('/images/')&&res.status()>=400)missing.push(res.url())});
 await page.goto(BASE+'egypt-sphinx-temple.html',{waitUntil:'load'});
 await page.waitForFunction(()=>!!window.TivvigSphinxDebug && !!window.TivvigHadesSounds,{timeout:8000});
 assert.deepEqual(errors,[], 'No JS exceptions');
 assert.deepEqual(missing,[], 'All images exist');
 assert.equal(await page.locator('.lada img[src="images/lada-cutout.webp"]').count(),2,'Original face layered');
 assert.equal(await page.locator('.lada .outfit').count(),1,'Original Hecate layer');
 assert.equal(await page.locator('.backdrop').count(),2,'Both states present');
 assert.equal(await page.locator('.backdrop').evaluateAll(imgs=>imgs.every(x=>x.complete&&x.naturalWidth>700)),true,'Temple backdrops loaded');
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().stone),0,'Sphinx begins alive');
 await page.locator('#startSphinx').click();
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().stage),'quiz');
 assert.equal(await page.locator('.choice:visible').count(),3);
 await page.locator('#choice-1').click();
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().wrongCount),1,'Wrong answer should be retryable');
 await page.locator('#hintButton').click();
 assert.ok((await page.locator('#feedback').textContent()).includes('мурлычет'));
 const answers=[0,1,0,0,1,1];
 for(let i=0;i<answers.length;i++){
  await page.locator('#choice-'+answers[i]).click();
  await page.waitForFunction(n=>window.TivvigSphinxDebug.state().correctCount>=n,i+1,{timeout:5000});
  if(i<5)await page.waitForFunction(n=>window.TivvigSphinxDebug.state().index===n && window.TivvigSphinxDebug.state().locked===false,i+1,{timeout:5000});
 }
 await page.waitForFunction(()=>window.TivvigSphinxDebug.state().stage==='checkpoint',{timeout:5000});
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().stone),100,'Sphinx petrified after six riddles');
 await page.locator('#finishSphinx').click();
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().stage),'done');
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().reward),true,'Reward saved');
 assert.equal(await page.locator('#finishActions').isVisible(),true);
 await page.locator('#replaySphinx').click();
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().stone),0,'Replay restores living Sphinx');
 await page.locator('#startSphinx').click();
 for(let i=0;i<answers.length;i++){
  await page.locator('#choice-'+answers[i]).click();
  if(i<5)await page.waitForFunction(n=>window.TivvigSphinxDebug.state().index===n&&window.TivvigSphinxDebug.state().locked===false,i+1,{timeout:5000});
 }
 await page.waitForFunction(()=>window.TivvigSphinxDebug.state().stage==='checkpoint',{timeout:5000});
 await page.locator('#bonusSphinx').click();
 assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().bonus),true);
 for(const [idx,answer] of [[6,1],[7,1]]){
  assert.equal(await page.evaluate(()=>window.TivvigSphinxDebug.state().index),idx);
  await page.locator('#choice-'+answer).click();
  if(idx===6)await page.waitForFunction(()=>window.TivvigSphinxDebug.state().index===7,{timeout:5000});
 }
 await page.waitForFunction(()=>window.TivvigSphinxDebug.state().stage==='done',{timeout:5000});
 const audioBtn=page.locator('[data-tivvig-local-audio]');
 assert.ok(await audioBtn.count()>=1,'Individual sound button exists');
 await audioBtn.first().click();
 const sound=await page.evaluate(()=>window.TivvigHadesSounds.state());
 assert.equal(sound.context,'running','WebAudio unlocked');
 assert.equal(sound.sampleCount,4);
 assert.equal(errors.length,0,errors.join('\n'));
 await context.close();passed++;
 console.log('PASS',engine,profile.name,'6 + 2 riddles, pictures, stone transformation, original Lada, audio, reward, replay');
}
async function coop(browser,engine){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});
 const parent=await ctx.newPage();await parent.goto(BASE+'index.html');
 await parent.evaluate(()=>{window.logged=[];window.addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.logged.push(e.data)})});
 const frame=await parent.evaluate(url=>{
  const f=document.createElement('iframe');f.id='coop-test-frame';f.src=url;document.body.append(f);return f.id;
 },BASE+'egypt-sphinx-temple.html?coop=1&role=student&seed=test');
 const child=parent.frameLocator('#coop-test-frame');
 await child.locator('#startSphinx').waitFor();
 await parent.waitForFunction(()=>window.logged?.some(x=>x.type==='ready'),{timeout:8000});
 await child.locator('#startSphinx').click();
 await parent.waitForFunction(()=>window.logged?.some(x=>x.type==='click'&&x.value?.selector==='#startSphinx'),{timeout:6000});
 const localBtn=child.locator('[data-tivvig-local-audio]');await localBtn.first().click();
 const localLeak=await parent.evaluate(()=>window.logged.filter(x=>x.type==='click'&&x.value?.selector?.includes('sound')).length);
 assert.equal(localLeak,0,'Local audio button must not mirror');
 await ctx.close();passed++;
 console.log('PASS',engine,'co-op authoritative button clicks, local-only audio');
}
try{
 await ready();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const profile of profiles)try{await test(browser,name,profile)}catch(e){failures.push(name+' '+profile.name+' '+e.stack);console.error('FAIL',failures.at(-1))}
   try{await coop(browser,name)}catch(e){failures.push(name+' co-op '+e.stack);console.error('FAIL',failures.at(-1))}
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('SPHINX TEMPLE TESTS:',passed,'FAILURES:',failures.length);
if(failures.length)process.exitCode=1;