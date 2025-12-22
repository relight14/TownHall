import { useState, useRef } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import AuthModal from './AuthModal';
import PasswordResetModal from './PasswordResetModal';
import PurchaseModal from './PurchaseModal';
import VideoPlayer from './VideoPlayer';
import { Lock, Play, Check } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';

interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  price: number;
  thumbnail: string;
}

interface EpisodeCardProps {
  episode: Episode;
  seriesId: string;
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.split('/').pop()?.split('?')[0];
  return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&background=1&loop=1&quality=auto`;
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = '';
  if (url.includes('youtu.be')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;
}

export default function EpisodeCard({ episode, seriesId }: EpisodeCardProps) {
  const { user, purchasedEpisodes } = useVideoStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPurchased = purchasedEpisodes.includes(episode.id);

  const getEpisodeUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/series/${seriesId}?episode=${episode.id}`;
  };

  const shareText = `Check out "${episode.title}" on Indigo Soul NYC`;

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(getEpisodeUrl());
    const text = encodeURIComponent(shareText);
    
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
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(getEpisodeUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    setShowShareMenu(false);
  };

  const handleClick = () => {
    if (isPurchased) {
      setShowPlayer(true);
    } else if (!user) {
      setShowAuthModal(true);
    } else {
      setShowPurchaseModal(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const getEmbedUrl = () => {
    if (episode.videoType === 'vimeo') {
      return getVimeoEmbedUrl(episode.videoUrl);
    } else {
      return getYouTubeEmbedUrl(episode.videoUrl);
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/10"
        data-testid={`card-episode-${episode.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={episode.thumbnail} 
            alt={episode.title}
            className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-110' : ''} ${showPreview ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {showPreview && (
            <iframe
              src={getEmbedUrl()}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              frameBorder="0"
              title={`${episode.title} preview`}
            />
          )}
          
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent transition-opacity ${showPreview ? 'opacity-0' : 'opacity-60'}`} />
          
          {!showPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              {isPurchased ? (
                <div className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/50 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-700 group-hover:border-slate-600 transition-colors">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
          )}

          {!isPurchased && !showPreview && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              ${episode.price}
            </div>
          )}
          
          {showPreview && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white/80 backdrop-blur-sm">
              Preview
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-white mb-2 group-hover:text-blue-400 transition-colors font-medium">
            {episode.title}
          </h3>
          <p className="text-slate-400 line-clamp-2 text-sm mb-3">
            {episode.description}
          </p>
          
          {/* Social Share Section */}
          <div 
            className="flex items-center gap-1 pt-3 border-t border-slate-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-slate-500 text-xs mr-2">Share</span>
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              data-testid={`button-share-twitter-${episode.id}`}
              title="Share on X"
            >
              <TwitterIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-[#1877F2] transition-colors"
              data-testid={`button-share-facebook-${episode.id}`}
              title="Share on Facebook"
            >
              <FacebookIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-[#0A66C2] transition-colors"
              data-testid={`button-share-linkedin-${episode.id}`}
              title="Share on LinkedIn"
            >
              <LinkedInIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('whatsapp')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-[#25D366] transition-colors"
              data-testid={`button-share-whatsapp-${episode.id}`}
              title="Share on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors relative"
              data-testid={`button-share-copy-${episode.id}`}
              title="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
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

      {showPurchaseModal && (
        <PurchaseModal 
          episode={episode}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            setShowPurchaseModal(false);
            setShowPlayer(true);
          }}
        />
      )}

      {showPlayer && (
        <VideoPlayer 
          episode={episode}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
}
