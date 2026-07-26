import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Play, Sparkles, Loader2, BookOpen, Download, CheckCircle2, Eye, Search, X } from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ThemeToggle from '../components/ui/ThemeToggle';
import { sortLecturesNaturally } from '../utils/sortUtils';

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const FullScreenViewer = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [item, setItem] = useState(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Lists for recommendations
  const [allVideos, setAllVideos] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [allBooks, setAllBooks] = useState([]);

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState(type === 'video' ? 'lectures' : type === 'book' ? 'books' : 'notes');
  const [sidebarSearch, setSidebarSearch] = useState('');

  useEffect(() => {
    setSidebarTab(type === 'video' ? 'lectures' : type === 'book' ? 'books' : 'notes');
    setSidebarSearch('');
  }, [type, id]);

  // YouTube progress tracking state
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const timeTrackingRef = useRef({
    watchedSeconds: new Set(),
    lastTime: 0,
    duration: 0,
    isCompleted: false,
    tick: 0
  });

  const [toastMessage, setToastMessage] = useState('');

  // Load the current item's details and all other list items for recommendations
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      api.post('/content/track', { type, id, action: 'view' }).catch(() => { });

      const token = localStorage.getItem('token');
      const decoded = decodeToken(token);
      const isStudentUser = decoded && decoded.role === 'student';
      const videosUrl = isStudentUser ? '/student/videos' : '/content/videos';
      const resourcesUrl = isStudentUser ? '/student/resources' : '/resources';

      // Load videos, resources, and books in parallel for full cross-recommendations
      const [vRes, rRes, bRes] = await Promise.allSettled([
        api.get(videosUrl),
        api.get(resourcesUrl),
        api.get('/books')
      ]);

      let videoList = [];
      if (vRes.status === 'fulfilled' && vRes.value?.data?.data && Array.isArray(vRes.value.data.data)) {
        videoList = vRes.value.data.data;
        setAllVideos(videoList);
      }

      let resourceList = [];
      if (rRes.status === 'fulfilled' && rRes.value?.data?.data && Array.isArray(rRes.value.data.data)) {
        resourceList = rRes.value.data.data;
        setAllResources(resourceList);
      }

      let bookList = [];
      if (bRes.status === 'fulfilled' && bRes.value?.data?.data && Array.isArray(bRes.value.data.data)) {
        bookList = bRes.value.data.data;
        setAllBooks(bookList);
      }

      let found = null;
      if (type === 'video') {
        found = videoList.find(v => String(v.id) === String(id));
        if (!found) {
          try {
            const directRes = await api.get(`/content/videos/${id}`);
            if (directRes.data?.success) found = directRes.data.data;
          } catch (e) { }
        }
      } else if (type === 'resource') {
        found = resourceList.find(r => String(r.id) === String(id));
        if (!found) {
          try {
            const directRes = await api.get(`/resources/${id}`);
            if (directRes.data?.success) found = directRes.data.data;
          } catch (e) { }
        }
      } else if (type === 'book') {
        found = bookList.find(b => String(b.id) === String(id));
        if (!found) {
          try {
            const directRes = await api.get(`/books/${id}`);
            if (directRes.data?.success) found = directRes.data.data;
          } catch (e) { }
        }
      }

      if (found) {
        setItem(found);
      } else {
        setError('Item not found or unavailable.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo(0, 0);
  }, [type, id]);

  const showToastNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Detect board from current item (subcategory or title keywords)
  const detectBoard = (it) => {
    if (!it) return null;
    const sub = (it.subcategory || '').toLowerCase();
    const title = (it.title || '').toLowerCase();
    const combined = sub + ' ' + title;
    if (combined.includes('kpk') || combined.includes('bise kp')) return 'kpk';
    if (combined.includes('punjab') || combined.includes('bise punjab') || combined.includes('ptcb')) return 'punjab';
    if (combined.includes('fbise') || combined.includes('federal')) return 'fbise';
    if (combined.includes('nbf') || combined.includes('national book')) return 'nbf';
    if (combined.includes('sindh')) return 'sindh';
    if (combined.includes('balochistan')) return 'balochistan';
    if (sub) return sub; // use raw subcategory as fallback board key
    return null;
  };

  const itemBoard = useMemo(() => detectBoard(item), [item]);

  // Sort: same-board first, then same-category, then rest
  const boardAwareSort = (list, curItem) => {
    const board = detectBoard(curItem);
    const cat = (curItem?.category || '').toLowerCase();
    return [...list].sort((a, b) => {
      const aBoard = detectBoard(a);
      const bBoard = detectBoard(b);
      const aMatch = board && aBoard === board ? 2 : 0;
      const bMatch = board && bBoard === board ? 2 : 0;
      const aCat = (a.category || '').toLowerCase() === cat ? 1 : 0;
      const bCat = (b.category || '').toLowerCase() === cat ? 1 : 0;
      return (bMatch + bCat) - (aMatch + aCat);
    });
  };

  // Sorted recommendations per tab
  const recommendations = useMemo(() => {
    const filteredLectures = allVideos.filter(v => !(type === 'video' && String(v.id) === String(id)));
    const filteredNotes = allResources.filter(r => !(type === 'resource' && String(r.id) === String(id)));
    const filteredBooks = allBooks.filter(b => !(type === 'book' && String(b.id) === String(id)));

    return {
      lectures: boardAwareSort(filteredLectures, item),
      notes: boardAwareSort(filteredNotes, item),
      books: boardAwareSort(filteredBooks, item),
    };
  }, [item, allVideos, allResources, allBooks, id, type]);

  const activeRawList = sidebarTab === 'lectures'
    ? recommendations.lectures
    : sidebarTab === 'books'
      ? recommendations.books
      : recommendations.notes;

  const activeFilteredList = useMemo(() => {
    if (!sidebarSearch.trim()) return activeRawList;
    const q = sidebarSearch.toLowerCase().trim();
    return activeRawList.filter(i =>
      (i.title && i.title.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q)) ||
      (i.subcategory && i.subcategory.toLowerCase().includes(q))
    );
  }, [activeRawList, sidebarSearch]);

  const getThumbnailUrl = (recItem, currentTab) => {
    if (!recItem) return null;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    if (currentTab === 'lectures' || recItem.videoId) {
      if (recItem.thumbnail) {
        return recItem.thumbnail.startsWith('http') ? recItem.thumbnail : `${backendUrl}${recItem.thumbnail}`;
      }
      if (recItem.videoId) {
        return `https://img.youtube.com/vi/${recItem.videoId}/hqdefault.jpg`;
      }
      return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=60';
    }

    const thumb = recItem.thumbnail_url || recItem.thumbnail;
    if (thumb) {
      return thumb.startsWith('http') ? thumb : `${backendUrl}${thumb}`;
    }
    return null;
  };

  const handleDownloadFile = () => {
    if (!item) return;
    showToastNotification("📥 Download started... please wait a moment.");
    const downloadUrl = `${import.meta.env.VITE_BACKEND_URL || ''}/api/${type === 'book' ? 'books' : 'resources'}/${item.id}/download`;
    window.open(downloadUrl, '_blank');
    api.post('/content/track', { type, id: item.id, action: 'download' }).catch(() => { });
  };

  const handleGoBack = () => {
    const token = localStorage.getItem('token');
    if (token) {
      if (type === 'video') {
        navigate('/dashboard?tab=videos');
      } else if (type === 'resource') {
        navigate('/dashboard?tab=resources');
      } else if (type === 'book') {
        navigate('/dashboard?tab=books');
      } else {
        navigate('/dashboard');
      }
    } else {
      if (type === 'video') {
        navigate('/#videos');
      } else if (type === 'resource') {
        navigate('/notes');
      } else if (type === 'book') {
        navigate('/books');
      } else {
        navigate('/');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-color text-text-primary flex flex-col items-center justify-center">
        <Loader text="Setting up workspace..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-bg-color text-text-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-bg-secondary border border-border-color p-8 rounded-3xl shadow-xl">
          <p className="text-red-500 font-bold text-lg mb-2">Workspace Error</p>
          <p className="text-text-secondary text-sm mb-6">{error || 'Unable to fetch file content.'}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const searchParams = new URLSearchParams(location.search);
  const timeFromQuery = parseInt(searchParams.get('t')) || 0;
  const startPosition = timeFromQuery || Math.round(item?.last_position || item?.lastPosition || 0);

  const viewerUrl = type === 'book'
    ? `/api/books/${id}/view`
    : `/api/resources/${id}/view`;

  return (
    <div className="min-h-screen bg-bg-color text-text-primary flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] bg-emerald-600 text-white text-xs md:text-sm font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-14 px-5 bg-bg-color border-b border-border-color flex items-center justify-between shrink-0 relative z-20 shadow-sm">
        <div className="flex items-center gap-3 max-w-4xl min-w-0 pr-4">
          <button
            onClick={handleGoBack}
            className="p-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-xl transition-all cursor-pointer border border-border-color flex items-center justify-center shrink-0"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-left min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block">
              {type === 'video' ? 'Lecture Video' : type === 'book' ? 'Reference Book' : 'Formula Sheet / Notes'}
            </span>
            <h1 className="font-display font-bold text-xs md:text-sm leading-snug line-clamp-2 break-words text-text-primary">{item?.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(type === 'book' || type === 'resource') && (
            <button
              onClick={handleDownloadFile}
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border-0 shadow-md"
            >
              <Download size={13} /> Download PDF
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Workspace Panel */}
      <div className="flex flex-col lg:flex-row relative z-10 w-full" style={{ height: 'calc(100vh - 3.5rem)' }}>

        {/* Fullscreen Video / Document Container */}
        <main
          className="
    w-full
    lg:flex-1
    bg-black
    flex
    items-center
    justify-center
    overflow-hidden
    relative
    h-[45vh]
    lg:h-full
  "
        >
          <div className="fs-main w-full h-full flex items-center justify-center relative">
            {type === 'video' ? (
              <div className="w-full h-full relative flex items-center justify-center">
                <iframe
                  id="yt-player"
                  src={`https://www.youtube.com/embed/${item.videoId || item.id}?autoplay=1&start=${startPosition}&rel=0&modestbranding=1&enablejsapi=1`}
                  title={item.title}
                  className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-border-color bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-bg-secondary border border-border-color rounded-2xl max-w-lg mx-auto my-auto gap-5 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
                  <FileText size={32} />
                </div>
                <div className="px-4">
                  <h3 className="font-display font-bold text-base text-text-primary leading-snug">
                    {item?.title}
                  </h3>
                  <p className="text-text-secondary text-xs mt-2 leading-relaxed">
                    Mobile web browsers require documents and PDF files to be opened directly for a high-performance native reading experience.
                  </p>
                </div>
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-xs py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:no-underline border-0 cursor-pointer text-center"
                >
                  <Eye size={14} /> Open & Read PDF Document
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col relative">
                {iframeLoading && (
                  <div className="absolute inset-0 bg-bg-color/85 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl">
                    <Loader text="Loading document viewer..." />
                  </div>
                )}
                <iframe
                  src={viewerUrl}
                  className="w-full h-full rounded-xl border border-border-color bg-bg-secondary shadow-2xl"
                  title={item?.title}
                  onLoad={() => setIframeLoading(false)}
                />
              </div>
            )}
          </div>
        </main>

        {/* Dynamic Sidebar */}
        <aside className="flex-1 lg:flex-none w-full lg:w-80 min-h-0 bg-bg-color border-t lg:border-t-0 lg:border-l border-border-color flex flex-col shrink-0 overflow-hidden" style={{ height: undefined }}>
          {/* Sidebar Header & Controls */}
          <div className="p-3 bg-bg-color border-b border-border-color sticky top-0 z-10 flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider text-text-primary m-0">
                <Sparkles size={14} className="text-primary" /> Related Content
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {itemBoard && (
                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {itemBoard.toUpperCase()}
                  </span>
                )}
                <span className="text-[10px] text-text-tertiary font-medium truncate max-w-[80px]" title={item?.category}>
                  {item?.category || 'General'}
                </span>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="grid grid-cols-3 p-1 bg-bg-secondary rounded-xl border border-border-color text-xs font-bold gap-1">
              <button
                onClick={() => setSidebarTab('lectures')}
                className={`py-1.5 px-1.5 rounded-lg transition-all border-0 cursor-pointer text-center text-[11px] truncate ${sidebarTab === 'lectures'
                    ? 'bg-primary text-white shadow-sm font-extrabold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary font-semibold'
                  }`}
              >
                Lectures ({recommendations.lectures.length})
              </button>
              <button
                onClick={() => setSidebarTab('notes')}
                className={`py-1.5 px-1.5 rounded-lg transition-all border-0 cursor-pointer text-center text-[11px] truncate ${sidebarTab === 'notes'
                    ? 'bg-primary text-white shadow-sm font-extrabold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary font-semibold'
                  }`}
              >
                Notes ({recommendations.notes.length})
              </button>
              <button
                onClick={() => setSidebarTab('books')}
                className={`py-1.5 px-1.5 rounded-lg transition-all border-0 cursor-pointer text-center text-[11px] truncate ${sidebarTab === 'books'
                    ? 'bg-primary text-white shadow-sm font-extrabold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary font-semibold'
                  }`}
              >
                Books ({recommendations.books.length})
              </button>
            </div>

            {/* Sidebar Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" size={14} />
              <input
                type="text"
                placeholder={`Search ${sidebarTab}...`}
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-bg-secondary border border-border-color rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
              {sidebarSearch && (
                <button
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-primary rounded transition-colors cursor-pointer border-0 bg-transparent"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Cards List */}
          <div className="p-3 flex flex-col gap-2.5 text-left overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [ms-overflow-style:none] grow">
            {activeFilteredList.slice(0, 4).length > 0 ? (
              activeFilteredList.slice(0, 4).map(rec => {
                const itemType = sidebarTab === 'lectures' ? 'video' : sidebarTab === 'books' ? 'book' : 'resource';
                const isCurrent = String(rec.id) === String(id) && type === itemType;
                const thumbUrl = getThumbnailUrl(rec, sidebarTab);

                return (
                  <Link
                    key={`${itemType}-${rec.id}`}
                    to={`/viewer/${itemType}/${rec.id}`}
                    className={`p-2.5 rounded-xl border transition-all flex gap-3 group shadow-sm hover:no-underline ${isCurrent
                        ? 'bg-primary/10 border-primary/80 ring-1 ring-primary/50 text-text-primary'
                        : 'bg-bg-secondary/60 hover:bg-bg-secondary border-border-color/80 hover:border-primary/50 text-text-primary'
                      }`}
                  >
                    {/* Thumbnail Card */}
                    <div className="w-20 aspect-video rounded-xl bg-bg-tertiary overflow-hidden relative shrink-0 flex items-center justify-center border border-border-color group-hover:border-primary/50 transition-colors shadow-sm">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={rec.title}
                          className="w-full h-full object-contain bg-bg-tertiary group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${sidebarTab === 'lectures' ? 'bg-primary/10 text-primary' : sidebarTab === 'books' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}
                        style={{ display: thumbUrl ? 'none' : 'flex' }}
                      >
                        {sidebarTab === 'lectures' ? <Play size={18} className="fill-current" /> : sidebarTab === 'books' ? <BookOpen size={18} /> : <FileText size={18} />}
                      </div>

                      {sidebarTab === 'lectures' && (
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow">
                            <Play size={10} className="fill-current ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Information */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <h4 className="text-xs font-bold line-clamp-2 leading-snug text-text-primary group-hover:text-primary transition-colors m-0" title={rec.title}>
                        {rec.title}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {rec.subcategory && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {rec.subcategory}
                          </span>
                        )}
                        {rec.category && !rec.subcategory && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary border border-border-color">
                            {rec.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-10 px-4 text-text-tertiary flex flex-col items-center gap-2">
                <Sparkles size={24} className="opacity-40" />
                <p className="text-xs font-semibold text-text-secondary m-0">No matching items found</p>
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="text-[11px] text-primary font-bold hover:underline cursor-pointer border-0 bg-transparent mt-1"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default FullScreenViewer;
