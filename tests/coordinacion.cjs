const vm=require('vm'),fs=require('fs'),assert=require('assert');const elements={};function element(id){return elements[id]??={value:'',innerHTML:'',textContent:'',style:{},classList:{},showModal(){},close(){},getContext(){return null},scrollHeight:1,scrollTop:0}}const ctx={document:{getElementById:element,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},crypto:require('crypto').webcrypto,performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},window:{addEventListener(){}},console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/traffic.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/presentation.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/ceo-office.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/building.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/app.js'),'utf8'),ctx);vm.runInContext(`
function advance(n){for(let k=0;k<n*20;k++)tickPeople(.05)}
if(people.length!==7||data.messages.length!==7)throw Error('Faltan empleados');
if(choosePlan('Quiero crear un sistema de inventario con base de datos').map(s=>s.agent).join()!=='1,3,5,4,6,2')throw Error('Plan completo incorrecto');
if(choosePlan('Corrige un error de código').map(s=>s.agent).join()!=='4,6')throw Error('Corrección activa empleados innecesarios');
if(choosePlan('Diseña la arquitectura').map(s=>s.agent).join()!=='3')throw Error('Arquitectura incorrecta');
if(choosePlan('Diseña mi base de datos SQL').map(s=>s.agent).join()!=='5,6')throw Error('Datos incorrectos');
send('Quiero crear un sistema de inventario con base de datos');advance(800);
if(data.requests.length!==1||people[0].mode!=='waiting')throw Error('No presentó la entrega');
if(data.tasks[0].steps.some(s=>s.status!=='Completada'||!s.output))throw Error('Faltan entregas');
if(!data.messages[6].some(m=>m.text.includes('Resultados recibidos del equipo')))throw Error('Calidad no recibió resultados');
send('Corrige un error de código');const id=data.requests[0].id;$('requests').onclick({target:{closest:()=>({dataset:{approve:id}})}});advance(400);
if(data.tasks[0].status!=='Completada · demo'||data.requests.length!==1)throw Error('Falló la cola');
const rid=data.requests[0].id;$('requests').onclick({target:{closest:()=>({dataset:{reject:rid}})}});advance(400);
if(data.requests.length!==1||mission.steps.some(s=>s.status!=='Completada'))throw Error('Falló la revisión');
console.log('OK: siete empleados, asignación selectiva, seis etapas, resultados compartidos, entrega, cola y revisión');`,ctx);
