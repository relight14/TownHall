import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Check, Lock, CreditCard, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import { useVideoStore } from '../context/VideoStoreContext';
import AuthModal from '../components/AuthModal';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  thumbnail: string | null;
  category: string;
  price: number;
  ledewireContentId: string | null;
  featured: number;
  publishedAt: string;
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { user, ledewireToken, walletBalance, refreshWalletBalance } = useVideoStore();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/articles/${articleId}`);
        if (!response.ok) {
          throw new Error('Article not found');
        }
        const data = await response.json();
        setArticle(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user || !ledewireToken || !article?.ledewireContentId) {
        setHasPurchased(false);
        return;
      }

      try {
        setCheckingPurchase(true);
        const response = await fetch(`/api/articles/${article.id}/purchase/verify`, {
          headers: {
            'Authorization': `Bearer ${ledewireToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasPurchased(data.has_purchased || false);
        }
      } catch (err) {
        console.error('Failed to check purchase status:', err);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchaseStatus();
  }, [user, ledewireToken, article]);

  const handlePurchase = async () => {
    if (!user || !ledewireToken) {
      setShowAuthModal(true);
      return;
    }

    if (!article?.ledewireContentId) {
      setPurchaseError('This article is not available for purchase');
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      const response = await fetch(`/api/articles/${article.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ledewireToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      if (data.unlocked) {
        setHasPurchased(true);
        refreshWalletBalance();
      } else {
        throw new Error('Purchase was not confirmed');
      }
    } catch (err: any) {
      setPurchaseError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getArticleUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(getArticleUrl());
    const text = encodeURIComponent(article?.title || '');
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(getArticleUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white min-h-screen">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="text-center py-20">
          <p className="text-gray-500 text-xl">Article not found</p>
          <p className="text-gray-400 mt-2">The article you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isPaid = article.price > 0 && article.ledewireContentId;
  const canViewContent = !isPaid || hasPurchased;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <article className="bg-white">
          {article.thumbnail && (
            <div className="aspect-[21/9] overflow-hidden rounded-lg mb-8">
              <ImageWithFallback 
                src={article.thumbnail} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span data-testid="text-article-author">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span data-testid="text-article-date">{formatDate(article.publishedAt)}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl text-gray-900 font-bold mb-6 leading-tight" data-testid="text-article-title">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed border-l-4 border-gray-900 pl-6" data-testid="text-article-summary">
              {article.summary}
            </p>

            <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-200">
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </span>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                data-testid="button-share-twitter"
                title="Share on X"
              >
                <TwitterIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#1877F2] transition-colors"
                data-testid="button-share-facebook"
                title="Share on Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#0A66C2] transition-colors"
                data-testid="button-share-linkedin"
                title="Share on LinkedIn"
              >
                <LinkedInIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopyLink}
                className="ml-auto px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm flex items-center gap-2"
                data-testid="button-copy-link"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  'Copy link'
                )}
              </button>
            </div>

            {canViewContent ? (
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900
                  prose-ul:text-gray-700 prose-ol:text-gray-700
                  prose-blockquote:border-l-gray-900 prose-blockquote:text-gray-600 prose-blockquote:italic
                  prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                  prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200
                  prose-img:rounded-xl"
                data-testid="text-article-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="relative">
                <div 
                  className="prose prose-lg max-w-none prose-p:text-gray-700 blur-sm select-none"
                  dangerouslySetInnerHTML={{ __html: article.content.substring(0, 500) + '...' }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white flex items-end justify-center pb-8">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Content</h3>
                    <p className="text-gray-600 mb-6">
                      Unlock this article for just {formatPrice(article.price)}
                    </p>

                    {checkingPurchase ? (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking access...
                      </div>
                    ) : user ? (
                      <>
                        <div className="text-sm text-gray-500 mb-4">
                          Wallet Balance: {formatPrice(walletBalance)}
                        </div>
                        
                        {purchaseError && (
                          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
                            {purchaseError}
                          </div>
                        )}

                        {walletBalance >= article.price ? (
                          <button
                            onClick={handlePurchase}
                            disabled={purchasing}
                            className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            data-testid="button-purchase-article"
                          >
                            {purchasing ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5" />
                                Purchase for {formatPrice(article.price)}
                              </>
                            )}
                          </button>
                        ) : (
                          <div>
                            <p className="text-amber-600 text-sm mb-3">
                              Insufficient balance. Please add funds to continue.
                            </p>
                            <Link 
                              to="/wallet"
                              className="inline-block w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-center"
                              data-testid="link-add-funds"
                            >
                              Add Funds to Wallet
                            </Link>
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                        data-testid="button-login-to-purchase"
                      >
                        Sign in to Purchase
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
}
