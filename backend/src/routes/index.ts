import { Router } from 'express';
import authRoutes from './auth.routes';
import queryRoutes from './query.routes';
import inferenceRoutes from './inference.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/queries', queryRoutes);
router.use('/inferences', inferenceRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;