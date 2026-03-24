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

// Respond to a join request/invite.
// - Leader can accept/reject user-initiated applications.
// - Invited user can accept/reject leader-initiated invites.
router.post('/:id/respond', requireAuth, async (req: Request, res: Response) => {
  try {
    const requestId = req.params.id;
    const userId = (req as any).user.id;
    const decision = req.body?.decision;

    if (decision !== 'accepted' && decision !== 'rejected') {
      return res.status(400).json({ error: 'decision must be accepted or rejected' });
    }

    const { data: requestRow, error: reqErr } = await supabaseServer
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (reqErr || !requestRow) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    const { data: clubRow, error: clubErr } = await supabaseServer
      .from('clubs')
      .select('id, leader_id, member_ids, member_count, group_chat_id')
      .eq('id', (requestRow as any).club_id)
      .single();
    if (clubErr || !clubRow) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const initiatedBy = (requestRow as any).initiated_by;
    const isLeaderReview = initiatedBy === 'user' && userId === (clubRow as any).leader_id;
    const isInviteeReview = initiatedBy === 'leader' && userId === (requestRow as any).user_id;
    if (!isLeaderReview && !isInviteeReview) {
      return res.status(403).json({ error: 'Not allowed to respond to this request' });
    }

    const respondedAt = new Date().toISOString();
    const { data: updatedRequest, error: updateReqErr } = await supabaseServer
      .from('join_requests')
      .update({ status: decision, responded_at: respondedAt })
      .eq('id', requestId)
      .select('*')
      .single();
    if (updateReqErr) throw updateReqErr;

    let updatedClub = clubRow;
    if (decision === 'accepted') {
      const currentMembers: string[] = Array.isArray((clubRow as any).member_ids) ? (clubRow as any).member_ids : [];
      const requestUserId = (requestRow as any).user_id as string;
      const nextMembers = currentMembers.includes(requestUserId)
        ? currentMembers
        : [...currentMembers, requestUserId];
      const nextCount = nextMembers.length;

      const { data: clubAfterUpdate, error: clubUpdateErr } = await supabaseServer
        .from('clubs')
        .update({ member_ids: nextMembers, member_count: nextCount })
        .eq('id', (clubRow as any).id)
        .select('*')
        .single();
      if (clubUpdateErr) throw clubUpdateErr;
      updatedClub = clubAfterUpdate;

      if ((clubRow as any).group_chat_id) {
        await supabaseServer
          .from('chats')
          .update({ participant_ids: nextMembers })
          .eq('id', (clubRow as any).group_chat_id);
      }
    }

    res.json({ data: { request: updatedRequest, club: updatedClub } });
  } catch (err: any) {
    console.error('POST /api/join-requests/:id/respond error', err.message || err);
    res.status(500).json({ error: 'Failed to respond to join request' });
  }
});

export default router;
