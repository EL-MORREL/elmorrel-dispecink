const preference='planner-remember';
export const authStorage={
 getItem(key){return sessionStorage.getItem(key)??localStorage.getItem(key)},
 setItem(key,value){const remember=localStorage.getItem(preference)==='yes';(remember?localStorage:sessionStorage).setItem(key,value);(remember?sessionStorage:localStorage).removeItem(key)},
 removeItem(key){localStorage.removeItem(key);sessionStorage.removeItem(key)}
};
export function rememberLogin(value){localStorage.setItem(preference,value?'yes':'no')}
export function remembered(){return localStorage.getItem(preference)==='yes'}
