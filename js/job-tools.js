import {esc} from './data.js?v=jobs-read-1';
import {readJobPreferences} from './job-preferences.js?v=job-tools-1';
const cache=new Map();
export function setupJobFields(root,state,user,id){
 const prefs=readJobPreferences(state,user),label=document.createElement('label');
 label.innerHTML=`Moje skupina<input name="personalGroup" maxlength="60" list="job-group-list" value="${esc(prefs.groups[id]||'')}" placeholder="Vyberte nebo napište novou skupinu"><datalist id="job-group-list">${[...new Set(Object.values(prefs.groups).filter(Boolean))].sort().map(g=>`<option value="${esc(g)}"></option>`).join('')}</datalist>`;
 root.querySelector('.form-grid').prepend(label);
 const address=root.querySelector('[name=address]'),box=document.createElement('div');box.className='full';
 box.innerHTML='<button type="button" class="secondary">Vyhledat adresu</button><p class="subtle">Napište ulici a obec, potom vyberte adresu z výsledků. Vyhledání přes Photon / <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>.</p><div role="status" aria-live="polite"></div>';
 address.closest('label').after(box);const button=box.querySelector('button'),results=box.querySelector('[role=status]');let generation=0;
 address.addEventListener('input',()=>{generation++;results.replaceChildren()});
 button.onclick=async()=>{const q=address.value.trim(),n=++generation;if(q.length<3){results.textContent='Napište alespoň 3 znaky adresy.';return}button.disabled=true;results.textContent='Hledám adresu…';try{
  let rows=cache.get(q);if(!rows){const response=await fetch('https://photon.komoot.io/api/?limit=5&q='+encodeURIComponent(q),{credentials:'omit',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error();const data=await response.json();rows=(data.features||[]).map(f=>{const p=f.properties||{},street=[p.street,p.housenumber].filter(Boolean).join(' '),city=[p.postcode,p.city||p.town||p.village].filter(Boolean).join(' ');return [...new Set([p.name,street,city,p.country].filter(Boolean))].join(', ')}).filter(Boolean);if(cache.size>=50)cache.delete(cache.keys().next().value);cache.set(q,rows)}
  if(n!==generation||!box.isConnected)return;results.replaceChildren();if(!rows.length)results.textContent='Adresa nenalezena. Zpřesněte obec nebo ji zadejte ručně.';for(const value of rows){const b=document.createElement('button');b.type='button';b.className='secondary';b.style.cssText='display:block;width:100%;text-align:left;margin:6px 0';b.textContent=value;b.onclick=()=>{address.value=value;generation++;results.replaceChildren();address.focus()};results.append(b)}
 }catch{if(n===generation&&box.isConnected)results.textContent='Vyhledávání není dostupné. Adresu můžete vyplnit ručně.'}finally{button.disabled=false}};
}
export function jobNotes(state,job,date){const notes=[state.jobs.find(j=>j.id===job)?.note,...(state.extras?.notes||[]).filter(n=>n.job_id===job&&n.date===date).map(n=>n.note)].filter(n=>n?.trim());return notes.map(n=>`<div class="day-note" style="white-space:pre-wrap;overflow-wrap:anywhere"><strong>Poznámka</strong><br>${esc(n)}</div>`).join('')}
