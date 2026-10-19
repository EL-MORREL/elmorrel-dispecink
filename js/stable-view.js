export function capturePageView(){
 const x=window.scrollX,y=window.scrollY,content=document.getElementById('content');
 const key=e=>(e.closest('section')?.querySelector('h2,h3')?.textContent||'')+'|'+(e.querySelector(':scope > summary')?.textContent||'').replace(/\d+/g,'#');
 const opened=new Map([...content.querySelectorAll('details')].map(e=>[key(e),e.open]));
 const anchor=[...content.querySelectorAll('section[id],section.overview-panel')].find(e=>e.getBoundingClientRect().bottom>0),label=anchor?.id||anchor?.querySelector('h2')?.textContent,offset=anchor?.getBoundingClientRect().top;
 return ()=>{for(const e of content.querySelectorAll('details'))if(opened.has(key(e)))e.open=opened.get(key(e));const next=[...content.querySelectorAll('section[id],section.overview-panel')].find(e=>(e.id||e.querySelector('h2')?.textContent)===label);window.scrollTo(x,next&&offset!==undefined?window.scrollY+next.getBoundingClientRect().top-offset:y);};
}
