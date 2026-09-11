// Keep scrolling while a dragged assignment is held near the visible edge.
let frame=0, board=null, speed=0, last=0;
function stop(){cancelAnimationFrame(frame);frame=0;board=null;speed=0;last=0}
function tick(now){
 if(!board?.isConnected){stop();return}
 board.scrollLeft+=speed*Math.min(now-(last||now),40)/1000;last=now;
 frame=requestAnimationFrame(tick);
}
document.addEventListener('dragover',event=>{
 const target=event.target.closest?.('.board-wrap');
 if(!target||!document.querySelector('.job-card[draggable="true"]')){stop();return}
 const rect=target.getBoundingClientRect(),left=Math.max(0,rect.left),right=Math.min(innerWidth,rect.right);
 const edge=Math.min(80,(right-left)/4);
 board=target;
 speed=event.clientX>right-edge?600*Math.min(1,(event.clientX-right+edge)/edge):event.clientX<left+edge?-600*Math.min(1,(left+edge-event.clientX)/edge):0;
 if(!speed){stop();return}
 event.preventDefault();if(!frame)frame=requestAnimationFrame(tick);
});
document.addEventListener('drop',stop);
document.addEventListener('dragend',stop);
document.addEventListener('dragleave',event=>{if(!event.relatedTarget)stop()});
window.addEventListener('blur',stop);
