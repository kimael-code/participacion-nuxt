import type { Session } from 'better-auth';

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      session: Session;
      user: Session['user'];
      companyId: string;
    };
  }
}

export {};
