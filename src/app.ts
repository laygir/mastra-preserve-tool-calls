import compression from 'compression';
import express, { Application } from 'express';
import httpStatus from 'http-status';

import { errorConverter, errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';
import ApiError from './utils/ApiError.js';

const app: Application = express();

app.use(compression());

app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Resource not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
