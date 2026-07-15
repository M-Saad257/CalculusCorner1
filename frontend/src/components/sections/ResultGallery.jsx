import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quote, Trophy, Medal } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Ahmad Khan',
    grade: 'A+ Grade (98%)',
    board: 'Federal Board',
    content: 'Calculus Corner completely changed my perspective on math. The step-by-step videos and past paper solutions helped me secure a top position in my board exams.',
    type: 'topper'
  },
  {
    id: 2,
    name: 'Fatima Ali',
    grade: 'ECAT Topper',
    board: 'UET Lahore',
    content: 'The shortcut tricks taught here for the Entry Test are unmatched. I was able to solve complex MCQs in under 30 seconds!',
    type: 'topper'
  },
  {
    id: 3,
    name: 'Zainab Qureshi',
    grade: 'A Grade',
    board: 'Sindh Board',
    content: 'I used to have severe math anxiety. The AI tutor and the interactive lessons made everything so clear. Highly recommended!',
    type: 'student'
  }
];

const ResultGallery = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="py-10 md:py-16 bg-bg-color relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">
            Hall of Fame
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            Our Student <span className="text-gradient">Achievements</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Join thousands of students who have conquered their math anxiety and secured top positions in Board and Entry Test exams.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {testimonials.map((testimonial) => (
            <motion.div 
              key={testimonial.id} 
              variants={cardVariants} 
              className={`flex flex-col p-8 rounded-3xl border shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 text-left ${
                testimonial.type === 'topper' 
                  ? 'bg-gradient-to-tr from-blue-50/40 via-white to-white border-primary/20 shadow-md' 
                  : 'bg-bg-secondary border-border-color'
              }`}
            >
              <div className="mb-6">
                <Quote size={24} className="text-primary-light/50" />
              </div>
              
              <p className="text-sm md:text-base text-text-secondary leading-relaxed italic grow mb-6">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4 pt-6 border-t border-border-color/60 mt-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-display font-bold text-lg shrink-0 shadow-sm">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-sans font-bold text-sm md:text-base text-text-primary mb-0.5">{testimonial.name}</h4>
                  <div className="flex items-center gap-1 mt-0.5 text-text-secondary text-xs font-semibold">
                    {testimonial.type === 'topper' ? (
                      <Trophy size={14} className="text-accent fill-accent/10" />
                    ) : (
                      <Medal size={14} className="text-primary" />
                    )}
                    <span>{testimonial.grade} - {testimonial.board}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default ResultGallery;
