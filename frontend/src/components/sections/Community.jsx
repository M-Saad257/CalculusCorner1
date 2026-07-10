import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, Target } from 'lucide-react';
import { FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';

const communityPlatforms = [
  {
    name: 'YouTube',
    icon: FaYoutube,
    stats: '58.4K',
    label: 'Subscribers',
    actionText: 'Subscribe Now',
    themeColor: 'hover:border-[#FF0000] hover:text-[#FF0000]',
    iconBg: 'bg-[#FF0000]',
    url: 'https://www.youtube.com/@Calculus.Corner',
    barColor: 'bg-[#FF0000]'
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    stats: '10K+',
    label: 'Active Members',
    actionText: 'Join Community',
    themeColor: 'hover:border-[#25D366] hover:text-[#25D366]',
    iconBg: 'bg-[#25D366]',
    url: 'https://whatsapp.com/channel/0029VaE4Wcn8KMqo8oK8LH18',
    barColor: 'bg-[#25D366]'
  },
  {
    name: 'Instagram',
    icon: FaInstagram,
    stats: '25K',
    label: 'Followers',
    actionText: 'Follow Us',
    themeColor: 'hover:border-[#E1306C] hover:text-[#E1306C]',
    iconBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    url: 'https://instagram.com/calculus.corner?igsh=cmtmdTY0YmVqYnJx',
    barColor: 'bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]'
  },
  {
    name: 'X (Twitter)',
    icon: FaTwitter,
    stats: '12K',
    label: 'Followers',
    actionText: 'Follow Updates',
    themeColor: 'hover:border-[#1DA1F2] hover:text-[#1DA1F2]',
    iconBg: 'bg-[#1DA1F2]',
    url: 'https://x.com/CalculusCorner',
    barColor: 'bg-[#1DA1F2]'
  }
];

const Community = () => {
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section id="community" className="py-16 md:py-15 bg-bg-color relative" ref={containerRef}>
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3 px-3 py-1 bg-primary/10 rounded-full">
            Join The Club
          </span>
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-primary mb-4 leading-tight">
            A Community of <span className="text-gradient">Math Enthusiasts</span>
          </h2>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            You don't have to study alone. Join thousands of students already learning together, asking questions, and sharing resources on our platforms.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {communityPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <motion.a 
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer" 
                variants={itemVariants} 
                className={`group flex flex-col p-8 rounded-2xl bg-white/70 border border-border-color transition-all duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden glass ${platform.themeColor}`}
              >
                {/* Hover top bar indicator */}
                <div className={`absolute top-0 left-0 w-full h-[4px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ${platform.barColor}`} />

                <div className="flex items-center gap-4 mb-8">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-full text-white shadow-sm ${platform.iconBg} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={26} />
                  </div>
                  <span className="font-bold text-lg text-text-primary group-hover:text-inherit transition-colors duration-200">
                    {platform.name}
                  </span>
                </div>

                <div className="flex flex-col text-left">
                  <h3 className="font-display font-black text-4xl text-text-primary mb-1 group-hover:text-inherit transition-colors duration-200">
                    {platform.stats}
                  </h3>
                  <p className="text-sm text-text-secondary mb-6 font-medium">
                    {platform.label}
                  </p>
                </div>

                <div className="font-bold text-sm text-text-primary mt-auto group-hover:text-inherit transition-colors duration-200">
                  {platform.actionText}
                </div>
              </motion.a>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};

export default Community;
