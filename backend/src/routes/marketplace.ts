import { Router, Request, Response } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// List marketplace items
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const lim = Math.max(1, Math.min(100, Number(limit)));
    const from = (pageNum - 1) * lim;
    const to = from + lim - 1;

    const { data, error } = await supabaseServer
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error('GET /api/marketplace error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch marketplace items' });
  }
});

// Create listing (authenticated)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || typeof payload.price === 'undefined') {
      return res.status(400).json({ error: 'Missing title or price' });
    }

    const sellerId = (req as any).user.id;

    // Fetch seller's college info
    const { data: profileData } = await supabaseServer
      .from('profiles')
      .select('college_id, college_name')
      .eq('id', sellerId)
      .single();

    const insertRow = {
      title: payload.title,
      description: payload.description || null,
      price: payload.price,
      images: payload.images || [],
      seller_id: sellerId,
      seller_name: payload.seller_name || null,
      seller_major: payload.seller_major || null,
      seller_year: payload.seller_year || null,
      seller_college_name: profileData?.college_name || null,
      seller_rating: payload.seller_rating || null,
      college_id: profileData?.college_id || null,
      college_name: profileData?.college_name || null,
      status: 'active',
      created_at: new Date(),
    };

    const { data, error } = await supabaseServer.from('marketplace_items').insert([insertRow]).select().single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    console.error('POST /api/marketplace error', err.message || err);
    res.status(500).json({ error: 'Failed to create marketplace item' });
  }
});

export default router;
