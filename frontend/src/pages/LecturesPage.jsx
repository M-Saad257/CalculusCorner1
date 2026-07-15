import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import VideoLibrary from '../components/sections/VideoLibrary';

const LecturesPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24   bg-transparent relative z-10 w-full">
        <VideoLibrary hideHeader={false} />
      </main>
      <Footer />
    </>
  );
};

export default LecturesPage;
