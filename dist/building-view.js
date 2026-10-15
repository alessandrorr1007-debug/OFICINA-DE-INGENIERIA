'use strict';
function createConnectionCenterVisual({THREE,scene,groups,box,ball,layer,material,cube,building}){
 const lifts=[];layer(1);
 box(0,-.24,0,44,.48,44,'#b9aa8b');box(0,.02,0,43.8,.04,43.8,'#e6e1d8');
 for(let z=-21;z<22;z+=2)box(0,.05,z,43.8,.008,.018,'#d6d1c9');
 for(const x of[-22,22])box(x,.52,0,.16,1.04,44,'#c2d0ca');for(const z of[-22,22])box(0,.52,z,44,1.04,.16,'#c2d0ca');
 for(const x of[-5.8,5.8])box(x,.065,0,2.1,.02,40,'#bcc4c4');for(const z of[-18,6,18])box(0,.067,z,41,.02,1.8,'#bcc4c4');
 // Recepción central abierta y orientación de circulación.
 box(0,.09,0,7.6,.025,6.5,'#d3d8d3');box(0,.55,1,5.2,1.1,1.4,'#c5a382');box(0,1.15,1,5.3,.10,1.5,'#e8dbc0');box(0,.8,1.72,3.8,.26,.025,'#344b4b');
 function sign(text,subtitle,x,y,z,w=5.4){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#263b3b';ctx.fillRect(0,0,1024,256);ctx.font='600 45px system-ui, sans-serif';ctx.fillStyle='#f6f1e6';ctx.fillText(text,40,94,940);ctx.fillStyle='#c6b3ae';ctx.font='32px system-ui, sans-serif';ctx.fillText(subtitle,40,175,940);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.DoubleSide}));mesh.position.set(x,y,z);groups[1].add(mesh)}
 sign('CENTRO DE CONEXIONES','Recepción · Planta 1',0,2.5,1.73,6);
 for(const s of connectionStations){const[x,z]=s.pos;
  box(x,.08,z,8.6,.025,8.6,'#c5a382');box(x,.101,z,8.25,.02,8.25,'#f3f0e8');box(x,1.2,z-3.9,8.4,2.4,.12,'#e8e5df');box(x,2.46,z-3.9,8.5,.09,.2,s.color);sign(s.nombre,'● Desconectado',x,2.01,z-3.8,6.6);
  for(const f of s.mobiliario){if(f.tipo==='escritorio'){box(f.x,1.12,f.z,f.w,.15,f.d,'#c5a382');for(const dx of[-1.35,1.35])for(const dz of[-.45,.45])box(f.x+dx,.55,f.z+dz,.09,1.1,.09,'#596d60');box(f.x,1.56,f.z+.1,1,.62,.1,'#344b4b');box(f.x,1.56,f.z+.16,.86,.48,.02,'#85938f');box(f.x,1.22,f.z-.3,.65,.035,.24,'#e8dbc0');box(f.x,.72,z-.8,.7,.14,.7,s.color);box(f.x,1.08,z-1.1,.7,.66,.12,s.color)}else{box(f.x,f.h/2,f.z,f.w,f.h,f.d,'#997354');for(let j=0;j<4;j++){box(f.x-Math.sign(x)*.47,.3+j*.4,f.z,.03,.26,1.86,'#c5a382');ball(f.x-Math.sign(x)*.5,.3+j*.4,f.z+.5,.025,.025,.025,'#344b4b')}}}
  // Cada especialidad mantiene una silueta propia sobre su módulo.
  if(s.tipo==='repositorio'||s.tipo==='archivos'){for(let k=0;k<7;k++)box(x+1.08,1.3+k*.055,z+.65,.65,.05,.5,[s.color,'#e8dbc0','#344b4b'][k%3])}
  if(s.tipo==='modelos'){ball(x+1.08,1.48,z+.65,.28,.28,.28,s.color);for(const dx of[-.35,.35])ball(x+1.08+dx,1.48,z+.65,.07,.07,.07,'#b89b65')}
  if(s.tipo==='servidores'){for(let k=0;k<3;k++){box(x+1.02,1.34+k*.18,z+.65,.65,.14,.4,'#344b4b');ball(x+.82,1.34+k*.18,z+.88,.025,.025,.025,'#a57590')}}
  if(s.tipo==='despliegue'){for(let k=0;k<3;k++)box(x+.8+k*.22,1.3+k*.1,z+.65,.18,.15+k*.2,.35,s.color)}
  if(s.tipo==='agenda'){box(x+1.1,1.51,z+.65,.66,.55,.08,'#e8dbc0');for(let k=0;k<3;k++)box(x+1.1,1.38+k*.14,z+.7,.45,.03,.02,s.color)}
 }
 // Estructura abierta entre niveles, sin techo que oculte la planta inferior.
 layer(0);for(const x of[-21.7,21.7])for(const z of[-21.7,21.7])box(x,5,z,.25,10,.25,'#6f8580');
 for(let k=0;k<40;k++){const y=(k+1)*.25,z=-12+(k+.5)*.3;box(-20,y-.09,z,2.4,.18,.3,'#c5a382');for(const x of[-21.15,-18.85]){box(x,y+.95,z,.07,.07,.31,'#344b4b');if(k%5===0)box(x,y+.45,z,.065,1,.065,'#344b4b')}}
 box(-20,9.91,.48,2.4,.18,.96,'#c5a382');box(-20,-.02,-13.1,2.4,.12,1.8,'#c5a382');
 for(const c of building.portals.filter(c=>c.kind==='lift')){
  for(const x of[c.x-1.35,c.x+1.35])for(const z of[c.z-1.35,c.z+1.35])box(x,6.2,z,.11,12.4,.11,'#6f8580');
  const doors=[];
  for(const f of[1,2]){layer(f);box(c.x+1.3,1.4,c.z,.12,2.8,2.65,'#c2d0ca');for(const z of[c.z-1.3,c.z+1.3])box(c.x,1.4,z,2.6,2.8,.12,'#c2d0ca');box(c.x-1.4,2.75,c.z,.18,.15,2.9,'#344b4b');box(c.x-1.42,.025,c.z,.6,.04,2.5,'#b89b65');
   for(const side of[-1,1]){const door=new THREE.Mesh(cube.geometry,material('#83999b'));door.scale.set(.09,2.5,1.23);door.position.set(c.x-1.3,1.3,c.z+side*.62);groups[f].add(door);doors.push({door,f,side})}
  }
  const cabin=new THREE.Group();const floor=new THREE.Mesh(cube.geometry,material('#c5a382'));floor.scale.set(2.45,.15,2.45);floor.position.set(c.x,.06,c.z);cabin.add(floor);const back=new THREE.Mesh(cube.geometry,material('#e8e5df'));back.scale.set(.08,2.45,2.4);back.position.set(c.x+1.13,1.3,c.z);cabin.add(back);groups[0].add(cabin);lifts.push({c,cabin,doors});layer(0);
 }
 // Barandillas alrededor de los huecos de escalera en la planta superior.
 layer(2);for(const x of[-21.45,-18.55]){box(x,.95,-6.2,.08,.08,13.2,'#344b4b');for(let z=-12.6;z<.5;z+=2)box(x,.5,z,.07,1,.07,'#344b4b')}box(-20,.95,-12.8,2.9,.08,.08,'#344b4b');
 return{update(view){for(const {c,cabin,doors} of lifts){cabin.position.y=c.y;cabin.visible=view==='all'||(view===1?c.y<9.4:c.y>.6);for(const {door,f,side} of doors){const opening=c.doorFloor===f?c.door:0;door.position.z=c.z+side*(.62+opening*1.18)}}}};
}
