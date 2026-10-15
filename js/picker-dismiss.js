const closers=new WeakMap();
export function registerPicker(wrap,close){closers.set(wrap,close);wrap.dataset.dismissPicker='true'}
function dismissOutside(target){for(const wrap of document.querySelectorAll('[data-dismiss-picker]'))if(!target||!wrap.contains(target))closers.get(wrap)?.()}
document.addEventListener('pointerdown',event=>dismissOutside(event.target),true);
document.addEventListener('click',event=>dismissOutside(event.target));
document.addEventListener('focusin',event=>dismissOutside(event.target));
window.addEventListener('blur',()=>dismissOutside(null));
