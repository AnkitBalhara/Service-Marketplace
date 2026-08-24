import React from 'react';
import { Sparkles, Shield, Lock, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>MarketPulse</span>
            </div>
            <p className="max-w-sm text-slate-400 text-xs leading-relaxed">
              A production-ready three-sided services marketplace with data-driven dynamic RBAC,
              derived real-time slot generation, atomic database concurrency locking, and mock payment settlement.
            </p>
          </div>

          {/* Architecture Highlights */}
          <div className="space-y-2">
            <span className="text-white font-semibold block text-xs uppercase tracking-wider">
              Architecture & Integrity
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>MongoDB Atomic Concurrency Locks</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Granular Permission Slugs (RBAC)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Derived Dynamic Time Slots</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deterministic Mock Payments</span>
              </li>
            </ul>
          </div>

          {/* Test Personas */}
          <div className="space-y-2">
            <span className="text-white font-semibold block text-xs uppercase tracking-wider">
              Reviewer Quick Links
            </span>
            <p className="text-[11px] text-slate-400">
              Use the top <strong>⚡ Switch Persona</strong> button to test Super Admin, Sub-Admin, Approved Vendor, Pending Vendor, Rejected Vendor, or Customers.
            </p>
            <div className="pt-1">
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                OpenAPI / Swagger Documentation ↗
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px]">
          <p>© {new Date().getFullYear()} MarketPulse Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Server Timezone: Asia/Kolkata (UTC+5:30)</span>
            <span>·</span>
            <span>Money in Integer Minor Units</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
