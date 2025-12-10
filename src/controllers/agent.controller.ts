import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { logger } from '../config/logger.js';
import { consumeStream, stream } from '../mastra/index.js';
import { setupSSEHeaders } from '../mastra/index.js';

interface StreamParams {
  messages: [];
  model?: string;
  tools?: [];
}

export class AgentController {
  stream = async (req: Request, res: Response) => {
    try {
      logger.info({ requestBody: req.body }, 'AgentController: Starting stream');

      setupSSEHeaders(res);

      const params: StreamParams = {
        messages: req.body?.messages ?? [],
        model: req.body?.model,
        tools: req.body.tools,
      };

      const streamResult = await stream(params);

      await consumeStream(streamResult, res);
    } catch (error) {
      logger.error(
        {
          error,
          errorMessage: (error as Error)?.message,
          errorName: (error as Error)?.name,
          stack: (error as Error)?.stack,
        },
        'Error in stream controller:',
      );

      // Check if we can still send a response
      if (res.writableEnded || res.destroyed) {
        logger.warn('Response already ended, cannot send error response');
        return;
      }

      // Send appropriate error response based on stream state
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.end();
      } else {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Internal server error during streaming',
        });
      }
    }
  };
}
