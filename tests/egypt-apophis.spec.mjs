/* Egypt · Apophis prologue. Browser release checks in Chromium and WebKit.
 * This verifies touch affordances and asset loading. Hardware audio still requires a real iPad listen.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';

const server=spawn('python3',['-m','http.server','18872','--bind','127.0.0.1'],{stdio:'ignore'});
const root='http://127.0.0.1:18872/';
const devices=[
 {name:'PC',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'iPad',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
let checked=0;const failures=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function serverReady(){
 for(let i=0;i<100;i++){try{if((await fetch(root)).ok)return}catch{}await wait(70)}
 throw Error('HTTP server unavailable');
}
async function run(engine,name,profile){
 const context=await engine.newContext({...profile,viewport:profile.viewport,reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];const misses=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(root)&&r.status()>=400)misses.push(r.status()+' '+r.url())});
 try{
  await page.goto(root+'egypt-apophis.html',{waitUntil:'load',timeout:18000});
  await page.locator('#hadesLocalSound').waitFor({timeout:5000});
  assert.equal(await page.locator('#startRescue').isVisible(),true);
  assert.equal(await page.locator('.anchor:visible').count(),0,'No anchors until Start');
  assert.equal(await page.locator('.actor.lada .original-head').count(),1);
  await page.locator('#hadesLocalSound').click({timeout:3000});
  const audio=await page.evaluate(()=>window.TivvigHadesSounds.state());
  assert.equal(audio.unlocked,true);assert.equal(audio.sampleCount,4);
  await page.locator('#startRescue').click({timeout:3000});
  assert.equal(await page.evaluate(()=>window.TivvigEgyptDebug.state().phase),'playing');
  assert.equal(await page.locator('.anchor:visible').count(),6,'All six nodes must activate');
  const first=await page.evaluate(()=>({point:window.TivvigEgyptDebug.state().points[0],path:document.querySelector('#ray0 .ray-light').getAttribute('d')}));
  await page.waitForFunction(old=>{
   const now=window.TivvigEgyptDebug.state().points[0];
   return Math.abs(now.x-old.x)>2 || Math.abs(now.y-old.y)>2;
  },first.point,{timeout:3500});
  assert.notEqual(await page.locator('#ray0 .ray-light').getAttribute('d'),first.path,'Ray must follow moving node');
  const nodePositions=await page.evaluate(()=>[...document.querySelectorAll('button.anchor')].map(b=>{
   const r=b.getBoundingClientRect(),stage=document.querySelector('#egyptScene').getBoundingClientRect();
   return {x:r.x,y:r.y,inside:r.left>=stage.left-4 && r.right<=stage.right+4 && r.top>=stage.top-4 && r.bottom<=stage.bottom+4};
  }));
  assert(nodePositions.every(x=>x.inside),'Moving nodes must stay inside the game viewport');
  await page.waitForFunction(()=>window.TivvigEgyptDebug.state().energy[0]<.98,null,{timeout:5000});
  const before=await page.evaluate(()=>window.TivvigEgyptDebug.state().energy[0]);
  await page.locator('#rayButton0').click({force:true,timeout:3000});
  const after=await page.evaluate(()=>window.TivvigEgyptDebug.state().energy[0]);
  assert(after>before,'Press must visibly strengthen ray');
  for(const i of [1,2,3,4,5])await page.locator('#rayButton'+i).click({force:true,timeout:5000});
  assert.deepEqual((await page.evaluate(()=>window.TivvigEgyptDebug.state().presses)),[1,1,1,1,1,1]);
  await page.evaluate(()=>window.TivvigEgyptDebug.finishImmediately());
  await page.waitForFunction(()=>window.TivvigEgyptDebug.state().phase==='lost',null,{timeout:5000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_apophis_prologue_v1')),'unlocked');
  assert.equal(await page.locator('.ending-art').isVisible(),true,'The finished ray game reveals the large Apophis illustration');
  const reveal=await page.locator('.ending-art img').evaluate(img=>({loaded:img.complete&&img.naturalWidth>0,source:img.currentSrc}));
  assert.equal(reveal.loaded,true,'The ending artwork must load in the active browser (AVIF or WebP fallback)');
  assert.equal(await page.locator('.ending-sub').evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)','The old ending paragraph must not cover the artwork');
  assert.equal(await page.locator('.ending-links a[href="egypt-pomegranate.html"]').count(),1,'Apophis must lead to Persephone garden');
  const broken=await page.evaluate(()=>[...document.images].filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src));
  assert.deepEqual(broken,[],'All art loads');
  assert.deepEqual(errors,[],'JS errors');assert.deepEqual(misses,[],'HTTP 404');
  await page.locator('#replayEgypt').click();
  assert.equal(await page.evaluate(()=>window.TivvigEgyptDebug.state().phase),'intro');
  assert.equal(await page.locator('.ending-art').isVisible(),false,'The ending art must disappear after replay');
  assert.equal(await page.locator('.anchor:visible').count(),0);
  checked++;console.log('PASS',name,profile.name,'touch, rays, audio, models, ending, replay');
 }finally{await context.close()}
}
async function parentRoom(engine,name){
 const context=await engine.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.goto(root+'index.html',{waitUntil:'domcontentloaded'});
  await page.setContent(`<iframe id="frame" src="${root}egypt-apophis.html?coop=1&amp;role=student&amp;seed=test"></iframe><script>window.roomEvents=[];addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.roomEvents.push(e.data)})</script>`);
  const frame=page.frameLocator('#frame');await frame.locator('#hadesLocalSound').waitFor({timeout:6000});
  await frame.locator('#hadesLocalSound').click();
  await page.waitForTimeout(130);
  assert.equal(await page.evaluate(()=>window.roomEvents.filter(x=>x.type==='click').length),0,'Audio test must be local');
  await frame.locator('#startRescue').click();
  await page.waitForFunction(()=>window.roomEvents.some(x=>x.type==='click'&&x.value?.selector==='#startRescue'),null,{timeout:3000});
  assert.equal(await frame.locator('body').evaluate(()=>window.TivvigEgyptDebug.state().phase),'intro','Co-op click is authoritative, not local');
  await page.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#startRescue'}},location.origin));
  await frame.locator('#rayButton1').waitFor({state:'visible',timeout:4000});
  assert.equal(await frame.locator('body').evaluate(()=>window.TivvigEgyptDebug.state().phase),'playing');
  await frame.locator('#rayButton5').click({force:true});
  await page.waitForFunction(()=>window.roomEvents.some(x=>x.type==='click'&&x.value?.selector==='#rayButton5'),null,{timeout:3000});
  assert.equal(await frame.locator('body').evaluate(()=>window.TivvigEgyptDebug.state().presses[5]),0,'Ray press waits for room replay');
  await page.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#rayButton5'}},location.origin));
  await page.waitForFunction(()=>document.getElementById('frame').contentWindow.TivvigEgyptDebug.state().presses[5]===1,null,{timeout:3000});
  console.log('PASS',name,'co-op audio is local, six-node game clicks are replicated');
 }finally{await context.close()}
}
try{
 await serverReady();
 for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{for(const profile of devices){try{await run(browser,name,profile)}catch(e){failures.push(name+' '+profile.name+': '+e.stack);console.error('FAIL',failures.at(-1))}}
      try{await parentRoom(browser,name)}catch(e){failures.push(name+' room: '+e.stack);console.error('FAIL',failures.at(-1))}}
  finally{await browser.close()}
 }
}finally{server.kill();fs.writeFileSync('egypt-apophis-test-results.json',JSON.stringify({checked,failures},null,2))}
console.log('EGYPT TESTS:',checked,'FAILURES:',failures.length);
if(failures.length)process.exitCode=1;