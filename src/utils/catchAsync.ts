import { NextFunction, Request, Response } from 'express';

type AsyncFunctionHandler = (_req: Request, _res: Response, _next: NextFunction) => Promise<void>;

const catchAsync =
  (fn: AsyncFunctionHandler) =>
  async (_req: Request, _res: Response, _next: NextFunction): Promise<void> => {
    try {
      await Promise.resolve(fn(_req, _res, _next));
      return;
    } catch (err) {
      _next(err);
    }
  };

export default catchAsync;
