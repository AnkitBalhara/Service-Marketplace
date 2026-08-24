import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { DerivedDaySlots, TimeSlot } from '../../types';
import { format, addDays } from 'date-fns';
import { Calendar, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { CircularProgress } from '@mui/material';

interface SlotPickerProps {
  serviceId: string;
  offeringId: string;
  onSelectSlot: (date: string, slot: TimeSlot) => void;
  selectedSlot: { date: string; slot: TimeSlot } | null;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  serviceId,
  offeringId,
  onSelectSlot,
  selectedSlot,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [daysData, setDaysData] = useState<DerivedDaySlots[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next 10 dates for quick date tabs
  const upcomingDates = Array.from({ length: 10 }).map((_, i) =>
    format(addDays(new Date(), i), 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (!serviceId || !offeringId) return;

    const fetchSlots = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const startDate = upcomingDates[0];
        const endDate = upcomingDates[upcomingDates.length - 1];

        const { data } = await apiClient.get(
          `/availability/services/${serviceId}/slots`,
          {
            params: {
              offeringId,
              startDate,
              endDate,
            },
          }
        );
        setDaysData(data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load available slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [serviceId, offeringId]);

  const currentDayData = daysData.find((d) => d.date === selectedDate);

  const handleNextAvailable = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get(`/availability/services/${serviceId}/next-available`, {
        params: { offeringId },
      });
      if (data.data && data.data.date && data.data.slot) {
        setSelectedDate(data.data.date);
        onSelectSlot(data.data.date, data.data.slot);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-base">Select Date & Time Slot</h3>
        </div>
        <button
          type="button"
          onClick={handleNextAvailable}
          className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Find Soonest Slot
        </button>
      </div>

      {/* Date Carousel / Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {upcomingDates.map((dateStr) => {
          const dateObj = new Date(dateStr + 'T00:00:00');
          const isSelected = selectedDate === dateStr;
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
          const daySlots = daysData.find((d) => d.date === dateStr);
          const isClosed = daySlots?.isClosed;
          const availableCount = daySlots?.slots?.length || 0;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[76px] py-2.5 px-2 rounded-xl border transition-all text-center shrink-0 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-105'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className={`text-[11px] uppercase font-semibold ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                {isToday ? 'Today' : format(dateObj, 'EEE')}
              </span>
              <span className="text-base font-bold my-0.5">{format(dateObj, 'd')}</span>
              <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : isClosed ? 'text-rose-500' : 'text-slate-500'}`}>
                {isClosed ? 'Closed' : `${availableCount} slots`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Slot Grid */}
      <div className="border-t border-slate-100 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
            <span className="ml-3 text-sm text-slate-500">Calculating real-time availability...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : currentDayData?.isClosed ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-center">
            <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
            <p className="text-sm font-semibold">Vendor is Closed on this Date</p>
            <p className="text-xs text-amber-700 mt-1">
              {currentDayData.closureReason || 'No appointments offered on this day.'}
            </p>
          </div>
        ) : !currentDayData?.slots || currentDayData.slots.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium">No open slots remaining for {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMM dd')}</p>
            <p className="text-xs text-slate-400 mt-1">Please choose another date.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500 mb-3 font-medium">
              Available start times for {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM do, yyyy')}:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {currentDayData.slots.map((slot) => {
                const isSelected =
                  selectedSlot?.date === selectedDate &&
                  selectedSlot?.slot.startTime === slot.startTime;

                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => onSelectSlot(selectedDate, slot)}
                    className={`flex flex-col p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-slate-800">
                        {slot.startTime}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          slot.remainingCapacity === 1
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {slot.remainingCapacity} left
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Ends at {slot.endTime}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
