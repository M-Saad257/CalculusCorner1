import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, ArrowLeft, Copy, CheckCircle2, XCircle, Loader2, Award, GraduationCap, Calendar, Hash } from 'lucide-react';
import api from '../services/api';

const VerifyCertificate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/verify-certificate/${certId.trim().toUpperCase()}`);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found. Please check the Certificate ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if ID passed in URL query
  React.useEffect(() => {
    if (searchParams.get('id')) handleVerify();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(result?.certificateId || certId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-bg-color text-text-primary font-sans">
      {/* Header */}
      <header className="border-b border-border-color bg-bg-color/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-border-color bg-bg-secondary hover:bg-bg-tertiary transition-all cursor-pointer text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-500" size={22} />
          <h1 className="font-display font-black text-lg text-text-primary">Certificate Verification</h1>
        </div>
        <span className="ml-auto text-xs text-text-tertiary font-medium">Calculus Corner</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/20">
            <ShieldCheck size={40} />
          </div>
          <h2 className="font-display font-black text-3xl text-text-primary mb-2">Verify a Certificate</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
            Enter the Certificate ID to instantly verify the authenticity of any Calculus Corner certificate.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleVerify} className="bg-bg-secondary border border-border-color rounded-3xl p-6 shadow-sm mb-6">
          <label className="block text-xs font-extrabold uppercase tracking-widest text-text-tertiary mb-2">
            Certificate ID
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={certId}
              onChange={e => setCertId(e.target.value.toUpperCase())}
              placeholder="e.g. CCAB-4829"
              className="flex-1 px-4 py-3 rounded-2xl border border-border-color bg-bg-color text-text-primary text-sm font-bold placeholder:font-normal placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all tracking-widest"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !certId.trim()}
              className="px-5 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer border-0 shadow-md"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Verify
            </button>
          </div>
          <p className="text-[11px] text-text-tertiary mt-3">
            Format: <span className="font-mono font-bold text-text-secondary">CCXX-0000</span> — found on every Calculus Corner certificate
          </p>
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fadeIn">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-text-secondary text-sm font-medium">Verifying certificate...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-3xl p-6 flex items-start gap-4 animate-fadeIn">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-500 flex items-center justify-center shrink-0">
              <XCircle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-red-600 dark:text-red-400 text-sm mb-1">Certificate Not Found</h3>
              <p className="text-red-500/80 dark:text-red-400/70 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Success Result */}
        {!loading && result && (
          <div className="animate-fadeIn">
            {/* Verified Banner */}
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-5 py-3 mb-4">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm tracking-wide">VERIFIED ✓ — This is a valid Calculus Corner certificate</span>
            </div>

            {/* Certificate Card */}
            <div className="bg-bg-secondary border border-border-color rounded-3xl overflow-hidden shadow-sm">
              {/* Top gradient bar */}
              <div className={`h-2 w-full ${result.type === 'achievement' ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600' : 'bg-gradient-to-r from-primary to-primary-dark'}`} />

              <div className="p-6 flex flex-col gap-5">
                {/* Badge/Course Icon */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${result.type === 'achievement' ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white' : 'bg-gradient-to-br from-primary to-primary-dark text-white'}`}>
                    {result.type === 'achievement' ? <Award size={28} /> : <GraduationCap size={28} />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${result.type === 'achievement' ? 'text-amber-500' : 'text-primary'}`}>
                      {result.type === 'achievement' ? 'Achievement Badge Certificate' : 'Course Completion Certificate'}
                    </span>
                    <h3 className="font-display font-black text-xl text-text-primary leading-tight">{result.certificateName}</h3>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border-color" />

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={<span className="text-lg">👤</span>} label="Student Name" value={result.studentName} />
                  <InfoRow icon={<Calendar size={15} className="text-primary" />} label="Issue Date" value={formatDate(result.issuedAt)} />
                  <InfoRow icon={<Hash size={15} className="text-primary" />} label="Certificate ID" value={result.certificateId} mono />
                  <InfoRow icon={<ShieldCheck size={15} className="text-emerald-500" />} label="Status" value="Verified ✓" green />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-border-color">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border-color bg-bg-color hover:bg-bg-tertiary text-text-primary text-xs font-bold transition-all cursor-pointer"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Certificate ID'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-text-tertiary mt-4">
              This certificate was issued by <span className="font-bold text-text-secondary">Calculus Corner</span> and is permanently recorded in our system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, mono, green }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
      {icon} {label}
    </span>
    <span className={`text-sm font-bold ${green ? 'text-emerald-500' : 'text-text-primary'} ${mono ? 'font-mono tracking-widest' : ''}`}>
      {value}
    </span>
  </div>
);

export default VerifyCertificate;
