import express, { Router } from 'express';

import agentRoute from './agent.route.js';
import healthRoute from './health.route.js';

const router = express.Router();

const apiVersion = '/v1';

interface Route {
  path: string;
  route: Router;
}

const defaultRoutes: Route[] = [
  {
    path: `${apiVersion}/agent`,
    route: agentRoute,
  },
  {
    path: `${apiVersion}/health`,
    route: healthRoute,
  },
];

for (const route of defaultRoutes) {
  router.use(route.path, route.route);
}

export default router;
