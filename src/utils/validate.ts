import { NextFunction, Request, Response } from 'express';

type Rule = (value: any) => string | null;

export function validate(bodyRules: Record<string, Rule[]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};
    for (const [field, rules] of Object.entries(bodyRules)) {
      const value = (req.body as any)[field];
      const msgs = rules.map((r) => r(value)).filter(Boolean) as string[];
      if (msgs.length) errors[field] = msgs;
    }
    if (Object.keys(errors).length) return res.status(422).json({ success: false, errors });
    next();
  };
}

export const isRequired: Rule = (v) => (v === undefined || v === null || v === '' ? 'is required' : null);
export const isEmail: Rule = (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'must be a valid email');
export const minLength = (n: number): Rule => (v) => (typeof v === 'string' && v.length >= n ? null : `must have at least ${n} characters`);

