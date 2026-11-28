import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';

const PORT=19281, BASE='http://127.0.0.1:'+PORT+'/';
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const animals=['ibis','camel','fennec','baboon','cobra','hippo','crocodile'];
const profiles=[
  {name:'desktop',viewport:{width:1280,height:800}},
  {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
  {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true}
];
const failures=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){
 for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return;}catch{}await sleep(100);}
 throw Error('HTTP server unavailable');
}
async function walkthrough(browser,engine,profile,animal){
 const ctx=await browser.newContext({...profile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))missing.push(r.url());});
 try{
  const response=await page.goto(BASE+'egypt-zoo-'+animal+'.html',{waitUntil:'load'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>!!window.TivvigZooDebug,{timeout:8000});
  assert.equal(await page.locator('.zoo-stage').count(),1,'Painted scene exists');
  assert.equal(await page.evaluate(()=>new Promise(resolve=>{
   const im=new Image();im.onload=()=>resolve(im.naturalWidth>=1000);im.onerror=()=>resolve(false);
   im.src=document.querySelector('.zoo-stage').style.backgroundImage.slice(5,-2);
  })),true,'High resolution scene loaded');
  if(animal==='fennec'){
   assert.equal(await page.locator('#zooHear').count(),1,'Play sound control exists');
   assert.equal(await page.locator('#zooAudioEnable[data-tivvig-local-audio]').count(),1,'Local sound unlock exists');
   await page.locator('#zooAudioEnable').click();
   assert.equal(await page.evaluate(()=>window.TivvigZooDebug.state().unlocked),true);
   await page.locator('#zooHear').click();
  }
  if(animal==='crocodile'){
   assert.equal(await page.locator('.zoo-spot--ripple').count(),0,'Old blinking ripple removed');
   assert.equal(await page.locator('.zoo-croc-portrait-img').count(),1,'Crocodile picture visible');
   assert.equal(await page.locator('#zoo-croc-eyes').count(),1);
   assert.equal(await page.locator('#zoo-croc-nose').count(),1);
  }
  if(animal==='hippo')assert.equal(await page.locator('.zoo-hippo-step').count(),3,'Riverbed footstep route exists');
  if(animal==='fennec'){
   await page.locator('#zoo-fennec-1').click();
   assert.equal(await page.evaluate(()=>window.TivvigZooDebug.state().round),0,'Wrong choice retryable');
  }
  const instructions=await page.evaluate(()=>window.TivvigZooDebug.rounds);
  for(let round=0;round<instructions.length;round++){
   const target=instructions[round];
   for(const choice of Array.isArray(target)?target:[target]){
     let selector;
     if(typeof choice==='string')selector='#zoo-croc-'+choice;
     else selector='#zoo-'+animal+'-'+choice;
     await page.locator(selector).click({timeout:5000});
   }
   await page.waitForFunction(n=>{
    const state=window.TivvigZooDebug.state();
    return state.round>n||state.finished;
   },round,{timeout:5000});
  }
  assert.equal(await page.evaluate(()=>window.TivvigZooDebug.state().finished),true,'Full game finishes');
  assert.equal(await page.locator('#controls').isVisible(),true,'Map and replay unlocked');
  await page.locator('#restart').click();
  assert.deepEqual(await page.evaluate(()=>{
   const {round,sub,finished,busy}=window.TivvigZooDebug.state();
   return {round,sub,finished,busy};
  }),{round:0,sub:0,finished:false,busy:false},'Restart resets steps');
  assert.deepEqual(errors,[],'No browser JS exceptions');
  assert.deepEqual(missing,[],'No missing site assets');
  console.log('PASS',engine,profile.name,animal, 'education + assets + touch + replay');
 }finally{await ctx.close();}
}
async function coopContract(browser){
 const ctx=await browser.newContext({viewport:{width:1100,height:780},reducedMotion:'reduce'});
 const parent=await ctx.newPage(),received=[];
 await parent.goto(BASE+'index.html');
 await parent.evaluate(()=>{
  window.zooMessages=[];
  window.addEventListener('message',e=>{
   if(e.data?.from==='tivvig-world')window.zooMessages.push(e.data);
  });
  const frame=document.createElement('iframe');
  frame.id='zooCoopFrame';frame.src='egypt-zoo-fennec.html?coop=1&role=student&seed=zoo-test';
  document.body.append(frame);
 });
 const child=parent.frameLocator('#zooCoopFrame');
 await child.locator('#zooAudioEnable').waitFor();
 await parent.waitForFunction(()=>window.zooMessages?.some(x=>x.type==='ready'),{timeout:10000});
 await child.locator('#zooAudioEnable').click();
 assert.equal(await parent.evaluate(()=>window.zooMessages.filter(x=>x.type==='click'&&x.value?.selector==='#zooAudioEnable').length),0,'Local audio unlock is never mirrored');
 await child.locator('#zooHear').click();
 await parent.waitForFunction(()=>window.zooMessages.some(x=>x.type==='click'&&x.value?.selector==='#zooHear'),{timeout:5000});
 await child.locator('#zoo-fennec-0').click();
 await parent.waitForFunction(()=>window.zooMessages.some(x=>x.type==='click'&&x.value?.selector==='#zoo-fennec-0'),{timeout:5000});
 console.log('PASS co-op sound separation and mirrored gameplay');
 await ctx.close();
}
try{
 await ready();
 for(const [engine,kind] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await kind.launch({headless:true});
  try{
   for(const profile of profiles){
    for(const animal of animals){
     try{await walkthrough(browser,engine,profile,animal);}
     catch(e){failures.push(engine+' '+profile.name+' '+animal+' '+e.stack);console.error('FAIL',failures.at(-1));}
    }
   }
   try{await coopContract(browser);}catch(e){failures.push(engine+' coop '+e.stack);console.error('FAIL',failures.at(-1));}
  }finally{await browser.close();}
 }
}finally{server.kill();}
console.log('EGYPTIAN ZOO TESTS:',42,'viewports,',failures.length,'failures');
if(failures.length)process.exitCode=1;
