import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18876,BASE=`http://127.0.0.1:${PORT}/`;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let passed=0;const failures=[];
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return}catch{}await delay(100)}throw Error('http server unavailable')}
async function test(browser,name,profile){
 const context=await browser.newContext({...profile,reducedMotion:'reduce'});const page=await context.newPage();
 const errors=[],missing=[];page.on('pageerror',err=>errors.push(err.message));
 page.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)missing.push(r.status()+' '+r.url())});
 try{
  await page.goto(BASE+'egypt-nile-mystery.html',{waitUntil:'load',timeout:20000});
  await page.locator('#hadesLocalSound').waitFor({timeout:7000});
  assert.equal(await page.locator('.lada img[src="images/lada-cutout.webp"]').count(),2,'Original Lada head and body');
  assert.equal(await page.locator('.lada img[src="images/hecate-lyre-costume-layer.webp"]').count(),1,'Hecate outfit');
  assert.equal(await page.locator('#fox img').count(),1);
  assert.equal(await page.locator('#nafiri img').count(),1);
  assert.equal(await page.evaluate(()=>window.TivvigNileDebug.state().stage),'meet');
  assert.equal(await page.locator('#clueField').isHidden(),true,'Clues hidden until investigation');
  await page.locator('#hadesLocalSound').click({timeout:4500});
  assert.equal(await page.evaluate(()=>window.TivvigHadesSounds.state().unlocked),true);
  await page.locator('#fox').click({force:true});
  assert.equal(await page.locator('#toInvestigation').isHidden(),true,'Must also meet Nafiri');
  await page.locator('#nafiri').click({force:true});
  assert.equal(await page.locator('#toInvestigation').isVisible(),true);
  await page.locator('#toInvestigation').click({force:true});
  assert.equal(await page.evaluate(()=>window.TivvigNileDebug.state().stage),'investigate');
  assert.equal(await page.locator('#clueField').isVisible(),true);
  assert.equal(await page.locator('#suspects').isHidden(),true);
  // A wrong clue answer must not count.
  await page.locator('#clue-paw').click({force:true});
  await page.locator('#answer-paw-bird').click({force:true});
  assert.equal((await page.evaluate(()=>window.TivvigNileDebug.state().evidence)).length,0);
  const steps=[['paw','lion'],['cloth','bluegold'],['claw','4'],['voice','human']];
  for(const [id,answer] of steps){
   if(id!=='paw')await page.locator('#clue-'+id).click({force:true});
   await page.locator('#answer-'+id+'-'+answer).click({force:true});
   assert.equal(await page.locator('#clue-'+id).isDisabled(),true,'Clue found '+id);
  }
  await page.locator('#suspects').waitFor({state:'visible',timeout:5000});
  await page.locator('[data-suspect="sekhmet"]').click({force:true});
  assert.equal(await page.evaluate(()=>window.TivvigNileDebug.state().stage),'investigate','Incorrect suspect rejected');
  await page.locator('[data-suspect="sphinx"]').click({force:true});
  assert.equal(await page.evaluate(()=>window.TivvigNileDebug.state().stage),'done');
  assert.equal(await page.locator('#victory').isVisible(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_sphinx_investigation_v1')),'unlocked');
  await page.locator('#restartNile').click({force:true});
  assert.equal(await page.evaluate(()=>window.TivvigNileDebug.state().stage),'meet');
  assert.equal(await page.locator('#clueField').isHidden(),true);
  const broken=await page.evaluate(()=>[...document.images].filter(im=>im.complete&&im.naturalWidth===0).map(im=>im.src));
  assert.deepEqual(broken,[],'All original assets load');
  assert.deepEqual(errors,[],'No runtime exceptions');assert.deepEqual(missing,[],'No 404 assets');
  console.log('PASS',name,profile.name,'2 scenes, original Lada, character dialogue, evidence, Sphinx, reward, reset, audio');passed++;
 }finally{await context.close()}
}
async function testCoop(browser,name){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});const page=await ctx.newPage();
 try{
  await page.goto(BASE+'index.html',{waitUntil:'domcontentloaded'});
  await page.setContent(`<iframe id="game" style="width:1000px;height:710px" src="${BASE}egypt-nile-mystery.html?coop=1&amp;role=student&amp;seed=test"></iframe><script>window.moves=[];addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.moves.push(e.data)});</script>`);
  const frame=page.frameLocator('#game');await frame.locator('#hadesLocalSound').waitFor({timeout:8000});
  await frame.locator('#hadesLocalSound').click({force:true});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>window.moves.filter(x=>x.type==='click').length),0,'Sound test stays local');
  await frame.locator('#fox').click({force:true});
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='click'&&x.value?.selector==='#fox'),null,{timeout:4000});
  assert.equal((await frame.locator('body').evaluate(()=>window.TivvigNileDebug.state().met)).length,0,'Co-op clicks authoritative');
  await page.evaluate(()=>document.getElementById('game').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#fox'}},location.origin));
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='actionApplied'&&x.value?.selector==='#fox'),null,{timeout:4000});
  assert.deepEqual(await frame.locator('body').evaluate(()=>window.TivvigNileDebug.state().met),['fox']);
  console.log('PASS',name,'co-op character interaction and local audio');
 }finally{await ctx.close()}
}
try{
 await ready();for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{for(const profile of profiles){try{await test(browser,name,profile)}catch(e){failures.push(name+' '+profile.name+' '+e.stack);console.error('FAIL',failures.at(-1))}}
   try{await testCoop(browser,name)}catch(e){failures.push(name+' co-op '+e.stack);console.error('FAIL',failures.at(-1))}
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('NILE MYSTERY TESTS:',passed,'FAILURES:',failures.length);
if(failures.length)process.exitCode=1;