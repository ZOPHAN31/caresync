import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      accessToken: string;
      careTeams: Array<{
        careTeamId: string;
        careTeamName: string;
        role: string;
        isAdmin: boolean;
      }>;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    accessToken: string;
    refreshToken: string;
    careTeams: Array<{
      careTeamId: string;
      careTeamName: string;
      role: string;
      isAdmin: boolean;
    }>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    accessToken: string;
    refreshToken: string;
    careTeams: unknown[];
  }
}
