import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Sparkles, User, Building } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<number>(0); // 0 = Customer, 1 = Vendor

  // Customer Form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  // Vendor Form
  const [vendorForm, setVendorForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    contactNumber: '',
    address: '',
    timezone: 'Asia/Kolkata',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/register/customer', customerForm);
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/register/vendor', vendorForm);
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      await refreshUser();
      navigate('/vendor/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Vendor registration failed');
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your Account</h2>
          <p className="text-xs text-slate-500">
            Join MarketPulse as a Customer or apply to list your business as a Vendor.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <Tabs
            value={tab}
            onChange={(_, val) => {
              setTab(val);
              setError(null);
            }}
            variant="fullWidth"
            sx={{
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.85rem' },
            }}
          >
            <Tab icon={<User className="w-4 h-4 mr-1.5 inline" />} label="Customer Sign Up" />
            <Tab icon={<Building className="w-4 h-4 mr-1.5 inline" />} label="Vendor Sign Up" />
          </Tabs>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Customer Tab */}
          {tab === 0 && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <TextField
                label="Full Name"
                fullWidth
                size="small"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                required
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                size="small"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                required
              />
              <TextField
                label="Password (min 8 characters)"
                type="password"
                fullWidth
                size="small"
                value={customerForm.password}
                onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                required
              />
              <TextField
                label="Phone Number (Optional)"
                fullWidth
                size="small"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
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
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Register as Customer'}
              </Button>
            </form>
          )}

          {/* Vendor Tab */}
          {tab === 1 && (
            <form onSubmit={handleVendorSubmit} className="space-y-4">
              <TextField
                label="Contact Person Name"
                fullWidth
                size="small"
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                required
              />
              <TextField
                label="Business / Store Name"
                fullWidth
                size="small"
                value={vendorForm.businessName}
                onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                required
              />
              <TextField
                label="Business Email"
                type="email"
                fullWidth
                size="small"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                required
              />
              <TextField
                label="Password (min 8 characters)"
                type="password"
                fullWidth
                size="small"
                value={vendorForm.password}
                onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                required
              />
              <TextField
                label="Business Phone Number"
                fullWidth
                size="small"
                value={vendorForm.contactNumber}
                onChange={(e) => setVendorForm({ ...vendorForm, contactNumber: e.target.value })}
                required
              />
              <TextField
                label="Physical Address"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={vendorForm.address}
                onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                required
              />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800">
                Note: Vendor accounts enter <strong>PENDING</strong> review upon signup.
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
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Submit Vendor Application'}
              </Button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
