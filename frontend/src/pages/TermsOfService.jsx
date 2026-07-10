import { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-bg-color text-left">
      <Navbar />
      
      <main className="grow pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="bg-white rounded-3xl border border-border-color shadow-sm p-8 md:p-12">
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-gradient bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-8 border-b border-border-color pb-6">
              Terms of Service
            </h1>
            
            <div className="prose max-w-none text-text-secondary leading-relaxed space-y-6">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2 className="text-xl font-bold text-primary mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Calculus Corner (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">2. Description of Service</h2>
              <p>
                Calculus Corner provides users with access to a rich collection of resources, including educational content, videos, practice problems, and AI tutoring services. You understand and agree that the Service is provided "AS-IS" and that Calculus Corner assumes no responsibility for the timeliness, deletion, mis-delivery or failure to store any user communications or personalization settings.
              </p>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">3. User Conduct</h2>
              <p>
                You understand that all information, data, text, software, music, sound, photographs, graphics, video, messages or other materials ("Content"), whether publicly posted or privately transmitted, are the sole responsibility of the person from which such Content originated. You agree to not use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Upload, post, email, transmit or otherwise make available any Content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable;</li>
                <li>Harm minors in any way;</li>
                <li>Impersonate any person or entity;</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
              </ul>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">4. Intellectual Property</h2>
              <p>
                You acknowledge and agree that the Service and any necessary software used in connection with the Service ("Software") contain proprietary and confidential information that is protected by applicable intellectual property and other laws.
              </p>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">5. Disclaimer of Warranties</h2>
              <p>
                YOU EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. CALCULUS CORNER EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.
              </p>

              <h2 className="text-xl font-bold text-primary mt-8 mb-4">6. Limitation of Liability</h2>
              <p>
                YOU EXPRESSLY UNDERSTAND AND AGREE THAT CALCULUS CORNER SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES RESULTING FROM THE USE OR THE INABILITY TO USE THE SERVICE.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
