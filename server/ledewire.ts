const LEDEWIRE_API_URL = process.env.LEDEWIRE_API_URL || 'https://api.staging.ledewire.com/v1';

// Buyer credentials (for customer authentication)
const LEDEWIRE_API_KEY = process.env.LEDEWIRE_API_KEY;
const LEDEWIRE_API_SECRET = process.env.LEDEWIRE_API_SECRET;

// Seller credentials (for content registration - NEVER expose these)
const CILLIZZA_SELLER_API_KEY = process.env.CILLIZZA_SELLER_API_KEY;
const CILLIZZA_SELLER_API_SECRET = process.env.CILLIZZA_SELLER_API_SECRET;

function logLedewire(action: string, details: Record<string, any>) {
  const timestamp = new Date().toISOString();
  console.log(`[LEDEWIRE ${timestamp}] ${action}:`, JSON.stringify(details, null, 2));
}

interface LedewireAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

interface LedewireContentResponse {
  id: string;
  content_type: string;
  title: string;
  price_cents: number;
  visibility: string;
  metadata?: any;
}

interface LedewireWalletBalanceResponse {
  balance_cents: number;
}

interface LedewirePurchaseResponse {
  id: string;
  content_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  timestamp: string;
  status: string;
}

interface LedewirePurchaseVerifyResponse {
  has_purchased: boolean;
  purchase_details?: {
    purchase_id: string;
    purchase_date: string;
  };
  checkout_readiness?: {
    is_authenticated: boolean;
    has_sufficient_funds: boolean;
  };
}

