import {esc} from './data.js?v=overhead-unbilled-1';
export function driverMarkup(booking){if(!booking)return '';return '<p class="vehicle-driver '+(booking.driver?'assigned':'unassigned')+'">'+(booking.driver?'Řidič: <strong>'+esc(booking.driverName||'Jméno není dostupné')+'</strong>':'Řidič neurčen')+'</p>';}
export function defaultDriverMarkup(vehicle){return '<p class="vehicle-driver default-driver">Výchozí řidič: '+(vehicle.defaultDriver?'<strong>'+esc(vehicle.defaultDriverName||'Jméno není dostupné')+'</strong>':'neurčen')+'</p>';}
