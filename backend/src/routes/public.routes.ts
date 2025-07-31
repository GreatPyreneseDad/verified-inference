import { Router } from 'express';
import { useDefaultUser } from '../middleware/defaultUser';

const router = Router();

// Public endpoint to get current user info (testing mode)
router.get('/me', useDefaultUser, (req: any, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      testMode: true
    }
  });
});

export default router;