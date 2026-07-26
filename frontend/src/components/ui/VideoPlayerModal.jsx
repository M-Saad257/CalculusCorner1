import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Lock, Maximize } from 'lucide-react';
import api from '../../services/api';
import Loader from './Loader';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

const VideoPlayerModal = ({ video, onClose, onProgressSaved }) => {
  const playerInstanceRef = useRef(null);
  const intervalRef = useRef(null);
  const timeTrackingRef = useRef({
    lastTime: 0,
    watchedSeconds: new Set(),
    duration: 0,
    isCompleted: false,
    tick: 0
  });

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const videoId = video.videoId || video.video_id;
  const initialPosition = parseInt(video.lastPosition) || parseInt(video.last_position) || 0;

  useEffect(() => {
    let active = true;
    
    const checkAndInit = () => {
      if (!active) return;
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    // 1. Load YouTube Iframe API if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
    
    checkAndInit();

    return () => {
      active = false;
      
      if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = Math.floor(playerInstanceRef.current.getCurrentTime());
          const watchedSecondsCount = timeTrackingRef.current.watchedSeconds.size;
          const duration = timeTrackingRef.current.duration;
          if (duration > 0 && watchedSecondsCount > 0) {
            const progressPercent = Math.min(100, Math.round((watchedSecondsCount / duration) * 100));
            const formattedDuration = formatDuration(duration);
            api.post(`/student/progress/video/${video.id}`, {
              progressPercent,
              lastPosition: currentTime,
              duration: formattedDuration
            }).catch(() => {});
          }
        } catch (e) {}
      }

      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {}
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  const initPlayer = () => {
    setLoading(true);
    playerInstanceRef.current = new window.YT.Player('youtube-player-element', {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        fs: 1,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => {
          setLoading(false);
          const player = event.target;
          
          // Get duration
          const duration = player.getDuration();
          timeTrackingRef.current.duration = duration;
          
          // Pre-populate watched seconds up to initialPosition for accurate progress accumulation
          const startPos = Math.min(initialPosition, duration);
          for (let i = 0; i < startPos; i++) {
            timeTrackingRef.current.watchedSeconds.add(i);
          }
          timeTrackingRef.current.lastTime = startPos;
          
          // Seek to last watched position
          if (initialPosition > 0 && initialPosition < duration - 10) {
            player.seekTo(initialPosition, true);
          }
          
          // Start tracking progress loop
          startTrackingLoop(player);
        },
        onStateChange: (event) => {
          // YT.PlayerState.PLAYING is 1
          if (event.data === window.YT.PlayerState.PLAYING) {
            // Make sure loop is running
            startTrackingLoop(event.target);
          } else {
            // Stop loop if paused/ended
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        }
      }
    });
  };

  const startTrackingLoop = (player) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(async () => {
      if (!player || typeof player.getCurrentTime !== 'function') return;

      const currentTime = player.getCurrentTime();
      const duration = timeTrackingRef.current.duration || player.getDuration();
      timeTrackingRef.current.duration = duration;
      
      const lastTime = timeTrackingRef.current.lastTime;
      
      // Enable smooth seeking & skipping forward:
      const startSec = Math.floor(Math.min(lastTime, currentTime));
      const endSec = Math.floor(currentTime);
      for (let s = 0; s <= endSec; s++) {
        timeTrackingRef.current.watchedSeconds.add(s);
      }
      
      timeTrackingRef.current.lastTime = currentTime;

      // Calculate progress percent based on genuine seconds watched
      if (duration > 0) {
        const uniqueSecondsWatched = timeTrackingRef.current.watchedSeconds.size;
        const progressPercent = Math.min(100, Math.round((uniqueSecondsWatched / duration) * 100));

        // Save progress to backend every 5 seconds, or if completed (>= 90%)
        timeTrackingRef.current.tick = (timeTrackingRef.current.tick || 0) + 1;
        
        const isCompleted = progressPercent >= 90;
        const justCompleted = isCompleted && !timeTrackingRef.current.isCompleted;
        
        if (timeTrackingRef.current.tick % 5 === 0 || justCompleted || currentTime === duration) {
          timeTrackingRef.current.isCompleted = isCompleted || timeTrackingRef.current.isCompleted;
          
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const formattedDuration = formatDuration(duration);
              const res = await api.post(`/student/progress/video/${video.id}`, {
                progressPercent: progressPercent,
                lastPosition: Math.round(currentTime),
                duration: formattedDuration
              });
              
              // Check for new badges
              if (res.data && res.data.newlyAwarded && res.data.newlyAwarded.length > 0) {
                res.data.newlyAwarded.forEach(badge => {
                  showToastNotification(`🎉 Milestone Unlocked: ${badge.badgeName}! Certificate available in Achievements.`);
                });
              }

              if (onProgressSaved) {
                onProgressSaved(video.id, progressPercent, isCompleted ? 1 : 0, Math.round(currentTime));
              }
            } catch (err) {
              if (err.response?.status !== 401) {
                console.error('Failed to sync progress:', err);
              }
            }
          }
        }
      }
    }, 1000);
  };

  const showToastNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 6000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] max-w-md bg-emerald-600 text-white text-xs md:text-sm font-bold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-emerald-500">
          <CheckCircle2 size={18} className="shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-bg-color rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-border-color relative text-left flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-border-color flex justify-between items-center bg-bg-secondary shrink-0">
          <div className="flex items-center gap-3 pr-4">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full shrink-0">
              {video.category || 'Lecture'}
            </span>
            <h3 className="font-display font-bold text-sm md:text-base text-text-primary line-clamp-1">
              {video.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                let currentTime = 0;
                if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function') {
                  try {
                    currentTime = Math.floor(playerInstanceRef.current.getCurrentTime() || 0);
                  } catch (err) {}
                }
                const pos = currentTime || Math.round(video.last_position || video.lastPosition || 0);
                window.open(`/viewer/video/${video.id}?t=${pos}`, '_blank');
                onClose();
              }}
              title="Open in Fullscreen Viewer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary hover:text-white border border-primary/30 hover:bg-primary rounded-xl transition-all cursor-pointer bg-primary/10 shadow-xs"
            >
              <Maximize size={13} />
              <span>Fullscreen</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Wrapper */}
        <div className="relative w-full aspect-video bg-black flex-1 min-h-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-white z-10">
              <Loader text="Loading Lecture Player..." />
            </div>
          )}
          
          <div id="youtube-player-element" className="absolute inset-0 w-full h-full border-0" />
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-bg-secondary border-t border-border-color text-xxs font-extrabold tracking-wide text-text-tertiary flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold">
            <CheckCircle2 size={12} className="stroke-[3]" />
            Seeking & Skipping Enabled
          </span>
          <span>
            Resuming from {Math.floor(initialPosition / 60)}m {initialPosition % 60}s
          </span>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default VideoPlayerModal;
