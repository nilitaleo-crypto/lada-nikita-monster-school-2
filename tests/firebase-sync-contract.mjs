/* TIVVIG security and sync contract: static guards, not a replacement for
   testing the deployed Firebase rules against a real authenticated session. */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules=JSON.parse(fs.readFileSync('firebase.database.rules.json','utf8')).rules;
const registry=fs.readFileSync('game-registry.js','utf8');
const controller=fs.readFileSync('coop.js','utf8');
const bridge=fs.readFileSync('world-coop-bridge.js','utf8');

const rewardKeys=[...registry.matchAll(/"key":"([^"]+)"/g)].map(m=>m[1]);
const roomRules=rules.rooms['$roomId'];
const teacherRewards=rules.teacherProfiles['$teacherId'].lada.rewards['$key']['.write'];
const roomRewards=roomRules.state.rewards['$key']['.write'];
function allowed(key,expression) {
 const pieces=[...expression.matchAll(/\$key\.matches\(\/([^/]+)\/\)/g)].map(m=>new RegExp(m[1]));
 assert(pieces.length>0,'No allowed key patterns in Firebase rule');
 return pieces.some(re=>re.test(key));
}
assert.equal(new Set(rewardKeys).size,rewardKeys.length,'Duplicate reward IDs in registry');
assert(rewardKeys.length>=40,'Reward registry unexpectedly shrunk');
for(const key of rewardKeys){
 assert(allowed(key,roomRewards),'Room will reject reward: '+key);
 assert(allowed(key,teacherRewards),'Teacher profile will reject reward: '+key);
}
for(const invalid of ['tivvig_egypt_admin_v1','tivvig_hades_stage_99_v1','tivvig_virus_v1']){
 assert(!allowed(invalid,roomRewards),'Unexpected room reward category: '+invalid);
 assert(!allowed(invalid,teacherRewards),'Unexpected teacher reward category: '+invalid);
}
assert(roomRules['.read'].includes('auth != null'),'Room read must require authentication');
assert(roomRules['.read'].includes('32,'),'Room links must use high-entropy IDs');
assert(roomRules['.write'].includes('google.com'),'Room creation must require Google teacher');
assert(roomRules.actions['$epoch']['$eventId']['.write'].includes('!data.exists()'),'Actions must not be overwritten');
assert(roomRules.actions['$epoch']['$eventId'].selector['.validate'].includes('450'),'Selector size must be bounded');
assert(controller.includes('limitToLast(512)'),'Reconnection replay window changed unexpectedly');
assert(controller.includes('Never execute a failed action on only one screen'));
assert(!controller.includes("Оно сработает только здесь: "),'One-sided Firebase failure fallback is dangerous');
assert(controller.includes('pendingWardrobeOutfit=null'),'Stale outfit selection must be cleared');
assert(bridge.includes("e.source!==window.parent||e.origin!==location.origin"),'Frame messages must check source and origin');
assert(bridge.includes('if(el&&!el.matches(gameClickTargets))'),'Remote CSS selectors must not click arbitrary links');
console.log('FIREBASE CONTRACT PASS:',rewardKeys.length,'registry rewards; room/profile rules, action checks, co-op guards');
