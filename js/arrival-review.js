import {esc,localDate,mismatch,time,fmtHours,hours} from './data.js?v=jobs-read-1';
const rowsFor=(s,job,date)=>s.attendance.filter(t=>t.job===job&&localDate(t.start)===date);
export function arrivalReviewMarkup(s,job,date,manager){
 if(!manager||!mismatch(s,job,date))return '';
 const reviewed=new Set(s.extras?.arrivalReviews||[]),done=rowsFor(s,job,date).every(t=>reviewed.has(t.id));
 return `<div class="${done?'subtle':'warning'}">${done?'Docházka zkontrolována':'Rozdílné hodiny pracovníků'}<br><button type="button" class="link-button" data-action="review" data-id="${esc(job+'|'+date)}">${done?'Zobrazit kontrolu':'Zkontrolovat'}</button></div>`;
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
  dialog.innerHTML=`<form><div class="panel-heading"><h2>Kontrola docházky</h2><button type="button" data-close aria-label="Zavřít">×</button></div><p>${esc(s.jobs.find(j=>j.id===job)?.name||'Zakázka')} · ${esc(new Date(date+'T12:00:00').toLocaleDateString('cs-CZ'))}</p><div class="toolbar"><button type="button" data-mode="confirm">Potvrdit docházku</button><button type="button" data-mode="edit">Upravit</button><button type="button" data-mode="unify">Sjednotit podle…</button></div><div class="review-fields"></div><p role="alert" class="op-error"></p><div class="toolbar"><button type="button" data-close>Zavřít</button><button class="primary review-save">Potvrdit docházku</button></div></form>`;
  const fields=dialog.querySelector('.review-fields'),save=dialog.querySelector('.review-save'),error=dialog.querySelector('.op-error');
  function draw(){
   error.textContent='';dialog.querySelectorAll('[data-mode]').forEach(b=>b.className=b.dataset.mode===mode?'primary':'secondary');
   fields.innerHTML=`<p>${mode==='confirm'?'Potvrzením ponecháte původní časy.':mode==='edit'?'Označte záznamy a upravte příchod nebo odchod. Prázdný odchod znamená neukončenou docházku. Přestávky zůstanou zachované.':'Vyberte vzorový záznam, které časy převzít, a označte pracovníky. Přestávky zůstanou zachované.'}</p>${mode==='unify'?`<label>Převzít<select name="scope"><option value="start">Příchod</option><option value="end">Odchod</option><option value="both">Příchod i odchod</option></select></label><label>Sjednotit podle<select name="source">${rows.map(t=>`<option value="${esc(t.id)}">${esc(name(t))} · ${esc(time(t.start))} – ${t.end?esc(time(t.end)):"bez odchodu"}</option>`).join('')}</select></label>`:''}${rows.map(t=>`<section class="op-item" data-record="${esc(t.id)}"><label class="op-check"><input type="checkbox" name="records" value="${esc(t.id)}" ${mode==='confirm'?'checked':''}>${esc(name(t))}</label><p>Příchod ${esc(time(t.start))} · odchod ${t.end?esc(time(t.end)):'dosud nezapsán'} · přestávka ${Number(t.breakMinutes)||0} min${t.end?' · '+fmtHours(hours(t))+' h':''}</p>${mode==='edit'?`<label>Nový příchod<input type="time" name="start-${esc(t.id)}" value="${esc(time(t.start))}" required></label><label>Nový odchod (datum a čas)<input type="datetime-local" name="end-${esc(t.id)}" value="${t.end?esc(localDate(t.end)+'T'+time(t.end)):''}"></label>`:''}<p class="review-preview subtle"></p></section>`).join('')}${mode!=='confirm'?'<label>Důvod úpravy<input name="reason" required maxlength="1000"></label>':''}`;
   save.textContent=mode==='confirm'?'Potvrdit docházku':'Uložit vybranou docházku';save.disabled=!rows.length;
   preview();
  }
  function preview(){
   const source=rows.find(t=>t.id===fields.querySelector('[name=source]')?.value);
   for(const section of fields.querySelectorAll('[data-record]')){
    const t=rows.find(t=>t.id===section.dataset.record),box=section.querySelector('[name=records]');
    box.disabled=mode==='unify'&&t.id===source?.id;if(box.disabled)box.checked=false;
    const scope=fields.querySelector('[name=scope]')?.value||'start';
    const next=mode==='unify'?(scope==='end'?(source?.end?time(source.end):'bez odchodu'):time(source?.start)):section.querySelector('input[type=time]')?.value;
    section.querySelector('.review-preview').textContent=mode!=='confirm'&&box.checked?`Příchod ${time(t.start)} → ${mode==='unify'&&scope==='end'?time(t.start):next}${mode==='edit'?' · odchod '+(section.querySelector('input[type=datetime-local]')?.value||'nezapsán'):scope!=='start'?' · odchod '+(t.end?time(t.end):'nezapsán')+' → '+(source?.end?time(source.end):'nezapsán'):''}`:'';
   }
  }
  dialog.onclick=e=>{const b=e.target.closest('button');if(b?.hasAttribute('data-close'))dialog.close();if(b?.dataset.mode){mode=b.dataset.mode;draw()}};
  fields.oninput=preview;fields.onchange=preview;
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();error.textContent='';const f=new FormData(e.currentTarget),ids=f.getAll('records');
   if(!ids.length){error.textContent='Vyberte alespoň jeden záznam.';return}
   // Resolve times in the same local day as the displayed attendance record.
   const items=ids.map(id=>{const t=rows.find(t=>t.id===id);const start=new Date(t.start);if(mode==='edit'&&f.get('start-'+id)!==time(t.start)){const [h,m]=String(f.get('start-'+id)).split(':').map(Number);start.setHours(h,m,0,0)}return {id,start:start.toISOString(),...(mode==='edit'?{end:f.get('end-'+id)===(t.end?localDate(t.end)+'T'+time(t.end):'')?t.end||null:f.get('end-'+id)?new Date(String(f.get('end-'+id))).toISOString():null}:{})}});
   dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{await ctx.run('review_arrivals',{mode,fields:f.get('scope')||'start',job,date,expectedVersion,source:f.get('source'),reason:f.get('reason'),items});dialog.close()}
   catch(e){error.textContent=e.message}
   finally{dialog.querySelectorAll('button').forEach(b=>b.disabled=false)}
  };
  draw();if(!dialog.open)dialog.showModal();
 }
 return {open};
}
