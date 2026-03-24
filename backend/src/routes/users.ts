import { Router } from 'express';
import supabaseServer from '../supabaseClient';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get users from same college (for inviting)
router.get('/same-college', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current user's college_id
    const { data: userProfile, error: userError } = await supabaseServer
      .from('profiles')
      .select('college_id, college_name')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userCollegeId = userProfile.college_id;
    let resolvedCollegeId = userCollegeId;
    if (!resolvedCollegeId && userProfile?.college_name) {
      const { data: collegeByName } = await supabaseServer
        .from('colleges')
        .select('id, name')
        .ilike('name', userProfile.college_name)
        .limit(1)
        .maybeSingle();
      if (collegeByName) {
        resolvedCollegeId = String((collegeByName as any).id);
        await supabaseServer
          .from('profiles')
          .update({
            college_id: resolvedCollegeId,
            college_name: (collegeByName as any).name || userProfile.college_name || null,
          })
          .eq('id', userId);
      }
    }

    if (!resolvedCollegeId) {
      return res.json({ data: [] });
    }

    // Get all users from the same college
    const { data: collegeUsers, error: collegeError } = await supabaseServer
      .from('profiles')
      .select('id, name, email, college_id, college_name, major, year, semester, profile_photo, interests, clubs_joined, clubs_leading, events_attended, rating, total_transactions')
      .eq('college_id', resolvedCollegeId)
      .neq('id', userId) // Exclude the current user
      .order('name', { ascending: true });

    if (collegeError) throw collegeError;

    res.json({ data: collegeUsers });
  } catch (err: any) {
    console.error('GET /api/users/same-college error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch college users' });
  }
});

export default router;
