import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { ArrowLeft, Calendar, User, Share2, Check, Lock, CreditCard, Loader2, X, Clock, Eye } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import { DynamicImage } from '../components/ui/dynamic-image';
import { useQueryClient } from '@tanstack/react-query';
import { useVideoStore } from '../context/VideoStoreContext';
import { useArticle, useArticlePurchaseVerification, articleKeys, type Article } from '../hooks/articles';
import AuthModal from '../components/AuthModal';
import PasswordResetModal from '../components/PasswordResetModal';
import AddFundsModal from '../components/AddFundsModal';
import { Tweet } from 'react-tweet';

function stripHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || doc.body.innerText || '';
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

function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

type ContentSegment = 
  | { type: 'html'; content: string }
  | { type: 'tweet'; tweetId: string; url: string }
  | { type: 'instagram'; url: string }
  | { type: 'social-card'; url: string; platform: 'substack' | 'bluesky' | 'threads' | 'generic' };

function parseContentWithEmbeds(html: string): ContentSegment[] {
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
  
  const segments: ContentSegment[] = [];
  let currentHtml = '';
  
  const processNode = (node: ChildNode) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const socialUrl = element.getAttribute('data-social-url') || element.getAttribute('data-twitter-url');
      
      if (socialUrl && (element.classList.contains('social-embed') || element.hasAttribute('data-twitter-url') || element.hasAttribute('data-social-url'))) {
        if (currentHtml.trim()) {
          segments.push({ type: 'html', content: currentHtml });
          currentHtml = '';
        }
        
        if (/twitter\.com|x\.com/.test(socialUrl)) {
          const tweetId = extractTweetId(socialUrl);
          if (tweetId) {
            segments.push({ type: 'tweet', tweetId, url: socialUrl });
          }
        } else if (/(www\.)?instagram\.com/.test(socialUrl)) {
          segments.push({ type: 'instagram', url: socialUrl });
        } else {
          let platform: 'substack' | 'bluesky' | 'threads' | 'generic' = 'generic';
          if (/substack\.com/.test(socialUrl)) platform = 'substack';
          else if (/bsky\.app/.test(socialUrl)) platform = 'bluesky';
          else if (/threads\.net/.test(socialUrl)) platform = 'threads';
          segments.push({ type: 'social-card', url: socialUrl, platform });
        }
      } else {
        currentHtml += element.outerHTML;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      currentHtml += node.textContent || '';
    }
  };
  
  doc.body.childNodes.forEach(processNode);
  
  if (currentHtml.trim()) {
    segments.push({ type: 'html', content: currentHtml });
  }
  
  return segments;
}

function SocialCard({ url, platform }: { url: string; platform: 'substack' | 'bluesky' | 'threads' | 'generic' }) {
  const config = {
    substack: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-600',
      buttonBg: 'bg-orange-100',
      label: 'Substack',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6719">
          <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
        </svg>
      ),
    },
    bluesky: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-600',
      buttonBg: 'bg-sky-100',
      label: 'Bluesky',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#0085FF">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
        </svg>
      ),
    },
    threads: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-800',
      buttonBg: 'bg-gray-100',
      label: 'Threads',
      icon: null,
    },
    generic: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      buttonBg: 'bg-gray-100',
      label: 'Link',
      icon: null,
    },
  };

  const c = config[platform];

  return (
    <div className={`p-4 ${c.bg} border-2 ${c.border} rounded-xl max-w-md mx-auto shadow-sm my-4`}>
      <div className="flex items-center gap-2 mb-3">
        {c.icon}
        <span className={`text-sm font-semibold ${c.text}`}>{c.label}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block ${c.text} hover:underline break-all text-sm mb-3`}
      >
        {url}
      </a>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${c.buttonBg} border ${c.border} ${c.text} hover:opacity-80 transition-opacity`}
      >
        View on {c.label} →
      </a>
    </div>
  );
}

function InstagramEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderFailed, setRenderFailed] = useState(false);
  const maxRetries = 5;
  const retryDelays = [200, 500, 1000, 1500, 2000];

  useEffect(() => {
    let retryCount = 0;
    let timeoutId: NodeJS.Timeout;

    const checkIfRendered = (): boolean => {
      if (!containerRef.current) return false;
      const iframe = containerRef.current.querySelector('iframe');
      const rendered = containerRef.current.querySelector('.instagram-media-rendered');
      return !!(iframe || rendered);
    };

    const processEmbed = () => {
      if (checkIfRendered()) {
        return;
      }

      if ((window as any).instgrm?.Embeds) {
        (window as any).instgrm.Embeds.process();
        
        timeoutId = setTimeout(() => {
          if (!checkIfRendered() && retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(processEmbed, retryDelays[retryCount - 1] || 2000);
          } else if (!checkIfRendered()) {
            setRenderFailed(true);
          }
        }, 300);
      } else if (retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(processEmbed, retryDelays[retryCount - 1] || 2000);
      } else {
        setRenderFailed(true);
      }
    };

    const loadScript = () => {
      if (!(window as any).instgrm) {
        const script = document.createElement('script');
        script.src = '//www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          setTimeout(processEmbed, 100);
        };
        script.onerror = () => {
          setRenderFailed(true);
        };
        document.body.appendChild(script);
      } else {
        processEmbed();
      }
    };

    const initTimeout = setTimeout(loadScript, 50);

    return () => {
      clearTimeout(initTimeout);
      clearTimeout(timeoutId);
    };
  }, [url]);

  if (renderFailed) {
    return (
      <div className="p-4 bg-pink-50 border-2 border-pink-300 rounded-xl max-w-md mx-auto shadow-sm my-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="ig-fallback-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFDC80" />
                <stop offset="50%" stopColor="#F56040" />
                <stop offset="100%" stopColor="#833AB4" />
              </linearGradient>
            </defs>
            <path fill="url(#ig-fallback-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span className="text-sm font-semibold text-pink-600">Instagram</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-pink-600 hover:underline break-all text-sm mb-3"
        >
          {url}
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-pink-100 border border-pink-300 text-pink-600 hover:opacity-80 transition-opacity"
        >
          View on Instagram →
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="my-4 flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: '99.375%',
        }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View this post on Instagram
        </a>
      </blockquote>
    </div>
  );
}

