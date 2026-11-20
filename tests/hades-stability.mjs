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
   try{await coOpTest(browser,label)}catch(e){failed=true;errors.push(label+' coop: '+e.stack);console.error('FAIL',errors.at(-1))}
  }finally{await browser.close()}
 }
}finally{
 server.kill();fs.writeFileSync('hades-test-results.json',JSON.stringify({tested:results.length,results,errors},null,2));
}
console.log('BROWSER CASES',results.length,'ERRORS',errors.length);
if(failed)process.exitCode=1;
