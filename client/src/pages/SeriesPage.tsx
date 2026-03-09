import { useParams, Link } from 'react-router-dom';
import { useSeries } from '../hooks/series/useSeries';
import EpisodeCard from '../components/EpisodeCard';
import { ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import { VideoEmbed } from '../components/VideoEmbed';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthModals, AuthModals } from '../hooks/useAuthModals';

export default function SeriesPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { data: series = [] } = useSeries();
  const auth = useAuthModals();
  
  const currentSeries = series.find(s => s.id === seriesId);

  if (!currentSeries) {
    return (
      <div className="min-h-screen bg-white">
        <Header onLoginClick={auth.openLogin} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-gray-500 text-xl">Series not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header onLoginClick={auth.openLogin} />
      
      {/* Hero section — navy background */}
      <div className="bg-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-parchment/60 hover:text-gold mb-8 transition-colors font-sans text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to all series
          </Link>

          <div className="mb-0 max-w-4xl">
            {currentSeries.trailerUrl && currentSeries.trailerType ? (
              <>
                {/* Trailer Video */}
                <div className="relative rounded-xl overflow-hidden aspect-video shadow-2xl shadow-navy-dark/50 border border-white/10 mb-6">
                  <VideoEmbed url={currentSeries.trailerUrl} type={currentSeries.trailerType} title={currentSeries.title} bare />
                </div>
                {/* Series Info below trailer */}
                <div>
                  <div className="inline-block mb-3 px-2.5 py-1 bg-gold-pale/10 border border-gold/20 rounded">
                    <span className="text-gold tracking-wide uppercase text-xs font-sans font-semibold">Documentary Series</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl text-white mb-3 font-serif font-bold tracking-tight">{currentSeries.title}</h1>
                  <p className="text-lg text-parchment/60 max-w-2xl leading-relaxed font-body">
                    {currentSeries.description}
                  </p>
                </div>
              </>
            ) : (
              /* Thumbnail with overlay */
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-2xl shadow-navy-dark/50 border border-white/10">
                <ImageWithFallback 
                  src={currentSeries.thumbnail} 
                  alt={currentSeries.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="inline-block mb-3 px-2.5 py-1 bg-gold-pale/10 border border-gold/20 rounded backdrop-blur-sm">
                    <span className="text-gold tracking-wide uppercase text-xs font-sans font-semibold">Documentary Series</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl text-white mb-3 font-serif font-bold tracking-tight">{currentSeries.title}</h1>
                  <p className="text-lg text-parchment/80 max-w-2xl leading-relaxed font-body">
                    {currentSeries.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>

      {/* Episodes section — parchment background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy mb-6 flex items-center gap-3">
            <span className="w-1 h-7 bg-gold rounded-full" />
            Episodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSeries.episodes.map(episode => (
              <EpisodeCard key={episode.id} episode={episode} seriesId={currentSeries.id} />
            ))}
          </div>

          {currentSeries.episodes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-navy/8">
              <p className="text-slate font-body">No episodes available yet</p>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <AuthModals
        showAuth={auth.showAuth}
        showPasswordReset={auth.showPasswordReset}
        onClose={auth.closeAll}
        onForgotPassword={auth.switchToPasswordReset}
        onBackToLogin={auth.switchToLogin}
      />
    </div>
  );
}
