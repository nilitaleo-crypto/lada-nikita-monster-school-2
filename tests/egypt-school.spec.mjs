/* Egyptian School: visual + math + print worksheets + reading + offline reward + Firebase iframe relay.
   School uses no timers/randomness to keep real-time classroom progression deterministic.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const port=19083,base=`http://127.0.0.1:${port}/`;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let count=0;const failures=[];
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base)).ok)return}catch{}await new Promise(r=>setTimeout(r,75))}throw Error('No HTTP server')}
async function testGame(browser,label,viewport,mobile){
 const context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url())});
 try{
  await page.goto(base+'egypt-school.html',{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.TivvigSchoolDebug);
  assert.equal(await page.locator('#schoolStage').getAttribute('data-phase'),'intro');
  assert.equal(await page.locator('#schoolLearning').isVisible(),false);
  assert.equal(await page.locator('.school-backdrop').evaluate(img=>img.complete&&img.naturalWidth>100),true);
  assert.equal(await page.locator('#schoolLada img:first-child').evaluate(img=>img.complete&&img.naturalWidth>100),true);
  await page.locator('#schoolStart').click();
  assert.equal(await page.locator('#schoolStage').getAttribute('data-phase'),'math');
  for(const phase of ['math','writing','reading']){
   const info=await page.evaluate(which=>({count:({math:12,writing:4,reading:10})[which]}),phase);
   assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().phase),phase);
   for(let i=0;i<info.count;i++){
    let state=await page.evaluate(()=>TivvigSchoolDebug.state());
    assert.equal(state.step,i);
    assert.equal((await page.locator('#schoolQuestion').textContent()).length>3,true);
    if(phase==='writing'){
     assert.equal(await page.locator('#schoolPrint').isVisible(),true);
     assert.equal(await page.locator('#schoolTeacherImg').getAttribute('src'),'images/egypt-school-wednesday.webp');
     await page.locator('#schoolNext').click();
     continue;
    }
    const task=await page.evaluate(([subject,index])=>TivvigSchoolDebug.getTask(subject,index),[phase,i]);
    assert.equal((await page.locator('.choice:visible').count()),task.a.length);
    // First task: incorrect response does NOT advance the chapter.
    if(i===0){
     const bad=(task.ok+1)%task.a.length;
     await page.locator('#schoolOpt'+bad).click();
     assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().step),i);
     assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().answered),false);
    }
    await page.locator('#schoolOpt'+task.ok).click();
    assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().answered),true);
    await page.locator('#schoolNext').click();
   }
  }
  assert.equal(await page.locator('#schoolStage').getAttribute('data-phase'),'done');
  assert.equal(await page.locator('#schoolEnding').isVisible(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_reward_egypt_school_v1')),'unlocked');
  assert.equal(await page.locator('#schoolEnding img').evaluate(img=>img.complete&&img.naturalWidth>0),true);
  assert.equal((await page.locator('.school-backdrop').evaluate(img=>img.naturalWidth>0)),true);
  assert.deepEqual(errors,[]);
  assert.deepEqual(missing,[]);
  await page.locator('#schoolAgain').click();
  assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().phase),'intro');
  count++;console.log('PASS',label,viewport.width,viewport.height,'26 sequential lessons, reward, images, retry');
 }finally{await context.close()}
}
async function testPrint(browser,label){
 const ctx=await browser.newContext({viewport:{width:1280,height:960}}),page=await ctx.newPage();
 try{
  await page.goto(base+'egypt-school-worksheets.html',{waitUntil:'load'});
  assert.equal(await page.locator('.sheet').count(),4);
  assert.equal(await page.locator('svg .dotted').count()>5,true);
  assert.equal(await page.locator('svg .dotted-text').count()>=8,true);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.toolbar').isVisible(),false);
  count++;console.log('PASS',label,'4 printable A4 writing sheets');
 }finally{await ctx.close()}
}
async function testCoop(browser,label){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},isMobile:true,hasTouch:true});
 const p=await ctx.newPage();
 try{
  await p.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await p.setContent(`<iframe id="frame" style="width:1000px;height:700px" src="${base}egypt-school.html?coop=1&role=student&seed=testschool"></iframe><script>window.roomEvents=[];addEventListener('message',e=>{if(e.data?.from==='tivvig-world')roomEvents.push(e.data)})</script>`);
  const frame=p.frameLocator('#frame');
  await frame.locator('#schoolStart').waitFor();
  await p.waitForFunction(()=>window.roomEvents.some(e=>e.type==='ready'),null,{timeout:8000});
  await frame.locator('#schoolStart').click();
  await p.waitForFunction(()=>window.roomEvents.some(e=>e.type==='click'&&e.value?.selector==='#schoolStart'));
  assert.equal(await frame.locator('#schoolStage').getAttribute('data-phase'),'intro','Local tap must not advance in Firebase mode');
  await p.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#schoolStart'}},location.origin));
  await frame.locator('#schoolStage[data-phase="math"]').waitFor();
  // Teacher's remote choice is applied by the same bridge.
  await p.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#schoolOpt1'}},location.origin));
  await p.waitForFunction(()=>window.roomEvents.some(e=>e.type==='actionApplied'&&e.value?.selector==='#schoolOpt1'));
  assert.equal(await frame.locator('#schoolNext').isVisible(),true);
  count++;console.log('PASS',label,'Firebase-authoritative button relay');
 }finally{await ctx.close()}
}
try{
 await ready();
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const [width,height,mobile] of [[1280,800,false],[1024,768,true],[390,844,true]]){
    try{await testGame(browser,name,{width,height},mobile)}catch(e){failures.push(name+' '+width+': '+e.stack)}
   }
   try{await testPrint(browser,name)}catch(e){failures.push(name+' print: '+e.stack)}
   try{await testCoop(browser,name)}catch(e){failures.push(name+' coop: '+e.stack)}
  }finally{await browser.close()}
 }
}finally{server.kill()}
for(const f of failures)console.error('FAIL',f);
console.log('EGYPT SCHOOL TESTS:',count,'passes;',failures.length,'failures');
if(failures.length)process.exitCode=1;