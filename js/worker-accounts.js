export function accountLabel(a){
 if(a?.connected)return a.last_sign_in_at?'Přihlášený alespoň jednou · poslední přihlášení '+new Date(a.last_sign_in_at).toLocaleString('cs-CZ'):'Účet připojený · zatím bez přihlášení';
 if(a?.invitation_sent)return 'Pozvánka odeslána '+new Date(a.invitation_sent).toLocaleDateString('cs-CZ');
 if(a?.invitation_created)return 'Pozvánka vytvořena · odeslání nepotvrzené';
 return 'Bez připojeného účtu a pozvánky';
}
export const roleLabel=role=>({owner:'Administrátor',admin:'Administrátor',dispatcher:'Dispečer',editor:'Dispečer',foreman:'Vedoucí realizace',worker:'Realizace',reader:'Realizace'})[role]||'Bez přiděleného oprávnění';
