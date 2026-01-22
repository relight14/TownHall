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

interface LedewireSellerConfig {
  google_client_id?: string;
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
    // Handle error being an object with a message property
    if (typeof data.error === 'object' && data.error !== null) {
      return data.error.message || JSON.stringify(data.error);
    }
    return data.error;
  }
  if (data.message) {
    return data.message;
  }
  return JSON.stringify(data);
}

class LedewireClient {
  private sellerToken: string | null = null;
  private sellerTokenExpiresAt: Date | null = null;
  private cachedConfig: LedewireSellerConfig | null = null;

  private isSellerTokenExpired(): boolean {
    if (!this.sellerToken || !this.sellerTokenExpiresAt) {
      return true;
    }
    // Consider token expired 5 minutes before actual expiry for safety margin
    const safetyMargin = 5 * 60 * 1000; // 5 minutes
    return new Date().getTime() > this.sellerTokenExpiresAt.getTime() - safetyMargin;
  }

  private clearSellerToken(): void {
    this.sellerToken = null;
    this.sellerTokenExpiresAt = null;
  }

  async getSellerConfig(): Promise<LedewireSellerConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    // Note: getSellerConfig doesn't use withSellerTokenRefresh because we cache the result
    // and a 401 here would indicate a fundamental auth problem that should be surfaced
    const token = await this.getSellerToken();
    
    const response = await fetch(`${LEDEWIRE_API_URL}/seller/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If 401, clear token so next attempt will re-authenticate
      if (response.status === 401) {
        console.log('[LEDEWIRE] Seller config 401, clearing token for next attempt');
        this.clearSellerToken();
      }
      const errorMsg = await getErrorMessage(response);
      console.error('[LEDEWIRE] Failed to get seller config:', errorMsg);
      throw new Error(`Failed to get seller config: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    const config: LedewireSellerConfig = data || {};
    this.cachedConfig = config;
    console.log('[LEDEWIRE] Fetched seller config, google_client_id:', config.google_client_id ? 'present' : 'missing');
    return config;
  }

  async loginWithGoogle(idToken: string): Promise<LedewireAuthResponse> {
    logLedewire('GOOGLE_LOGIN_START', { hasIdToken: !!idToken });

    const response = await fetch(`${LEDEWIRE_API_URL}/auth/login/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      logLedewire('GOOGLE_LOGIN_ERROR', { status: response.status, error: errorMsg });
      throw new Error(`Google login failed: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data || !data.access_token) {
      throw new Error('Google login response was empty');
    }

    logLedewire('GOOGLE_LOGIN_SUCCESS', { hasAccessToken: !!data.access_token });
    return data;
  }

