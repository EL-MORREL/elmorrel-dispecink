import {allocationsOf,unallocated} from './purchase-shares.js?v=workspace-2';
export const missingPurchaseCategory=(purchase,data)=>{const missing=key=>!key||key==='unclassified'||(data?.categories?.length&&!data.categories.some(c=>c.id===key));return allocationsOf(purchase).some(a=>Number(a.amount)>0&&missing(a.cost_category))||(unallocated(purchase)>0&&missing(purchase.remainder_category));};
export const missingCategoryNotice=(purchase,data)=>missingPurchaseCategory(purchase,data)?'<p data-missing-category style="color:#a31515;font-weight:700">⚠ Chybí kategorie</p>':'';
