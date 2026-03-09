import { Router } from "express";
import { storage } from "../storage";
import { ledewire } from "../ledewire";
import { isAuthenticated } from "../googleAuth";
import { setSSoCookie } from "../sso-module/sso-routes";
import { captureRouteError } from "./helpers";

const router = Router();

// Get authenticated user
router.get("/user", isAuthenticated, async (req: any, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.ledewireAccessToken) {
      console.log('[AUTH] /api/auth/user: User has no access token after middleware');
      return res.status(401).json({ message: "No access token available" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      ledewireToken: user.ledewireAccessToken,
    });
  } catch (error) {
    captureRouteError(error, req, 500);
    res.status(500).json({ message: "Failed to fetch user", requestId: req.requestId });
  }
});

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const ledewireAuth = await ledewire.signupBuyer(email, password, name);
    
    const payload = JSON.parse(Buffer.from(ledewireAuth.access_token.split('.')[1], 'base64').toString());
    const ledewireUserId = payload.buyer_claims?.user_id || payload.sub;
    
    const user = await storage.createUser({
      email,
      name,
      ledewireAccessToken: ledewireAuth.access_token,
      ledewireRefreshToken: ledewireAuth.refresh_token,
      ledewireUserId,
    });
    
    if (ledewireAuth.refresh_token) {
      setSSoCookie(res, ledewireAuth.refresh_token);
      console.log('[SSO] Set SSO cookie on signup');
    }
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      ledewireToken: ledewireAuth.access_token,
    });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const ledewireAuth = await ledewire.loginBuyer(email, password);
    
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      const payload = JSON.parse(Buffer.from(ledewireAuth.access_token.split('.')[1], 'base64').toString());
      const ledewireUserId = payload.buyer_claims?.user_id || payload.sub;
      
      user = await storage.createUser({
        email,
        name: email.split('@')[0],
        ledewireAccessToken: ledewireAuth.access_token,
        ledewireRefreshToken: ledewireAuth.refresh_token,
        ledewireUserId,
      });
    } else {
      const payload = JSON.parse(Buffer.from(ledewireAuth.access_token.split('.')[1], 'base64').toString());
      const ledewireUserId = payload.buyer_claims?.user_id || payload.sub;
      
      await storage.updateUserLedewireTokens(
        user.id,
        ledewireAuth.access_token,
        ledewireAuth.refresh_token,
        ledewireUserId
      );
    }
    if (ledewireAuth.refresh_token) {
      setSSoCookie(res, ledewireAuth.refresh_token);
      console.log('[SSO] Set SSO cookie on login');
    }
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      ledewireToken: ledewireAuth.access_token,
    });
  } catch (error: any) {
    captureRouteError(error, req, 401);
    res.status(401).json({ error: error.message, requestId: req.requestId });
  }
});

// Password reset - request code
router.post("/password/reset-request", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await ledewire.requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    captureRouteError(error, req, 200);
    res.json({ message: 'If an account with this email exists, a reset code has been sent.' });
  }
});

// Password reset - confirm with code
router.post("/password/reset", async (req, res) => {
  try {
    const { email, reset_code, password } = req.body;
    
    if (!email || !reset_code || !password) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const result = await ledewire.resetPassword(email, reset_code, password);
    res.json(result);
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

export default router;
