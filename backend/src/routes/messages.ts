import { Router, Request, Response } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Create a new message in a chat
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { chat_id, text } = req.body;

    if (!chat_id || !text) {
      return res.status(400).json({ error: 'chat_id and text are required' });
    }

    const messageRow = {
      chat_id,
      sender_id: user.id,
      sender_name: user.user_metadata?.name || user.email || 'Member',
      text,
      timestamp: new Date(),
    };

    const { data: created, error: insertErr } = await supabaseServer.from('messages').insert([messageRow]).select().single();
    if (insertErr) throw insertErr;

    // Update chat's last message and last message time
    const { data: chatUpdate, error: chatErr } = await supabaseServer
      .from('chats')
      .update({ last_message: created, last_message_time: created.timestamp })
      .eq('id', chat_id);
    if (chatErr) console.warn('Failed to update chat last_message', chatErr);

    return res.status(201).json({ data: created });
  } catch (err: any) {
    console.error('POST /api/messages error', err.message || err);
    return res.status(500).json({ error: 'Failed to create message' });
  }
});

// Optional: get messages for a chat (protected)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const chatId = req.query.chatId as string;
    if (!chatId) return res.status(400).json({ error: 'chatId query param required' });

    const { data, error } = await supabaseServer.from('messages').select('*').eq('chat_id', chatId).order('timestamp', { ascending: true });
    if (error) throw error;
    return res.json({ data });
  } catch (err: any) {
    console.error('GET /api/messages error', err.message || err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
