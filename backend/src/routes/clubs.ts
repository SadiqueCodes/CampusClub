import { Router } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';
import { requireLeader } from '../middleware/requireLeader';

const router = Router();

// List public clubs (paginated)
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const lim = Math.max(1, Math.min(100, Number(limit)));

    const from = (pageNum - 1) * lim;
    const to = from + lim - 1;

    const { data, error } = await supabaseServer
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error('GET /api/clubs error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// Create a club. If authenticated, set leader_id to the authenticated user.
router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    // Minimal validation
    if (!payload.name || !payload.type) {
      return res.status(400).json({ error: 'Missing name or type' });
    }

    const leaderId = (req as any).user?.id || payload.leader_id || null;
    const { data, error } = await supabaseServer.from('clubs').insert([
      {
        name: payload.name,
        type: payload.type,
        description: payload.description || null,
        leader_id: leaderId,
        created_at: new Date(),
      },
    ]).select().single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    console.error('POST /api/clubs error', err.message || err);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

// Update a club (only leader)
router.put('/:id', requireAuth, requireLeader(), async (req, res) => {
  try {
    const updates = req.body;
    const clubId = req.params.id;
    const { data, error } = await supabaseServer.from('clubs').update(updates).eq('id', clubId).select().single();
    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error('PUT /api/clubs/:id error', err.message || err);
    res.status(500).json({ error: 'Failed to update club' });
  }
});

export default router;
