import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import Button from '../ui/Button';

const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/Thecalculuscornerofficial@gmail.com';
const INITIAL_FORM = { name: '', email: '', phone: '', subject: 'Course Inquiry', message: '' };

const Contact = () => {
  const { content } = useContent();
  const contactData = content?.contact || {};

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(FORMSUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || 'Not provided',
          subject: form.subject,
          message: form.message,
          _subject: `[Calculus Corner] ${form.subject} — from ${form.name}`,
          _captcha: 'false',
          _template: 'table',
        }),
      });

      const data = await res.json();

      if (data.success === 'true' || data.success === true) {
        setStatus('success');
        setForm(INITIAL_FORM);
      } else {
        throw new Error(data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again later.');
    }
  };

  const targetEmail = contactData.email || 'calculuscorner.official@gmail.com';
  const emailSubject = encodeURIComponent('Inquiry from Calculus Corner');
  const emailBody = encodeURIComponent('Hi Calculus Corner Team,\n\nI am reaching out to learn more about your courses. Please provide me with more information.\n\nThank you!');
  const mailtoLink = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

  const rawPhone = contactData.phone || '+92 302 8983263';
  const whatsappNumber = rawPhone.replace(/[^0-9]/g, '');
  const whatsappMessage = encodeURIComponent('Hi Calculus Corner Team! I am interested in your courses and would like to know more.');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;


  return (
    <section id="contact" className="py-10 md:py-16 bg-bg-secondary/70 backdrop-blur-[2px] relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            {contactData.badge || 'Get in Touch'}
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            {contactData.heading || "Ready to Start Your"}{' '}
            <span className="text-gradient">{contactData.heading_gradient || "Math Journey?"}</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            {contactData.subheading || 'Got a question about a course, the AI tools, or pricing? Send us a message and someone from our team will get back to you quickly.'}
          </p>
        </div>

        <motion.div 
          className="w-full max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Elegant Contact Cards */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row bg-bg-color rounded-3xl shadow-xl border border-border-color overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary to-emerald-500"></div>

            {/* Email Section */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-b sm:border-b-0 sm:border-r border-border-color/60 hover:bg-bg-secondary/30 transition-colors group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Mail size={32} />
              </div>
              <h3 className="font-display font-bold text-xl text-text-primary mb-2">Email Support</h3>
              <p className="text-sm text-text-secondary mb-6 max-w-[250px] mx-auto">Drop us an email anytime and we'll get back to you within 24 hours.</p>
              <a 
                href={mailtoLink}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-sm hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
              >
                Email Us
              </a>
            </div>

            {/* Phone Section */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 hover:bg-bg-secondary/30 transition-colors group">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Phone size={32} />
              </div>
              <h3 className="font-display font-bold text-xl text-text-primary mb-2">Contact Support</h3>
              <p className="text-sm text-text-secondary mb-6 max-w-[250px] mx-auto">Need immediate assistance? Feel free to message us on WhatsApp.</p>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-colors"
              >
              Contact Us
              </a>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default Contact;
