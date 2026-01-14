import { useState, useCallback } from 'react';
import { Image } from 'lucide-react';

interface DynamicImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  maxHeight?: string;
  minHeight?: string;
  fallbackAspectRatio?: number;
  hoverScale?: boolean;
}

export function DynamicImage({ 
  src, 
  alt, 
  className = '', 
  maxHeight = '320px',
  minHeight = '120px',
  fallbackAspectRatio = 16/9,
  hoverScale = false
}: DynamicImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  }, []);

  if (error || !src) {
    return (
      <div 
        className={`bg-slate-800 flex items-center justify-center rounded-lg ${className}`}
        style={{ aspectRatio: fallbackAspectRatio, maxHeight, minHeight }}
      >
        <Image className="w-12 h-12 text-slate-600" />
      </div>
    );
  }

  return (
    <div 
      className={`overflow-hidden rounded-lg ${className}`}
      style={{ 
        aspectRatio: aspectRatio || fallbackAspectRatio,
        maxHeight,
        minHeight
      }}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-transform duration-500 ${hoverScale ? 'group-hover:scale-105' : ''}`}
      />
    </div>
  );
}
