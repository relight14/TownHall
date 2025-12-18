import type { Request, Response, NextFunction } from "express";

let currentAdminToken: string | null = null;
let adminTokenExpiry: number | null = null;

const TOKEN_EXPIRY_MS = 4 * 60 * 60 * 1000;

export function setAdminToken(token: string) {
  currentAdminToken = token;
  adminTokenExpiry = Date.now() + TOKEN_EXPIRY_MS;
}

export function clearAdminToken() {
  currentAdminToken = null;
  adminTokenExpiry = null;
}

export function getAdminToken(): string | null {
  return currentAdminToken;
}

export function isAdminTokenValid(token: string): boolean {
  if (!token || !currentAdminToken || token !== currentAdminToken) {
    return false;
  }
  if (adminTokenExpiry && Date.now() > adminTokenExpiry) {
    currentAdminToken = null;
    adminTokenExpiry = null;
    return false;
  }
  return true;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'] as string;
  
  if (!adminToken || !currentAdminToken || adminToken !== currentAdminToken) {
    console.log('[ADMIN AUTH] Unauthorized access attempt to admin route');
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  if (adminTokenExpiry && Date.now() > adminTokenExpiry) {
    currentAdminToken = null;
    adminTokenExpiry = null;
    console.log('[ADMIN AUTH] Admin token expired');
    return res.status(401).json({ error: 'Admin session expired' });
  }
  
  next();
}
