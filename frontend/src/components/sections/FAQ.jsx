import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, HelpCircle, LayoutGrid } from 'lucide-react';

const faqsData = [
  {
    id: 1,
    question: "What is Calculus Corner?",
    answer: "Calculus Corner is an online mathematics learning platform designed to help FSC, HSSC, and university students master mathematics through structured video lessons, practice questions, and progress tracking.",
    category: "General"
  },
  {
    id: 2,
    question: "Is Calculus Corner free?",
    answer: "Many learning resources are available for free. Premium courses and advanced content may require enrollment.",
    category: "General"
  },
  {
    id: 3,
    question: "Who can use Calculus Corner?",
    answer: "Anyone interested in learning mathematics can use the platform, including:\n\n• FSC Part I & II students\n• HSSC students\n• University students\n• Entry test aspirants\n• Teachers",
    category: "General"
  },
  {
    id: 4,
    question: "How do I start learning?",
    answer: "Simply create an account, choose your subject or chapter, and begin watching the lessons in order.",
    category: "Courses"
  },
  {
    id: 5,
    question: "Can I learn at my own pace?",
    answer: "Yes. You can watch lessons whenever you like and continue from where you left off.",
    category: "Courses"
  },
  {
    id: 6,
    question: "Do I receive a certificate?",
    answer: "Yes. Eligible learners can earn certificates after completing the required learning milestones.",
    category: "Certificates"
  },
  {
    id: 7,
    question: "Are the lessons organized chapter-wise?",
    answer: "Yes. All videos are organized into subjects, chapters, and topics, making learning simple and structured.",
    category: "Courses"
  },
  {
    id: 8,
    question: "Can I practice questions after watching lessons?",
    answer: "Yes. Calculus Corner provides practice questions and quizzes to help reinforce your understanding.",
    category: "Courses"
  },
  {
    id: 9,
    question: "Can I access Calculus Corner on my mobile phone?",
    answer: "Yes. The platform is fully responsive and works on desktops, tablets, and smartphones.",
    category: "Account"
  },
  {
    id: 10,
    question: "How is my progress tracked?",
    answer: "Your learning progress is automatically saved so you can easily continue from where you stopped.",
    category: "Account"
  },
  {
    id: 11,
    question: "Do I need any special software?",
    answer: "No. All you need is a modern web browser and an internet connection.",
    category: "Account"
  },
  {
    id: 12,
    question: "How can I contact Calculus Corner?",
    answer: "You can reach us through the Contact page or the support options available on the website.",
    category: "General"
  }
];

const categories = ["All", "General", "Courses", "Certificates", "Account"];

const FAQ = ({ isFullPage = false }) => {
  const [openId, setOpenId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFAQs = useMemo(() => {
    return faqsData.filter(faq => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="faq" className={`py-12 md:py-20 relative overflow-hidden bg-bg-color/80 dark:bg-slate-950/40 backdrop-blur-[2px] ${isFullPage ? 'min-h-[70vh]' : ''}`}>
      {/* Decorative ambient background glow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-4xl">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            <HelpCircle size={14} />
            Frequently Asked Questions
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary mb-4 leading-tight">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed">
            Everything you need to know about learning with Calculus Corner. Can't find the answer you're looking for? Contact our support team.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-bg-color border border-border-color rounded-2xl font-sans text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300 shadow-xs"
            />
          </div>

          {/* Categories select row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0 select-none no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenId(null); }}
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-bg-color text-text-secondary border-border-color hover:border-primary/45 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Questions List */}
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {filteredFAQs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  layout
                  className="border border-border-color bg-bg-color rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 md:py-5 flex items-center justify-between text-left gap-4 font-display font-bold text-sm md:text-base text-text-primary hover:text-primary bg-transparent border-0 cursor-pointer transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border-color transition-all duration-300 ${
                      isOpen ? 'bg-primary/5 border-primary/20 text-primary rotate-180' : 'text-text-tertiary'
                    }`}>
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-text-secondary leading-relaxed font-sans border-t border-border-color/40 whitespace-pre-line font-medium">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border-color rounded-2xl bg-bg-color">
              <p className="text-text-secondary font-bold text-sm">No FAQs found matching your query.</p>
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                className="mt-2 text-xs font-bold text-primary hover:underline bg-transparent border-0 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
