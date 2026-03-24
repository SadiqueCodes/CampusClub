import { Router } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';

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

router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.club_id || !payload.date) {
      return res.status(400).json({ error: 'Missing title, club_id or date' });
    }

    const createdBy = (req as any).user?.id || payload.created_by || null;
    
    // Use provided college info when available to avoid extra DB round-trip.
    let collegeId = payload.college_id || null;
    let collegeName = payload.college_name || null;
    
    if ((!collegeId || !collegeName) && createdBy) {
      const { data: profileData } = await supabaseServer
        .from('profiles')
        .select('college_id, college_name')
        .eq('id', createdBy)
        .single();
      
      if (profileData) {
        collegeId = profileData.college_id;
        collegeName = profileData.college_name;
      }
    }

    const { data, error } = await supabaseServer.from('events').insert([
      {
        title: payload.title,
        description: payload.description || null,
        club_id: payload.club_id,
        club_name: payload.club_name || null,
        college_id: collegeId,
        college_name: collegeName,
        date: payload.date,
        time: payload.time || null,
        location: payload.location || null,
        banner_image: payload.banner_image || null,
        created_by: createdBy,
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
