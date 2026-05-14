export default function handler(req, res) {
  // Vercel sets this header automatically based on the edge network location
  const country = req.headers['x-vercel-ip-country'] || 'HU';
  
  // Set cache headers to avoid frequent hits but allow changes if needed
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  
  res.status(200).json({ country });
}
