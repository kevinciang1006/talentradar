import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request<unknown, unknown, unknown, unknown>, res: Response, next: NextFunction) => Promise<unknown>;

const asyncHandler = <P = unknown, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown>(
  fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
