function nextId(c){return c.reduce((m,i)=>Math.max(m,Number(i.id)||0),0)+1}
function setStatus(t){document.getElementById("status").textContent=t}
function esc(v){return String(v??"").replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
function monday(d){const x=new Date(d),day=x.getDay()||7;x.setDate(x.getDate()-day+1);x.setHours(0,0,0,0);return x}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function iso(d){const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`}
function czDate(d){return d.toLocaleDateString("cs-CZ",{weekday:"short",day:"numeric",month:"numeric"})}
function priorityClass(p){p=String(p||"").toLowerCase();if(p.includes("vys"))return"high";if(p.includes("níz")||p.includes("niz"))return"low";return"medium"}
function jobVisualState(j){if(j.state==="Vyfakturováno")return"invoiced";if(j.state==="Dokončeno")return"done";return""}
function openModal(id){document.getElementById(id).classList.add("open")}
function closeModal(id){document.getElementById(id).classList.remove("open")}
