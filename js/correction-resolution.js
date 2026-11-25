const minute=v=>v?Math.floor(Date.parse(v)/60000):null;
export function correctionMatches(r,p){return r.worker_id===p.worker&&r.job_id===p.job&&minute(r.proposed_start)===minute(p.start)&&((!r.proposed_end&&(!r.original_value?.left_at||!p.end))||minute(r.proposed_end)===minute(p.end))&&Number(r.break_minutes)===Number(p.break||0)}
export function confirmCorrectionResolution(state,action,p,ask=confirm){
 if(action!=='direct_time'&&!(action==='admin_record'&&p.action==='attendance_update'))return p;
 const id=p.attendance||p.id;if(!id)return p;
 const requests=(state.extras?.requests||[]).filter(r=>r.status==='pending'&&r.attendance_id===id&&!correctionMatches(r,p));
 if(!requests.length)return p;
 const time=v=>v?new Date(v).toLocaleString('cs-CZ'):'bez odchodu';
 const text=requests.map(r=>time(r.proposed_start)+' – '+time(r.proposed_end)+' · '+r.reason).join('\n');
 return ask('K této docházce existuje žádost o opravu:\n'+text+'\n\nUzavřít ji touto ruční úpravou?\nOK: uložit docházku a uzavřít žádost.\nZrušit: uložit docházku, žádost ponechat k řešení.')?{...p,resolve_requests:requests.map(r=>({id:r.id,created_at:r.created_at}))}:p;
}
