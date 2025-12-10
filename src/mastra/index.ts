import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Response } from 'express';

import { logger } from '../config/logger.js';
import { weatherAgent } from './agents/weather-agent';

export const mastra = new Mastra({
  agents: { weatherAgent },
  logger: new PinoLogger({
    level: 'info',
    name: 'Mastra',
  }),
});

export const stream = async (params: { messages: [] }) => {
  try {
    const { messages } = params;

    const agent = mastra.getAgentById('weather-agent-id');

    logger.info('Will stream');

    const stream = await agent.stream(messages, {
      onStepFinish: ({ finishReason, toolCalls, toolResults }) => {
        for (const toolCall of toolCalls) {
          logger.info(`Tool Call: ${toolCall.payload.toolName}`);
        }

        for (const toolResult of toolResults) {
          logger.info(`Tool Result: ${toolResult.payload.toolName}`);
          logger.info({ toolResult: toolResult.payload.result }, 'Tool Result:');
        }

        logger.info(`=== onStepFinish === [End of ${finishReason}]`);
      },

      providerOptions: {
        openai: {
          store: false,
        },
      },
    });

    logger.info('Stream object created successfully');
    return stream;
  } catch (error) {
    logger.error(
      {
        error,
        errorMessage: (error as Error)?.message,
        errorName: (error as Error)?.name,
        stack: (error as Error)?.stack,
      },
      'Error during stream',
    );

    // Re-throw to be caught by controller
    throw error;
  }
};

export const consumeStream = async (
  streamResult: Awaited<ReturnType<typeof stream>>,
  res: Response,
) => {
  try {
    logger.info('Will consume stream');

    // Stream the response chunks back to the client
    for await (const chunk of streamResult.fullStream) {
      switch (chunk.type) {
        case 'finish':
          logger.info({ requestBody: chunk?.payload?.metadata?.request?.body }, 'final chunk');
          res.write(`event: message\ndata: ${JSON.stringify(chunk)}\n\n`);
          break;

        case 'text-delta':
          process.stdout.write(chunk.payload.text);
          res.write(`event: message\ndata: ${JSON.stringify(chunk)}\n\n`);
          break;

        default:
          res.write(`event: message\ndata: ${JSON.stringify(chunk)}\n\n`);
          break;
      }

      // Force flush to ensure immediate delivery
      if (res.flush) res.flush();
    }

    // Send completion message and end the response
    res.write('data: [DONE]\n\n');
    if (res.flush) res.flush();
    res.end();

    // Get full text after streaming
    const fullText = await streamResult.text;
    logger.info({ fullText }, 'Did consume stream');
  } catch (error) {
    logger.error(
      {
        error,
        errorMessage: (error as Error)?.message,
        errorName: (error as Error)?.name,
        stack: (error as Error)?.stack,
      },
      'Error consuming stream',
    );

    throw error;
  }
};

export const setupSSEHeaders = (res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (res.flushHeaders) {
    res.flushHeaders();
  }
};
