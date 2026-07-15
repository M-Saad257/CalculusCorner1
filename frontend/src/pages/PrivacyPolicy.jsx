import { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-bg-color text-left">
      <Navbar />
      
      <main className="grow pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="bg-bg-color rounded-3xl border border-border-color shadow-sm p-8 md:p-12">
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-gradient bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-8 border-b border-border-color pb-6">
              Privacy Policy
            </h1>
            
            <div className="prose max-w-none text-text-secondary leading-relaxed space-y-6">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested, delivery notes, and other information you choose to provide.
              </p>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">2. How We Use Your Information</h2>
              <p>
                We use the information we collect about you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide, maintain, and improve our Services;</li>
                <li>Perform internal operations, including, for example, to prevent fraud and abuse of our Services; to troubleshoot software bugs and operational problems; to conduct data analysis, testing, and research; and to monitor and analyze usage and activity trends;</li>
                <li>Send you communications we think will be of interest to you, including information about products, services, promotions, news, and events of Calculus Corner.</li>
              </ul>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">3. Sharing of Information</h2>
              <p>
                We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>With third party service providers;</li>
                <li>In response to a request for information by a competent authority if we believe disclosure is in accordance with, or is otherwise required by, any applicable law, regulation, or legal process;</li>
                <li>With law enforcement officials, government authorities, or other third parties if we believe your actions are inconsistent with our User agreements, Terms of Service, or policies.</li>
              </ul>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">4. Analytics and Advertising Services Provided by Others</h2>
              <p>
                We may allow others to provide audience measurement and analytics services for us, to serve advertisements on our behalf across the Internet, and to track and report on the performance of those advertisements.
              </p>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">5. Changes to the Statement</h2>
              <p>
                We may change this Statement from time to time. If we make significant changes in the way we treat your personal information, or to the Statement, we will provide you notice through the Services or by some other means, such as email. Your continued use of the Services after such notice constitutes your consent to the changes.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
