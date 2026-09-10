const BRAND_CACHE='planner-brand-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Only a company logo and manifest are cached. Never cache attendance, API calls or accounts.
self.addEventListener('message',event=>{if(event.data?.type!=='brand')return;event.waitUntil((async()=>{const {name,logo}=event.data;if(typeof logo!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo)||logo.length>700000)return;const cache=await caches.open(BRAND_CACHE),scope=self.registration.scope;
await cache.put(new URL('company-icon.png',scope),await fetch(logo));
await cache.put(new URL('company.webmanifest',scope),new Response(JSON.stringify({id:scope,name:String(name||'Plánovač').slice(0,120),short_name:String(name||'Plánovač').slice(0,24),start_url:scope,scope,display:'standalone',background_color:'#f5f8fc',theme_color:'#398aef',icons:[{src:new URL('company-icon.png',scope).href,sizes:'256x256',type:'image/png',purpose:'any'}]}),{headers:{'Content-Type':'application/manifest+json'}}));event.ports[0]?.postMessage('ready')})())});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.href===new URL('company.webmanifest',self.registration.scope).href||u.href===new URL('company-icon.png',self.registration.scope).href)event.respondWith(caches.open(BRAND_CACHE).then(c=>c.match(event.request)).then(r=>r||new Response('',{status:404}))) });