async function safeParseJSON(response: Response): Promise<any> {
  const text = await response.text();
  if (!text || text.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const data = await safeParseJSON(response);
  if (!data) {
    return `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
  }
  if (data.raw) {
    return `HTTP ${response.status}: ${data.raw}`;
  }
  if (data.error) {
    return data.error;
  }
  if (data.message) {
    return data.message;
  }
  return JSON.stringify(data);
}

class LedewireClient {
  private sellerToken: string | null = null;

  async getSellerToken(): Promise<string> {
    if (this.sellerToken) {
      return this.sellerToken;
    }

    if (!CILLIZZA_SELLER_API_KEY || !CILLIZZA_SELLER_API_SECRET) {
      throw new Error('Seller API credentials not configured. Please provide CILLIZZA_SELLER_API_KEY and CILLIZZA_SELLER_API_SECRET.');
    }

    console.log('Attempting Ledewire auth to:', `${LEDEWIRE_API_URL}/auth/login/api-key`);
    
    try {
      const response = await fetch(`${LEDEWIRE_API_URL}/auth/login/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: CILLIZZA_SELLER_API_KEY,
          secret: CILLIZZA_SELLER_API_SECRET,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Ledewire seller auth error:', error);
        console.error('API URL used:', LEDEWIRE_API_URL);
        throw new Error('Indigo Soul seller credentials were rejected by Ledewire API. Please verify the credentials are correct and you are using the correct API server.');
      }

      const data: LedewireAuthResponse = await response.json();
      this.sellerToken = data.access_token;
      return this.sellerToken;
    } catch (err: any) {
      if (err.message.includes('Indigo Soul')) {
        throw err;
      }
      console.error('Seller token error:', err);
      throw new Error('Failed to authenticate with Ledewire. Please check your seller credentials.');
    }
  }

  async signupBuyer(email: string, password: string, name: string): Promise<LedewireAuthResponse> {
    const response = await fetch(`${LEDEWIRE_API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Ledewire signup failed: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Signup response was empty');
    }
    return data;
  }

  async loginBuyer(email: string, password: string): Promise<LedewireAuthResponse> {
    const response = await fetch(`${LEDEWIRE_API_URL}/auth/login/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Ledewire login failed: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Login response was empty');
    }
    return data;
  }

  async registerContent(
    title: string, 
    priceCents: number, 
    options?: { 
      content?: string;
      teaser?: string;
      metadata?: any;
    }
  ): Promise<LedewireContentResponse> {
    console.log('[LEDEWIRE] ========== CONTENT REGISTRATION START ==========');
    logLedewire('CONTENT_REGISTRATION_START', {
      title,
      priceCents,
      hasContent: !!options?.content,
      contentLength: options?.content?.length || 0,
      hasTeaser: !!options?.teaser,
      teaserLength: options?.teaser?.length || 0,
      metadata: options?.metadata,
      apiUrl: LEDEWIRE_API_URL,
    });

    let token: string;
    try {
      console.log('[LEDEWIRE] Attempting to get seller token...');
      token = await this.getSellerToken();
      console.log('[LEDEWIRE] Seller token obtained successfully');
      logLedewire('CONTENT_REGISTRATION_AUTH', { tokenObtained: !!token });
    } catch (authError: any) {
      console.error('[LEDEWIRE] SELLER AUTH FAILED:', authError.message);
      logLedewire('CONTENT_REGISTRATION_AUTH_FAILED', { 
        error: authError.message,
        apiUrl: LEDEWIRE_API_URL,
      });
      throw authError;
    }
    
    const contentBody = options?.content || 'Premium content';
    const teaserBody = options?.teaser || '';
    
    const requestBody: any = {
      content_type: 'markdown',
      title,
      price_cents: priceCents,
      content_body: Buffer.from(contentBody).toString('base64'),
      visibility: 'public',
      metadata: options?.metadata || {},
    };
    
    if (teaserBody) {
      requestBody.teaser = Buffer.from(teaserBody).toString('base64');
    }

    console.log('[LEDEWIRE] Sending content registration request...');
    logLedewire('CONTENT_REGISTRATION_REQUEST', {
      endpoint: `${LEDEWIRE_API_URL}/seller/content`,
      bodyKeys: Object.keys(requestBody),
      contentBodyLength: requestBody.content_body.length,
      hasteaser: !!requestBody.teaser,
    });

    const response = await fetch(`${LEDEWIRE_API_URL}/seller/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      console.error('[LEDEWIRE] CONTENT REGISTRATION FAILED:', response.status, errorMsg);
      logLedewire('CONTENT_REGISTRATION_ERROR', {
        status: response.status,
        statusText: response.statusText,
        error: errorMsg,
      });
      throw new Error(`Failed to register content: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      console.error('[LEDEWIRE] CONTENT REGISTRATION RETURNED EMPTY RESPONSE');
      logLedewire('CONTENT_REGISTRATION_ERROR', { error: 'Empty response' });
      throw new Error('Register content response was empty');
    }

    console.log('[LEDEWIRE] ========== CONTENT REGISTRATION SUCCESS ==========');
    console.log('[LEDEWIRE] Content ID:', data.id);
    logLedewire('CONTENT_REGISTRATION_SUCCESS', {
      contentId: data.id,
      title: data.title,
      priceCents: data.price_cents,
      visibility: data.visibility,
    });

    return data;
  }

  async getWalletBalance(userToken: string): Promise<LedewireWalletBalanceResponse> {
    const response = await fetch(`${LEDEWIRE_API_URL}/wallet/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Failed to get wallet balance: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Wallet balance response was empty');
    }
    return data;
  }

  async createPurchase(userToken: string, contentId: string, priceCents: number): Promise<LedewirePurchaseResponse> {
    logLedewire('PURCHASE_START', {
      contentId,
      priceCents,
      hasUserToken: !!userToken,
    });

    const requestBody = {
      content_id: contentId,
      price_cents: priceCents,
    };

    // Use /purchases endpoint per Ledewire API spec
    const response = await fetch(`${LEDEWIRE_API_URL}/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      logLedewire('PURCHASE_REJECTED', {
        contentId,
        priceCents,
        status: response.status,
        statusText: response.statusText,
        error: errorMsg,
      });
      throw new Error(`Purchase failed: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      logLedewire('PURCHASE_ERROR', { error: 'Empty response', contentId });
      throw new Error('Purchase response was empty');
    }

    logLedewire('PURCHASE_SUCCESS', {
      purchaseId: data.id,
      contentId: data.content_id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      amountCents: data.amount_cents,
      status: data.status,
      timestamp: data.timestamp,
    });

    return data;
  }

  async verifyPurchase(userToken: string, contentId: string): Promise<LedewirePurchaseVerifyResponse> {
    logLedewire('PURCHASE_VERIFY_START', {
      contentId,
      hasUserToken: !!userToken,
    });

    // Use /purchase/verify endpoint per Ledewire API spec
    const response = await fetch(`${LEDEWIRE_API_URL}/purchase/verify?content_id=${contentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      logLedewire('PURCHASE_VERIFY_ERROR', {
        contentId,
        status: response.status,
        error: errorMsg,
      });
      throw new Error(`Failed to verify purchase: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      logLedewire('PURCHASE_VERIFY_ERROR', { error: 'Empty response', contentId });
      throw new Error('Verify purchase response was empty');
    }

    logLedewire('PURCHASE_VERIFY_RESULT', {
      contentId,
      hasPurchased: data.has_purchased,
      purchaseDetails: data.purchase_details,
      checkoutReadiness: data.checkout_readiness,
    });

    return data;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      const response = await fetch(`${LEDEWIRE_API_URL}/auth/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.log('[Ledewire] Token refresh failed:', response.status);
        return null;
      }

      const data = await safeParseJSON(response);
      if (!data || !data.access_token) {
        console.log('[Ledewire] Token refresh returned empty response');
        return null;
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error('[Ledewire] Token refresh error:', error);
      return null;
    }
  }

  async createPaymentSession(userToken: string, amountCents: number, options?: { success_url?: string; cancel_url?: string }): Promise<any> {
    const requestBody: any = {
      amount_cents: amountCents,
      currency: 'usd',
    };
    
    if (options?.success_url) {
      requestBody.success_url = options.success_url;
    }
    if (options?.cancel_url) {
      requestBody.cancel_url = options.cancel_url;
    }
    
    logLedewire('PAYMENT_SESSION_REQUEST', {
      endpoint: `${LEDEWIRE_API_URL}/wallet/payment-session`,
      amountCents,
      hasSuccessUrl: !!options?.success_url,
      hasCancelUrl: !!options?.cancel_url,
    });
    
    const response = await fetch(`${LEDEWIRE_API_URL}/wallet/payment-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      logLedewire('PAYMENT_SESSION_ERROR', {
        status: response.status,
        error: errorMsg,
      });
      throw new Error(`Failed to create payment session: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Payment session response was empty');
    }
    
    logLedewire('PAYMENT_SESSION_SUCCESS', {
      hasCheckoutUrl: !!data.checkout_url,
      hasUrl: !!data.url,
      hasSessionUrl: !!data.session_url,
      responseKeys: Object.keys(data),
    });
    
    return data;
  }
}

export const ledewire = new LedewireClient();
