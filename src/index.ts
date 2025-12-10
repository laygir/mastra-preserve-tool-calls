import { Server } from 'node:http';

import app from './app.js';
import { config } from './config/config.js';
import { logger } from './config/logger.js';

let server: Server;

const startServer = () => {
  const port = config.service.port;

  server = app.listen(port, async () => {
    logger.info(`🚀 Server is running on port ${port}`);
    logger.info(`🔗 API endpoints: http://localhost:${port}`);
    logger.info(`📊 Health check: http://localhost:${port}/v1/health`);
  });
};

startServer();

// Graceful shutdown handler
const shutdownHandler = () => {
  try {
    if (server) {
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(1);
    }
  } catch (error) {
    logger.error({ error }, 'Error stopping server:');
    process.exit(1);
  }
};

// Unexpected error handler
const unexpectedErrorHandler = (error: Error) => {
  logger.error(
    { message: error.message, name: error.name, stack: error.stack },
    'Critical unexpected error - shutting down',
  );

  shutdownHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', shutdownHandler);
process.on('SIGINT', shutdownHandler);
