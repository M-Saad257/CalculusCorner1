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

  return (
    <section id="contact" className="py-16 md:py-24 bg-bg-secondary relative" ref={containerRef}>
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
          className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 items-start"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Contact Info */}
          <motion.div variants={itemVariants} className="flex flex-col gap-6 w-full">
            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-border-color hover:translate-x-2 hover:border-primary-light transition-all duration-300 text-left">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-primary/10 to-primary-light/5 text-primary rounded-full shrink-0">
                <Mail size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-base md:text-lg text-text-primary mb-0.5">Email Us</h3>
                <p className="text-sm md:text-base text-text-secondary">{contactData.email || 'calculuscorner.official@gmail.com'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-border-color hover:translate-x-2 hover:border-primary-light transition-all duration-300 text-left">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-primary/10 to-primary-light/5 text-primary rounded-full shrink-0">
                <Phone size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-base md:text-lg text-text-primary mb-0.5">Call Us</h3>
                <p className="text-sm md:text-base text-text-secondary">{contactData.phone || '+92 302 8983263'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-border-color hover:translate-x-2 hover:border-primary-light transition-all duration-300 text-left">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-primary/10 to-primary-light/5 text-primary rounded-full shrink-0">
                <MapPin size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-base md:text-lg text-text-primary mb-0.5">Location</h3>
                <p className="text-sm md:text-base text-text-secondary">{contactData.address || 'Islamabad, Pakistan'}</p>
              </div>
            </div>
          </motion.div>
 
          {/* Contact Form */}
          <motion.div variants={itemVariants} className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-border-color glass w-full">

            {/* Success Banner */}
            {status === 'success' && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-green-50 border border-green-200 rounded-xl text-green-700">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Message sent successfully!</p>
                  <p className="text-xs mt-0.5">We'll get back to you as soon as possible.</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {status === 'error' && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Failed to send message</p>
                  <p className="text-xs mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="name" className="text-sm font-bold text-text-primary">Full Name</label>
                <input 
                  type="text" 
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="SamiUllah" 
                  className="w-full px-4 py-3 border border-border-color rounded-xl font-sans text-sm md:text-base text-text-primary bg-bg-secondary focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200" 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 text-left">
                  <label htmlFor="email" className="text-sm font-bold text-text-primary">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="example@gmail.com" 
                    className="w-full px-4 py-3 border border-border-color rounded-xl font-sans text-sm md:text-base text-text-primary bg-bg-secondary focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200" 
                  />
                </div>
                <div className="flex flex-col gap-2 text-left">
                  <label htmlFor="phone" className="text-sm font-bold text-text-primary">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+92000 0000000" 
                    className="w-full px-4 py-3 border border-border-color rounded-xl font-sans text-sm md:text-base text-text-primary bg-bg-secondary focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="subject" className="text-sm font-bold text-text-primary">Subject</label>
                <select 
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border-color rounded-xl font-sans text-sm md:text-base text-text-primary bg-bg-secondary focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                >
                  <option>Course Inquiry</option>
                  <option>Technical Support</option>
                  <option>Billing Question</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label htmlFor="message" className="text-sm font-bold text-text-primary">Message</label>
                <textarea 
                  id="message"
                  name="message"
                  rows="4"
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="How can we help you?" 
                  className="w-full px-4 py-3 border border-border-color rounded-xl font-sans text-sm md:text-base text-text-primary bg-bg-secondary focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 resize-y min-h-[120px] transition-all duration-200"
                ></textarea>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                disabled={status === 'loading'}
                className="flex items-center justify-center gap-2 mt-2"
              >
                {status === 'loading' ? (
                  <><Loader size={18} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={18} /> Send Message</>
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default Contact;
