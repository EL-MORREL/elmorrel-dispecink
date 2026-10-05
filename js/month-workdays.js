import {holidayName} from './holidays.js?v=finance-categories-1';
export function workedDays(rows){return new Set(rows.filter(r=>Number(r.hours)>0).map(r=>(r.workerId||r.worker)+'|'+r.date)).size;}
export function workedDaysLabel(count){return count+' '+(count===1?'den':count>=2&&count<=4?'dny':'dnů');}
export function workedDayBreakdown(rows){
 const days=new Map(rows.filter(r=>Number(r.hours)>0).map(r=>[(r.workerId||r.worker)+'|'+r.date,r.date]));
 const counts={saturday:0,sunday:0,holiday:0};
 for(const date of days.values()){const weekday=new Date(date+'T12:00:00Z').getUTCDay();if(weekday===6)counts.saturday++;if(weekday===0)counts.sunday++;if(holidayName(date))counts.holiday++;}
 return counts;
}
export function workedDayBreakdownMarkup(rows){const c=workedDayBreakdown(rows);return '<small class="subtle" style="display:block;font-weight:400;white-space:normal" title="Odpracované dny podle data příchodu. Svátek o víkendu patří do obou kategorií; celkový počet dnů se nenavyšuje.">Z toho soboty: '+c.saturday+' · neděle: '+c.sunday+' · svátky: '+c.holiday+'</small>';}
export function monthWorkdays(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
 const [year,m]=month.split('-').map(Number);if(year<1583)return null;
 const days=new Date(Date.UTC(year,m,0)).getUTCDate();let count=0;
 for(let d=1;d<=days;d++){const date=month+'-'+String(d).padStart(2,'0'),weekday=new Date(date+'T12:00:00Z').getUTCDay();if(weekday!==0&&weekday!==6&&!holidayName(date))count++;}
 return count;
}
export function monthWorkdaysMarkup(month){
 const count=monthWorkdays(month);if(count===null)return '';
 const label=new Date(month+'-01T12:00:00Z').toLocaleDateString('cs-CZ',{month:'long',year:'numeric',timeZone:'Europe/Prague'});
 return '<p class="month-workdays" aria-live="polite" style="margin:0 0 16px"><strong>'+label+' · Pracovní dny: '+count+'</strong><br><span class="subtle">Pondělí–pátek bez českých svátků.</span></p>';
}
