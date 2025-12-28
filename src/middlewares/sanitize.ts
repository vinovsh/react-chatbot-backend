import { NextFunction, Request, Response } from 'express';

const forbiddenPrefixes = [/^\$/u, /^\./u];

function sanitizeObjectInPlace(value: unknown): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) sanitizeObjectInPlace(item);
    return;
  }
  if (typeof value !== 'object') return;

  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (forbiddenPrefixes.some((re) => re.test(key))) {
      delete obj[key];
      continue;
    }
    sanitizeObjectInPlace(obj[key]);
  }
}

export function sanitizePayload(req: Request, _res: Response, next: NextFunction) {
  sanitizeObjectInPlace(req.body);
  sanitizeObjectInPlace(req.params);
  // Express 5 makes req.query a getter returning a proxy; mutate nested props only
  try { sanitizeObjectInPlace((req as any).query); } catch { /* ignore */ }
  next();
}


