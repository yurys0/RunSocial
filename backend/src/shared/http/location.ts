import { Request, Response } from 'express';

export function setLocation(req: Request, res: Response, path: string): void {
  res.setHeader('Location', (req.get('x-forwarded-prefix') ?? '') + path);
}
