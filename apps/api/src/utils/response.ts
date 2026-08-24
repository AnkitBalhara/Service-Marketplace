import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, meta?: Record<string, any>) => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
};

export const sendCreated = <T>(res: Response, data: T, meta?: Record<string, any>) => {
  return sendSuccess(res, data, 201, meta);
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
) => {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
};
