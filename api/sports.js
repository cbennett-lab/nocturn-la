// api/sports.js
// Returns pickup games (Meetup) + courts/fields (Foursquare)
// Query: ?sport=pickleball|tennis|basketball|volleyball|soccer&lat=...&lon=...

const SPORT_MEETUP_QUERIES = {
  pickleball:  'pickleball Los Angeles',
  tennis:      'tennis pickup Los Angeles',
  basketball:  'basketball pickup Los Angeles',
  volleyball:  'volleyball beach Los Angeles',
  soccer:      'soccer pickup Los Angeles',
  running:     'running club Los Angeles',
  cycling:     'cycling group Los Angeles',
  yoga:        'outdoor yoga Los Angeles',
  all:         'sports pickup Los Angeles',
};

const SPORT_FSQ_CATEGORIES = {
  pickleball:  '18008',
  tennis:      '18008',
  basketball:  '19001',
  volleyball:  '18004',
  soccer:      '19011',
  all:         '18000',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const MEETUP_KEY = process.env.MEETUP_API_KEY;
  const FSQ_KEY = process.env.FOURSQUARE_API_KEY;
  const { sport = 'all', lat = '34.0522', lon = '-118.2437', radius = '10', limit = '12' } = req.query;
  const games = [], venues = [];

  if (FSQ_KEY) {
    try {
      const fsqCategory = SPORT_FSQ_CATEGORIES[sport] || SPORT_FSQ_CATEGORIES.all;
      const radiusMeters = Math.round(parseFloat(radius) * 1609);
      const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=${radiusMeters}&categories=${fsqCategory}&limit=8&fields=fsq_id,name,location,distance,hours,rating,photos,description`;
      const fsqRes = await fetch(url, { headers: { Authorization: FSQ_KEY, Accept: 'application/json' } });
      const fsqData = await fsqRes.json();
      for (const place of (fsqData.results || [])) {
        const distMi = place.distance ? (place.distance / 1609).toFixed(1) : '?';
        const isOpen = place.hours?.open_now ?? null;
        const photo = place.photos?.[0];
        venues.push({ id: `fsq_${place.fsq_id}`, source: 'foursquare', type: 'venue', name: place.name || '', address: [place.location?.address, place.location?.locality].filter(Boolean).join(', '), neighborhood: place.location?.locality || 'LA', distance: distMi, distanceLabel: `${distMi} mi`, sport, isOpen, rating: place.rating ? (place.rating / 2).toFixed(1) : null, photoUrl: photo ? `${photo.prefix}400x300${photo.suffix}` : null, description: place.description || '', lat: place.location?.lat || null, lng: place.location?.lng || null, tags: [{ cls: 'tag-free', label: 'Public' }, isOpen === true ? { cls: 'tag-free', label: 'Open now' } : null].filter(Boolean) });
      }
    } catch (err) { console.error('FSQ sports:', err.message); }
  }

  return res.status(200).json({ games, venues, sport, total: { games: games.length, venues: venues.length } });
}

function detectSport(text) {
  const t = text.toLowerCase();
  if (t.includes('pickleball')) return 'Pickleball';
  if (t.includes('tennis')) return 'Tennis';
  if (t.includes('basketball')) return 'Basketball';
  if (t.includes('volleyball')) return 'Volleyball';
  if (t.includes('soccer')) return 'Soccer';
  return 'Sport';
}

function getSportIcon(sport) {
  const map = { pickleball: 'fa-table-tennis-paddle-ball', tennis: 'fa-baseball', basketball: 'fa-basketball', volleyball: 'fa-volleyball', soccer: 'fa-futbol', running: 'fa-person-running', cycling: 'fa-bicycle', yoga: 'fa-spa', all: 'fa-dumbbell' };
  return map[sport] || 'fa-dumbbell';
}
