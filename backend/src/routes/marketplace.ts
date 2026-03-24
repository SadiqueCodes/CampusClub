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
    if (!payload.seller_phone || !/^\+91\d{10}$/.test(String(payload.seller_phone))) {
      return res.status(400).json({ error: 'Invalid seller phone. Use +91 followed by 10 digits.' });
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
      seller_phone: payload.seller_phone || null,
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

// Update listing status (owner only)
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const sellerId = (req as any).user.id;
    const status = String(req.body?.status || '').toLowerCase();
    if (!['active', 'reserved', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: existing, error: existingErr } = await supabaseServer
      .from('marketplace_items')
      .select('id, seller_id')
      .eq('id', listingId)
      .single();
    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ error: 'Listing not found' });
    if (existing.seller_id !== sellerId) return res.status(403).json({ error: 'Not allowed' });

    const { data, error } = await supabaseServer
      .from('marketplace_items')
      .update({ status })
      .eq('id', listingId)
      .select('*')
      .single();
    if (error) throw error;

    res.json({ data });
  } catch (err: any) {
    console.error('PATCH /api/marketplace/:id/status error', err.message || err);
    res.status(500).json({ error: 'Failed to update listing status' });
  }
});

// Delete listing (owner only)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const sellerId = (req as any).user.id;

    const { data: existing, error: existingErr } = await supabaseServer
      .from('marketplace_items')
      .select('id, seller_id')
      .eq('id', listingId)
      .single();
    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ error: 'Listing not found' });
    if (existing.seller_id !== sellerId) return res.status(403).json({ error: 'Not allowed' });

    const { error } = await supabaseServer
      .from('marketplace_items')
      .delete()
      .eq('id', listingId);
    if (error) throw error;

    res.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/marketplace/:id error', err.message || err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;
