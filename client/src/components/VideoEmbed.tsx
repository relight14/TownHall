interface VideoEmbedProps {
  url: string;
  type: 'vimeo' | 'youtube';
  title?: string;
  bare?: boolean; // If true, just renders the iframe without wrapper styling
}

export function VideoEmbed({ url, type, title = 'Video', bare = false }: VideoEmbedProps) {
  const getEmbedUrl = () => {
    if (type === 'vimeo') {
      const videoId = url.split('/').pop()?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    } else {
      // Handle YouTube URLs
      let videoId = '';
      if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      }
      return `https://www.youtube.com/embed/${videoId}`;
    }
  };

  const iframe = (
    <iframe
      src={getEmbedUrl()}
      title={title}
      className="w-full h-full absolute inset-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );

  if (bare) {
    return iframe;
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800">
      {iframe}
    </div>
  );
}
