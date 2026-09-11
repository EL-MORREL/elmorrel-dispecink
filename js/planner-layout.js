export function decoratePlannerLayout(render,user){
 const table=document.querySelector('.board-wrap .schedule');if(!table)return;
 const key='planner-orientation:'+user;let top=false;try{top=localStorage.getItem(key)==='top'}catch{}
 const controls=document.createElement('div');controls.className='planner-layout-controls';
 const label=document.createElement('span');label.textContent='Rozložení';controls.append(label);
 for(const [value,text] of [['left','Lidé / auta vlevo'],['top','Lidé / auta nahoře']]){
  const button=document.createElement('button');button.type='button';button.textContent=text;button.dataset.planLayout=value;button.setAttribute('aria-pressed',String(top===(value==='top')));button.className=top===(value==='top')?'primary':'secondary';
  button.onclick=()=>{try{localStorage.setItem(key,value)}catch{}render()};controls.append(button);
 }
 table.parentElement.before(controls);if(!top)return;
 const days=[...table.tHead.rows[0].cells].slice(1);const workers=[...table.tBodies[0].rows];
 const cells=workers.map(row=>[...row.cells]);const head=document.createElement('thead'),hr=document.createElement('tr');
 const corner=document.createElement('th');corner.textContent='Den';hr.append(corner);
 for(const row of cells){const th=document.createElement('th');th.append(...row[0].childNodes);hr.append(th)}head.append(hr);
 const body=document.createElement('tbody');
 days.forEach((day,index)=>{const tr=document.createElement('tr'),date=document.createElement('th');date.scope='row';date.className='person-cell';date.textContent=day.textContent;tr.append(date);for(const row of cells)tr.append(row[index+1]);body.append(tr)});
 table.replaceChildren(head,body);table.classList.add('schedule-transposed');
}
