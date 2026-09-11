export function arrangeWorkerCards(){
 document.querySelectorAll('.list-card [data-action="worker"]').forEach(detail=>{
  const card=detail.closest('.list-card');card.classList.add('worker-card');card.parentElement.classList.add('worker-grid');
  const actions=document.createElement('div');actions.className='worker-actions';
  const more=document.createElement('details');more.className='job-more';
  const title=document.createElement('summary');title.textContent='Další možnosti';more.append(title);
  const menu=document.createElement('div');menu.className='job-more-menu';more.append(menu);
  for(const b of [...card.children].filter(el=>el.tagName==='BUTTON')){
   if(b===detail||b.dataset.op==='worker-settings')actions.append(b);else menu.append(b);
  }
  if(menu.children.length)actions.append(more);card.append(actions);
 });
}
