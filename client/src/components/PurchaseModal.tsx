import { useState } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { X, CreditCard, Check } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';
import type { ApiEpisode } from '@shared/types';

type Episode = Pick<ApiEpisode, 'id' | 'title' | 'description' | 'price' | 'thumbnail'>;

interface PurchaseModalProps {
  episode: Episode;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ episode, onClose, onSuccess }: PurchaseModalProps) {
  const { purchaseEpisode } = useVideoStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    // Simulate Ledewire micropayment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    purchaseEpisode(episode.id);
    onSuccess();
  };

  return (
    <div 
      className="fixed inset-0 bg-navy/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-lg w-full border border-navy/10 shadow-2xl shadow-navy/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-navy/5">
          <h2 className="text-xl font-serif font-bold text-navy">Unlock This Story</h2>
          <button 
            onClick={onClose}
            className="text-slate/40 hover:text-navy transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="w-36 h-22 rounded-lg overflow-hidden flex-shrink-0 border border-navy/5">
              <ImageWithFallback 
                src={episode.thumbnail} 
                alt={episode.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-navy font-serif font-semibold mb-1">{episode.title}</h3>
              <p className="text-slate line-clamp-2 text-sm font-body">{episode.description}</p>
            </div>
          </div>

          <div className="bg-parchment rounded-lg p-4 mb-5 border border-navy/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate text-sm font-sans">Price</span>
              <span className="text-navy font-serif font-bold text-lg">${episode.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate text-sm font-sans">Payment</span>
              <span className="text-gold flex items-center gap-2 font-sans font-medium text-sm">
                <CreditCard className="w-4 h-4" />
                Ledewire Wallet
              </span>
            </div>
          </div>

          {/* 75% trust signal */}
          <div className="bg-gold-pale/50 border border-gold/20 rounded-lg p-4 mb-5 flex items-center gap-3">
            <span className="text-gold font-serif font-bold text-xl">75%</span>
            <p className="text-navy/70 text-sm font-sans leading-snug">
              of this purchase goes directly to the writer who created it.
            </p>
          </div>

          <div className="bg-cool-grey rounded-lg p-3 mb-6">
            <p className="text-slate text-sm font-sans text-center">
              After unlocking, you'll have unlimited access to this content.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-parchment hover:bg-cool-grey text-navy py-3 rounded font-sans font-medium transition-colors border border-navy/10"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="flex-1 bg-gold hover:bg-gold-light text-white py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-sans font-semibold"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Unlock for ${episode.price.toFixed(2)}
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-navy/5">
            <p className="text-slate/40 text-xs text-center font-sans">
              powered by <a href="https://www.ledewire.com/explore" target="_blank" rel="noopener noreferrer" className="text-gold/60 hover:text-gold transition-colors" data-testid="link-ledewire-purchase">ledewire</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
