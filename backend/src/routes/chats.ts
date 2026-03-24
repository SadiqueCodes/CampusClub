import { Router, Request, Response } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get chats for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Use array contains to find chats where participant_ids includes userId
    const { data, error } = await supabaseServer
      .from('chats')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_time', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error('GET /api/chats error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create a chat (group or direct)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const userId = (req as any).user.id;

    if (!payload.participant_ids || !Array.isArray(payload.participant_ids)) {
      return res.status(400).json({ error: 'participant_ids array required' });
    }

    // ensure creator is included
    if (!payload.participant_ids.includes(userId)) {
      payload.participant_ids.push(userId);
    }

    const insertRow = {
      type: payload.type || (payload.club_id ? 'group' : 'direct'),
      name: payload.name || null,
      participant_ids: payload.participant_ids,
      last_message: null,
      last_message_time: null,
      unread_count: 0,
      club_id: payload.club_id || null,
      marketplace_item_id: payload.marketplace_item_id || null,
      avatar_emoji: payload.avatar_emoji || null,
      avatar_image: payload.avatar_image || null,
      created_at: new Date(),
    };

    const { data, error } = await supabaseServer.from('chats').insert([insertRow]).select().single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    console.error('POST /api/chats error', err.message || err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

export default router;
