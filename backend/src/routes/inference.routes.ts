import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  verifyInference,
  getUnverifiedInferences,
  getInferenceStats,
} from '../controllers/inference.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { useDefaultUser } from '../middleware/defaultUser';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// TESTING MODE: Use default user instead of authentication
const authMiddleware = useDefaultUser; // Change back to 'authenticate' for production

router.patch(
  '/:id/verify',
  authMiddleware,
  [
    body('selectedInference')
      .isIn(['A', 'B', 'C', 'custom'])
      .withMessage('Selected inference must be A, B, C, or custom'),
    body('customInference')
      .if(body('selectedInference').equals('custom'))
      .notEmpty()
      .isLength({ max: 1000 })
      .withMessage('Custom inference required when selected'),
    body('correct')
      .isBoolean()
      .withMessage('Correct must be boolean'),
    body('rationale')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Rationale must be 10-2000 characters'),
    body('confidenceScore')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Confidence score must be between 0 and 1'),
  ],
  handleValidationErrors,
  verifyInference
);

router.get(
  '/unverified',
  authMiddleware,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],
  handleValidationErrors,
  getUnverifiedInferences
);

router.get('/stats', getInferenceStats);

export default router;