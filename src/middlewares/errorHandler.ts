import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

// Central error handler with sanitized responses
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const correlationId = (req as any).correlationId;

  logger.error('Request failed', { status, message, correlationId, error: err });

  res.status(status).json({
    success: false,
    message,
    correlationId
  });
}

