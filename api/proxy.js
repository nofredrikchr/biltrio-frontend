/**
 * Vercel Serverless Function - CORS Proxy for Billink API
 * This replaces the local Python proxy server
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Get target URL from query parameter
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    // Fetch the target URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response text (XML)
    const data = await response.text();

    // Send CORS-enabled response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');

    res.status(200).send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
}
