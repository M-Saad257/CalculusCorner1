import React from 'react';
import { FileText, Download, BookMarked } from 'lucide-react';

const ResourceTab = ({ resources, getFileUrl }) => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-x-8 text-left animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-3 rounded-3xl relative overflow-hidden">
        <div className="flex items-center gap-x-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <BookMarked size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-text-primary leading-tight">
              Formula <span className="text-gradient">Sheets</span>
            </h1>
            <p className="text-text-secondary text-xs mt-0.5">Download exam-ready cheat sheets and reference materials.</p>
          </div>
        </div>
        {resources.length > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-border-color rounded-full text-xs font-bold text-text-secondary shadow-sm">
            <FileText size={13} className="text-primary" />
            {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'} Available
          </span>
        )}
      </div>

      {/* Cards Grid or Empty State */}
      {
        resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border border-dashed border-border-color rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileText size={28} className="text-primary/50" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-base text-text-primary">No resources yet</p>
              <p className="text-text-secondary text-sm mt-1">Formula sheets and study materials will appear here once uploaded.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {resources.map((res, idx) => {
              const palettes = [
                { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', tag: 'bg-blue-100 text-blue-700' },
                { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', tag: 'bg-violet-100 text-violet-700' },
                { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', tag: 'bg-emerald-100 text-emerald-700' },
                { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', tag: 'bg-amber-100 text-amber-700' },
                { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', tag: 'bg-rose-100 text-rose-700' },
              ];
              const palette = palettes[idx % palettes.length];

              return (
                <div
                  key={res.id}
                  className="group relative bg-white border border-border-color rounded-3xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden"
                >
                  {/* Card Top Accent */}
                  <div className={`h-1.5 w-full ${palette.bg.replace('50', '400')}`} />

                  <div className="p-5 flex flex-col gap-4 grow">
                    {/* Icon + Tag */}
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 rounded-2xl ${palette.bg} ${palette.border} border flex items-center justify-center shadow-sm shrink-0`}>
                        <FileText size={20} className={palette.text} />
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${palette.tag}`}>
                        PDF
                      </span>
                    </div>

                    {/* Title */}
                    <div className="grow">
                      <h3 className="font-display font-bold text-sm text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {res.title}
                      </h3>
                      {res.description && (
                        <p className="text-text-tertiary text-xs mt-1.5 line-clamp-2 leading-relaxed">{res.description}</p>
                      )}
                    </div>

                    {/* Download Button */}
                    <a
                      href={`/api/student/resources/${res.id}/download?token=${localStorage.getItem('token')}`}
                      className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold border transition-all ${palette.bg} ${palette.text} ${palette.border} border hover:opacity-80`}
                      download
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div >
  );
};

export default ResourceTab;

