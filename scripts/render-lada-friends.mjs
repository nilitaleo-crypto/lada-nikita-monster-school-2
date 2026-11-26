// Render a still photo from the exact characters already stored in the repo.
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:2400,height:1350},deviceScaleFactor:1,reducedMotion:'reduce'});
 const address='file://'+process.cwd()+'/lada-friends-photo.html';
 await page.goto(address,{waitUntil:'load'});
 const misses=await page.evaluate(async()=>{
   const imgs=[...document.images];
   await Promise.all(imgs.map(img=>img.decode().catch(()=>null)));
   return imgs.filter(i=>!i.naturalWidth).map(i=>i.src);
 });
 if(misses.length)throw Error('Original images not loaded: '+misses.join(', '));
 await page.locator('#photo').screenshot({path:'images/lada-friends-original-photo.png',animations:'disabled'});
 console.log('Created photo with '+await page.locator('#photo img').count()+' original site images');
}finally{await browser.close()}