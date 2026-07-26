import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useContent } from '../context/ContentContext';

const WhatsappButton = () => {
  const { content } = useContent();
  const [showPopup, setShowPopup] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Delay showing the button slightly for a smoother page load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Auto-show popup after 4 seconds if not dismissed
  useEffect(() => {
    if (!visible || dismissed) return;
    const t = setTimeout(() => setShowPopup(true), 4000);
    return () => clearTimeout(t);
  }, [visible, dismissed]);

  const phone = content?.contact?.phone?.replace(/[^0-9]/g, '') || '';
  const waLink = phone ? `https://wa.me/${phone}` : 'https://wa.me/';

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-3 pointer-events-none"
      style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
    >
      {/* Popup card */}
      <div
        className={`pointer-events-auto transition-all duration-500 ease-out ${showPopup && !dismissed ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border-color p-4 w-64 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={() => { setShowPopup(false); setDismissed(true); }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-text-secondary flex items-center justify-center border-0 cursor-pointer transition-colors"
          >
            <X size={12} />
          </button>

          <div className="flex items-center gap-2.5 mb-2.5">
            {/* WA icon circle */}
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text-primary text-sm leading-tight">Chat with Us</p>
              <p className="text-[11px] text-text-secondary">Typically replies in minutes</p>
            </div>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            Have a question about enrollment or courses? Send us a message on WhatsApp!
          </p>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 px-4 rounded-xl font-bold text-sm text-white no-underline transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{ color: "white", background: 'linear-gradient(135deg, #2563EB, #1E40AF)' }}
            onClick={() => setShowPopup(false)}
          >
            Start Chat
          </a>

          {/* Triangle pointer */}
          <div className="absolute -bottom-2 right-7 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-border-color rotate-45 rounded-sm" />
        </div>
      </div>

      {/* Main floating button */}
      <div className="pointer-events-auto relative">
        {/* Layered pulsing glow rings */}
        <span className="absolute inset-[-4px] rounded-full animate-ping opacity-75" style={{ background: 'radial-gradient(circle, #1E40AF 30%, transparent 70%)', animationDuration: '2.2s' }} />
        <span className="absolute inset-0 rounded-full animate-ping opacity-55" style={{ background: 'radial-gradient(circle, #2563EB 40%, transparent 80%)', animationDuration: '1.6s' }} />

        <button
          onClick={() => {
            if (dismissed || !showPopup) {
              setShowPopup(v => !v);
              setDismissed(false);
            } else {
              setShowPopup(false);
            }
          }}
          title="Chat on WhatsApp"
          className="relative w-14 h-14 rounded-full flex items-center justify-center border-0 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
            boxShadow: '0 0 25px rgba(37, 99, 235, 0.55), 0 8px 32px rgba(30, 64, 175, 0.45), 0 2px 8px rgba(0,0,0,0.25)'
          }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WhatsappButton;
