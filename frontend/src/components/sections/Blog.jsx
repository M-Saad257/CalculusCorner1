import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Calendar, User } from 'lucide-react';
import Button from '../ui/Button';

const articles = [
  {
    id: 1,
    title: 'Top 5 Strategies to Ace Your Board Exams',
    excerpt: 'Discover proven techniques to maximize your study efficiency and perform your best when it matters most.',
    category: 'Exam Tips',
    date: 'Oct 15, 2023',
    author: 'Dr. Saad',
    image: 'bg-blue-100'
  },
  {
    id: 2,
    title: 'How AI is Changing Mathematics Education',
    excerpt: 'Explore the future of learning with artificial intelligence and how our new tools can help you master calculus faster.',
    category: 'AI Insights',
    date: 'Nov 02, 2023',
    author: 'Tech Team',
    image: 'bg-purple-100'
  },
  {
    id: 3,
    title: 'Mental Math Tricks You Should Know',
    excerpt: 'Save precious minutes during your exams with these simple yet effective mental calculation techniques.',
    category: 'Math Tricks',
    date: 'Nov 20, 2023',
    author: 'Dr. Saad',
    image: 'bg-yellow-100'
  }
];

const Blog = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="blog" className="py-10 md:py-16 bg-bg-secondary/70 backdrop-blur-[2px] relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-left">
          <div>
            <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
              Latest Insights
            </span>
            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight">
              Educational <span className="text-gradient">Articles</span>
            </h2>
          </div>
          <Button variant="outline" className="self-start md:self-auto px-5 py-2.5 text-sm">
            View All Articles
          </Button>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {articles.map((article) => (
            <motion.article 
              key={article.id} 
              variants={itemVariants} 
              className="group bg-bg-color rounded-2xl overflow-hidden border border-border-color shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col text-left"
            >
              <div className={`w-full aspect-video bg-gradient-to-br from-white/50 to-slate-200/50 ${article.image}`} />
              
              <div className="p-6 flex flex-col grow">
                <span className="inline-block text-xxs font-extrabold tracking-wider uppercase text-primary mb-2">
                  {article.category}
                </span>
                <h3 className="font-display font-bold text-xl text-text-primary leading-snug mb-3">
                  {article.title}
                </h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed mb-6 grow">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center gap-4 pb-4 mb-4 border-b border-border-color text-xs text-text-tertiary">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{article.author}</span>
                  </div>
                </div>
                
                <a href="#" className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:text-primary-dark transition-colors duration-200">
                  Read Full Article 
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </a>
              </div>
            </motion.article>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default Blog;
