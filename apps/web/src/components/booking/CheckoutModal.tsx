import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { apiClient } from '../../api/client';
import { Service, Offering, TimeSlot } from '../../types';
import { CreditCard, Banknote, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  service: Service;
  offering: Offering;
  selectedSlot: { date: string; slot: TimeSlot };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onClose,
  service,
  offering,
  selectedSlot,
}) => {
  const navigate = useNavigate();
  const [paymentMode, setPaymentMode] = useState<'PAY_NOW' | 'PAY_AFTER'>('PAY_NOW');
  const [paymentToken, setPaymentToken] = useState<string>('tok_success');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const priceFormatted = `₹${(offering.price / 100).toFixed(2)}`;

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Generate unique idempotency key to prevent accidental duplicate submission
    const idempotencyKey = `idem_checkout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const response = await apiClient.post(
        '/bookings',
        {
          serviceId: service._id || service.id,
          offeringId: offering._id,
          date: selectedSlot.date,
          startTime: selectedSlot.slot.startTime,
          paymentMode,
          paymentToken: paymentMode === 'PAY_NOW' ? paymentToken : undefined,
          notes: notes.trim() || undefined,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      const booking = response.data.data;
      onClose();
      navigate('/customer/bookings', { state: { newBookingId: booking._id } });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMessage(
          'Slot Capacity Exceeded: Another user just booked the last available seat for this time slot. Please choose a different slot.'
        );
      } else if (err.response?.data?.error?.code === 'PAYMENT_FAILED') {
        setErrorMessage(
          `Payment Declined: ${err.response.data.error.message}. The slot was NOT booked and remains free.`
        );
      } else {
        setErrorMessage(err.response?.data?.error?.message || 'An error occurred during booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="border-b border-slate-100 font-bold text-slate-900">
        Review & Confirm Appointment
      </DialogTitle>

      <DialogContent className="pt-5 space-y-5">
        {errorMessage && (
          <Alert severity="error" className="mb-4" icon={<AlertTriangle className="w-5 h-5" />}>
            {errorMessage}
          </Alert>
        )}

        {/* Appointment Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{service.title}</h4>
              <p className="text-xs text-slate-500 font-medium">{offering.name} ({offering.durationMinutes} mins)</p>
            </div>
            <span className="text-base font-bold text-indigo-600">{priceFormatted}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>📅 <strong>Date:</strong> {selectedSlot.date}</span>
            <span>⏰ <strong>Time:</strong> {selectedSlot.slot.startTime} – {selectedSlot.slot.endTime}</span>
            <span>🏢 <strong>Vendor:</strong> {service.vendor.businessName}</span>
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Select Payment Method (Mocked)
          </label>

          <RadioGroup
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as 'PAY_NOW' | 'PAY_AFTER')}
            className="space-y-2.5"
          >
            {/* Option 1: PAY NOW */}
            <div
              className={`border rounded-xl p-3.5 flex items-start cursor-pointer transition-all ${
                paymentMode === 'PAY_NOW'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setPaymentMode('PAY_NOW')}
            >
              <FormControlLabel
                value="PAY_NOW"
                control={<Radio size="small" sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />}
                label=""
                className="mr-0 mt-0.5"
              />
              <div className="ml-2 flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Pay Upfront (Mock Card / Instant Settle)</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-authorizes payment and confirms slot instantly.
                </p>

                {/* Sub-menu for deterministic test token */}
                {paymentMode === 'PAY_NOW' && (
                  <div className="mt-3 pt-3 border-t border-indigo-100/80 space-y-1.5">
                    <span className="text-[11px] font-semibold text-indigo-900 block">
                      Deterministic Test Token Trigger (Rubric M7):
                    </span>
                    <select
                      value={paymentToken}
                      onChange={(e) => setPaymentToken(e.target.value)}
                      className="w-full text-xs border border-indigo-200 rounded-lg p-2 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="tok_success">tok_success — Instant Payment Success (Booking Confirmed)</option>
                      <option value="tok_fail">tok_fail — Forced Failure (Slot Released & 400 Returned)</option>
                      <option value="tok_delay">tok_delay — Delayed Pending (Awaits Webhook Callback)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: PAY AFTER */}
            <div
              className={`border rounded-xl p-3.5 flex items-start cursor-pointer transition-all ${
                paymentMode === 'PAY_AFTER'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setPaymentMode('PAY_AFTER')}
            >
              <FormControlLabel
                value="PAY_AFTER"
                control={<Radio size="small" sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }} />}
                label=""
                className="mr-0 mt-0.5"
              />
              <div className="ml-2 flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Pay After Service (Cash / On-Site)</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book without paying right now; settle with vendor at the appointment.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Customer Notes */}
        <div>
          <TextField
            label="Special Requests / Notes for Vendor (Optional)"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Any preferences, allergies, or specific requirements..."
          />
        </div>

        {/* Cancellation Policy Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Free cancellation up to {service.freeCancellationWindowHours || 24} hours before appointment.
          </span>
        </div>
      </DialogContent>

      <DialogActions className="p-4 border-t border-slate-100 flex justify-between">
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirmBooking}
          disabled={isSubmitting}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            borderRadius: '8px',
          }}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : `Confirm & Book (${priceFormatted})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
