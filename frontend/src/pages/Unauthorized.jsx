import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    // Check tokens and send user to correct place
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        if (decoded.role === 'admin') {
          return navigate('/admin');
        }
      } catch (e) {
      }
    }
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-bg-color overflow-hidden font-sans text-text-primary">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-radial from-red-500/10 to-transparent z-0 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-radial from-primary-light/10 to-transparent z-0 pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md mx-4 my-12">
        <div className="p-8 md:p-10 rounded-3xl glass flex flex-col gap-6 text-center border border-white/40 shadow-xl bg-white/70 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert size={32} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-display font-black text-2.5xl text-text-primary">Access Denied</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              You do not have the permissions required to access this resource. Please make sure you are logged in with the correct role.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Button variant="primary" onClick={handleBackToDashboard} className="w-full py-3">
              Go to Workspace
            </Button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 text-text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer text-sm font-semibold py-2"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
