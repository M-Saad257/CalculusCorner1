import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Books from '../components/sections/Books';
import Loader from '../components/ui/Loader';

const BooksPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // 500ms artificial delay for smooth transition
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24 bg-transparent relative z-10 w-full min-h-[80vh] flex flex-col">
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader text="Loading Books..." />
          </div>
        ) : (
          <Books hideHeader={false} />
        )}
      </main>
      <Footer />
    </>
  );
};

export default BooksPage;
