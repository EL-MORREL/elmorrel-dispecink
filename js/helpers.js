function jobById(id){return db.jobs.find(j=>Number(j.id)===Number(id))}
function workerById(id){return db.workers.find(w=>Number(w.id)===Number(id))}
function vehicleById(id){return db.vehicles.find(v=>Number(v.id)===Number(id))}
function assignmentById(id){return db.assignments.find(a=>Number(a.id)===Number(id))}
function getSelectedMulti(id){return Array.from(document.getElementById(id).selectedOptions).map(o=>o.value)}
function setSelectedMulti(id,values){const set=new Set(values||[]);Array.from(document.getElementById(id).options).forEach(o=>o.selected=set.has(o.value))}
function workerHasSkill(w,skill){if(!skill||skill==="Bez požadavku")return true;return Array.isArray(w?.skills)&&w.skills.includes(skill)}
function plannedUnits(jobId){
  return db.assignments
    .filter(a=>Number(a.jobId)===Number(jobId))
    .reduce((s,a)=>s+Number(a.load||0),0)
}
function jobProgress(j){const estimated=Math.max(Number(j.estimated||0),0),actual=plannedUnits(j.id),pct = estimated > 0
  ? Math.round((actual / estimated) * 100)
  : 0;let color="#16a34a";if(pct>100)color="#dc2626";else if(pct>=85)color="#d97706";return{estimated,actual,pct,color,over:estimated>0&&actual>estimated}}
function isArchiveState(j){return["Dokončeno","Vyfakturováno","Storno"].includes(j.state)}
function matchesSearch(j){const q=document.getElementById("search").value.trim().toLowerCase();if(!q)return true;return[j.title,j.address,j.contact,j.phone,j.note,j.state,j.skill].join(" ").toLowerCase().includes(q)}
function matchesFilter(j){const f=document.getElementById("jobFilter").value,p=jobProgress(j);if(f==="active")return!isArchiveState(j);if(f==="archive")return isArchiveState(j);if(f==="to_invoice")return j.state==="Dokončeno";if(f==="overrun")return p.over;return true}
