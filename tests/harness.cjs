const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function createHarness(storage=new Map(),options={}){
 const elements={};function element(id){return elements[id]??={value:'',innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},showModal(){},close(){},getContext(){return null},scrollHeight:1,scrollTop:0}}
 const ctx={location:{search:options.search||''},document:{getElementById:element,querySelectorAll:()=>[]},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},crypto:require('node:crypto').webcrypto,performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},window:{addEventListener(){}},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/traffic.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/presentation.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/ceo-office.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8'),ctx);
 return{ctx,elements,storage,run:s=>vm.runInContext(s,ctx)};
}
module.exports={...createHarness(),createHarness};
