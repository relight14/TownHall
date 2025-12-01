import { useVideoStore } from '../context/VideoStoreContext';
import SeriesCard from '../components/SeriesCard';
import austriaBackground from '@assets/austria_1764611898687.webp';

export default function HomePage() {
  const { series } = useVideoStore();

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/50 to-slate-950/60" />
        <img 
          src={austriaBackground}
          alt="Mountain background"
          className="w-full h-full object-cover opacity-30 fixed"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 pt-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
          <h1 className="text-5xl md:text-6xl text-white mb-4 tracking-tight font-bold">
            Nurturing artists.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
              Shaping culture.
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
            Accessible space, community, and education for artists of all levels, mediums, and backgrounds—transforming society through the power of culture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-1000 fade-in fill-mode-backwards delay-200">
          {series.map(s => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>

        {series.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xl">No series available yet.</p>
            <p className="text-slate-500 mt-2">Use the Admin panel to add your first series.</p>
          </div>
        )}
      </div>
    </div>
  );
}
