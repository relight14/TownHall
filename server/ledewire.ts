const LEDEWIRE_API_URL = 'https://api.ledewire.com/v1';

// Buyer credentials (for customer authentication)
const LEDEWIRE_API_KEY = process.env.LEDEWIRE_API_KEY;
const LEDEWIRE_API_SECRET = process.env.LEDEWIRE_API_SECRET;

// Seller credentials (for content registration - NEVER expose these)
const JALBERTFILMS_SELLER_API_KEY = process.env.JALBERTFILMS_SELLER_API_KEY;
const JALBERTFILMS_SELLER_API_SECRET = process.env.JALBERTFILMS_SELLER_API_SECRET;

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

class LedewireClient {
  private sellerToken: string | null = null;

  async getSellerToken(): Promise<string> {
    if (this.sellerToken) {
      return this.sellerToken;
    }

    if (!JALBERTFILMS_SELLER_API_KEY || !JALBERTFILMS_SELLER_API_SECRET) {
      throw new Error('Jalbert Films seller API credentials not configured. Please provide JALBERTFILMS_SELLER_API_KEY and JALBERTFILMS_SELLER_API_SECRET.');
    }

    try {
      const response = await fetch(`${LEDEWIRE_API_URL}/auth/login/api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: JALBERTFILMS_SELLER_API_KEY,
          secret: JALBERTFILMS_SELLER_API_SECRET,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Ledewire seller auth error:', error);
        throw new Error('Jalbert Films seller credentials were rejected by Ledewire API. Please verify the credentials are correct.');
      }

      const data: LedewireAuthResponse = await response.json();
      this.sellerToken = data.access_token;
      return this.sellerToken;
    } catch (err: any) {
      if (err.message.includes('Jalbert Films')) {
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
      const error = await response.json();
      throw new Error(`Ledewire signup failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
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
      const error = await response.json();
      throw new Error(`Ledewire login failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
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
      const error = await response.json();
      throw new Error(`Failed to register content: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async getWalletBalance(userToken: string): Promise<LedewireWalletBalanceResponse> {
    const response = await fetch(`${LEDEWIRE_API_URL}/wallet/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get wallet balance: ${JSON.stringify(error)}`);
    }

    return await response.json();
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
      const error = await response.json();
      throw new Error(`Purchase failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  async verifyPurchase(userToken: string, contentId: string): Promise<LedewirePurchaseVerifyResponse> {
    const response = await fetch(`${LEDEWIRE_API_URL}/purchase/verify?content_id=${contentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to verify purchase: ${JSON.stringify(error)}`);
    }

    return await response.json();
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
      const error = await response.json();
      throw new Error(`Failed to create payment session: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }
}

export const ledewire = new LedewireClient();
