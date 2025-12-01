const LEDEWIRE_API_URL = process.env.LEDEWIRE_API_URL || 'https://api.ledewire.com/v1';

// Buyer credentials (for customer authentication)
const LEDEWIRE_API_KEY = process.env.LEDEWIRE_API_KEY;
const LEDEWIRE_API_SECRET = process.env.LEDEWIRE_API_SECRET;

// Seller credentials (for content registration - NEVER expose these)
const INDIGO_SELLER_API_KEY = process.env.INDIGO_SELLER_API_KEY;
const INDIGO_SELLER_API_SECRET = process.env.INDIGO_SELLER_API_SECRET;

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

    if (!INDIGO_SELLER_API_KEY || !INDIGO_SELLER_API_SECRET) {
      throw new Error('Indigo Soul seller API credentials not configured. Please provide INDIGO_SELLER_API_KEY and INDIGO_SELLER_API_SECRET.');
    }

    console.log('Attempting Ledewire auth to:', `${LEDEWIRE_API_URL}/auth/login/api-key`);
    
    try {
      const response = await fetch(`${LEDEWIRE_API_URL}/auth/login/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: INDIGO_SELLER_API_KEY,
          secret: INDIGO_SELLER_API_SECRET,
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

  async registerContent(title: string, priceCents: number, metadata?: any): Promise<LedewireContentResponse> {
    const token = await this.getSellerToken();
    
    const response = await fetch(`${LEDEWIRE_API_URL}/seller/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        content_type: 'markdown',
        title,
        price_cents: priceCents,
        content_body: btoa('Premium video content'),
        visibility: 'public',
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Failed to register content: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Register content response was empty');
    }
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
    const response = await fetch(`${LEDEWIRE_API_URL}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        content_id: contentId,
        price_cents: priceCents,
      }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Purchase failed: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Purchase response was empty');
    }
    return data;
  }

  async verifyPurchase(userToken: string, contentId: string): Promise<LedewirePurchaseVerifyResponse> {
    const response = await fetch(`${LEDEWIRE_API_URL}/purchase/verify?content_id=${contentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Failed to verify purchase: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Verify purchase response was empty');
    }
    return data;
  }

  async createPaymentSession(userToken: string, amountCents: number): Promise<any> {
    const response = await fetch(`${LEDEWIRE_API_URL}/wallet/payment-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        amount_cents: amountCents,
        currency: 'usd',
      }),
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response);
      throw new Error(`Failed to create payment session: ${errorMsg}`);
    }

    const data = await safeParseJSON(response);
    if (!data) {
      throw new Error('Payment session response was empty');
    }
    return data;
  }
}

export const ledewire = new LedewireClient();
