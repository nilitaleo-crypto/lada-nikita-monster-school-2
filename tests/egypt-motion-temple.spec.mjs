/* Проверка двигательной игры: ПК, iPad, телефон; Firefox не требуется.
 * Движение ребёнка наблюдает ведущий по видеосвязи: сайт не утверждает, что умеет его видеть.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const child=spawn('python3',['-m','http.server','18879','--bind','127.0.0.1'],{stdio:'ignore'});
const base='http://127.0.0.1:18879/';
let passes=0;const failures=[];
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base)).ok)return}catch{}await new Promise(r=>setTimeout(r,70))}throw Error('HTTP server')}
async function check(engine,engineName,width,height,touch){
 const context=await engine.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],misses=[];
 page.on('pageerror',err=>errors.push(err.message));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)misses.push(r.url())});
 try{
  await page.goto(base+'egypt-motion-temple.html',{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.TivvigMotionDebug));
  assert.equal(await page.locator('#motionAction').isVisible(),true);
  assert.equal(await page.locator('#motionGuardians .guardian').count(),6);
  assert.equal(await page.evaluate(()=>window.TivvigMotionDebug.state().phase),'intro');
  assert((await page.locator('#motionAction').boundingBox()).height>=44);
  await page.locator('#motionAction').click();
  for(let i=0;i<6;i++){
   assert.equal(await page.locator('#motionProgress').textContent(),'СТРАЖ '+(i+1)+' ИЗ 6');
   assert.equal(await page.locator('#motionGuardians .awake').count(),i);
   await page.locator('#motionAction').click();
  }
  assert.equal(await page.locator('#motionReward').isVisible(),true);
  assert.equal(await page.locator('#motionToMap').getAttribute('href'),'index.html');
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_motion_temple_v1')),'unlocked');
  assert.equal(await page.locator('#motionGuardians .awake').count(),6);
  assert.deepEqual(await page.evaluate(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)),[]);
  assert.deepEqual(errors,[]);assert.deepEqual(misses,[]);
  await page.locator('#motionAction').click();
  assert.equal(await page.evaluate(()=>window.TivvigMotionDebug.state().phase),'intro');
  assert.equal(await page.locator('#motionGuardians .awake').count(),0);
  passes++;console.log('PASS',engineName,width,'movement, reward, reset, images');
 }finally{await context.close()}
}
async function coop(engine,name){
 const context=await engine.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await page.setContent('<iframe id="frame" src="'+base+'egypt-motion-temple.html?coop=1&amp;role=student&amp;seed=test"></iframe><script>window.roomEvents=[];addEventListener("message",e=>{if(e.data?.from==="tivvig-world")roomEvents.push(e.data)})</script>');
  const frame=page.frameLocator('#frame');
  await frame.locator('#motionAction').waitFor();
  await page.waitForFunction(()=>window.roomEvents.some(e=>e.type==='ready'),null,{timeout:6000});
  await frame.locator('#motionAction').click();
  await page.waitForFunction(()=>window.roomEvents.some(e=>e.type==='click'&&e.value?.selector==='#motionAction'));
  assert.equal(await frame.locator('body').evaluate(()=>TivvigMotionDebug.state().phase),'intro','The room owns click progression');
  await page.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#motionAction'}},location.origin));
  await frame.locator('body').evaluate(()=>new Promise(resolve=>{const id=setInterval(()=>{if(TivvigMotionDebug.state().phase==='playing'){clearInterval(id);resolve()}},30)}));
  assert.equal(await frame.locator('body').evaluate(()=>TivvigMotionDebug.state().phase),'playing');
  passes++;console.log('PASS',name,'Firebase room replay');
 }finally{await context.close()}
}
try{
 await ready();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const [w,h,t] of [[1280,800,false],[1024,768,true],[390,844,true]])try{await check(browser,name,w,h,t)}catch(e){failures.push(name+' '+w+' '+e.stack)}
   try{await coop(browser,name)}catch(e){failures.push(name+' coop '+e.stack)}
  }finally{await browser.close()}
 }
}finally{child.kill();fs.writeFileSync('egypt-motion-test-results.json',JSON.stringify({passes,failures},null,2))}
for(const fail of failures)console.error('FAIL',fail);
if(failures.length)process.exitCode=1;console.log('MOVEMENT CHECK:',passes,'FAILURES:',failures.length);
