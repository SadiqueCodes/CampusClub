import { Request, Response, NextFunction } from 'express';
import supabaseServer from '../supabaseClient';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabaseServer.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request for downstream handlers
    req.user = data.user;

    // Ensure a profile row exists for every authenticated user.
    // This prevents downstream FK errors (e.g. clubs.leader_id -> profiles.id).
    try {
      const metadataCollegeId = data.user.user_metadata?.college_id
        ? String(data.user.user_metadata.college_id).trim()
        : null;
      const metadataCollegeName = data.user.user_metadata?.college_name
        ? String(data.user.user_metadata.college_name).trim()
        : null;

      await supabaseServer.from('profiles').upsert({
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email || 'Student',
        email: data.user.email || '',
        college_id: metadataCollegeId,
        college_name: metadataCollegeName,
      });
    } catch (profileErr: any) {
      console.warn('requireAuth: failed to upsert profile', profileErr?.message || profileErr);
    }

    return next();
  } catch (err: any) {
    console.error('Auth middleware error', err.message || err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
