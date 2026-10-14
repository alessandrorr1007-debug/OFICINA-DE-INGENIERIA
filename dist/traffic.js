'use strict';
// Turnos de circulación: un desplazamiento activo; los demás esperan sin superponerse.
globalThis.createStudioTraffic=function(obstacles){
 const minimumDistance=.72,clearance=.76,radius=.34,cell=.25,size=177;
 let owner=null,parking=false,serial=0;const tickets=new WeakMap();
 function free(q,actors,actor){return q[0]>-21.6&&q[0]<21.6&&q[1]>-21.6&&q[1]<21.6&&!obstacles.some(r=>q[0]>r.x-r.w/2-radius&&q[0]<r.x+r.w/2+radius&&q[1]>r.z-r.d/2-radius&&q[1]<r.z+r.d/2+radius)&&actors.every(p=>p===actor||Math.hypot(q[0]-p.pos[0],q[1]-p.pos[1])>=clearance)}
 function line(a,b,actors,actor){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.06));for(let i=1;i<=n;i++)if(!free([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n],actors,actor))return false;return true}
 function plan(from,to,actors,actor){
  if(!free(to,actors,actor))return null;if(line(from,to,actors,actor))return[[...to]];
  const grid=q=>[Math.round((q[0]+22)/cell),Math.round((q[1]+22)/cell)],world=q=>[q[0]*cell-22,q[1]*cell-22],key=q=>q[0]+q[1]*size,start=grid(from),goal=grid(to),open=[],cost=new Map([[key(start),0]]),parents=new Map(),closed=new Set(),allowed=new Map();
  const valid=q=>{const k=key(q);if(!allowed.has(k))allowed.set(k,free(world(q),actors,actor));return allowed.get(k)};
  const distance=q=>Math.hypot(goal[0]-q[0],goal[1]-q[1]);
  function push(v){open.push(v);let i=open.length-1;while(i){const p=(i-1)>>1;if(open[p].f<=v.f)break;open[i]=open[p];i=p}open[i]=v}
  function pop(){const first=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let c=i*2+1;if(c+1<open.length&&open[c+1].f<open[c].f)c++;if(open[c].f>=last.f)break;open[i]=open[c];i=c}open[i]=last}return first}
  push({q:start,f:distance(start)});
  while(open.length){const q=pop().q,k=key(q);if(closed.has(k))continue;closed.add(k);if(k===key(goal)){const points=[[...to]];let at=k;while(at!==key(start)){points.push(world([at%size,Math.floor(at/size)]));at=parents.get(at);if(at===undefined)return null}points.reverse();const result=[];let base=from;for(let i=0;i<points.length;){let end=i;while(end+1<points.length&&line(base,points[end+1],actors,actor))end++;if(!line(base,points[end],actors,actor))return null;result.push(points[end]);base=points[end];i=end+1}return result}
   for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const n=[q[0]+dx,q[1]+dz];if(n.some(v=>v<0||v>=size)||!valid(n)||(dx&&dz&&(!valid([q[0]+dx,q[1]])||!valid([q[0],q[1]+dz]))))continue;const nk=key(n),g=cost.get(k)+Math.hypot(dx,dz);if(g<(cost.get(nk)??Infinity)){cost.set(nk,g);parents.set(nk,k);push({q:n,f:g+distance(n)})}}
  }return null;
 }
 function recover(actors){const accepted=[],moved=[];for(const p of [...actors].sort((a,b)=>(a.mode==='walking'?1:0)-(b.mode==='walking'?1:0)||a.i-b.i)){if(!free(p.pos,accepted,p)){let found=null;for(let r=.25;r<=4&&!found;r+=.25)for(let a=0;a<16;a++){const q=[p.pos[0]+Math.cos(a*Math.PI/8)*r,p.pos[1]+Math.sin(a*Math.PI/8)*r];if(free(q,accepted,p)){found=q;break}}if(found){moved.push(p.i);p.pos=found}}accepted.push(p)}return moved}
 function request(p){tickets.set(p,++serial);if(owner===p){owner=null;parking=false}p.waitingTraffic=false}
 function release(){if(owner){delete owner.trafficPath;owner.waitingTraffic=false}owner=null;parking=false}
 function acquire(actors){if(owner&&(owner.mode!=='walking'||!owner.route.length))release();if(owner)return;
  const waiting=actors.filter(p=>p.mode==='walking'&&p.route.length).sort((a,b)=>(a.job?0:1)-(b.job?0:1)||(tickets.get(a)||0)-(tickets.get(b)||0));
  for(const p of waiting){const path=plan(p.pos,p.route[p.route.length-1],actors,p);if(path){owner=p;parking=false;p.trafficPath=path;return}}
  // Si hay intercambio de destinos ocupados, uno se aparta antes de dar paso.
  for(const p of waiting){const options=p.home?[p.home]:[];for(const r of [1.1,2,3])for(let a=0;a<8;a++)options.push([p.pos[0]+Math.cos(a*Math.PI/4)*r,p.pos[1]+Math.sin(a*Math.PI/4)*r]);for(const q of options){if(Math.hypot(q[0]-p.pos[0],q[1]-p.pos[1])<.9)continue;const path=plan(p.pos,q,actors,p);if(path){owner=p;parking=true;p.trafficPath=path;return}}}
 }
 function step(p,dt,actors,speed=1.8){if(dt<=0||p.mode!=='walking')return false;if(!p.route.length)return false;acquire(actors);p.waitingTraffic=owner!==p;if(owner!==p)return false;
  const q=p.trafficPath[0];if(!q){if(!parking)p.route=[];release();return true}const dx=q[0]-p.pos[0],dz=q[1]-p.pos[1],d=Math.hypot(dx,dz),amount=Math.min(d,dt*speed),next=d<.0001?[...q]:[p.pos[0]+dx/d*amount,p.pos[1]+dz/d*amount];
  if(!line(p.pos,next,actors,p)){release();return false}p.yaw=Math.atan2(dx,dz);p.pos=next;p.phase+=amount*4.4;if(d<=amount+.0001)p.trafficPath.shift();
  if(!p.trafficPath.length){if(!parking)p.route=[];release()}return true;
 }
 return{request,step,plan,free,recover,minimumDistance,getOwner:()=>owner?.i??null};
};
