import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, SEEDED_PERSONAS } from '../../contexts/AuthContext';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Sparkles, Lock, Mail, ArrowRight, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('superadmin@marketplace.com');
  const [password, setPassword] = useState<string>('Password123!');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = async (personaEmail: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await quickLogin(personaEmail);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to MarketPulse</h2>
          <p className="text-xs text-slate-500">
            Access your customer bookings, vendor management, or platform administration.
          </p>
        </div>

        {/* Quick Persona Evaluator Box */}
        <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
            <span>Reviewer 1-Click Quick Login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEEDED_PERSONAS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleQuickPersona(p.email)}
                className="p-2 text-left rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs group"
              >
                <span className="font-bold text-slate-800 block truncate group-hover:text-indigo-600">
                  {p.name}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">{p.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Regular Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Demo Password: Password123!</span>
              <Link to="/forgot-password" className="text-indigo-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

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
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
