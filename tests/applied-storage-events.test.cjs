'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../applied-ui.js'),'utf8');
const start=source.indexOf("window.addEventListener('storage',");
const end=source.indexOf("window.addEventListener('pagehide',",start);
assert(start>=0&&end>start);
function setup(){
 const c={KEY:'app-key',lastRaw:'latest-value',blocked:false,storageError:'',renders:0,remote:'latest-value'};
 c.window={addEventListener:(name,fn)=>{assert.equal(name,'storage');c.listener=fn;}};
 c.localStorage={getItem:key=>{assert.equal(key,c.KEY);return c.remote;}};
 c.render=()=>c.renders++;
 vm.runInNewContext(source.slice(start,end),c);return c;
}
test('obsolete queued storage events do not block when live data is unchanged',()=>{
 const c=setup();c.listener({key:c.KEY,newValue:'old-value'});assert.equal(c.blocked,false);assert.equal(c.renders,0);
});
test('genuine conflicting current data still blocks even if event payload looks familiar',()=>{
 const c=setup();c.remote='other-tab-current';c.listener({key:c.KEY,newValue:c.lastRaw});assert.equal(c.blocked,true);assert.equal(c.remote,'other-tab-current');assert.equal(c.renders,1);
});
test('storage clearing is a conflict while unrelated keys do not block',()=>{
 const c=setup();c.remote=null;c.listener({key:'unrelated',newValue:null});assert.equal(c.blocked,false);c.listener({key:null,newValue:null});assert.equal(c.blocked,true);assert.equal(c.renders,1);
});
