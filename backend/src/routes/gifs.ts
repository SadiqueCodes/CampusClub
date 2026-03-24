import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

const DEFAULT_TENOR_KEY = process.env.TENOR_API_KEY || 'LIVDSRZULELA';
const CLIENT_KEY = process.env.TENOR_CLIENT_KEY || 'campusclub_chat';

router.get('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.max(1, Math.min(40, Number(req.query.limit || 24)));
    const endpoint = q
      ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${encodeURIComponent(DEFAULT_TENOR_KEY)}&client_key=${encodeURIComponent(CLIENT_KEY)}&limit=${limit}&media_filter=gif`
      : `https://tenor.googleapis.com/v2/featured?key=${encodeURIComponent(DEFAULT_TENOR_KEY)}&client_key=${encodeURIComponent(CLIENT_KEY)}&limit=${Math.min(limit, 12)}&media_filter=gif`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      const body = await response.text();
      return res.status(502).json({ error: `Tenor request failed: ${response.status}`, details: body });
    }
    const json: any = await response.json();
    const urls: string[] = (json?.results || [])
      .map((r: any) => r?.media_formats?.gif?.url || r?.media_formats?.tinygif?.url)
      .filter((u: any) => typeof u === 'string');

    return res.json({ data: urls });
  } catch (err: any) {
    console.error('GET /api/gifs/search error', err.message || err);
    return res.status(500).json({ error: 'Failed to search GIFs' });
  }
});

export default router;

