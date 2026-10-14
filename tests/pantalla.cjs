const assert=require('node:assert/strict');
const {createHarness}=require('./harness.cjs');
const state=h=>JSON.parse(h.run('JSON.stringify(studioMeetingScreenState(mission,people[0],agents))'));
for(const speed of [1,2,4]){
 const h=createHarness();assert.equal(state(h).active,false);
 h.run("send('Quiero crear un sistema de inventario con base de datos');");
 h.run("for(let i=0;i<20000&&people[0].mode!=='briefing';i++)tickPeople(.05)");
 assert.equal(state(h).active,true);assert.equal(state(h).assignments.length,0);assert.equal(state(h).participants.length,6);
 const seen=new Set(),presented=new Set();let elapsed=0;
 while(state(h).active&&elapsed<40){const s=state(h);seen.add(s.key);s.assignments.forEach(a=>presented.add(a.name));h.run(`tickPeople(${.016*speed})`);elapsed+=.016*speed}
 assert.ok(seen.size>=7,'Objetivo y seis encargos cambian en pantalla');assert.equal(presented.size,6);assert.equal(state(h).active,false);assert.equal(state(h).key,'idle');assert.equal(h.elements['meeting-reader'].hidden,true);
 assert.ok(h.run("data.messages[0].filter(m=>m.text.startsWith('Nico presenta el encargo de ')).length===6"));
}
const h=createHarness();h.run("send('Quiero crear un sistema de inventario '+ 'con requisitos claros '.repeat(35));for(let i=0;i<20000&&people[0].mode!=='briefing';i++)tickPeople(.05)");
const initial=state(h);assert.ok(initial.pages>1);assert.equal(h.elements['meeting-reader'].hidden,false);
const pages=new Set();h.run('tickPeople(5);save()');const before=state(h),restored=createHarness(new Map(h.storage));assert.deepEqual(state(restored),before,'Recarga conserva diapositiva y explicación');
let combined='';const originals=h.run('studioObjectivePages(mission.text)');combined=Array.from(originals).join(' ');assert.equal(combined,h.run('mission.text').trim().replace(/\s+/g,' '));
const frozen=state(h);h.run('paused=true;for(let i=0;i<20;i++)tickPeople(0)');assert.deepEqual(state(h),frozen,'Pausa no cambia contenido');
while(state(restored).active){pages.add(state(restored).page);restored.run('tickPeople(.05)')}
assert.ok(pages.size>1,'Objetivo largo avanza por páginas');assert.equal(state(restored).active,false);
console.log('OK: pantalla presenta objetivo, seis encargos a ×1/×2/×4, pausa, recarga, texto largo y reposo al terminar.');
