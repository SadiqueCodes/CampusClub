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
    return next();
  } catch (err: any) {
    console.error('Auth middleware error', err.message || err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
