export async function invitationError(data,error){
 let body=data;
 if(error?.context&&typeof error.context.clone==='function'){
  try{body=await error.context.clone().json()}catch{}
 }
 const detail=typeof body?.error==='string'?body.error:typeof body?.message==='string'?body.message:null;
 const status=error?.context?.status;
 if(detail)return new Error(detail+(status?` (HTTP ${status})`:''));
 if(status===401)return new Error('Přihlášení vypršelo. Přihlaste se znovu a opakujte pozvánku.');
 if(status===403)return new Error('Server odmítl pozvánku (HTTP 403). Zkontrolujte oprávnění administrátora a nastavení odesílání pozvánek.');
 if(status===400)return new Error('Server nemohl odeslat pozvánku (HTTP 400). Důvod je potřeba ověřit v protokolu funkce dynamic-handler v Supabase.');
 return new Error('Pozvánku se nepodařilo odeslat.'+(status?` (HTTP ${status})`:' Zkontrolujte připojení a dostupnost služby.'));
}
