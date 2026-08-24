import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Category } from '../../types';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Layers,
  Plus,
  Edit,
  FolderTree,
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
  Alert,
} from '@mui/material';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Category Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: null as string | null,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/catalogue/categories');
      setCategories(data.data || []);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = (parentId: string | null = null) => {
    setEditingCategory(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      parentId,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingCategory) {
        await apiClient.patch(`/admin/categories/${editingCategory._id}`, form);
      } else {
        await apiClient.post('/admin/categories', form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Catalogue Categories (M4 Hierarchy)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Two-level category hierarchy: top-level service sectors and nested specialized offerings.
            </p>
          </div>

          <Button
            variant="contained"
            onClick={() => handleOpenCreate(null)}
            startIcon={<Plus className="w-4 h-4" />}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Create Root Category
          </Button>
        </div>

        {/* Categories Tree View */}
        {isLoading ? (
          <LoadingScreen message="Loading category tree..." />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No Categories Found"
            description="Create your first root category to organize marketplace services."
            actionLabel="Create Root Category"
            onAction={() => handleOpenCreate(null)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((root) => (
              <div
                key={root._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Root Header */}
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        <FolderTree className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{root.name}</h3>
                        <span className="text-xs text-slate-400 font-mono">slug: {root.slug}</span>
                      </div>
                    </div>

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenCreate(root._id)}
                      startIcon={<Plus className="w-3 h-3" />}
                      sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: '6px' }}
                    >
                      Add Subcategory
                    </Button>
                  </div>

                  {root.description && (
                    <p className="text-xs text-slate-600">{root.description}</p>
                  )}

                  {/* Nested Subcategories */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Subcategories ({root.children?.length || 0})
                    </span>

                    {!root.children || root.children.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No subcategories created yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {root.children.map((sub) => (
                          <div
                            key={sub._id}
                            className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-semibold text-slate-800">{sub.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({sub.slug})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle className="font-bold text-slate-900">
            {form.parentId ? 'Create Nested Subcategory' : 'Create Root Category'}
          </DialogTitle>
          <DialogContent className="space-y-4 pt-2">
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Category Name"
              fullWidth
              size="small"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                setForm({ ...form, name, slug });
              }}
              required
            />

            <TextField
              label="URL Slug"
              fullWidth
              size="small"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              helperText="Unique URL identifier for search & filtering"
              required
            />

            <TextField
              label="Description (Optional)"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions className="p-4 border-t border-slate-100">
            <Button onClick={() => setModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: '#4f46e5', textTransform: 'none', fontWeight: 600 }}
            >
              {submitting ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
