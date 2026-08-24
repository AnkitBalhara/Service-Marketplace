import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Service } from '../../types';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export const VendorAvailabilityPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [rules, setRules] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string; capacity: number }>
  >([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Exception Dialog State
  const [exceptionModalOpen, setExceptionModalOpen] = useState<boolean>(false);
  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    isClosed: true,
    reason: '',
  });

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/vendor/services');
      const list = data.data || [];
      setServices(list);
      if (list.length > 0 && !selectedServiceId) {
        setSelectedServiceId(list[0]._id);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchRulesAndExceptions = useCallback(async (serviceId: string) => {
    try {
      const [rulesRes, exceptionsRes] = await Promise.all([
        apiClient.get(`/vendor/services/${serviceId}/availability`),
        apiClient.get(`/vendor/services/${serviceId}/exceptions`),
      ]);
      setRules(rulesRes.data.data || []);
      setExceptions(exceptionsRes.data.data || []);
    } catch {
      setRules([]);
      setExceptions([]);
    }
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchRulesAndExceptions(selectedServiceId);
    }
  }, [selectedServiceId, fetchRulesAndExceptions]);

  const handleAddWindow = (dayOfWeek: number) => {
    setRules([
      ...rules,
      { dayOfWeek, startTime: '09:00', endTime: '17:00', capacity: 2 },
    ]);
  };

  const handleRemoveWindow = (index: number) => {
    const updated = [...rules];
    updated.splice(index, 1);
    setRules(updated);
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleSaveRules = async () => {
    if (!selectedServiceId) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await apiClient.post(`/vendor/services/${selectedServiceId}/availability`, { rules });
      setMessage({ type: 'success', text: 'Weekly availability rules saved successfully!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to save availability rules',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    try {
      await apiClient.post(`/vendor/services/${selectedServiceId}/exceptions`, exceptionForm);
      setExceptionModalOpen(false);
      setExceptionForm({ date: '', isClosed: true, reason: '' });
      fetchRulesAndExceptions(selectedServiceId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add date exception');
    }
  };

  const handleRemoveException = async (exceptionId: string) => {
    if (!selectedServiceId) return;
    try {
      await apiClient.delete(`/vendor/services/${selectedServiceId}/exceptions/${exceptionId}`);
      fetchRulesAndExceptions(selectedServiceId);
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading availability schedules..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Weekly Availability & Date Exceptions (M5)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Derived slot generation rules: open windows, per-slot capacity, and date closures.
            </p>
          </div>

          {/* Service Selector */}
          <div className="w-full sm:w-72">
            <TextField
              select
              label="Select Service"
              fullWidth
              size="small"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              {services.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.title}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {/* Section 1: Weekly Operating Windows Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Standard Weekly Rules</h2>
              <p className="text-xs text-slate-500">
                Define open time windows and simultaneous capacity per slot for each day of the week.
              </p>
            </div>

            <Button
              variant="contained"
              onClick={handleSaveRules}
              disabled={isSaving}
              startIcon={<Save className="w-4 h-4" />}
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Weekly Schedule'}
            </Button>
          </div>

          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayRules = rules
                .map((r, idx) => ({ ...r, originalIndex: idx }))
                .filter((r) => r.dayOfWeek === day.id);

              return (
                <div
                  key={day.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="w-32">
                    <span className="font-bold text-slate-900 text-sm">{day.name}</span>
                    <span className="text-[11px] text-slate-400 block">
                      {dayRules.length === 0 ? 'Closed' : `${dayRules.length} window(s)`}
                    </span>
                  </div>

                  {/* Windows List */}
                  <div className="flex-1 space-y-2">
                    {dayRules.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No working hours configured (Closed)</span>
                    ) : (
                      dayRules.map((rule) => (
                        <div key={rule.originalIndex} className="flex flex-wrap items-center gap-2">
                          <input
                            type="time"
                            value={rule.startTime}
                            onChange={(e) =>
                              handleRuleChange(rule.originalIndex, 'startTime', e.target.value)
                            }
                            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                          />
                          <span className="text-xs text-slate-400">to</span>
                          <input
                            type="time"
                            value={rule.endTime}
                            onChange={(e) =>
                              handleRuleChange(rule.originalIndex, 'endTime', e.target.value)
                            }
                            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                          />

                          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-1">
                            <span className="text-[11px] text-slate-500 font-semibold">Capacity:</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={rule.capacity}
                              onChange={(e) =>
                                handleRuleChange(
                                  rule.originalIndex,
                                  'capacity',
                                  Math.max(1, parseInt(e.target.value, 10) || 1)
                                )
                              }
                              className="text-xs w-12 outline-none font-bold text-indigo-600 text-center"
                            />
                          </div>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveWindow(rule.originalIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleAddWindow(day.id)}
                    startIcon={<Plus className="w-3.5 h-3.5" />}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#4f46e5' }}
                  >
                    Add Window
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Date Exceptions (Holiday Closures & Overrides) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Date Exceptions & Holidays</h2>
              <p className="text-xs text-slate-500">
                Override regular weekly rules for public holidays or one-off closures. Normal hours resume once removed.
              </p>
            </div>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setExceptionModalOpen(true)}
              startIcon={<Plus className="w-3.5 h-3.5" />}
              sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
            >
              Add Date Closure
            </Button>
          </div>

          {exceptions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No date exceptions or holiday closures active.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exceptions.map((exc) => (
                <div
                  key={exc._id}
                  className="p-4 border border-rose-200 bg-rose-50/50 rounded-xl flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      <span>{exc.date}</span>
                    </div>
                    <p className="text-[11px] text-rose-700 font-semibold">
                      {exc.isClosed ? 'Closed All Day' : 'Custom Hours'}
                    </p>
                    {exc.reason && (
                      <p className="text-[11px] text-slate-600 italic">"{exc.reason}"</p>
                    )}
                  </div>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveException(exc._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Date Exception Dialog */}
      <Dialog open={exceptionModalOpen} onClose={() => setExceptionModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddException}>
          <DialogTitle className="font-bold text-slate-900">Add Date Closure / Override</DialogTitle>
          <DialogContent className="space-y-4 pt-3">
            <TextField
              label="Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={exceptionForm.date}
              onChange={(e) => setExceptionForm({ ...exceptionForm, date: e.target.value })}
              required
            />

            <FormControlLabel
              control={
                <Switch
                  checked={exceptionForm.isClosed}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, isClosed: e.target.checked })}
                  color="primary"
                />
              }
              label={<span className="text-xs font-medium text-slate-700">Close Service on this Date</span>}
            />

            <TextField
              label="Reason (e.g. National Holiday, Renovation)"
              fullWidth
              size="small"
              value={exceptionForm.reason}
              onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
              placeholder="e.g. Public Holiday, Deep Maintenance..."
            />
          </DialogContent>
          <DialogActions className="p-4 border-t border-slate-100">
            <Button onClick={() => setExceptionModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#4f46e5', textTransform: 'none', fontWeight: 600 }}
            >
              Add Exception
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
