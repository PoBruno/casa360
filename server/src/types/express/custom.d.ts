import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      }
      // Add any other custom properties here if needed
    }
  }
}

export {};