import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Service, Offering, TimeSlot } from '../../types';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { SlotPicker } from '../../components/booking/SlotPicker';
import { CheckoutModal } from '../../components/booking/CheckoutModal';
import {
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button, Chip } from '@mui/material';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: TimeSlot } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get(`/catalogue/services/${id}`);
        const serviceData: Service = data.data;
        setService(serviceData);
        if (serviceData.offerings && serviceData.offerings.length > 0) {
          setSelectedOffering(serviceData.offerings[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Service not found or unpublished');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchService();
  }, [id]);

  if (isLoading) {
    return <LoadingScreen message="Loading service details and offerings..." />;
  }

  if (error || !service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Service Unavailable</h2>
          <p className="text-sm text-rose-700 mt-1">{error || 'This service does not exist or is not published.'}</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outlined" color="primary" sx={{ textTransform: 'none' }}>
              ← Return to Catalogue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const defaultImage =
    service.images && service.images.length > 0
      ? service.images[0]
      : 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="w-4 h-4" />
          Back to Catalogue
        </Link>

        {/* Main Grid: Left Service Info, Right Booking Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Service Details & Offerings */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-64 sm:h-80 w-full bg-slate-100">
                <img src={defaultImage} alt={service.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                  <Chip
                    label={service.category?.name || 'Service'}
                    sx={{ backgroundColor: '#ffffff', fontWeight: 700, color: '#4f46e5', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                  />
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {service.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {service.vendor?.businessName} ({service.vendor?.address})
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {service.vendor?.contactNumber}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                  {service.description}
                </p>

                {/* Free cancellation guarantee badge */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-800 font-medium">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Flexible Cancellation: Full refund available if cancelled up to {service.freeCancellationWindowHours || 24} hours before appointment.
                  </span>
                </div>
              </div>
            </div>

            {/* Select Offering Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                1. Select Service Offering
              </h2>

              {!service.offerings || service.offerings.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No offerings available for this service.</p>
              ) : (
                <div className="space-y-3">
                  {service.offerings.map((offering) => {
                    const isSelected = selectedOffering?._id === offering._id;
                    const priceFormatted = `₹${(offering.price / 100).toFixed(2)}`;

                    return (
                      <div
                        key={offering._id}
                        onClick={() => {
                          setSelectedOffering(offering);
                          setSelectedSlot(null); // Reset slot picker on duration change
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                            <span className="font-bold text-slate-900 text-sm">{offering.name}</span>
                          </div>
                          {offering.description && (
                            <p className="text-xs text-slate-500">{offering.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Duration: {offering.durationMinutes} mins</span>
                          </div>
                        </div>

                        <div className="text-right pl-4 shrink-0">
                          <span className="text-base font-extrabold text-indigo-600 block">{priceFormatted}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Slot Picker & Booking Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Step 2: Slot Picker Component */}
              {selectedOffering && (
                <SlotPicker
                  serviceId={service._id || service.id || ''}
                  offeringId={selectedOffering._id}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(date, slot) => setSelectedSlot({ date, slot })}
                />
              )}

              {/* Checkout CTA Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  <span>Selected Appointment</span>
                  <span className="text-indigo-600">
                    {selectedOffering ? `₹${(selectedOffering.price / 100).toFixed(2)}` : '—'}
                  </span>
                </div>

                {selectedSlot && selectedOffering ? (
                  <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p><strong>Offering:</strong> {selectedOffering.name} ({selectedOffering.durationMinutes}m)</p>
                    <p><strong>Date:</strong> {selectedSlot.date}</p>
                    <p><strong>Slot:</strong> {selectedSlot.slot.startTime} – {selectedSlot.slot.endTime}</p>
                    <p><strong>Capacity Remaining:</strong> {selectedSlot.slot.remainingCapacity} seat(s)</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Please pick a date and time slot above to continue.</p>
                )}

                {isAuthenticated ? (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!selectedSlot || !selectedOffering}
                    onClick={() => setCheckoutOpen(true)}
                    sx={{
                      backgroundColor: '#4f46e5',
                      '&:hover': { backgroundColor: '#4338ca' },
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 1.5,
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    }}
                  >
                    Proceed to Confirm & Pay →
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700 font-medium text-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Please log in or use quick-switch to book this appointment.
                    </p>
                    <Link to="/login" className="block">
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: '#4f46e5',
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                      >
                        Log In to Book
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal Dialog */}
      {selectedOffering && selectedSlot && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          service={service}
          offering={selectedOffering}
          selectedSlot={selectedSlot}
        />
      )}
    </div>
  );
};
