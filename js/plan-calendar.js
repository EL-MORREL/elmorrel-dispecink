const dayNumber=s=>Date.parse(s+'T12:00:00Z')/86400000;
export function calendarOffsets(date,today,base){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(dayNumber(date)))return null;
 const b=new Date(base+'T12:00:00Z'),monday=dayNumber(base)-((b.getUTCDay()||7)-1);
 return {dayOffset:Math.round(dayNumber(date)-dayNumber(today)),weekOffset:Math.floor((dayNumber(date)-monday)/7)};
}
