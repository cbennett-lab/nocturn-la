// api/events.js - Eventbrite + Ticketmaster
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const EVENTBRITE_KEY = process.env.EVENTBRITE_API_KEY;
  const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY;
  const { date, limit = '20', lat = '34.0522', lon = '-118.2437', radius = '25', free = '' } = req.query;
  const results = [];
  if (EVENTBRITE_KEY) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      let url = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${lat}&location.longitude=${lon}&location.within=${radius}mi&start_date.range_start=${today}T00:00:00';
      if (free === 'true') url += '&price=free';
      const res2 = await fetch(url, { headers: { Authorization: `Bearer ${EVENTBRITE_KEY}` } });
      const d = await res2.json();
      for (const e of (d.events || [])) {
        const v = e.venue || {}; const dt = new Date(e.start?.local || e.start?.utc);
        const isFree = e.is_free; const price = isFree ? 'Free' : (e.ticket_availability?.minimum_ticket_price?.display || 'See site');
        results.push({ id: `eb_${e.id}`, source: 'eventbrite', name: e.name?.text || '', description: e.summary || '', day: dt.toLocaleDateString('en-US',{day:'numeric',timeZone:'America/Los_Angeles'}), month: dt.toLocaleDateString('en-US',{month:'short',timeZone:'America/Los_Angeles'}).toUpperCase(), time: dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'America/Los_Angeles'}), neighborhood: v.address?.city || 'LA', price, isFree, url: e.url || '', tags: [isFree ? {cls:'tag-free',label:'Free'} : {cls:'tag-paid',label:price}] });
      }
    } catch(e) { console.error('EB:',e.message); }
  }
  return res.status(200).json({ events: results.slice(0, parseInt(limit)), total: results.length });
}
