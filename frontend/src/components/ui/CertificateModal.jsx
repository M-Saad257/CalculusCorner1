import React, { useState } from 'react';
import { Award, Download, X, CheckCircle2, Sparkles, Loader2, Trophy } from 'lucide-react';
import api from '../../services/api';

const CertificateModal = ({ isOpen, onClose, certificateData }) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !certificateData) return null;

  const milestoneName = certificateData.title || certificateData.badgeName || 'Gold Milestone Certificate';
  const shortName = (milestoneName.split(' ')[0] || 'Gold').replace(/[^a-zA-Z]/g, '');
  const studentName = certificateData.studentName || 'Student';

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/student/certificate/milestone/${shortName}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CalculusCorner_${shortName}_Certificate.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('Could not download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-bg-color rounded-3xl border border-border-color shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col relative text-left max-h-[92vh]">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-5 text-slate-950 flex justify-between items-start relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-black/10 rounded-full inline-flex items-center gap-1">
              <Sparkles size={12} /> Official Certificate Issued
            </span>
            <h2 className="font-display font-black text-xl mt-1 tracking-tight text-slate-950">
              Congratulations! 
            </h2>
            <p className="text-slate-900 text-xs font-semibold mt-0.5">
              Your official certificate has been issued and is ready to download.
            </p>
          </div>  
          <button
            onClick={onClose}
            className="p-2 text-slate-900 hover:bg-black/10 rounded-full transition-colors cursor-pointer border-0 bg-transparent relative z-10"
          >
            <X size={20} />
          </button>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-20 pointer-events-none">
            <Trophy size={140} />
          </div>
        </div>

        {/* Certificate Content Body */}
        <div className="p-4 md:p-6 flex flex-col gap-4 bg-slate-950 overflow-hidden flex-1 justify-center items-center">
          
          {/* Certificate Live Preview matching Course Certificate layout & typography */}
          <div className="relative w-full max-w-3xl aspect-[2000/1414] shadow-2xl border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 my-auto" style={{ containerType: 'inline-size' }}>
            <img
              src="/CalculusCorner-Milestone-Certificate.png"
              onError={(e) => { e.target.src = '/CalculusCorner-Certificate.png'; }}
              alt="Milestone Certificate Template"
              className="absolute inset-0 w-full h-full object-contain"
            />

              {/* Dynamic Text Overlays (Lavishly Yours font, #2761f0 blue color, exact percentages) */}
              <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Lavishly+Yours&display=swap');`}
              </style>
              <div className="absolute z-10 w-full h-full inset-0">
                {/* Student Name */}
                <p
                  className="absolute text-[#2761f0] font-bold leading-none select-none"
                  style={{
                    top: "44.5%",
                    left: "37.45%",
                    fontSize: "10cqi",
                    fontFamily: '"Lavishly Yours", cursive',
                  }}
                >
                  {studentName}
                </p>

                {/* Milestone Title */}
                <p
                  className="absolute text-[#2761f0] font-bold select-none"
                  style={{
                    top: "61.5%",
                    left: "66.95%",
                    fontSize: "2.3cqi",
                  }}
                >
                  {milestoneName}
                </p>

                {/* Completion Date */}
                <p
                  className="absolute text-[#2761f0] font-bold select-none"
                  style={{
                    top: "70.5%",
                    left: "42.45%",
                    fontSize: "2.3cqi",
                  }}
                >
                  {currentDate}
                </p>
              </div>
            </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                <Award size={22} />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-text-primary">
                  {milestoneName}
                </h4>
                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                  <CheckCircle2 size={12} /> Verified & Signed by Sir Mehtab
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {downloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Generating PNG...
                </>
              ) : (
                <>
                  <Download size={15} /> Download PNG
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
