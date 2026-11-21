import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18915,BASE=`http://127.0.0.1:${PORT}/`;
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
let passed=0;const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return}catch{}await sleep(100)}throw Error('Server unavailable')}
async function test(browser,name,profile){
 const ctx=await browser.newContext({...profile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),runtimeErrors=[],missing=[];
 page.on('pageerror',e=>runtimeErrors.push(e.message));
 page.on('response',res=>{if(res.status()>=400&&/\/(images\/|egypt-thoth-library\.)/.test(res.url()))missing.push(res.url())});
 await page.goto(BASE+'egypt-thoth-library.html');
 await page.waitForFunction(()=>!!window.TivvigThothDebug&&!!window.TivvigWardrobe,{timeout:8000});
 assert.equal(await page.locator('.backdrop img').evaluate(img=>img.complete&&img.naturalWidth>=1000),true,'AI art loads');
 assert.equal(await page.locator('#thothLada [data-outfit-layer]').count(),1,'Wardrobe attaches');
 assert.equal(await page.locator('#thothSteps i').count(),4,'Four chapters');
 assert.equal(await page.locator('#boardAction').isVisible(),true);
 await page.locator('#boardAction').click();
 assert.equal(await page.evaluate(()=>TivvigThothDebug.state().stage),'signs');
 await page.locator('#thoth-choice-0').click(); // Wrong sign, recoverable
 assert.equal(await page.evaluate(()=>TivvigThothDebug.state().errors),1);
 await page.waitForTimeout(400);
 const visited=new Set();let complete=false;
 for(let i=0;i<140;i++){
  const state=await page.evaluate(()=>window.TivvigThothDebug.state());visited.add(state.stage);
  if(state.stage==='done'){complete=true;break}
  if(state.phase==='show'||state.phase==='read-aloud'||!state.locked){
    await page.evaluate(()=>TivvigThothDebug.advance());
    await page.waitForTimeout(20);
  }else await page.waitForTimeout(700);
 }
 assert.equal(complete,true,'Must reach reward');
 assert.deepEqual([...visited].sort(),['done','intro','memory','sentences','signs','words'].filter(v=>visited.has(v)).sort());
 for(const s of ['words','memory','sentences','done'])assert.equal(visited.has(s),true,s+' reached');
 assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_thoth_feather_v1')),'unlocked');
 assert.equal(await page.locator('.feather').evaluate(x=>x.complete&&x.naturalWidth>100),true,'Reward image loads');
 assert.deepEqual(runtimeErrors,[],runtimeErrors.join('\n'));assert.deepEqual(missing,[],missing.join('\n'));
 await page.locator('#boardAction').click();assert.equal(await page.evaluate(()=>TivvigThothDebug.state().stage),'intro');
 const button=page.locator('[data-tivvig-local-audio]');assert.ok(await button.count()>=1,'Local sound check');
 await ctx.close();passed++;console.log('PASS',name,profile.name,'four boards, audio, assets, reward, replay');
}
async function testCoop(browser,name){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});
 const parent=await ctx.newPage();await parent.goto(BASE+'index.html');
 await parent.evaluate(()=>{window.logged=[];window.addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.logged.push(e.data)})});
 await parent.evaluate(url=>{const f=document.createElement('iframe');f.id='thoth-coop';f.src=url;document.body.append(f)},BASE+'egypt-thoth-library.html?coop=1&role=student&seed=test');
 const child=parent.frameLocator('#thoth-coop');await child.locator('#boardAction').waitFor();
 await parent.waitForFunction(()=>window.logged?.some(e=>e.type==='ready'),{timeout:8000});
 await child.locator('#boardAction').click();
 await parent.waitForFunction(()=>window.logged?.some(e=>e.type==='click'&&e.value?.selector==='#boardAction'),{timeout:6000});
 const btn=child.locator('[data-tivvig-local-audio]');await btn.first().click();
 assert.equal(await parent.evaluate(()=>window.logged.filter(e=>e.type==='click'&&e.value?.selector==='#hadesLocalSound').length),0);
 await ctx.close();passed++;console.log('PASS',name,'co-op click and local-only sound');
}
try{
 await ready();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const profile of profiles)try{await test(browser,name,profile)}catch(e){errors.push(`${name} ${profile.name}: ${e.stack}`)}
   try{await testCoop(browser,name)}catch(e){errors.push(`${name} co-op: ${e.stack}`)}
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('THOTH TESTS',passed,'passed,',errors.length,'failed');
errors.forEach(e=>console.error('FAIL',e));if(errors.length)process.exitCode=1;