import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createQuery,
  getQueries,
  getQuery,
} from '../controllers/query.controller';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('topic')
      .isLength({ min: 5, max: 500 })
      .withMessage('Topic must be 5-500 characters'),
    body('context')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Context must be 10-5000 characters'),
    body('dataType')
      .isIn(['1st-party', '3rd-party'])
      .withMessage('Data type must be 1st-party or 3rd-party'),
    body('sourceLink')
      .optional()
      .isURL()
      .withMessage('Source link must be a valid URL'),
  ],
  handleValidationErrors,
  createQuery
);

router.get(
  '/',
  authenticate,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  getQueries
);

router.get('/:id', authenticate, getQuery);

export default router;