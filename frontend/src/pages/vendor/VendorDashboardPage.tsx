import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import {
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building,
  MapPin,
  Phone,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, TextField, Alert } from '@mui/material';

export const VendorDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactNumber: '',
    address: '',
    timezone: 'Asia/Kolkata',
  });
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get('/vendor/profile');
        setProfile(data.data);
        setFormData({
          businessName: data.data.businessName || '',
          contactNumber: data.data.contactNumber || '',
          address: data.data.address || '',
          timezone: data.data.timezone || 'Asia/Kolkata',
        });
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg(null);
    try {
      const { data } = await apiClient.patch('/vendor/profile', formData);
      setProfile(data.data);
      setIsEditing(false);
      setSuccessMsg('Business profile updated successfully.');
      refreshUser();
    } catch {
      // ignore
    } finally {
      setSaveLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading vendor profile..." />;
  }

  const status = profile?.status || user?.vendor?.status || 'PENDING';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Onboarding Status Banner (M3 Requirement) */}
        {status === 'PENDING' && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-amber-900">Application Under Review</h3>
                <StatusBadge status="PENDING" size="small" />
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your business profile has been submitted and is currently awaiting verification by platform administrators.
                During this period, you can manage your profile, but publishing services and taking live bookings is blocked.
              </p>
              <div className="pt-2 text-xs text-amber-900 font-semibold">
                Tip: You can switch to the <strong>Sarah SuperAdmin</strong> persona to approve this vendor application.
              </div>
            </div>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-rose-900">Application Rejected</h3>
                <StatusBadge status="REJECTED" size="small" />
              </div>
              <p className="text-xs text-rose-800">
                Your vendor application was reviewed and rejected for the following reason:
              </p>
              <div className="bg-white/80 border border-rose-200 rounded-lg p-3 text-xs font-semibold text-rose-950 mt-2">
                "{profile?.rejectionReason || user?.vendor?.rejectionReason || 'Documents could not be verified'}"
              </div>
            </div>
          </div>
        )}

        {status === 'APPROVED' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-emerald-900">Verified Business Partner</h3>
                  <StatusBadge status="APPROVED" size="small" />
                </div>
                <p className="text-xs text-emerald-700">
                  Your store is active. You can create services, set slot rules, and fulfill appointments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/vendor/services"
            className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              status === 'APPROVED'
                ? 'bg-white border-slate-200 hover:shadow-md hover:border-indigo-300 group'
                : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed pointer-events-none'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Services & Offerings</h3>
              <p className="text-xs text-slate-500">
                Manage service listings, durations, prices in integer minor units, and draft/published statuses.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 mt-4 block">Manage Catalogue →</span>
          </Link>

          <Link
            to="/vendor/availability"
            className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              status === 'APPROVED'
                ? 'bg-white border-slate-200 hover:shadow-md hover:border-indigo-300 group'
                : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed pointer-events-none'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Weekly Availability & Closures</h3>
              <p className="text-xs text-slate-500">
                Configure opening windows, slot capacities, and date holiday exceptions.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 mt-4 block">Edit Operating Rules →</span>
          </Link>

          <Link
            to="/vendor/bookings"
            className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              status === 'APPROVED'
                ? 'bg-white border-slate-200 hover:shadow-md hover:border-indigo-300 group'
                : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed pointer-events-none'
            }`}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Appointments & Fulfillment</h3>
              <p className="text-xs text-slate-500">
                Accept incoming bookings, mark completed, record no-shows, and collect cash payments.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 mt-4 block">View Bookings →</span>
          </Link>
        </div>

        {/* Business Profile Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Business Profile</h2>
              <p className="text-xs text-slate-500">Company contact details and operational timezone</p>
            </div>
            <Button
              size="small"
              variant={isEditing ? 'text' : 'outlined'}
              onClick={() => setIsEditing(!isEditing)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <TextField
                label="Business Name"
                fullWidth
                size="small"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
              <TextField
                label="Contact Phone"
                fullWidth
                size="small"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                required
              />
              <TextField
                label="Physical Address"
                fullWidth
                size="small"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <TextField
                label="Operating Timezone"
                fullWidth
                size="small"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                helperText="e.g. Asia/Kolkata, UTC, America/New_York"
                required
              />
              <Button
                type="submit"
                variant="contained"
                disabled={saveLoading}
                sx={{
                  backgroundColor: '#4f46e5',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                {saveLoading ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  <span><strong>Business Name:</strong> {profile?.businessName || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span><strong>Contact Number:</strong> {profile?.contactNumber || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span><strong>Address:</strong> {profile?.address || '—'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span><strong>Timezone:</strong> {profile?.timezone || 'Asia/Kolkata'}</span>
                </div>
                <div>
                  <span className="font-bold block mb-1">Attached Verification Documents:</span>
                  {!profile?.documents || profile.documents.length === 0 ? (
                    <span className="text-slate-400 italic">No documents attached.</span>
                  ) : (
                    <div className="space-y-1">
                      {profile.documents.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-indigo-600">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{doc.filename} ({doc.type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
