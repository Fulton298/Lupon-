const VERSION='v2';
const SHELL=[
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest',
  './img/icon-192.png','./img/icon-512.png','./files/files.json'
];
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open('shell-'+VERSION); await c.addAll(SHELL);
  try{const r=await fetch('./files/files.json',{cache:'no-store'});const list=await r.json();
    const dc=await caches.open('docs-'+VERSION); await dc.addAll(list.map(x=>'./'+x.path));
  }catch(e){}
  self.skipWaiting();
})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  const keys=await caches.keys(); await Promise.all(keys.filter(k=>!k.endsWith(VERSION)).map(k=>caches.delete(k))); clients.claim();
})())});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.pathname.endsWith('/files/files.json')){
    e.respondWith((async()=>{try{const f=await fetch(e.request);const c=await caches.open('shell-'+VERSION);c.put(e.request,f.clone());return f;}
    catch(err){const c=await caches.open('shell-'+VERSION);return (await c.match(e.request))||Response.error();}})());
    return;
  }
  e.respondWith((async()=>{const cached=await caches.match(e.request);if(cached)return cached;
    try{const r=await fetch(e.request);const c=await caches.open('rt-'+VERSION);c.put(e.request,r.clone());return r;}
    catch(err){return cached||Response.error();}})());
});
