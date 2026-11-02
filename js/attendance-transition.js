export function confirmAttendanceTransition(state,p,ask=message=>confirm(message)){
 const start=Date.parse(p.start),end=p.end?Date.parse(p.end):Infinity;
 const overlaps=state.attendance.filter(t=>t.worker===p.worker&&t.id!==p.attendance&&Date.parse(t.start)<end&&(!t.end||Date.parse(t.end)>start));
 if(!overlaps.length)return p;
 const previous=overlaps[0];
 if(overlaps.length!==1||previous.job===p.job||Date.parse(previous.start)>=start)throw Error('Docházka se překrývá s jiným úsekem. Opravte jeho časy; tento překryv nelze vyřešit ukončením předchozí zakázky.');
 const name=state.jobs.find(j=>j.id===previous.job)?.name||'Předchozí zakázka';
 const time=new Date(p.start).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'});
 if(!ask('Pracovník má v tomto čase docházku na zakázce „'+name+'“.\n\nUkončit předchozí zakázku v '+time+' a uložit novou?\nPříchod a přestávka předchozího úseku zůstanou zachované.'))throw Error('Zápis nebyl uložen. Rozpracované údaje zůstaly zachované.');
 return {...p,finish_previous:previous.id};
}
