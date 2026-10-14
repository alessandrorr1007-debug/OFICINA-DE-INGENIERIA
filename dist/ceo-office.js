'use strict';
// Dimensiones compartidas por la geometría y los obstáculos de la oficina CEO.
const ceoFurniture=[
 {id:'tv-console',kind:'console',x:-6.3,z:5,w:1,d:5.8,h:.85},
 {id:'bookcase',kind:'bookcase',x:6.25,z:4,w:.85,d:3.8,h:2.3},
 {id:'credenza',kind:'credenza',x:4.65,z:10.95,w:3.3,d:.9,h:1},
 {id:'visitor-left',kind:'chair',x:-2.4,z:6.6,w:.85,d:.95,h:1.4},
 {id:'visitor-right',kind:'chair',x:2.4,z:6.6,w:.85,d:.95,h:1.4},
 {id:'floor-lamp',kind:'lamp',x:-5.4,z:8.8,w:.7,d:.7,h:2.4},
 ...[[-5.8,1.5],[5.8,1.5],[-5.8,10.7]].map(([x,z],i)=>({id:'plant-'+i,kind:'plant',x,z,w:1.35,d:1.35,h:2.5}))
];
const ceoWallDecor=[
 ...[-2.1,0,2.1].map((x,i)=>({id:'diploma-'+i,kind:'diploma',x,z:11.73,w:1.4,d:.16})),
 {id:'clock',kind:'clock',x:4.65,z:11.7,w:.98,d:.2}
];
const ceoReception=[0,6.7];
function studioCeoTVState(task,team){
 if(!task)return{on:false,key:'off',title:'',objective:'',status:'',team:''};
 const title=task.title||'Misión de Paul',objective=String(task.text||''),status=String(task.status||''),names=[...new Set((task.steps||[]).map(s=>team[s.agent]?.name).filter(Boolean))].join(' · ');
 return{on:true,key:JSON.stringify([task.id,title,objective,status,names]),title,objective,status,team:names};
}
