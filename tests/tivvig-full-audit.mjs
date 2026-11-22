import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';

const ROOT=process.cwd(), PORT=19147, BASE='http://127.0.0.1:'+PORT+'/';
const pages=fs.readdirSync(ROOT).filter(f=>f.endsWith('.html')).sort();
const sources=fs.readdirSync(ROOT).filter(f=>/\.(html|css|js)$/.test(f));
const failures=[], results=[];
let views=0;
function exists(p){try{return fs.statSync(path.join(ROOT,p)).isFile()}catch{return false}}
function clean(ref){
 const x=ref.replace(/[?#].*$/,'').trim().replace(/^\.\//,'');
 if(!x||/^(?:https?:|data:|mailto:|tel:|javascript:|blob:|\/\/|#)/i.test(x)||/[{}<>$]/.test(x))return null;
 if(x.startsWith('/'))return null;
 try{return decodeURIComponent(x)}catch{return null}
}
function staticAudit(){
 for(const name of sources){
  const source=fs.readFileSync(name,'utf8'),refs=[];
  if(name.endsWith('.html'))
   for(const m of source.matchAll(/\b(?:src|href|poster|srcset)\s*=\s*["']([^"'<>]+)["']/gi))refs.push(m[1]);
  for(const m of source.matchAll(/url\(\s*["']?([^)"'\s]+)["']?\s*\)/gi))refs.push(m[1]);
  for(const m of source.matchAll(/(?:images|audio|sounds)\/[a-z0-9_./-]+\.(?:png|svg|jpg|jpeg|webp|avif|gif|mp3|ogg|wav)/gi))refs.push(m[0]);
  for(const raw of refs){
   const ref=clean(raw);
   if(!ref||!ref.match(/\.(?:html|css|js|json|webp|avif|jpg|jpeg|png|svg|gif|mp3|ogg|wav|ico|mp4|webm)$/i))continue;
   if(!exists(ref))failures.push('STATIC '+name+' missing '+ref);
  }
  if(name.endsWith('.html')){
   const ids=[...source.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
   const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
   if(dup.length)failures.push('STATIC '+name+' duplicate ID '+dup.join(','));
  }
 }
 const registry=fs.readFileSync('game-registry.js','utf8');
 for(const m of registry.matchAll(/"path":"([^"]+\.html)"/g))
  if(!exists(m[1]))failures.push('REGISTRY missing '+m[1]);
 console.log('STATIC',sources.length,'source files and',pages.length,'pages audited');
}
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(BASE)).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Local server failed')}
async function testOne(ctx,file,profile){
 const page=await ctx.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))missing.push(r.status()+' '+r.url().slice(BASE.length))});
 try{
  const resp=await page.goto(BASE+file,{waitUntil:'load',timeout:16000});
  assert.equal(resp?.status(),200,'page responded 200');
  await page.waitForTimeout(160);
  const state=await page.evaluate(()=>{
   const imgs=[...document.images].filter(i=>i.loading!=='lazy'&&!i.hidden&&getComputedStyle(i).display!=='none'&&i.getBoundingClientRect().width>0);
   const broken=imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src);
   const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
   return {broken,images:imgs.length,duplicates:[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))],
    width:document.body.getBoundingClientRect().width,height:document.body.getBoundingClientRect().height};
  });
  if(errors.length)failures.push(profile+' '+file+' JavaScript: '+errors.join(' | ').slice(0,450));
  if(missing.length)failures.push(profile+' '+file+' 404: '+missing.join(', ').slice(0,450));
  if(state.broken.length)failures.push(profile+' '+file+' broken image: '+state.broken.join(', ').slice(0,450));
  if(state.duplicates.length)failures.push(profile+' '+file+' duplicate DOM ID '+state.duplicates.join(','));
  if(state.width<100||state.height<100)failures.push(profile+' '+file+' blank page');
  results.push({profile,file,images:state.images,errors:errors.length+missing.length+state.broken.length});
  views++;
 }catch(e){failures.push(profile+' '+file+' '+String(e).slice(0,450))}
 finally{await page.close()}
}
async function batch(browser,profile,config,subset=pages){
 const ctx=await browser.newContext({...config,reducedMotion:'reduce'});
 for(let i=0;i<subset.length;i+=4)await Promise.all(subset.slice(i,i+4).map(p=>testOne(ctx,p,profile)));
 await ctx.close();
}
try{
 staticAudit();await ready();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   await batch(browser,name+' desktop',{viewport:{width:1280,height:800}});
   await batch(browser,name+' tablet',{viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
   const key=['index.html','coop.html','wardrobe.html','egypt-nile-mystery.html','egypt-sphinx-temple.html','egypt-thoth-library.html','egypt-mummy-tomb.html','egypt-solar-barque.html','hades-final.html'];
   await batch(browser,name+' phone',{viewport:{width:390,height:844},hasTouch:true,isMobile:true},key);
  }finally{await browser.close()}
 }
}finally{server.kill()}
const unique=[...new Set(failures)];
console.log('FULL SITE AUDIT:',pages.length,'pages;',views,'browser views;',unique.length,'failures');
results.forEach(x=>{if(x.errors)console.log('IMAGE/JS',x.profile,x.file,x.errors)});
unique.forEach(e=>console.error('FAIL '+e));
fs.writeFileSync('tivvig-audit-results.json',JSON.stringify({time:new Date().toISOString(),pages:pages.length,views,errors:unique,results},null,2));
if(unique.length)process.exitCode=1;
