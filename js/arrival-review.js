import {esc,localDate,mismatch,time,fmtHours,hours} from './data.js?v=jobs-read-1';
const rowsFor=(s,job,date)=>s.attendance.filter(t=>t.job===job&&localDate(t.start)===date);
export function arrivalReviewMarkup(s,job,date,manager){
 if(!manager||!mismatch(s,job,date))return '';
 const reviewed=new Set(s.extras?.arrivalReviews||[]),done=rowsFor(s,job,date).every(t=>reviewed.has(t.id));
 return `<div class="${done?'subtle':'warning'}">${done?'Příchody zkontrolovány':'Rozdílné hodiny pracovníků'}<br><button type="button" class="link-button" data-action="review" data-id="${esc(job+'|'+date)}">${done?'Zobrazit kontrolu':'Zkontrolovat'}</button></div>`;
}
export function installArrivalReview(ctx){
 const dialog=document.body.appendChild(document.createElement('dialog'));dialog.className='operations-dialog arrival-review-dialog';
 let focus;
 dialog.addEventListener('close',()=>focus?.focus());
 function open(job,date){
  if(!ctx.manager())return;
  focus=document.activeElement;const expectedVersion=ctx.version?.();
  const s=ctx.state(),rows=rowsFor(s,job,date).sort((a,b)=>(s.workers.find(w=>w.id===a.worker)?.name||'').localeCompare(s.workers.find(w=>w.id===b.worker)?.name||'','cs')||a.start.localeCompare(b.start));
  const name=t=>s.workers.find(w=>w.id===t.worker)?.name||'Pracovník';
  let mode='confirm';
  dialog.innerHTML=`<form><div class="panel-heading"><h2>Kontrola příchodů</h2><button type="button" data-close aria-label="Zavřít">×</button></div><p>${esc(s.jobs.find(j=>j.id===job)?.name||'Zakázka')} · ${esc(new Date(date+'T12:00:00').toLocaleDateString('cs-CZ'))}</p><div class="toolbar"><button type="button" data-mode="confirm">Potvrdit příchody</button><button type="button" data-mode="edit">Upravit</button><button type="button" data-mode="unify">Sjednotit podle…</button></div><div class="review-fields"></div><p role="alert" class="op-error"></p><div class="toolbar"><button type="button" data-close>Zavřít</button><button class="primary review-save">Potvrdit příchody</button></div></form>`;
  const fields=dialog.querySelector('.review-fields'),save=dialog.querySelector('.review-save'),error=dialog.querySelector('.op-error');
  function draw(){
   error.textContent='';dialog.querySelectorAll('[data-mode]').forEach(b=>b.className=b.dataset.mode===mode?'primary':'secondary');
   fields.innerHTML=`<p>${mode==='confirm'?'Potvrzením ponecháte původní časy.':mode==='edit'?'Označte záznamy a upravte jejich příchod. Odchody a přestávky zůstanou zachované.':'Vyberte vzorový příchod a označte záznamy, které mají převzít stejný čas. Odchody a přestávky zůstanou zachované.'}</p>${mode==='unify'?`<label>Sjednotit podle<select name="source">${rows.map(t=>`<option value="${esc(t.id)}">${esc(name(t))} · ${esc(time(t.start))}</option>`).join('')}</select></label>`:''}${rows.map(t=>`<section class="op-item" data-record="${esc(t.id)}"><label class="op-check"><input type="checkbox" name="records" value="${esc(t.id)}" ${mode==='confirm'?'checked':''}>${esc(name(t))}</label><p>Příchod ${esc(time(t.start))} · odchod ${t.end?esc(time(t.end)):'dosud nezapsán'} · přestávka ${Number(t.breakMinutes)||0} min${t.end?' · '+fmtHours(hours(t))+' h':''}</p>${mode==='edit'?`<label>Nový příchod<input type="time" name="start-${esc(t.id)}" value="${esc(time(t.start))}" required></label>`:''}<p class="review-preview subtle"></p></section>`).join('')}${mode!=='confirm'?'<label>Důvod úpravy<input name="reason" required maxlength="1000"></label>':''}`;
   save.textContent=mode==='confirm'?'Potvrdit příchody':'Uložit vybrané příchody';save.disabled=!rows.length;
   preview();
  }
  function preview(){
   const source=rows.find(t=>t.id===fields.querySelector('[name=source]')?.value);
   for(const section of fields.querySelectorAll('[data-record]')){
    const t=rows.find(t=>t.id===section.dataset.record),box=section.querySelector('[name=records]');
    box.disabled=mode==='unify'&&t.id===source?.id;if(box.disabled)box.checked=false;
    const next=mode==='unify'?time(source?.start):section.querySelector('input[type=time]')?.value;
    section.querySelector('.review-preview').textContent=mode!=='confirm'&&box.checked?`${time(t.start)} → ${next}`:'';
   }
  }
  dialog.onclick=e=>{const b=e.target.closest('button');if(b?.hasAttribute('data-close'))dialog.close();if(b?.dataset.mode){mode=b.dataset.mode;draw()}};
  fields.oninput=preview;fields.onchange=preview;
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();error.textContent='';const f=new FormData(e.currentTarget),ids=f.getAll('records');
   if(!ids.length){error.textContent='Vyberte alespoň jeden příchod.';return}
   // Resolve times in the same local day as the displayed attendance record.
   const items=ids.map(id=>{const t=rows.find(t=>t.id===id);const start=new Date(t.start);if(mode==='edit'){const [h,m]=String(f.get('start-'+id)).split(':').map(Number);start.setHours(h,m,0,0)}return {id,start:start.toISOString()}});
   dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{await ctx.run('review_arrivals',{mode,job,date,expectedVersion,source:f.get('source'),reason:f.get('reason'),items});dialog.close()}
   catch(e){error.textContent=e.message}
   finally{dialog.querySelectorAll('button').forEach(b=>b.disabled=false)}
  };
  draw();if(!dialog.open)dialog.showModal();
 }
 return {open};
}
