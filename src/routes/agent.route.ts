import express from 'express';

import { AgentController } from '../controllers/agent.controller.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

const agentController = new AgentController();

router.post('/', catchAsync(agentController.stream));

export default router;
