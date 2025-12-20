import { Router } from 'express';
import supabaseServer from '../supabaseClient';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseServer
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error('GET /api/events error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.club_id || !payload.date) {
      return res.status(400).json({ error: 'Missing title, club_id or date' });
    }

    const { data, error } = await supabaseServer.from('events').insert([
      {
        title: payload.title,
        description: payload.description || null,
        club_id: payload.club_id,
        club_name: payload.club_name || null,
        date: payload.date,
        time: payload.time || null,
        location: payload.location || null,
        created_by: payload.created_by || null,
        created_at: new Date(),
      },
    ]).select().single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    console.error('POST /api/events error', err.message || err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;
