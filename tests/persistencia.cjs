const assert=require('node:assert/strict');const {createHarness}=require('./harness.cjs');
const clone=store=>new Map(store);
function checkpoint(h){h.run('save()');return JSON.parse(h.storage.get('office3d-v2'));}
const h=createHarness();h.run("send('Quiero crear un sistema de inventario');send('Corrige un error de código');send('Escribe la documentación');");
let cases=new Set();
for(let n=0;n<18000;n++){
 h.run('tickPeople(.05)');const state=h.run('people.map(p=>p.mode).join()');
 const kind=state.includes('waiting')?'solicitud':state.includes('working')?'trabajo':state.includes('briefing')?'reunión':(state.includes('gatheringTask')||state.includes('delegating'))?'encargo':state.includes('walking')?'recorrido':state.includes('waiting')?'solicitud':null;
 if(kind&&!cases.has(kind)){
  cases.add(kind);const before=checkpoint(h),reloaded=createHarness(clone(h.storage)),after=checkpoint(reloaded);
  for(const field of ['tasks','requests','messages','activity'])assert.deepEqual(after[field],before[field],'Recarga conserva '+field+' en '+kind);
  assert.deepEqual(after.runtime.queueIds,before.runtime.queueIds);assert.equal(after.runtime.activeId,before.runtime.activeId);assert.deepEqual(after.runtime.people,before.runtime.people);
  reloaded.run('for(let i=0;i<18000;i++)tickPeople(.05)');assert.ok(reloaded.run('data.requests.length>0'),'Continúa después de recargar '+kind);
 }
 if(cases.has('solicitud'))break;
}
assert.deepEqual([...cases].sort(),['encargo','recorrido','reunión','solicitud','trabajo'].sort());
h.run("const r=data.requests[0];r.plan='Entrega editada por Paul';mission.result=r.plan;save();");
const waiting=createHarness(clone(h.storage));assert.equal(waiting.run('data.requests[0].plan'),'Entrega editada por Paul');
waiting.run("paused=true;simulationSpeed=4;save()");const pausedReload=createHarness(clone(waiting.storage));assert.equal(pausedReload.run('paused'),true);assert.equal(pausedReload.run('simulationSpeed'),4);
const corrupt=new Map([['office3d-v2','{dato incompleto']]);createHarness(corrupt);assert.ok([...corrupt.entries()].some(([k,v])=>k.startsWith('office3d-v2-backup-')&&v==='{dato incompleto'));
const legacy=new Map([['office3d-v2',JSON.stringify({tasks:[],requests:[],activity:['Anterior'],messages:[[],[],[]]})]]);const migrated=createHarness(legacy);assert.equal(migrated.run('data.messages.length'),7);assert.equal(migrated.run('data.activity[0]'),'Anterior');
console.log('OK: recarga conserva recorridos, reunión, trabajo, cola, encargos, solicitud editada, historial y pausa; copia de datos dañados y compatibilidad anterior.');
