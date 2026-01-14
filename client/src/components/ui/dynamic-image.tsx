import { useState, useCallback, useEffect } from 'react';
import { Image } from 'lucide-react';

interface DynamicImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  maxHeight?: string;
  maxHeightMobile?: string;
  minHeight?: string;
  minHeightMobile?: string;
  fallbackAspectRatio?: number;
  hoverScale?: boolean;
  shadow?: boolean;
}

export function DynamicImage({ 
  src, 
  alt, 
  className = '', 
  containerClassName = '',
  maxHeight = '320px',
  maxHeightMobile,
  minHeight = '120px',
  minHeightMobile,
  fallbackAspectRatio = 16/9,
  hoverScale = false,
  shadow = false
}: DynamicImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  }, []);

  const shadowClass = shadow ? 'shadow-lg shadow-black/10' : '';
  const effectiveMaxHeight = isMobile && maxHeightMobile ? maxHeightMobile : maxHeight;
  const effectiveMinHeight = isMobile && minHeightMobile ? minHeightMobile : minHeight;

  if (error || !src) {
    return (
      <div className={`flex justify-center ${containerClassName}`}>
        <div 
          className={`bg-slate-100 flex items-center justify-center rounded-xl ${shadowClass} ${className}`}
          style={{ aspectRatio: fallbackAspectRatio, maxHeight: effectiveMaxHeight, minHeight: effectiveMinHeight, width: '100%' }}
        >
          <Image className="w-12 h-12 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${containerClassName}`}>
      <div 
        className={`overflow-hidden rounded-xl ${shadowClass} ${className}`}
        style={{ 
          aspectRatio: aspectRatio || fallbackAspectRatio,
          maxHeight: effectiveMaxHeight,
          minHeight: effectiveMinHeight,
          width: '100%',
          maxWidth: aspectRatio && aspectRatio > 1 ? '100%' : `calc(${effectiveMaxHeight} * ${aspectRatio || fallbackAspectRatio})`
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
    </div>
  );
}
