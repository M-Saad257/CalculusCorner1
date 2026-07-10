import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cc_yt_popup_seen';
const YT_CHANNEL_URL = 'https://www.youtube.com/@Calculus.Corner';

export default function YoutubeSubscribePopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 350);
  };

  const handleSubscribe = () => {
    window.open(YT_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  if (!visible) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: closing ? 'yt-fade-out 0.35s ease forwards' : 'yt-fade-in 0.4s ease forwards',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Subscribe to Calculus Corner on YouTube"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: 'min(90vw, 420px)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          boxShadow: '0 32px 64px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(37,99,235,0.08)',
          overflow: 'hidden',
          animation: closing
            ? 'yt-slide-out 0.35s cubic-bezier(0.4,0,1,1) forwards'
            : 'yt-slide-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        <div style={{ height: '5px', background: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 50%, #FBBF24 100%)' }} />

        <button
          id="yt-popup-close"
          onClick={handleClose}
          aria-label="Close popup"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1.5px solid #E2E8F0',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#475569',
            fontSize: '16px',
            lineHeight: 1,
            zIndex: 2,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#E2E8F0';
            e.currentTarget.style.color = '#0F172A';
            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        >
          ✕
        </button>

        <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(96,165,250,0.08) 100%)',
              border: '1px solid rgba(37,99,235,0.15)',
              borderRadius: '99px',
              padding: '4px 12px',
              marginBottom: '20px',
              marginTop: '20px',
              fontSize: '14px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              color: '#2563EB',
              letterSpacing: '0.03em',
            }}
          >
            <span style={{ fontSize: '10px' }}>▶</span>
            Calculus Corner
          </div>

          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 10px',
              lineHeight: 1.25,
            }}
          >
            Subscribe to Our{' '}
            <span style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              YouTube Channel!
            </span>
          </h2>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#475569', lineHeight: 1.65, margin: '0 0 24px' }}>
            Get the latest video lessons, calculus tutorials, and course updates — all for free. Join our growing community of learners!
          </p>

          <button
            id="yt-popup-subscribe"
            onClick={handleSubscribe}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
              color: '#fff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255,0,0,0.35)',
              transition: 'all 0.25s ease',
              marginBottom: '12px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,0,0,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,0,0,0.35)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Subscribe Now
          </button>

          <button
            id="yt-popup-later"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes yt-fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes yt-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes yt-slide-in {
          from { opacity: 0; transform: translate(-50%, -44%) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes yt-slide-out {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, -46%) scale(0.92); }
        }
        @keyframes yt-pulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(255,0,0,0.3); transform: scale(1); }
          50%       { box-shadow: 0 8px 32px rgba(255,0,0,0.55); transform: scale(1.06); }
        }
      `}</style>
    </>
  );
}
