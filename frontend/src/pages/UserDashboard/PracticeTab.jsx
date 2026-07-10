import React from 'react';
import { Play, Clock, BarChart } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const PracticeTab = ({ videos }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display font-black text-2xl text-text-primary">Calculus Study Lectures</h2>
          <p className="text-text-secondary text-sm mt-1">Select a lecture card below to watch on YouTube, or launch a practice assessment.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            navigate('/', { state: { scrollTo: 'practice' } });
          }}
          className="px-6 py-2.5 text-xs font-bold shadow-sm border-0 cursor-pointer flex items-center gap-2"
        >
          <BarChart size={14} />
          <span>Launch Timed Quiz Practice</span>
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="p-12 text-center bg-white border border-border-color rounded-3xl text-text-secondary font-semibold">
          No video lectures uploaded yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {videos.map(vid => (
            <div
              key={vid.id}
              onClick={() => window.open(vid.url, '_blank')}
              className="group cursor-pointer rounded-3xl bg-white border border-border-color p-4 hover:shadow-md hover:border-primary-light transition-all flex flex-col gap-3 text-left"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-bg-secondary border border-border-color/40">
                <img
                  src={vid.thumbnail || `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`}
                  alt={vid.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=60';
                  }}
                />
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={20} className="fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                    {vid.category || 'Calculus'}
                  </span>
                  <h3 className="font-display font-bold text-sm text-text-primary line-clamp-2 mt-2 leading-snug group-hover:text-primary transition-colors" title={vid.title}>
                    {vid.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-text-tertiary text-xxs font-extrabold mt-4 pt-3 border-t border-border-color/65">
                  <Clock size={11} />
                  <span>WATCH ON YOUTUBE</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeTab;
