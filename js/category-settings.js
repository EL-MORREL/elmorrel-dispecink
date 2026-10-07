import {client} from './connection.js?v=shared-groups-1';
import {esc} from './data.js?v=overhead-unbilled-1';
export async function openCategorySettings(ctx){
 if(!ctx.admin())return;
 const dialog=document.createElement('dialog');dialog.className='operations-dialog';
 dialog.innerHTML='<h2>Kategorie nákladů</h2><p role="status">Načítám…</p><button type="button" data-close>Zavřít</button>';
 document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.showModal();
 const c=ctx.company();
 try{
  const result=await client.rpc('saas_cost_categories',{c});if(result.error)throw Error(result.error.message);
  const data=result.data;
  dialog.innerHTML='<form><h2>Kategorie nákladů</h2><p>Společné pro nabídky, změnové listy, fakturace a nákupy. Přejmenování zachová všechny vazby. Režijní zařazení platí pro nové nákupy; staré náklady se samy nepřesouvají.</p><div data-rows></div><button type="button" data-add>+ Přidat kategorii</button><p>Režijní nákupy se rozdělí podle odpracovaných hodin v měsíci nákladu. Dodatečná režie přepočítá i marže uzavřených zakázek.</p><p role="alert"></p><div class="toolbar"><button class="primary">Uložit kategorie</button><button type="button" data-close>Zavřít</button></div></form>';
  const rows=dialog.querySelector('[data-rows]');
  const add=x=>{const row=document.createElement('fieldset');row.className='form-grid';row.dataset.id=x.id;row.innerHTML=`<label>Název kategorie<input name="name" value="${esc(x.name)}" required maxlength="100"></label><label><input type="checkbox" name="overhead" ${x.overhead?'checked':''}> Režijní náklad</label>`;rows.append(row)};
  data.categories.forEach(add);dialog.querySelector('[data-add]').onclick=()=>add({id:'custom_'+crypto.randomUUID().replaceAll('-',''),name:'',overhead:false});
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('.primary');b.disabled=true;try{const p=[...rows.children].map(r=>({id:r.dataset.id,name:r.querySelector('[name=name]').value.trim(),overhead:r.querySelector('[name=overhead]').checked}));const saved=await client.rpc('saas_cost_categories',{c,p,expected_version:data.version});if(saved.error)throw Error(saved.error.message);await ctx.refresh();dialog.close();ctx.message('Kategorie byly uloženy pro celou firmu.');}catch(error){dialog.querySelector('[role=alert]').textContent=error.message}finally{b.disabled=false}};
 }catch(error){dialog.querySelector('[role=status]').textContent=error.message}
}
