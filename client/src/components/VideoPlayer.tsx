import { X } from 'lucide-react';

interface Episode {
  id: string;
  title: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
}

interface VideoPlayerProps {
  episode: Episode;
  onClose: () => void;
}

export default function VideoPlayer({ episode, onClose }: VideoPlayerProps) {
  const getEmbedUrl = () => {
    if (episode.videoType === 'vimeo') {
      const vimeoId = episode.videoUrl.split('/').pop();
      return `https://player.vimeo.com/video/${vimeoId}`;
    } else {
      const youtubeId = episode.videoUrl.includes('watch?v=') 
        ? episode.videoUrl.split('watch?v=')[1]
        : episode.videoUrl.split('/').pop();
      return `https://www.youtube.com/embed/${youtubeId}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-white font-medium">{episode.title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-2xl">
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
