import {rankJobs} from './job-picker.js?v=workspace-2';
// Keep the original select and its change handlers; typing only searches, selection applies.
export function enhanceFilters(root=document){
 const selector='.job-preferences select[data-pref=party],.job-preferences select[data-pref=lead],.attendance-filters select,.fuel-filters select,#report-worker,#report-job,#report-vehicle,#report-driver,select[name="billing-filter"],#purchase-filters select,[data-filter] select';
 for(const select of root.querySelectorAll(selector)){
  if(select.hidden||select.dataset.searchable||select.multiple)continue;
  select.dataset.searchable='true';
  const options=[...select.options].filter(o=>!o.disabled).map(o=>({id:o.value,name:o.textContent})),fallback=options[0];if(!fallback)continue;
  const wrap=document.createElement('div'),input=document.createElement('input'),list=document.createElement('div');wrap.className='job-picker';input.type='search';input.autocomplete='off';input.placeholder=fallback.name+' — pište pro hledání';input.setAttribute('aria-label',(select.closest('label')?.firstChild?.textContent||fallback.name).trim());input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');list.id='filter-'+crypto.randomUUID();list.setAttribute('role','listbox');input.setAttribute('aria-controls',list.id);list.hidden=true;select.hidden=true;select.after(wrap);wrap.append(input,list);
  const sync=()=>{input.value=select.value===fallback.id?'':options.find(o=>o.id===select.value)?.name||''};sync();let matches=[],active=0;
  const close=()=>{list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')};
  const choose=o=>{select.value=o.id;sync();close();select.dispatchEvent(new Event('change',{bubbles:true}))};
  const highlight=()=>{[...list.children].forEach((n,i)=>n.setAttribute('aria-selected',String(i===active)));if(matches.length)input.setAttribute('aria-activedescendant',list.children[active].id)};
  const show=()=>{matches=input.value.trim()?rankJobs(options,input.value):options;active=0;list.replaceChildren();matches.forEach((o,i)=>{const n=document.createElement('div');n.id=list.id+'-'+i;n.setAttribute('role','option');n.textContent=o.name;n.onmousedown=e=>e.preventDefault();n.onclick=()=>choose(o);list.append(n)});if(!matches.length)list.textContent='Žádná shoda.';list.hidden=false;input.setAttribute('aria-expanded','true');highlight()};
  input.onfocus=show;input.oninput=()=>{if(!input.value&&select.value!==fallback.id){choose(fallback);if(!input.isConnected)return;}show()};
  input.onkeydown=e=>{if(e.key==='Escape'){sync();close()}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show();else if(matches.length)active=(active+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;highlight();list.children[active]?.scrollIntoView({block:'nearest'})}if(e.key==='Enter'&&!list.hidden){e.preventDefault();if(matches[active])choose(matches[active])}};
  wrap.onfocusout=e=>{if(!wrap.contains(e.relatedTarget)){sync();close()}};
 }
}
const start=()=>{enhanceFilters();new MutationObserver(()=>enhanceFilters()).observe(document.getElementById('content')||document.body,{childList:true,subtree:true})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
