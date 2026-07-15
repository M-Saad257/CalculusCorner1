import { useEffect } from 'react';
import { LayoutGroup } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/sections/Hero';
import SocialProof from '../components/sections/SocialProof';
import Books from '../components/sections/Books';
import PremiumCourses from '../components/sections/PremiumCourses';
import PlatformFeatures from '../components/sections/PlatformFeatures';
import VideoLibrary from '../components/sections/VideoLibrary';
import SuccessStories from '../components/sections/SuccessStories';
import Practice from '../components/sections/Practice';
import Resources from '../components/sections/Resources';
import Contact from '../components/sections/Contact';
import Footer from '../components/layout/Footer';

const LandingPage = () => {
  const location = useLocation();
  const { content } = useContent();
  const visibility = content?.visibility || {};

  useEffect(() => {
    // 1. Handle state-based scrolling (navigated from another page)
    if (location.state && location.state.scrollTo) {
      const targetId = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      // Clear navigation state to avoid re-triggering on manual refresh
      window.history.replaceState({}, document.title);
    }
    // 2. Handle direct URL hash loading
    else if (location.hash) {
      const targetId = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location]);

  return (
    <>
      <Navbar />
      <LayoutGroup>
        <main>
          {visibility.hero !== false && <Hero />}
          <SocialProof />
          {visibility.books !== false && <Books homeOnly={true} />}
          {visibility.notes !== false && <Resources />}
          {visibility.lectures !== false && <VideoLibrary />}
          {visibility.courses !== false && <PremiumCourses />}
          <PlatformFeatures />
          {visibility.practice !== false && <Practice />}
          {visibility.success_stories !== false && <SuccessStories />}
          {visibility.contact !== false && <Contact />}
        </main>
      </LayoutGroup>
      <Footer />
    </>
  );
};

export default LandingPage;
