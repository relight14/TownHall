/**
 * Example integration showing how to use the SSO module in another project.
 * Copy and adapt this code for your subdomain site.
 */

import express from "express";
import cookieParser from "cookie-parser";
import { createSSORoutes, setSSoCookie, type SSOConfig } from "./index";

const app = express();

// 1. Add cookie-parser BEFORE routes
app.use(cookieParser());
app.use(express.json());

// 2. Configure your Ledewire API client
const LEDEWIRE_API_URL = "https://api.ledewire.com";
const LEDEWIRE_BUYER_API_KEY = process.env.LEDEWIRE_BUYER_API_KEY;
const LEDEWIRE_BUYER_API_SECRET = process.env.LEDEWIRE_BUYER_API_SECRET;

async function refreshLedewireToken(refreshToken: string) {
  try {
    const response = await fetch(`${LEDEWIRE_API_URL}/v1/auth/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": LEDEWIRE_BUYER_API_KEY!,
        "X-API-Secret": LEDEWIRE_BUYER_API_SECRET!,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Ledewire token refresh failed:", error);
    return null;
  }
}

// 3. Create SSO config (adapt to your database/storage)
const ssoConfig: SSOConfig = {
  refreshToken: refreshLedewireToken,
  
  // Optional: Find user in your database by Ledewire user ID
  findUserByLedewireId: async (ledewireUserId: string) => {
    // Example: return await db.users.findByLedewireId(ledewireUserId);
    return null;
  },
  
  // Optional: Find user by email
  findUserByEmail: async (email: string) => {
    // Example: return await db.users.findByEmail(email);
    return null;
  },
  
  // Optional: Update user tokens in your database
  updateUserTokens: async (userId, accessToken, refreshToken, ledewireUserId) => {
    // Example: await db.users.updateTokens(userId, { accessToken, refreshToken, ledewireUserId });
  },
};

// 4. Mount SSO routes
const ssoRoutes = createSSORoutes(ssoConfig);
app.use("/api/auth", ssoRoutes);

// 5. If your site handles login, set the SSO cookie after successful auth
app.post("/api/auth/login", async (req, res) => {
  // Your login logic here...
  const { email, password } = req.body;
  
  // Authenticate with Ledewire
  const authResponse = await fetch(`${LEDEWIRE_API_URL}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": LEDEWIRE_BUYER_API_KEY!,
      "X-API-Secret": LEDEWIRE_BUYER_API_SECRET!,
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!authResponse.ok) {
    return res.status(401).json({ error: "Login failed" });
  }
  
  const authData = await authResponse.json();
  
  // Set the SSO cookie for cross-subdomain access
  setSSoCookie(res, authData.refresh_token);
  
  res.json({
    success: true,
    ledewireToken: authData.access_token,
  });
});

// 6. Frontend: Call /api/auth/session on page load
/*
async function initializeAuth() {
  try {
    const response = await fetch("/api/auth/session", { credentials: "include" });
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        // User is logged in across subdomains
        console.log("SSO session restored:", data.user);
        // Store data.ledewireToken for API calls
      }
    }
  } catch {
    // Not authenticated, show login
  }
}

// Call on app initialization
initializeAuth();
*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
