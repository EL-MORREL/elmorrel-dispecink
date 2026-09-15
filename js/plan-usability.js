import {glyph} from './daily-details.js?v=followups-1';
import {esc} from './data.js?v=followups-1';
export function contactMarkup(job){
 if(!job)return '';
 const phone=String(job.phone||'').replace(/[^+\d]/g,'');
 return `<section class="plan-contact"><strong>${esc(job.name)}</strong>${job.contact?`<div>${esc(job.contact)}</div>`:''}${job.phone?`<div>${esc(job.phone)}</div>`:''}<div class="plan-links">${phone?`<a class="secondary" href="tel:${phone}">${glyph('phone')} Zavolat</a>`:''}${job.address?`<a class="secondary" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}" target="_blank" rel="noopener noreferrer">${glyph('pin')}${esc(job.address)} ↗</a>`:''}</div>${!phone&&!job.address?'<small>Kontakt ani adresa nejsou vyplněné.</small>':''}</section>`;
}
export function decoratePlanActions(state){
 const board=document.querySelector('.board-wrap');if(!board)return;
 board.tabIndex=0;board.setAttribute('aria-label','Plán: posouvání po dnech a pracovnících nebo vozidlech');
 const table=board.querySelector('table');
 table.querySelectorAll('thead th:not(:first-child)').forEach(cell=>{const label=document.createElement('span');label.className='plan-column-label';label.append(...cell.childNodes);cell.append(label)});
 table.style.minWidth=(table.rows[0].cells.length===2?'100%':(140+(table.rows[0].cells.length-1)*240)+'px');
 table.querySelectorAll('tbody .person-cell').forEach(cell=>{const wrap=document.createElement('div');wrap.className='resource-label';wrap.append(...cell.childNodes);cell.append(wrap)});
 board.querySelectorAll('.job-card').forEach(card=>{
  const job=state.jobs.find(j=>j.id===card.dataset.job);if(!job)return;
  const info=document.createElement('details');info.className='plan-contact-toggle';info.innerHTML='<summary>Kontakt a adresa</summary>'+contactMarkup(job);card.after(info);
 });
 board.querySelectorAll('.card-tools').forEach(tools=>{
  const actions=[...tools.children].filter(el=>el.matches('button'));
  if(!actions.length)return;
  const more=document.createElement('details');more.className='plan-more';more.innerHTML='<summary>Více …</summary><div class="plan-more-actions"></div>';
  actions.forEach(el=>more.lastElementChild.append(el));tools.append(more);
 });
}
