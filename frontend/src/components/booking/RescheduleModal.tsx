import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../api/client';
import { Booking, TimeSlot } from '../../types';
import { SlotPicker } from './SlotPicker';
import { CalendarSync, AlertTriangle } from 'lucide-react';

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  open,
  onClose,
  booking,
  onSuccess,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: TimeSlot } | null>(null);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReschedule = async () => {
    if (!selectedSlot) {
      setErrorMessage('Please pick a new date and time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.post(`/bookings/${booking._id}/reschedule`, {
        date: selectedSlot.date,
        startTime: selectedSlot.slot.startTime,
        reason: reason.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message || 'Failed to reschedule appointment. The slot may be full.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle className="border-b border-slate-100 font-bold text-slate-900 flex items-center gap-2">
        <CalendarSync className="w-5 h-5 text-indigo-600" />
        <span>Reschedule Appointment ({booking.bookingNumber})</span>
      </DialogTitle>

      <DialogContent className="pt-4 space-y-4">
        {errorMessage && (
          <Alert severity="error" icon={<AlertTriangle className="w-5 h-5" />}>
            {errorMessage}
          </Alert>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
          Current Scheduled Time: <strong>{booking.date} at {booking.startTime} – {booking.endTime}</strong> ({booking.offeringId?.name || 'Service'})
        </div>

        <SlotPicker
          serviceId={booking.serviceId?._id || (booking.serviceId as any)}
          offeringId={booking.offeringId?._id || (booking.offeringId as any)}
          selectedSlot={selectedSlot}
          onSelectSlot={(date, slot) => setSelectedSlot({ date, slot })}
        />

        <div>
          <TextField
            label="Reason for Rescheduling (Optional)"
            fullWidth
            size="small"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Work conflict, family emergency..."
          />
        </div>
      </DialogContent>

      <DialogActions className="p-4 border-t border-slate-100 flex justify-between">
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleReschedule}
          disabled={isSubmitting || !selectedSlot}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            borderRadius: '8px',
          }}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm New Slot'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
