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

    const authUser = (req as any).user;
    const leaderId = authUser?.id || payload.leader_id || null;
    
    // Fetch leader's college info
    let collegeId = null;
    let collegeName = null;
    
    if (leaderId) {
      const { data: profileData, error: profileError } = await supabaseServer
        .from('profiles')
        .select('college_id, college_name')
        .eq('id', leaderId)
        .single();
      
      if (profileData) {
        collegeId = profileData.college_id;
        collegeName = profileData.college_name;
      }
    }

    // Fallback to auth metadata from signup/sign-in payload if profile row is incomplete.
    if (!collegeId && authUser?.user_metadata?.college_id) {
      collegeId = String(authUser.user_metadata.college_id).trim();
    }
    if (!collegeName && authUser?.user_metadata?.college_name) {
      collegeName = String(authUser.user_metadata.college_name).trim();
    }

    // Fallback to payload if profile has not been fully populated yet
    if (!collegeId && payload.college_id) {
      collegeId = String(payload.college_id).trim();
    }
    if (!collegeName && payload.college_name) {
      collegeName = String(payload.college_name).trim();
    }

    // If college_id is still missing but we have a college name,
    // resolve it from the colleges table and backfill the profile.
    if (!collegeId && collegeName) {
      let collegeByName: any = null;
      const { data: exactCollegeByName } = await supabaseServer
        .from('colleges')
        .select('id, name')
        .ilike('name', collegeName)
        .limit(1)
        .maybeSingle();
      if (exactCollegeByName) {
        collegeByName = exactCollegeByName;
      } else {
        const { data: fuzzyCollegeByName } = await supabaseServer
          .from('colleges')
          .select('id, name')
          .ilike('name', `%${collegeName}%`)
          .limit(1)
          .maybeSingle();
        if (fuzzyCollegeByName) {
          collegeByName = fuzzyCollegeByName;
        }
      }
      if (collegeByName) {
        collegeId = String((collegeByName as any).id);
        collegeName = String((collegeByName as any).name || collegeName).trim();
      }
    }

    if (leaderId && collegeId) {
      await supabaseServer
        .from('profiles')
        .upsert({ id: leaderId, college_id: collegeId, college_name: collegeName || null });
    }

    if (!collegeId) {
      return res.status(400).json({
        error: 'Missing college_id for club creation. Please complete signup college selection.',
      });
    }

    const { data, error } = await supabaseServer.from('clubs').insert([
      {
        name: payload.name,
        type: payload.type,
        description: payload.description || null,
        leader_id: leaderId,
        leader_name: payload.leader_name || authUser?.user_metadata?.name || authUser?.email || null,
        college_id: collegeId,
        college_name: collegeName,
        member_ids: leaderId ? [leaderId] : [],
        member_count: leaderId ? 1 : 0,
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

// Leave a club (authenticated user can remove self).
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: club, error: clubErr } = await supabaseServer
      .from('clubs')
      .select('id, leader_id, member_ids, member_count, group_chat_id')
      .eq('id', clubId)
      .single();
    if (clubErr || !club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const currentMembers: string[] = Array.isArray((club as any).member_ids) ? (club as any).member_ids : [];
    if (!currentMembers.includes(userId)) {
      return res.json({ data: club, message: 'User already not in club' });
    }

    if ((club as any).leader_id === userId && currentMembers.length > 1) {
      return res.status(400).json({ error: 'Leader must transfer leadership before leaving' });
    }

    const nextMembers = currentMembers.filter((id) => id !== userId);
    const nextCount = nextMembers.length;

    const { data: updatedClub, error: updateErr } = await supabaseServer
      .from('clubs')
      .update({ member_ids: nextMembers, member_count: nextCount })
      .eq('id', clubId)
      .select('*')
      .single();
    if (updateErr) throw updateErr;

    // Keep chat participants in sync with club membership.
    if ((club as any).group_chat_id) {
      await supabaseServer
        .from('chats')
        .update({ participant_ids: nextMembers })
        .eq('id', (club as any).group_chat_id);
    }

    // Best-effort profile arrays cleanup.
    try {
      const { data: profile } = await supabaseServer
        .from('profiles')
        .select('clubs_joined, clubs_leading')
        .eq('id', userId)
        .single();
      const joined = Array.isArray((profile as any)?.clubs_joined)
        ? (profile as any).clubs_joined.filter((id: string) => id !== clubId)
        : [];
      const leading = Array.isArray((profile as any)?.clubs_leading)
        ? (profile as any).clubs_leading.filter((id: string) => id !== clubId)
        : [];
      await supabaseServer
        .from('profiles')
        .update({ clubs_joined: joined, clubs_leading: leading })
        .eq('id', userId);
    } catch (e) {
      // non-blocking
    }

    res.json({ data: updatedClub });
  } catch (err: any) {
    console.error('POST /api/clubs/:id/leave error', err.message || err);
    res.status(500).json({ error: 'Failed to leave club' });
  }
});

export default router;
