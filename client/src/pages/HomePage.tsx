import { useState } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import SeriesCard from '../components/SeriesCard';
import studioBackground from '@assets/indigostudio_1764614068955.webp';
import { Link } from 'wouter';
import { Play, Star, Check } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

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

function FeaturedEpisodeCard({ episode, seriesTitle }: { 
  episode: { id: string; title: string; thumbnail: string; seriesId: string; price: number };
  seriesTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  const getEpisodeUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/series/${episode.seriesId}?episode=${episode.id}`;
  };

  const shareText = `Check out "${episode.title}" on Indigo Soul NYC`;

  const handleShare = (e: React.MouseEvent, platform: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(getEpisodeUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Link to={`/series/${episode.seriesId}`}>
      <div 
        className="group relative bg-gradient-to-br from-amber-900/30 to-orange-900/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1"
        data-testid={`card-featured-${episode.id}`}
      >
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-amber-500/90 text-white px-2.5 py-1 rounded-full text-xs font-medium">
          <Star className="w-3 h-3" fill="currentColor" />
          Featured
        </div>
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={episode.thumbnail} 
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg text-white mb-1 group-hover:text-amber-400 transition-colors font-medium line-clamp-1">
            {episode.title}
          </h3>
          <p className="text-slate-400 text-sm mb-2">{seriesTitle}</p>
          <div className="flex items-center justify-between mb-3">
            <div className="text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full text-sm border border-amber-500/20">
              ${(episode.price / 100).toFixed(2)}
            </div>
          </div>
          
          <div 
            className="flex items-center gap-1 pt-3 border-t border-amber-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-amber-400/60 text-xs mr-2">Share</span>
            <button
              onClick={(e) => handleShare(e, 'twitter')}
              className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400/60 hover:text-white transition-colors"
              data-testid={`button-share-twitter-featured-${episode.id}`}
              title="Share on X"
            >
              <TwitterIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleShare(e, 'facebook')}
              className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400/60 hover:text-[#1877F2] transition-colors"
              data-testid={`button-share-facebook-featured-${episode.id}`}
              title="Share on Facebook"
            >
              <FacebookIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleShare(e, 'linkedin')}
              className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400/60 hover:text-[#0A66C2] transition-colors"
              data-testid={`button-share-linkedin-featured-${episode.id}`}
              title="Share on LinkedIn"
            >
              <LinkedInIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleShare(e, 'whatsapp')}
              className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400/60 hover:text-[#25D366] transition-colors"
              data-testid={`button-share-whatsapp-featured-${episode.id}`}
              title="Share on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400/60 hover:text-amber-400 transition-colors relative"
              data-testid={`button-share-copy-featured-${episode.id}`}
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
    </Link>
  );
}

export default function HomePage() {
  const { series, siteSettings, featuredEpisodes } = useVideoStore();

  const renderHeroHeading = () => {
    const lines = siteSettings.heroHeading.split('\n');
    if (lines.length === 1) {
      return <span>{lines[0]}</span>;
    }
    return (
      <>
        {lines[0]}<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
          {lines.slice(1).join(' ')}
        </span>
      </>
    );
  };

  const getSeriesTitle = (seriesId: string) => {
    return series.find(s => s.id === seriesId)?.title || 'Video Series';
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/50 to-slate-950/60" />
        <img 
          src={studioBackground}
          alt="Indigo Soul Studio"
          className="w-full h-full object-cover opacity-30 fixed"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 pt-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
          <h1 className="text-5xl md:text-6xl text-white mb-4 tracking-tight font-bold" data-testid="text-hero-heading">
            {renderHeroHeading()}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl leading-relaxed" data-testid="text-hero-subheading">
            {siteSettings.heroSubheading}
          </p>
        </div>

        {/* Featured Videos Section */}
        {featuredEpisodes.length > 0 && (
          <div className="mb-16 animate-in slide-in-from-bottom-6 duration-800 fade-in fill-mode-backwards delay-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" fill="white" />
              </div>
              <h2 className="text-2xl md:text-3xl text-white font-bold">Featured Videos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEpisodes.map(episode => (
                <FeaturedEpisodeCard 
                  key={episode.id} 
                  episode={episode}
                  seriesTitle={getSeriesTitle(episode.seriesId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Series Section */}
        {series.length > 0 && (
          <div className="animate-in slide-in-from-bottom-8 duration-1000 fade-in fill-mode-backwards delay-200">
            <h2 className="text-2xl md:text-3xl text-white font-bold mb-6">All Series</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {series.map(s => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </div>
        )}

        {series.length === 0 && featuredEpisodes.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xl">No series available yet.</p>
            <p className="text-slate-500 mt-2">Use the Admin panel to add your first series.</p>
          </div>
        )}
      </div>
    </div>
  );
}
