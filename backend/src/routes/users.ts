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
      .select('college_id')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userCollegeId = userProfile.college_id;

    // Get all users from the same college
    const { data: collegeUsers, error: collegeError } = await supabaseServer
      .from('profiles')
      .select('id, name, college_name, major, year, semester, profile_photo')
      .eq('college_id', userCollegeId)
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
