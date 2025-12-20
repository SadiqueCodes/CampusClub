import { Router, Request, Response } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// List join requests for a club (if leader) or for the user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { club_id } = req.query;

    if (club_id) {
      // If club_id passed, return requests for that club (in production verify user is leader)
      const { data, error } = await supabaseServer.from('join_requests').select('*').eq('club_id', club_id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ data });
    }

    // Else return requests for the current user
    const { data, error } = await supabaseServer.from('join_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error('GET /api/join-requests error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch join requests' });
  }
});

// Create a join request (authenticated user)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const userId = (req as any).user.id;

    if (!payload.club_id) {
      return res.status(400).json({ error: 'club_id required' });
    }

    const insertRow = {
      club_id: payload.club_id,
      user_id: userId,
      user_name: payload.user_name || null,
      user_photo: payload.user_photo || null,
      initiated_by: 'user',
      status: 'pending',
      created_at: new Date(),
    };

    const { data, error } = await supabaseServer.from('join_requests').insert([insertRow]).select().single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    console.error('POST /api/join-requests error', err.message || err);
    res.status(500).json({ error: 'Failed to create join request' });
  }
});

export default router;
