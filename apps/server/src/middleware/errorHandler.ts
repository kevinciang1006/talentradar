import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import { config } from '../config/env';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: unknown = undefined;

  // Handle custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }
  // Handle Mongoose ValidationError
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }
  // Handle Mongoose CastError (invalid ObjectId)
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  }
  // Handle Mongoose duplicate key error
  else if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    const mongoError = err as MongooseError & { keyPattern?: Record<string, number> };
    const field = mongoError.keyPattern ? Object.keys(mongoError.keyPattern)[0] : 'field';
    message = `Duplicate entry for ${field}`;
  }
  // Handle JWT errors
  else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid or expired token';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      ...(config.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(errorResponse);
};
