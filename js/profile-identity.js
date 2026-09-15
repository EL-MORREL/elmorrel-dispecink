export function profileIdentity(workers, workerId) {
 const name = String(workers?.find(w => w.id === workerId)?.name || '').trim();
 const parts = name.split(/\s+/).filter(Boolean);
 return {name, initials: parts.length ? [parts[0], ...(parts.length > 1 ? [parts.at(-1)] : [])].map(part => Array.from(part)[0]).join('').toLocaleUpperCase('cs-CZ') : '—'};
}
export function updateProfileIdentity(element, workers, workerId) {
 if (!element) return;
 const identity = profileIdentity(workers, workerId);
 element.textContent = identity.initials;
 element.title = identity.name || 'Účet bez přiřazeného pracovníka';
 element.setAttribute('aria-label', identity.name || 'Účet bez přiřazeného pracovníka');
}
