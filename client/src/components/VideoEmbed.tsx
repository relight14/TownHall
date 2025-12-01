interface VideoEmbedProps {
  url: string;
  type: 'vimeo' | 'youtube';
  title?: string;
}

export function VideoEmbed({ url, type, title = 'Video' }: VideoEmbedProps) {
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

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800">
      <iframe
        src={getEmbedUrl()}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
