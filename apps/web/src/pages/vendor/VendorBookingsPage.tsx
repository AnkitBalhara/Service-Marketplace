import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Booking, BookingTimelineItem, PaymentRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TimelineView } from '../../components/common/TimelineView';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Check,
  UserX,
  Banknote,
  Eye,
  Phone,
} from 'lucide-react';
import {
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';

export const VendorBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detail Drawer State
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<{
    booking: Booking;
    timeline: BookingTimelineItem[];
    payment?: PaymentRecord;
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);

  // Reject / Reason Dialog State
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/vendor/bookings', {
        params: { status: statusFilter || undefined },
      });
      setBookings(data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openDrawer = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setDrawerLoading(true);
    try {
      const { data } = await apiClient.get(`/bookings/${bookingId}`);
      setBookingDetail(data.data);
    } catch {
      setBookingDetail(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/confirm`, { reason: 'Vendor accepted booking' });
      fetchBookings();
      if (selectedBookingId === bookingId) openDrawer(bookingId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to confirm booking');
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/complete`, { reason: 'Service delivery completed' });
      fetchBookings();
      if (selectedBookingId === bookingId) openDrawer(bookingId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to mark completed');
    }
  };

  const handleNoShow = async (bookingId: string) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/no-show`, { reason: 'Customer did not show up' });
      fetchBookings();
      if (selectedBookingId === bookingId) openDrawer(bookingId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to mark no-show');
    }
  };

  const handleCollectPayment = async (bookingId: string) => {
    try {
      await apiClient.post(`/bookings/${bookingId}/collect-payment`);
      fetchBookings();
      if (selectedBookingId === bookingId) openDrawer(bookingId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to collect payment');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/bookings/${rejectTarget._id}/reject`, {
        reason: rejectReason.trim() || 'Vendor declined appointment',
      });
      setRejectTarget(null);
      setRejectReason('');
      fetchBookings();
      if (selectedBookingId) openDrawer(selectedBookingId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reject booking');
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
              Vendor Appointments (M6 Fulfillment)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Confirm incoming bookings, deliver services, mark completion, or collect offline payments.
            </p>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((st) => (
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
                {st === '' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <LoadingScreen message="Loading vendor appointments..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description="No customer bookings match your current filter."
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isPending = booking.status === 'PENDING';
              const isConfirmed = booking.status === 'CONFIRMED';
              const isPayAfter = booking.paymentMode === 'PAY_AFTER';

              return (
                <div
                  key={booking._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {booking.bookingNumber}
                      </span>
                      <StatusBadge status={booking.status} />
                      <span className="text-xs text-slate-500 font-medium">
                        Payment: <strong>{booking.paymentMode}</strong> (₹{(booking.price / 100).toFixed(2)})
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {booking.serviceId?.title} — <span className="text-indigo-600 font-semibold">{booking.offeringId?.name}</span>
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {booking.customerId?.name} ({booking.customerId?.phone || 'No phone'})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {booking.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {booking.startTime} – {booking.endTime}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-700 italic">
                        Note: "{booking.notes}"
                      </p>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openDrawer(booking._id)}
                      startIcon={<Eye className="w-3.5 h-3.5" />}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px' }}
                    >
                      Timeline
                    </Button>

                    {/* If PENDING: Vendor can CONFIRM or REJECT */}
                    {isPending && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleConfirm(booking._id)}
                          startIcon={<Check className="w-3.5 h-3.5" />}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 600 }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => setRejectTarget(booking)}
                          startIcon={<XCircle className="w-3.5 h-3.5" />}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px' }}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {/* If CONFIRMED: Vendor can COMPLETE, NO-SHOW, or COLLECT PAYMENT */}
                    {isConfirmed && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleComplete(booking._id)}
                          startIcon={<CheckCircle className="w-3.5 h-3.5" />}
                          sx={{
                            backgroundColor: '#4f46e5',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                          }}
                        >
                          Mark Delivered
                        </Button>

                        {isPayAfter && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={() => handleCollectPayment(booking._id)}
                            startIcon={<Banknote className="w-3.5 h-3.5" />}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 600 }}
                          >
                            Mark Cash Collected
                          </Button>
                        )}

                        <Button
                          size="small"
                          variant="text"
                          color="inherit"
                          onClick={() => handleNoShow(booking._id)}
                          startIcon={<UserX className="w-3.5 h-3.5" />}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
                        >
                          No Show
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline & Detail Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedBookingId)}
        onClose={() => setSelectedBookingId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4 } }}
      >
        {drawerLoading || !bookingDetail ? (
          <LoadingScreen message="Loading appointment details..." />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {bookingDetail.booking.bookingNumber}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {bookingDetail.booking.serviceId?.title}
                </h2>
              </div>
              <StatusBadge status={bookingDetail.booking.status} />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-600 border border-slate-200">
              <p><strong>Customer:</strong> {bookingDetail.booking.customerId?.name} ({bookingDetail.booking.customerId?.phone || 'No phone'})</p>
              <p><strong>Email:</strong> {bookingDetail.booking.customerId?.email}</p>
              <p><strong>Date & Time:</strong> {bookingDetail.booking.date} · {bookingDetail.booking.startTime} - {bookingDetail.booking.endTime}</p>
              <p><strong>Price:</strong> ₹{(bookingDetail.booking.price / 100).toFixed(2)} ({bookingDetail.booking.paymentMode})</p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Lifecycle Timeline History
              </h3>
              <TimelineView items={bookingDetail.timeline} />
            </div>
          </div>
        )}
      </Drawer>

      {/* Reject Modal */}
      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-900">Decline Booking</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <p className="text-xs text-slate-600">
            Provide a reason for declining appointment <strong>{rejectTarget?.bookingNumber}</strong>:
          </p>
          <TextField
            label="Reason for Declining"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Schedule fully booked, stylist unavailable..."
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
            onClick={handleRejectConfirm}
            disabled={actionLoading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {actionLoading ? 'Declining...' : 'Confirm Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
