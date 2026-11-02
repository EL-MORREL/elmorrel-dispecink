export function confirmAttendanceTransition(state,p,ask=message=>confirm(message)){
 const start=Date.parse(p.start);let end=p.end?Date.parse(p.end):Infinity;
 const rows=state.attendance.filter(t=>t.worker===p.worker&&t.id!==p.attendance);
 const name=t=>state.jobs.find(j=>j.id===t.job)?.name||'Zakázka';
 const time=v=>new Date(v).toLocaleString('cs-CZ',{timeZone:'Europe/Prague',second:'2-digit',minute:'2-digit',hour:'2-digit',day:'numeric',month:'numeric',year:'numeric'});
 // The form displays minutes, but copied clock events retain seconds. Offer to
 // align the new end to the worker's next arrival within that displayed minute.
 const following=rows.filter(t=>t.job!==p.job&&Date.parse(t.start)>start&&Date.parse(t.start)<end&&Math.floor(Date.parse(t.start)/60000)===Math.floor(end/60000)).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))[0];
 if(following)end=Date.parse(following.start);
 const overlaps=rows.filter(t=>Date.parse(t.start)<end&&(!t.end||Date.parse(t.end)>start));
 const changes=[];
 if(following)changes.push('Odchod nové docházky upravit z '+time(p.end)+' na '+time(following.start)+', kdy pracovník nastoupil na „'+name(following)+'“. Následující docházka zůstane zachovaná.');
 if(!overlaps.length&&!following)return p;
 const previous=overlaps[0];
 if(overlaps.length>1||previous&&(previous.job===p.job||Date.parse(previous.start)>=start))throw Error('Docházka se překrývá: '+overlaps.map(t=>'„'+name(t)+'“ ('+time(t.start)+' – '+(t.end?time(t.end):'bez odchodu')+')').join('; ')+'. Opravte časy; tento překryv nelze vyřešit ukončením předchozí zakázky.');
 if(previous)changes.unshift('Ukončit předchozí zakázku „'+name(previous)+'“ v '+time(p.start)+'. Příchod a přestávka předchozího úseku zůstanou zachované.');
 if(!ask('Docházka navazuje na jiné úseky.\n\n'+changes.join('\n\n')+'\n\nProvést tyto úpravy a uložit novou docházku?'))throw Error('Zápis nebyl uložen. Rozpracované údaje zůstaly zachované.');
 return {...p,...(following?{end:following.start}:{}),...(previous?{finish_previous:previous.id}:{})};
}
