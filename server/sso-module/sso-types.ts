export interface SSOCookieOptions {
  domain?: string;
  maxAge?: number;
  secure?: boolean;
}

export type RefreshTokenResult = 
  | { success: true; access_token: string; refresh_token: string }
  | { success: false; permanent: boolean; error: string };

export interface SSOConfig {
  refreshToken: (refreshToken: string) => Promise<RefreshTokenResult>;
  findUserByLedewireId?: (ledewireUserId: string) => Promise<any | null>;
  findUserByEmail?: (email: string) => Promise<any | null>;
  updateUserTokens?: (userId: string, accessToken: string, refreshToken: string, ledewireUserId: string) => Promise<void>;
  onSessionRestored?: (req: any, userId: string) => void;
  cookieOptions?: SSOCookieOptions;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
  ledewireToken?: string;
  ledewireUserId?: string;
  error?: string;
}
