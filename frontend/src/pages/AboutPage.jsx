import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import About from '../components/sections/About';

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-5 bg-transparent relative z-10 w-full overflow-hidden">
        <About />
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