  async getSellerToken(): Promise<string> {
    // Return cached token if valid and not expired
    if (this.sellerToken && !this.isSellerTokenExpired()) {
      return this.sellerToken;
    }

    // Clear expired token
    if (this.sellerToken) {
      console.log('[LEDEWIRE] Seller token expired, re-authenticating...');
      this.clearSellerToken();
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
      
      // Track expiry from response or default to 30 minutes
      if (data.expires_at) {
        this.sellerTokenExpiresAt = new Date(data.expires_at);
      } else {
        // Default to 30 minutes if no expiry provided
        this.sellerTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      console.log('[LEDEWIRE] Seller token obtained, expires at:', this.sellerTokenExpiresAt.toISOString());
      return this.sellerToken;
    } catch (err: any) {
      if (err.message.includes('Indigo Soul')) {
        throw err;
      }
      console.error('Seller token error:', err);
      throw new Error('Failed to authenticate with Ledewire. Please check your seller credentials.');
    }
  }

  // Custom error class to carry HTTP status
  private createHttpError(status: number, message: string): Error & { httpStatus?: number } {
    const error = new Error(message) as Error & { httpStatus?: number };
    error.httpStatus = status;
    return error;
  }

  // Wrapper to handle 401 errors and retry with fresh token
  // Note: operation must return errorText if response is not ok (body can only be read once)
  private async withSellerTokenRefresh<T>(
    operation: (token: string) => Promise<{ response: Response; data: T | null; errorText?: string }>,
    errorContext: string = 'Seller API call'
  ): Promise<T> {
    const token = await this.getSellerToken();
    const result = await operation(token);
    
    if (result.response.ok) {
      if (result.data === null) {
        throw new Error(`${errorContext} returned empty response`);
      }
      return result.data;
    }
    
    // If 401, clear token and retry once
    if (result.response.status === 401) {
      console.log('[LEDEWIRE] Received 401 from seller API, re-authenticating...');
      this.clearSellerToken();
      const newToken = await this.getSellerToken();
      const retryResult = await operation(newToken);
      
      if (!retryResult.response.ok) {
        const errorMsg = retryResult.errorText || `HTTP ${retryResult.response.status}`;
        throw this.createHttpError(retryResult.response.status, `${errorContext} failed: ${errorMsg}`);
      }
      if (retryResult.data === null) {
        throw new Error(`${errorContext} returned empty response after retry`);
      }
      return retryResult.data;
    }
    
    // Other error - throw immediately using pre-read error text
    const errorMsg = result.errorText || `HTTP ${result.response.status}: ${result.response.statusText}`;
    throw this.createHttpError(result.response.status, `${errorContext} failed: ${errorMsg}`);
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
    console.log('[LEDEWIRE-REGISTER] Starting content registration:', {
      title,
      priceCents,
      hasContent: !!options?.content,
      hasTeaser: !!options?.teaser,
      metadata: options?.metadata,
    });
    
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

    console.log('[LEDEWIRE-REGISTER] Sending request to:', `${LEDEWIRE_API_URL}/seller/content`);

    return this.withSellerTokenRefresh(async (token) => {
      const response = await fetch(`${LEDEWIRE_API_URL}/seller/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Read body once - either as error text or success data
      let data = null;
      let errorText: string | undefined;
      
      if (!response.ok) {
        errorText = await response.text();
        console.error('[LEDEWIRE-REGISTER] FAILED:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          title,
          priceCents,
        });
      } else {
        data = await safeParseJSON(response);
        if (data) {
          console.log('[LEDEWIRE-REGISTER] SUCCESS:', {
            contentId: data.id,
            title: data.title,
            priceCents: data.price_cents,
          });
        }
      }
      
      return { response, data, errorText };
    }, 'Register content');
  }

  async updateContent(
    contentId: string,
    updates: {
      title?: string;
      priceCents?: number;
    }
  ): Promise<LedewireContentResponse> {
    const requestBody: any = {};
    
    if (updates.title !== undefined) {
      requestBody.title = updates.title;
    }
    
    if (updates.priceCents !== undefined) {
      requestBody.price_cents = updates.priceCents;
    }

    console.log(`[LEDEWIRE-UPDATE] Updating content ${contentId}:`, requestBody);

    return this.withSellerTokenRefresh(async (token) => {
      const response = await fetch(`${LEDEWIRE_API_URL}/seller/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Read body once - either as error text or success data
      let data = null;
      let errorText: string | undefined;
      
      if (!response.ok) {
        errorText = await response.text();
        console.error('[LEDEWIRE-UPDATE] FAILED:', {
          status: response.status,
          contentId,
          error: errorText,
        });
      } else {
        data = await safeParseJSON(response);
        if (data) {
          console.log('[LEDEWIRE-UPDATE-OK]', data.id);
        }
      }
      
      return { response, data, errorText };
    }, `Update content ${contentId}`);
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

  async refreshToken(refreshToken: string): Promise<{ 
    success: true; 
    access_token: string; 
    refresh_token: string; 
  } | { 
    success: false; 
    permanent: boolean; 
    error: string;
  }> {
    try {
      const response = await fetch(`${LEDEWIRE_API_URL}/auth/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        const isPermanent = response.status >= 400 && response.status < 500;
        console.log('[Ledewire] Token refresh failed:', response.status, isPermanent ? '(permanent)' : '(transient)');
        return { 
          success: false, 
          permanent: isPermanent,
          error: `HTTP ${response.status}`
        };
      }

      const data = await safeParseJSON(response);
      if (!data || !data.access_token) {
        console.log('[Ledewire] Token refresh returned empty response');
        return { 
          success: false, 
          permanent: true,
          error: 'Empty response'
        };
      }

      return {
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error: any) {
      console.error('[Ledewire] Token refresh network error:', error);
      return { 
        success: false, 
        permanent: false,
        error: error.message || 'Network error'
      };
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

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${LEDEWIRE_API_URL}/auth/password/reset-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(errorMsg);
    }

    const data = await safeParseJSON(response);
    return data?.data || { message: 'If an account with this email exists, a reset code has been sent.' };
  }

  async resetPassword(email: string, resetCode: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${LEDEWIRE_API_URL}/auth/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        reset_code: resetCode, 
        password 
      }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(errorMsg);
    }

    const data = await safeParseJSON(response);
    return data?.data || { message: 'Password has been successfully reset.' };
  }

  async getPurchases(userToken: string): Promise<LedewirePurchaseResponse[]> {
    logLedewire('GET_PURCHASES_START', { hasUserToken: !!userToken });

    const response = await fetch(`${LEDEWIRE_API_URL}/purchases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      logLedewire('GET_PURCHASES_ERROR', { error: errorMsg });
      throw new Error(errorMsg);
    }

    const data = await safeParseJSON(response);
    logLedewire('GET_PURCHASES_SUCCESS', { count: data?.length || 0 });
    return data || [];
  }

  async getContent(contentId: string): Promise<LedewireContentResponse> {
    return this.withSellerTokenRefresh(async (token) => {
      const response = await fetch(`${LEDEWIRE_API_URL}/seller/content/${contentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Read body once - either as error text or success data
      let data = null;
      let errorText: string | undefined;
      
      if (!response.ok) {
        errorText = await response.text();
        console.error('[LEDEWIRE-GETCONTENT] FAILED:', {
          status: response.status,
          contentId,
          error: errorText,
        });
      } else {
        data = await safeParseJSON(response);
      }
      
      return { response, data, errorText };
    }, `Get content ${contentId}`);
  }
}

export const ledewire = new LedewireClient();
