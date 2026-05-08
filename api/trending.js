// api/trending.js - Reddit r/LosAngeles (no key needed)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { limit = '10' } = req.query;
  try {
    const allPosts = [];
    const searches = ['hidden gem', 'best spot', 'underrated', 'must visit'];
    for (const sub of ['LosAngeles','AskLosAngeles']) {
      try {
        const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&t=week`, { headers: { 'User-Agent': 'NocturnLA/1.0', Accept: 'application/json' } });
        const d = await r.json();
        for (const post of (d?.data?.children || [])) {
          const p = post.data; if (p.score < 20) continue;
          if (!searches.some(s => p.title.toLowerCase().includes(s)) && !p.title.toLowerCase().includes('recommend')) continue;
          allPosts.push({ id: `reddit_${p.id}`, source: 'reddit', title: p.title, description: (p.selftext || '').substring(0,200), url: `https://reddit.com${p.permalink}`, score: p.score, comments: p.num_comments, flair: p.link_flair_text, trending: p.score > 500 });
        }
      } catch(e) {}
    }
    allPosts.sort((a,b) => b.score-a.score);
    const curated = [{ id:'c1', source:'curated', title:'The unmarked bar on Spring St', description:'Speakeasy-style mezcal bar in the back of Spring St Smokehouse. No sign, just a door.', platform:'TikTok', views:'1.2M views', score:999, trending:true, flair:'Bars' }, { id:'c2', source:'curated', title:'Echo Park bat colony at dusk', description:'250,000 bats under the 6th Street Bridge every night. Free.', platform:'Instagram', views:'840K views', score:888, trending:true, flair:'Nature' }];
    return res.status(200).json({ trending: [...curated, ...allPosts].slice(0, parseInt(limit)) });
  } catch (err) { return res.status(500).json({ error: 'Failed' }); }
}
