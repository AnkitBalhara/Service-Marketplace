import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Sparkles, ArrowLeft, MailCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [debugLink, setDebugLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
      if (data.data?.debugLink) {
        setDebugLink(data.data.debugLink);
      }
    } catch {
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-500">
            Enter your email address to generate an expiring single-use reset link.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <MailCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Reset Token Generated</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                As per the project requirements (M1 STRETCH), the expiring reset link has been printed to the server terminal console.
              </p>

              {debugLink && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-mono break-all text-indigo-700">
                  {debugLink}
                </div>
              )}

              <Link to="/login" className="inline-block mt-2">
                <Button variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px' }}>
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer1@marketplace.com"
                required
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                size="large"
                sx={{
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' },
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.3,
                }}
              >
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Generate Reset Link'}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
