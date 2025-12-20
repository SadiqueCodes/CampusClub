import { Request, Response, NextFunction } from 'express';
import supabaseServer from '../supabaseClient';

export const requireLeader = (clubIdField = 'clubId') => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // clubId can be in params, body, or query depending on route
    const clubId = (req.params?.id) || req.body[clubIdField] || req.query[clubIdField];
    if (!clubId) return res.status(400).json({ error: 'Missing club id' });

    const { data: club, error } = await supabaseServer.from('clubs').select('id, leader_id').eq('id', clubId).single();
    if (error) throw error;

    if (!club) return res.status(404).json({ error: 'Club not found' });

    if (club.leader_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden: requires club leader role' });
    }

    return next();
  } catch (err: any) {
    console.error('requireLeader error', err.message || err);
    return res.status(500).json({ error: 'Failed to validate leader role' });
  }
};
