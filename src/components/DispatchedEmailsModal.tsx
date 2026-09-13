import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, X, Shield, Clock, ArrowRight, Check } from 'lucide-react';
import { getDispatchedEmails } from '../services/authService.ts';
import { DispatchedEmailTransmission } from '../types.ts';

interface DispatchedEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailFilter?: string;
  onSelectCode?: (code: string) => void;
}

export const DispatchedEmailsModal: React.FC<DispatchedEmailsModalProps> = ({
  isOpen,
  onClose,
  emailFilter,
  onSelectCode,
}) => {
  const [emails, setEmails] = useState<DispatchedEmailTransmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await getDispatchedEmails(emailFilter);
      setEmails(data);
    } catch (e) {
      console.error('Error loading dispatched transmissions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
      const interval = setInterval(fetchEmails, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, emailFilter]);

  if (!isOpen) return null;

  // Extract 6-digit code from body if present
  const extractCode = (body: string): string | null => {
    const match = body.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    if (onSelectCode) {
      onSelectCode(code);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mailbox-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-slide-up"
    >
      <div className="relative w-full max-w-lg bg-[#081528] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 id="mailbox-title" className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <span>ORCA SECURE DISPATCH REGISTER</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-xs text-white/50">
                Live backend outbound emails & OTP transmissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
              title="Refresh Transmissions"
              aria-label="Refresh Transmissions"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter notice */}
        {emailFilter && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
            <span>FILTERED FOR: {emailFilter}</span>
            <span className="text-white/40">{emails.length} transmitted</span>
          </div>
        )}

        {/* Transmission List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {emails.length === 0 ? (
            <div className="py-12 text-center text-white/40 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-white/20 animate-pulse" />
              <p className="text-xs">No email transmissions recorded yet.</p>
              <p className="text-[11px] text-white/30">
                Trigger an OTP, Sign Up, or Password Reset to view live outbound telemetry.
              </p>
            </div>
          ) : (
            emails.map((email) => {
              const code = extractCode(email.body);
              return (
                <div
                  key={email.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {email.subject}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase font-semibold">
                          {email.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/50 font-mono mt-0.5">
                        TO: <span className="text-white/80">{email.to}</span> •{' '}
                        {new Date(email.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {code && (
                      <button
                        onClick={() => handleCopyCode(email.id, code)}
                        className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                          copiedId === email.id
                            ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500'
                            : 'bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400'
                        }`}
                        title="Copy Code to Clipboard"
                      >
                        {copiedId === email.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <span>CODE: {code}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Body Preview */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-white/70 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                    {email.body}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Backend Cryptographic Verification Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
