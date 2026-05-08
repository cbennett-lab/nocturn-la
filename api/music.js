// api/music.js - Bandsintown
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const APP_ID = process.env.BANDSINTOWN_APP_ID;
  if (!APP_ID) return res.status(500).json({ error: 'BANDSINTOWN_APP_ID not configured' });
  const { date = 'today', limit = '20' } = req.query;
  try {
    const url = `https://rest.bandsintown.com/events/search?app_id=${APP_ID}&location=Los+Angeles,CA&date=${date}&per_page=${limit}`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const evs = await r.json();
    const normalized = (Array.isArray(evs) ? evs : []).map(ev => {
      const dt = new Date(ev.datetime); const v = ev.venue || {};
      return { id: `bit_${ev.id}`, source: 'bandsintown', artistName: ev?.artist?.name || '', name: `${ev.artist?.name || 'Live Music'} at ${v.name || 'LA Venue'}`, day: dt.toLocaleDateString('en-US',{day:'numeric',timeZone:'America/Los_Angeles'}), month: dt.toLocaleDateString('en-US',{month:'short',timeZone:'America/Los_Angeles'}).toUpperCase(), time: dt.toLocaleTimeString('en-US',{hour:/numeric',minute:'2-digit',hour12:true,timeZone:'America/Los_Angeles'}), venue: v.name || '', neighborhood: v.city || 'LA', isFree: false, url: ev.url || '', ticketUrl: ev.offers?.[0]?.url || ev.url || '', tags: [{cls:'tag-paid',label:'Ticketed'}], going: ev.going || 0 };
    });
    return res.status(200).json({ events: normalized, total: normalized.length });
  } catch(err) { return res.status(500).json({ error: 'Failed' }); }
}
