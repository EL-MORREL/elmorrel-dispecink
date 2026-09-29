// Return a sorted copy; missing times follow timed assignments.
export function byStart(rows){
 const minutes=value=>{const m=/^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(value||''));return m&&+m[1]<24&&+m[2]<60?+m[1]*60+ +m[2]:Infinity};
 return [...rows].sort((a,b)=>{const x=minutes(a.start),y=minutes(b.start);return x===y?0:x<y?-1:1});
}
