export interface SSOCookieOptions {
  domain?: string;
  maxAge?: number;
  secure?: boolean;
}

export interface SSOConfig {
  refreshToken: (refreshToken: string) => Promise<{ access_token: string; refresh_token: string } | null>;
  findUserByLedewireId?: (ledewireUserId: string) => Promise<any | null>;
  findUserByEmail?: (email: string) => Promise<any | null>;
  updateUserTokens?: (userId: string, accessToken: string, refreshToken: string, ledewireUserId: string) => Promise<void>;
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
