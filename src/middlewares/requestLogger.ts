import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const correlationId = (req as any).correlationId;
  logger.info(`${req.method} ${req.originalUrl}`, { correlationId, ip: req.ip });
  next();
}

