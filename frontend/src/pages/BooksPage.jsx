import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Books from '../components/sections/Books';

const BooksPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24   bg-transparent relative z-10 w-full">
        <Books hideHeader={false} />
      </main>
      <Footer />
    </>
  );
};

export default BooksPage;
