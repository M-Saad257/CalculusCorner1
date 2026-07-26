import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import FAQ from '../components/sections/FAQ';

const FAQPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-5 bg-transparent relative z-10 w-full overflow-hidden">
        <FAQ isFullPage={true} />
      </main>
      <Footer />
    </>
  );
};

export default FAQPage;
