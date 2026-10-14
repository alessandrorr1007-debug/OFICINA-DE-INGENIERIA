const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const name of ['coordinacion.cjs','recorridos.cjs','reuniones.cjs','escena.mjs','persistencia.cjs','trafico.cjs','debug.cjs']){
 const r=spawnSync(process.execPath,[path.join(__dirname,name)],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
