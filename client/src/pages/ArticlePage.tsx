import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Check, Lock, CreditCard, Loader2, X, Clock, Eye } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import { DynamicImage } from '../components/ui/dynamic-image';
import { useVideoStore } from '../context/VideoStoreContext';
import AuthModal from '../components/AuthModal';
import PasswordResetModal from '../components/PasswordResetModal';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function extractPreviewParagraphs(html: string, count: number = 3): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const paragraphs = tmp.querySelectorAll('p');
  const previewParagraphs: string[] = [];
  for (let i = 0; i < Math.min(count, paragraphs.length); i++) {
    previewParagraphs.push(paragraphs[i].outerHTML);
  }
  return previewParagraphs.join('');
}

function calculateReadTime(content: string): number {
  const text = stripHtml(content);
  const words = text.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function normalizeListHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let orderedCounter = 1;
  let bulletCounter = 1;
  
  const children = Array.from(doc.body.children);
  
  for (const child of children) {
    const tagName = child.tagName.toLowerCase();
    
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      orderedCounter = 1;
      bulletCounter = 1;
      continue;
    }
    
    if (tagName === 'ol') {
      const orderedItem = child.querySelector('li[data-list="ordered"]');
      if (orderedItem) {
        child.setAttribute('start', String(orderedCounter));
        orderedCounter++;
      }
    }
    
    if (tagName === 'ul') {
      const bulletItem = child.querySelector('li[data-list="bullet"]');
      if (bulletItem) {
        bulletCounter++;
      }
    }
  }
  
  doc.querySelectorAll('div[data-twitter-url], div[data-social-url]').forEach((wrapper) => {
    const url = wrapper.getAttribute('data-twitter-url') || wrapper.getAttribute('data-social-url');
    
    if (url && /twitter\.com|x\.com/.test(url)) {
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'twitter-tweet';
      const link = document.createElement('a');
      link.href = url;
      link.textContent = 'Loading tweet...';
      blockquote.appendChild(link);
      wrapper.innerHTML = '';
      wrapper.appendChild(blockquote);
    } else if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'block p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-blue-600 break-all';
      link.textContent = url;
      wrapper.innerHTML = '';
      wrapper.appendChild(link);
    }
  });
  
  return doc.body.innerHTML;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  subheader: string;
  thumbnail: string | null;
  category: string;
  price: number;
  ledewireContentId: string | null;
  featured: number;
  publishedAt: string;
  viewCount: number;
  isPreview?: boolean;
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
  const { user, ledewireToken, walletBalance, refreshWalletBalance, incrementArticleView } = useVideoStore();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const viewCountedRef = useRef<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        console.log(`[ARTICLE-CLIENT] ========================================`);
        console.log(`[ARTICLE-CLIENT] Fetching article: ${articleId}`);
        console.log(`[ARTICLE-CLIENT] User logged in: ${user ? 'YES' : 'NO'}, Token: ${ledewireToken ? 'present' : 'MISSING'}`);
        
        const headers: HeadersInit = {};
        if (ledewireToken) {
          headers['Authorization'] = `Bearer ${ledewireToken}`;
          console.log(`[ARTICLE-CLIENT] Sending Authorization header with request`);
        }
        
        const response = await fetch(`/api/articles/${articleId}`, { headers });
        if (!response.ok) {
          throw new Error('Article not found');
        }
        const data = await response.json();
        console.log(`[ARTICLE-CLIENT] Article received: "${data.title?.substring(0, 50)}..."`);
        console.log(`[ARTICLE-CLIENT] price: ${data.price}, ledewireContentId: ${data.ledewireContentId || 'MISSING'}`);
        console.log(`[ARTICLE-CLIENT] isPreview flag from server: ${data.isPreview}`);
        console.log(`[ARTICLE-CLIENT] ========================================`);
        setArticle(data);
      } catch (err: any) {
        console.error(`[ARTICLE-CLIENT] ERROR loading article:`, err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      loadArticle();
    }
  }, [articleId, user, ledewireToken]);

  useEffect(() => {
    if (article && articleId && viewCountedRef.current !== articleId) {
      viewCountedRef.current = articleId;
      incrementArticleView(articleId).then(() => {
        setArticle(prev => prev ? { ...prev, viewCount: prev.viewCount + 1 } : null);
      }).catch(err => {
        console.error('Failed to increment view count:', err);
      });
    }
  }, [article, articleId, incrementArticleView]);

  useEffect(() => {
    if (article?.content) {
      const loadSocialEmbeds = () => {
        if (article.content.includes('twitter-tweet') || article.content.includes('twitter.com')) {
          if (!(window as any).twttr) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            document.body.appendChild(script);
          } else {
            (window as any).twttr.widgets?.load();
          }
        }
        if (article.content.includes('instagram-media') || article.content.includes('instagram.com')) {
          if (!(window as any).instgrm) {
            const script = document.createElement('script');
            script.src = '//www.instagram.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
          } else {
            (window as any).instgrm.Embeds?.process();
          }
        }
      };
      const timer = setTimeout(loadSocialEmbeds, 100);
      return () => clearTimeout(timer);
    }
  }, [article?.content, hasPurchased]);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      console.log(`[ARTICLE-CLIENT] checkPurchaseStatus called`);
      console.log(`[ARTICLE-CLIENT] user: ${user?.email || 'NOT LOGGED IN'}`);
      console.log(`[ARTICLE-CLIENT] ledewireToken: ${ledewireToken ? 'present' : 'MISSING'}`);
      console.log(`[ARTICLE-CLIENT] article.ledewireContentId: ${article?.ledewireContentId || 'MISSING'}`);
      
      if (!user || !ledewireToken || !article?.ledewireContentId) {
        console.log(`[ARTICLE-CLIENT] Cannot check purchase - missing user/token/contentId`);
        setHasPurchased(false);
        return;
      }

      try {
        setCheckingPurchase(true);
        console.log(`[ARTICLE-CLIENT] Calling /api/articles/${article.id}/purchase/verify...`);
        const response = await fetch(`/api/articles/${article.id}/purchase/verify`, {
          headers: {
            'Authorization': `Bearer ${ledewireToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[ARTICLE-CLIENT] Purchase verify result: has_purchased=${data.has_purchased}`);
          setHasPurchased(data.has_purchased || false);
        } else {
          console.log(`[ARTICLE-CLIENT] Purchase verify failed: ${response.status} ${response.statusText}`);
        }
      } catch (err: any) {
        console.error('[ARTICLE-CLIENT] Failed to check purchase status:', err.message);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchaseStatus();
  }, [user, ledewireToken, article]);

  const handleBuyNow = () => {
    console.log(`[ARTICLE-CLIENT] handleBuyNow clicked`);
    console.log(`[ARTICLE-CLIENT] user: ${user?.email || 'NOT LOGGED IN'}, ledewireToken: ${ledewireToken ? 'present' : 'MISSING'}`);
    if (!user || !ledewireToken) {
      console.log(`[ARTICLE-CLIENT] Opening AuthModal (not logged in)`);
      setShowAuthModal(true);
      return;
    }
    console.log(`[ARTICLE-CLIENT] Opening PurchaseModal`);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    console.log(`[ARTICLE-CLIENT] handleConfirmPurchase called`);
    if (!article?.ledewireContentId) {
      console.log(`[ARTICLE-CLIENT] ERROR: Missing ledewireContentId`);
      setPurchaseError('This article is not available for purchase');
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);

    try {
      console.log(`[ARTICLE-CLIENT] Calling /api/articles/${article.id}/purchase...`);
      const response = await fetch(`/api/articles/${article.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ledewireToken}`,
        },
      });

      const data = await response.json();
      console.log(`[ARTICLE-CLIENT] Purchase response:`, data);

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      if (data.unlocked) {
        console.log(`[ARTICLE-CLIENT] Purchase SUCCESS - unlocked=true`);
        setHasPurchased(true);
        refreshWalletBalance();
        setShowPurchaseModal(false);
        
        // Refetch article to get full content now that purchase is complete
        try {
          console.log(`[ARTICLE-CLIENT] Refetching article for full content...`);
          const refetchHeaders: HeadersInit = {};
          if (ledewireToken) {
            refetchHeaders['Authorization'] = `Bearer ${ledewireToken}`;
          }
          const articleResponse = await fetch(`/api/articles/${article.id}`, { headers: refetchHeaders });
          if (articleResponse.ok) {
            const fullArticle = await articleResponse.json();
            console.log(`[ARTICLE-CLIENT] Full article received, isPreview: ${fullArticle.isPreview}`);
            setArticle(fullArticle);
          }
        } catch (refetchErr) {
          console.error('[ARTICLE-CLIENT] Failed to refetch article after purchase:', refetchErr);
        }
      } else {
        console.log(`[ARTICLE-CLIENT] Purchase FAILED - unlocked=false`);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white min-h-screen text-gray-900">
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
    <div className="min-h-screen bg-white pb-20 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-900">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <article className="bg-white text-gray-900">
          {article.thumbnail && (
            <div className="mb-10">
              <DynamicImage 
                src={article.thumbnail} 
                alt={article.title}
                maxHeight="520px"
                minHeight="240px"
                fallbackAspectRatio={16/9}
                shadow={true}
              />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span data-testid="text-article-date">{formatDate(article.publishedAt)}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span data-testid="text-article-read-time">{calculateReadTime(article.content)} min read</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span data-testid="text-article-view-count">{formatViewCount(article.viewCount)} views</span>
              </div>
              {article.price > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span data-testid="text-article-price" className="font-semibold">{formatPrice(article.price)} to unlock</span>
                  </div>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl text-gray-900 font-bold mb-3 leading-tight" data-testid="text-article-title">
              {article.title}
            </h1>

            <p className="text-lg text-gray-600 font-medium mb-6 italic" data-testid="text-article-subheader">
              {article.subheader}
            </p>

            <div className="flex items-center gap-2 mb-6 pb-6 border-b border-gray-200">
              <span className="text-gray-700 font-medium">By Chris Cillizza</span>
            </div>

            <p className="text-base text-gray-700 mb-8 leading-relaxed border-l-4 border-gray-900 pl-6" data-testid="text-article-summary">
              {stripHtml(article.summary)}
            </p>

            <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-200">
              <span className="text-gray-700 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </span>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
                data-testid="button-share-twitter"
                title="Share on X"
              >
                <TwitterIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[#1877F2] transition-colors"
                data-testid="button-share-facebook"
                title="Share on Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[#0A66C2] transition-colors"
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
                  prose-p:text-gray-900 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900
                  prose-ul:text-gray-900 prose-ol:text-gray-900
                  prose-blockquote:border-l-gray-900 prose-blockquote:text-gray-900 prose-blockquote:italic
                  prose-code:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                  prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200
                  prose-img:rounded-xl"
                data-testid="text-article-content"
                dangerouslySetInnerHTML={{ __html: normalizeListHTML(article.content) }}
              />
            ) : (
              <div>
                <div 
                  className="prose prose-lg max-w-none
                    prose-headings:text-gray-900 prose-headings:font-bold
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-p:text-gray-900 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900
                    prose-blockquote:border-l-gray-900 prose-blockquote:text-gray-900 prose-blockquote:italic"
                  data-testid="text-article-preview"
                  dangerouslySetInnerHTML={{ __html: normalizeListHTML(article.isPreview ? article.content : extractPreviewParagraphs(article.content, 3)) }}
                />
                
                <div className="my-10 p-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">Support the work you want to see in the world</h3>
                  <p className="text-slate-300 mb-6 max-w-md mx-auto">
                    Unlock the full article for just {formatPrice(article.price)}
                  </p>

                  {checkingPurchase ? (
                    <div className="flex items-center justify-center gap-2 text-slate-300">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking access...
                    </div>
                  ) : (
                    <button
                      onClick={handleBuyNow}
                      className="bg-white text-slate-900 py-3 px-8 rounded-lg font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
                      data-testid="button-buy-now"
                    >
                      <CreditCard className="w-5 h-5" />
                      Buy Now - {formatPrice(article.price)}
                    </button>
                  )}

                  <p className="text-slate-500 text-xs mt-4">
                    Powered by <span className="text-blue-400">Ledewire</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={async (freshToken: string) => {
            setShowAuthModal(false);
            
            // After authentication, check if user has already purchased this article
            // before showing the purchase modal
            if (article?.ledewireContentId && freshToken) {
              try {
                setCheckingPurchase(true);
                console.log(`[ARTICLE-CLIENT] Post-auth: checking purchase status with fresh token...`);
                const response = await fetch(`/api/articles/${article.id}/purchase/verify`, {
                  headers: { 'Authorization': `Bearer ${freshToken}` },
                  credentials: 'include',
                });
                if (response.ok) {
                  const data = await response.json();
                  console.log(`[ARTICLE-CLIENT] Post-auth purchase check: has_purchased=${data.has_purchased}`);
                  if (data.has_purchased) {
                    // Already purchased - just refresh the article to get full content
                    setHasPurchased(true);
                    const articleResponse = await fetch(`/api/articles/${article.id}`, {
                      headers: { 'Authorization': `Bearer ${freshToken}` },
                      credentials: 'include',
                    });
                    if (articleResponse.ok) {
                      const fullArticle = await articleResponse.json();
                      setArticle(fullArticle);
                    }
                    return; // Don't show purchase modal - already purchased!
                  }
                }
              } catch (err) {
                console.error('[ARTICLE-CLIENT] Post-auth purchase check failed:', err);
              } finally {
                setCheckingPurchase(false);
              }
            }
            
            // Not purchased yet - show purchase modal
            setShowPurchaseModal(true);
          }}
          onForgotPassword={() => {
            setShowAuthModal(false);
            setShowPasswordReset(true);
          }}
        />
      )}
      
      {showPasswordReset && (
        <PasswordResetModal 
          onClose={() => setShowPasswordReset(false)}
          onBackToLogin={() => {
            setShowPasswordReset(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {showPurchaseModal && article && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => {
            console.log(`[ARTICLE-CLIENT] PurchaseModal CANCELLED - overlay clicked`);
            setShowPurchaseModal(false);
          }}
        >
          <div 
            className="bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-2xl text-white">Confirm Purchase</h2>
              <button 
                onClick={() => {
                  console.log(`[ARTICLE-CLIENT] PurchaseModal CANCELLED - X button clicked`);
                  setShowPurchaseModal(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
                data-testid="button-close-purchase-modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6">
                {article.thumbnail && (
                  <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <ImageWithFallback 
                      src={article.thumbnail} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-white mb-2 font-medium">{article.title}</h3>
                  <p className="text-slate-400 line-clamp-2 text-sm">{stripHtml(article.summary)}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Article Price</span>
                  <span className="text-white font-semibold">{formatPrice(article.price)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Your Balance</span>
                  <span className="text-white font-semibold">${walletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Payment Method</span>
                  <span className="text-blue-400 flex items-center gap-2 font-medium">
                    <CreditCard className="w-4 h-4" />
                    Ledewire Micropayments
                  </span>
                </div>
              </div>

              {purchaseError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <p className="text-red-300 text-sm">{purchaseError}</p>
                </div>
              )}

              {walletBalance * 100 < article.price ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                  <p className="text-amber-300 text-sm mb-3">
                    Insufficient balance. You need {formatPrice(article.price - walletBalance * 100)} more to purchase this article.
                  </p>
                  <Link 
                    to="/wallet"
                    className="inline-block w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors text-center font-medium"
                    data-testid="link-add-funds-modal"
                  >
                    Add Funds to Wallet
                  </Link>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <p className="text-blue-300 text-sm">
                    After purchase, you'll have unlimited access to this article
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    console.log(`[ARTICLE-CLIENT] PurchaseModal CANCELLED - Cancel button clicked`);
                    setShowPurchaseModal(false);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium"
                  disabled={purchasing}
                  data-testid="button-cancel-purchase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={purchasing || walletBalance * 100 < article.price}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                  data-testid="button-confirm-purchase"
                >
                  {purchasing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm {formatPrice(article.price)}
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs text-center">
                  powered by <span className="text-blue-400">ledewire</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
