import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const AiTutor = () => {
  const [inputValue, setInputValue] = useState('x² + 5x + 6 = 0');
  const [isSolving, setIsSolving] = useState(false);
  const [stepsRevealed, setStepsRevealed] = useState(0);
  const [chatStarted, setChatStarted] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const solutionSteps = [
    "Analyzing the quadratic equation...",
    "Step 1: Identify coefficients a=1, b=5, c=6.",
    "Step 2: Find two numbers that multiply to 6 and add up to 5.",
    "Step 3: Those numbers are 2 and 3.",
    "Step 4: Rewrite the middle term: x² + 2x + 3x + 6 = 0",
    "Step 5: Factor by grouping: x(x + 2) + 3(x + 2) = 0",
    "Final Result: (x + 2)(x + 3) = 0. Therefore, x = -2 or x = -3."
  ];

  const handleSolve = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSolving) return;
    
    setChatStarted(true);
    setIsSolving(true);
    setStepsRevealed(0);
    setShowLoginPrompt(false);

    // Simulate step-by-step generation
    solutionSteps.forEach((_, index) => {
      setTimeout(() => {
        setStepsRevealed(index + 1);
        if (index === solutionSteps.length - 1) {
          setIsSolving(false);
          const token = localStorage.getItem('token');
          if (!token) {
            setShowLoginPrompt(true);
          }
        }
      }, (index + 1) * 800); // 800ms per step
    });
  };

  return (
    <section id="ai" className="py-16 md:py-24 bg-bg-secondary overflow-hidden" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        
        {/* Left column: Information */}
        <motion.div 
          className="flex flex-col text-left"
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.6 }}
        >
          {showLoginPrompt ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-4">
                Ready to unlock?
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-6 leading-tight">
                Solve Your <span className="text-gradient">Complex Equations</span>
              </h2>
              <div className="bg-white border border-border-color rounded-3xl p-6 md:p-8 shadow-sm">
                <ol className="list-decimal list-inside flex flex-col gap-5 text-text-secondary text-base md:text-lg">
                  <li><span className="font-semibold text-text-primary">First, <Link to="/auth" className="text-primary hover:underline font-bold">Log In</Link> to your account.</span></li>
                  <li><span className="font-semibold text-text-primary">Go to the <span className="text-primary font-bold">AI Tutor</span> in the sidebar of your dashboard.</span></li>
                  <li><span className="font-semibold text-text-primary">Use the AI to solve your complex equations instantly!</span></li>
                </ol>
                <Link to="/auth" className="mt-8 block w-full">
                  <Button variant="primary" className="w-full text-center py-3 flex justify-center text-base">Log In Now</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-4">
                Free Tool
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-6 leading-tight">
                Meet Your <span className="text-gradient">AI Math Tutor</span>
              </h2>
              <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-8">
                Stuck on a problem at 2 AM with no tutor in sight? Our AI doesn't just hand you the answer, it walks you through the full solution, step by step, so you actually understand what happened.
              </p>
              <ul className="list-none p-0 m-0 flex flex-col gap-4">
                <li className="flex items-center gap-3 font-semibold text-text-primary text-base md:text-lg">
                  <Sparkles size={18} className="text-primary flex-shrink-0" />
                  <span>Instant Step-by-Step Solutions</span>
                </li>
                <li className="flex items-center gap-3 font-semibold text-text-primary text-base md:text-lg">
                  <Sparkles size={18} className="text-primary flex-shrink-0" />
                  <span>Supports Algebra, Calculus & Trig</span>
                </li>
                <li className="flex items-center gap-3 font-semibold text-text-primary text-base md:text-lg">
                  <Sparkles size={18} className="text-primary flex-shrink-0" />
                  <span>24/7 Availability</span>
                </li>
              </ul>
            </div>
          )}
        </motion.div>

        {/* Right column: Interactive Demo */}
        <motion.div 
          className="w-full max-w-lg mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="rounded-3xl overflow-hidden shadow-xl border border-border-color bg-white flex flex-col h-[500px]">
            
            <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-primary to-primary-dark text-white">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 shadow-inner">
                <Bot size={24} />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-display font-bold text-base text-white leading-tight">Calculus Corner AI</h3>
                <span className="text-xs text-white/80 font-medium">Always active</span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="grow p-6 overflow-y-auto flex flex-col gap-4 bg-bg-tertiary/60">
              <div className="flex items-end gap-2 max-w-[85%] text-left">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white shrink-0 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="p-3 px-4 rounded-2xl rounded-bl-sm bg-white text-text-primary text-sm md:text-base border border-border-color shadow-sm leading-relaxed">
                  Hi! I'm your AI Math Tutor. What problem can I help you solve today?
                </div>
              </div>

              <AnimatePresence>
                {chatStarted && (
                  <motion.div 
                    className="flex items-end gap-2 max-w-[85%] self-end text-left flex-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="p-3 px-4 rounded-2xl rounded-br-sm bg-primary text-white text-sm md:text-base shadow-sm border-0 leading-relaxed">
                      Solve: {inputValue}
                    </div>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-text-tertiary text-white shrink-0 shadow-sm">
                      <User size={16} />
                    </div>
                  </motion.div>
                )}

                {stepsRevealed > 0 && (
                  <motion.div 
                    className="flex items-end gap-2 max-w-[85%] text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white shrink-0 shadow-sm">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl rounded-bl-sm bg-slate-50 text-text-primary text-sm md:text-base border border-border-color shadow-sm flex flex-col gap-2 font-mono w-full leading-relaxed">
                      {solutionSteps.slice(0, stepsRevealed).map((step, idx) => (
                        <motion.p 
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={idx === solutionSteps.length - 1 ? 'font-bold text-primary mt-2 pt-2 border-t border-border-color/60' : ''}
                        >
                          {step}
                        </motion.p>
                      ))}
                      {isSolving && <span className="inline-block animate-pulse font-bold text-primary">...</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Form Footer */}
            <div className="p-4 bg-white border-t border-border-color">
              <form onSubmit={handleSolve} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a math question..."
                  className="grow px-4 py-2.5 border border-border-color rounded-full font-sans text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-inner transition-all duration-200"
                  disabled={isSolving}
                />
                <button 
                  type="submit" 
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white border-0 shadow-md cursor-pointer hover:bg-primary-dark disabled:bg-text-tertiary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" 
                  disabled={isSolving || !inputValue}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AiTutor;
