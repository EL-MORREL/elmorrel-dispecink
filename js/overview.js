import {esc,fmtHours,hours,localDate,safeColor} from './data.js?v=overhead-unbilled-1';
import {pragueToday} from './arrival-order.js?v=jobs-read-1';
import {byStart} from './plan-order.js?v=plan-order-1';
import {avatar,teamMarkup,plannedTime} from './daily-details.js?v=jobs-read-1';
import {contactMarkup} from './plan-usability.js?v=jobs-read-1';
import {jobNotes} from './job-tools.js?v=job-tasks-1';
import {arrivalReviewMarkup} from './arrival-review.js?v=arrival-review-1';
import {financeMetrics,money} from './finance-overview.js?v=finance-categories-1';
export function greeting(name=''){
 const first=name.trim().split(/\s+/)[0],names={Jakub:'Jakube',Radek:'Radku',Petr:'Petře',Jan:'Jane',Martin:'Martine',Jaroslav:'Jaroslave',Daniel:'Danieli',Jonáš:'Jonáši',Jiří:'Jiří',Tomáš:'Tomáši',Pavel:'Pavle',Josef:'Josefe',Lukáš:'Lukáši',Michal:'Michale',David:'Davide',Ondřej:'Ondřeji',Václav:'Václave',Anna:'Anno',Eva:'Evo',Jana:'Jano',Lucie:'Lucie'};
 return names[first]?'Dobrý den, '+names[first]:'Dobrý den';
}
const nav=(id,text)=>`<button type="button" data-action="nav" data-id="${id}">${text}</button>`;
const stat=(title,value)=>`<div class="overview-stat"><span>${title}</span><strong>${value}</strong></div>`;
export function installOverview(ctx){
 let cache=null,pending=null,epoch=0;
 function reset(){epoch++;cache=null;pending=null}
 function mount(){
  const s=ctx.state(),me=ctx.me(),manager=ctx.manager(),admin=ctx.admin(),today=pragueToday(),month=today.slice(0,7),worker=s.workers.find(w=>w.id===me);
  const own=byStart(s.assignments.filter(a=>a.date===today&&a.worker===me)),all=s.assignments.filter(a=>a.date===today),jobs=[...new Set(all.map(a=>a.job))];
  const requests=[...(s.extras?.requests||[]),...(s.extras?.absences||[])].filter(r=>r.status==='pending'&&(manager||r.worker_id===me));
  const monthHours=s.attendance.filter(a=>a.worker===me&&a.end&&localDate(a.start).slice(0,7)===month).reduce((n,a)=>n+hours(a),0)+(s.extras?.historicalHours||[]).filter(a=>a.worker_id===me&&a.date.slice(0,7)===month).reduce((n,a)=>n+Number(a.hours),0);
  const name=id=>s.workers.find(w=>w.id===id)?.name||'Pracovník';
  const card=a=>{const j=s.jobs.find(j=>j.id===a.job);if(!j)return '';return `<article class="overview-job" style="border-left-color:${safeColor(j.color)}"><small>${esc(plannedTime(a))} · ${fmtHours(a.planned)} h</small><h3>${esc(j.name)}</h3>${teamMarkup(s,a,true)}<p>${(a.vehicles||[]).map(id=>esc(s.vehicles.find(v=>v.id===id)?.name||'Vozidlo')).join(' · ')}</p>${jobNotes(s,j.id,today,a.worker,manager)}${contactMarkup(j)}${ctx.documents(j)}</article>`};
  document.getElementById('content').innerHTML=`<div class="overview"><header class="page-heading"><div><h1>${esc(greeting(worker?.name))}</h1><p>${new Date(today+'T12:00:00').toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · ${admin?'Administrátor':manager?'Dispečer':ctx.foreman()?'Vedoucí realizace':'Realizace'}</p></div>${nav('plan','Otevřít plánovač')}</header><div class="overview-stats">${manager?stat('Dnes naplánovaní pracovníci',new Set(all.map(a=>a.worker)).size)+stat('Dnešní zakázky',jobs.length)+stat('Právě v práci',new Set(s.attendance.filter(a=>!a.end).map(a=>a.worker)).size):stat('Dnes v mém plánu',fmtHours(own.reduce((n,a)=>n+Number(a.planned),0))+' h')+stat('Dokončené hodiny · tento měsíc',fmtHours(monthHours)+' h')}${stat(manager?'Žádosti k vyřízení':'Moje čekající žádosti',requests.length)}</div><div class="overview-columns"><section class="overview-panel"><h2>Můj dnešní plán</h2>${own.map(card).join('')||'<p>Dnes nemáte naplánovanou zakázku.</p>'}${(s.extras?.absences||[]).filter(a=>a.worker_id===me&&a.date===today&&a.status==='approved').map(a=>`<p class="notice">${esc(s.extras.absenceTypes?.find(t=>t.id===a.type_id)?.name||'Volno')} · ${esc(a.hours||'')} h</p>`).join('')}</section><div>${manager?`<section class="overview-panel"><h2>K vyřízení</h2><p>Čekající žádosti: <strong>${requests.length}</strong></p><button type="button" data-action="notifications">Otevřít upozornění</button><p>Zakázky z realizace ke kontrole: <strong>${s.jobs.filter(j=>j.fieldCreated).length}</strong></p>${nav('jobs','Otevřít zakázky')}${jobs.map(j=>arrivalReviewMarkup(s,j,today,true)).filter(Boolean).join('')}</section><section class="overview-panel"><h2>Dnešní tým</h2>${[...new Set(all.map(a=>a.worker))].sort((a,b)=>name(a).localeCompare(name(b),'cs')).map(id=>`<div class="overview-person">${avatar(name(id))}<div><strong>${esc(name(id))}</strong><p>${byStart(all.filter(a=>a.worker===id)).map(a=>esc(a.start||'')+' · '+esc(s.jobs.find(j=>j.id===a.job)?.name||'Zakázka')).join('<br>')}</p></div></div>`).join('')||'<p>Zatím bez plánu.</p>'}${nav('plan','Upravit plán')}${nav('attendance','Upravit docházku')}${nav('purchases','Nákupy a dodavatelé')}</section>`:`<section class="overview-panel"><h2>Moje záznamy</h2>${nav('attendance','Moje docházka')}${nav('fuel','Moje tankování')}<button type="button" data-action="notifications">Žádosti a upozornění</button></section>`}${admin?'<section class="overview-panel" id="overview-finance" aria-live="polite"><h2>Finance zakázek</h2><p>Načítám finanční přehled…</p></section>':''}</div></div></div>`;
  if(!admin){if(cache||pending)reset();return}
  const key=ctx.identity();
  if(cache?.key===key){drawFinance(cache.data);return}
  if(pending?.key===key)return;
  const token=++epoch;pending={key};
  ctx.finance().then(data=>{if(token!==epoch||!ctx.admin()||ctx.identity()!==key)return;cache={key,data};if(ctx.active())drawFinance(data)}).catch(()=>{if(token===epoch&&ctx.active()&&ctx.admin()){const el=document.getElementById('overview-finance');if(el)el.innerHTML='<h2>Finance zakázek</h2><p>Finance se nepodařilo načíst. Otevřete je pro nové načtení.</p><button type="button" data-action="finance">Otevřít finance</button>'}}).finally(()=>{if(token===epoch)pending=null});
 }
 function drawFinance(data){const el=document.getElementById('overview-finance');if(!el||!ctx.admin())return;const jobs=financeMetrics(ctx.state(),data).filter(j=>!j.overhead),invoiced=jobs.reduce((n,j)=>n+j.invoiced,0),billed=jobs.filter(j=>j.invoiced>0),profit=billed.length&&billed.every(j=>j.billedProfit!==null)?billed.reduce((n,j)=>n+j.billedProfit,0):null;el.innerHTML=`<h2>Finance · všechna období</h2><div class="overview-stats">${stat('Vyfakturováno bez DPH',money(invoiced))}${stat('Zisk fakturované části',money(profit))}${stat('Marže fakturované části',profit!==null&&invoiced>0?(100*profit/invoiced).toLocaleString('cs-CZ',{maximumFractionDigits:1})+' %':'—')}</div><p class="subtle">Předběžně podle evidovaných nákladů, včetně rozpočítané režie. Při chybějících podkladech marži neuvádíme.</p><button type="button" data-action="finance">Finance zakázek a dokončenost</button><button type="button" data-action="overheads">Režijní náklady</button>`}
 return {mount,reset};
}
