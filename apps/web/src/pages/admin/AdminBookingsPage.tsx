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
  Search,
  AlertTriangle,
  Eye,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Detail Drawer
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<{
    booking: Booking;
    timeline: BookingTimelineItem[];
    payment?: PaymentRecord;
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);

  // Force Cancel Modal
  const [forceCancelTarget, setForceCancelTarget] = useState<Booking | null>(null);
  const [forceCancelReason, setForceCancelReason] = useState<string>('');
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/admin/bookings', {
        params: {
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
        },
      });
      setBookings(data.data || []);
      if (data.meta?.pagination) {
        setPagination(data.meta.pagination);
      }
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

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

  const handleForceCancel = async () => {
    if (!forceCancelTarget) return;
    if (!forceCancelReason.trim()) {
      setCancelError('Admin cancellation reason is required.');
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    try {
      await apiClient.post(`/admin/bookings/${forceCancelTarget._id}/force-cancel`, {
        reason: forceCancelReason.trim(),
      });
      setForceCancelTarget(null);
      setForceCancelReason('');
      fetchBookings();
      if (selectedBookingId) openDrawer(selectedBookingId);
    } catch (err: any) {
      setCancelError(err.response?.data?.error?.message || 'Failed to force cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Cross-Vendor Bookings Master (M8)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cross-marketplace booking audit, search by booking number, and administrative force-cancellations with refunds.
          </p>
        </div>

        {/* Filters & Search Row */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-2 w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search booking number (e.g. BK-2026)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>

          <div className="w-full sm:w-48">
            <TextField
              select
              label="Filter Status"
              fullWidth
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PENDING">PENDING</MenuItem>
              <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
              <MenuItem value="REJECTED">REJECTED</MenuItem>
              <MenuItem value="NO_SHOW">NO_SHOW</MenuItem>
            </TextField>
          </div>
        </div>

        {/* Bookings Table */}
        {isLoading ? (
          <LoadingScreen message="Loading bookings ledger..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description="No bookings match your current search or status filter."
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Booking #</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Vendor & Service</th>
                    <th className="px-5 py-3.5">Slot Date/Time</th>
                    <th className="px-5 py-3.5">Price & Mode</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-indigo-700">{b.bookingNumber}</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">{b.customerId?.name || 'Customer'}</span>
                        <span className="text-[11px] text-slate-400">{b.customerId?.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800 block">{b.vendorId?.businessName}</span>
                        <span className="text-[11px] text-slate-500">{b.serviceId?.title} ({b.offeringId?.name})</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800 block">{b.date}</span>
                        <span className="text-[11px] text-slate-500">{b.startTime} - {b.endTime}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">₹{(b.price / 100).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{b.paymentMode}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={b.status} size="small" />
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openDrawer(b._id)}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.5, borderRadius: '6px' }}
                        >
                          Audit
                        </Button>

                        {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setForceCancelTarget(b);
                              setForceCancelReason('');
                              setCancelError(null);
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.5, borderRadius: '6px' }}
                          >
                            Force Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    startIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px' }}
                  >
                    Previous
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    endIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px' }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedBookingId)}
        onClose={() => setSelectedBookingId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 4 } }}
      >
        {drawerLoading || !bookingDetail ? (
          <LoadingScreen message="Loading booking timeline..." />
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
              <p><strong>Customer:</strong> {bookingDetail.booking.customerId?.name} ({bookingDetail.booking.customerId?.email})</p>
              <p><strong>Vendor:</strong> {bookingDetail.booking.vendorId?.businessName} ({bookingDetail.booking.vendorId?.contactNumber})</p>
              <p><strong>Date & Time:</strong> {bookingDetail.booking.date} · {bookingDetail.booking.startTime} - {bookingDetail.booking.endTime}</p>
              <p><strong>Price:</strong> ₹{(bookingDetail.booking.price / 100).toFixed(2)} ({bookingDetail.booking.paymentMode})</p>
              {bookingDetail.booking.cancellationReason && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-rose-700 font-medium">
                  <strong>Cancellation Reason:</strong> {bookingDetail.booking.cancellationReason}
                </div>
              )}
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

      {/* Force Cancel Dialog */}
      <Dialog open={Boolean(forceCancelTarget)} onClose={() => setForceCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="font-bold text-slate-900">Administrative Force Cancel</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {cancelError && <Alert severity="error">{cancelError}</Alert>}
          <p className="text-xs text-slate-600">
            Force cancelling <strong>{forceCancelTarget?.bookingNumber}</strong> will immediately release the reserved slot capacity and trigger a full refund if paid.
          </p>
          <TextField
            label="Mandatory Reason for Force Cancellation"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={forceCancelReason}
            onChange={(e) => setForceCancelReason(e.target.value)}
            placeholder="e.g. Vendor emergency closure, fraud prevention, service suspension..."
            required
          />
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-100">
          <Button onClick={() => setForceCancelTarget(null)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleForceCancel}
            disabled={cancelLoading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {cancelLoading ? 'Cancelling...' : 'Confirm Force Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
