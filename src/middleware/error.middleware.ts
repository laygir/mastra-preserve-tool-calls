import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

import { config } from '../config/config.js';
import { logger } from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

const errorConverter = (err: ApiError | Error, req: Request, res: Response, next: NextFunction) => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else {
    const statusCode = httpStatus.INTERNAL_SERVER_ERROR;

    const message = err.message || httpStatus[statusCode];

    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

const errorHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  let { message, statusCode } = err;

  if (config?.service?.env === 'production' && !err?.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config?.service?.env === 'local' && { stack: err.stack }),
  };

  // Log all errors in development
  if (config?.service?.env === 'local') {
    logger.error(
      {
        message: err.message,
        method: req.method,
        stack: err.stack,
        statusCode,
        url: req.url,
      },
      'ErrorHandler:',
    );
  } else {
    // In production, log with appropriate levels
    const errorContext = {
      message: err.message,
      method: req.method,
      statusCode,
      url: req.url,
      ...(statusCode >= 500 && { stack: err.stack }), // Include stack for server errors
    };

    if (statusCode >= 500) {
      // Server errors - critical
      logger.error({ errorContext }, 'ErrorHandler [SERVER ERROR]:');
    } else if (statusCode >= 400) {
      // Client errors - warning level
      logger.warn({ errorContext }, 'ErrorHandler [CLIENT ERROR]:');
    } else {
      // Other errors - info level
      logger.info({ errorContext }, 'ErrorHandler [OTHER ERROR]:');
    }
  }

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
