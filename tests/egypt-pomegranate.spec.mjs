/* Granatovaya Tropa release check: sensory controls, interaction logic, assets and co-op. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18873,URL=`http://127.0.0.1:${PORT}/`;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const failures=[];let passed=0;
async function serverReady(){for(let i=0;i<100;i++){try{if((await fetch(URL)).ok)return}catch{}await sleep(80)}throw Error('Local HTTP server unavailable')}
async function checkGame(browser,engine,profile){
 const context=await browser.newContext({...profile,reducedMotion:'reduce'});
 const page=await context.newPage();
 const faults=[],notFound=[];
 page.on('pageerror',e=>faults.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(URL)&&r.status()>=400)notFound.push(r.url()+':'+r.status())});
 try{
  await page.goto(URL+'egypt-pomegranate.html',{waitUntil:'load',timeout:20000});
  await page.locator('#hadesLocalSound').waitFor({timeout:8000});
  assert.equal(await page.locator('.seed').count(),6);
  assert.equal(await page.locator('.bed').count(),3);
  assert.equal(await page.locator('.root-tip').count(),3);
  assert.equal(await page.locator('.root-target').count(),3);
  assert.equal(await page.locator('.real-lada img[src="images/lada-cutout.webp"]').count(),2,'Real Lada head and body');
  assert.equal(await page.locator('.real-lada img[src="images/hecate-lyre-costume-layer.webp"]').count(),1);
  const artBroken=await page.evaluate(()=>[...document.images].filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.src));
  assert.deepEqual(artBroken,[],'All assets must load');
  assert.equal(await page.evaluate(()=>window.TivvigPomegranateDebug.state().phase),'intro');
  assert.equal(await page.locator('.seed:visible').count(),0,'Seeds should appear only after starting');
  await page.locator('#hadesLocalSound').click({timeout:5000});
  const sound=await page.evaluate(()=>window.TivvigHadesSounds.state());
  assert.equal(sound.unlocked,true);assert.equal(sound.sampleCount,4);
  await page.locator('#gardenStart').click({timeout:4000});
  assert.equal(await page.locator('.seed:visible').count(),6,'Six clickable seeds on one screen');
  assert.equal(await page.locator('.bed:visible').count(),3,'Three planting targets');
  for(const [seed,bed] of [[0,0],[1,1],[2,1],[3,2],[4,2],[5,2]]){
   await page.locator('#garden-seed-'+seed).click({timeout:4500});
   await page.locator('#garden-bed-'+bed).click({timeout:4500});
  }
  await page.waitForFunction(()=>window.TivvigPomegranateDebug.state().phase==='roots',null,{timeout:5500});
  assert.deepEqual(await page.evaluate(()=>window.TivvigPomegranateDebug.state().counts),[1,2,3]);
  assert.equal(await page.locator('.root-tip:visible').count(),3);
  await page.locator('#garden-source-0').click({timeout:4500});
  await page.locator('#garden-target-0').click({timeout:4500});
  assert.deepEqual(await page.evaluate(()=>window.TivvigPomegranateDebug.state().matched),[false,false,false],'Mismatched signs must not join');
  await page.locator('#garden-target-2').click({timeout:4500});
  await page.locator('#garden-source-1').click({timeout:4500});
  await page.locator('#garden-target-0').click({timeout:4500});
  await page.locator('#garden-source-2').click({timeout:4500});
  await page.locator('#garden-target-1').click({timeout:4500});
  await page.waitForFunction(()=>window.TivvigPomegranateDebug.state().phase==='portal',null,{timeout:6000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_pomegranate_portal_v1')),'unlocked');
  assert.equal(await page.locator('.root-path.complete').count(),3,'Three complete root animations');
  assert.equal(await page.locator('#gardenFinish').isVisible(),true);
  await page.locator('#gardenReplay').click({timeout:4500});
  assert.equal(await page.evaluate(()=>window.TivvigPomegranateDebug.state().phase),'intro');
  assert.equal(await page.locator('.seed:visible').count(),0);
  assert.deepEqual(faults,[],'No JS exceptions');assert.deepEqual(notFound,[],'No missing resources');
  passed++;console.log('PASS',engine,profile.name,'6 seeds + 1/2/3 beds + 3 roots + sound + portal + reset + artwork');
 }finally{await context.close()}
}
async function checkCoop(browser,name){
 const context=await browser.newContext({viewport:{width:1024,height:768},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 try{
  await page.goto(URL+'index.html',{waitUntil:'domcontentloaded'});
  await page.setContent(`<iframe id="game" src="${URL}egypt-pomegranate.html?coop=1&amp;role=student&amp;seed=test" style="width:1024px;height:740px"></iframe><script>window.moves=[];addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.moves.push(e.data)})</script>`);
  const game=page.frameLocator('#game');await game.locator('#hadesLocalSound').waitFor({timeout:6000});
  await game.locator('#hadesLocalSound').click();await page.waitForTimeout(160);
  assert.deepEqual(await page.evaluate(()=>window.moves.filter(x=>x.type==='click')) ,[], 'Local audio cannot be relayed');
  await game.locator('#gardenStart').click();
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='click'&&x.value?.selector==='#gardenStart'),null,{timeout:3500});
  assert.equal(await game.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().phase),'intro','Co-op awaits authoritative click');
  await page.evaluate(()=>document.getElementById('game').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#gardenStart'}},location.origin));
  await game.locator('#garden-seed-0').waitFor({state:'visible',timeout:5000});
  await game.locator('#garden-seed-0').click();
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='click'&&x.value?.selector==='#garden-seed-0'),null,{timeout:3500});
  assert.equal(await game.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().selectedSeed),-1);
  await page.evaluate(()=>document.getElementById('game').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#garden-seed-0'}},location.origin));
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='actionApplied'&&x.value?.selector==='#garden-seed-0'),null,{timeout:5000});
  assert.equal(await game.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().selectedSeed),0);
  await game.locator('#garden-bed-0').click();
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='click'&&x.value?.selector==='#garden-bed-0'),null,{timeout:3500});
  await page.evaluate(()=>document.getElementById('game').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#garden-bed-0'}},location.origin));
  await page.waitForFunction(()=>window.moves.some(x=>x.type==='actionApplied'&&x.value?.selector==='#garden-bed-0'),null,{timeout:5000});
  assert.deepEqual(await game.locator('body').evaluate(()=>window.TivvigPomegranateDebug.state().counts),[1,0,0]);
  console.log('PASS',name,'Firebase co-op start, tap seed, plant + local sound');
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
console.log('POMEGRANATE BROWSER TESTS:',passed,'FAILURES:',failures.length);
if(failures.length)process.exitCode=1;