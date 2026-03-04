import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationSource = 'body' | 'query' | 'params';

// Extend Express Request type to include validated data
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
      validatedBody?: any;
      validatedParams?: any;
    }
  }
}

export const validate = (schema: ZodSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      // Format Zod errors into readable messages
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errors,
        },
      });
      return;
    }

    // Store validated/transformed data
    if (source === 'body') {
      req.body = result.data;
      req.validatedBody = result.data;
    } else if (source === 'query') {
      req.validatedQuery = result.data;
    } else if (source === 'params') {
      req.validatedParams = result.data;
    }

    next();
  };
};
