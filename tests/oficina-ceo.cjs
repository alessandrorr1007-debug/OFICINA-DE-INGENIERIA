const assert=require('node:assert/strict');const {createHarness}=require('./harness.cjs');const h=createHarness();
const read=()=>JSON.parse(h.run('JSON.stringify(studioCeoTVState(mission,agents))'));
assert.equal(read().on,false);assert.equal(h.elements['ceo-tv-reader'].hidden,true);
h.run(`
if(trafficObstacles.some(o=>o.x===-4&&o.z===5&&o.w===3&&o.d===4.2))throw Error('Persiste colisión de la mesa eliminada');
const actor={i:99,pos:[0,6.7]};
if(!traffic.free([-4,5],[actor],actor))throw Error('Zona antigua de mesa no está libre');
for(const f of [...ceoFurniture,...ceoWallDecor]){
 if(!trafficObstacles.some(o=>o.id==='ceo-'+f.id))throw Error('Mueble sin colisión: '+f.id);
 if(traffic.free([f.x,f.z],[actor],actor))throw Error('Centro atravesable: '+f.id);
 for(const q of [[f.x+f.w/2-.01,f.z],[f.x,f.z+f.d/2-.01]])if(traffic.free(q,[actor],actor))throw Error('Borde atravesable: '+f.id);
}
if(ceoFurniture.filter(f=>f.kind==='chair').length!==2)throw Error('Asientos de visita incorrectos');
const starts=[...people.map(p=>p.home),[0,1]],goals=[ceoReception,[0,9.2],[-4,5],[4.6,4]],routes=[];
for(const from of starts)for(const to of goals){const p={i:99,pos:from},path=traffic.plan(from,to,[p],p);if(!path)throw Error('Destino CEO inaccesible: '+JSON.stringify({from,to}));let at=from;for(const q of path){const n=Math.max(1,Math.ceil(Math.hypot(q[0]-at[0],q[1]-at[1])/.025));for(let i=0;i<=n;i++){const point=[at[0]+(q[0]-at[0])*i/n,at[1]+(q[1]-at[1])*i/n];if(!traffic.free(point,[p],p))throw Error('Ruta atraviesa muebles: '+JSON.stringify(point))}at=q}routes.push(path)}
if(routes.length!==32)throw Error('Faltan recorridos de prueba CEO');
`);
h.run("send('Quiero crear un sistema de inventario');");const initial=read();assert.equal(initial.on,true);assert.match(initial.objective,/inventario/);assert.match(initial.team,/Luna/);assert.equal(h.elements['ceo-tv-reader'].hidden,false);
h.run('for(let i=0;i<20000&&people[0].mode!=="receiving";i++)tickPeople(.05)');assert.equal(h.run('people[0].mode'),'receiving');assert.deepEqual(JSON.parse(h.run('JSON.stringify(people[0].pos)')),[0,6.7]);h.run('tickPeople(2.1)');assert.notEqual(read().key,initial.key,'Resumen sigue el estado de la misión');
h.run('save()');const reload=createHarness(new Map(h.storage));assert.deepEqual(JSON.parse(reload.run('JSON.stringify(studioCeoTVState(mission,agents))')),read());
h.run('for(let i=0;i<24000&&!data.requests.length;i++)tickPeople(.05)');assert.ok(h.run('data.requests.length>0'));const id=h.run('data.requests[0].id');h.elements.requests.onclick({target:{closest:()=>({dataset:{approve:id}})}});assert.equal(read().on,false);assert.equal(h.elements['ceo-tv-reader'].hidden,true);
const visit=createHarness();visit.run("active=1;$('call').onclick();for(let i=0;i<10000&&people[1].mode!=='visiting';i++)tickPeople(.05)");assert.equal(visit.run('people[1].mode'),'visiting','Visita llega sin la mesa');
console.log('OK: mesa retirada, nueve muebles y cuatro adornos de pared protegidos, 32 rutas CEO libres, recepción, visita, TV activa/apagada y recarga.');
