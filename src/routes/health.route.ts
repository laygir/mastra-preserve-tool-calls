import express from 'express';

import healthController from '../controllers/health.controller.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

router.get('/', catchAsync(healthController.health));

export default router;
