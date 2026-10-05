import {driverMarkup} from './driver-labels.js?v=visible-drivers-1';
import {fuelDate} from './fuel-filters.js?v=fuel-filters-1';
import {allocationsOf} from './purchase-shares.js?v=purchase-allocations-1';
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
function compactOverviewLists(){
 for(const el of document.querySelectorAll('.overview-records,.overview .daily-team')){
  if(el.querySelector(':scope > details'))continue;
  const rows=[...el.children].filter(n=>n.tagName==='ARTICLE'||n.tagName==='DIV'),limit=el.classList.contains('daily-team')?3:5;
  if(rows.length<=limit)continue;
  const more=document.createElement('details'),summary=document.createElement('summary');more.className='overview-team-more';summary.textContent='Zobrazit další ('+(rows.length-limit)+')';more.append(summary);rows[limit].before(more);rows.slice(limit).forEach(row=>more.append(row));
 }
}
export function installOverview(ctx){
 let cache=null,pending=null,epoch=0,selected=pragueToday(),purchaseCache=null,purchasePending=null;
 document.addEventListener('change',e=>{if(e.target.id==='overview-day'&&/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){selected=e.target.value;mount()}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-overview-day]');if(!b)return;if(b.dataset.overviewDay==='today')selected=pragueToday();else{const d=new Date(selected+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+Number(b.dataset.overviewDay));selected=d.toISOString().slice(0,10)}mount()});
 function reset(){epoch++;cache=null;pending=null;purchaseCache=null;purchasePending=null;selected=pragueToday()}
 function mount(){
  const s=ctx.state(),me=ctx.me(),manager=ctx.manager(),admin=ctx.admin(),today=selected,month=today.slice(0,7),worker=s.workers.find(w=>w.id===me);
  const own=byStart(s.assignments.filter(a=>a.date===today&&a.worker===me)),all=s.assignments.filter(a=>a.date===today),jobs=[...new Set(all.map(a=>a.job))];
  const requests=[...(s.extras?.requests||[]),...(s.extras?.absences||[])].filter(r=>r.status==='pending'&&(manager||r.worker_id===me)&&(r.date===today||fuelDate(r.proposed_start||r.start||r.created_at)===today));
  const monthHours=s.attendance.filter(a=>a.worker===me&&a.end&&fuelDate(a.start)===today).reduce((n,a)=>n+hours(a),0)+(s.extras?.historicalHours||[]).filter(a=>a.worker_id===me&&a.date.slice(0,7)===month).reduce((n,a)=>n+Number(a.hours),0);
  const name=id=>s.workers.find(w=>w.id===id)?.name||'Pracovník';
  const card=a=>{const j=s.jobs.find(j=>j.id===a.job);if(!j)return '';return `<article class="overview-job" style="border-left-color:${safeColor(j.color)}"><small>${esc(plannedTime(a))} · ${fmtHours(a.planned)} h</small><h3>${esc(j.name)}</h3>${teamMarkup(s,a,true)}<p>${(a.vehicles||[]).map(id=>esc(s.vehicles.find(v=>v.id===id)?.name||'Vozidlo')).join(' · ')}</p>${jobNotes(s,j.id,today,a.worker,manager)}${contactMarkup(j)}${ctx.documents(j)}</article>`};
  document.getElementById('content').innerHTML=`<div class="overview"><header class="page-heading"><div><h1>${esc(greeting(worker?.name))}</h1><p>${new Date(today+'T12:00:00').toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · ${admin?'Administrátor':manager?'Dispečer':ctx.foreman()?'Vedoucí realizace':'Realizace'}</p></div><div class="overview-date"><button type="button" data-overview-day="-1" aria-label="Předchozí den">‹</button><label>Den přehledu<input type="date" id="overview-day" value="${today}"></label><button type="button" data-overview-day="1" aria-label="Následující den">›</button><button type="button" data-overview-day="today">Dnes</button></div></header><div class="overview-stats">${manager?stat('Naplánovaní pracovníci',new Set(all.map(a=>a.worker)).size)+stat('Zakázky v plánu',jobs.length)+stat('Zaznamenané příchody',new Set(s.attendance.filter(a=>fuelDate(a.start)===today).map(a=>a.worker)).size):stat('Můj plán',fmtHours(own.reduce((n,a)=>n+Number(a.planned),0))+' h')+stat('Dokončené hodiny za den',fmtHours(monthHours)+' h')}${stat(manager?'Žádosti k vyřízení':'Moje čekající žádosti',requests.length)}</div><div class="overview-columns"><section class="overview-panel"><h2>Můj plán na vybraný den</h2>${own.map(card).join('')||'<p>V tento den nemáte naplánovanou zakázku.</p>'}${(s.extras?.absences||[]).filter(a=>a.worker_id===me&&a.date===today&&a.status==='approved').map(a=>`<p class="notice">${esc(s.extras.absenceTypes?.find(t=>t.id===a.type_id)?.name||'Volno')} · ${esc(a.hours||'')} h</p>`).join('')}</section>${manager?`<section class="overview-panel"><h2>K vyřízení</h2><p>Čekající žádosti: <strong>${requests.length}</strong></p><button type="button" data-action="notifications">Otevřít upozornění</button><p>Naplánované zakázky z realizace ke kontrole: <strong>${s.jobs.filter(j=>j.fieldCreated&&jobs.includes(j.id)).length}</strong></p>${nav('jobs','Otevřít zakázky')}${jobs.map(j=>arrivalReviewMarkup(s,j,today,true)).filter(Boolean).join('')}</section><section class="overview-panel"><h2>Tým na vybraný den</h2>${[...new Set(all.map(a=>a.worker))].sort((a,b)=>name(a).localeCompare(name(b),'cs')).map(id=>`<div class="overview-person">${avatar(name(id))}<div><strong>${esc(name(id))}</strong><p>${byStart(all.filter(a=>a.worker===id)).map(a=>esc(a.start||'')+' · '+esc(s.jobs.find(j=>j.id===a.job)?.name||'Zakázka')).join('<br>')}</p></div></div>`).join('')||'<p>Zatím bez plánu.</p>'}${nav('plan','Upravit plán')}${nav('attendance','Upravit docházku')}${nav('purchases','Nákupy a dodavatelé')}</section>`:`<section class="overview-panel"><h2>Moje záznamy</h2>${nav('attendance','Moje docházka')}${nav('fuel','Moje tankování')}<button type="button" data-action="notifications">Žádosti a upozornění</button></section>`}${admin?'<section class="overview-panel" id="overview-finance" aria-live="polite"><h2>Finance zakázek</h2><p>Načítám finanční přehled…</p></section>':''}</div></div>`;
  const grid=document.querySelector('.overview-columns');
  const teamRows=[...grid.querySelectorAll('.overview-person')];
  if(teamRows.length>5){const more=document.createElement('details');more.className='overview-team-more';const summary=document.createElement('summary');summary.textContent='Další pracovníci ('+(teamRows.length-5)+')';more.append(summary);teamRows[5].before(more);teamRows.slice(5).forEach(row=>more.append(row));}
  const dayAttendance=s.attendance.filter(a=>fuelDate(a.start)===today&&(manager||a.worker===me));
  const dayFuel=s.fuel.filter(a=>fuelDate(a.at)===today&&(manager||a.worker===me));
  const absences=(s.extras?.absences||[]).filter(a=>a.date===today&&a.status!=='rejected'&&(manager||a.worker_id===me));
  const clock=value=>new Date(value).toLocaleTimeString('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'});
  const list=(rows,draw)=>rows.length?'<div class="overview-records">'+rows.map(draw).join('')+'</div>':'<p class="subtle">Pro tento den nejsou záznamy.</p>';
  grid.insertAdjacentHTML('beforeend','<section class="overview-panel"><h2>Docházka za den</h2>'+list(dayAttendance,a=>'<article><strong>'+esc(name(a.worker))+'</strong><p>'+esc(s.jobs.find(j=>j.id===a.job)?.name||'Bez zakázky')+'</p><p>'+clock(a.start)+' – '+(a.end?clock(a.end):'Odchod nezapsán')+(a.end?' · '+fmtHours(hours(a))+' h':'')+'</p></article>')+nav('attendance','Otevřít docházku')+'</section><section class="overview-panel"><h2>Tankování vozidel</h2>'+list(dayFuel,f=>'<article><strong>'+esc(f.vehicle?s.vehicles.find(v=>v.id===f.vehicle)?.name||'Vozidlo':'Soukromé vozidlo')+'</strong><p>'+esc(name(f.worker))+' · '+clock(f.at)+'</p><p>'+esc(f.note||'')+'</p></article>')+nav('fuel','Otevřít tankování')+'</section><section class="overview-panel"><h2>Volno a dovolené</h2>'+list(absences,a=>'<article><strong>'+esc(name(a.worker_id))+'</strong><p>'+esc(s.extras.absenceTypes?.find(t=>t.id===a.type_id)?.name||'Volno')+' · '+fmtHours(Number(a.hours)||0)+' h · '+(a.status==='approved'?'Schváleno':'Čeká na schválení')+'</p></article>')+'<button type="button" data-action="notifications">Žádosti a upozornění</button></section>');
  const vehicleRows=s.vehicleBookings.filter(b=>b.date===today&&(manager||own.some(a=>a.job===b.job)));
  grid.insertAdjacentHTML('beforeend','<section class="overview-panel"><h2>Vozidla v plánu</h2>'+list(vehicleRows,b=>'<article><strong>'+esc(s.vehicles.find(v=>v.id===b.vehicle)?.name||'Vozidlo')+'</strong><p>'+esc(s.jobs.find(j=>j.id===b.job)?.name||'Zakázka')+' · '+fmtHours(Number(b.hours)||0)+' h</p>'+driverMarkup(b)+'</article>')+nav('plan','Otevřít plánovač')+'</section>');
  if(manager){
   grid.insertAdjacentHTML('beforeend','<section class="overview-panel" id="overview-purchases" aria-live="polite"><h2>Objednávky za den</h2><p>Načítám objednávky…</p></section>');
   const key=ctx.identity(),token=epoch;
   if(purchaseCache?.key===key)drawPurchases(purchaseCache.data);
   else if(purchasePending!==key){purchasePending=key;ctx.purchases().then(data=>{if(token!==epoch||!ctx.manager()||ctx.identity()!==key)return;purchaseCache={key,data};if(ctx.active())drawPurchases(data)}).catch(()=>{if(token===epoch&&ctx.active()){const el=document.getElementById('overview-purchases');if(el)el.innerHTML='<h2>Objednávky za den</h2><p>Objednávky se nepodařilo načíst.</p><button type="button" data-action="purchases">Otevřít nákupy</button>'}}).finally(()=>{if(token===epoch&&purchasePending===key)purchasePending=null})}
  }
  compactOverviewLists();if(!admin)return;

  const key=ctx.identity();
  if(cache?.key===key){drawFinance(cache.data);return}
  if(pending?.key===key)return;
  const token=epoch;pending={key};
  ctx.finance().then(data=>{if(token!==epoch||!ctx.admin()||ctx.identity()!==key)return;cache={key,data};if(ctx.active())drawFinance(data)}).catch(()=>{if(token===epoch&&ctx.active()&&ctx.admin()){const el=document.getElementById('overview-finance');if(el)el.innerHTML='<h2>Finance zakázek</h2><p>Finance se nepodařilo načíst. Otevřete je pro nové načtení.</p><button type="button" data-action="finance">Otevřít finance</button>'}}).finally(()=>{if(token===epoch&&pending?.key===key)pending=null});
 }
 function drawPurchases(data){const el=document.getElementById('overview-purchases');if(!el||!ctx.manager())return;const rows=(data.purchases||[]).filter(p=>p.order_date===selected),s=ctx.state();el.innerHTML='<h2>Objednávky za den</h2><p>'+rows.length+' objednávek'+(ctx.admin()?' · '+money(rows.reduce((n,p)=>n+Number(p.amount),0))+' bez DPH':'')+'</p><div class="overview-records">'+rows.map(p=>'<article><strong>'+esc(p.description)+'</strong><p>'+esc(data.suppliers?.find(s=>s.id===p.supplier_id)?.name||'Bez dodavatele')+' · '+esc(p.order_number||'Bez čísla objednávky')+'</p><p>'+allocationsOf(p).map(a=>esc(s.jobs.find(j=>j.id===a.job_id)?.name||'Zakázka')).join(' · ')+'</p>'+(allocationsOf(p).length?'':'<p>Volná objednávka</p>')+(allocationsOf(p).length>1?'<p>Rozděleno mezi více zakázek</p>':'')+'</article>').join('')+'</div><button type="button" data-action="purchases">Otevřít nákupy a objednávky</button>';compactOverviewLists()}
 function drawFinance(data){const el=document.getElementById('overview-finance');if(!el||!ctx.admin())return;
  const invoices=data.entries.filter(e=>e.kind==='invoice'&&e.valid_from===selected),daily={...data,entries:data.entries.filter(e=>e.kind!=='invoice'||e.valid_from===selected)};
  const jobs=financeMetrics(ctx.state(),daily).filter(j=>!j.overhead),invoiced=invoices.reduce((n,e)=>n+Number(e.amount),0),billed=jobs.filter(j=>invoices.some(e=>e.job_id===j.id)),profit=billed.length&&billed.every(j=>j.billedProfit!==null)?billed.reduce((n,j)=>n+j.billedProfit,0):null;
  el.innerHTML='<h2>Fakturace za den</h2><p>Podle data fakturace, nikoliv data provedení práce.</p><div class="overview-stats">'+stat('Vyfakturováno bez DPH',money(invoiced))+stat('Zisk fakturované části',money(profit))+stat('Marže fakturované části',profit!==null&&invoiced>0?(100*profit/invoiced).toLocaleString('cs-CZ',{maximumFractionDigits:1})+' %':'—')+'</div><div class="overview-records">'+invoices.map(e=>'<article><strong>'+esc(ctx.state().jobs.find(j=>j.id===e.job_id)?.name||'Zakázka')+'</strong><p>'+esc(e.name||'Fakturace')+' · '+money(Number(e.amount))+'</p></article>').join('')+'</div><p class="subtle">Předběžná marže zahrnuje evidované náklady fakturovaných dnů a přiřazených nákupů včetně režie. Při chybějících podkladech ji neuvádíme.</p><button type="button" data-action="finance">Otevřít finance zakázek</button><button type="button" data-action="overheads">Režijní náklady</button>';compactOverviewLists();
 }
 return {mount,reset};
}
