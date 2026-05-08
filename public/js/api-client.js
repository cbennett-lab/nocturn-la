// public/js/api-client.js
// Connects Nocturn LA frontend to all live API endpoints

const API_BASE = window.location.origin;

window.userLocation = { lat: 34.0522, lon: -118.2437, neighborhood: 'Los Angeles', granted: false };

window.requestLocation = function () {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      window.userLocation.lat = pos.coords.latitude;
      window.userLocation.lon = pos.coords.longitude;
      window.userLocation.granted = true;
      try {
        const d = await apiFetch(`/api/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        window.userLocation.neighborhood = d.neighborhood || 'Your location';
        document.querySelectorAll('.js-user-neighborhood').forEach(el => { el.textContent = d.neighborhood; });
      } catch {}
      if (window.loadNearby) window.loadNearby();
    },
    () => { window.userLocation.granted = false; },
    { timeout: 8000, maximumAge: 300000 }
  );
};

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, { headers: { Accept: 'application/json', ...(options.headers || {}) }, ...options });
  if (!res.ok) throw new Error(`API ${path} responded ${res.status}`);
  return res.json();
}

function renderSkeletons(count, cls) {
  return Array.from({ length: count }, () => `<div class="${cls}" style="opacity:0.4;pointer-events:none"><div style="height:14px;background:var(--night5);border-radius:4px;margin-bottom:10px;width:70%"></div><div style="height:10px;background:var(--night5);border-radius:4px;width:90%;margin-bottom:6px"></div><div style="height:10px;background:var(--night5);border-radius:4px;width:60%"></div></div>`).join('');
}
function renderEmpty(msg) { return `<div style="padding:32px;text-align:center;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--t3)">${msg}</div>`; }
function renderError(msg) { return `<div style="padding:32px;text-align:center;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--coral)">${msg}</div>`; }
function escHtml(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function getTrendingIcon(f) { if (!f) return 'fa-fire'; f=f.toLowerCase(); if(f.includes('bar'))return 'fa-wine-glass'; if(f.includes('food'))return 'fa-utensils'; if(f.includes('art'))return 'fa-palette'; if(f.includes('hike')||f.includes('nature'))return 'fa-mountain'; return 'fa-fire'; }

window.loadWeather = async function() {
  const els = { temp:document.getElementById("w-temp"), desc:document.getElementById("w-desc"), icon:document.getElementById("w-ico"), hum:document.getElementById("w-hum"), wind:document.getElementById("w-wind"), uv:document.getElementById("w-uv"), sunset:document.getElementById("w-sunset"), topTemp:document.getElementById("top-temp"), topCond:document.getElementById("top-cond"), topIco:document.getElementById("top-ico") };
  try {
    const w = await apiFetch('/api/weather');
    if(els.temp)els.temp.textContent=`${w.temp}°F`;
    if(els.desc)els.desc.textContent=w.desc;
    if(els.icon)els.icon.className=`fa-solid ${w.icon}`;
    if(els.hum)els.hum.textContent=w.humidity;
    if(els.wind)els.wind.textContent=w.wind;
    if(els.uv)els.uv.textContent=w.uv;
    if(els.sunset)els.sunset.textContent=w.sunset;
    if(els.topTemp)els.topTemp.textContent=`${w.temp}°`;
    if(els.topCond)els.topCond.textContent=w.condition||w.desc.split(' ')[0];
    if(els.topIco)els.topIco.className=`fa-solid ${w.icon}`;
  } catch(e) { console.warn('Weather failed:',e.message); }
};

window.loadEvents = async function(opts={}) {
  const {date,category,free,limit=20,targetEl}=opts;
  const el = targetEl||document.getElementById('js-events-list');
  if(!el)return;
  el.innerHTML=renderSkeletons(3,'ev-skeleton');
  try {
    let url=`/api/events?limit=${limit}`;
    if(date)url+=`&date=${date}`;
    if(category)url+=`&category=${category}`;
    if(free)url+='&free=true';
    const data=await apiFetch(url);
    const evs=data.events||[];
    if(!evs.length){el.innerHTML=renderEmpty('No events found.');return;}
    el.innerHTML=evs.map(e=>`<div class="ev" onclick="openEventDrawer(${JSON.stringify(e).replace(/\"/g,'&quot;')})"><div class="ev-date"><span class="ev-day">${e.day}</span><span class="ev-mon">${e.month}</span></div><div class="ev-body"><h3>${escHtml(e.name)}</h3>${e.description?`<p>${escHtml(e.description.substring(0,120))}…</p>`:''}<div class="meta-row">${e.tags.map(t=>`<span class="tag ${t.cls}">${t.label}</span>`).join('')}${e.venue?`<span class="meta-txt">${escHtml(e.neighborhood||e.venue)}</span>`:''}${e.time?`<span class="meta-txt">${e.time}</span>`:''}</div></div><div class="ev-r"><div class="ev-price">${e.price||'—'}</div></div></div>`).join('');
  } catch(err) { el.innerHTML=renderError('Could not load events.'); }
};

window.loadNearby = async function(opts={}) {
  const {category='outdoors',limit=12,openNow=false,targetEl}=opts;
  const el=targetEl||document.getElementById('js-near-grid');
  if(!el)return;
  el.innerHTML=renderSkeletons(6,'nc-skeleton');
  try {
    const {lat,lon}=window.userLocation;
    let url=`/api/nearby?lat=${lat}&lon=${lon}&category=${category}&limit=${limit}`;
    if(openNow)url+='&open_now=true';
    const data=await apiFetch(url);
    const places=data.places||[];
    if(!places.length){el.innerHTML=renderEmpty('No places found nearby.');return;}
    el.innerHTML=places.map(p=>`<div class="nc" onclick="openNearbyDrawer('${p.id}',${JSON.stringify(p).replace(/\"/g,'&quot;')})"><div class="nc-dist"><div class="pulse"></div>${p.distanceLabel}</div><h3>${escHtml(p.name)}</h3><p style="font-size:12px;color:var(--t3)">${escHtml(p.category)}</p></div>`).join('');
  } catch(err) { el.innerHTML=renderError('Could not load nearby places.'); }
};

window.loadTrending = async function(opts={}) {
  const { limit=10, targetEl }=opts;
  const el=targetEl||document.getElementById('js-trending-list');
  if(!el)return;
  try {
    const data=await apiFetch(`/api/trending?limit=${limit}`);
    const posts=data.trending||[];
    el.innerHTML=posts.map(p=>`<div class="ac" ${p.url?`onclick="window.open('${p.url}','_blank')"`:''}><div class="ac-ico"><i class="fa-solid ${getTrendingIcon(p.flair)}"></i></div><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">${p.trending?'<span class="tag tag-hot">🔥 Trending</span>':''}${p.platform?`<span class="tag tag-gem">${p.platform}</span>`:'<span class="tag">Reddit</span>'}</div><h3>${escHtml(p.title)}</h3>${p.description?`<p>${escHtml(p.description.substring(0,150))}</p>`:''}</div>`).join('');
  } catch(e) { el.innerHTML=renderError('Could not load trending.'); }
};

window.loadEstateSales = async function(opts={}) {
  const { limit=8, targetEl }=opts;
  const { lat, lon }=window.userLocation;
  const el=targetEl||document.getElementById('js-estate-sales');
  if(!el)return;
  try {
    const data=await apiFetch(`/api/estate-sales?lat=${lat}&lon=${lon}&limit=${limit}`);
    const sales=data.sales||[];
    el.innerHTML=sales.map(s=>`<div class="ev"><div class="ev-date"><span class="ev-day">${s.startDate.split(' ')[1]||'-'}</span><span class="ev-mon">${s.startDate.split(' ')[0]||''}</span></div><div class="ev-body"><h3>${escHtml(s.name)}</h3><p>${escHtml(s.description.substring(0,120))}</p><div class="meta-row">${s.tags.map(t=>`<span class="tag ${t.cls}">${t.label}</span>`).join('')}<span class="meta-txt">${escHtml(s.neighborhood)}</span></div></div></div>`).join('');
  } catch(e) { el.innerHTML=renderError('Could not load estate sales.'); }
};

window.loadPlaceDetails = async function(placeName) {
  try {
    const data=await apiFetch(`/api/place?name=${encodeURIComponent(placeName)}`);
    if(data.isOpenNow!==null){
      document.querySelectorAll('.d-live-status').forEach(el=>{
        el.textContent=data.isOpenNow?'● Open now':'Currently closed';
        el.style.color=data.isOpenNow?'#5DCAA5':'var(--coral)';
      });
    }
    return data;
  } catch(e) { console.warn('Place details failed:',e.message); }
};

window.openEventDrawer = function(ev) {
  const place={name:ev.name,tagline:ev.description||'',icon:'fa-calendar',tags:ev?.tags||[],stats:[{k:'Date',v:ev.date},{k:'Time',v:ev.time||'—'},{k: 'Price',v:ev.price||'—'}],about:ev.description||'',tip:ev.venue?`at ${ev.venue}`:'',crowd:null,hours:[{day:ev.date,t:ev?.time||'See event',today:true}],photos:[],transport:[],nearby:[],address:ev.address||ev.neighborhood||'LA',url:ev?.url};
  if(window.renderDrawer)window.renderDrawer(place);
  const d=document.getElementById('drawer');
  if(d)d.classList.add('open');
};

window.openNearbyDrawer = function(id,pd) {
  const place={name:pd.name,tagline:`${pd.category} ${pd.distanceLabel}`,icon:pd.categoryIcon||'fa-map-pin',tags:pd.tags||[],stats:[{k:'Distance',v:pd.distanceLabel},{k: 'Category',v:pd.category}].filter(Boolean),about:pd.description||'',tip:pd.tip||null,crowd:null,hours:[],photos:pd.photoUrl?[{url:pd.photoUrl}]:[],transport:[],nearby:[],address:pd.address||'LA'};
  window.currentPlaceId=id;
  if(window.renderDrawer)window.renderDrawer(place);
  const d=document.getElementById('drawer');
  if(d)d.classList.add('open');
  document.body.style.overflow='hidden';
  if(pd.name)window.loadPlaceDetails(pd.name);
};

document.addEventListener('DOMContentLoaded',()=>{
  window.requestLocation();
  window.loadWeather();
  window.loadEvents({limit:6});
  window.loadNearby({category:'outdoors',limit:6});
  console.log('[NocturnLA] Live data initialized');
});
