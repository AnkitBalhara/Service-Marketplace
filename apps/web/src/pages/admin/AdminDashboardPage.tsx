import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import {
  Users,
  Calendar,
  Banknote,
  AlertOctagon,
  Shield,
  Layers,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get('/admin/metrics');
        setMetrics(data.data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return <LoadingScreen message="Aggregating platform metrics..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Governance Dashboard (M8)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Marketplace health metrics, vendor verification queue, cross-vendor booking audits, and data-driven RBAC.
          </p>
        </div>

        {/* Metrics KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Pending Applications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Vendors</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{metrics?.pendingVendors ?? 0}</span>
              <span className="text-xs text-amber-600 font-semibold">Awaiting review</span>
            </div>
            <Link
              to="/admin/vendors"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1"
            >
              Review queue →
            </Link>
          </div>

          {/* Card 2: Bookings Today */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bookings Today</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{metrics?.bookingsToday ?? 0}</span>
              <span className="text-xs text-slate-500">({metrics?.totalBookings ?? 0} all-time)</span>
            </div>
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1"
            >
              View cross-vendor list →
            </Link>
          </div>

          {/* Card 3: Revenue Collected */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Collected</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block">
                {metrics?.revenueCollectedFormatted || '₹0.00'}
              </span>
              <span className="text-[11px] text-slate-500">Settled via Mock / Cash</span>
            </div>
          </div>

          {/* Card 4: Failed Payments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed Payments</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{metrics?.failedPayments ?? 0}</span>
              <span className="text-xs text-rose-600 font-semibold">Slot safely released</span>
            </div>
            <span className="text-[11px] text-slate-400 block pt-1">Zero orphaned reservations</span>
          </div>
        </div>

        {/* Administration Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/admin/vendors"
            className="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Vendor Onboarding</h3>
              <p className="text-xs text-slate-500">
                Review applicant documents, verify business credentials, approve or reject with mandatory reasons.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              Manage Applications <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/bookings"
            className="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Cross-Vendor Bookings</h3>
              <p className="text-xs text-slate-500">
                Cross-marketplace appointment ledger with status filtering and administrative force-cancellation.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              Audit Bookings <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/roles"
            className="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Roles & Permissions (RBAC)</h3>
              <p className="text-xs text-slate-500">
                Data-driven permission matrix. Create custom roles, toggle slug checkboxes, and assign sub-admins.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              Configure Roles <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/categories"
            className="p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Category Hierarchy</h3>
              <p className="text-xs text-slate-500">
                2-level category taxonomy manager. Create root sectors and nested subcategories.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              Manage Hierarchy <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
