export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(code = 'BAD_REQUEST', message = 'Bad request', details?: any) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Authentication required', details?: any) {
    super(401, code, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'You do not have permission to perform this action', details?: any) {
    super(403, code, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', message = 'Resource not found', details?: any) {
    super(404, code, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(code = 'CONFLICT', message = 'Resource conflict', details?: any) {
    super(409, code, message, details);
  }
}

export class UnprocessableError extends AppError {
  constructor(code = 'UNPROCESSABLE_ENTITY', message = 'Invalid state transition or unprocessable entity', details?: any) {
    super(422, code, message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(code = 'INTERNAL_ERROR', message = 'Internal server error', details?: any) {
    super(500, code, message, details);
  }
}
