import {invitationError} from './invitation-error.js';
export async function sendInvitation(client,body){
 let {data,error}=await client.auth.getSession();
 if(error)throw new Error('Nepodařilo se ověřit přihlášení. Zkuste to znovu.');
 let session=data?.session;
 if(!session?.access_token)throw new Error('Pro odeslání pozvánky se nejdříve přihlaste.');
 if(!session.expires_at||session.expires_at*1000<=Date.now()+60000){
  const refreshed=await client.auth.refreshSession();
  if(refreshed.error||!refreshed.data?.session?.access_token)throw new Error('Přihlášení se nepodařilo obnovit. Zkuste to znovu, případně se znovu přihlaste.');
  session=refreshed.data.session;
 }
 const result=await client.functions.invoke('dynamic-handler',{body,headers:{Authorization:`Bearer ${session.access_token}`}});
 if(result.error||result.data?.error)throw await invitationError(result.data,result.error);
 return result.data;
}
