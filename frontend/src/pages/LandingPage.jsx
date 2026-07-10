import { useEffect } from 'react';
import { LayoutGroup } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/sections/Hero';
import SocialProof from '../components/sections/SocialProof';
import Subjects from '../components/sections/Subjects';
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
          <Hero />
          <SocialProof />
	  <Resources />
	  <VideoLibrary />
          <Subjects />
          <PremiumCourses />
          <PlatformFeatures />
          <Practice />
          <SuccessStories />
          <Contact />
        </main>
      </LayoutGroup>
      <Footer />
    </>
  );
};

export default LandingPage;
