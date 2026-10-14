'use strict';
// La presentación usa únicamente el temporizador simulado y guardado de Nico.
function studioObjectivePages(text){
 const words=String(text||'').trim().split(/\s+/u),pages=[];let page='';
 for(const word of words){for(const part of word.match(/.{1,90}/gu)||['']){if(page&&page.length+part.length+1>90){pages.push(page);page=''}page+=(page?' ':'')+part}}
 if(page||!pages.length)pages.push(page);return pages;
}
function studioMeetingDuration(task){return Math.max(10,studioObjectivePages(task.text).length*4+task.steps.slice(task.cursor).length*3)}
function studioMeetingScreenState(task,nico,team){
 if(!task||!task.meetingStarted||nico.mode!=='briefing')return{active:false,key:'idle',title:'PAUL ENGINEERING STUDIO',objective:'Sala de reuniones · En espera',participants:[],assignments:[]};
 const pages=studioObjectivePages(task.text),steps=task.steps.slice(task.cursor),duration=task.briefingDuration||10;
 const slot=Math.min(pages.length+steps.length-1,Math.floor(Math.max(0,Math.min(1,1-nico.timer/duration))*(pages.length+steps.length)));
 const count=Math.max(0,slot-pages.length+1),assignments=steps.slice(0,count).map(s=>({agent:s.agent,name:team[s.agent].name,title:s.title}));
 return{active:true,key:task.id+':'+slot,title:task.title||'Misión · '+String(task.text).slice(0,65),objective:task.text,objectivePage:pages[Math.min(slot,pages.length-1)],page:Math.min(slot,pages.length-1)+1,pages:pages.length,participants:(task.meetingAgents||[]).map(i=>team[i].name),assignments,current:assignments.at(-1)||null,stage:count?'Encargo '+count+' de '+steps.length:'Objetivo de Paul · '+(slot+1)+' / '+pages.length};
}
