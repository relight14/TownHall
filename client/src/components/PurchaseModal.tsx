import { useState } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { X, CreditCard, Check } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';

interface Episode {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
}

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl text-white">Confirm Purchase</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <ImageWithFallback 
                src={episode.thumbnail} 
                alt={episode.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-white mb-2 font-medium">{episode.title}</h3>
              <p className="text-slate-400 line-clamp-2 text-sm">{episode.description}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300">Episode Price</span>
              <span className="text-white font-semibold">${episode.price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Payment Method</span>
              <span className="text-blue-400 flex items-center gap-2 font-medium">
                <CreditCard className="w-4 h-4" />
                Ledewire Micropayments
              </span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm">
              After purchase, you'll have unlimited access to this episode
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors font-medium"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm ${episode.price}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
