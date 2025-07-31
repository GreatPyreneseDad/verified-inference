import { Router } from 'express';
import authRoutes from './auth.routes';
import queryRoutes from './query.routes';
import inferenceRoutes from './inference.routes';
import publicRoutes from './public.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/queries', queryRoutes);
router.use('/inferences', inferenceRoutes);
router.use('/public', publicRoutes);

// Health check
router.get('/health', (_req: any, res: any) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;