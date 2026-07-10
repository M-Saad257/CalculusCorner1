
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  let baseStyle = "items-center justify-center font-sans font-semibold rounded-full transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 border-0 active:scale-[0.98]";
  
  if (!/\b(hidden|flex|inline-flex|block|inline-block|grid)\b/.test(className)) {
    baseStyle = "inline-flex " + baseStyle;
  }
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-glow hover:-translate-y-0.5 animate-pulse-primary",
    secondary: "bg-bg-color text-primary border border-border-color shadow-sm hover:bg-bg-secondary hover:border-primary-light hover:-translate-y-0.5",
    outline: "bg-transparent text-text-primary border-2 border-border-color hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-primary"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const widthStyle = fullWidth ? "w-full" : "";
  
  const btnClass = `${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthStyle} ${className}`;
  
  return (
    <button className={btnClass} {...props}>
      {children}
    </button>
  );
};

export default Button;
