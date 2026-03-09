import { Router } from "express";
import { ledewire } from "../ledewire";
import { captureRouteError } from "./helpers";

const router = Router();

// Get wallet balance
router.get("/balance", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const balance = await ledewire.getWalletBalance(token);
    
    res.json(balance);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Get purchase history
router.get("/purchases", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const purchases = await ledewire.getPurchases(token);
    
    // Extract title and metadata from embedded content object
    const enrichedPurchases = purchases.map((purchase: any) => {
      const embeddedContent = purchase.content;
      const embeddedMetadata = embeddedContent?.metadata;
      
      return {
        ...purchase,
        title: embeddedContent?.title || 'Unknown Content',
        source_url: embeddedMetadata?.source_url || null,
        content_type: embeddedMetadata?.type || 'article',
      };
    });
    
    res.json(enrichedPurchases);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Create payment session (Stripe via Ledewire)
router.post("/payment-session", async (req, res) => {
  console.log('[PAYMENT-SESSION] Starting payment session creation...');
  console.log('[PAYMENT-SESSION] Request:', { amount_cents: req.body.amount_cents });
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[PAYMENT-SESSION] Error: No authorization header');
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { amount_cents } = req.body;
    
    // Validate amount
    if (!amount_cents || typeof amount_cents !== 'number' || amount_cents < 100) {
      console.log('[PAYMENT-SESSION] Error: Invalid amount:', amount_cents);
      return res.status(400).json({ error: 'Invalid amount. Minimum is $1.00 (100 cents).' });
    }
    
    // Use trusted domain from environment
    const replitDomains = process.env.REPLIT_DOMAINS;
    const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
    
    let baseUrl: string;
    if (replitDomains) {
      const primaryDomain = replitDomains.split(',')[0];
      baseUrl = `https://${primaryDomain}`;
    } else if (replitDevDomain) {
      baseUrl = `https://${replitDevDomain}`;
    } else {
      baseUrl = 'http://localhost:5000';
    }
    
    console.log(`[PAYMENT-SESSION] Creating session: amount=${amount_cents} cents, baseUrl=${baseUrl}`);
    
    const session = await ledewire.createPaymentSession(token, amount_cents, {
      success_url: `${baseUrl}/wallet?payment=success`,
      cancel_url: `${baseUrl}/wallet?payment=cancelled`,
    });
    
    console.log('[PAYMENT-SESSION] Session created successfully:', {
      hasCheckoutUrl: !!session.checkout_url,
      hasClientSecret: !!session.client_secret,
    });
    
    res.json(session);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

export default router;
