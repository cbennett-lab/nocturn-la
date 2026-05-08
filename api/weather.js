// api/weather.js
// Returns current weather + tonight's forecast for Los Angeles
// Uses: OpenWeatherMap One Call API (free tier)
// Cache: 5 minutes (set in vercel.json headers)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.OPENWEATHER_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'OPENWEATHER_API_KEY not configured' });
  }

  const LAT = 34.0522;
  const LON = -118.2437;

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=imperial`
    );
    const current = await currentRes.json();
    const sunsetUTC = current.sys.sunset;
    const sunsetDate = new Date(sunsetUTC * 1000);
    const sunsetFormatted = sunsetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }).toLowerCase().replace(':00', '').replace(' ', '');
    const iconMap = { '01d': 'fa-sun', '01n': 'fa-moon', '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon', '03d': 'fa-cloud', '03n': 'fa-cloud', '04d': 'fa-clouds', '04n': 'fa-clouds', '09d': 'fa-cloud-drizzle', '09n': 'fa-cloud-drizzle', '10d': 'fa-cloud-rain', '10n': 'fa-cloud-rain', '11d': 'fa-cloud-bolt', '11n': 'fa-cloud-bolt', '13d': 'fa-snowflake', '13n': 'fa-snowflake', '50d': 'fa-smog', '50n': 'fa-smog' };
    const faIcon = iconMap[current.weather[0].icon] || 'fa-sun';
    return res.status(200).json({ temp: Math.round(current.main.temp), feelsLike: Math.round(current.main.feels_like), desc: current.weather[0].description.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), icon: faIcon, humidity: current.main.humidity + '%', wind: Math.round(current.wind.speed) + ' mph', uv: '—', sunset: sunsetFormatted, condition: current.weather[0].main });
  } catch (err) { return res.status(500).json({ error: 'Failed to fetch weather' }); }
}
