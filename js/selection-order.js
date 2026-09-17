export const byName=rows=>[...rows].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'cs',{numeric:true,sensitivity:'base'}));
export const searchText=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs');
