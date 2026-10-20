import {client} from './connection.js?v=shared-groups-1';
import {esc} from './data.js?v=workspace-2';
import {pragueToday} from './arrival-order.js?v=office-workflow-1';
export function installPrivateTrips(ctx){
 let dialog=null,busy=false;
 async function open(){
  if(dialog?.open)return;
  const company=ctx.company(),s=ctx.state(),manager=ctx.manager(),worker=ctx.worker();
  const d=document.createElement('dialog');dialog=d;const id=crypto.randomUUID();
  const options=(rows,selected)=>rows.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.name+(x.plate?' · '+x.plate:''))}</option>`).join('');
  d.innerHTML=`<div class="dialog-heading"><h2>Soukromá jízda</h2><button type="button" data-trip-close aria-label="Zavřít">×</button></div><p>Záznam soukromých kilometrů firemního auta. Nemění docházku ani náklady zakázky.</p><form><div class="form-grid"><label>Vozidlo<select name="vehicle" required><option value="">Vyberte auto</option>${options(s.vehicles)}</select></label>${manager?`<label>Pracovník<select name="worker" required><option value="">Vyberte pracovníka</option>${options(s.workers,worker)}</select></label>`:''}<label>Datum<input name="date" type="date" value="${pragueToday()}" required></label><label>Soukromé kilometry<input name="kilometres" type="number" min="0.01" max="100000" step="0.01" required></label><label class="full">Poznámka<textarea name="note" maxlength="1000"></textarea></label></div><p role="alert"></p><button class="primary">Uložit jízdu</button></form><details style="margin-top:20px"><summary>Evidence soukromých jízd</summary><div data-trip-history>Načítám…</div></details>`;
  document.body.append(d);d.showModal();const f=d.querySelector('form'),baseline=new URLSearchParams(new FormData(f)).toString();
  const close=()=>{if(busy)return;if(new URLSearchParams(new FormData(f)).toString()!==baseline&&!confirm('Zahodit neuloženou soukromou jízdu?'))return;d.close()};
  d.querySelector('[data-trip-close]').onclick=close;d.oncancel=e=>{e.preventDefault();close()};d.onclose=()=>{d.remove();if(dialog===d)dialog=null};
  const rpc=async(action,p={})=>{const {data,error}=await client.rpc('saas_private_trips',{c:company,action,p});if(error)throw Error(error.message);return data};
  const history=data=>{d.querySelector('[data-trip-history]').innerHTML=data.trips.length?`<p>Celkem ${data.trips.reduce((sum,t)=>sum+Number(t.kilometres),0).toLocaleString('cs-CZ')} km</p><div style="overflow:auto"><table><thead><tr><th>Datum</th><th>Auto</th><th>Pracovník</th><th>Km</th><th>Poznámka</th></tr></thead><tbody>${data.trips.map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(s.vehicles.find(v=>v.id===t.vehicle_id)?.name||'Vozidlo')}</td><td>${esc(s.workers.find(w=>w.id===t.worker_id)?.name||'Pracovník')}</td><td>${esc(t.kilometres)}</td><td>${esc(t.note)}</td></tr>`).join('')}</tbody></table></div>`:'Zatím bez soukromých jízd.'};
  rpc('read').then(history).catch(e=>d.querySelector('[data-trip-history]').textContent=e.message);
  f.onsubmit=async e=>{e.preventDefault();if(busy)return;if(company!==ctx.company()){f.querySelector('[role=alert]').textContent='Přihlášení se změnilo. Otevřete formulář znovu.';return}busy=true;const button=f.querySelector('button');button.disabled=true;try{await rpc('save',{...Object.fromEntries(new FormData(f)),id});d.close();ctx.message('Soukromá jízda byla uložena.');}catch(error){f.querySelector('[role=alert]').textContent=error.message}finally{busy=false;button.disabled=false}};
 }
 return {open};
}
