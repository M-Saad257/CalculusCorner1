import { useState, useEffect } from 'react';
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
import Collaboration from '../components/sections/Collaboration';
import FAQ from '../components/sections/FAQ';
import Contact from '../components/sections/Contact';
import Footer from '../components/layout/Footer';

const preloadImages = (urls) => {
  return Promise.all(
    urls.map(url => {
      if (!url) return Promise.resolve();
      return new Promise(resolve => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
};

const LandingPage = () => {
  const location = useLocation();
  const { content } = useContent();
  const visibility = content?.visibility || {};

  useEffect(() => {
    const scrollToElement = (targetId) => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (location.state && location.state.scrollTo) {
      const targetId = location.state.scrollTo;
      setTimeout(() => scrollToElement(targetId), 100);
      window.history.replaceState({}, document.title);
    } else if (location.hash) {
      const targetId = location.hash.replace('#', '');
      setTimeout(() => scrollToElement(targetId), 150);
    }
  }, [location]);
  return (
    <>
      <Navbar />
      <LayoutGroup>
        <main>
          {/* New premium Hero2 section. Original <Hero /> is preserved below. */}
          {visibility.hero !== false && <Hero />}
          <SocialProof />
          {visibility.books !== false && <Books homeOnly={true} />}
          {visibility.notes !== false && <Resources homeOnly={true} />}
          {visibility.lectures !== false && <VideoLibrary isHomePage={true} />}
          {visibility.courses !== false && <PremiumCourses />}
          <PlatformFeatures />
          {visibility.practice !== false && <Practice />}
          {visibility.success_stories !== false && <SuccessStories />}
          {visibility.collaboration !== false && <Collaboration />}
          {visibility.contact !== false && <Contact />}
        </main>
      </LayoutGroup>
      <Footer />
    </>
  );
};

export default LandingPage;
