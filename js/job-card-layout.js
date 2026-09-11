export function arrangeJobCards(){
 document.querySelectorAll('.list-card .card-actions').forEach(actions=>{
  const card=actions.closest('.list-card');card.classList.add('job-summary-card');
  const more=document.createElement('details');more.className='job-more';
  const summary=document.createElement('summary');summary.textContent='Další';summary.setAttribute('aria-label','Další akce zakázky');more.append(summary);
  const menu=document.createElement('div');menu.className='job-more-menu';more.append(menu);
  [...actions.children].forEach(button=>{
   if(button.dataset.action==='job'){button.classList.remove('secondary');button.classList.add('primary');button.textContent='Detail zakázky';}
   else if(button.dataset.op!=='billing')menu.append(button);
  });
  if(menu.children.length)actions.append(more);
 });
}
