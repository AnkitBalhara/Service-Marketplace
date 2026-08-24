import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Service, Offering, Category } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Layers,
  Plus,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';

export const VendorServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create/Edit Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    categoryId: '',
    description: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    freeCancellationWindowHours: 24,
  });

  // Create Offering Modal State
  const [offeringModalOpen, setOfferingModalOpen] = useState<boolean>(false);
  const [targetServiceId, setTargetServiceId] = useState<string | null>(null);
  const [offeringForm, setOfferingForm] = useState({
    name: '',
    description: '',
    durationMinutes: 45,
    priceRupees: 400,
    isActive: true,
  });

  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchServicesAndCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        apiClient.get('/vendor/services'),
        apiClient.get('/catalogue/categories'),
      ]);
      setServices(srvRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicesAndCategories();
  }, [fetchServicesAndCategories]);

  const handleOpenCreateService = () => {
    setEditingService(null);
    setServiceForm({
      title: '',
      categoryId: categories.length > 0 ? (categories[0].children?.[0]?._id || categories[0]._id) : '',
      description: '',
      status: 'DRAFT',
      freeCancellationWindowHours: 24,
    });
    setModalError(null);
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      if (editingService) {
        await apiClient.patch(`/vendor/services/${editingService._id}`, serviceForm);
      } else {
        await apiClient.post('/vendor/services', serviceForm);
      }
      setServiceModalOpen(false);
      fetchServicesAndCategories();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to save service');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenAddOffering = (serviceId: string) => {
    setTargetServiceId(serviceId);
    setOfferingForm({
      name: '',
      description: '',
      durationMinutes: 45,
      priceRupees: 400,
      isActive: true,
    });
    setModalError(null);
    setOfferingModalOpen(true);
  };

  const handleSaveOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetServiceId) return;

    setModalSubmitting(true);
    setModalError(null);

    try {
      await apiClient.post(`/vendor/services/${targetServiceId}/offerings`, {
        name: offeringForm.name,
        description: offeringForm.description,
        durationMinutes: Number(offeringForm.durationMinutes),
        price: Math.round(Number(offeringForm.priceRupees) * 100), // convert to minor units
        currency: 'INR',
        isActive: offeringForm.isActive,
      });
      setOfferingModalOpen(false);
      fetchServicesAndCategories();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to add offering');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Services & Offerings</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your service catalogue, tiered offerings, durations, and pricing in integer minor units.
            </p>
          </div>

          <Button
            variant="contained"
            onClick={handleOpenCreateService}
            startIcon={<Plus className="w-4 h-4" />}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Create New Service
          </Button>
        </div>

        {/* Services List */}
        {isLoading ? (
          <LoadingScreen message="Loading your service catalogue..." />
        ) : services.length === 0 ? (
          <EmptyState
            title="No Services Created Yet"
            description="Create your first service listing and add bookable offerings to start receiving appointments."
            actionLabel="Create Service"
            onAction={handleOpenCreateService}
          />
        ) : (
          <div className="space-y-6">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
              >
                {/* Service Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg">{service.title}</h3>
                      <StatusBadge status={service.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Category: {service.category?.name || 'Category'} · Free Cancellation Window: {service.freeCancellationWindowHours}h
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenAddOffering(service._id)}
                      startIcon={<Plus className="w-3.5 h-3.5" />}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '8px' }}
                    >
                      Add Offering
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>

                {/* Offerings Table / Grid */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Offerings ({service.offerings?.length || 0})
                  </span>

                  {!service.offerings || service.offerings.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      No offerings added yet. Each service must have at least one offering to generate bookable slots.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {service.offerings.map((offering) => (
                        <div
                          key={offering._id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-900 text-xs">{offering.name}</span>
                            <span className="text-xs font-extrabold text-indigo-600">
                              ₹{(offering.price / 100).toFixed(2)}
                            </span>
                          </div>

                          {offering.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">{offering.description}</p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {offering.durationMinutes} mins slot
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                offering.isActive ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-200'
                              }`}
                            >
                              {offering.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Service Dialog */}
      <Dialog open={serviceModalOpen} onClose={() => setServiceModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveService}>
          <DialogTitle className="font-bold text-slate-900">
            {editingService ? 'Edit Service' : 'Create New Service Listing'}
          </DialogTitle>
          <DialogContent className="space-y-4 pt-3">
            {modalError && <Alert severity="error">{modalError}</Alert>}

            <TextField
              label="Service Title"
              fullWidth
              size="small"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              required
            />

            <TextField
              select
              label="Category"
              fullWidth
              size="small"
              value={serviceForm.categoryId}
              onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
              required
            >
              {categories.map((root) => [
                <MenuItem key={root._id} value={root._id} className="font-bold">
                  {root.name}
                </MenuItem>,
                ...(root.children || []).map((sub) => (
                  <MenuItem key={sub._id} value={sub._id} className="pl-6 text-xs">
                    ↳ {sub.name}
                  </MenuItem>
                )),
              ])}
            </TextField>

            <TextField
              label="Description"
              fullWidth
              size="small"
              multiline
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              required
            />

            <TextField
              select
              label="Initial Status"
              fullWidth
              size="small"
              value={serviceForm.status}
              onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as any })}
            >
              <MenuItem value="DRAFT">DRAFT (Hidden from Public)</MenuItem>
              <MenuItem value="PUBLISHED">PUBLISHED (Visible in Catalogue)</MenuItem>
            </TextField>

            <TextField
              label="Free Cancellation Window (Hours)"
              type="number"
              fullWidth
              size="small"
              value={serviceForm.freeCancellationWindowHours}
              onChange={(e) => setServiceForm({ ...serviceForm, freeCancellationWindowHours: Number(e.target.value) })}
              helperText="Number of hours prior to appointment where customer receives full refund on cancellation"
            />
          </DialogContent>
          <DialogActions className="p-4 border-t border-slate-100">
            <Button onClick={() => setServiceModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={modalSubmitting}
              sx={{ backgroundColor: '#4f46e5', textTransform: 'none', fontWeight: 600 }}
            >
              {modalSubmitting ? 'Saving...' : 'Save Service'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Offering Dialog */}
      <Dialog open={offeringModalOpen} onClose={() => setOfferingModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSaveOffering}>
          <DialogTitle className="font-bold text-slate-900">Add Service Offering</DialogTitle>
          <DialogContent className="space-y-4 pt-3">
            {modalError && <Alert severity="error">{modalError}</Alert>}

            <TextField
              label="Offering Name (e.g. Master Haircut)"
              fullWidth
              size="small"
              value={offeringForm.name}
              onChange={(e) => setOfferingForm({ ...offeringForm, name: e.target.value })}
              required
            />

            <TextField
              label="Offering Description (Optional)"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={offeringForm.description}
              onChange={(e) => setOfferingForm({ ...offeringForm, description: e.target.value })}
            />

            <TextField
              label="Duration in Minutes"
              type="number"
              fullWidth
              size="small"
              value={offeringForm.durationMinutes}
              onChange={(e) => setOfferingForm({ ...offeringForm, durationMinutes: Number(e.target.value) })}
              helperText="This duration partitions your open hours into discrete bookable slots."
              required
            />

            <TextField
              label="Price (₹ INR)"
              type="number"
              fullWidth
              size="small"
              value={offeringForm.priceRupees}
              onChange={(e) => setOfferingForm({ ...offeringForm, priceRupees: Number(e.target.value) })}
              helperText="Stored on backend in integer minor units (paise) to prevent float inaccuracies."
              required
            />
          </DialogContent>
          <DialogActions className="p-4 border-t border-slate-100">
            <Button onClick={() => setOfferingModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={modalSubmitting}
              sx={{ backgroundColor: '#4f46e5', textTransform: 'none', fontWeight: 600 }}
            >
              {modalSubmitting ? 'Adding...' : 'Add Offering'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
