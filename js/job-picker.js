import {registerPicker} from './picker-dismiss.js?v=picker-dismiss-1';
import {searchText} from './selection-order.js?v=workspace-2';
export function rankJobs(jobs,query){const q=searchText(query).trim(),words=q.split(/\s+/);return jobs.filter(j=>words.every(w=>searchText(j.name+' '+(j.address||'')).includes(w))).sort((a,b)=>{const score=j=>{const n=searchText(j.name);return n===q?0:n.startsWith(q)?1:2};return score(a)-score(b)||a.name.localeCompare(b.name,'cs')});}
export function jobPicker(select,jobs,onChange,emptyLabel='Volná objednávka — vyhledejte zakázku'){
 const label=select.parentElement,wrap=document.createElement('div'),input=document.createElement('input'),list=document.createElement('div');
 wrap.className='job-picker';input.type='search';input.placeholder=emptyLabel;input.autocomplete='off';input.setAttribute('aria-label','Vyhledat zakázku');input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');list.id='job-options-'+crypto.randomUUID();list.setAttribute('role','listbox');input.setAttribute('aria-controls',list.id);list.hidden=true;select.hidden=true;input.value=jobs.find(j=>j.id===select.value)?.name||'';label.append(wrap);wrap.append(input,list);let matches=[],active=0;
 const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')};
 const choose=i=>{if(!matches[i])return;select.value=matches[i].id;input.value=matches[i].name;input.setCustomValidity('');close();onChange()};
 const highlight=()=>{[...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));if(matches.length)input.setAttribute('aria-activedescendant',list.children[active].id)};
 const show=()=>{matches=rankJobs(jobs,input.value);active=0;list.replaceChildren();for(const [i,j] of matches.entries()){const el=document.createElement('div');el.id=list.id+'-'+i;el.setAttribute('role','option');el.textContent=j.name+(j.address?' · '+j.address:'');el.onmousedown=e=>e.preventDefault();el.onclick=()=>choose(i);list.append(el)}if(!matches.length)list.textContent='Žádná odpovídající zakázka.';list.hidden=false;input.setAttribute('aria-expanded','true');highlight()};
 registerPicker(wrap,close);
 input.oninput=()=>{select.value='';input.setCustomValidity(input.value.trim()?'Vyberte zakázku z výsledků nebo vymažte hledání pro volnou objednávku.':'');show();onChange()};input.onfocus=show;
 input.onkeydown=e=>{if(e.key==='Escape'&&!list.hidden){e.preventDefault();e.stopPropagation();close();return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show();if(matches.length){active=(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;highlight();list.children[active].scrollIntoView({block:'nearest'})}}if(e.key==='Enter'&&!list.hidden){e.preventDefault();choose(active)}};
 wrap.onfocusout=e=>{if(!wrap.contains(e.relatedTarget))close()};
}
