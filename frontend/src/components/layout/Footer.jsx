import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { FaInstagram, FaYoutube, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { useContent } from '../../context/ContentContext';
import api from '../../services/api';

const Footer = () => {
  const { content } = useContent();
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
      if (content.logo.logo_url.startsWith('http')) {
        return content.logo.logo_url;
      }
      return `https://localhost:5173${content.logo.logo_url}`;
    }
    return "/CClogo.png";
  };

  return (
    <footer className="bg-bg-secondary border-t border-border-color pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-border-color">

        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src={getLogoSrc()}
              alt="Calculus Corner Logo"
              className="h-10 w-auto object-contain mix-blend-multiply"
              onError={(e) => {
                if (e.target.src !== window.location.origin + "/CClogo.png") {
                  e.target.src = "/CClogo.png";
                }
              }}
            />
            <span className="font-display font-extrabold text-lg text-gradient bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Calculus Corner
            </span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
            Where math actually makes sense. Helping students build real confidence through expert lessons, AI-powered tools, and a community that grows together.
          </p>
          <div className="flex gap-3 mt-2">
            <a href="https://www.youtube.com/@Calculus.Corner" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="YouTube">
              <FaYoutube size={18} />
            </a>
            <a href="https://instagram.com/calculus.corner?igsh=cmtmdTY0YmVqYnJx" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="Instagram">
              <FaInstagram size={18} />
            </a>
            <a href="https://x.com/CalculusCorner" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="Twitter">
              <FaTwitter size={18} />
            </a>
            <a href="https://whatsapp.com/channel/0029VaE4Wcn8KMqo8oK8LH18" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white border border-border-color text-text-secondary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" aria-label="WhatsApp">
              <FaWhatsapp size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="flex flex-col gap-4 lg:pl-8">
          <h4 className="font-display font-bold text-text-primary text-base tracking-wide">Quick Links</h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            <li><a href="/#about" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">About Us</a></li>
            <li><a href="/courses" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Courses</a></li>
            <li><a href="/#ai" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">AI Features</a></li>
            <li><a href="/#success" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Success Stories</a></li>
            <li><a href="/#contact" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Contact</a></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="flex flex-col gap-4 lg:pl-8">
          <h4 className="font-display font-bold text-text-primary text-base tracking-wide">Resources</h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            <li><a href="/#videos" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Video Library</a></li>
            <li><a href="/#practice" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Practice Quizzes</a></li>
            <li><a href="/#resources" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">PDF Notes</a></li>
            <li><a href="/#subjects" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">Blog & Articles</a></li>
            <li><a href="/#contact" className="text-text-secondary text-sm hover:text-primary transition-colors duration-200 hover:pl-1 transition-all">FAQ</a></li>
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
              className="w-full bg-white border border-border-color rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 shadow-sm transition-all"
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
