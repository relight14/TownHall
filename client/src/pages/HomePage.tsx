import { useVideoStore } from '../context/VideoStoreContext';
import SeriesCard from '../components/SeriesCard';

export default function HomePage() {
  const { series } = useVideoStore();

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/85 to-slate-950" />
        <img 
          src="https://images.unsplash.com/photo-1620578640780-e7a89eeaef9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHNraWluZyUyMGFkdmVudHVyZXxlbnwxfHx8fDE3NjQ1MzI1MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Mountain background"
          className="w-full h-full object-cover opacity-30 fixed"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 pt-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full backdrop-blur-sm">
            <span className="text-blue-300 tracking-wide uppercase text-xs font-bold">Adventure Awaits</span>
          </div>
          <h1 className="text-5xl md:text-6xl text-white mb-4 tracking-tight font-bold">
            Epic Adventures.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Unforgettable Stories.
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
            Dive into world-class skiing documentaries and adventure films from the mountains to the backcountry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-1000 fade-in fill-mode-backwards delay-200">
          {series.map(s => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>

        {series.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xl">No series available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
