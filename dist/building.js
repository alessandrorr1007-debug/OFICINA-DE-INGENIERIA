'use strict';
const STUDIO_FLOOR_HEIGHT=10;
const connectionStations=[
 ['github','GitHub','Hugo','Bibliotecario del repositorio','Consultar repositorios, ramas e historial de cambios.','#7c91b8',-12,-12,'repositorio'],
 ['ai','IA','Iris','Especialista en modelos de IA','Configurar modelos y coordinar las futuras respuestas de los agentes.','#7776a3',12,-12,'modelos'],
 ['database','Base de datos en la nube','Vera','Administradora de datos','Sincronizar misiones, entregas e historial entre dispositivos.','#b6984f',-12,0,'servidores'],
 ['drive','Almacenamiento (Drive)','Omar','Archivista digital','Organizar documentos, archivos y entregables del estudio.','#5e8c72',12,0,'archivos'],
 ['deploy','Despliegue','Teo','Operador de despliegues','Preparar versiones y publicaciones de los proyectos.','#4c8f9b',-12,12,'despliegue'],
 ['mail','Correo y calendario','Sara','Coordinadora de comunicaciones','Preparar correos y organizar reuniones y recordatorios.','#c78461',12,12,'agenda']
].map(([id,nombre,name,role,descripcion,color,x,z,tipo],i)=>({id,nombre,estado:'Desconectado',descripcion,color,pos:[x,z],tipo,encargado:{id:'hub-'+i,name,role,color,skin:['#e3b18b','#b67d58','#efc69d','#c58e65','#d1a17e','#e2b08c'][i],hair:['#384036','#49332d','#74513a','#273a3c','#393a45','#5d3a37'][i]},mobiliario:[{tipo:'escritorio',x,z:z+.5,w:3.2,d:1.3,h:1.12},{tipo:'archivo',x:x+Math.sign(x)*3,z:z+1.8,w:.9,d:2.2,h:1.8}],visita:[x-Math.sign(x)*3.4,z+1.8]}));
const buildingPortals=[
 {id:'stairs',nombre:'Escaleras',kind:'stairs',capacity:1,landings:{1:[-20,-13.5],2:[-20,.9]},footprint:{x:-20,z:-6.2,w:2.6,d:13.2}},
 {id:'lift-a',nombre:'Ascensor A',kind:'lift',capacity:1,x:20,z:-8,landings:{1:[18,-8],2:[18,-8]},footprint:{x:20,z:-8,w:2.8,d:2.8}},
 {id:'lift-b',nombre:'Ascensor B',kind:'lift',capacity:1,x:20,z:-13,landings:{1:[18,-13],2:[18,-13]},footprint:{x:20,z:-13,w:2.8,d:2.8}}
];
const studioFloorHoles=[{x:-20,z:-6.2,w:3.2,d:13.2},{x:20,z:-10.5,w:3.2,d:8.2}];
// Divide losas y líneas de suelo para abrir huecos reales sin mover las oficinas.
function studioCutFloor(x,z,w,d){let rects=[{x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2}];for(const h of studioFloorHoles){const a=h.x-h.w/2,b=h.x+h.w/2,c=h.z-h.d/2,e=h.z+h.d/2;rects=rects.flatMap(r=>{const x0=Math.max(a,r.x0),x1=Math.min(b,r.x1),z0=Math.max(c,r.z0),z1=Math.min(e,r.z1);if(x0>=x1||z0>=z1)return[r];return[{x0:r.x0,x1:x0,z0:r.z0,z1:r.z1},{x0:x1,x1:r.x1,z0:r.z0,z1:r.z1},{x0,x1,z0:r.z0,z1:z0},{x0,x1,z0:z1,z1:r.z1}].filter(q=>q.x1-q.x0>.001&&q.z1-q.z0>.001)})}return rects.map(r=>({x:(r.x0+r.x1)/2,z:(r.z0+r.z1)/2,w:r.x1-r.x0,d:r.z1-r.z0}))}
function createStudioBuilding(staff,upperTraffic,getDirector){
 const attendants=connectionStations.map((s,k)=>({...s.encargado,i:8+k,station:s.id,floor:1,elevation:0,home:[s.pos[0],s.pos[1]-.8],pos:[s.pos[0],s.pos[1]-.8],yaw:0,mode:'working',phase:k,route:[],timer:18+k*7,nextBreak:30,job:null,roaming:false}));
 const obstacles=[...connectionStations.map(s=>({x:s.pos[0],z:s.pos[1]-3.9,w:8.4,d:.12})),...connectionStations.flatMap(s=>s.mobiliario.map(f=>({x:f.x,z:f.z,w:f.w+.1,d:f.d+.1}))),{x:0,z:1,w:5.2,d:1.4},...buildingPortals.map(p=>p.footprint)];
 const lowerTraffic=createStudioTraffic(obstacles),portals=buildingPortals.map(p=>({...p,owner:null,y:0,door:0,doorFloor:1}));let serial=0;
 const all=()=>[...staff,...attendants,...(getDirector()?[getDirector()]:[])];
 const height=p=>Number.isFinite(p.elevation)?p.elevation:(p.floor===1?0:STUDIO_FLOOR_HEIGHT);
 const actors=f=>all().filter(p=>Math.abs(height(p)-(f===1?0:STUDIO_FLOOR_HEIGHT))<.7);
 const manager=f=>f===1?lowerTraffic:upperTraffic;
 const portal=d=>portals.find(p=>p.id===d.connector);
 function walk(p,to){p.mode='walking';p.route=[[...to]];p.after=null;p.afterKind=null;manager(p.floor).request(p)}
 function finish(p){const c=p.demo&&portal(p.demo);if(c?.owner===p.i)c.owner=null;delete p.demo;p.elevation=STUDIO_FLOOR_HEIGHT;p.floor=2;p.mode='idle';p.route=[];p.nextBreak=35;p.yaw=0}
 function launch(p,stationId,choice='auto'){
  if(!p||p.demo||p.job||p.mode!=='idle'||p.floor!==2||!connectionStations.some(s=>s.id===stationId))return false;
  const c=choice==='auto'?portals[(serial++)%portals.length]:portals.find(q=>q.id===choice);if(!c)return false;
  p.demo={station:stationId,connector:c.id,phase:'queue',t:0,from:2,to:1,returnEarly:false};p.mode='demo';p.route=[];p.timer=0;return true;
 }
 function safe3D(p,q){const prev=[p.pos[0],height(p),p.pos[1]],n=Math.max(1,Math.ceil(Math.hypot(q[0]-prev[0],q[1]-prev[1],q[2]-prev[2])/.06));for(let k=1;k<=n;k++){const t=k/n,x=prev[0]+(q[0]-prev[0])*t,y=prev[1]+(q[1]-prev[1])*t,z=prev[2]+(q[2]-prev[2])*t;if(all().some(a=>a!==p&&Math.hypot(a.pos[0]-x,height(a)-y,a.pos[1]-z)<.74))return false}p.yaw=Math.atan2(q[0]-prev[0],q[2]-prev[2])||p.yaw;p.pos=[q[0],q[2]];p.elevation=q[1];p.floor=q[1]>=STUDIO_FLOOR_HEIGHT/2?2:1;p.phase+=Math.hypot(q[0]-prev[0],q[1]-prev[1],q[2]-prev[2])*5;return true}
 function stairPath(from){const points=[[-20,0,-13.5],[-20,0,-12]];for(let k=0;k<40;k++){points.push([-20,(k+1)*.25,-12+k*.3],[-20,(k+1)*.25,-12+(k+1)*.3])}points.push([-20,10,.9]);return from===1?points:points.reverse()}
 function destinationFree(p,c,d){const q=c.landings[d.to];return actors(d.to).every(a=>a===p||Math.hypot(a.pos[0]-q[0],a.pos[1]-q[1])>=1)}
 function cross(p,dt){const d=p.demo,c=portal(d),base=d.from===1?0:10,end=d.to===1?0:10;
  if(c.kind==='stairs'){const path=stairPath(d.from),q=path[d.step];if(!q)return completeCross(p);const at=[p.pos[0],height(p),p.pos[1]],dist=Math.hypot(...q.map((v,i)=>v-at[i])),amount=Math.min(dist,dt*1.9),next=dist<.0001?q:q.map((v,i)=>at[i]+(v-at[i])*amount/dist);if(safe3D(p,next)&&dist<=amount+.00001)d.step++;return}
  const t=d.t+dt,landing=c.landings[d.from],exit=c.landings[d.to];let q,door=0,doorFloor=d.from,y=base;
  if(t<1){door=t;q=[landing[0],base,landing[1]]}
  else if(t<2.2){door=1;const u=(t-1)/1.2;q=[landing[0]+(c.x-landing[0])*u,base,c.z]}
  else if(t<3){door=1-(t-2.2)/.8;q=[c.x,base,c.z]}
  else if(t<7){y=base+(end-base)*(t-3)/4;q=[c.x,y,c.z]}
  else if(t<7.8){y=end;door=(t-7)/.8;doorFloor=d.to;q=[c.x,end,c.z]}
  else if(t<9){y=end;door=1;doorFloor=d.to;const u=(t-7.8)/1.2;q=[c.x+(exit[0]-c.x)*u,end,c.z]}
  else if(t<9.8){y=end;door=Math.max(0,1-(t-9)/.8);doorFloor=d.to;q=[exit[0],end,exit[1]]}
  else{c.y=end;c.door=0;return completeCross(p)}
  if(safe3D(p,q)){d.t=t;c.y=y;c.door=door;c.doorFloor=doorFloor}
 }
 function completeCross(p){const d=p.demo,c=portal(d);p.floor=d.to;p.elevation=d.to===1?0:10;p.pos=[...c.landings[d.to]];d.release=true;d.phase=d.to===1?'toStation':'home';walk(p,d.to===1?connectionStations.find(s=>s.id===d.station).visita:p.home)}
 function step(dt){if(dt<=0)return;for(const p of staff){if(!p.demo)continue;const d=p.demo,c=portal(d);
   if(d.release&&Math.hypot(p.pos[0]-c.landings[p.floor][0],p.pos[1]-c.landings[p.floor][1])>1){if(c.owner===p.i)c.owner=null;d.release=false}
   if(d.phase==='queue'||d.phase==='returnQueue'){p.mode='demo';if(c.owner!==null&&c.owner!==p.i){p.waitingTraffic=true;continue}c.owner=p.i;p.waitingTraffic=false;d.from=p.floor;d.to=p.floor===1?2:1;d.phase='toPortal';walk(p,c.landings[p.floor])}
   else if(['toPortal','toStation','home'].includes(d.phase)){manager(p.floor).step(p,dt,actors(p.floor));if(!p.route.length){if(d.phase==='home'){finish(p);continue}if(d.phase==='toStation'){d.phase='visit';d.t=d.returnEarly?0:7;p.mode='demo';if(c.owner===p.i)c.owner=null;d.release=false}else{d.phase='wait';p.mode='demo'}}}
   else if(d.phase==='wait'){if(c.kind==='lift'&&Math.abs(c.y-(d.from===1?0:10))>.001){const end=d.from===1?0:10;c.door=0;c.y+=Math.sign(end-c.y)*Math.min(Math.abs(end-c.y),dt*2.5);continue}if(destinationFree(p,c,d)){d.phase='cross';d.t=0;d.step=1;p.mode=c.kind==='stairs'?'stairs':'elevator';p.waitingTraffic=false;if(c.kind==='lift'){c.y=d.from===1?0:10;c.doorFloor=d.from;c.door=0}}else p.waitingTraffic=true}
   else if(d.phase==='cross')cross(p,dt);
   else if(d.phase==='visit'){p.phase+=dt*4;d.t-=dt;if(d.t<=0)d.phase='returnQueue'}
  }
  for(const p of attendants){if(p.mode==='walking'){lowerTraffic.step(p,dt,actors(1));if(!p.route.length){p.mode='working';p.timer=p.roaming?4:20+p.i;p.yaw=0}}else{p.phase+=dt*6;p.timer-=dt;if(p.timer<=0){p.roaming=!p.roaming;const s=connectionStations.find(s=>s.id===p.station);walk(p,p.roaming?[s.pos[0]-Math.sign(s.pos[0])*2.6,s.pos[1]-2.2]:p.home)}}}
 }
 function recall(){staff.forEach(p=>{if(p.demo){p.demo.returnEarly=true;if(p.demo.phase==='visit')p.demo.t=0}})}
 function snapshot(){return{version:1,serial,attendants:attendants.map(p=>({i:p.i,pos:[...p.pos],floor:1,yaw:p.yaw,mode:p.mode,phase:p.phase,route:p.route.map(q=>[...q]),timer:p.timer,roaming:p.roaming})),visits:staff.filter(p=>p.demo).map(p=>({i:p.i,...p.demo})),portals:portals.map(c=>({id:c.id,owner:c.owner,y:c.y,door:c.door,doorFloor:c.doorFloor}))}}
 function restore(saved){if(!saved||saved.version!==1)return;const point=q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite);serial=Number.isFinite(saved.serial)?saved.serial:0;
  for(const q of saved.attendants||[]){const p=attendants.find(a=>a.i===q.i);if(p&&point(q.pos)&&['working','walking'].includes(q.mode)&&Array.isArray(q.route)&&q.route.every(point)&&[q.yaw,q.phase,q.timer].every(Number.isFinite)){Object.assign(p,q,{floor:1,elevation:0});if(p.mode==='walking')lowerTraffic.request(p)}}
  for(const d of saved.visits||[]){const p=staff[d.i];if(p&&connectionStations.some(s=>s.id===d.station)&&portals.some(c=>c.id===d.connector)&&['queue','returnQueue','toPortal','toStation','home','wait','cross','visit'].includes(d.phase)&&[1,2].includes(d.from)&&[1,2].includes(d.to)&&Number.isFinite(d.t)){p.demo={...d};if(d.phase==='cross'&&(!Number.isInteger(d.step)||d.step<1))p.demo.step=1;if(p.mode==='walking')manager(p.floor).request(p)}}
  for(const q of saved.portals||[]){const c=portals.find(p=>p.id===q.id);if(c&&[q.y,q.door].every(Number.isFinite)){c.y=Math.max(0,Math.min(10,q.y));c.door=Math.max(0,Math.min(1,q.door));c.doorFloor=q.doorFloor===2?2:1;c.owner=staff.some(p=>p.i===q.owner&&p.demo?.connector===c.id)?q.owner:null}}
 }
 return{attendants,portals,obstacles,lowerTraffic,actors,height,launch,step,recall,snapshot,restore,hasVisitors:()=>staff.some(p=>p.demo)};
}
