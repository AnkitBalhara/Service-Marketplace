import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If response already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handled AppError
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // 2. MongoDB Duplicate Key (E11000) -> 409 Conflict
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'resource';
    return sendError(
      res,
      409,
      'DUPLICATE_KEY_ERROR',
      `A record with this ${field} already exists.`,
      { field }
    );
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId) -> 400 Bad Request
  if (err.name === 'CastError') {
    return sendError(
      res,
      400,
      'INVALID_ID_FORMAT',
      `Invalid format for identifier: ${err.path}`,
      { path: err.path, value: err.value }
    );
  }

  // 4. Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Database validation failed', details);
  }

  // 5. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'The provided token is invalid');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'The provided token has expired');
  }

  // 6. Uncaught 500
  console.error('Unhandled Server Error:', err);
  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message || 'Internal server error'
  );
};