function ArticleContent({ html, className, "data-testid": testId }: { html: string; className?: string; "data-testid"?: string }) {
  const segments = useMemo(() => parseContentWithEmbeds(html), [html]);

  return (
    <div className={className} data-testid={testId}>
      {segments.map((segment, index) => {
        if (segment.type === 'html') {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: segment.content }}
            />
          );
        }
        if (segment.type === 'tweet') {
          return (
            <div key={index} className="my-4 flex justify-center not-prose">
              <Tweet id={segment.tweetId} />
            </div>
          );
        }
        if (segment.type === 'instagram') {
          return (
            <div key={index} className="not-prose">
              <InstagramEmbed url={segment.url} />
            </div>
          );
        }
        if (segment.type === 'social-card') {
          return (
            <div key={index} className="not-prose">
              <SocialCard url={segment.url} platform={segment.platform} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
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
  
  return doc.body.innerHTML;
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
  const queryClient = useQueryClient();
  const { user, ledewireToken, walletBalance, refreshWalletBalance, incrementArticleView } = useVideoStore();

  // Use TanStack Query for article fetching
  const { data: article, isLoading: loading, error: queryError } = useArticle(articleId, ledewireToken);
  const error = queryError?.message || null;

  // Use TanStack Query for purchase verification
  const { data: purchaseData, isLoading: checkingPurchase, refetch: refetchPurchaseStatus } = useArticlePurchaseVerification(
    article?.id,
    article?.ledewireContentId,
    ledewireToken
  );
  const hasPurchased = purchaseData?.has_purchased ?? false;

  // Helper to refetch article data
  const refetchArticle = () => {
    if (articleId) {
      queryClient.invalidateQueries({ queryKey: articleKeys.api.detail(articleId) });
    }
  };

  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const viewCountedRef = useRef<string | null>(null);
  const viewTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (article && articleId && viewCountedRef.current !== articleId) {
      viewCountedRef.current = articleId;
      incrementArticleView(articleId).catch(err => {
        console.error('Failed to increment view count:', err);
      });
    }
  }, [article, articleId, incrementArticleView]);

  useEffect(() => {
    if (article && articleId && !checkingPurchase && viewTrackedRef.current !== articleId) {
      viewTrackedRef.current = articleId;
      trackEvent('article_viewed', {
        articleName: article.title,
        loggedIn: !!user,
        purchasedArticle: hasPurchased,
      });
    }
  }, [article, articleId, checkingPurchase, user, hasPurchased]);

  const handleBuyNow = () => {
    if (!user || !ledewireToken) {
      setShowAuthModal(true);
      return;
    }
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
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
        refetchPurchaseStatus();
        refreshWalletBalance();
        setShowPurchaseModal(false);
        refetchArticle();
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

  const isFreeArticle = article.price === 0;
  const isMonetized = !!article.ledewireContentId;
  const requiresPayment = !isFreeArticle && isMonetized;
  const canViewContent = !requiresPayment || hasPurchased;

  return (
    <div className="min-h-screen bg-white pb-12 sm:pb-20 text-gray-900">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 text-gray-900">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-8 transition-colors text-sm sm:text-base"
          data-testid="link-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <article className="bg-white text-gray-900">
          {article.thumbnail && (
            <div className="mb-6 sm:mb-10">
              <DynamicImage 
                src={article.thumbnail} 
                alt={article.title}
                maxHeight="640px"
                maxHeightMobile="280px"
                minHeight="200px"
                minHeightMobile="160px"
                fallbackAspectRatio={16/9}
                shadow={true}
              />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span data-testid="text-article-date">{formatDate(article.publishedAt)}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span data-testid="text-article-read-time">{calculateReadTime(article.content)} min read</span>
              </div>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span data-testid="text-article-view-count">{formatViewCount(article.viewCount)} views</span>
              </div>
              {article.price > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span data-testid="text-article-price" className="font-semibold">{formatPrice(article.price)} to unlock</span>
                  </div>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 font-bold mb-2 sm:mb-3 leading-tight" data-testid="text-article-title">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 font-medium mb-4 sm:mb-6 italic" data-testid="text-article-subheader">
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
              <ArticleContent 
                html={article.content}
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
          onSuccess={() => {
            setShowAuthModal(false);
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

      {showPurchaseModal && article && !hasPurchased && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowPurchaseModal(false)}
        >
          <div 
            className="bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h2 className="text-2xl text-white">Confirm Purchase</h2>
              <button 
                onClick={() => setShowPurchaseModal(false)}
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
                  <button 
                    onClick={() => setShowAddFundsModal(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors text-center font-medium"
                    data-testid="button-add-funds-inline"
                  >
                    Add Funds to Wallet
                  </button>
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
                  onClick={() => setShowPurchaseModal(false)}
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
                  powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" data-testid="link-ledewire-article">ledewire</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddFundsModal && article && (
        <AddFundsModal
          onClose={() => setShowAddFundsModal(false)}
          onSuccess={() => {
            setShowAddFundsModal(false);
          }}
          suggestedAmount={Math.ceil((article.price - walletBalance * 100) / 100) + 5}
        />
      )}
    </div>
  );
}
