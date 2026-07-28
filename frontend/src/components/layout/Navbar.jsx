import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';
import ThemeToggle from '../ui/ThemeToggle';
import { useSocket } from '../../hooks/useSocket';
import { useContent } from '../../context/ContentContext';


const Navbar = () => {
  const { content } = useContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  let isAdmin = false;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      isAdmin = user && user.role === 'admin';
    }
  } catch (err) {
  }

  const { status, disconnectSocket } = useSocket();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    disconnectSocket();
    navigate('/');
  };

  const handleNavLinkClick = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    // Protected routes
    const protectedRoutes = ['/notes', '/books', '/lectures'];

    if (!token && protectedRoutes.includes(href)) {
      navigate('/enroll');
      return;
    }

    // Delay scroll slightly so the mobile menu animation finishes first,
    // preventing the layout shift from cancelling scrollIntoView.
    const MENU_CLOSE_DELAY = 320;

    if (href === '/') {
      if (location.pathname === '/') {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), MENU_CLOSE_DELAY);
      } else {
        navigate('/');
      }
      return;
    }

    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (location.pathname === '/') {
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, MENU_CLOSE_DELAY);
      } else {
        navigate('/', { state: { scrollTo: targetId } });
      }
    } else {
      setTimeout(() => {
        navigate(href);
      }, MENU_CLOSE_DELAY);
    }
  };

  const visibility = content?.visibility || {};
  const navLinks = [
    { name: 'Home', href: '/' },
    ...(visibility.about !== false ? [{ name: 'About', href: '/about' }] : []),
    ...(visibility.notes !== false ? [{ name: 'Notes', href: '/notes' }] : []),
    ...(visibility.lectures !== false ? [{ name: 'Lectures', href: '/lectures' }] : []),
    ...(visibility.books !== false ? [{ name: 'Books', href: '/books' }] : []),
    ...(visibility.courses !== false ? [{ name: 'Courses', href: '/courses' }] : []),
    ...(visibility.updates !== false ? [{ name: 'Updates', href: '/updates' }] : []),
    ...(visibility.past_papers !== false ? [{ name: 'Past Papers', href: '/past-papers' }] : []),
  ];

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
    <motion.header
      className={`fixed top-0 left-0 w-full z-101 transition-all duration-300 ${isScrolled ? 'py-4 glass backdrop-blur-md shadow-md' : 'py-5 bg-transparent'
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={(e) => handleNavLinkClick(e, '/')}>
          <img
            src={getLogoSrc()}
            alt="Calculus Corner Logo"
            className="h-12 w-auto object-contain"
            onError={(e) => {
              if (e.target.src !== window.location.origin + "/official.webp") {
                e.target.src = "/official.webp";
              }
            }}
          />
          <span className="hidden xl:block font-display font-extrabold text-xl md:text-2xl text-gradient bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Calculus Corner
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8 list-none m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavLinkClick(e, link.href)}
                  className="font-medium text-text-secondary text-sm md:text-base relative hover:text-primary transition-colors duration-300 before:content-[''] before:absolute before:w-0 before:h-[2px] before:bottom-[-4px] before:left-0 before:bg-primary before:transition-all before:duration-300 before:rounded-full hover:before:w-full cursor-pointer"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <ThemeToggle />
          {token ? (
            <>
              <NotificationBell />

              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 relative"
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              >
                {/* Status Dot */}
                <span
                  className="absolute -top-1 -right-1 flex h-3 w-3 z-30 cursor-pointer"
                  title={`Status: ${status === 'connected'
                    ? 'Connected'
                    : status === 'reconnecting'
                      ? 'Reconnecting'
                      : 'Offline'
                    }`}
                >
                  {status === 'reconnecting' && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'connected'
                        ? 'bg-emerald-500'
                        : status === 'reconnecting'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                        }`}
                    />
                  )}

                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-slate-900 ${status === 'connected'
                      ? 'bg-emerald-500'
                      : status === 'reconnecting'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                      }`}
                  />
                </span>

                <LayoutDashboard size={16} />
              </Button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl
             border border-red-200 text-red-600 hover:bg-red-50
             dark:border-red-500/30 dark:hover:bg-red-500/10
             transition-all cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="md:inline-flex"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="block lg:hidden bg-transparent border-0 text-text-primary cursor-pointer p-2 hover:bg-bg-secondary rounded-full transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="absolute top-full left-0 w-full bg-bg-color shadow-lg border-t border-border-color overflow-hidden lg:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="list-none px-6 py-5 flex flex-col gap-4 m-0">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavLinkClick(e, link.href)}
                    className="block text-lg font-medium text-text-primary py-2 border-b border-border-color/50 hover:text-primary hover:pl-2 transition-all duration-200 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
