import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Service, Category } from '../../types';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@mui/material';

export const CataloguePage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load categories tree
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/catalogue/categories');
        setCategories(data.data || []);
      } catch {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/catalogue/services', {
        params: {
          page,
          limit: 9,
          query: searchQuery.trim() || undefined,
          categoryId: selectedCategory || undefined,
        },
      });
      setServices(data.data || []);
      if (data.meta?.pagination) {
        setPagination(data.meta.pagination);
      }
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(selectedCategory === catId ? '' : catId);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-12 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Verified Local Services & Instant Appointments
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Book expert services in seconds.
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/80 leading-relaxed">
              Explore salons, wellness spas, and home professionals. Real-time slot derivation, instant booking confirmation, or pay at service.
            </p>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search haircuts, spas, cleaning..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: '#6366f1',
                  '&:hover': { backgroundColor: '#4f46e5' },
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.2,
                  px: 3,
                }}
              >
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Filter by Category
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === ''
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>

            {categories.map((root) => (
              <React.Fragment key={root._id}>
                <button
                  type="button"
                  onClick={() => handleCategoryClick(root._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory === root._id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {root.name}
                </button>
                {root.children?.map((sub) => (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => handleCategoryClick(sub._id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                      selectedCategory === sub._id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ↳ {sub.name}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Published Services
              <span className="text-xs font-medium text-slate-500 ml-2">
                ({pagination.total} found)
              </span>
            </h2>
          </div>

          {isLoading ? (
            <LoadingScreen message="Loading available services..." />
          ) : services.length === 0 ? (
            <EmptyState
              title="No Services Found"
              description="There are currently no published services matching your search or category filter."
              actionLabel="Clear Filters"
              onAction={() => {
                setSelectedCategory('');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const lowestPrice = service.offerings?.length
                  ? Math.min(...service.offerings.map((o) => o.price))
                  : 0;
                const minDuration = service.offerings?.length
                  ? Math.min(...service.offerings.map((o) => o.durationMinutes))
                  : 30;

                const thumbnail =
                  service.images && service.images.length > 0
                    ? service.images[0]
                    : 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={service.id || service._id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={thumbnail}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 shadow-sm">
                        {service.category?.name || 'Service'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{service.vendor?.businessName}</span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {service.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      {/* Offering metadata & CTA */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Starting from
                          </span>
                          <span className="text-base font-extrabold text-slate-900">
                            ₹{(lowestPrice / 100).toFixed(0)}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-500 flex items-center gap-1 mb-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>From {minDuration}m</span>
                          </div>
                          <Link to={`/services/${service.id || service._id}`}>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{
                                backgroundColor: '#4f46e5',
                                '&:hover': { backgroundColor: '#4338ca' },
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Book Slot →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Server-Side Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total items)
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
      </div>
    </div>
  );
};
