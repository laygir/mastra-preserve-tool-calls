import { Request, Response } from 'express';
import httpStatus from 'http-status';

class HealthController {
  health = async (req: Request, res: Response) => {
    res.status(httpStatus.OK).send({ message: 'OK' });
  };
}

export default new HealthController();
