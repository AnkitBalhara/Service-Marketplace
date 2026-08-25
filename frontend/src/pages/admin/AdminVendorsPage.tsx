import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';

export const AdminVendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/admin/vendors', {
        params: { status: statusFilter || undefined },
      });
      setVendors(data.data || []);
    } catch {
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleApprove = async (vendorId: string) => {
    try {
      await apiClient.post(`/admin/vendors/${vendorId}/approve`);
      fetchVendors();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve vendor');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setErrorMessage('A rejection reason is mandatory.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await apiClient.post(`/admin/vendors/${rejectTarget._id}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectTarget(null);
      setRejectReason('');
      fetchVendors();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Vendor Onboarding & Verification (M3)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review applicant business credentials, view licenses, approve or reject with clear reasons.
            </p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {st === '' ? 'All Vendors' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Vendors List */}
        {isLoading ? (
          <LoadingScreen message="Loading vendor applications..." />
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No Vendors Found"
            description="No vendor accounts match your selected filter."
          />
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-lg">{vendor.businessName}</h3>
                    <StatusBadge status={vendor.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Owner:</strong> {vendor.userId?.name} ({vendor.userId?.email})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Contact:</strong> {vendor.contactNumber}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Timezone:</strong> {vendor.timezone}
                    </span>
                    <span className="flex items-center gap-1.5 sm:col-span-2 md:col-span-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <strong>Address:</strong> {vendor.address}
                    </span>
                  </div>

                  {/* Attached Documents */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Submitted Documents ({vendor.documents?.length || 0})
                    </span>
                    {!vendor.documents || vendor.documents.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No verification files uploaded</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {vendor.documents.map((doc: any, i: number) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{doc.filename}</span>
                            <ExternalLink className="w-3 h-3 text-indigo-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {vendor.rejectionReason && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900">
                      <strong>Rejection Reason:</strong> "{vendor.rejectionReason}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {vendor.status !== 'APPROVED' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(vendor._id)}
                      startIcon={<CheckCircle className="w-4 h-4" />}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                    >
                      Approve
                    </Button>
                  )}

                  {vendor.status !== 'REJECTED' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setRejectTarget(vendor);
                        setRejectReason('');
                        setErrorMessage(null);
                      }}
                      startIcon={<XCircle className="w-4 h-4" />}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Dialog */}
      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-900">Reject Vendor Application</DialogTitle>
        <DialogContent className="space-y-3 pt-2">
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <p className="text-xs text-slate-600">
            Please enter a clear explanation for rejecting <strong>{rejectTarget?.businessName}</strong>. The vendor will be able to view this reason in their portal.
          </p>
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            size="small"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Unverifiable trade license or incomplete physical address..."
            required
          />
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-100">
          <Button onClick={() => setRejectTarget(null)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={actionLoading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
