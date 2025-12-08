import type { Response } from "express";
import type { SSOCookieOptions } from "./sso-types";

export const SSO_COOKIE_NAME = 'ledewire_sso';
export const SSO_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

let customCookieOptions: SSOCookieOptions = {};

export function configureCookieOptions(options: SSOCookieOptions) {
  customCookieOptions = options;
}

export function setSSoCookie(res: Response, refreshToken: string, options?: SSOCookieOptions) {
  const isProduction = process.env.NODE_ENV === 'production';
  const opts = { ...customCookieOptions, ...options };
  
  res.cookie(SSO_COOKIE_NAME, refreshToken, {
    domain: opts.domain ?? (isProduction ? '.ledewire.com' : undefined),
    path: '/',
    httpOnly: true,
    secure: opts.secure ?? isProduction,
    sameSite: 'lax',
    maxAge: opts.maxAge ?? SSO_COOKIE_MAX_AGE,
  });
}

export function clearSSoCookie(res: Response, options?: SSOCookieOptions) {
  const isProduction = process.env.NODE_ENV === 'production';
  const opts = { ...customCookieOptions, ...options };
  
  res.clearCookie(SSO_COOKIE_NAME, {
    domain: opts.domain ?? (isProduction ? '.ledewire.com' : undefined),
    path: '/',
  });
}

export function decodeJwtPayload(token: string): any {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      return true;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    const bufferSeconds = 30;
    return payload.exp < (nowSeconds + bufferSeconds);
  } catch {
    return true;
  }
}
