import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useContent } from '../../context/ContentContext';
import api from '../../services/api';

const Footer = () => {
  const { content } = useContent();
  const visibility = content?.visibility || {};
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null); // 'success' | 'error' | null
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter a valid email address.');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterStatus(null);
    setNewsletterMessage('');

    try {
      const res = await api.post('/content/newsletter/subscribe', {
        email: newsletterEmail.trim()
      });
      if (res.data && res.data.success) {
        setNewsletterStatus('success');
        setNewsletterMessage(res.data.message);
        setNewsletterEmail('');
      }
    } catch (err) {
      setNewsletterStatus('error');
      setNewsletterMessage(
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  const getLogoSrc = () => {
    if (content?.logo?.logo_url) {
      let url = content.logo.logo_url;
      url = url.replace('localost', 'localhost');
      if (url.startsWith('http')) {
        return url;
      }
      if (!url.startsWith('/')) {
        url = `/uploads/logo/${url}`;
      }
      return `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
    }
    return "/official.webp";
  };

  return (
    <footer className="bg-bg-secondary border-t border-border-color pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-border-color">

        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src={getLogoSrc()}
              alt="Calculus Corner Logo"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                if (e.target.src !== window.location.origin + "/official.webp") {
                  e.target.src = "/official.webp";
                }
              }}
            />
            <span className="font-display font-extrabold text-lg text-gradient bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Calculus Corner
            </span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
            Where math actually makes sense. Helping students build real confidence through expert lessons, personalized learning, and a community that grows together.
          </p>
          <div className="flex gap-3 mt-2">
            <a href="https://www.youtube.com/@Calculus.Corner" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-color border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="YouTube">
              <FaYoutube size={18} />
            </a>
            <a href="https://instagram.com/calculus.corner?igsh=cmtmdTY0YmVqYnJx" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-color border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="Instagram">
              <FaInstagram size={18} />
            </a>
            <a href="https://x.com/CalculusCorner" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-color border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="X (Twitter)">
              <FaXTwitter size={18} />
            </a>
            <a href="https://whatsapp.com/channel/0029VaE4Wcn8KMqo8oK8LH18" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-bg-color border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="WhatsApp">
              <FaWhatsapp size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="flex flex-col gap-4 lg:pl-8">
          <h4 className="font-display font-bold text-text-primary text-base tracking-wide">Quick Links</h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {visibility.about !== false && <li><Link to="/about" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">About Us</Link></li>}
            {visibility.courses !== false && <li><Link to="/courses" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Courses</Link></li>}
            {visibility.success_stories !== false && <li><a href="/#success" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Success Stories</a></li>}
            {visibility.contact !== false && <li><a href="/#contact" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Contact</a></li>}
            {visibility.updates !== false && <li><Link to="/updates" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">News & Updates</Link></li>}
            {visibility.past_papers !== false && <li><Link to="/past-papers" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Past Papers</Link></li>}
          </ul>
        </div>

        {/* Resources Column */}
        <div className="flex flex-col gap-4 lg:pl-8">
          <h4 className="font-display font-bold text-text-primary text-base tracking-wide">Resources</h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {visibility.lectures !== false && <li><Link to="/lectures" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Video Library</Link></li>}
            {visibility.practice !== false && <li><a href="/#practice" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Practice Quizzes</a></li>}
            {visibility.notes !== false && <li><Link to="/notes" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">PDF Notes</Link></li>}
            {visibility.books !== false && <li><Link to="/books" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Books</Link></li>}
            {visibility.faq !== false && <li><Link to="/faq" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">FAQ</Link></li>}
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="flex flex-col gap-4">
          <h4 className="font-display font-bold text-text-primary text-base tracking-wide">
            {content?.newsletter?.heading || 'Subscribe to Newsletter'}
          </h4>
          <p className="text-text-secondary text-sm leading-relaxed">
            {content?.newsletter?.subheading || 'Subscribe to Newsletter - Get the latest study tips, new video alerts, and exclusive resources delivered straight to your inbox.'}
          </p>
          <form className="flex items-center w-full relative mt-2" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Your email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="w-full bg-bg-color border border-border-color rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 shadow-sm transition-all"
              required
              disabled={newsletterLoading}
            />
            <button
              type="submit"
              disabled={newsletterLoading}
              className="absolute right-1 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-0 shadow-md disabled:opacity-50"
              aria-label="Subscribe"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Feedback messages */}
          {newsletterStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 animate-fadeIn">
              <CheckCircle size={14} className="shrink-0" />
              <span>{newsletterMessage}</span>
            </div>
          )}
          {newsletterStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-500 animate-fadeIn">
              <AlertCircle size={14} className="shrink-0" />
              <span>{newsletterMessage}</span>
            </div>
          )}
        </div>

      </div>

      <div className="pt-8">
        <div className="container mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-tertiary">
          <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} Calculus Corner. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors duration-200">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
