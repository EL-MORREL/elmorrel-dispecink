const shell=document.querySelector('.shell'),sidebar=document.querySelector('.sidebar'),header=document.querySelector('.main-shell header');
if(shell&&sidebar&&header){
 sidebar.id='main-sidebar';
 const button=document.createElement('button');button.type='button';button.className='sidebar-toggle secondary';button.setAttribute('aria-controls',sidebar.id);
 let collapsed=false;try{collapsed=localStorage.getItem('planner-sidebar-collapsed')==='true'}catch{}
 function draw(){shell.classList.toggle('sidebar-collapsed',collapsed);button.textContent=collapsed?'☰ Zobrazit menu':'☰ Sbalit menu';button.setAttribute('aria-expanded',String(!collapsed))}
 button.onclick=()=>{collapsed=!collapsed;try{localStorage.setItem('planner-sidebar-collapsed',String(collapsed))}catch{}draw()};
 header.prepend(button);draw();
}
