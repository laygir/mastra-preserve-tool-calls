import pino from 'pino';
import pretty from 'pino-pretty';

import { config } from './config.js';

const logLevel = config.service.env === 'production' ? 'info' : 'debug';

// Production: Async transport (non-blocking, worker thread)
// Development: Sync stream (immediate output)
const logger =
  config.service.env === 'production'
    ? pino({
        level: logLevel,
        transport: {
          target: 'pino-pretty',
        },
      })
    : pino(
        pretty({
          colorize: true,
          hideObject: true, // Hide default object formatting since we handle it in messageFormat
          ignore: 'pid,hostname',
          messageFormat: (log, messageKey): string => {
            const message = String(log[messageKey]);
            const {
              hostname: _hostname,
              level: _level,
              [messageKey]: _msg,
              pid: _pid,
              time: _time,
              ...logCopy
            } = log;

            // If there are extra fields, show them as JSON
            const hasExtraFields = Object.keys(logCopy).length > 0;
            return hasExtraFields ? `${message}\n${JSON.stringify(logCopy, null, 2)}` : message;
          },
          sync: true, // Force synchronous operation in dev
          translateTime: 'yyyy-mm-dd HH:MM:ss:ms',
        }),
      );

export { logger };
