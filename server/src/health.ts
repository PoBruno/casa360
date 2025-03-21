import { Express } from 'express';

export default function setupHealthEndpoint(app: Express): void {
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
}