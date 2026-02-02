import { useState, useCallback } from 'react';
import { Image } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  onAspectRatioLoad?: (aspectRatio: number) => void;
}

export function ImageWithFallback({ src, alt, fallbackSrc, className, onAspectRatioLoad, ...props }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onAspectRatioLoad) {
      const img = e.currentTarget;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      onAspectRatioLoad(aspectRatio);
    }
    props.onLoad?.(e);
  }, [onAspectRatioLoad, props.onLoad]);

  if (error || !src) {
    return (
      <div className={`bg-slate-800 flex items-center justify-center ${className}`}>
        <Image className="w-12 h-12 text-slate-600" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setError(true)}
      onLoad={handleLoad}
      className={className}
      {...props}
    />
  );
}
