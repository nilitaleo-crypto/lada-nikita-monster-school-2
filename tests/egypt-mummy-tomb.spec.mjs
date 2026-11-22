import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const PORT=18919,BASE='http://127.0.0.1:'+PORT+'/';
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
const profiles=[
 {name:'desktop',viewport:{width:1280,height:800},hasTouch:false,isMobile:false},
 {name:'tablet',viewport:{width:1024,height:768},hasTouch:true,isMobile:true},
 {name:'phone',viewport:{width:390,height:844},hasTouch:true,isMobile:true},
 {name:'landscape',viewport:{width:844,height:390},hasTouch:true,isMobile:true}
];
let passed=0;const errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return}catch{}await sleep(100)}throw Error('Local server did not start')}
async function testSolo(browser,name,p){
 const ctx=await browser.newContext({...p,reducedMotion:'reduce'});
 const page=await ctx.newPage();const runtimeErrors=[],missing=[];
 page.on('pageerror',e=>runtimeErrors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&/(\/images\/|egypt-mummy-tomb|wardrobe\.js)/.test(r.url()))missing.push(r.url())});
 await page.goto(BASE+'egypt-mummy-tomb.html');
 await page.waitForFunction(()=>!!window.TivvigMummyDebug&&!!window.TivvigWardrobe,{timeout:9000});
 assert.equal(await page.locator('.bg').evaluate(e=>e.complete&&e.naturalWidth>0),true,'Tomb art loads');
 const paintedBackdrop=await page.locator('.bg').evaluate(img=>({src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight}));
 assert.match(paintedBackdrop.src,/egypt-mummy-tomb-art-hq\.webp$/,'Painted tomb replaces old vector background');
 assert.deepEqual({width:paintedBackdrop.width,height:paintedBackdrop.height},{width:1672,height:941},'High-resolution painting retained');
 assert.equal(await page.locator('#mummyScene .bg').count(),1,'Exactly one background is drawn beneath gameplay');

 assert.equal(await page.locator('#mummyLada [data-outfit-layer]').count(),1,'Wardrobe attaches');
 assert.equal(await page.locator('.dots i').count(),4);
 assert.equal(await page.locator('.tutenstein img').evaluate(e=>e.complete&&e.naturalWidth>=700),true,'Tutenstein art loads sharply');
 assert.equal(await page.locator('.mummy-hand').count(),0,'old mummy hand removed');
 await page.waitForFunction(()=>document.getElementById('mummyTutor')?.classList.contains('poses-ready'),{timeout:10000});
 const poseAtlas=await page.evaluate(async()=>{
  const i=new Image();i.src='images/egypt-tutenstein-poses.webp';
  try{await i.decode();return {width:i.naturalWidth,height:i.naturalHeight}}
  catch{return {width:0,height:0}}
 });
 assert.deepEqual(poseAtlas,{width:1262,height:1246},'Nine crisp transparent Tutenstein poses load');
 assert.match(await page.locator('.tuten-sprite').evaluate(e=>getComputedStyle(e).backgroundImage),/egypt-tutenstein-poses.webp/);
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().tutenPose),'talk','Tutenstein speaks at introduction');
 const spriteBounds=await page.locator('.tuten-sprite').boundingBox();
 assert.ok(spriteBounds?.height>=210&&spriteBounds?.width>=210,'Pose has a readable size on touch devices');
 const overlaps=await page.locator('#mummyAction').boundingBox();
 assert.ok(overlaps?.width>=120&&overlaps?.height>=44,'Touch action has adequate hit area');
 await page.locator('#mummyAction').click();
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().stage),'fresco');
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().tutenPose),'point-jars','Tutenstein points at the fresco');
 assert.equal(await page.locator('.cycle-tile').count(),4,'four large illustrated pictures');
 const loaded=await page.evaluate(async()=>{const img=new Image();img.src='images/egypt-mummy-cycles-hq.avif';try{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight}}catch{return {width:0,height:0}}});
 assert.deepEqual(loaded,{width:1448,height:1086},'AI fresco atlas decodes on this engine');
 assert.match(await page.locator('#mummy-fresco-0').evaluate(el=>getComputedStyle(el).backgroundImage),/egypt-mummy-cycles-hq.avif/);
 await page.locator('#mummy-fresco-0').click();
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().errors),1,'Mistake is harmless');
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().tutenPose),'wrong','Tutenstein reacts to an incorrect answer');
 const visited=new Set(),cycleKeys=new Set(),frames=new Set();let checkedCanopes=false;let sawHeart=false;
 for(let i=0;i<120;i++){
  const st=await page.evaluate(()=>TivvigMummyDebug.state());
  visited.add(st.stage);if(st.stage==='done')break;
  if(st.stage==='jars'&&!checkedCanopes&&st.jarPhase==='selectJar'&&st.jarSolved.length===0){
   assert.equal(await page.locator('#mummyOrgans').isVisible(),true,'Four organ seals plus the heart');
   assert.equal(await page.locator('.organ-choice').count(),5,'Five organ tokens');
   const art=await page.evaluate(async()=>{
    const urls=['images/egypt-canopic-jars-hq.webp','images/egypt-canopic-organs-hq.webp'];
    return await Promise.all(urls.map(async src=>{
      const img=new Image();img.src=src;
      try{await img.decode();return {width:img.naturalWidth,height:img.naturalHeight}}
      catch{return {width:0,height:0}}
    }));
   });
   assert.deepEqual(art,[{width:1024,height:340},{width:1075,height:220}], 'Original high-quality canopic and organ illustrations are loaded');
   assert.match(await page.locator('#mummy-jar-0 .jar-art').evaluate(e=>getComputedStyle(e).backgroundImage),/egypt-canopic-jars-hq.webp/,'Jar uses high-resolution illustration');
   assert.match(await page.locator('#mummy-organ-lungs .organ-art').evaluate(e=>getComputedStyle(e).backgroundImage),/egypt-canopic-organs-hq.webp/,'Organ uses high-resolution illustration');
   const artBounds=await page.locator('#mummy-jar-0').boundingBox();
   assert.ok(artBounds?.width>=85&&artBounds?.height>=110,'Canopic jar remains a large touch target');
   const speechBounds=await page.locator('#mummySpeech').boundingBox();
   const sceneBounds=await page.locator('#mummyScene').boundingBox();
   assert.ok(speechBounds.y>=sceneBounds.y+12,'Riddle banner starts below clipped top edge');

   assert.equal(await page.locator('.jar:not(:disabled)').count(),4,'Child may choose any jar');
   assert.equal(await page.locator('#mummy-organ-heart').isDisabled(),true,'Heart cannot be placed in a canopic jar');
   assert.equal(await page.locator('#mummy-organ-lungs').isDisabled(),true,'Canopic jar must speak before an answer');
   await page.locator('#mummy-jar-2').click();
   assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().tutenPose),'point-organs','Tutenstein indicates the organs during the riddle');
   assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().jarPhase),'riddle','Jar starts its own riddle');
   assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().selectedJar),2);
   assert.match(await page.locator('#mummySpeech').innerText(),/вдохе|воздухом/i,'The selected jar asks a lung riddle');
   await page.locator('#mummy-organ-stomach').click();
   assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().jarPhase),'riddle','Wrong answer keeps the riddle');
   assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().errors),2);
   assert.equal(await page.locator('.jar.speaking').count(),1,'The speaker stays highlighted');
   checkedCanopes=true;
  }
  if(st.stage==='jars'&&st.jarPhase==='heart'){
   sawHeart=true;
   assert.ok(['happy','heart'].includes(await page.evaluate(()=>TivvigMummyDebug.state().tutenPose)));
  }
  if(st.stage==='fresco'){
   cycleKeys.add(st.round);
   assert.equal(await page.locator('.cycle-tile').count(),4,'every cycle has four pictures');
   const label=await page.locator('#mummy-fresco-1').getAttribute('aria-label');
   assert.ok(label?.length>4,'picture has narrative label');
   frames.add(await page.locator('#mummy-fresco-1').getAttribute('data-cycle-row'));
  }
  await page.evaluate(()=>TivvigMummyDebug.advance());
 }
 assert.equal(checkedCanopes,true,'Canopic quiz exercised');
 assert.equal(sawHeart,true,'Heart discovery phase reached');
 assert.deepEqual([...cycleKeys],[0,1,2],'frog, apple, moon in this order');
 assert.deepEqual([...frames],['0','1','2'],'three rows of real picture frames');
 const state=await page.evaluate(()=>TivvigMummyDebug.state());
 assert.equal(state.stage,'done','Every stage reaches the ending');
 assert.equal(state.tutenPose,'celebrate','Tutenstein dances when Lada receives the scarab');
 assert.ok(state.correct>=34,'Illustrated cycles, four solved riddles and heart discovery');
 assert.equal(state.heartFound,true,'Mummy heart located');
 assert.deepEqual(state.jarSolved,[2,1,3,0],'Canopic lids correctly paired with organs');
 for(const part of ['fresco','jars','scales','name','done'])assert.ok(visited.has(part),part+' reached');
 assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_egypt_mummy_scarab_v1')),'unlocked');
 assert.equal(await page.locator('#mummyScarab').isVisible(),true);
 assert.equal(await page.locator('#mummyScarab img').evaluate(e=>e.complete&&e.naturalWidth>0),true);
 await page.locator('#mummyAction').click();
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().stage),'intro','Replay starts clean');
 assert.equal(await page.evaluate(()=>TivvigMummyDebug.state().tutenPose),'talk','Replay restores the opening pose');
 assert.deepEqual(runtimeErrors,[],runtimeErrors.join('\n'));
 assert.deepEqual(missing,[],missing.join('\n'));
 assert.ok(await page.locator('[data-tivvig-local-audio]').count()>=1,'Local audio test control');
 await ctx.close();passed++;console.log('PASS',name,p.name,'mummy tomb, reward, touch, art and audio');
}
async function testCoop(browser,name){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});
 const page=await ctx.newPage(),errorsHere=[];
 page.on('pageerror',e=>errorsHere.push(e.message));
 await page.goto(BASE+'index.html');
 await page.evaluate(base=>{
  window.mummyEvents=[];
  window.addEventListener('message',e=>{
   if(e.data?.from!=='tivvig-world')return;
   window.mummyEvents.push(e.data);
   if(e.data.type==='click'){
    document.querySelectorAll('iframe[data-test-room]').forEach(frame=>{
     frame.contentWindow.postMessage({from:'tivvig-parent',type:'click',value:e.data.value},location.origin);
    });
   }
  });
  for(const role of ['teacher','student']){
   const f=document.createElement('iframe');f.dataset.testRoom=role;f.id='mummy-coop-'+role;
   f.src=base+'egypt-mummy-tomb.html?coop=1&role='+role+'&seed=test';
   document.body.append(f);
  }
 },BASE);
 const teacher=page.frameLocator('#mummy-coop-teacher'),student=page.frameLocator('#mummy-coop-student');
 await teacher.locator('#mummyAction').waitFor();await student.locator('#mummyAction').waitFor();
 await page.waitForFunction(()=>window.mummyEvents?.filter(e=>e.type==='ready').length>=2,{timeout:10000});
 await teacher.locator('#mummyAction').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).every(f=>f.contentWindow?.TivvigMummyDebug?.state().stage==='fresco'),{timeout:9000});
 assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).map(f=>f.contentWindow?.TivvigMummyDebug?.state().tutenPose)),['point-jars','point-jars'],'Shared screen shows the same pose');
 await student.locator('#mummy-fresco-0').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).every(f=>f.contentWindow?.TivvigMummyDebug?.state().errors===1),{timeout:9000});
 await teacher.locator('#mummy-fresco-1').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).every(f=>f.contentWindow?.TivvigMummyDebug?.state().pos===1),{timeout:9000});
 assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).map(f=>f.contentWindow?.TivvigMummyDebug?.state().tutenPose)),['idle','idle'],'Tutenstein listens calmly on both screens while Lada thinks');

 // Jump both already-synchronized local emulators through unchanged fresco rounds.
 // Then verify actual room-authoritative clicks on the new canopic targets.
 await page.evaluate(()=>{
  for(const frame of document.querySelectorAll('iframe[data-test-room]')){
   const d=frame.contentWindow.TivvigMummyDebug;
   for(let i=0;i<25&&d.state().stage==='fresco';i++)d.advance();
  }
 });
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).every(f=>f.contentWindow?.TivvigMummyDebug?.state().stage==='jars'),{timeout:3000});
 await teacher.locator('#mummy-jar-2').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).every(f=>f.contentWindow?.TivvigMummyDebug?.state().jarPhase==='riddle'&&f.contentWindow?.TivvigMummyDebug?.state().selectedJar===2),{timeout:9000});
 assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).map(f=>f.contentWindow?.TivvigMummyDebug?.state().tutenPose)),['point-organs','point-organs'],'Both devices show the riddle pose');
 await student.locator('#mummy-organ-lungs').click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('iframe[data-test-room]')).every(f=>f.contentWindow?.TivvigMummyDebug?.state().jarPhase==='selectJar'&&f.contentWindow?.TivvigMummyDebug?.state().jarSolved.includes(2)),{timeout:9000});

 assert.equal(await teacher.locator('.jar.sealed').count(),1,'teacher sees protected canopic jar');
 assert.equal(await student.locator('.jar.sealed').count(),1,'student sees the same restored seal');
 await student.locator('[data-tivvig-local-audio]').first().click();
 assert.equal(await page.evaluate(()=>window.mummyEvents.filter(e=>e.type==='click'&&e.value?.selector==='#hadesLocalSound').length),0);
 assert.deepEqual(errorsHere,[],errorsHere.join('\n'));
 await ctx.close();passed++;console.log('PASS',name,'two-device Firebase bridge replay and independent audio');
}
try{
 await waitForServer();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const p of profiles)try{await testSolo(browser,name,p)}catch(e){errors.push(name+' '+p.name+': '+e.stack)}
   try{await testCoop(browser,name)}catch(e){errors.push(name+' co-op: '+e.stack)}
  }finally{await browser.close()}
 }
}finally{server.kill()}
console.log('MUMMY TESTS',passed,'passed,',errors.length,'failed');
errors.forEach(e=>console.error('FAIL',e));if(errors.length)process.exitCode=1;
