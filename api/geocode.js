// api/geocode.js - Reverse geocode with fallback
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  const nbs = [{ name:'Silver Lake', minLat:34.07,maxLat:34.10,minLon:-118.28,maxLon:-118.24 },{ name:'Echo Park', minLat:34.07,maxLat:34.09,minLon:-118.27,maxLon:-118.24 },{ name:'Los Feliz', minLat:34.10,maxLat:34.13,minLon:-118.29,maxLon:-118.24 },{ name:'Downtown LA', minLat:34.03,maxLat:34.06,minLon:-118.27,maxLon:-118.22 },{ name:'Hollywood', minLat:34.08,maxLat:34.12,minLon:-118.35,maxLon:-118.29 },{ name:'Venice', minLat:33.99,maxLat:34.01,minLon:-118.48,maxLon:-118.44 },{ name:'Santa Monica', minLat:34.00,maxLat:34.03,minLon:-118.52,maxLon:-118.47 }];
  const f = parseFloat(lat), g2 = parseFloat(lon);
  const found = nbs.find(n => f >= n.minLat && f <= n.maxLat && g2 >= n.minLon && g2 <= n.maxLon);
  const neighborhood = found?.name || 'Los Angeles';
  return res.status(200).json({ neighborhood, city: 'Los Angeles', formatted: `${neighborhood}, Los Angeles` });
}
