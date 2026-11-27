/* Egyptian School 2: choose three rooms in arbitrary order, meaningful math,
 * writing feedback, syllabic reading, actual classroom backgrounds, offline
 * teacher confirmation and trusted Firebase action relay on Chromium/WebKit. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
const port=19083,base=`http://127.0.0.1:${port}/`;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let count=0;const failures=[];
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base)).ok)return}catch{}await new Promise(r=>setTimeout(r,75))}throw Error('No test server')}
async function play(browser,label,viewport,mobile,order){
 const ctx=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage();let errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url())});
 try{
  await page.goto(base+'egypt-school.html',{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.TivvigSchoolDebug);
  assert.equal(await page.locator('#schoolStage').getAttribute('data-phase'),'hall');
  assert.equal(await page.locator('.door:visible').count(),3,'All three teachers are selectable');
  assert.equal(await page.locator('.hall .scene-bg').evaluate(i=>i.complete&&i.naturalWidth>100),true);
  assert.equal(await page.locator('#schoolRoom').isVisible(),false);
  const ids={math:'schoolGoMath',writing:'schoolGoWriting',reading:'schoolGoReading'};
  const expected={math:14,writing:4,reading:12};
  for(const room of order){
   await page.locator('#'+ids[room]).click();
   assert.equal(await page.locator('#schoolStage').getAttribute('data-phase'),room);
   assert.equal(await page.locator('#schoolBoard').isVisible(),true);
   assert.equal(await page.locator('#schoolRoomBg').getAttribute('src'),`images/egypt-school-${room}-integrated.webp`);
   assert.equal(await page.locator('#schoolTeacherImg').getAttribute('src'),`images/egypt-school-${room}-neutral.webp`);
   const boardStyle=await page.locator('#schoolBoard').evaluate(el=>({border:getComputedStyle(el).borderTopWidth,bg:getComputedStyle(el).backgroundColor}));
   assert.equal(boardStyle.border,'0px','Gameplay must not be surrounded by a huge separate board frame');
   assert.equal(boardStyle.bg,'rgba(0, 0, 0, 0)','The illustrated wall itself must remain the board');
   await page.locator('#schoolRoomBg').evaluate(async i=>{await i.decode();if(i.naturalWidth<100)throw Error('Broken room background')});
   await page.locator('#schoolTeacherImg').evaluate(async i=>{await i.decode();if(i.naturalWidth<100)throw Error('Broken teacher image')});
   const state=await page.evaluate(()=>TivvigSchoolDebug.state());
   assert.equal(state.lessonCount,expected[room]);
   // The board must be *within* the scene, not a disconnected lower gameplay card.
   const scene=await page.locator('#schoolStage').boundingBox();
   const board=await page.locator('#schoolBoard').boundingBox();
   assert(board.y>scene.y&&board.y+board.height<=scene.y+scene.height+3,'Board placed inside classroom');
   assert(board.x>=scene.x-2&&board.x+board.width<=scene.x+scene.width+3);
   for(let n=0;n<expected[room];n++){
    const task=await page.evaluate(([name,i])=>TivvigSchoolDebug.getTask(name,i),[room,n]);
    assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().step),n);
    if(room==='writing'){
     assert.equal(await page.locator('#schoolPrint').isVisible(),true);
     if(n===0){await page.locator('#schoolOpt0').click();assert.equal(await page.locator('#schoolTeacherFigure').getAttribute('data-mood'),'wrong');
     assert.equal(await page.locator('#schoolTeacherImg').getAttribute('src'),`images/egypt-school-${room}-wrong.webp`,'Incorrect answer must show the wrong-expression asset');}
     await page.locator('#schoolOpt1').click();
    }else if(task.type==='sequence'){
     if(n===2){const wrong=task.a.findIndex((_,j)=>j!==task.order[0]);await page.locator('#schoolOpt'+wrong).click();assert.equal(await page.locator('#schoolTeacherFigure').getAttribute('data-mood'),'wrong');
     assert.equal(await page.locator('#schoolTeacherImg').getAttribute('src'),`images/egypt-school-${room}-wrong.webp`,'Incorrect answer must show the wrong-expression asset');}
     for(const choice of task.order)await page.locator('#schoolOpt'+choice).click();
    }else if(task.type==='collect'){
     for(let k=0;k<task.target;k++)await page.locator('#schoolOpt'+k).click();
    }else{
     if(n===0){const bad=(task.ok+1)%task.a.length;await page.locator('#schoolOpt'+bad).click();assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().answered),false);assert.equal(await page.locator('#schoolTeacherFigure').getAttribute('data-mood'),'wrong');
     assert.equal(await page.locator('#schoolTeacherImg').getAttribute('src'),`images/egypt-school-${room}-wrong.webp`,'Incorrect answer must show the wrong-expression asset');}
     await page.locator('#schoolOpt'+task.ok).click();
    }
    assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().answered),true);
    assert.equal(await page.locator('#schoolTeacherFigure').getAttribute('data-mood'),'good');
    assert.equal(await page.locator('#schoolTeacherImg').getAttribute('src'),`images/egypt-school-${room}-good.webp`,'Correct answer swaps to the actual happy character asset');
    await page.locator('#schoolTeacherImg').evaluate(img=>img.decode());
    await page.locator('#schoolNext').click();
   }
   const now=await page.evaluate(()=>TivvigSchoolDebug.state());
   assert(now.done.includes(room),'Room completion stamp was not recorded');
   if(now.done.length<3){assert.equal(now.phase,'hall');assert.equal(await page.locator('#schoolStamp'+room[0].toUpperCase()+room.slice(1)).isVisible(),true)}
  }
  assert.equal(await page.locator('#schoolStage').getAttribute('data-phase'),'done');
  assert.equal(await page.locator('#schoolEnding').isVisible(),true);
  assert.equal(await page.evaluate(()=>localStorage.getItem('tivvig_reward_egypt_school_v1')),'unlocked');
  assert.equal(await page.locator('#schoolEnding img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
  assert.deepEqual(errors,[],'Uncaught page errors');assert.deepEqual(missing,[],'Missing images/scripts');
  await page.locator('#schoolAgain').click();
  assert.equal(await page.evaluate(()=>TivvigSchoolDebug.state().phase),'hall');
  assert.equal(await page.locator('.door:visible').count(),3);
  count++;console.log('PASS',label,viewport.width,order.join('>'),'3 rooms, 30 tasks, reactions, board, reward, reset');
 }finally{await ctx.close()}
}
async function print(browser,label){
 const ctx=await browser.newContext({viewport:{width:1200,height:900}}),p=await ctx.newPage();
 try{await p.goto(base+'egypt-school-worksheets.html');assert.equal(await p.locator('.sheet').count(),4);assert(await p.locator('.dotted').count()>5);await p.emulateMedia({media:'print'});assert.equal(await p.locator('.toolbar').isVisible(),false);count++;console.log('PASS',label,'4 printable A4 worksheets')}finally{await ctx.close()}
}
async function coop(browser,label){
 const ctx=await browser.newContext({viewport:{width:1024,height:768},isMobile:true,hasTouch:true}),p=await ctx.newPage();
 try{
  await p.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await p.setContent(`<iframe id="frame" style="width:1010px;height:730px" src="${base}egypt-school.html?coop=1&role=student&seed=egyptschool-v2"></iframe><script>window.roomEvents=[];window.addEventListener('message',e=>{if(e.data?.from==='tivvig-world')window.roomEvents.push(e.data)})</script>`);
  const frame=p.frameLocator('#frame');
  await frame.locator('#schoolGoReading').waitFor();
  await p.waitForFunction(()=>window.roomEvents.some(e=>e.type==='ready'),null,{timeout:9000});
  await frame.locator('#schoolGoReading').click();
  await p.waitForFunction(()=>window.roomEvents.some(e=>e.type==='click'&&e.value?.selector==='#schoolGoReading'));
  assert.equal(await frame.locator('#schoolStage').getAttribute('data-phase'),'hall',"Student click cannot advance without room broadcast");
  await p.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#schoolGoReading'}},location.origin));
  await frame.locator('#schoolStage[data-phase="reading"]').waitFor();
  await frame.locator('#schoolOpt0').click();
  await p.waitForFunction(()=>window.roomEvents.some(e=>e.type==='click'&&e.value?.selector==='#schoolOpt0'));
  assert.equal(await frame.locator('#schoolTeacherFigure').getAttribute('data-mood'),'neutral','Unconfirmed answer cannot change face');
  await p.evaluate(()=>document.getElementById('frame').contentWindow.postMessage({from:'tivvig-parent',type:'click',value:{selector:'#schoolOpt1'}},location.origin));
  await frame.locator('#schoolTeacherFigure[data-mood="good"]').waitFor();
  count++;console.log('PASS',label,'Firebase authoritative room choice, answers, teacher emotions');
 }finally{await ctx.close()}
}
try{
 await ready();
 for(const [label,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const [width,height,mobile,order] of [[1280,800,false,['reading','math','writing']],[1024,768,true,['writing','reading','math']],[390,844,true,['math','writing','reading']]]){
    try{await play(browser,label,{width,height},mobile,order)}catch(e){failures.push(label+' '+width+' '+e.stack)}
   }
   try{await print(browser,label)}catch(e){failures.push(label+' print '+e.stack)}
   try{await coop(browser,label)}catch(e){failures.push(label+' coop '+e.stack)}
  }finally{await browser.close()}
 }
}finally{server.kill()}
for(const fail of failures)console.error('FAIL',fail);
console.log('EGYPT SCHOOL V2',count,'passes;',failures.length,'failures');
if(failures.length)process.exitCode=1;