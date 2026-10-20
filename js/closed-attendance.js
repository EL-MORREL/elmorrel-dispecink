import {esc,localDate} from './data.js?v=workspace-2';
import {jobLabel} from './job-customer.js?v=office-workflow-1';
export function affectedClosedDays(s,action,p){
 if(action!=='direct_time'&&!(action==='admin_record'&&p.action==='attendance_update'))return [];
 const old=s.attendance.find(x=>x.id===(p.attendance||p.id));
 const pairs=[{job:p.job,date:p.start?localDate(p.start):''},...(old?[{job:old.job,date:localDate(old.start)}]:[])];
 return pairs.filter((x,i)=>x.job&&x.date&&pairs.findIndex(y=>y.job===x.job&&y.date===x.date)===i).filter(x=>['completed','invoiced'].includes(s.jobs.find(j=>j.id===x.job)?.status)||(s.extras?.billing||[]).some(b=>b.job_id===x.job&&b.date===x.date&&b.locked));
}
export function confirmClosedAttendance(s,rows,reason=''){
 return new Promise(resolve=>{
  const d=document.body.appendChild(document.createElement('dialog'));d.className='operations-dialog';
  d.innerHTML='<form><h2>Odemknout a uložit docházku</h2><p>Zápis zasahuje do uzavřené zakázky nebo vyfakturovaného dne:</p><ul>'+rows.map(x=>'<li>'+esc(jobLabel(s,x.job))+' · '+esc(x.date)+'</li>').join('')+'</ul><p>Odemknou se pouze dotčené dny. Archivní zakázka se stane aktivní. Změna se uloží do upozornění kanceláře s původními a novými údaji. Částka vystavené faktury se automaticky nemění.</p><label>Důvod změny<textarea name="reason" required maxlength="1000">'+esc(reason)+'</textarea></label><button class="primary" type="submit">Odemknout a uložit</button><button type="button" data-cancel>Zpět k zápisu</button></form>';
  const done=value=>{d.close();d.remove();resolve(value)};
  d.querySelector('[data-cancel]').onclick=()=>done(null);d.oncancel=e=>{e.preventDefault();done(null)};
  d.querySelector('form').onsubmit=e=>{e.preventDefault();const value=e.target.elements.reason.value.trim();if(value)done(value)};d.showModal();
 });
}
