import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Booking, BookingTimelineItem, PaymentRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TimelineView } from '../../components/common/TimelineView';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { EmptyState } from '../../components/common/EmptyState';
import { RescheduleModal } from '../../components/booking/RescheduleModal';
import {
  Calendar,
  Clock,
  MapPin,
  Eye,
  CalendarSync,
  XCircle,
  CreditCard,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  TextField,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';

export const MyBookingsPage: React.FC = () => {
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

  // Action Modals
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/bookings/customer/me', {
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

  const handleConfirmCancel = async () => {
    if (!cancelBookingTarget) return;
    setCancelLoading(true);
    try {
      await apiClient.post(`/bookings/${cancelBookingTarget._id}/cancel`, {
        reason: cancelReason.trim() || 'Customer requested cancellation',
      });
      setCancelBookingTarget(null);
      setCancelReason('');
      fetchBookings();
      if (selectedBookingId) {
        openDrawer(selectedBookingId);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track appointments, view real-time status timelines, reschedule, or cancel.
            </p>
          </div>

          {/* Status Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
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
                {st === '' ? 'All Bookings' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <LoadingScreen message="Loading your appointments..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description="You don't have any appointments matching this filter."
            actionLabel="Explore Services"
            onAction={() => (window.location.href = '/')}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const canReschedule = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
              const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
              const priceFormatted = `₹${(booking.price / 100).toFixed(2)}`;

              return (
                <div
                  key={booking._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {booking.bookingNumber}
                      </span>
                      <StatusBadge status={booking.status} />
                      <span className="text-xs text-slate-400 font-medium">
                        Placed on {booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, yyyy') : ''}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {booking.serviceId?.title || 'Service'}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {booking.offeringId?.name} ({booking.offeringId?.durationMinutes} mins) · <strong className="text-indigo-600">{priceFormatted}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <strong>Date:</strong> {booking.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <strong>Time:</strong> {booking.startTime} – {booking.endTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        {booking.vendorId?.businessName}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap md:flex-col items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openDrawer(booking._id)}
                        startIcon={<Eye className="w-3.5 h-3.5" />}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          borderColor: '#cbd5e1',
                          color: '#334155',
                        }}
                      >
                        View Timeline
                      </Button>

                      {canReschedule && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setRescheduleBooking(booking)}
                          startIcon={<CalendarSync className="w-3.5 h-3.5" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            borderRadius: '8px',
                            borderColor: '#818cf8',
                            color: '#4f46e5',
                          }}
                        >
                          Reschedule
                        </Button>
                      )}

                      {canCancel && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => setCancelBookingTarget(booking)}
                          startIcon={<XCircle className="w-3.5 h-3.5" />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            borderRadius: '8px',
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail & Timeline Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedBookingId)}
        onClose={() => setSelectedBookingId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4 } }}
      >
        {drawerLoading || !bookingDetail ? (
          <LoadingScreen message="Loading appointment timeline..." />
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

            {/* Quick Metadata */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-600 border border-slate-200">
              <p><strong>Offering:</strong> {bookingDetail.booking.offeringId?.name}</p>
              <p><strong>Date & Time:</strong> {bookingDetail.booking.date} · {bookingDetail.booking.startTime} - {bookingDetail.booking.endTime}</p>
              <p><strong>Total Price:</strong> ₹{(bookingDetail.booking.price / 100).toFixed(2)} ({bookingDetail.booking.paymentMode})</p>
              <p><strong>Vendor Contact:</strong> {bookingDetail.booking.vendorId?.contactNumber}</p>
              {bookingDetail.booking.cancellationReason && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-rose-700 font-medium">
                  <strong>Cancellation Reason:</strong> {bookingDetail.booking.cancellationReason}
                </div>
              )}
            </div>

            {/* Payment Record Info */}
            {bookingDetail.payment && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Payment Status</span>
                  <StatusBadge status={bookingDetail.payment.status} size="small" />
                </div>
                <p className="text-slate-500 font-mono text-[11px]">Ref: {bookingDetail.payment.providerRef}</p>
                {bookingDetail.payment.refunds && bookingDetail.payment.refunds.length > 0 && (
                  <div className="bg-emerald-50 text-emerald-800 p-2 rounded text-[11px] mt-2">
                    <strong>Refund Issued:</strong> ₹{(bookingDetail.payment.refunds[0].amount / 100).toFixed(2)} ({bookingDetail.payment.refunds[0].reason})
                  </div>
                )}
              </div>
            )}

            {/* Vertical Audit Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Lifecycle Timeline History
              </h3>
              <TimelineView items={bookingDetail.timeline} />
            </div>
          </div>
        )}
      </Drawer>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <RescheduleModal
          open={Boolean(rescheduleBooking)}
          onClose={() => setRescheduleBooking(null)}
          booking={rescheduleBooking}
          onSuccess={() => {
            fetchBookings();
            setRescheduleBooking(null);
          }}
        />
      )}

      {/* Cancellation Dialog */}
      <Dialog open={Boolean(cancelBookingTarget)} onClose={() => setCancelBookingTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-900">Cancel Appointment</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel appointment <strong>{cancelBookingTarget?.bookingNumber}</strong>?
          </p>
          <TextField
            label="Reason for Cancellation"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please specify a reason..."
          />
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-100">
          <Button onClick={() => setCancelBookingTarget(null)} color="inherit" sx={{ textTransform: 'none' }}>
            Keep Appointment
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelLoading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
